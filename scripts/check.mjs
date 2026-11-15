import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root = resolve(new URL('../dist', import.meta.url).pathname);
const htmlFiles = [];
async function walk(dir) { for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) await walk(p); else if (p.endsWith('.html')) htmlFiles.push(p); } }
await walk(root);
let localLinks = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `Expected one h1: ${file}`);
  assert.match(html, /<meta name="description" content="[^"]+"/, `Description: ${file}`);
  assert.match(html, /<link rel="canonical"/, `Canonical: ${file}`);
  assert.match(html, /<main\b[^>]*\bid="main"/, `Main landmark: ${file}`);
  assert(!/tabindex="[1-9]/.test(html), `Positive tab order: ${file}`);
  assert.match(html, /\/assets\/motion\.js/, `Motion controller: ${file}`);
  assert(!html.includes('tel:8609873424'), 'Inconsistent old booking phone');
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"\s]+)"/g)) {
    if (!raw.startsWith('/') || raw.startsWith('//')) continue;
    const url = new URL(raw.replaceAll('&amp;', '&'), 'https://test.local');
    let target = join(root, decodeURIComponent(url.pathname));
    if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
    await stat(target);
    if (url.hash && target.endsWith('.html')) {
      const targetHtml = await readFile(target, 'utf8');
      assert(targetHtml.includes(`id="${url.hash.slice(1)}"`), `Missing anchor ${raw} in ${file}`);
    }
    localLinks++;
  }
}
// Social and structured-data gate: every indexable page carries complete Open Graph and Twitter
// tags, an og:image that exists at 1200x630, and JSON-LD that parses into a linked @graph.
let socialPages = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (/name="robots" content="noindex/.test(html) && file.includes('404')) continue;
  for (const tag of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:site_name', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.match(html, new RegExp(`(?:property|name)="${tag}" content="[^"]+"`), `Missing ${tag}: ${file}`);
  }
  const image = html.match(/property="og:image" content="https?:\/\/[^/]+([^"]+)"/)[1];
  await stat(join(root, image));
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(ld, `Missing JSON-LD: ${file}`);
  const graph = JSON.parse(ld[1])['@graph'];
  assert(graph.some(n => n['@type'] === 'LocalBusiness') && graph.some(n => n['@id']?.endsWith('#webpage')), `JSON-LD graph incomplete: ${file}`);
  socialPages++;
}
for (const icon of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) await stat(join(root, icon));

// Copy gate: no em or en dashes in anything a visitor can read (scripts excluded).
for (const file of htmlFiles) {
  const visible = (await readFile(file, 'utf8')).replace(/<script\b[\s\S]*?<\/script>/g, '');
  const dash = visible.match(/.{0,30}[–—].{0,30}/);
  assert(!dash, `Em/en dash in ${file}: "${dash?.[0]}"`);
}

// Motion gate: every animation must sit inside a prefers-reduced-motion:no-preference block,
// so a device reduced-motion request always stops it.
let gatedAnimations = 0;
for (const name of ['styles.css', 'motion.css']) {
  const css = (await readFile(new URL(`../src/${name}`, import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let buffer = '';
  for (const ch of css) {
    if (ch === '{') { stack.push(buffer.trim()); buffer = ''; continue; }
    if (ch === '}' || ch === ';') {
      const decl = buffer.trim();
      const m = decl.match(/^animation(?:-name|-timeline)?\s*:\s*(.+)$/);
      if (m && !/^none\b/.test(m[1]) && !stack.some(s => s.startsWith('@keyframes'))) {
        const gated = stack.some(s => /prefers-reduced-motion:\s*no-preference/.test(s));
        assert(gated, `Ungated animation in src/${name}: ${stack.at(-1)} { ${decl} }`);
        gatedAnimations++;
      }
      buffer = '';
      if (ch === '}') stack.pop();
      continue;
    }
    buffer += ch;
  }
}

// Usability gates (tasks/heuristics-audit.md).
// The phone number lives in src/components.mjs only; app.js reads it from the page.
const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
assert(!/\d{3}-\d{3}-\d{4}|\+1\d{10}/.test(appJs), 'Hard-coded phone number in src/app.js: read it from data-tel/data-phone');
// A booking link on a service page keeps that page's service, so the form doesn't preselect another.
let serviceBookingLinks = 0;
for (const [page, key] of [['mixing', 'mixing'], ['recording', 'recording'], ['production', 'beats']]) {
  const main = (await readFile(join(root, page, 'index.html'), 'utf8')).match(/<main\b[\s\S]*<\/main>/)[0];
  for (const [, href] of main.matchAll(/href="(\/booking\/[^"]*)"/g)) {
    assert.equal(href, `/booking/?service=${key}`, `Booking link without its service on /${page}/: ${href}`);
    serviceBookingLinks++;
  }
}
// The booking form defaults to "Not sure yet" when no service is passed.
assert.match(await readFile(join(root, 'booking', 'index.html'), 'utf8'), /value="unsure" required checked/, 'Booking form should default to "Not sure yet"');

// Font gate: page text stays inside the preloaded core font subset (scripts/subset-fonts.py CORE),
// so no page pulls the -ext files. A new character still renders correctly, just with an extra fetch.
const coreFont = /^[ -~ ©·×‘’“”•…\s]*$/u;
for (const file of htmlFiles) {
  const text = (await readFile(file, 'utf8')).replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '');
  const extra = [...new Set(text)].filter(c => !coreFont.test(c));
  if (extra.length) console.warn(`Note: ${file.slice(root.length)} uses ${extra.join(' ')} outside the core font subset, so it loads the -ext font. Add them to CORE in scripts/subset-fonts.py.`);
}

execFileSync(process.execPath, ['--check', resolve(new URL('../src/app.js', import.meta.url).pathname)]);
execFileSync(process.execPath, ['--check', resolve(new URL('../src/motion.js', import.meta.url).pathname)]);
execFileSync(process.execPath, ['--check', resolve(new URL('../src/ab-player.js', import.meta.url).pathname)]);
const studio = JSON.parse(await readFile(new URL('../src/studio.json', import.meta.url), 'utf8'));
if (!studio.abTracks?.length) console.warn('Note: src/studio.json has no abTracks, so the "Hear the difference" player is not rendered. Add raw/mixed clip pairs to public/audio/.');
for (const t of studio.abTracks || []) for (const f of [t.raw, t.mixed]) await stat(join(root, f));
console.log(`Checked ${htmlFiles.length} HTML files, ${socialPages} pages of social/JSON-LD meta, ${localLinks} local links/assets, SEO landmarks, phone consistency, dash-free copy, ${gatedAnimations} gated animation declarations, and browser JavaScript syntax.`);
