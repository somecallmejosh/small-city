const motion = window.SCSMotion || { reduced: true, animate: () => null, enter: () => null, scrollTo: element => element.scrollIntoView({ behavior: 'instant', block: 'start' }) };
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
if (menuToggle && mobileNav) {
  const closeMenu = () => { menuToggle.setAttribute('aria-expanded', 'false'); mobileNav.hidden = true; };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    if (open) motion.animate(mobileNav, [{ opacity: .15, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 120 });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); } });
  // A tap outside the menu, or following one of its links (including same-page ones), closes it.
  document.addEventListener('pointerdown', e => { if (!mobileNav.hidden && !mobileNav.contains(e.target) && !menuToggle.contains(e.target)) closeMenu(); });
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  matchMedia('(min-width: 1000px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
}

// Desktop nav playhead: follows hover and keyboard focus, then returns to the current page.
const rail = document.querySelector('.desktop-nav');
if (rail?.querySelector('.playhead')) {
  const current = rail.querySelector('a[aria-current]');
  const park = link => {
    if (!link) { rail.removeAttribute('data-playhead'); return; }
    rail.style.setProperty('--ph-x', `${link.offsetLeft}px`);
    rail.style.setProperty('--ph-w', link.offsetWidth);
    rail.setAttribute('data-playhead', '');
  };
  const home = () => park(current);
  rail.classList.add('has-playhead');
  home();
  document.fonts?.ready.then(home);
  addEventListener('resize', home);
  requestAnimationFrame(() => requestAnimationFrame(() => rail.classList.add('is-live')));
  rail.addEventListener('pointerover', e => { const link = e.target.closest('a'); if (link) park(link); });
  rail.addEventListener('pointerleave', () => { if (!rail.contains(document.activeElement)) home(); });
  rail.addEventListener('focusin', e => park(e.target.closest('a')));
  rail.addEventListener('focusout', e => { if (!rail.contains(e.relatedTarget)) home(); });
}

const dialog = document.querySelector('#video-dialog');
if (dialog) {
  const videoContainer = dialog.querySelector('#video-container');
  let trigger;
  const stopVideo = () => { videoContainer.replaceChildren(); document.body.classList.remove('dialog-open'); trigger?.focus(); };
  document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.video;
    if (!/^[\w-]{11}$/.test(id)) return;
    trigger = button;
    dialog.querySelector('#video-title').textContent = button.dataset.title;
    dialog.querySelector('#video-fallback').href = `https://www.youtube.com/watch?v=${id}`;
    const iframe = document.createElement('iframe');
    // The visitor pressed play on the tile, so the embed starts playing too.
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`;
    iframe.title = button.dataset.title;
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    videoContainer.replaceChildren(iframe);
    document.body.classList.add('dialog-open');
    dialog.showModal();
    motion.animate(dialog, [{ opacity: .2, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 120 });
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const first = dialog.querySelector('.dialog-close');
    const last = dialog.querySelector('#video-fallback');
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('close', stopVideo);
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
}

const form = document.querySelector('#project-form');
if (form) {
  form.noValidate = true;
  const serviceNames = { mixing: 'Mixing & mastering', recording: 'Recording & engineering', beats: 'Beats & production', unsure: 'Help choosing the right service' };
  const sourceField = document.querySelector('#source-field');
  const review = document.querySelector('#message-review');
  const messageText = document.querySelector('#message-text');
  const errorSummary = document.querySelector('#form-errors');
  const errorLinks = document.querySelector('#error-links');
  const validators = {
    artist: value => value.trim() ? '' : 'Enter your name or artist name.',
    goal: value => value.trim().length >= 10 ? '' : 'Tell me a little more about the project (at least 10 characters).',
    demo: value => {
      if (!value.trim()) return '';
      try { return ['http:', 'https:'].includes(new URL(value).protocol) ? '' : 'Use a listening link beginning with https:// or http://.'; }
      catch { return 'Enter a full link beginning with https://, or leave this blank.'; }
    },
  };
  // "soundcloud.com/x" or "www.dropbox.com/..." is a link the visitor meant; add the scheme for them.
  const normalizeLink = value => {
    const v = value.trim();
    return v && !/^[a-z][\w+.-]*:/i.test(v) && /^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(v) ? `https://${v}` : v;
  };
  function checkField(name) {
    const input = form.elements[name];
    if (name === 'demo') input.value = normalizeLink(input.value);
    const error = document.querySelector(`#${name}-error`);
    const message = validators[name](input.value);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    error.hidden = !message;
    return message;
  }
  const params = new URLSearchParams(location.search);
  const requestedService = params.get('service');
  if (Object.hasOwn(serviceNames, requestedService ?? '')) {
    const option = [...form.querySelectorAll('[name=service]')].find(r => r.value === requestedService);
    if (option) option.checked = true;
  }
  const updateFields = () => { sourceField.hidden = form.elements.service.value !== 'mixing'; };
  form.querySelectorAll('[name=service]').forEach(radio => radio.addEventListener('change', updateFields));
  updateFields();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const errors = Object.keys(validators).map(name => ({ name, message: checkField(name) })).filter(error => error.message);
    errorLinks.replaceChildren();
    if (errors.length) {
      for (const { name, message } of errors) {
        const item = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.href = `#${name}`;
        anchor.textContent = message;
        anchor.addEventListener('click', event => { event.preventDefault(); form.elements[name].focus(); });
        item.append(anchor);
        errorLinks.append(item);
      }
      errorSummary.hidden = false;
      errorSummary.focus();
      return;
    }
    errorSummary.hidden = true;
    const data = new FormData(form);
    const artist = String(data.get('artist') || '').trim();
    const goal = String(data.get('goal') || '').trim();
    const service = String(data.get('service'));
    const lines = [`Hi Chase, I’m ${artist}.`, '', `I’m interested in: ${serviceNames[service]}.`];
    if (service === 'mixing') lines.push(`My files: ${data.get('source')}.`);
    lines.push('', goal);
    for (const [key, label] of [['demo', 'Demo/reference'], ['timing', 'Timing'], ['budget', 'Budget']]) {
      const value = String(data.get(key) || '').trim();
      if (value) lines.push('', `${label}: ${value}`);
    }
    lines.push('', 'Can we discuss the scope, price, and next steps?');
    messageText.value = lines.join('\n');
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    document.querySelector('#send-text').href = `sms:${form.dataset.tel}${iOS ? '&' : '?'}body=${encodeURIComponent(messageText.value)}`;
    form.hidden = true;
    review.hidden = false;
    document.querySelector('#review-heading').focus();
    motion.scrollTo(review);
  });
  Object.keys(validators).forEach(name => form.elements[name].addEventListener('input', () => {
    if (form.elements[name].getAttribute('aria-invalid') === 'true') checkField(name);
  }));
  document.querySelector('#edit-message').addEventListener('click', () => {
    review.hidden = true;
    form.hidden = false;
    form.elements.artist.focus();
    document.querySelector('#copy-status').textContent = '';
  });
  document.querySelector('#copy-message').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      // A clipboard stuck on a permission prompt counts as a failure after 1.5 s.
      await Promise.race([navigator.clipboard.writeText(messageText.value), new Promise((_, reject) => setTimeout(reject, 1500))]);
      status.textContent = `Message copied. Paste it into a text to ${form.dataset.phone}.`;
    } catch {
      messageText.focus();
      messageText.select();
      status.textContent = `Select and copy the message above, then text it to ${form.dataset.phone}.`;
    }
  });
  form.querySelector('button[type=submit]').disabled = false;
}

// Plain sms: links work everywhere; with JS, prefill the message. iOS uses "&body=", others "?body=".
document.querySelectorAll('a[data-sms-body]').forEach(anchor => {
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  anchor.href = `${anchor.getAttribute('href')}${iOS ? '&' : '?'}body=${encodeURIComponent(anchor.dataset.smsBody)}`;
});

// sms: needs a texting app. Phones and Macs (Messages) have one; most other desktops don't, and the
// link does nothing. There, a text link copies the number (or the prepared message) and says so.
if (!/iPhone|iPad|iPod|Android|Macintosh/.test(navigator.userAgent) && !matchMedia('(pointer: coarse)').matches) {
  const toast = document.createElement('p');
  toast.className = 'sms-toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let timer;
  const say = text => { toast.textContent = text; clearTimeout(timer); timer = setTimeout(() => { toast.textContent = ''; }, 8000); };
  document.addEventListener('click', async event => {
    const anchor = event.target.closest('a[href^="sms:"]');
    if (!anchor) return;
    event.preventDefault();
    if (anchor.id === 'send-text') { document.querySelector('#copy-message').click(); return; }
    const d = anchor.getAttribute('href').match(/(\d{10})(?!\d)/)?.[1] || '';
    const phone = `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    // Say it straight away; the clipboard can wait on a permission prompt.
    say(`Text ${phone} from your phone.`);
    try { await navigator.clipboard.writeText(phone); say(`Number copied: ${phone}. Text it from your phone.`); } catch { /* The number is already on screen. */ }
  });
}

// The room lightbox. The clicked photo morphs into the dialog with a same-document View Transition
// (only the active image carries view-transition-name). Reduced motion or no API: instant swap.
const roomDialog = document.querySelector('#room-dialog');
if (roomDialog) {
  const frames = [...document.querySelectorAll('.room-open')];
  const big = roomDialog.querySelector('.room-dialog-img');
  const title = roomDialog.querySelector('#room-dialog-title');
  const caption = roomDialog.querySelector('.room-dialog-cap');
  const count = roomDialog.querySelector('.room-count');
  let index = 0;
  const thumb = i => frames[i].querySelector('img');
  const morph = update => (motion.reduced || !document.startViewTransition) ? Promise.resolve(update()) : document.startViewTransition(update).finished;
  const fill = async i => {
    index = (i + frames.length) % frames.length;
    const frame = frames[index];
    big.src = frame.dataset.full;
    big.alt = frame.dataset.alt;
    title.textContent = frame.dataset.label;
    count.textContent = `${index + 1} / ${frames.length}`;
    // The caption is a polite live region: Previous/Next announce the new photo and its position.
    const position = Object.assign(document.createElement('span'), { className: 'visually-hidden', textContent: `${frame.dataset.label}, photo ${index + 1} of ${frames.length}. ` });
    caption.replaceChildren(position, frame.dataset.line);
    try { await big.decode(); } catch { /* Show it anyway. */ }
  };
  const open = async i => {
    thumb(i).style.viewTransitionName = 'room-photo';
    await morph(async () => {
      thumb(i).style.viewTransitionName = '';
      big.style.viewTransitionName = 'room-photo';
      await fill(i);
      roomDialog.showModal();
      document.body.classList.add('dialog-open');
    });
    big.style.viewTransitionName = '';
  };
  const close = async () => {
    if (!roomDialog.open) return;
    big.style.viewTransitionName = 'room-photo';
    await morph(() => {
      big.style.viewTransitionName = '';
      thumb(index).style.viewTransitionName = 'room-photo';
      roomDialog.close();
    });
    thumb(index).style.viewTransitionName = '';
  };
  frames.forEach((frame, i) => frame.addEventListener('click', () => open(i)));
  roomDialog.querySelector('.room-close').addEventListener('click', close);
  roomDialog.querySelector('.room-prev').addEventListener('click', () => fill(index - 1));
  roomDialog.querySelector('.room-next').addEventListener('click', () => fill(index + 1));
  roomDialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  roomDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); fill(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); fill(index - 1); }
  });
  roomDialog.addEventListener('click', event => {
    if (event.target !== roomDialog) return;
    const r = roomDialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });
  roomDialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); frames[index].focus(); });
}

