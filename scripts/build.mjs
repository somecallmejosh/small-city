import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pages } from '../src/pages.mjs';
import { site } from '../src/components.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, 'public'), output, { recursive: true, filter: source => !source.includes(`${process.platform === 'win32' ? '\\' : '/'}new-studio-images`) && !/\.heic$/i.test(source) });
await cp(join(root, 'src/styles.css'), join(output, 'assets/styles.css'));
await cp(join(root, 'src/app.js'), join(output, 'assets/app.js'));
await cp(join(root, 'src/motion.js'), join(output, 'assets/motion.js'));
await cp(join(root, 'src/motion.css'), join(output, 'assets/motion.css'));
await cp(join(root, 'src/ab-player.js'), join(output, 'assets/ab-player.js'));
const entries = pages();
for (const p of entries) {
  const directory = join(output, p.path);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), p.html);
}
await writeFile(join(output, '404.html'), entries.find(p => p.path === '/404/').html);
await writeFile(join(output, 'robots.txt'), process.env.SITE_PUBLIC === 'true' ? `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.filter(p => p.path !== '/404/').map(p => `<url><loc>${site.origin}${p.path}</loc></url>`).join('')}</urlset>`);
await writeFile(join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n');
console.log(`Built ${entries.length} pages in dist/. ${process.env.SITE_PUBLIC === 'true' ? 'Public indexing enabled.' : 'Review build: search indexing disabled.'}`);
