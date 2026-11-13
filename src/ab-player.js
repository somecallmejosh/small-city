// Hear the difference: a raw take against Chase's mix at the same moment in the song.
// Both clips play continuously from the same start time on separate gains; RAW / MIXED only moves
// the gains (15 ms ramp), so switching never restarts or drifts. Levels are matched by RMS so the
// comparison is the mix, not the volume. Audio never autoplays and is not affected by reduced motion.
(() => {
  const RAMP = 0.015;

  function rms(buffer) {
    let sum = 0;
    let count = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i += 16) { sum += data[i] * data[i]; count++; }
    }
    return count ? Math.sqrt(sum / count) : 0;
  }

  function createAB({ context, raw, mixed, source = 'mixed', onEnd = () => {} }) {
    const levels = { raw: rms(raw), mixed: rms(mixed) };
    const target = Math.min(levels.raw || Infinity, levels.mixed || Infinity);
    const trim = {
      raw: levels.raw && Number.isFinite(target) ? target / levels.raw : 1,
      mixed: levels.mixed && Number.isFinite(target) ? target / levels.mixed : 1,
    };
    const gains = {};
    for (const key of ['raw', 'mixed']) {
      gains[key] = context.createGain();
      gains[key].gain.value = key === source ? trim[key] : 0;
      gains[key].connect(context.destination);
    }
    const duration = Math.min(raw.duration, mixed.duration);
    let nodes = null;
    let startedAt = 0;
    let offset = 0;
    let playing = false;

    const position = () => playing ? Math.min(duration, Math.max(offset, offset + context.currentTime - startedAt)) : offset;
    const stop = () => {
      if (!nodes) return;
      for (const node of Object.values(nodes)) { node.onended = null; try { node.stop(); } catch { /* Already stopped. */ } node.disconnect(); }
      nodes = null;
    };
    const controller = {
      trim, duration,
      get playing() { return playing; },
      get source() { return source; },
      position,
      play() {
        if (playing) return;
        if (offset >= duration - 0.05) offset = 0;
        const when = context.currentTime + 0.02;
        nodes = {};
        for (const [key, buffer] of [['raw', raw], ['mixed', mixed]]) {
          const node = context.createBufferSource();
          node.buffer = buffer;
          node.connect(gains[key]);
          node.start(when, offset);
          nodes[key] = node;
        }
        nodes.mixed.onended = () => { if (playing && position() >= duration - 0.05) { controller.pause(); offset = 0; onEnd(); } };
        startedAt = when;
        playing = true;
      },
      pause() {
        if (!playing) return;
        offset = position();
        playing = false;
        stop();
      },
      seek(seconds) {
        const resume = playing;
        if (playing) controller.pause();
        offset = Math.min(Math.max(0, seconds), duration);
        if (resume) controller.play();
      },
      setSource(next) {
        if (next !== 'raw' && next !== 'mixed') return;
        source = next;
        const t = context.currentTime;
        for (const key of ['raw', 'mixed']) {
          const g = gains[key].gain;
          g.cancelScheduledValues(t);
          g.setValueAtTime(g.value, t);
          g.linearRampToValueAtTime(key === source ? trim[key] : 0, t + RAMP);
        }
      },
      dispose() { stop(); playing = false; for (const g of Object.values(gains)) g.disconnect(); },
    };
    return controller;
  }

  // Peak level per bin (max |sample| across channels). Every sample is read: skipping would hide the
  // transients that make a raw take look different from the mix. Runs once per clip load.
  function peaks(buffer, bins) {
    const out = new Float32Array(bins);
    const length = buffer.getChannelData(0).length;
    const size = length / bins;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let b = 0; b < bins; b++) {
        let peak = out[b];
        for (let i = Math.floor(b * size), end = Math.min(length, Math.floor((b + 1) * size)); i < end; i++) {
          const v = Math.abs(data[i]);
          if (v > peak) peak = v;
        }
        out[b] = peak;
      }
    }
    return out;
  }

  window.SCSAB = { rms, peaks, createAB };

  // Interface. Without this script the section is a list of plain links to each clip.
  const player = typeof document !== 'undefined' && document.querySelector('[data-ab-player]');
  if (!player || !window.AudioContext) return;
  const deck = player.querySelector('.ab-deck');
  const tracks = [...player.querySelectorAll('.ab-track')];
  const playButton = player.querySelector('.ab-play');
  const playLabel = playButton.querySelector('.label');
  const sources = [...player.querySelectorAll('.ab-src')];
  const seek = player.querySelector('#ab-seek');
  const now = player.querySelector('.ab-now');
  const total = player.querySelector('.ab-dur');
  const status = player.querySelector('.ab-status');
  const canvas = player.querySelector('.ab-wave');
  const pen = canvas.getContext('2d');
  const reduced = () => window.SCSMotion?.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = name => getComputedStyle(player).getPropertyValue(name).trim();
  const RES = 1200;
  let wave = null;   // { raw, mixed } peak arrays, level-matched and normalised together
  let blend = 1;     // 0 = raw shape, 1 = mixed shape
  let morph = 0;
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let context = null;
  let ab = null;
  let current = 0;
  let loading = 0;
  let frame = 0;
  let source = 'mixed';
  const cache = new Map();

  player.dataset.ready = '';
  deck.hidden = false;

  const decode = async url => {
    if (!cache.has(url)) cache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => context.decodeAudioData(b)));
    return cache.get(url);
  };
  const render = () => {
    const p = ab ? ab.position() : 0;
    if (document.activeElement !== seek) seek.value = String(p);
    now.textContent = clock(p);
    seek.setAttribute('aria-valuetext', `${clock(p)} of ${clock(ab ? ab.duration : 0)}`);
  };
  const draw = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    pen.setTransform(dpr, 0, 0, dpr, 0, 0);
    pen.clearRect(0, 0, w, h);
    const mid = h / 2;
    const bars = Math.max(1, Math.floor(w / 3));
    const progress = ab ? ab.position() / ab.duration : 0;
    const head = progress * w;
    const played = css('--text');
    const rest = css('--control');
    if (!wave) { pen.fillStyle = rest; pen.fillRect(0, mid - 0.5, w, 1); return; }
    for (let b = 0; b < bars; b++) {
      const from = Math.floor(b / bars * RES);
      const to = Math.max(from + 1, Math.floor((b + 1) / bars * RES));
      let v = 0;
      for (let i = from; i < to; i++) v = Math.max(v, wave.raw[i] + (wave.mixed[i] - wave.raw[i]) * blend);
      const half = Math.max(0.5, v * (mid - 2));
      const x = b * 3;
      pen.fillStyle = x + 2 <= head ? played : rest;
      pen.fillRect(x, mid - half, 2, half * 2);
    }
    if (ab) { pen.fillStyle = ab.playing ? css('--rec') : played; pen.fillRect(Math.min(w - 2, Math.max(0, head - 1)), 0, 2, h); }
  };
  const morphTo = target => {
    cancelAnimationFrame(morph);
    if (reduced()) { blend = target; draw(); return; }
    const start = blend;
    const began = performance.now();
    const step = time => {
      const t = Math.min(1, (time - began) / 280);
      blend = start + (target - start) * (1 - (1 - t) ** 3);
      draw();
      morph = t < 1 ? requestAnimationFrame(step) : 0;
    };
    morph = requestAnimationFrame(step);
  };
  const tick = () => { render(); draw(); frame = ab && ab.playing ? requestAnimationFrame(tick) : 0; };
  const setPlaying = on => {
    if (on) player.dataset.playing = ''; else delete player.dataset.playing;
    playLabel.textContent = on ? 'Pause' : 'Play';
    if (on && !frame) frame = requestAnimationFrame(tick);
    render();
    draw();
  };
  const load = async (index, { quiet = false } = {}) => {
    const token = ++loading;
    ab?.dispose();
    ab = null;
    wave = null;
    setPlaying(false);
    current = index;
    tracks.forEach((t, i) => t.setAttribute('aria-pressed', String(i === index)));
    context ??= new AudioContext();
    if (!quiet) status.textContent = 'Loading clip.';
    try {
      const [raw, mixed] = await Promise.all([decode(tracks[index].dataset.raw), decode(tracks[index].dataset.mixed)]);
      if (token !== loading) return false;
      ab = createAB({ context, raw, mixed, source, onEnd: () => { setPlaying(false); status.textContent = 'Clip finished.'; } });
      const r = peaks(raw, RES).map(v => v * ab.trim.raw);
      const m = peaks(mixed, RES).map(v => v * ab.trim.mixed);
      const top = Math.max(...r, ...m) || 1;
      wave = { raw: r.map(v => v / top), mixed: m.map(v => v / top) };
      seek.max = String(ab.duration);
      total.textContent = clock(ab.duration);
      if (!quiet) status.textContent = '';
      render();
      draw();
      return true;
    } catch {
      if (token === loading) status.textContent = 'This clip could not be loaded.';
      return false;
    }
  };
  const toggleSource = next => {
    source = next ?? (source === 'mixed' ? 'raw' : 'mixed');
    sources.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.src === source)));
    ab?.setSource(source);
    morphTo(source === 'mixed' ? 1 : 0);
    status.textContent = source === 'raw' ? 'Raw take.' : 'Mixed.';
  };

  playButton.addEventListener('click', async () => {
    if (!ab && !(await load(current))) return;
    await context.resume();
    if (ab.playing) { ab.pause(); setPlaying(false); return; }
    ab.play();
    setPlaying(true);
    status.textContent = source === 'raw' ? 'Playing the raw take.' : 'Playing the mix.';
  });
  sources.forEach(b => b.addEventListener('click', () => toggleSource(b.dataset.src)));
  tracks.forEach((t, i) => t.addEventListener('click', () => load(i)));
  seek.addEventListener('input', () => { ab?.seek(Number(seek.value)); render(); draw(); });
  new ResizeObserver(draw).observe(canvas);
  draw();
  // Load the first clip when the player comes into view, so the waveform is there before Play.
  // Skipped when the visitor has asked the browser to save data.
  if (!navigator.connection?.saveData && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      seen.disconnect();
      if (!ab) load(current, { quiet: true });
    }, { rootMargin: '200px' });
    seen.observe(player);
  }
  seek.addEventListener('keydown', event => {
    if (!ab || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    ab.seek(ab.position() + (event.key === 'ArrowRight' ? 5 : -5));
    render();
    draw();
  });
  player.addEventListener('keydown', event => {
    if ((event.key === 'a' || event.key === 'A') && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); toggleSource(); }
  });
})();
