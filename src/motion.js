/* Finite, progressive enhancement. HTML is readable without this file. */
(() => {
  const device = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const storageKey = 'scs-motion';
  let preference = 'system';
  try { if (localStorage.getItem(storageKey) === 'reduced') preference = 'reduced'; } catch { /* Storage may be unavailable. */ }
  const running = new Set();
  const easing = 'ease-out';

  const motion = {
    get reduced() { return device.matches || preference === 'reduced'; },
    animate(element, frames, options = {}) {
      if (!element || motion.reduced || !element.animate) return null;
      const animation = element.animate(frames, { duration: 120, easing, ...options, iterations: 1, fill: 'backwards' });
      running.add(animation);
      const release = () => running.delete(animation);
      animation.addEventListener('finish', release, { once: true });
      animation.addEventListener('cancel', release, { once: true });
      return animation;
    },
    enter(element, delay = 0) {
      return motion.animate(element, [{ transform: 'translateY(14px)' }, { transform: 'translateY(0)' }], { delay });
    },
    scrollTo(element) {
      element.scrollIntoView({ block: 'start', behavior: motion.reduced ? 'instant' : 'smooth' });
    },
  };
  window.SCSMotion = motion;

  const settings = document.querySelector('.motion-settings');
  const apply = () => {
    root.dataset.motion = motion.reduced ? 'reduced' : 'full';
    if (motion.reduced) {
      for (const animation of [...running]) animation.cancel();
    }
    settings?.querySelectorAll('[name="motion-preference"]').forEach(input => { input.checked = input.value === preference; });
    const label = settings?.querySelector('.motion-current');
    if (label) label.textContent = motion.reduced ? 'Reduced' : 'On';
  };
  apply();
  device.addEventListener('change', apply);
  window.addEventListener('storage', e => {
    if (e.key !== storageKey && e.key !== null) return;
    preference = e.newValue === 'reduced' ? 'reduced' : 'system';
    apply();
  });
  if (settings) {
    settings.hidden = false;
    settings.addEventListener('toggle', () => {
      if (!settings.open) return;
      const menu = document.querySelector('#mobile-nav');
      const toggle = document.querySelector('.menu-toggle');
      if (menu && toggle) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
    });
    settings.addEventListener('focusout', event => {
      if (event.relatedTarget && !settings.contains(event.relatedTarget)) settings.open = false;
    });
    settings.querySelectorAll('[name="motion-preference"]').forEach(input => input.addEventListener('change', () => {
      if (!input.checked) return;
      preference = input.value === 'reduced' ? 'reduced' : 'system';
      try { localStorage.setItem(storageKey, preference); } catch { /* Preference still applies to this page. */ }
      apply();
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && settings.open) { settings.open = false; settings.querySelector('summary').focus(); }
    });
    document.addEventListener('click', e => { if (settings.open && !settings.contains(e.target)) settings.open = false; });
  }

  // Load and scroll effects are pure CSS in motion.css, behind the same reduced-motion gate.
  document.addEventListener('focusin', e => {
    // Stop transforms on a focused item's ancestors before drawing its focus ring.
    for (const animation of [...running]) {
      const target = animation.effect?.target;
      if (target && (target === e.target || target.contains(e.target))) animation.cancel();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const animation of [...running]) animation.cancel();
  });

  // Native details semantics, animated height only for these short disclosures.
  document.querySelectorAll('.faq-list details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let sequence = 0;
    let intendedOpen = details.open;
    summary.addEventListener('click', event => {
      event.preventDefault();
      const current = ++sequence;
      const start = details.getBoundingClientRect().height;
      intendedOpen = !intendedOpen;
      animation?.cancel();
      if (motion.reduced) { details.open = intendedOpen; details.classList.remove('disclosure-animating'); return; }
      details.open = true;
      const end = intendedOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      details.classList.add('disclosure-animating');
      animation = motion.animate(details, [{ height: `${start}px` }, { height: `${end}px` }], { duration: 120 });
      const finish = () => {
        if (current !== sequence) return;
        details.open = intendedOpen;
        details.classList.remove('disclosure-animating');
        animation = null;
      };
      if (animation) {
        animation.addEventListener('finish', finish, { once: true });
        animation.addEventListener('cancel', finish, { once: true });
      } else finish();
    });
  });
})();
