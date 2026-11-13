const motion = window.SCSMotion || { reduced: true, animate: () => null, enter: () => null, scrollTo: element => element.scrollIntoView({ behavior: 'instant', block: 'start' }) };
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
if (menuToggle && mobileNav) {
  const closeMenu = () => { menuToggle.setAttribute('aria-expanded', 'false'); mobileNav.hidden = true; };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    if (open) {
      const settings = document.querySelector('.motion-settings');
      if (settings) settings.open = false;
    }
    if (open) motion.animate(mobileNav, [{ opacity: .15, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 120 });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); } });
  matchMedia('(min-width: 1000px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
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
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    iframe.title = button.dataset.title;
    iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
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
    goal: value => value.trim().length >= 10 ? '' : 'Tell Chase a little more about the project (at least 10 characters).',
    demo: value => {
      if (!value.trim()) return '';
      try { return ['http:', 'https:'].includes(new URL(value).protocol) ? '' : 'Use a listening link beginning with https:// or http://.'; }
      catch { return 'Enter a full link beginning with https://, or leave this blank.'; }
    },
  };
  function checkField(name) {
    const input = form.elements[name];
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
    document.querySelector('#send-text').href = `sms:+18609930052${iOS ? '&' : '?'}body=${encodeURIComponent(messageText.value)}`;
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
      await navigator.clipboard.writeText(messageText.value);
      status.textContent = 'Message copied. Paste it into a text to 860-993-0052.';
    } catch {
      messageText.focus();
      messageText.select();
      status.textContent = 'Select and copy the message above, then text it to 860-993-0052.';
    }
  });
  form.querySelector('button[type=submit]').disabled = false;
}

// Plain sms: links work everywhere; with JS, prefill the message. iOS uses "&body=", others "?body=".
document.querySelectorAll('a[data-sms-body]').forEach(anchor => {
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  anchor.href = `${anchor.getAttribute('href')}${iOS ? '&' : '?'}body=${encodeURIComponent(anchor.dataset.smsBody)}`;
});

// The room lightbox. The clicked photo morphs into the dialog with a same-document View Transition
// (only the active image carries view-transition-name). Reduced motion or no API: instant swap.
const roomDialog = document.querySelector('#room-dialog');
if (roomDialog) {
  const frames = [...document.querySelectorAll('.room-open')];
  const big = roomDialog.querySelector('.room-dialog-img');
  const title = roomDialog.querySelector('#room-dialog-title');
  const caption = roomDialog.querySelector('.room-dialog-cap');
  let index = 0;
  const thumb = i => frames[i].querySelector('img');
  const morph = update => (motion.reduced || !document.startViewTransition) ? Promise.resolve(update()) : document.startViewTransition(update).finished;
  const fill = async i => {
    index = (i + frames.length) % frames.length;
    const frame = frames[index];
    big.src = frame.dataset.full;
    big.alt = frame.dataset.alt;
    title.textContent = frame.dataset.label;
    caption.textContent = frame.dataset.line;
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
