import {
  breadcrumb,
  cta,
  eyebrow,
  faq,
  label,
  layout,
  link,
  lit,
  newTab,
  pageHero,
  recLight,
  sessionSheet,
  signature,
  selectedWork,
  site,
  studio,
  escape,
  studioImage,
  studioGallery,
  coverWall,
  wallTile,
} from './components.mjs'
import { readFileSync } from 'node:fs'

const processSteps = `<ol class="process-grid" role="list"><li><span class="step-number">01</span><h3>Send the song.</h3><p>Rough mix, demo link or a plan for the session. Text it over.</p></li><li><span class="step-number">02</span><h3>Confirm scope and price.</h3><p>Chase confirms the work, the rate and the date. Nothing is booked before that.</p></li><li><span class="step-number">03</span><h3>Track or send files.</h3><p>Come in and record, or send the session for a remote mix.</p></li></ol>`

// ---------------------------------------------------------------------------------------------
// The vocal chain. The section's own heading is rendered as a raw take: every letter carries seeded
// pitch drift, timing drift, uneven level, a ghost from another take, and hot sibilance on S.
// Scroll drives registered custom properties (motion.css) that process it stage by stage.
// The readable sentence is visually hidden text; the letters are aria-hidden.
// ---------------------------------------------------------------------------------------------
const chainLine = 'Here’s what happens to your vocals.'
const chainStages = [
  ['Raw take', 'What comes out of the booth.'],
  ['Comp', 'The best of every take, built into one performance.'],
  ['Tune', 'Pitch held where the song needs it.'],
  ['Time', 'Every syllable locked to the beat.'],
  ['Compress', 'Even level, so every word reads.'],
  ['De-ess', 'Harsh S’s taken down.'],
  ['Print', 'A vocal that sits in the pocket.'],
]

function seeded(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function chainGlyphs() {
  const rand = seeded(1987)
  const span = (lo, hi) => (lo + rand() * (hi - lo)).toFixed(3)
  return chainLine
    .split(' ')
    .map(
      (word) =>
        `<span class="cw">${[...word]
          .map((ch) => {
            const sib = /s/i.test(ch)
            const vars = `--dx:${span(-0.14, 0.14)}em;--dy:${span(-0.2, 0.2)}em;--ds:${span(-0.16, 0.2)};--gx:${span(-0.12, 0.12)}em;--gy:${span(-0.1, 0.1)}em${sib ? ';--sib:1' : ''}`
            return `<span class="cg${sib ? ' cg-s' : ''}" data-g="${escape(ch)}" style="${vars}">${escape(ch)}</span>`
          })
          .join('')}</span>`,
    )
    .join(' ')
}

function vocalChain() {
  const line = (cls, label) =>
    `<div class="chain-take ${cls}"><p class="chain-tag">${label}</p><p class="chain-line" aria-hidden="true">${chainGlyphs()}</p><div class="chain-grid" aria-hidden="true">${'<i></i>'.repeat(16)}</div></div>`
  return `<section class="chain-section" aria-labelledby="chain-heading"><div class="container chain-stage"><h2 id="chain-heading" class="visually-hidden">${chainLine}</h2><p class="visually-hidden">The heading is shown as a raw take, then processed through seven passes into a finished vocal.</p>${line('chain-raw', 'Raw take')}${line('chain-print', 'Print')}<div class="chain-flow"><p class="chain-lead">Seven passes, from the booth to the release.</p><ol class="chain-steps" role="list">${chainStages.map(([name, text], i) => `<li><h3><span class="chain-n">0${i + 1}</span>${name}</h3><p>${text}</p></li>`).join('')}</ol></div><p class="chain-note">Comping, tuning and timing are scoped with the song.</p></div></section>`
}

// Hear the difference: renders only when src/studio.json lists clip pairs (public/audio/).
function abSection() {
  const tracks = studio.abTracks || []
  if (!tracks.length) return ''
  return `<section class="ab-section" aria-labelledby="ab-heading"><div class="container"><div class="ab-head"><h2 id="ab-heading">Hear the difference.</h2><p>The raw take against Chase’s mix, at the same moment in the song. Level-matched, so you hear the mix, not the volume.</p></div><div class="ab-player" data-ab-player><ol class="ab-tracks" role="list">${tracks.map((t, i) => `<li><button type="button" class="ab-track" data-index="${i}" data-raw="${escape(t.raw)}" data-mixed="${escape(t.mixed)}" aria-pressed="${i === 0}"><span class="ab-artist">${escape(t.artist)}</span><span class="ab-title">${escape(t.title)}</span></button><p class="ab-fallback">${escape(t.artist)}, ${escape(t.title)}: <a href="${escape(t.raw)}">raw take</a>, <a href="${escape(t.mixed)}">mix</a></p></li>`).join('')}</ol><div class="ab-deck" hidden><button type="button" class="button button-outline ab-play">${recLight}${label('Play')}</button><div class="ab-switch" role="group" aria-label="Source"><button type="button" class="ab-src" data-src="raw" aria-pressed="false">Raw</button><button type="button" class="ab-src" data-src="mixed" aria-pressed="true">Mixed</button></div><div class="ab-transport"><div class="ab-scrub"><canvas class="ab-wave" aria-hidden="true"></canvas><label class="visually-hidden" for="ab-seek">Position</label><input type="range" id="ab-seek" name="ab-seek" min="0" max="0" step="0.1" value="0"></div><p class="ab-time"><span class="ab-now">0:00</span> / <span class="ab-dur">0:00</span></p></div><p class="ab-hint">Press A to switch between raw and mixed.</p></div><p class="visually-hidden ab-status" role="status" aria-live="polite"></p></div></div></section>`
}

// Chase in his own words (from his bio), as a poster: his photo in the room's red light, his line huge.
function inHisWords() {
  return `<section class="poster-section" aria-labelledby="poster-heading"><div class="poster duo duo-poster"><img src="/assets/chase.jpg" width="1242" height="830" loading="lazy" alt="Chase Briley working at the studio desk"><div class="container poster-copy"><h2 id="poster-heading" class="visually-hidden">Chase Briley, in his own words</h2><p class="poster-quote voice">When you work with me, it’s personal.</p></div></div><div class="container poster-more"><ul class="poster-lines" role="list"><li><p class="voice">250+ artists through this room. The records speak for themselves.</p></li><li><p class="voice">I mix and master right in front of you. Transparent. Raw.</p></li></ul><div class="words-close">${signature()}${link('/bio/', 'My story')}</div></div></section>`
}

const serviceRows = [
  {
    href: '/recording/',
    photo: 'studio-recording',
    name: 'Recording',
    text: 'Vocal tracking with Chase at the desk. Punch-ins and comping as you go.',
    price: '$70 / hr',
    meta: 'Engineer included',
    cta: 'Recording rates',
  },
  {
    href: '/mixing/',
    photo: 'studio-wide',
    name: 'Mixing &amp; mastering',
    text: 'Vocals over a 2-track or full tracked-out stems. In-studio or remote.',
    price: 'Quoted per song',
    meta: 'Remote available',
    cta: 'How mixing works',
  },
  {
    href: '/production/',
    photo: 'studio-production',
    name: 'Beats &amp; production',
    text: 'Licensed beats or custom production. Rights and files agreed in writing.',
    price: 'Quoted per beat',
    meta: 'License or custom',
    cta: 'How beats work',
  },
]

// Client reviews, copied verbatim from the live site. Without JS they stack; app.js turns them into
// a rotator that plays one pass, holds on hover/focus/off-screen, and never auto-advances under reduced motion.
const reviewList = [
  [
    'This is by far the best studio in CT. Very clean and updated. You can’t find better engineers! The sound quality and mixing is amazing &amp; the pricing is VERY affordable. If you are looking to make great music at a highly professional studio, this is definitely the place to go.',
    'Karlee Alves',
    'https://g.co/kgs/HGXqUE',
  ],
  [
    'This studio has helped excel my music from average, to industry standard. Amazing engineers. Professional all around.',
    'Joncarlo Cortese',
    'https://g.co/kgs/xw2zSG',
  ],
  [
    'Very beautiful studio! These pictures do not do it justice. Great quality engineering and mixing and a highly professional setting!',
    'Kassondrah Moore',
    'https://g.co/kgs/8SuGQ6',
  ],
  [
    'Wonderful experience, good vibes and good people!!! I will be going back ASAP!',
    'Craig Taylor',
    'https://g.co/kgs/927VD3',
  ],
  [
    'Small City Studios provides each artist they work with a comfortable, professional setting to bring out their best. I wouldn’t be where I am as an artist today without them. One of the top studios in Connecticut hands down. If you are serious about your music career and are looking for somewhere to develop your sound and grow, this is the place to go.',
    'Adversity 627',
    'https://g.co/kgs/NKoMqR',
  ],
  [
    'preciate you mane fr, you mixed that shit like a mf too perfect',
    'aj.rari',
    '',
  ],
  [
    'Very professional, very comfortable setting, great location, great quality, I’ve never had an issue or bad time, always great vibes. Lastly just great place to be creative overall!',
    'Khalid Thompson',
    '',
  ],
]
function reviews() {
  const n = reviewList.length
  const slides = reviewList
    .map(
      ([text, name, href], i) =>
        `<div class="review${text.split(' ').length > 40 ? ' review-long' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}"><figure><blockquote${href ? ` cite="${href}"` : ''}><p>${text}</p></blockquote><figcaption><span class="quote-name">${name}</span>${href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">Google review${newTab}</a>` : ''}</figcaption></figure></div>`,
    )
    .join('')
  const button = (attr, text) =>
    `<button type="button" class="text-link" ${attr}>${label(text)}</button>`
  return `<section class="quote-section surface-section" aria-labelledby="reviews-heading" aria-roledescription="carousel" data-reviews><div class="container quote-layout"><h2 id="reviews-heading" class="visually-hidden">Client reviews</h2><div class="reviews-track" aria-live="off">${slides}</div><div class="reviews-controls" hidden><span class="reviews-meter" aria-hidden="true"><span></span></span>${button('data-review-toggle hidden', 'Pause')}<p class="reviews-count" aria-hidden="true"><span data-review-index>01</span> / ${String(n).padStart(2, '0')}</p>${button('data-review-prev aria-label="Previous review"', 'Previous')}${button('data-review-next aria-label="Next review"', 'Next')}</div></div></section>`
}

function home() {
  return `<section class="cine-hero" aria-labelledby="hero-title"><div class="cine-media">${studioImage('studio-control-room', 'The production desk, studio monitors, and live-room window at Small City Studios', { priority: true, sizes: '100vw', className: 'cine-img' })}</div><p class="rec-tally" aria-hidden="true"><span class="rec-dot"></span>REC</p><div class="container cine-inner"><p class="eyebrow cine-kicker">East Hartford, CT / Small City Studios</p><h1 class="cine-title" id="hero-title"><span class="cine-line"><span>Vocals that sit</span></span><span class="cine-line"><span>in the pocket.</span></span></h1><div class="cine-foot"><p class="hero-description voice">I’m Chase Briley. I record, mix and master rap, hip-hop and R&amp;B, right in front of you.</p><div class="hero-actions">${link('/booking/', 'Book a session', 'button button-primary')}${link('sms:' + site.tel, 'Text ' + site.phone)}</div></div><ul class="hero-rates" role="list" aria-label="Services and rates">${serviceRows.map((s) => `<li><a href="${s.href}"><span class="hero-rates-name">${s.name}</span><span class="hero-rates-price">${s.price}</span></a></li>`).join('')}</ul></div></section>
  ${coverWall()}
  ${vocalChain()}
  ${abSection()}
  ${inHisWords()}
  <section class="services-section" id="services" aria-labelledby="services-heading"><div class="container"><div class="services-intro"><h2 id="services-heading">Services.</h2><p>Every job is scoped and priced before work starts.</p></div><ul class="svc-list" role="list">${serviceRows.map((s) => `<li class="svc"><div class="svc-photo duo">${studioImage(s.photo, '', { sizes: '(max-width: 759px) calc(100vw - 48px), 220px' })}</div><h3 class="svc-name">${recLight}${s.name}</h3><p class="svc-text">${s.text}</p><p class="svc-rate"><strong>${s.price}</strong><span>${s.meta}</span></p>${link(s.href, s.cta)}</li>`).join('')}</ul><p class="service-reassurance">Ask about block pricing for 8+ hours.</p></div></section>
  <section class="process-section surface-section"><div class="container"><div class="process-head"><h2>Scope first.<br>Then the session.</h2><p>Work, price and date are confirmed before anything is booked.</p></div>${processSteps}</div></section>
  ${studioGallery({ all: true })}
  ${reviews()}
  ${cta()}`
}

const services = {
  mixing: {
    title: 'Rap Mixing & Mastering: In-Studio & Remote',
    description:
      'Rap, hip-hop and R&B mixing and mastering with Chase Briley. Vocals over a 2-track or full tracked-out stems, in-studio or remote. Scope and price confirmed before work starts.',
    eyebrow: 'Mixing & mastering / In-studio + remote',
    crumb: 'Mixing & mastering',
    headline: 'Mixing &amp;<br>mastering.',
    intro:
      'You can sit in while I mix. Vocals over a 2-track or a full tracked-out session, mixed for the pocket and mastered for release.',
    rate: 'Quoted per song',
    sheet: [
      ['Format', '2-track or stems'],
      ['Where', 'In-studio or remote'],
      ['Engineer', 'Chase Briley'],
      ['Booked', 'After scope and price'],
    ],
    image: 'studio-control-room',
    alt: 'Production desk, monitors, and live-room window at Small City Studios',
    action: 'Send a mix',
    key: 'mixing',
    sectionTitle: 'What you’re sending.',
    sectionIntro:
      'The quote depends on the session. Tell Chase which of these you have.',
    features: [
      [
        'Vocals + 2-track beat',
        'Lead, doubles and ad-libs over a stereo instrumental. Vocal balance, effects, editing and the pocket against the beat.',
      ],
      [
        'Tracked-out stems',
        'Separate instrument and vocal stems. Quoted on track count, editing and how far along the rough mix is.',
      ],
      [
        'Mastering & delivery',
        'Master, delivery formats, revision rounds and turnaround are set in the quote before work starts.',
      ],
    ],
    priceTitle: 'Quoted per song.',
    priceText:
      'Send a rough mix or a private link with a line of context. Chase confirms scope and price before anything starts. Editing, track count and the state of the rough all move the number.',
    prepare: [
      'Rough mix or private demo link',
      'One or two reference tracks, and what you like in each',
      '2-track, tracked-out stems, or not sure',
      'Release date, plus any editing, tuning or comping you know you need',
    ],
    faqs: [
      [
        'Can I send files remotely?',
        '<p>Yes. Scope, file handoff, notes, payment and delivery are agreed with Chase before the mix starts.</p>',
      ],
      [
        'I don’t know what files I have.',
        '<p>Pick “Not sure yet” on the booking form. Name the DAW or studio it was tracked in and what you can export. Chase will sort out the handoff with you.</p>',
      ],
      [
        'Are editing and tuning included?',
        '<p>They’re scoped with the song. Flag comping, timing, tuning or repair up front so the quote covers it.</p>',
      ],
      [
        'How many revisions?',
        '<p>Revision rounds are set in the quote. Send notes as one consolidated list per round.</p>',
      ],
      [
        'Can any recording be fixed?',
        '<p>It depends on the source. Send a sample first. If it needs more than a mix, Chase will say so before work starts.</p>',
      ],
    ],
  },
  recording: {
    title: 'Rap Recording & Engineering in East Hartford, CT',
    description:
      'Rap, hip-hop and R&B vocal tracking with Chase Briley at Small City Studios in East Hartford, CT. $70 per hour, engineer included.',
    eyebrow: 'Recording / East Hartford, CT',
    crumb: 'Recording',
    headline: 'Vocal<br>tracking.',
    intro:
      'I engineer every session myself. Come in with the beat, the lyrics and a target for the day.',
    rate: '$70 / hr',
    sheet: [
      ['Engineer', 'Included'],
      ['Block', 'Ask about 8+ hours'],
      ['Where', 'East Hartford, CT'],
      ['Booked', 'After Chase confirms'],
    ],
    image: 'studio-recording',
    alt: 'Recording control room and live-room window at Small City Studios',
    action: 'Book studio time',
    key: 'recording',
    sectionTitle: 'Session format.',
    sectionIntro:
      'Hourly, engineer included. Plan the session around what you need to leave with.',
    features: [
      [
        'Engineer included',
        'Chase runs the session: mic, levels, punch-ins and comping as you go.',
      ],
      [
        'Come prepared',
        'Lyrics written, beat in hand, references ready. Tell Chase who’s performing.',
      ],
      [
        'What you leave with',
        'Confirm the take-home when you book: rough bounce, dry vocals or session files. Mixing is a separate job unless agreed.',
      ],
    ],
    priceTitle: '$70 / hour',
    priceText:
      'Engineer included. Confirm session length and total with Chase before booking. Ask about block pricing for 8+ hours.',
    prepare: [
      'Lyrics and a goal for the session',
      'The beat, with the rights to use it',
      'Reference tracks and any earlier takes',
      'Who’s performing and who’s coming with you',
    ],
    faqs: [
      [
        'First time in a studio?',
        '<p>Say so when you book, along with what you want to record. Chase will help you plan the session length.</p>',
      ],
      [
        'Can I bring people?',
        '<p>Bring the people on the record. Clear any other guests with Chase before the session.</p>',
      ],
      [
        'How much time should I book?',
        '<p>It depends on preparation, artist count and the songs. Describe the project first. There’s no fixed songs-per-hour rate.</p>',
      ],
      [
        'Does recording include a mix?',
        '<p>Only if it’s agreed when you book. A session rough is not a finished mix.</p>',
      ],
      [
        'When is my session confirmed?',
        '<p>When Chase confirms the date, scope, price and payment terms. Sending the booking form doesn’t hold a date.</p>',
      ],
    ],
  },
  production: {
    title: 'Rap Beats & Music Production with Chase Briley',
    description:
      'Beats and production for rap, hip-hop and R&B with Chase Briley at Small City Studios. Licensed or custom, with files, credits and usage terms agreed in writing.',
    eyebrow: 'Beats & production',
    crumb: 'Beats & production',
    headline: 'Beats &amp;<br>production.',
    intro:
      'Licensed beats or custom production. Bring a reference, a verse or a tempo.',
    rate: 'Quoted per beat',
    sheet: [
      ['Options', 'License or custom'],
      ['Terms', 'Agreed in writing'],
      ['Producer', 'Chase Briley'],
      ['Stems', 'If they’re in the scope'],
    ],
    image: 'studio-production',
    alt: 'Close view of the MIDI keyboard, controls, and monitors at the production desk',
    action: 'Ask about beats',
    key: 'beats',
    sectionTitle: 'How it works.',
    sectionIntro:
      'Rights and deliverables are agreed in writing before work starts.',
    features: [
      [
        'Direction',
        'A reference, a verse, a mood or a BPM. Chase builds from what the song needs.',
      ],
      [
        'License or custom',
        'An existing beat or a new one. Scope and price differ.',
      ],
      [
        'Terms',
        'License type, exclusivity, stems, credits and split sheets, agreed before you pay.',
      ],
    ],
    priceTitle: 'Quoted per beat.',
    priceText:
      'Licenses and custom production carry different rights and prices. Tell Chase what you need and the terms are set up front.',
    prepare: [
      'A verse, hook or one-line description',
      'References for tempo, mood and instrumentation',
      'Existing beat or custom',
      'Release plans and any file or usage needs',
    ],
    faqs: [
      [
        'Can I hear beats first?',
        '<p>Yes. Ask Chase for options in the lane you want. The credits page lists released records, not a beat store.</p>',
      ],
      [
        'Is it exclusive?',
        '<p>Only if the terms say so. Licenses and custom work carry different rights. Get it in writing.</p>',
      ],
      [
        'Do I get stems?',
        '<p>If they’re in the scope. Don’t assume stems come with every beat.</p>',
      ],
      [
        'Can you record and mix it too?',
        '<p>Yes. Production, recording and mixing are each scoped and priced before work starts.</p>',
      ],
    ],
  },
}

// ---------------------------------------------------------------------------------------------
// Service pages. Shared frame (hero, prep sheet, FAQ, closing) around one set piece per service
// that shows how the work actually runs: a routing diagram for mixing, the session clock for
// recording, a step sequencer for production.
// ---------------------------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0')

function serviceHero(s) {
  return `<section class="svc-hero" aria-labelledby="page-title"><div class="container">${breadcrumb(s.crumb)}<div class="svc-hero-grid"><div class="svc-hero-copy"><p class="eyebrow page-kicker">${s.eyebrow}</p><h1 class="page-title" id="page-title">${lit(s.headline)}</h1><p class="page-lead voice">${s.intro}</p><p class="hero-rate"><span class="hero-rate-value">${s.rate}</span><a class="hero-rate-link" href="#investment">How pricing works</a></p>${link('/booking/?service=' + s.key, s.action, 'button button-primary')}</div><figure class="svc-hero-photo duo">${studioImage(s.image, s.alt, { priority: true, sizes: '(max-width: 759px) calc(100vw - 48px), 42vw' })}<figcaption class="photo-tag">Small City Studios / East Hartford, CT</figcaption></figure></div>${sessionSheet(s.sheet)}</div></section>`
}

const setHead = (id, title, text) =>
  `<div class="set-head"><h2 id="${id}">${lit(title)}</h2><p>${text}</p></div>`
const quote = (s) => link('/booking/?service=' + s.key, 'Get a quote')
const rateBlock = (s) =>
  `<div class="rate" id="investment"><div class="rate-figure"><p class="eyebrow">Rates</p><h3 class="rate-value">${s.priceTitle}</h3></div><div class="rate-copy"><p>${s.priceText}</p>${quote(s)}</div></div>`

// Mixing: what you send is the input; both kinds route to one mix bus, then mastering prints it.
function routing(s) {
  const [twoTrack, stems, master] = s.features
  const input = ([h, p], n) =>
    `<div class="route-in"><dt><span class="ch">In ${n}</span>${h}</dt><dd>${p}</dd></div>`
  return `<section class="set-section route-section" aria-labelledby="set-heading"><div class="container">${setHead('set-heading', s.sectionTitle, s.sectionIntro)}<div class="route"><dl class="route-inputs">${input(twoTrack, '01')}${input(stems, '02')}</dl><svg class="route-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 25C50 25 50 50 100 50"/><path pathLength="1" d="M0 75C50 75 50 50 100 50"/></svg><dl class="route-out"><div><dt><span class="ch">Mix bus</span>${master[0]}</dt><dd>${master[1]}</dd><dd class="route-print"><span class="rec-dot" aria-hidden="true"></span>Print</dd></div></dl></div>${rateBlock(s)}</div></section>`
}

// Recording: hourly, so the rate card is the session clock. Plain arithmetic on the stated $70/hr.
function sessionClock(s) {
  const rows = [
    [1, '$70'],
    [2, '$140'],
    [4, '$280'],
  ]
  const bar = (h, cost, cls = '') =>
    `<li class="clock-row${cls}" style="--h:${h}"><span class="clock-t">${h === 8 ? '8+ hr' : `${h} hr`}</span><span class="clock-track" aria-hidden="true"><span class="clock-bar"></span></span><span class="clock-cost">${cost}</span></li>`
  return `<section class="set-section clock-section" aria-labelledby="set-heading"><div class="container">${setHead('set-heading', s.sectionTitle, s.sectionIntro)}<dl class="channels">${s.features.map(([h, p], i) => `<div><dt><span class="ch">${pad(i + 1)}</span>${h}</dt><dd>${p}</dd></div>`).join('')}</dl><div class="rate rate-clock" id="investment"><div class="rate-figure"><p class="eyebrow">Rates</p><h3 class="rate-value">${s.priceTitle}</h3><p>${s.priceText}</p>${quote(s)}</div><figure class="clock"><figcaption>Session cost at $70 per hour</figcaption><ol class="clock-rows" role="list">${rows.map(([h, c]) => bar(h, c)).join('')}${bar(8, 'Block pricing, ask', ' clock-block')}</ol></figure></div></div></section>`
}

// Production: the three decisions as lanes on a 16-step sequencer. x = a programmed hit.
const seqPatterns = ['x..x..x.x..x..x.', '....x.......x...', 'x.x.x.x.x.x.x.xx']
function sequencer(s) {
  const steps = (pattern) =>
    [...pattern].map((c) => `<i${c === 'x' ? ' class="on"' : ''}></i>`).join('')
  return `<section class="set-section seq-section" aria-labelledby="set-heading"><div class="container">${setHead('set-heading', s.sectionTitle, s.sectionIntro)}<ol class="seq" role="list">${s.features.map(([h, p], i) => `<li class="seq-lane"><div class="seq-label"><span class="ch">${pad(i + 1)}</span><h3>${h}</h3><p>${p}</p></div><div class="seq-steps" aria-hidden="true">${steps(seqPatterns[i])}</div></li>`).join('')}</ol>${rateBlock(s)}</div></section>`
}

const prep = (s) =>
  `<section class="prep-section" aria-labelledby="prep-heading"><div class="container">${setHead('prep-heading', 'Have this ready.', 'It gets you an accurate quote and a tighter session.')}<ol class="checklist" role="list">${s.prepare.map((p, i) => `<li><span class="check-n">${pad(i + 1)}</span><span class="check-text">${p}</span></li>`).join('')}</ol></div></section>`

const faqSection = (items) =>
  `<section class="faq-section" aria-labelledby="faq-heading"><div class="container faq-grid">${setHead('faq-heading', 'Common questions.', 'Anything else, text Chase.')}${faq(items)}</div></section>`

function servicePage(s, name) {
  const piece = {
    mixing: routing,
    recording: sessionClock,
    production: sequencer,
  }[name]
  return `${serviceHero(s)}${piece(s)}${name === 'mixing' ? abSection() : ''}${name === 'recording' ? studioGallery() : ''}${prep(s)}${faqSection(s.faqs)}${cta(undefined, undefined, s.key)}`
}

// Credits: the selected stills as a wall (a different hang from home), then the archive as a tracklist.
function projectsPage() {
  const archive = JSON.parse(
    readFileSync(new URL('./projects.json', import.meta.url)),
  )
  const rest = archive.filter((p) => !selectedWork.some((s) => s.id === p.id))
  const tiles = selectedWork
    .map((p, n) =>
      wallTile(
        p,
        n,
        n === 0
          ? '(max-width: 759px) calc(100vw - 48px), 66vw'
          : '(max-width: 759px) calc(100vw - 48px), 33vw',
      ),
    )
    .join('')
  return `${pageHero({
    kicker: 'Credits / Archive',
    title: 'Credits.',
    crumb: 'Credits',
    lead: 'Released rap and hip-hop records from the Small City Studios archive.',
    sheet: [
      ['On file', `${archive.length} official videos`],
      ['Through the room', '250+ artists'],
      ['Plays via', 'YouTube'],
      ['Content', 'Explicit'],
    ],
  })}
  <section class="credit-section" aria-labelledby="selected-heading"><div class="container"><h2 class="visually-hidden" id="selected-heading">Selected releases</h2><ul class="wall credit-wall" role="list">${tiles}</ul></div></section>
  <section class="archive-section" aria-labelledby="archive-heading"><div class="container">${setHead('archive-heading', 'Archive.', `${rest.length} more releases from the room. Each opens on YouTube.`)}<ol class="tracklist" role="list">${rest.map((p, i) => `<li><a class="track" href="https://www.youtube.com/watch?v=${p.id}" target="_blank" rel="noopener noreferrer"><span class="track-n">${pad(i + selectedWork.length + 1)}</span><span class="track-artist">${escape(p.artist)}</span><span class="track-song">${escape(p.song)}</span><span class="track-src">YouTube${newTab}</span></a></li>`).join('')}</ol><div class="playlist-links">${link(site.spotify, 'Spotify playlist', 'button button-outline')}${link(site.youtube, 'YouTube playlist')}</div></div></section>${cta('Next record.')}`
}

// Bio: Chase as a poster in the room's light, his story beside the one number in it.
function bioPage() {
  const story = [
    'Ty Davis and I started this place to shake up the rap, hip-hop and R&amp;B scene in New England. Ty’s role has shifted. I’m still here, still pushing.',
    'I’m self-taught. Never stopping, always grinding. Respect from local artists and peers is what I’m about.',
    'Over 250 artists so far, and we’re just getting started, expanding beyond our home turf.',
    'Real connections, real collaborations. You’ll see me mixing and mastering right in front of you. I keep it transparent, keep it raw. When you work with me, you’re getting something personal.',
  ]
  const internLink = link(
    'sms:' + site.tel,
    'Text me about internships',
  ).replace(
    '<a ',
    '<a data-sms-body="Hi Chase, I’m interested in an internship at Small City Studios." ',
  )
  return `<section class="bio-poster" aria-labelledby="page-title"><div class="poster duo duo-poster"><img src="/assets/chase-bio-1274.webp" srcset="/assets/chase-bio-640.webp 640w, /assets/chase-bio-1274.webp 1274w" sizes="100vw" width="1274" height="849" alt="Chase Briley in a white tee and Champion cap, hands on his backpack straps" fetchpriority="high"><div class="container poster-copy">${breadcrumb('Chase Briley')}<p class="eyebrow page-kicker">Owner / Engineer / Producer</p><h1 class="page-title bio-name" id="page-title">${lit('Chase Briley.')}</h1></div></div></section>
  <section class="bio-story" aria-labelledby="story-heading"><div class="container bio-grid"><div class="bio-stat"><p class="bio-number" aria-hidden="true">250+</p><p class="bio-number-cap">Artists through the room so far.</p></div><div class="bio-words"><h2 id="story-heading" class="bio-lead voice">I’m Chase Briley, the guy behind Small City Studios.</h2>${story.map((p) => `<p class="voice">${p}</p>`).join('')}<div class="words-close">${signature()}${link('/booking/', 'Book with Chase', 'button button-primary')}</div></div></div></section>
  <section class="intern-band" aria-labelledby="intern-heading"><div class="container intern-grid"><h2 id="intern-heading">${lit('Internships.')}</h2><div class="intern-words"><p class="voice intern-lead">Helping artists like you find success is what I care about most.</p><p class="voice">I’m also about bringing up the next generation. If you’re eager to learn the game, ask me about an internship.</p>${internLink}</div></div></section>
  <section class="process-section"><div class="container"><div class="process-head"><h2>Scope first.<br>Then the session.</h2><p>Work, price and date are confirmed before you commit.</p></div>${processSteps}</div></section>${cta()}`
}

function bookingPage() {
  const rail = [
    ['Fill this in.', 'The song, the service and what it needs.'],
    [
      'Review and text it.',
      'Your text app opens with the message. Nothing sends from this page.',
    ],
    [
      'Chase confirms.',
      'Scope, price and date, directly with you. This form doesn’t hold a date.',
    ],
  ]
  return `<section class="booking-section" aria-labelledby="page-title"><div class="container booking-grid"><div class="booking-intro">${breadcrumb('Book a session')}<p class="eyebrow page-kicker">Book / Inquire</p><h1 class="page-title" id="page-title">${lit('Book a session.')}</h1><p class="page-lead">Price is confirmed before any work starts.</p></div><div class="form-panel"><form id="project-form" data-tel="${site.tel}" data-phone="${site.phone}"><ol class="form-progress" role="list" aria-label="Project message steps"><li aria-current="step">01 / Project</li><li>02 / Review &amp; text</li></ol><div id="form-errors" class="form-errors" tabindex="-1" aria-labelledby="errors-title" hidden><p id="errors-title">Check these fields.</p><ul id="error-links"></ul></div><div class="form-field"><label for="artist">Artist name <span>(required)</span></label><input id="artist" name="artist" autocomplete="name" aria-describedby="artist-error" required maxlength="100" placeholder="Artist or full name"><p class="field-error" id="artist-error" hidden></p></div><fieldset class="service-options"><legend>Service <span>(required)</span></legend><label><input type="radio" name="service" value="mixing" required><span>Mixing &amp; mastering</span><small>I have recordings to mix.</small></label><label><input type="radio" name="service" value="recording" required><span>Recording</span><small>I need studio time.</small></label><label><input type="radio" name="service" value="beats" required><span>Beats &amp; production</span><small>I need a beat.</small></label><label><input type="radio" name="service" value="unsure" required checked><span>Not sure yet</span><small>Help me pick.</small></label></fieldset><div class="form-field" id="source-field"><label for="source">What files do you have?</label><div class="select-wrap"><select id="source" name="source"><option value="Not sure yet">Not sure yet</option><option value="Vocals over a 2-track beat">Vocals over a 2-track beat</option><option value="Tracked-out stems">Tracked-out stems</option></select><svg viewBox="0 0 8 5" width="8" height="5" fill="none" aria-hidden="true"><path d="M.5.5 4 4 7.5.5" stroke="currentColor"/></svg></div></div><div class="form-field"><label for="goal">Project details <span>(required)</span></label><textarea id="goal" name="goal" rows="4" aria-describedby="goal-error" required minlength="10" maxlength="2000" placeholder="Song count, what’s done, what you need."></textarea><p class="field-error" id="goal-error" hidden></p></div><div class="form-field"><label for="demo">Rough mix or reference link <span>(optional)</span></label><input id="demo" name="demo" type="url" aria-describedby="demo-hint demo-error" placeholder="https://" maxlength="1000"><p id="demo-hint" class="field-hint">A private SoundCloud, Drive or Dropbox link works.</p><p class="field-error" id="demo-error" hidden></p></div><details class="optional-details"><summary>Timing &amp; budget <span>Optional +</span></summary><div class="optional-fields"><div class="form-field"><label for="timing">Deadline <span>(optional)</span></label><input id="timing" name="timing" maxlength="100" placeholder="Release date, session date, or none"></div><div class="form-field"><label for="budget">Budget <span>(optional)</span></label><input id="budget" name="budget" maxlength="150" placeholder="A rough number is fine"></div></div></details><p class="form-note">You review the text before sending it. Nothing is sent or booked from this page.</p><button type="submit" class="button button-primary" disabled>${recLight}${label('Review message')}</button><p class="small privacy-note">Entries stay in this browser tab until you send them. <a href="/privacy/">Privacy</a></p></form><section id="message-review" aria-labelledby="review-heading" hidden><ol class="form-progress" role="list" aria-label="Project message steps"><li>01 / Project</li><li aria-current="step">02 / Review &amp; text</li></ol><h2 id="review-heading" tabindex="-1">Your message.</h2><p>Check it, then open your text app to send it to Chase. Or copy it and text ${site.phone}.</p><label for="message-text" class="visually-hidden">Your prepared project message</label><textarea id="message-text" name="prepared-message" rows="14" readonly></textarea><div class="review-actions"><a id="send-text" href="sms:${site.tel}" class="button button-primary">${recLight}${label('Open text message')}</a><button id="copy-message" type="button" class="button button-outline">${label('Copy message')}</button></div><p id="copy-status" class="small" role="status" aria-live="polite"></p><button type="button" class="text-link" id="edit-message">${label('Edit details')}</button><p class="form-note">Opening your text app doesn’t send the message. Chase confirms the booking with you directly.</p></section><noscript><p>You can <a href="sms:${site.tel}">text</a> or <a href="tel:${site.tel}">call Chase at ${site.phone}</a> to book.</p></noscript></div><div class="booking-aside"><ol class="rail" role="list">${rail.map(([h, p], i) => `<li><span class="rail-n">${pad(i + 1)}</span><h2>${h}</h2><p>${p}</p></li>`).join('')}</ol><div class="contact-mini"><p class="eyebrow">Or call / text</p><a href="tel:${site.tel}">${label(site.phone)}</a></div><figure class="booking-photo duo">${studioImage('studio-session', 'The studio seating area beside the production workstation', { sizes: '(max-width: 759px) 1px, 420px' })}</figure></div></div></section>`
}

// Contact: the number is the page.
function contactPage() {
  const maps =
    'https://www.google.com/maps/search/?api=1&query=87%20Church%20Street%20East%20Hartford%20CT%2006108'
  return `<section class="page-hero contact-hero" aria-labelledby="page-title"><div class="container">${breadcrumb('Contact')}<p class="closing-status"><span class="rec-dot" aria-hidden="true"></span>By appointment</p><h1 class="page-title" id="page-title">${lit('Contact.')}</h1><p class="closing-phone contact-number"><a href="tel:${site.tel}"><span class="visually-hidden">Call </span>${site.phone}</a></p><div class="contact-foot"><p class="page-lead">Call or text. For mixing, recording or beats, include the song and what it needs.</p><div class="contact-actions">${link('sms:' + site.tel, 'Text Chase')}${link('/booking/', 'Book a session', 'button button-primary')}</div></div></div></section>
  <section class="studio-block" aria-labelledby="studio-heading"><div class="container studio-grid"><div class="studio-where"><h2 id="studio-heading">${lit('East Hartford, Connecticut.')}</h2><address class="studio-address">87 Church Street<br>East Hartford, CT 06108</address>${link(maps, 'Directions')}</div>${sessionSheet(
    [
      ['Visits', 'By appointment only'],
      ['Arrival', 'Confirm details with Chase'],
      ['Guests', 'Clear them with Chase first'],
    ],
  )}</div></section>
  <section class="contact-photo"><figure class="duo">${studioImage('studio-wide', 'Wide view of the Small City Studios control room', { sizes: '100vw', lazy: false })}<figcaption class="photo-tag">87 Church St / East Hartford, CT</figcaption></figure></section>`
}

const policy = [
  [
    'Booking form',
    '<p>The form builds a message in your browser. It does not submit your entries to Small City Studios, save them in browser storage, or create a booking. You choose whether to open your text app or copy the message. Once sent, your message is handled by your messaging provider and the recipient.</p>',
  ],
  [
    'Videos and external links',
    '<p>Videos load from YouTube only when you press play, using YouTube’s privacy-enhanced domain. YouTube and other linked services apply their own privacy practices.</p>',
  ],
  [
    'Site operation',
    '<p>No advertising or analytics scripts are installed. Hosting providers may process technical request data to serve and protect the site. Fonts and images are served from this site.</p>',
  ],
  [
    'Questions',
    `<p>For questions about information you share with the studio, contact Chase at <a href="tel:${site.tel}">${site.phone}</a>. Don’t send sensitive personal information in a booking message.</p>`,
  ],
]
function privacyPage() {
  return `${pageHero({ kicker: 'Privacy', title: 'Privacy.', crumb: 'Privacy', extra: '<ul class="privacy-facts" role="list"><li>No analytics.</li><li>No ad scripts.</li><li>No form data stored.</li></ul>' })}<section class="policy-section"><div class="container"><ol class="policy" role="list">${policy.map(([h, body], i) => `<li><p class="policy-n" aria-hidden="true">${pad(i + 1)}</p><h2>${h}</h2><div class="policy-body">${body}</div></li>`).join('')}</ol></div></section>`
}

function notFoundPage() {
  const dests = [
    ['/recording/', 'Recording'],
    ['/mixing/', 'Mixing'],
    ['/production/', 'Beats'],
    ['/projects/', 'Credits'],
    ['/contact/', 'Contact'],
  ]
  return `<section class="page-hero dead-air" aria-labelledby="page-title"><div class="container"><p class="eyebrow page-kicker">404 / No signal</p><h1 class="page-title" id="page-title">${lit('Dead air.')}</h1><svg class="flatline" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30H640M663 30H1000"/><path class="blip" d="M640 30l7-22 9 44 7-22"/></svg><div class="page-hero-foot"><p class="page-lead">That page doesn’t exist.</p>${link('/', 'Back to home', 'button button-primary')}</div><nav class="dead-links" aria-label="Studio pages">${dests.map(([h, n]) => link(h, n)).join('')}</nav></div></section>`
}

// Alt text for the 1200x630 share cards (public/assets/og): what each card says, over the studio photo.
const ogAlts = {
  home: 'Vocals that sit in the pocket. Recording, mixing and beats at Small City Studios, East Hartford, CT.',
  mixing:
    'Mixing and mastering. In-studio or remote, quoted per song. Small City Studios, East Hartford, CT.',
  recording:
    'Vocal tracking. $70 per hour, engineer included. Small City Studios, East Hartford, CT.',
  production:
    'Beats and production. License or custom, terms in writing. Small City Studios, East Hartford, CT.',
  projects:
    'Credits. 250+ artists through the room. Small City Studios, East Hartford, CT.',
  bio: 'Chase Briley. Owner, engineer, producer at Small City Studios, East Hartford, CT.',
  booking:
    'Book a session. Scope and price confirmed first. Small City Studios, East Hartford, CT.',
  contact:
    'Call 860-993-0052. Small City Studios, 87 Church Street, East Hartford, CT.',
}

export function pages() {
  return [
    {
      path: '/',
      title: 'Rap Recording, Mixing & Beat Production in Connecticut',
      description:
        'Rap, hip-hop and R&B recording, mixing, mastering and beat production with Chase Briley at Small City Studios, East Hartford, CT. Studio engineering $70/hr. Remote mixing available.',
      content: home(),
      bodyClass: 'home-page',
      og: 'home',
    },
    ...Object.entries(services).map(([key, s]) => ({
      path: `/${key}/`,
      title: s.title,
      description: s.description,
      content: servicePage(s, key),
      bodyClass: `service-page service-${key}`,
      og: key,
      crumb: s.crumb,
      service: s.crumb,
      faqs: s.faqs,
    })),
    {
      path: '/projects/',
      title: 'Credits: Rap & Hip-Hop Releases',
      description:
        'Released rap and hip-hop records from the Small City Studios archive. Official music videos and playlists.',
      content: projectsPage(),
      og: 'projects',
      crumb: 'Credits',
    },
    {
      path: '/bio/',
      title: 'Chase Briley, Engineer & Producer',
      description:
        'Chase Briley: owner, recording engineer and producer at Small City Studios in East Hartford, Connecticut.',
      content: bioPage(),
      og: 'bio',
      ogType: 'profile',
      crumb: 'Chase Briley',
    },
    {
      path: '/booking/',
      title: 'Book a Session: Mixing, Recording & Beats',
      description:
        'Book recording, mixing or beat production with Small City Studios. Send project details to Chase; scope, price and date are confirmed before anything is booked.',
      content: bookingPage(),
      og: 'booking',
      crumb: 'Book a session',
    },
    {
      path: '/contact/',
      title: 'Contact & Directions, East Hartford, CT',
      description:
        'Call or text Small City Studios at 860-993-0052. 87 Church Street, East Hartford, Connecticut. By appointment only.',
      content: contactPage(),
      og: 'contact',
      crumb: 'Contact',
    },
    {
      path: '/privacy/',
      title: 'Privacy',
      description:
        'How the Small City Studios booking form, videos and external services handle information.',
      content: privacyPage(),
      crumb: 'Privacy',
    },
    {
      path: '/404/',
      title: 'Page Not Found',
      description: 'Page not found. Return to Small City Studios.',
      content: notFoundPage(),
      noindex: true,
    },
  ]
    .map((p) => ({ ...p, ogAlt: ogAlts[p.og || 'home'] }))
    .map((p) => ({ ...p, html: layout(p) }))
}
