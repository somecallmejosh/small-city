import { readFileSync } from 'node:fs'

export const studio = JSON.parse(
  readFileSync(new URL('./studio.json', import.meta.url), 'utf8'),
)

export const site = {
  name: 'Small City Studios',
  phone: '860-993-0052',
  tel: '+18609930052',
  address: '87 Church Street, East Hartford, CT 06108',
  instagram: 'https://www.instagram.com/smallcitystudios/',
  spotify: 'https://open.spotify.com/playlist/5Di9s4etmxKO74tRJULjD4',
  youtube:
    'https://www.youtube.com/playlist?list=PLF9TakWYG3sHyqcVyTlptE-vw0ROg5Jtt',
  origin: 'https://www.smallcitystudios.com',
}

export const escape = (s = '') =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )

export function icon(name) {
  return readFileSync(
    new URL(`../public/assets/${name}.svg`, import.meta.url),
    'utf8',
  ).replace(
    /<svg[^>]*>/,
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon" aria-hidden="true">',
  )
}

// Link and button labels: no arrows. Every button carries a recording light that arms on hover/focus;
// text links keep a permanent rule that fills like a level meter (motion.css).
export const label = (text) => `<span class="label">${text}</span>`
export const recLight = '<span class="rec-light" aria-hidden="true"></span>'
export const newTab =
  '<span class="visually-hidden"> (opens in a new tab)</span>'
export const link = (href, text, variant = 'text-link') =>
  `<a class="${variant}" href="${href}">${variant.includes('button') ? recLight : ''}${label(text)}</a>`
export const eyebrow = (text) => `<p class="eyebrow">${text}</p>`

// Display titles end on a full stop lit in the room's red. The period stays in the text for screen readers.
export const lit = (text) =>
  text.replace(/\.$/, '<span class="lit-dot">.</span>')

// A session sheet: studio facts as mono label/value pairs on cyan rims.
export const sessionSheet = (items) =>
  `<dl class="sheet">${items.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`

// Every inner page opens with the same two-level trail back home.
export const breadcrumb = (crumb) =>
  `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${crumb}</span></nav>`

// Inner-page hero: the room's red light from the top right, a giant title, a lead, and the session sheet.
export function pageHero({
  kicker,
  title,
  crumb = '',
  lead = '',
  sheet = null,
  extra = '',
  className = '',
}) {
  return `<section class="page-hero${className ? ' ' + className : ''}" aria-labelledby="page-title"><div class="container">${crumb ? breadcrumb(crumb) : ''}<p class="eyebrow page-kicker">${kicker}</p><h1 class="page-title" id="page-title">${lit(title)}</h1>${lead || extra ? `<div class="page-hero-foot">${lead ? `<p class="page-lead">${lead}</p>` : ''}${extra}</div>` : ''}${sheet ? sessionSheet(sheet) : ''}</div></section>`
}

export function studioImage(
  name,
  alt,
  {
    sizes = '(max-width: 759px) calc(100vw - 48px), (max-width: 1199px) calc((100vw - 112px) / 2), 600px',
    priority = false,
    className = '',
    lazy = true,
  } = {},
) {
  const widths =
    name === 'studio-production' ? [640, 960, 1440] : [640, 960, 1440, 1920]
  return `<img${className ? ` class="${escape(className)}"` : ''} src="/assets/${name}.webp" srcset="${widths.map((w) => `/assets/${name}-${w}.webp ${w}w`).join(', ')}" sizes="${escape(sizes)}" width="1440" height="1080" alt="${escape(alt)}" ${priority ? 'fetchpriority="high"' : lazy ? 'loading="lazy"' : ''} decoding="async">`
}

const roomFrames = [
  [
    'studio-wide',
    'The control desk facing the live-room window, with seating and colored pendant lights',
    'Control room',
    'Desk, monitors, glass to the live room.',
  ],
  [
    'studio-recording',
    'Recording workstation and the large window into the live room',
    'Tracking position',
    'Engineer\u2019s view into the live room.',
  ],
  [
    'studio-lounge',
    'Sofas and chairs beside exposed brick walls and warm lighting',
    'Lounge',
    'Seating for the artist and their team.',
  ],
  [
    'studio-session',
    'The studio seating area beside the production workstation',
    'Session desk',
    'Keys and a second station by the lounge.',
  ],
  [
    'studio-production',
    'Close view of the MIDI keyboard, controls, and monitors at the production desk',
    'Production desk',
    'Where the beats get made.',
  ],
]

// The room: an asymmetric grid. Each photo is a button that opens the shared lightbox dialog;
// app.js morphs the photo into the dialog with a View Transition when motion is allowed.
export function studioGallery({ all = false } = {}) {
  const frames = all ? roomFrames : roomFrames.slice(0, 3)
  const item = ([name, alt, label, line], i) =>
    `<li class="room-item room-item-${i + 1}"><button type="button" class="room-open duo" data-full="/assets/${name}-${name === 'studio-production' ? 1440 : 1920}.webp" data-alt="${escape(alt)}" data-label="${escape(label)}" data-line="${escape(line)}" aria-haspopup="dialog">${studioImage(name, '', { sizes: i === 0 ? '(max-width: 759px) calc(100vw - 48px), 66vw' : '(max-width: 759px) calc(100vw - 48px), 33vw' })}<span class="visually-hidden">Enlarge photo: ${escape(label)}</span></button><p class="room-cap"><span class="eyebrow">${label}</span>${line}</p></li>`
  return `<section class="studio-section room-section" aria-labelledby="studio-heading"><div class="container"><div class="room-head">${eyebrow('87 Church St, East Hartford')}<h2 id="studio-heading">The room.</h2><p>Control room, live room and lounge.</p></div><ul class="room-grid${all ? ' room-grid-all' : ''}" role="list">${frames.map(item).join('')}</ul><div class="studio-visit"><p>Sessions by appointment. Clear guests with Chase before you arrive.</p>${link('/recording/', 'Recording rates')}</div></div></section>${roomDialog()}`
}

export function roomDialog() {
  return `<dialog class="room-dialog" id="room-dialog" aria-labelledby="room-dialog-title"><div class="room-dialog-bar"><div class="room-dialog-heading"><h2 id="room-dialog-title">The room</h2><p class="room-count" aria-hidden="true"></p></div><div class="room-dialog-actions"><button type="button" class="room-prev">${label('Previous')}</button><button type="button" class="room-next">${label('Next')}</button><button type="button" class="dialog-close room-close" aria-label="Close photo" autofocus>${icon('close')}</button></div></div><img class="room-dialog-img" alt="" width="1920" height="1440"><p class="room-dialog-cap" aria-live="polite"></p></dialog>`
}

const navItems = [
  ['/recording/', 'Recording'],
  ['/mixing/', 'Mixing'],
  ['/production/', 'Beats'],
  ['/projects/', 'Credits'],
  ['/bio/', 'Chase Briley'],
  ['/contact/', 'Contact'],
]

// The header sticks, and "Book a session" stays in it at every width, so booking is one tap from anywhere.
export function header(path) {
  const nav = navItems
    .map(
      ([href, name]) =>
        `<a href="${href}"${path === href ? ' aria-current="page"' : ''}>${label(name)}</a>`,
    )
    .join('')
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="container header-inner">
    <a class="brand" href="/" aria-label="Small City Studios homepage"><img src="/assets/logo-light.svg" width="54" height="37" alt=""><span>SMALL CITY<br>STUDIOS<span class="brand-period">.</span></span></a>
    <nav class="desktop-nav" aria-label="Main navigation">${nav}</nav>
    <div class="header-tools"><a class="header-phone" href="tel:${site.tel}"><span class="visually-hidden">Call or text </span>${site.phone}</a><a class="header-cta" href="/booking/"${path === '/booking/' ? ' aria-current="page"' : ''}>${recLight}${label('Book<span class="cta-long"> a session</span>')}</a></div>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav"><span>Menu</span><span class="menu-lines" aria-hidden="true"></span></button>
  </div><nav class="mobile-nav container" id="mobile-nav" aria-label="Mobile navigation" hidden>${nav}<a class="mobile-phone" href="tel:${site.tel}">Call or text ${site.phone}</a></nav></header>`
}

export function footer(path) {
  const nav = navItems
    .map(
      ([href, name]) =>
        `<a href="${href}"${path === href ? ' aria-current="page"' : ''}>${name}</a>`,
    )
    .join('')
  return `<footer class="site-footer"><div class="container">
    <div class="footer-top"><a class="brand" href="/" aria-label="Small City Studios homepage"><img src="/assets/logo-light.svg" width="42" height="28" alt=""><span>SMALL CITY STUDIOS<span class="brand-period">.</span></span></a><p>Rap recording, mixing &amp; production / East Hartford, CT</p></div>
    <nav class="footer-nav" aria-label="Footer navigation">${nav}</nav>
    <div class="footer-grid"><div><p class="eyebrow">Studio</p><address>87 Church Street<br>East Hartford, CT 06108</address><p class="small muted">By appointment only.</p></div><div><p class="eyebrow">Call / text</p><a href="tel:${site.tel}">${site.phone}</a><div class="footer-links"><a href="/booking/">Book a session</a><a href="/contact/">Contact &amp; directions</a></div></div><div><p class="eyebrow">Listen</p><div class="footer-links"><a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram${newTab}</a><a href="${site.spotify}" target="_blank" rel="noopener noreferrer">Spotify${newTab}</a><a href="${site.youtube}" target="_blank" rel="noopener noreferrer">YouTube${newTab}</a></div></div></div>
    <div class="footer-bottom"><p>© ${new Date().getFullYear()} Small City Studios.</p><p>Rap · Hip-hop · R&amp;B</p><a href="/privacy/">Privacy</a><a href="#top">Back to top</a></div>
  </div></footer>`
}

// Chase's own voice is set wide (.voice) and signed; studio information stays condensed and mono.
export const signature = (role = 'Owner, engineer, producer') =>
  `<p class="signature"><span class="sig-name">Chase Briley</span> <span class="sig-role">/ ${role}</span></p>`

// service: a booking-form key (mixing, recording, beats) so the closing CTA keeps the page's context.
export function cta(
  title = 'Call Chase.',
  text = 'Text me the song and what it needs. We lock in scope and price before anything gets booked.',
  service = '',
) {
  return `<section class="closing-section"><div class="container"><p class="closing-status"><span class="rec-dot" aria-hidden="true"></span>By appointment</p><h2 class="closing-title">${title}</h2><p class="closing-phone"><a href="tel:${site.tel}"><span class="visually-hidden">Call </span>${site.phone}</a></p><div class="closing-foot"><div><p class="voice">${text}</p>${signature()}</div><div class="closing-actions">${link('sms:' + site.tel, 'Text me the song')}${link('/booking/' + (service ? '?service=' + service : ''), 'Book a session', 'button button-outline')}</div></div></div></section>`
}

export function faq(items) {
  return `<div class="faq-list">${items.map(([q, a], i) => `<details><summary><span class="faq-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="faq-q">${q}</span><span class="faq-plus" aria-hidden="true">+</span></summary><div class="faq-answer"><div>${a}</div></div></details>`).join('')}</div>`
}

export const selectedWork = [
  {
    id: '_Qhqx8Oi_4I',
    artist: 'Zae Buckz × Spliff',
    title: 'Sh*t Talkin PT. 2',
    image: 'project-zae.jpg',
  },
  {
    id: 'jCqH_mUgHJM',
    artist: 'Flee Cheese & TheHolyQuraun',
    title: 'Cartier Santos',
    image: 'project-cartier.jpg',
  },
  {
    id: 'sfOsi7lr6bQ',
    artist: 'ESCO CRACK ft. Bandgang Lonnie & Shredgang Mone',
    title: 'Hartford to Detroit',
    image: 'project-hartford.jpg',
  },
  {
    id: '926fxNbTWdw',
    artist: 'KI Blixk',
    title: 'Word Around Town',
    image: 'project-blixk.jpg',
  },
  {
    id: 'MVvi3U6nh_0',
    artist: 'Young Mar',
    title: 'How I’m Living',
    image: 'project-mar.jpg',
  },
]

export function workCards(items = selectedWork.slice(0, 3)) {
  return `<div class="work-grid">${items.map((p, i) => `<article class="work-card"><button type="button" class="work-play" data-video="${p.id}" data-title="${escape(p.artist + ' - ' + p.title)}" aria-label="Play ${escape(p.title)} by ${escape(p.artist)}"><img src="/assets/${p.image}" alt="" width="480" height="360" loading="lazy"><span class="play-mark">${icon('play')}</span><span class="video-label">Play video ${icon('play')}</span></button><div class="work-caption"><h3>${escape(p.title)}</h3><p>${escape(p.artist)}</p></div></article>`).join('')}</div>`
}

// Made in this room: the selected credits as a wall of official video stills (room-light duotone,
// full colour on hover/focus). Each tile is the play button for the existing video dialog.
const stillWidths = (id) => (id === 'sfOsi7lr6bQ' ? [640] : [640, 1280])
// One credit still: room-light duotone, full colour on hover/focus, opens the video dialog.
export function wallTile(p, n, sizes) {
  const widths = stillWidths(p.id)
  return `<li class="wall-tile wall-${n + 1}"><button type="button" class="wall-play duo" data-video="${p.id}" data-title="${escape(p.artist + ' - ' + p.title)}" ><img src="/assets/credit-${p.id}-640.webp" srcset="${widths.map((w) => `/assets/credit-${p.id}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}" width="1280" height="720" alt="" loading="lazy" decoding="async"><span class="wall-cue" aria-hidden="true">${icon('play')}Play</span><span class="wall-caption"><span class="visually-hidden">Play video: </span><span class="wall-artist">${escape(p.artist)}</span><span class="visually-hidden">, </span><span class="wall-title">${escape(p.title)}</span></span></button></li>`
}

export function coverWall(items = selectedWork) {
  const tile = (p, n) =>
    wallTile(
      p,
      n,
      n === 0
        ? '(max-width: 759px) calc(100vw - 48px), 58vw'
        : '(max-width: 759px) calc(100vw - 48px), 40vw',
    )
  return `<section class="wall-section" aria-labelledby="wall-heading"><div class="container"><div class="wall-head"><p class="wall-number" aria-hidden="true">250+</p><div class="wall-copy"><h2 id="wall-heading">Made in this room.</h2><p>250+ artists through the room. These are a few.</p></div>${link('/projects/', 'All credits')}</div><ul class="wall" role="list">${items.map(tile).join('')}</ul><p class="credits-note">Official videos via YouTube. Explicit content.</p></div></section>`
}

export function videoDialog() {
  return `<dialog class="video-dialog" id="video-dialog" aria-labelledby="video-title"><div class="video-dialog-heading"><h2 id="video-title">Official video</h2><button type="button" class="dialog-close" aria-label="Close video">${icon('close')}</button></div><div id="video-container"></div><p class="small">Playback is provided by YouTube. <a id="video-fallback" href="${site.youtube}" target="_blank" rel="noopener noreferrer">Watch on YouTube${newTab}</a></p></dialog>`
}

// Structured data: one linked @graph per page. Only facts already published on the site.
const abs = (path) => site.origin + path
const plain = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
export function schemaGraph({
  path,
  title,
  description,
  og,
  crumb,
  faqs,
  service,
}) {
  const url = abs(path),
    studio = { '@id': abs('/#studio') },
    chase = { '@id': abs('/bio/#chase') },
    website = { '@id': abs('/#website') }
  const offer = (name, href, extra = {}) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name, url: abs(href) },
    ...extra,
  })
  const hourly = {
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: 70,
      priceCurrency: 'USD',
      unitCode: 'HUR',
      unitText: 'hour',
    },
  }
  const graph = [
    {
      '@type': 'LocalBusiness',
      '@id': studio['@id'],
      name: site.name,
      url: abs('/'),
      description:
        'Rap, hip-hop and R&B recording, mixing, mastering and beat production with Chase Briley.',
      telephone: site.tel,
      image: [abs('/assets/og/home.jpg'), abs('/assets/studio-wide-1920.webp')],
      logo: abs('/icon-512.png'),
      address: {
        '@type': 'PostalAddress',
        streetAddress: '87 Church Street',
        addressLocality: 'East Hartford',
        addressRegion: 'CT',
        postalCode: '06108',
        addressCountry: 'US',
      },
      areaServed: { '@type': 'State', name: 'Connecticut' },
      founder: chase,
      sameAs: [site.instagram],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Studio services',
        itemListElement: [
          offer('Recording and engineering', '/recording/', hourly),
          offer('Mixing and mastering', '/mixing/'),
          offer('Beats and production', '/production/'),
        ],
      },
    },
    {
      '@type': 'WebSite',
      '@id': website['@id'],
      url: abs('/'),
      name: site.name,
      inLanguage: 'en-US',
      publisher: studio,
    },
    {
      '@type': 'Person',
      '@id': chase['@id'],
      name: 'Chase Briley',
      jobTitle: 'Owner, recording engineer and producer',
      url: abs('/bio/'),
      image: abs('/assets/chase.jpg'),
      worksFor: studio,
    },
    {
      '@type':
        path === '/bio/'
          ? 'ProfilePage'
          : path === '/contact/'
            ? 'ContactPage'
            : 'WebPage',
      '@id': url + '#webpage',
      url,
      name: title,
      description,
      inLanguage: 'en-US',
      isPartOf: website,
      about: path === '/bio/' ? chase : studio,
      ...(path === '/bio/' ? { mainEntity: chase } : {}),
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: abs(`/assets/og/${og}.jpg`),
        width: 1200,
        height: 630,
      },
      ...(crumb ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
    },
  ]
  if (crumb)
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': url + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
        { '@type': 'ListItem', position: 2, name: crumb, item: url },
      ],
    })
  if (service)
    graph.push({
      '@type': 'Service',
      '@id': url + '#service',
      name: service,
      serviceType: service,
      description,
      url,
      provider: studio,
      areaServed: { '@type': 'State', name: 'Connecticut' },
      ...(path === '/recording/'
        ? { offers: { '@type': 'Offer', ...hourly } }
        : {}),
    })
  if (faqs)
    graph.push({
      '@type': 'FAQPage',
      '@id': url + '#faq',
      isPartOf: { '@id': url + '#webpage' },
      mainEntity: faqs.map(([q, a]) => ({
        '@type': 'Question',
        name: plain(q),
        acceptedAnswer: { '@type': 'Answer', text: plain(a) },
      })),
    })
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replace(/</g, '\\u003c')
}

export function layout(page) {
  const {
    path,
    title,
    description,
    content,
    bodyClass = '',
    og = 'home',
    ogType = 'website',
    ogAlt = 'Small City Studios control room in East Hartford, CT, lit red',
    noindex = false,
  } = page
  const hasAB = /data-ab-player/.test(content)
  const publicSite = process.env.SITE_PUBLIC === 'true'
  const url = site.origin + path,
    image = `${site.origin}/assets/og/${og}.jpg`,
    fullTitle = `${title} | Small City Studios`
  const meta = [
    `<title>${escape(fullTitle)}</title>`,
    `<meta name="description" content="${escape(description)}">`,
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<link rel="canonical" href="${url}">`,
    '<meta name="theme-color" content="#0B0B0C">',
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta property="og:type" content="${ogType}">`,
    '<meta property="og:site_name" content="Small City Studios">',
    '<meta property="og:locale" content="en_US">',
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${escape(ogAlt)}">`,
    ...(ogType === 'profile'
      ? [
          '<meta property="profile:first_name" content="Chase">',
          '<meta property="profile:last_name" content="Briley">',
        ]
      : []),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escape(title)}">`,
    `<meta name="twitter:description" content="${escape(description)}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${escape(ogAlt)}">`,
  ].join('')
  const schema = noindex
    ? ''
    : `<script type="application/ld+json">${schemaGraph(page)}</script>`
  return `<!doctype html><html lang="en" class="scheme-only-dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${meta}<link rel="preload" href="/assets/Archivo.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/JetBrainsMono.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/motion.css"><script src="/assets/motion.js" defer></script><script src="/assets/app.js" defer></script>${hasAB ? '<script src="/assets/ab-player.js" defer></script>' : ''}<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/*.*"}}]},"eagerness":"moderate"}]}</script>${schema}</head><body id="top" class="${bodyClass}">${header(path)}<main id="main" tabindex="-1">${content}</main>${footer(path)}${videoDialog()}</body></html>`
}
