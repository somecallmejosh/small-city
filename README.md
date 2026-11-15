# Small City Studios website

Responsive, static website for Chase Briley's rap recording, mixing/mastering, and beat-production services. Built from the discovery documents in the parent project's `discovery/` directory.

## Run

Requires Node 20 or newer. No package installation or third-party JavaScript runtime dependencies are required.

```sh
npm run build
npm run dev
```

The local server prints `http://localhost:8800`. Rebuild and refresh after source changes. Set `PORT` to change the server port.

```sh
npm run check
```

Checks generated pages, local links and assets, no phone number hard-coded in `src/app.js`, service-page booking links carrying `?service=`, the booking form defaulting to "Not sure yet", local anchor destinations, heading/metadata basics, phone consistency, script syntax, dash-free visible copy, and that every animation is inside the reduced-motion gate. It also runs four motion-controller tests and eight A/B player tests: sync start, gain-only switching, crossfade length, RMS level matching, pause/resume, seek clamping, and waveform peak accuracy (mono and stereo). Browser QA results and screenshots are in the ignored `qa/` directory. See `ACCESSIBILITY.md` for motion policy, keyboard behavior, audit results, and validation limits.

## Source

- `src/components.mjs`: shared site details, navigation, footer, cards, media dialog, and metadata.
- `src/pages.mjs`: page copy and structures.
- `src/projects.json`: existing released-project archive, extracted from the live site.
- `src/styles.css`: responsive visual system. The light system is the room's own lighting: `--red` (dominant) and `--cyan` (screens/LEDs), duotone photos (`.duo`), static film grain and light spill.
- `src/app.js`: navigation, click-to-load videos, project-message preparation, internship SMS prefill, the room lightbox (shared-element View Transition), and the text-link fallback: on desktops without a texting app (not a phone or Mac), `sms:` links copy the number and say so. The booking form reads the phone from `data-tel`/`data-phone`; keep the number in `src/components.mjs` only.
- `src/motion.js`: finite animations, live cancellation, device reduced-motion handling, and the credits cover that follows the pointer.
- `src/motion.css`: interactions, and the vocal-chain layer, all behind one reduced-motion gate. It covers the REC-tally load, the vocal-chain passes that light in turn on scroll, the level-meter link rule, and cross-page View Transitions. `src/styles.css` holds the static layout every effect falls back to.
- `src/ab-player.js`: the "Hear the difference" A/B player. Raw and mixed clips play in sync on separate gains, are level-matched by RMS, and switch with a 15 ms crossfade. It draws a waveform from the decoded clips, which morphs between raw and mixed and doubles as the seek control. It is only loaded on pages that render the player.
- `src/studio.json`: `abTracks` lists clip pairs `{ artist, title, raw, mixed }` with files in `public/audio/`. While it's empty, the player section is not rendered and `npm run check` prints a note. Use WAV or high-bitrate AAC, 30–90 s, with the raw take and the mix cut from the same start point, and only with the artist's permission to share the raw take.
- `public/assets/`: local images, fonts, and official Heroicons.
- `assets-src/fonts/`: full font masters. `python3 scripts/subset-fonts.py` (needs fontTools and brotli) writes each as a preloaded core subset (ASCII plus the copy's typography) and an `-ext` file the browser fetches only for other characters, and prints the `unicode-range` values for the `@font-face` rules in `src/styles.css`. `npm run check` notes any page that would need an `-ext` file.
- `assets-src/photos/`: ungraded photo masters. `python3 scripts/grade-photos.py` applies the studio grade (deep shadows, warm practicals, RGB LED casts pulled back, halation, vignette, grain) and writes every responsive size to `public/assets/`. Use `--preview out.jpg` for a before/after sheet. Requires Pillow.
- `scripts/build.mjs`: generates deployable `dist/` pages, robots, sitemap, and headers. `styles.css` and `motion.css` are inlined into each page's `<head>` by `layout()` (comments stripped) so the first paint and the hero image don't wait on stylesheet requests.
- `.openai/hosting.json`: private Sites review deployment configuration.

Existing `/projects/`, `/booking/`, `/bio/`, and `/contact/` paths are preserved. New service routes are `/mixing/`, `/recording/`, and `/production/`.

## Inquiry behavior

The form prepares a message locally. It does not submit to a server, collect a lead in a database, send a text, or confirm a booking. Users review their message and choose to open their messaging app or copy it. The text goes to the phone number in `src/components.mjs`; matching message links also appear in `src/app.js`.

This gives visitors a working contact route while routing scope, actual price, revisions, timing, and booking terms through Chase. No invented fixed mix price, revision allowance, response time, deposit, or instant availability is published.

If server-based inquiry capture is added later, implement delivery/error handling and spam protection, define retention and the inquiry owner, and update the privacy copy. Do not show a submission-success state until delivery is confirmed. Keep actual project messages and identifying details out of analytics payloads.

## Review build and public launch

Default builds use `noindex,nofollow` and a disallowing robots file. The Sites copy is private. The current public domain has not been changed.

Only when the public-launch checks in `LAUNCH.md` are complete, build with:

```sh
SITE_PUBLIC=true npm run build
```

This enables indexing. Canonical and sitemap URLs currently point at `https://www.smallcitystudios.com`, the intended public domain. Update `site.origin` if the production destination changes. Deploy the contents of `dist/` using a static host that supports directory index pages and a custom `404.html`. `_headers` uses the Netlify/Cloudflare Pages style; configure equivalents on hosts that do not read it.

## Asset provenance

- Logo, Chase portrait, and original studio photographs: existing Small City Studios public website.
- New room photographs: locally supplied `IMG_3036`, `IMG_3037`, `IMG_3038`, `IMG_3039`, and `IMG_3043` from `public/assets/new-studio-images/`. Desk, room, seating, and production-detail crops appear on the homepage, recording, mixing, production, booking, and contact pages. Softer motion-blurred frames are not featured. Originals remain untouched locally, ignored by Git, and excluded from deployment output.
- `scripts/prepare-studio-images.py` prepares 640/960/1440/1920px WebP variants (production detail tops out at 1440px), converts embedded color profiles to sRGB, and strips camera/location metadata. It requires Pillow and native JPEG working copies; see its docstring. `studioImage()` sets intrinsic dimensions, `srcset`, and contextual `sizes`; only page-leading photography gets high fetch priority. Below-fold photos lazy load. The gallery is static, with no new motion or keyboard interaction.
- Project thumbnails and video destinations: existing studio project archive and its official YouTube releases. The home-page wall uses each video's official YouTube still, fetched and converted to WebP by `python3 scripts/fetch-credit-stills.py`. It takes maxresdefault, then sddefault, then hqdefault, crops letterboxing and never upscales. The copy attributes these to the studio archive without inventing Chase's individual production/mixing credits.
- Archivo (variable, wght + wdth) and JetBrains Mono (variable, wght): SIL OFL 1.1, latin subsets from the Fontsource distribution (masters in `assets-src/fonts/`). Licenses in `public/assets/ARCHIVO-LICENSE.txt` and `public/assets/JETBRAINS-MONO-LICENSE.txt`.
- Icons: official tailwindlabs/Heroicons distribution (play and close only; links and buttons deliberately carry no arrow icons), with license in `public/assets/HEROICONS-LICENSE.txt`.
- Testimonial: existing published Joncarlo Cortese studio review, linked to its existing review destination.
- Chase's first-person copy (home hero line, "In his words", closing CTA, bio, internships) comes from the bio Chase supplied (November 2026). It is trimmed for length and punctuation, not rewritten. It's set in the wide `.voice` type register so his words are distinguishable from studio information. The "250+ artists" figure is his. No founding year is published (his text said "three years ago", which would go stale). The two service-page intros ("I engineer every session myself", "You can sit in while I mix") paraphrase his "right in front of you"; confirm them with Chase. All other site copy (service pages, FAQs, booking, contact, privacy, meta descriptions) is also in Chase's first person: the site is one person's studio, so it never refers to him as "Chase" or speaks as a company. His name stays only where it labels something (nav, session sheets, signature, page titles, alt text, structured data) and in the visitor's own SMS greeting.

The business strategy, private income goals, owner assessment, and other discovery files are outside this website checkout and are not included in the deployed site.
