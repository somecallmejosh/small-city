# Accessible motion and artist experience

Updated November 13, 2026 (cinematic motion layer). This records implementation and verification, not complete WCAG conformance or validated conversion uplift.

## Motion policy

The site is deliberately cinematic, and every effect is gated by the same three conditions:

1. **The device allows motion.** A `prefers-reduced-motion: reduce` setting always wins.
2. **The visitor hasn't chosen "Reduce motion"** in the header control. An inline head script applies a saved choice before first paint, so a returning visitor never sees even the first frame of a load animation.
3. **Support.** Scroll-scrubbed effects also need `animation-timeline` support. Pinned effects also need a viewport at least 600px tall, so landscape phones and high browser zoom get the static layout.

Without these conditions, the page is the complete static layout: hero, credits list, service panels, a gallery grid and the quote. Nothing is hidden or reordered.

| Where | Effect | Kind |
|---|---|---|
| Home hero | The REC tally comes on, then the headline "switches on": the control-room photo glows through the letters in the room's red light. The photo drifts inside the letters as you scroll away. | One-shot load (ends by 1.8 s); scroll-linked drift |
| What happens to your vocals | The section's own heading starts as a raw take and is processed through Comp, Tune, Time, Compress, De-ess and Print as the section scrolls into view, finishing by mid-screen, while the stage list tracks the stage. **Nothing pins**: the page scrolls normally and has no added scroll length. | Scroll-linked, not pinned |
| Made in this room | Credit stills sit in the room's red duotone and ease to true colour, with a slight push-in, on hover/focus | Interaction |
| The room | Photos ease from duotone to colour on hover/focus; each photo morphs into a lightbox dialog and back | Interaction |
| Inner pages | Headline mask-up and hero photo power-up on load | One-shot load |
| Site-wide | Cross-page wipe with hover-intent prerendering; text-link rules fill like a level meter; buttons drop 1px on press | Interaction |

There is **no scroll-jacking anywhere**: no sticky or pinned sections and no scroll-length padding. The owner asked for this (Nov 13, 2026).

**Rules every effect follows:**

- **Properties.** Only `transform`, `clip-path`, `filter`, `color` and decorative-layer `opacity` are animated.
- **Nothing ever ends hidden.** Every keyframe ends on the static appearance. Scrubbed effects take their state from scroll position. Load effects fill backwards only, so nothing lingers after them.
- **No loops.** There are no infinite loops, no autoplay audio, no visualizers, no parallax on text, and no custom cursor.
- **Mechanics.** No scroll event listeners. `scripts/check.mjs` fails the build if any animation declaration sits outside the gate.

**Light and colour.**

- **Hero letters** are filled with the photo screened onto the room red. That red is the darkest a letter pixel can be, and it is at least 4.05:1 against the darkened photo behind the title at 1440×900, 1280×720, 1280×640, 768×1024, 390×844, 375×667 and 320×568. Short screens get a deeper scrim to hold that.
- **Duotone photos** cap highlights at the room red, so bone type on the poster is at least 3.45:1 anywhere (large text), before its own scrim.
- **Wall captions** sit on a dark gradient (at least 75%).
- **The film grain** is static and very faint, and it is removed in forced colours, along with the duotones, the clip-text and the light spill.

**The vocal chain, statically.**

- **Screen readers** get the full sentence and a description as text; the animated letters are `aria-hidden`.
- **The stage list** is a real ordered list with every caption.
- **Without motion,** the section shows the same line twice: Raw take (jittered) and Print (clean), with all stages listed.
- **Contrast:** axe passes at several scroll positions through the chain, because its colors change with scroll.

**Hear the difference (A/B player).** It renders only when `src/studio.json` lists clips.

- Audio never autoplays.
- Every control is a native button or range input.
- RAW / MIXED uses `aria-pressed`.
- `A` toggles the source and the arrow keys on the scrubber seek 5 s.
- A polite live region announces play, source and errors.
- Audio isn't motion, so reduced motion doesn't change it.
- Without JS, each clip is a plain link.
- **Waveform:** drawn on a canvas from the actual decoded clips. It's level-matched, so the raw take's peaks visibly stick out past the compressed mix.
  - The canvas is `aria-hidden`.
  - The control is the native range input layered over it (transparent), so clicking or dragging the waveform seeks, the keyboard works as normal, the position is announced through `aria-valuetext`, and the whole waveform shows the red focus ring.
  - Switching RAW/MIXED morphs the shape over 280 ms, or instantly with reduced motion.
  - The playhead moves only during user-started playback.
  - The first clip prefetches when the player scrolls into view, except when the browser's Data Saver is on.

**Room lightbox.**

- Native `<dialog>`.
- Left/Right step through the photos.
- Escape or the close button morph the photo back to the grid, and focus returns to the current photo.
- With reduced motion it opens and closes instantly (verified: zero View Transitions).

**Focus is never covered.** A pinned hero or service panel that contains focus comes to the front at full size, undimmed. The pinned room gallery contains no focusable elements. A browser pass tabbed forward and backward through every control at 1091, 480 and 369 CSS px and hit-tested each focused element: no control was obscured.

**Contrast holds at every frame.**

- Hero display type sits over a measured scrim; its worst single pixel is 5.27:1 against the photograph.
- The small hero label sits on an opaque canvas label.
- Light-up quote words start at `--meta` (above 5:1 on the surface), never below.

**Links and buttons carry no arrows.**

- **Text links** keep a permanent 1px rule, so they never rely on color alone. The rule thickens to 2px on hover or focus.
- **Primary actions** carry a small "recording light" that turns `--rec` red on hover or focus. This is a color change, not motion, so it works in reduced mode too.
- **With motion allowed,** the label rolls to an identical copy and text-link rules redraw left to right. The copy is a real `aria-hidden` span (not CSS generated content), so link names are read once.
- **External links** say "(opens in a new tab)" in visually hidden text where the old ↗ glyph used to signal it.

The cover image that follows the pointer is decorative (`alt=""`, `aria-hidden`, no pointer events). It only builds on fine-hover devices, ignores touch and pen, and hides on any key press or when motion is reduced.

## User control

The header's keyboard-operable Motion disclosure offers “Follow my device” and “Reduce motion.” A device reduced-motion request always takes priority. The browser stores only the `scs-motion` preference, never project details. Blocked storage still permits a page-local choice.

Reduction cancels active Web Animations, removes every CSS load and scroll effect (pinned sections return to normal flow), turns cross-page transitions into instant swaps, hides the credits cover, and suppresses transitions, transform feedback and smooth scrolling. Device changes and changes from another tab are handled. The base page remains readable if enhancement fails.

This follows the intent of [WCAG Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) and [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), with device handling described by [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). These references do not establish whole-site conformance.

## Artist journey

- A Selected Credits list (artist, title, video) sits directly under the hero, before services.
- Services describe the artist's situation while explicitly naming mixing, recording, and production.
- Recording pricing remains visible on mobile; service introductions link to investment guidance.
- Inquiry requires name, service, and a short description. A demo is optional; timing/budget are an optional disclosure.
- Project details and review/send are separate stages. Preparing a text does not send or reserve anything.
- Linked inline errors, associated descriptions, `aria-invalid`, and a focused summary help error recovery. Edits preserve entries.

## Keyboard and visual behavior

The skip link lands on a focusable main landmark. Controls have visible focus; native radios, details, and dialog semantics are retained. Motion settings and the mobile menu do not stay open over one another. Escape closes them and restores focus.

YouTube loads only after activation. Explicit first/last Tab wrapping supplements the native video dialog while preserving iframe access. Closing removes the player and returns focus to its trigger. Artist video captions/settings remain external dependencies.

Opaque video labels and the opaque hero label keep small text off the photography; the home hero headline uses a measured scrim (see Motion policy). Remaining image-dependent/decorative contrast cases were visually reviewed. Forced-color styles retain control boundaries and service selection. No positive tabindex is used.

## Verification

`npm run check` validates static pages/links, heading/metadata basics, phone consistency, syntax, dash-free visible copy, and that every animation declaration is inside the reduced-motion gate. It runs fourteen motion-controller tests:

- Initial device reduction
- Live cancellation
- Saved reduction
- Device precedence
- Blocked storage
- Focus cancellation
- Background tabs
- Cross-tab updates
- Five tests for the credits cover: mouse-only, decorative, never built for coarse pointers, ignores touch, hides on reduction and on keyboard use

Browser verification:

- Nine pages at 1280, 768, 390, and 320 CSS pixels, in full and reduced motion: 72 checks, with actual width verified and no horizontal overflow or completed broken images detected.
- Keyboard motion selection, saved preference across reloads, Escape focus restoration, 320-pixel panel containment, and mobile-menu/settings exclusivity.
- FAQ rapid toggling and live reduction without a stuck height or animation class.
- Skip navigation, modal Tab wrapping, Escape, player removal, and trigger-focus restoration.
- Empty/invalid form errors, keyboard links to fields, optional invalid URL handling, review focus, and retained inputs. No real text was sent.
- Cinematic layer (Nov 13): axe-core 4.10.3 on ten pages at 1280px, zero violations. Remaining "needs review" contrast items are the hero over the photo (pixel-measured, above) and gradient-fill buttons (canvas at rest). Keyboard hit-test in both directions at three widths found no obscured focus. Reduced mode, via the header control, showed zero running animations and the static layout. The checks also covered 320×568, 375×667, 1280×560 and 1920×1080 with no horizontal overflow, the hero action visible without scrolling, and pinning dropped below 600px tall.
- Earlier pass: axe-core 4.10.3 on nine visitor pages, WCAG 2 A/AA, 2.1 AA, 2.2 AA, and best-practice tags; zero reported violations after correcting small-label contrast and archive heading order. Some image/decorative and textarea contrast cases need human judgment. An automated pass is not a full audit.

Reports and the local audit harness are ignored under `qa/` and excluded from deployment.

## Further validation

Test real tasks with representative artists, including a first-time recording client and a remote mixing client: hear work, identify a service, understand the investment, and prepare an inquiry. Include assistive-technology users and actual iPhone/Android messaging apps before public launch. These browser checks cannot establish universal usability or predict sales outcomes.
