import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Load the controller without a DOM: the interface half exits when there is no document.
const window = {};
vm.runInNewContext(readFileSync(new URL('../src/ab-player.js', import.meta.url), 'utf8'), { window });
const { createAB, rms, peaks } = window.SCSAB;

const buffer = (amplitude, seconds = 60, rate = 1000) => {
  const data = Float32Array.from({ length: seconds * rate }, (_, i) => amplitude * Math.sin(i / 3));
  return { duration: seconds, numberOfChannels: 1, getChannelData: () => data };
};

function mockContext() {
  const log = { started: [], stopped: 0 };
  const param = () => {
    const p = { value: 0, events: [] };
    p.cancelScheduledValues = t => p.events.push(['cancel', t]);
    p.setValueAtTime = (v, t) => p.events.push(['set', v, t]);
    p.linearRampToValueAtTime = (v, t) => { p.events.push(['ramp', v, t]); p.value = v; };
    return p;
  };
  return {
    log, currentTime: 0, destination: {},
    createGain: () => ({ gain: param(), connect() {}, disconnect() {} }),
    createBufferSource: () => ({ connect() {}, disconnect() {}, start: (when, offset) => log.started.push({ when, offset }), stop: () => { log.stopped++; } }),
  };
}

test('levels are matched by RMS, down to the quieter clip', () => {
  const context = mockContext();
  const ab = createAB({ context, raw: buffer(0.2), mixed: buffer(0.8) });
  assert.ok(Math.abs(rms(buffer(0.8)) / rms(buffer(0.2)) - 4) < 0.01);
  assert.equal(ab.trim.raw, 1);
  assert.ok(Math.abs(ab.trim.mixed - 0.25) < 0.001, 'louder mix is turned down, not the raw take up');
});

test('both clips start at the same moment from the same offset', () => {
  const context = mockContext();
  const ab = createAB({ context, raw: buffer(0.3), mixed: buffer(0.3) });
  ab.seek(12);
  ab.play();
  const [a, b] = context.log.started;
  assert.equal(a.when, b.when);
  assert.equal(a.offset, 12);
  assert.equal(b.offset, 12);
});

test('switching source moves only the gains: no restart, position continuous', () => {
  const context = mockContext();
  const ab = createAB({ context, raw: buffer(0.3), mixed: buffer(0.3) });
  ab.play();
  context.currentTime = 10.02;
  const before = ab.position();
  ab.setSource('raw');
  assert.equal(context.log.started.length, 2, 'no new sources were started');
  assert.equal(context.log.stopped, 0, 'nothing was stopped');
  assert.equal(ab.position(), before);
  assert.ok(Math.abs(before - 10) < 1e-9);
  assert.equal(ab.source, 'raw');
});

test('the crossfade is a short ramp, not a hard cut', () => {
  const context = mockContext();
  let gains = [];
  const original = context.createGain;
  context.createGain = () => { const g = original(); gains.push(g); return g; };
  const ab = createAB({ context, raw: buffer(0.3), mixed: buffer(0.3) });
  context.currentTime = 5;
  ab.setSource('raw');
  const ramp = gains[0].gain.events.find(e => e[0] === 'ramp');
  assert.ok(ramp && ramp[2] - 5 > 0 && ramp[2] - 5 <= 0.02, 'ramp completes within 20 ms');
  assert.equal(gains[0].gain.value, ab.trim.raw);
  assert.equal(gains[1].gain.value, 0);
});

test('pause holds the position and play resumes from it', () => {
  const context = mockContext();
  const ab = createAB({ context, raw: buffer(0.3), mixed: buffer(0.3) });
  ab.play();
  context.currentTime = 20.02;
  ab.pause();
  assert.ok(Math.abs(ab.position() - 20) < 1e-9);
  context.currentTime = 50;
  assert.ok(Math.abs(ab.position() - 20) < 1e-9, 'paused position does not advance');
  ab.play();
  assert.equal(context.log.started.at(-1).offset, ab.position());
});

test('seeking is clamped to the shorter clip', () => {
  const context = mockContext();
  const ab = createAB({ context, raw: buffer(0.3, 40), mixed: buffer(0.3, 60) });
  assert.equal(ab.duration, 40);
  ab.seek(500);
  assert.equal(ab.position(), 40);
  ab.seek(-3);
  assert.equal(ab.position(), 0);
});

test('waveform peaks: one value per bin, the loudest sample in each', () => {
  const data = new Float32Array(1000);
  data[10] = -0.9;   // bin 0
  data[260] = 0.4;   // bin 1
  data[999] = 0.7;   // bin 3
  const p = peaks({ numberOfChannels: 1, getChannelData: () => data }, 4);
  assert.equal(p.length, 4);
  assert.ok(Math.abs(p[0] - 0.9) < 1e-6, 'negative peaks count by magnitude');
  assert.ok(Math.abs(p[1] - 0.4) < 1e-6);
  assert.equal(p[2], 0, 'silence stays flat');
  assert.ok(Math.abs(p[3] - 0.7) < 1e-6);
});

test('waveform peaks take the louder channel on stereo', () => {
  const left = new Float32Array(100).fill(0.2);
  const right = new Float32Array(100).fill(0.6);
  const p = peaks({ numberOfChannels: 2, getChannelData: c => (c ? right : left) }, 5);
  assert.ok([...p].every(v => Math.abs(v - 0.6) < 1e-6));
});
