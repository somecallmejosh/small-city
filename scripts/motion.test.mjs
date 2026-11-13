import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/motion.js', import.meta.url), 'utf8');
function setup({ systemReduced = false, saved = null, blockedStorage = false } = {}) {
  const device = { matches: systemReduced, addEventListener: (_, callback) => { device.change = callback; } };
  const documentEvents = {};
  const windowEvents = {};
  const root = { dataset: {} };
  let stored = saved;
  const radios = ['system', 'reduced'].map(value => ({ value, checked: false, addEventListener: (_, fn) => { radios.find(r => r.value === value).change = fn; } }));
  const label = {};
  const settings = { hidden: true, addEventListener: () => {}, querySelectorAll: () => radios, querySelector: () => label, contains: () => false };
  const document = { documentElement: root, hidden: false, querySelector: selector => selector === '.motion-settings' ? settings : null, querySelectorAll: () => [], addEventListener: (name, fn) => { documentEvents[name] = fn; } };
  const window = { addEventListener: (name, fn) => { windowEvents[name] = fn; } };
  const localStorage = { getItem: () => { if (blockedStorage) throw new Error('blocked'); return stored; }, setItem: (_, v) => { if (blockedStorage) throw new Error('blocked'); stored = v; } };
  vm.runInNewContext(source, { window, document, localStorage, matchMedia: () => device });
  const animations = [];
  const element = { contains: () => false, animate: (frames, options) => {
    const listeners = {};
    const animation = { options, canceled: false, effect: { target: element }, addEventListener: (name, fn) => { (listeners[name] ??= []).push(fn); }, cancel: () => { animation.canceled = true; listeners.cancel?.forEach(fn => fn()); } };
    animations.push(animation);
    return animation;
  } };
  return { motion: window.SCSMotion, device, document, documentEvents, windowEvents, root, radios, settings, element, animations, stored: () => stored };
}

test('device reduction prevents all Web Animations from being created', () => {
  const t = setup({ systemReduced: true });
  assert.equal(t.root.dataset.motion, 'reduced');
  assert.equal(t.motion.enter(t.element), null);
  assert.equal(t.animations.length, 0);
});
test('turning device reduction on cancels active motion immediately', () => {
  const t = setup();
  const animation = t.motion.enter(t.element);
  assert.equal(animation.options.iterations, 1);
  t.device.matches = true;
  t.device.change();
  assert.equal(animation.canceled, true);
  assert.equal(t.motion.enter(t.element), null);
});
test('the visible control cancels motion and persists a reduced choice', () => {
  const t = setup();
  const animation = t.motion.enter(t.element);
  t.radios[1].checked = true;
  t.radios[1].change();
  assert.equal(animation.canceled, true);
  assert.equal(t.root.dataset.motion, 'reduced');
  assert.equal(t.stored(), 'reduced');
});
test('a saved reduced choice applies before entrance animations', () => {
  const t = setup({ saved: 'reduced' });
  assert.equal(t.motion.reduced, true);
  assert.equal(t.radios[1].checked, true);
  assert.equal(t.motion.enter(t.element), null);
});
test('choosing device mode cannot override an OS reduced-motion request', () => {
  const t = setup({ systemReduced: true, saved: 'reduced' });
  t.radios[0].checked = true;
  t.radios[0].change();
  assert.equal(t.stored(), 'system');
  assert.equal(t.motion.reduced, true);
});
test('blocked browser storage does not break controls or reduction', () => {
  const t = setup({ blockedStorage: true });
  assert.equal(t.settings.hidden, false);
  t.radios[1].checked = true;
  assert.doesNotThrow(() => t.radios[1].change());
  assert.equal(t.motion.reduced, true);
});
test('focusing content stops transforms on its animated ancestor', () => {
  const t = setup();
  const animation = t.motion.enter(t.element);
  t.documentEvents.focusin({ target: t.element });
  assert.equal(animation.canceled, true);
});
test('switching to a background tab cancels active motion', () => {
  const t = setup();
  const animation = t.motion.enter(t.element);
  t.document.hidden = true;
  t.documentEvents.visibilitychange();
  assert.equal(animation.canceled, true);
});
test('a preference changed in another tab takes effect here', () => {
  const t = setup();
  const animation = t.motion.enter(t.element);
  t.windowEvents.storage({ key: 'scs-motion', newValue: 'reduced' });
  assert.equal(animation.canceled, true);
  assert.equal(t.motion.reduced, true);
});

