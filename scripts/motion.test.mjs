import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/motion.js', import.meta.url), 'utf8');
function setup({ systemReduced = false } = {}) {
  const device = { matches: systemReduced, addEventListener: (_, callback) => { device.change = callback; } };
  const documentEvents = {};
  const document = { hidden: false, querySelectorAll: () => [], addEventListener: (name, fn) => { documentEvents[name] = fn; } };
  const window = {};
  vm.runInNewContext(source, { window, document, matchMedia: () => device });
  const animations = [];
  const element = { contains: () => false, animate: (frames, options) => {
    const listeners = {};
    const animation = { options, canceled: false, effect: { target: element }, addEventListener: (name, fn) => { (listeners[name] ??= []).push(fn); }, cancel: () => { animation.canceled = true; listeners.cancel?.forEach(fn => fn()); } };
    animations.push(animation);
    return animation;
  } };
  return { motion: window.SCSMotion, device, document, documentEvents, element, animations };
}

test('device reduction prevents all Web Animations from being created', () => {
  const t = setup({ systemReduced: true });
  assert.equal(t.motion.reduced, true);
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
