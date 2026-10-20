/**
 * Per-operator color identity.
 *
 * assets/css/main.css owns one token system — the house dark register the component library is
 * written against. An operator that needs its own identity does not fork the stylesheet; it
 * declares a `palette` inside `site.json`'s brand block and the build emits a small override
 * stylesheet, dist/<operator>/assets/css/operator.css, that re-declares exactly these tokens on
 * :root. The layout links it after main.css (so it wins on screen) and before print.css (so the
 * print reset, which re-declares the same tokens for paper, still wins in print media).
 *
 * A palette must keep the luminance relationships of the house register, not just the hue: the
 * component library pairs --brand with hardcoded text colors (#fff on bands, #061310 on primary
 * buttons and verdict boxes), --brand-2 with body-size link text, --accent with eyebrow text.
 * A deep saturated "brand" navy passes no such pairing, which is why the declared deep color
 * lives in themeColor/brand-soft surfaces while --brand stays an interactive mid-bright hue.
 * test/operator-palette.test.mjs holds every pairing to WCAG AA.
 */

/** camelCase site.json key → CSS custom property it overrides. */
export const PALETTE_TOKENS = {
  paper: '--paper',
  surface: '--surface',
  surface2: '--surface-2',
  surface3: '--surface-3',
  ink: '--ink',
  ink2: '--ink-2',
  muted: '--muted',
  line: '--line',
  lineStrong: '--line-strong',
  brand: '--brand',
  brand2: '--brand-2',
  brand3: '--brand-3',
  brandSoft: '--brand-soft',
  accent: '--accent',
  accent2: '--accent-2',
  accentSoft: '--accent-soft',
  danger: '--danger',
  dangerSoft: '--danger-soft',
  warn: '--warn',
  warnSoft: '--warn-soft',
  good: '--good',
  goodSoft: '--good-soft',
  focus: '--focus',
}

export function hasPalette (site) {
  return Boolean(site?.brand?.palette && Object.keys(site.brand.palette).length > 0)
}

export function isHollywoodEdition (site) {
  return site?.operator === 'universal' && site.brand?.hollywoodEdition === true
}

/**
 * Chrome: the masthead treatment an operator opts into. Where a palette recolors the shared
 * components, a chrome restyles their arrangement — same header markup, different physics. Today
 * one value exists: 'float-glass' (no static bar; a floating glass pill that ducks out of the way
 * while you scroll). Unknown values throw at build time — a typo'd chrome must fail the build,
 * not silently style nothing.
 */
export function hasChrome (site) {
  return Boolean(site?.brand?.chrome)
}

export function chromeCss (site) {
  const chrome = site?.brand?.chrome
  if (!chrome) return null
  if (chrome === 'studio-board') return studioBoardChromeCss(site)
  if (chrome !== 'float-glass') {
    throw new Error(`Unknown brand.chrome "${chrome}" — expected "float-glass" or "studio-board"`)
  }
  return `
/* Float-glass chrome — ${site.brand.name}'s masthead treatment. No static bar: the header
   becomes a fixed, pointer-transparent frame carrying one floating glass pill (logo, nav,
   search). The pill reads as mirror glass — backdrop blur plus a specular top edge — and
   ducks out of view while you scroll down, returning the moment you scroll up, so long
   pages scroll clean. Pages that open on a photographic hero run edge-to-edge underneath
   it (the fireworks reach the very top of the screen); every other page pays the pill
   back with top padding so nothing hides under glass. */

.site-header[data-chrome='float-glass'] {
  position: fixed; inset: 0 0 auto; z-index: 100;
  background: transparent; border-bottom: 0; backdrop-filter: none;
  pointer-events: none;
  transition: transform .5s cubic-bezier(.22, .9, .3, 1), opacity .35s ease;
}
.site-header[data-chrome='float-glass'] .site-header__inner {
  pointer-events: auto;
  margin-top: .8rem; padding-inline: 1rem;
  min-height: 3.9rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper) 46%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(1.7);
  backdrop-filter: blur(16px) saturate(1.7);
  border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
  box-shadow:
    0 12px 34px rgba(0, 0, 0, .30),
    inset 0 1px 0 color-mix(in srgb, var(--ink) 24%, transparent);
}
/* Once the page has moved the pill thickens — enough glass to keep nav legible over
   running content, still lighter than the bar it replaced. */
.site-header[data-chrome='float-glass'][data-scrolled] .site-header__inner {
  background: color-mix(in srgb, var(--paper) 74%, transparent);
}
/* The duck: scrolling down hands the viewport to the content. Motion-gated — under
   prefers-reduced-motion the pill simply stays put. */
@media (prefers-reduced-motion: no-preference) {
  .site-header[data-chrome='float-glass'][data-hidden] {
    transform: translateY(-130%); opacity: 0;
  }
}

/* The pill is out of the flow, so pages owe themselves the space back — except the ones
   that open on a full-bleed photographic hero (the landing page's fireworks), which run
   to the top of the screen on purpose. The bats marker is home-only; the hero--photo
   case covers any other page whose body genuinely starts with the scene. */
main { padding-top: 5.4rem; }
main:has(> .hero--photo:first-child),
main:has(> .landing-bats:first-child) { padding-top: 0; }

/* Easy scroll: anchors glide instead of jumping, unless the visitor asked stillness. */
@media (prefers-reduced-motion: no-preference) {
  :root { scroll-behavior: smooth; }
}

/* Mobile: the nav sheet drops from the pill as the same glass, not the old opaque slab.
   The pill insets a touch so it still reads as floating, not as a rounded bar. */
@media (max-width: 860px) {
  .site-header[data-chrome='float-glass'] .site-header__inner { margin-inline: .55rem; }
  .site-header[data-chrome='float-glass'] .primary-nav {
    background: color-mix(in srgb, var(--paper) 84%, transparent);
    -webkit-backdrop-filter: blur(18px) saturate(1.6);
    backdrop-filter: blur(18px) saturate(1.6);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    border-radius: 20px;
    margin: .55rem .55rem 0;
    box-shadow: 0 18px 44px rgba(0, 0, 0, .34);
  }
}
`
}

/** Studio-board chrome: a rectangular, opaque masthead like a production slate board. */
function studioBoardChromeCss (site) {
  return `
/* Studio-board chrome — ${site.brand.name}'s masthead. Opaque and rectangular (no glass, no
   blur, no pill): a navy slate board with a gold head rule and a clapper-stripe edge. Stays
   in flow and sticky, so mobile nav and anchors behave as in the base stylesheet. */
.site-header[data-chrome='studio-board'] {
  background: var(--surface); backdrop-filter: none; -webkit-backdrop-filter: none;
  border-bottom: 3px solid var(--accent);
  box-shadow: 0 6px 0 -3px var(--paper);
}
.site-header[data-chrome='studio-board']::after {
  content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 7px;
  pointer-events: none;
  background: repeating-linear-gradient(115deg,
    var(--accent) 0 14px, var(--paper) 14px 28px);
}
.site-header[data-chrome='studio-board'] .site-header__inner { border-radius: 0; }
.site-header[data-chrome='studio-board'] .brandmark__mark {
  border-radius: 0; background: var(--accent); color: var(--paper);
}
.site-header[data-chrome='studio-board'] .primary-nav a { border-radius: 0; }
@media (max-width: 860px) {
  .site-header[data-chrome='studio-board'] .primary-nav {
    background: var(--surface); border-radius: 0;
    border-top: 1px solid var(--line-strong);
  }
}
`
}

/**
 * The operator's ground color, for <meta name="theme-color">. Falls back to the house paper the
 * header previously hardcoded, so operators without a palette keep today's address-bar tint.
 */
export function palettePaper (site) {
  return hasPalette(site) ? site.brand.palette.paper : null
}

/**
 * Render the override stylesheet. Every declared key must be a known token — an unrecognized key
 * would silently style nothing, which is the one failure mode this file exists to prevent.
 */
export function paletteCss (site) {
  if (!hasPalette(site)) return null
  const palette = site.brand.palette
  const unknown = Object.keys(palette).filter((k) => !(k in PALETTE_TOKENS))
  if (unknown.length) {
    throw new Error(`brand.palette has unknown token${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`)
  }
  const missing = Object.keys(PALETTE_TOKENS).filter((k) => !(k in palette))
  if (missing.length) {
    throw new Error(`brand.palette is missing token${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`)
  }
  const lines = Object.entries(PALETTE_TOKENS).map(([key, cssName]) => `  ${cssName}: ${palette[key]};`)

  // Per-operator display face: a self-hosted OFL webfont, declared and wired through the
  // existing --font-display token, so a face swap never touches the shared stylesheet.
  const font = site.brand.font
  if (font) {
    lines.push(`  --font-display: '${font.family}', ${font.fallback};`)
  }

  let css = `/* Operator palette — ${site.brand.name}. Generated from data/${site.operator}/site.json at\n` +
    `   build time; overrides the house tokens in main.css. Order matters: main.css, this, print.css. */\n` +
    (font ? `@font-face {\n  font-family: '${font.family}';\n  font-style: normal;\n  font-weight: ${font.weight};\n  font-display: swap;\n  src: url('${font.file}') format('${font.format}');\n}\n\n` : '') +
    `:root {\n${lines.join('\n')}\n}\n`

  // The steel motif: trackline rules, marquee bulbs, spec-plate data styling. Emitted only for
  // operators that opt in — coaster-park identity without a shared-template branch.
  if (site.brand.motif === 'trackline') {
    css += `
/* Trackline motif — ${site.brand.name}'s visual signature. The rule under every section
   title is a track: a rail bar, a gap, and a wheel dot. The hero carries a marquee bulb
   strip that chases only when motion is welcome. Cards read as spec plates. */
.band__head h2::after, .hero__title::after {
  content: ''; display: block; width: 4.6rem; height: 3px; margin-top: var(--space-3);
  background: linear-gradient(90deg,
    var(--accent) 0 2.2rem,
    transparent 2.2rem 2.85rem,
    var(--accent-2) 2.85rem 3rem,
    transparent 3rem);
}

.hero:not(.hero--photo)::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; z-index: 2;
  /* Two spacings layered — ride lighting is irregular, and irregular reads as texture
     where a uniform strip reads as a pier arcade. */
  background-image:
    radial-gradient(circle at 6px 5px, var(--accent) 0 2.2px, transparent 2.9px),
    radial-gradient(circle at 17px 5px, var(--accent-2) 0 1.8px, transparent 2.5px);
  background-size: 26px 10px, 19px 10px;
  opacity: .55;
}
@media (prefers-reduced-motion: no-preference) {
  .hero:not(.hero--photo)::before { animation: trackline-marquee 2.4s linear infinite; }
  @keyframes trackline-marquee { to { background-position: 26px 0, 19px 0; } }
}

/* Single-weight display face: normalize the serif-era weights and spacing.
   Balance the rag — a stacked poster headline wants composed breaks, not accidents. */
h1, h2, h3, .hero__title, .brandmark__name, .brandmark__name * { font-weight: 400; letter-spacing: 0; }
.hero__title { text-transform: uppercase; line-height: .96; letter-spacing: .012em; text-wrap: balance; }
.band__head h2 { text-transform: uppercase; letter-spacing: .012em; }

/* Signal red is strictly interactive; data reads as deep white, never as an alert.
   The 800 weights come from multi-weight display faces — under a single-weight face
   they only trigger synthetic bold. */
.hero__meta-value { color: var(--ink); }
.stat-row__value, .food-card__price { color: var(--ink); font-weight: 400; }

/* Spec plates: data reads as engineering. */
.card { border-top: 3px solid var(--accent); }
.card__meta { font-family: var(--font-mono); font-size: .66rem; letter-spacing: .05em; text-transform: uppercase; }
.card__badges { font-family: var(--font-mono); font-size: .68rem; }
.data-table th { font-family: var(--font-mono); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; }

::selection { background: var(--accent); color: #241a08; }
`
  }
  if (site.brand.motif === 'studio-call-sheet') {
    css += `
/* Studio call-sheet motif — ${site.brand.name}'s visual signature. Five treatments: slate-stripe
   section rules, film-frame card and photo edges, call-sheet data labels, a gold slate-number
   marker on kickers, and ruled call-sheet tables. No monospace; labels use the display face. */

/* 1. Slate-stripe section rule: a clapper bar under every section title. */
.band__head h2::after, .hero__title::after {
  content: ''; display: block; width: 5.5rem; height: 8px; margin-top: var(--space-3);
  background: repeating-linear-gradient(115deg, var(--accent) 0 9px, var(--paper) 9px 18px);
  border-block: 1px solid var(--accent);
}

/* Single-weight condensed display face. */
h1, h2, h3, .hero__title, .brandmark__name { font-weight: 400; letter-spacing: .02em; font-synthesis: none; }
.hero__title, .band__head h2 { text-transform: uppercase; line-height: 1; text-wrap: balance; }

/* 2. Film-frame edges: square corners, a gold frame line, sprocket-hole ticks top and bottom. */
.card { border-radius: 0; border: 1px solid var(--line-strong); border-top: 3px solid var(--accent); }
.card__media {
  position: relative; border-radius: 0;
}
.photo-band__media { border-radius: 0; }
.card__media::before, .card__media::after {
  content: ''; position: absolute; left: 0; right: 0; height: 7px; z-index: 2; pointer-events: none;
  background: repeating-linear-gradient(90deg, var(--paper) 0 7px, transparent 7px 15px);
  opacity: .9;
}
.card__media::before { top: 0; }
.card__media::after { bottom: 0; }
.card__photo, .card__photo img { border-radius: 0; }
.hero__photo, .photo-band__photo { border-radius: 0; }
.photo-band__media { border-block: 4px solid var(--accent); }

/* 3. Call-sheet data labels: display face, small but readable, tracked caps. */
.kicker, .card__eyebrow, .card__meta, .card__badges, .hero__eyebrow, .hero__meta-label,
.stat-row__label, .brandmark__tag, .facts dt, .data-table th {
  font-family: var(--font-display); font-weight: 400;
  font-size: max(.95rem, 1em); letter-spacing: .09em; text-transform: uppercase;
}
.brandmark__tag { font-size: .9rem; }
.hero__meta-value, .stat-row__value, .food-card__price { font-weight: 400; font-synthesis: none; }
.haunt-card__state, .toc li::before, .search-panel__close {
  font-family: var(--font-display); font-weight: 400; font-size: 1rem; letter-spacing: .08em;
}
.pill--price, code { font-family: var(--font-sans); }
.hrg-specs .facts { border-radius: 0; border-top: 4px solid var(--accent); }
.hrg-specs .facts__row { border-bottom-color: var(--line-strong); }

/* Head-to-head call sheet and signed-off verdict; markup opts in separately. */
.hrg-head-to-head { border-top: 4px solid var(--accent); }
.hrg-head-to-head thead th { background: var(--surface-3); color: var(--ink); font-size: 1.15rem; }
.hrg-head-to-head tbody th { background: var(--surface); color: var(--accent-2); }
.hrg-head-to-head tbody tr:nth-child(even) td { background: var(--surface-2); }
.hrg-head-to-head td { vertical-align: top; color: var(--ink-2); }
.hrg-head-to-head .winner-flag {
  border: 1px solid var(--accent); padding: .15rem .5rem; color: var(--accent-2);
  font-family: var(--font-display); font-size: 1rem; font-weight: 400; letter-spacing: .09em;
}
.hrg-verdict {
  position: relative; background: var(--surface-2); color: var(--ink);
  border: 1px solid var(--line-strong); border-left: 5px solid var(--accent); border-radius: 0;
}
.hrg-verdict::before {
  content: ''; display: block; height: 7px; width: 5rem; margin-bottom: 1rem;
  background: repeating-linear-gradient(115deg, var(--accent) 0 9px, var(--paper) 9px 18px);
}
.hrg-verdict h2 { color: var(--accent-2); font-size: 1.7rem; text-transform: uppercase; letter-spacing: .06em; }
.hrg-verdict p { color: var(--ink-2); }
.hrg-verdict .verdict-box__short { color: var(--ink); font-weight: 600; }
@media (max-width: 640px) {
  .hrg-head-to-head tbody th { padding: .75rem 1rem; }
  .hrg-head-to-head tbody td { display: block; padding: .75rem 1rem; }
  .hrg-head-to-head tbody td::before {
    display: block; margin-bottom: .5rem; font-family: var(--font-display);
    font-size: 1.1rem; font-weight: 400; letter-spacing: .07em;
  }
}

/* 4. Slate-number marker: kickers carry a gold board tab. */
.kicker::before, .hero__eyebrow::before {
  content: ''; display: inline-block; width: .55rem; height: .55rem; margin-right: .55rem;
  background: var(--accent); transform: skewX(-20deg);
}

/* 5. Ruled call-sheet tables: gold head rule, strong row lines. */
.data-table th { border-bottom: 2px solid var(--accent); }
.data-table td, .data-table tbody th { border-bottom: 1px solid var(--line-strong); }

.btn { border-radius: 0; }
::selection { background: var(--accent); color: var(--paper); }

/* Opening call sheet: destination choice first, not the sisters' photographic hero. */
.hero--hrg-home { background: linear-gradient(120deg, var(--surface-2), var(--paper)); border-bottom: 1px solid var(--line-strong); }
.hero--hrg-home .hero__inner { grid-template-columns: 1fr; }
.hero--hrg-home .hero__title { max-width: 24ch; font-size: clamp(3.2rem, 6vw, 5.6rem); }
.hrg-destinations { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-block: 1.5rem; }
.hrg-destination {
  display: block; border: 1px solid var(--line-strong); border-left: 4px solid var(--accent);
  background: var(--surface); padding: 1.5rem; color: var(--ink); text-decoration: none;
}
.hrg-destination h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); text-transform: uppercase; }
.hrg-destination p { margin-top: .6rem; color: var(--ink-2); font-size: 1rem; }
.hrg-destination:hover { border-color: var(--accent); background: var(--surface-2); }
.hrg-destination:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }
.hrg-network ul { display: flex; flex-wrap: wrap; gap: 1rem 2rem; list-style: none; padding: 0; }
.hrg-network a { display: inline-block; padding-block: .5rem; text-underline-offset: .25em; }
@media (max-width: 860px) {
  .hero--hrg-home .hero__inner { grid-template-columns: 1fr; }
  .hero--hrg-home .hero__title { max-width: 19ch; }
  .hrg-destinations { grid-template-columns: 1fr; }
}

`
  }
  if (site.brand.motif === 'studio-call-sheet' && isHollywoodEdition(site)) {
    css += `
/* Park templates: quiet sections, sentence-case labels, no added directional decoration. */
.hrg-park-page .hero__title, .hrg-park-page .band__head h2,
.hrg-park-page .hero__eyebrow, .hrg-park-page .hero__meta-label,
.hrg-park-page .kicker, .hrg-park-page .card__eyebrow, .hrg-park-page .card__meta,
.hrg-park-page .facts dt, .hrg-park-page .data-table th {
  text-transform: none; letter-spacing: normal;
}
.hrg-park-page .band__head h2::after { display: none; }
.hrg-park-page .card { border-top-width: 1px; }
.hrg-park-page .link-tile__chev { display: none; }
.hrg-park-page .hero__meta, .hrg-park-page .split > * { min-width: 0; }
.hrg-park-page .table-wrap { max-width: 100%; overflow-x: auto; }

/* Park hub: call-sheet slate under the park name. */
.hrg-park-slate {
  display: flex; flex-wrap: wrap; width: fit-content; max-width: 100%; margin: var(--space-4) 0 var(--space-2);
  background: var(--surface); color: var(--ink); border: 1px solid var(--line-strong); border-top: 8px solid var(--accent);
}
.hrg-park-slate > div { padding: .75rem 1.25rem; min-width: 9rem; }
.hrg-park-slate > div + div { border-left: 1px solid var(--line-strong); }
.hrg-park-slate dt { font-family: var(--font-display); font-size: 1.05rem; letter-spacing: normal; text-transform: none; color: var(--ink-2); }
.hrg-park-slate dd { margin: 0; font-family: var(--font-display); font-size: 1.9rem; line-height: 1.1; font-weight: 400; }
@media (max-width: 640px) {
  .hrg-park-slate { width: 100%; }
  .hrg-park-slate > div { flex: 1 1 100%; }
  .hrg-park-slate > div + div { border-left: 0; border-top: 1px solid var(--line-strong); }
}

/* Rides list: running order, name first and a fixed height column. */
.hrg-running-order { table-layout: fixed; width: 100%; min-width: 60rem; }
.hrg-running-order th:nth-child(1) { width: 26%; }
.hrg-running-order th:nth-child(2) { width: 9rem; }
.hrg-running-order thead th { font-family: var(--font-sans); font-size: .875rem; font-weight: 600; }
.hrg-running-order tbody th { font-size: 1.2rem; }
.hrg-running-order td, .hrg-running-order tbody th { overflow-wrap: anywhere; vertical-align: top; }
.hrg-running-order td:nth-child(2) { width: 9rem; }
.hrg-running-order td:nth-child(2) > span {
  display: inline-block; max-width: 100%; padding: .35rem .5rem;
  border: 1px solid var(--line-strong); background: var(--surface-2); white-space: normal;
}
.hrg-running-order tbody th a { color: var(--ink); font-weight: 400; text-underline-offset: .2em; }
.hrg-height-rule { border: 1px solid var(--line-strong); background: var(--surface-2); padding: .35rem .5rem; }
.hrg-height-rule summary { cursor: pointer; }
.hrg-height-rule summary:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.hrg-height-rule[open] .small { margin-top: .5rem; text-align: left; }
.hrg-running-order tbody tr:hover > * { background: var(--surface-2); }
@media (max-width: 760px) {
  .hrg-running-order { min-width: 0; display: block; }
  .hrg-running-order caption { display: block; width: 100%; }
  .hrg-running-order thead { display: block; }
  .hrg-running-order thead tr { display: flex; flex-wrap: wrap; gap: .25rem .75rem; padding: .5rem 0; border-bottom: 2px solid var(--accent); }
  .hrg-running-order thead th:nth-child(n) { display: block; width: auto; border: 0; padding: .25rem 0; }
  .hrg-running-order tbody { display: block; }
  .hrg-running-order tbody tr {
    display: grid; grid-template-columns: minmax(0, 1fr) 9rem; column-gap: var(--space-3); align-items: start; padding: var(--space-3) 0;
  }
  .hrg-running-order tbody th:nth-child(1) { grid-column: 1; grid-row: 1; min-width: 0; width: auto; padding: .2rem 0; }
  .hrg-running-order tbody td { min-width: 0; padding: .2rem 0; justify-content: flex-start; flex-wrap: wrap; gap: .25rem .75rem; }
  .hrg-running-order tbody td:nth-child(2) { grid-column: 2; grid-row: 1; width: auto; justify-content: flex-start; text-align: left; }
  .hrg-running-order tbody td:nth-child(2)::before { display: none; }
  .hrg-running-order tbody td:nth-child(n+3) { grid-column: 1 / -1; }
  .hrg-running-order tbody td::before { text-transform: none; letter-spacing: normal; font-weight: 400; }
}

/* Land page: compact location header, then the running-order axis for the land's attractions. */
.hrg-land-page .hero--compact { padding-block: var(--space-5) var(--space-4); }
.hrg-land-page .hero__title { font-size: clamp(2.2rem, 4vw, 3.2rem); }
.hrg-land-page .hero__lede { margin-top: var(--space-3); }
.hrg-land-page .hero__meta { margin-top: var(--space-3); gap: .5rem 1.75rem; }
.hrg-land-page .hero__meta-label { font-size: 1rem; }
.hrg-running-list { max-width: 100%; border-top: 2px solid var(--accent); }
.hrg-running-list .inline-attraction { padding: var(--space-4) 0; border-bottom: 1px solid var(--line-strong); }
.hrg-running-list .inline-attraction__head {
  display: grid; grid-template-columns: minmax(0, 1fr) 9rem; column-gap: var(--space-4); align-items: start;
}
.hrg-running-list .inline-attraction__head h3 { min-width: 0; font-size: 1.6rem; overflow-wrap: anywhere; }
.hrg-running-list .inline-attraction__head > :not(h3) { grid-column: 2; min-width: 0; max-width: 100%; display: flex; flex-wrap: wrap; gap: .25rem; white-space: normal; overflow-wrap: anywhere; }
.hrg-running-list .inline-attraction__meta, .hrg-running-list .inline-attraction__summary,
.hrg-running-list .inline-attraction__body, .hrg-running-list .inline-attraction__tips,
.hrg-running-list .inline-attraction__more { max-width: 100%; padding-right: calc(9rem + var(--space-4)); overflow-wrap: anywhere; }
@media (max-width: 640px) {
  .hrg-running-list .inline-attraction__head { grid-template-columns: minmax(0, 1fr) 9rem; column-gap: var(--space-3); }
  .hrg-running-list .inline-attraction__meta, .hrg-running-list .inline-attraction__summary,
  .hrg-running-list .inline-attraction__body, .hrg-running-list .inline-attraction__tips,
  .hrg-running-list .inline-attraction__more { padding-right: 0; }
}

/* Live waits and weather: departure board. Scoped to park pages; existing markup only. */
.hrg-park-page .live-wait-placeholder {
  margin: 0 0 var(--space-4); padding: .75rem 1rem; color: var(--ink-2); font-size: 1rem;
  border: 1px solid var(--line-strong); border-left: 4px solid var(--line-strong); background: var(--surface);
}
.hrg-park-page [data-live-status="error"] .live-wait-placeholder { border-left-color: var(--accent); border-style: dashed; border-left-style: solid; }
.hrg-park-page [data-live-status="loaded"] .live-wait-placeholder { display: none; }
.hrg-park-page .live-wait-grid {
  background: var(--surface); color: var(--ink); border: 1px solid var(--line-strong); border-top: 4px solid var(--accent);
  border-radius: 0; padding: var(--space-4); margin-bottom: var(--space-4); min-width: 0;
}
.hrg-park-page .live-wait-header { font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; letter-spacing: normal; text-transform: none; margin: 0 0 .25rem; overflow-wrap: anywhere; }
.hrg-park-page .live-wait-meta { display: flex; align-items: center; margin: 0 0 var(--space-3); color: var(--ink-2); font-size: .95rem; letter-spacing: normal; text-transform: none; }
.hrg-park-page .live-indicator { flex: none; width: .5rem; height: .5rem; border-radius: 0; background: var(--ink-2); animation: none; margin-right: .5rem; }
.hrg-park-page .live-wait-list { border-top: 1px solid var(--line-strong); }
.hrg-park-page .live-wait-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; column-gap: var(--space-3); padding: .6rem 0; border-bottom: 1px solid var(--line-strong); }
.hrg-park-page .live-wait-item:last-child { border-bottom: 0; }
.hrg-park-page .live-wait-item .ride-name { padding-right: 0; min-width: 0; font-size: 1rem; line-height: 1.3; overflow-wrap: anywhere; }
.hrg-park-page .live-wait-item .wait-time {
  min-width: 4.5rem; text-align: right; font-family: var(--font-display); font-weight: 400; font-size: 1.9rem; line-height: 1;
  font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1; color: var(--ink);
}
.hrg-park-page .wait-time.wait-low, .hrg-park-page .wait-time.wait-medium, .hrg-park-page .wait-time.wait-high { color: var(--ink); }
.hrg-park-page .wait-time.wait-high { text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 3px; text-underline-offset: .2em; }
.hrg-park-page .wait-time.wait-unknown { color: var(--ink-2); font-size: 1.3rem; }
.hrg-park-page .live-wait-footer { margin: var(--space-3) 0 0; color: var(--ink-2); font-size: .95rem; letter-spacing: normal; text-transform: none; }
.hrg-park-page .live-weather {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem var(--space-3); min-width: 0; padding: .75rem 1rem; margin-bottom: var(--space-4);
  background: var(--surface); border: 1px solid var(--line-strong); border-left: 4px solid var(--accent); color: var(--ink); font-size: 1rem;
}
.hrg-park-page .live-weather .weather-icon { flex: none; font-size: 1.25rem; }
.hrg-park-page .live-weather .weather-desc { flex: 1 1 8rem; min-width: 0; overflow-wrap: anywhere; }
.hrg-park-page .live-weather .weather-range {
  margin-left: auto; font-family: var(--font-display); font-size: 1.6rem; font-weight: 400; line-height: 1; white-space: nowrap;
  font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;
}

/* Restaurant page: price after the name, verdict as one signed block, quiet chips. */
.hrg-dining-price { margin: var(--space-3) 0 var(--space-2); }
.hrg-dining-price__figure {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.2rem); line-height: 1;
  color: var(--ink); font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;
}
.hrg-dining-price__note { margin: .35rem 0 0; color: var(--ink-2); font-size: 1rem; font-variant-numeric: tabular-nums lining-nums; }
.hrg-dining-tags { display: flex; flex-wrap: wrap; gap: .4rem; list-style: none; margin: .75rem 0 0; padding: 0; }
.hrg-dining-tags li {
  padding: .2rem .6rem; border: 1px solid var(--line-strong); background: var(--surface-2);
  color: var(--ink-2); font-family: var(--font-sans); font-size: .875rem; letter-spacing: normal; text-transform: none;
}
.hrg-dining-page .hrg-dining-verdict {
  background: var(--surface-2); color: var(--ink); border: 1px solid var(--line-strong);
  border-left: 5px solid var(--accent); border-radius: 0; max-width: 46rem;
}
.hrg-dining-page .hrg-dining-verdict h2 { color: var(--accent-2); font-size: 1.7rem; text-transform: none; letter-spacing: normal; }
.hrg-dining-page .hrg-dining-verdict .verdict-box__short { color: var(--ink); font-weight: 600; }
.hrg-dining-page .doc-section h2, .hrg-dining-page .tips__title { color: var(--ink-2); }

/* Dining hub: name first, then a fixed price axis. */
.hrg-dining-table { table-layout: fixed; width: 100%; min-width: 56rem; }
.hrg-dining-table th:nth-child(1) { width: 28%; }
.hrg-dining-table th:nth-child(2), .hrg-dining-table td:nth-child(2) { width: 7.5rem; }
.hrg-dining-table thead th { font-family: var(--font-sans); font-size: .875rem; font-weight: 600; }
.hrg-dining-table tbody th { font-size: 1.2rem; font-weight: 400; overflow-wrap: anywhere; vertical-align: top; }
.hrg-dining-table tbody th a { color: var(--ink); text-underline-offset: .2em; }
.hrg-dining-table td { overflow-wrap: anywhere; vertical-align: top; }
.hrg-dining-table td:nth-child(2) {
  font-family: var(--font-display); font-size: 1.5rem; line-height: 1.1; text-align: center; color: var(--ink);
  font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;
}
.hrg-dining-service {
  display: inline-block; max-width: 100%; padding: .2rem .55rem; border: 1px solid var(--line-strong);
  background: var(--surface-2); color: var(--ink-2); font-size: .875rem; white-space: normal;
}
.hrg-dining-table tbody tr:hover > * { background: var(--surface-2); }
.hrg-dining-hub .card-grid { min-width: 0; }

/* Shared cards, Universal edition only. */
.hrg-snacks-page .hero__title, .hrg-snacks-page .band__head h2, .hrg-snacks-page .hero__eyebrow,
.hrg-snacks-page .hero__meta-label, .hrg-snacks-page .kicker, .hrg-snacks-page .data-table th {
  text-transform: none; letter-spacing: normal;
}
.hrg-snacks-page .band__head h2::after { display: none; }
.hrg-snacks-page .table-wrap { max-width: 100%; overflow-x: auto; }
.hrg-food-card .food-card__head { display: grid; grid-template-columns: minmax(0, 1fr) 6.5rem; column-gap: var(--space-3); align-items: start; }
.hrg-food-card .food-card__head > div { min-width: 0; overflow-wrap: anywhere; }
.hrg-food-card .food-card__price {
  text-align: right; white-space: normal; overflow-wrap: anywhere; font-family: var(--font-display); font-weight: 400; font-size: 1.7rem; line-height: 1.05;
  color: var(--ink); font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;
}
.hrg-food-card .pill, .hrg-dining-card .pill {
  border: 1px solid var(--line-strong); border-radius: 0; background: var(--surface-2); color: var(--ink-2);
  text-transform: none; letter-spacing: normal; font-family: var(--font-sans); font-size: .875rem;
  white-space: normal; max-width: 100%; overflow-wrap: anywhere;
}
.hrg-dining-card {
  min-width: 0; overflow-wrap: anywhere; display: grid;
  grid-template-columns: minmax(0, 1fr) 6.5rem; align-content: start;
}
.hrg-dining-card > * { grid-column: 1 / -1; min-width: 0; }
.hrg-dining-card .card__title { grid-column: 1; grid-row: 1; }
.hrg-dining-card .card__eyebrow { grid-row: 2; text-transform: none; letter-spacing: normal; }
.hrg-dining-card .card__meta, .hrg-dining-card .card__badges { text-transform: none; letter-spacing: normal; }
.hrg-dining-card .card__meta span { text-transform: none; letter-spacing: normal; font-family: var(--font-sans); font-size: .8rem; }
.hrg-dining-card .card__meta strong { font-family: var(--font-sans); font-size: .875rem; font-weight: 500; line-height: 1.4; }
.hrg-dining-card__price {
  grid-column: 2; grid-row: 1; text-align: right; margin: 0; font-family: var(--font-display); font-size: 2rem; line-height: 1; color: var(--ink);
  font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;
}

/* Food tracker: quiet labels; state marks that never depend on colour or card opacity. */
.hrg-food-tracker .hero__title, .hrg-food-tracker .band__head h2, .hrg-food-tracker .hero__eyebrow,
.hrg-food-tracker .hero__meta-label, .hrg-food-tracker .kicker, .hrg-food-tracker .filter-bar label,
.hrg-food-tracker .tracker-progress__label, .hrg-food-tracker .data-table th {
  text-transform: none; letter-spacing: normal;
}
.hrg-food-tracker .band__head h2::after { display: none; }
.hrg-food-tracker .tracker-progress__count { font-weight: 400; letter-spacing: normal; font-variant-numeric: tabular-nums lining-nums; }
.hrg-food-tracker .tracker-progress__label { font-size: .95rem; color: var(--ink-2); }
.hrg-food-tracker .filter-bar label { font-size: 1rem; font-weight: 400; color: var(--ink-2); }
.hrg-food-tracker .filter-bar, .hrg-food-tracker .tracker-actions { min-width: 0; max-width: 100%; }
.hrg-food-tracker .filter-bar .chip { text-transform: none; letter-spacing: normal; max-width: 100%; white-space: normal; }
.hrg-food-tracker .filter-bar .field-inline, .hrg-food-tracker .filter-bar input { max-width: 100%; min-width: 0; }
.hrg-food-tracker .tracker-bar { border-radius: 0; border-bottom: 1px solid var(--line-strong); }
.hrg-food-card { border-radius: 0; opacity: 1; }
.hrg-food-card[data-state="want"] { border: 2px solid var(--accent); box-shadow: inset 6px 0 0 var(--accent); }
.hrg-food-card[data-state="tried"] {
  border: 1px solid var(--line-strong); background: var(--surface-2); box-shadow: inset 0 3px 6px rgba(0, 0, 0, .28);
}
.hrg-food-card[data-state="skip"] { opacity: 1; border: 2px dashed var(--line-strong); background: var(--surface); }
.hrg-food-card[data-state="skip"] .food-card__name { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--ink-2); }
.hrg-food-card .tracker button { border-radius: 0; font-size: .875rem; text-transform: none; letter-spacing: normal; }
.hrg-food-card .tracker button[aria-pressed="true"] { border-width: 2px; font-weight: 700; text-decoration: underline; text-underline-offset: .2em; color: var(--ink); }
.hrg-food-card .tracker button[aria-pressed="true"][data-track="want"] { background: var(--accent-soft); border-color: var(--accent); }
.hrg-food-card .tracker button[aria-pressed="true"][data-track="tried"] { background: var(--surface-3); border-color: var(--ink-2); box-shadow: inset 0 2px 4px rgba(0, 0, 0, .3); }
.hrg-food-card .tracker button[aria-pressed="true"][data-track="skip"] { background: var(--surface); border-style: dashed; border-color: var(--ink-2); }
.hrg-food-card .tracker button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 760px) {
  .hrg-food-tracker .tracker-bar { position: static; }
}
@media (max-width: 760px) {
  .hrg-dining-table { min-width: 0; display: block; }
  .hrg-dining-table caption { display: block; width: 100%; }
  .hrg-dining-table thead { display: block; }
  .hrg-dining-table thead tr { display: flex; flex-wrap: wrap; gap: .25rem .75rem; padding: .5rem 0; border-bottom: 2px solid var(--accent); }
  .hrg-dining-table thead th:nth-child(n) { display: block; width: auto; border: 0; padding: .25rem 0; }
  .hrg-dining-table tbody { display: block; }
  .hrg-dining-table tbody tr {
    display: grid; grid-template-columns: minmax(0, 1fr) 6rem; column-gap: var(--space-3); align-items: start; padding: var(--space-3) 0;
  }
  .hrg-dining-table tbody th:nth-child(1) { grid-column: 1; grid-row: 1; min-width: 0; width: auto; padding: .2rem 0; }
  .hrg-dining-table tbody td { min-width: 0; padding: .2rem 0; justify-content: flex-start; flex-wrap: wrap; gap: .25rem .75rem; }
  .hrg-dining-table tbody td:nth-child(2) { grid-column: 2; grid-row: 1; width: auto; text-align: right; }
  .hrg-dining-table tbody td:nth-child(2)::before { display: none; }
  .hrg-dining-table tbody td:nth-child(n+3) { grid-column: 1 / -1; }
  .hrg-dining-table tbody td::before { text-transform: none; letter-spacing: normal; font-weight: 400; }
}

/* Group 1 shared components. Scoped to html.hrg-edition; screen only so print.css keeps paper rules. */
@media screen {
.hrg-edition .breadcrumbs a { text-underline-offset: .2em; }
.hrg-edition .callout, .hrg-edition .keypoints, .hrg-edition .tips, .hrg-edition .affiliate,
.hrg-edition .toc, .hrg-edition .faq__item, .hrg-edition .link-tile, .hrg-edition .verdict { border-radius: 0; }
.hrg-edition .callout, .hrg-edition .keypoints, .hrg-edition .tips { border: 1px solid var(--line-strong); border-left: 5px solid var(--accent); background: var(--surface-2); }
.hrg-edition .callout--warning { border-left-style: double; border-left-width: 7px; }
.hrg-edition .keypoints__title, .hrg-edition .tips__title, .hrg-edition .toc__title, .hrg-edition .faq__title { text-transform: none; letter-spacing: normal; }
.hrg-edition .toc { border: 1px solid var(--line-strong); border-top: 3px solid var(--accent); background: var(--surface); }
.hrg-edition .faq__item { border: 1px solid var(--line-strong); }
.hrg-edition .faq__item summary:focus-visible, .hrg-edition .link-tile:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.hrg-edition .table-wrap { max-width: 100%; overflow-x: auto; }
.hrg-edition .facts { border-radius: 0; }
.hrg-edition .facts dt, .hrg-edition .data-table th, .hrg-edition .verified { text-transform: none; letter-spacing: normal; }
.hrg-edition .facts dt { font-family: var(--font-sans); }
.hrg-edition .facts dd, .hrg-edition .data-table td { overflow-wrap: anywhere; }
.hrg-edition .data-table thead th { font-family: var(--font-sans); background: var(--surface-2); color: var(--ink-2); }
.hrg-edition .pill { border-radius: 0; text-transform: none; letter-spacing: normal; border: 1px solid var(--line-strong); }
.hrg-edition .hbadge { border-radius: 0; border: 1px solid var(--line-strong); background: var(--surface-2); }
.hrg-edition .hbadge strong { color: var(--ink); }
.hrg-edition .hbadge--tall { border-width: 2px; }
.hrg-edition .hbadge--mid { border-style: dashed; }
.hrg-edition .meter__track, .hrg-edition .meter__fill { border-radius: 0; }
.hrg-edition .meter__track { border: 1px solid var(--line-strong); }
.hrg-edition .meter__fill { background: var(--ink); }
.hrg-edition .grade { border-radius: 0; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); }
.hrg-edition .grade--great { border-width: 3px; }
.hrg-edition .grade--good { border-width: 2px; }
.hrg-edition .grade--mixed { border-style: dashed; }
.hrg-edition .grade--poor { border-style: dotted; border-width: 2px; }
.hrg-edition .verified svg { color: var(--ink-2); }
.hrg-edition .affiliate { border: 1px solid var(--line-strong); border-top: 3px solid var(--accent); background: var(--surface); }
.hrg-edition .link-tile { border: 1px solid var(--line-strong); }
.hrg-edition .link-tile__chev { display: none; }
.hrg-edition .search-panel { border-radius: 0; border: 1px solid var(--line-strong); border-top: 4px solid var(--accent); }
.hrg-edition .search-panel__field { display: grid; grid-template-columns: 1.25rem minmax(0, 1fr) auto; gap: var(--space-2); padding: var(--space-4); }
.hrg-edition .search-panel__field input { min-width: 0; width: 100%; }
.hrg-edition .search-panel__close { white-space: nowrap; font-family: var(--font-sans); text-transform: none; letter-spacing: normal; }
.hrg-edition .search-panel__field input:focus-visible, .hrg-edition .search-panel__close:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

/* Freshness: four greyscale shapes. Labels stay authoritative; stale outranks confirmed. */
.hrg-edition .freshness { border-radius: 0; background: var(--surface-2); border: 1px solid var(--line-strong); border-left: 5px solid var(--ink-2); }
.hrg-edition .freshness__lead strong, .hrg-edition .freshness--good .freshness__lead strong,
.hrg-edition .freshness--warn .freshness__lead strong, .hrg-edition .freshness--danger .freshness__lead strong { color: var(--ink); }
.hrg-edition .freshness__overdue { color: var(--ink); text-decoration: underline; text-underline-offset: .2em; }
.hrg-edition .freshness .freshness__dot { width: .8rem; height: .8rem; border-radius: 0; box-sizing: border-box; background: var(--ink-2); border: 2px solid var(--ink-2); }
.hrg-edition .freshness--good { border-left-style: solid; }
.hrg-edition .freshness--good .freshness__dot { border-radius: 999px; background: var(--ink); border-color: var(--ink); }
.hrg-edition .freshness--warn { border-left-style: dashed; }
.hrg-edition .freshness--warn .freshness__dot { transform: rotate(45deg); background: transparent; border-color: var(--ink); }
.hrg-edition .freshness--muted { border-left-style: dotted; }
.hrg-edition .freshness--muted .freshness__dot { border-radius: 999px; background: transparent; border: 2px dotted var(--ink-2); }
.hrg-edition .freshness--danger, .hrg-edition .freshness--stale { border-left-style: double; border-left-width: 7px; }
.hrg-edition .freshness--danger .freshness__dot, .hrg-edition .freshness--stale .freshness__dot { width: .9rem; height: .9rem; border: 0; border-radius: 0; transform: none; background: var(--ink); clip-path: polygon(50% 0, 100% 100%, 0 100%); }
}

/* Group 2: guides and comparison indexes. Screen only; body classes hrg-guide, hrg-guides-index, hrg-compare-index. */
@media screen {
:is(.hrg-guide, .hrg-guides-index, .hrg-compare-index) :is(.kicker, .hero__meta-label, .card__meta span, .band__head h2) { text-transform: none; letter-spacing: normal; }
.hrg-guide .hero__title, .hrg-guide .hero__eyebrow, .hrg-guide .hero__meta-label, .hrg-guide .band__head h2,
.hrg-guide .doc-section h2, .hrg-guide .kicker, .hrg-guide .facts dt, .hrg-guide .data-table th,
.hrg-guides-index .hero__title, .hrg-guides-index .hero__eyebrow, .hrg-guides-index .band__head h2,
.hrg-guides-index .card__eyebrow, .hrg-guides-index .card__meta,
.hrg-compare-index .hero__title, .hrg-compare-index .hero__eyebrow, .hrg-compare-index .card__eyebrow, .hrg-compare-index .card__meta {
  text-transform: none; letter-spacing: normal;
}
.hrg-guide .band__head h2::after, .hrg-guides-index .band__head h2::after,
.hrg-guide .hero__title::after, .hrg-guides-index .hero__title::after, .hrg-compare-index .hero__title::after { display: none; }
.hrg-guide .link-tile__chev, .hrg-guides-index .link-tile__chev, .hrg-compare-index .link-tile__chev { display: none; }
.hrg-guide .doc-layout > *, .hrg-guide .hero__meta { min-width: 0; }
.hrg-guide .prose, .hrg-guide .doc-section > p, .hrg-guide .rich-list { max-width: 44rem; }
.hrg-guide .doc-section { padding-top: var(--space-4); border-top: 1px solid var(--line-strong); }
.hrg-guide .doc-section h2 { font-size: clamp(1.6rem, 3vw, 2.1rem); }
.hrg-guide .table-wrap { max-width: 100%; overflow-x: auto; }
.hrg-guide .doc-layout__aside .toc { border-top: 3px solid var(--accent); }
.hrg-guides-index .card, .hrg-compare-index .card { border-top-width: 1px; min-width: 0; overflow-wrap: anywhere; }
.hrg-guides-index .card__title, .hrg-compare-index .card__title { font-size: 1.45rem; }
.hrg-guides-index .card__summary, .hrg-compare-index .card__summary { max-width: 38rem; }
.hrg-guides-index .card__title a:focus-visible, .hrg-compare-index .card__title a:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
}

/* Group 3: seasonal pages. Body class hrg-seasonal; screen only. */
@media screen {
.hrg-edition .freshness__lead strong { font-family: var(--font-sans); font-size: 1rem; line-height: 1.4; font-weight: 650; }
.hrg-seasonal .hero__title, .hrg-seasonal .hero__eyebrow, .hrg-seasonal .hero__meta-label, .hrg-seasonal .band__head h2,
.hrg-seasonal .doc-section h2, .hrg-seasonal .kicker, .hrg-seasonal .facts dt, .hrg-seasonal .data-table th,
.hrg-seasonal .card__eyebrow, .hrg-seasonal .card__meta, .hrg-seasonal .card__meta *, .hrg-seasonal .card__badges,
.hrg-seasonal .window-strip__title, .hrg-seasonal .gantt__corner, .hrg-seasonal .gantt__resort,
.hrg-seasonal .verdict__col h3, .hrg-seasonal .editions__meta span, .hrg-seasonal .haunt-card__state {
  text-transform: none; letter-spacing: normal;
}
.hrg-seasonal .band__head h2::after, .hrg-seasonal .hero__title::after, .hrg-seasonal .link-tile__chev { display: none; }
.hrg-seasonal .hero__meta, .hrg-seasonal .split > *, .hrg-seasonal .doc-layout > *, .hrg-seasonal .card { min-width: 0; }
.hrg-seasonal .card { border-top-width: 1px; }
.hrg-seasonal .prose, .hrg-seasonal .doc-section > p { max-width: 44rem; }
.hrg-seasonal .table-wrap, .hrg-seasonal .gantt-wrap { max-width: 100%; overflow-x: auto; }
.hrg-seasonal .window-strip, .hrg-seasonal .editions__item, .hrg-seasonal .give-take__col, .hrg-seasonal .resort-split__col,
.hrg-seasonal .verdict, .hrg-seasonal .verdict__col, .hrg-seasonal .month-card, .hrg-seasonal .timing-controls { border-radius: 0; border: 1px solid var(--line-strong); }
.hrg-seasonal .verdict { background: var(--surface-2); border-left: 5px solid var(--accent); }
.hrg-seasonal .verdict__title { color: var(--accent-2); }
.hrg-seasonal .give-take__col--get h3, .hrg-seasonal .give-take__col--dont h3, .hrg-seasonal .verdict__col--yes h3, .hrg-seasonal .verdict__col--no h3 { color: var(--ink); }
.hrg-seasonal .give-take__col--get svg, .hrg-seasonal .give-take__col--dont svg { stroke: var(--ink); }
.hrg-seasonal .give-take__col--dont { border-left-style: dashed; }
.hrg-seasonal .month-card:hover { transform: none; box-shadow: none; border-color: var(--accent); }
.hrg-seasonal .month-card__level, .hrg-seasonal .price-range__asof { border-radius: 0; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink-2); }
.hrg-seasonal .editions__meta strong, .hrg-seasonal .editions__dates { font-weight: 400; }
/* Gantt: bars keep their positions; fills gain a pattern so the legend reads without colour. */
.hrg-seasonal .gantt { min-width: 0; }
.hrg-seasonal .gantt__head { grid-template-columns: calc(14rem + var(--space-3)) repeat(12, minmax(0, 1fr)); gap: 0; }
.hrg-seasonal .gantt__track { min-width: 0; }
.hrg-seasonal .gantt__key { flex-wrap: wrap; }
@media (max-width: 760px) {
  .hrg-seasonal .gantt__head { grid-template-columns: repeat(12, minmax(0, 1fr)); position: static; }
  .hrg-seasonal .gantt__corner { grid-column: 1 / -1; margin-bottom: var(--space-2); }
  .hrg-seasonal .gantt__row { grid-template-columns: minmax(0, 1fr); gap: var(--space-2); padding-block: var(--space-3); border-top: 1px solid var(--line); }
  .hrg-seasonal .gantt__label { display: flex; flex-wrap: wrap; gap: var(--space-2); }
}
.hrg-seasonal .gantt__bar, .hrg-seasonal .gantt__swatch { border-radius: 0; border: 1px solid var(--ink-2); }
.hrg-seasonal .gantt__bar--confirmed, .hrg-seasonal .gantt__swatch--confirmed { background: var(--ink-2); }
.hrg-seasonal .gantt__bar--expected, .hrg-seasonal .gantt__swatch--expected { background: transparent; border-style: dashed; border-width: 2px; }
.hrg-seasonal .gantt__bar--historical, .hrg-seasonal .gantt__swatch--historical { background: repeating-linear-gradient(115deg, var(--ink-2) 0 2px, transparent 2px 6px); }
.hrg-seasonal .gantt__label a:focus-visible, .hrg-seasonal .month-card:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
}

/* Group 4: park reference pages, parks index, resorts, companies. Body class hrg-park-reference; screen only. */
@media screen {
.hrg-park-reference .hero__title, .hrg-park-reference .hero__eyebrow, .hrg-park-reference .hero__meta-label,
.hrg-park-reference .band__head h2, .hrg-park-reference .doc-section h2, .hrg-park-reference .kicker,
.hrg-park-reference .facts dt, .hrg-park-reference .data-table th, .hrg-park-reference .card__eyebrow,
.hrg-park-reference .card__meta, .hrg-park-reference .card__meta *, .hrg-park-reference .card__badges,
.hrg-park-reference .proscons h4, .hrg-park-reference .map-legend, .hrg-park-reference .rank-item__headline {
  text-transform: none; letter-spacing: normal;
}
.hrg-park-reference .band__head h2::after, .hrg-park-reference .hero__title::after, .hrg-park-reference .link-tile__chev { display: none; }
.hrg-park-reference .hero__meta, .hrg-park-reference .split > *, .hrg-park-reference .card, .hrg-park-reference .rank-item { min-width: 0; }
.hrg-park-reference .card { border-top-width: 1px; }
.hrg-park-reference .prose, .hrg-park-reference .doc-section > p { max-width: 44rem; }
.hrg-park-reference .table-wrap, .hrg-park-reference .parkmap-wrap { max-width: 100%; overflow-x: auto; }
.hrg-park-reference .table-wrap, .hrg-park-reference .parkmap-wrap { border-radius: 0; }
.hrg-park-reference .rank-item { border-radius: 0; border: 1px solid var(--line-strong); border-left: 5px solid var(--accent); }
.hrg-park-reference .rank-item::before { display: none; }
.hrg-park-reference .rank-item__headline { font-style: normal; }
.hrg-park-reference .rank-item__name, .hrg-park-reference .rank-item__num { font-weight: 400; }
.hrg-park-reference .proscons__pro h4, .hrg-park-reference .proscons__con h4 { color: var(--ink); }
.hrg-park-reference .proscons__pro li::before, .hrg-park-reference .proscons__con li::before { color: var(--ink); }
.hrg-park-reference .data-table td:last-child .hbadge, .hrg-park-reference .hbadge { justify-self: end; }
.hrg-edition .data-table td::before { text-transform: none; letter-spacing: normal; }
.hrg-park-reference [data-heights-table] td:nth-child(2) > span[data-value] { font: 400 1.3rem/1.4 var(--font-display); font-variant-numeric: tabular-nums; }
.hrg-park-reference [data-heights-table] td:nth-child(2) .small { display: block; font: .875rem/1.5 var(--font-sans); }
.hrg-park-reference .rank-item__name a:focus-visible, .hrg-park-reference .card__title a:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
}

/* Group 5: tools. Body class hrg-tools (alongside any existing class); screen only. */
@media screen {
.hrg-tools .tool-form, .hrg-tools .tool-form .field-inline { min-width: 0; max-width: 100%; }
.hrg-tools .tool-form .field-inline { border-radius: 0; padding: 0; border: 0; background: none; }
.hrg-tools .tool-form input, .hrg-tools .tool-form select { min-width: 0; max-width: 100%; width: 100%; }
.hrg-tools .tool-form select { padding-inline: .35rem; }
.hrg-tools .tool-checks input { width: 1rem; }
.hrg-tools .hchecker__control { border-radius: 0; border-top: 3px solid var(--accent); background: var(--surface); }
.hrg-tools .hchecker__stat { border-radius: 0; border: 1px solid var(--line-strong); }
.hrg-tools .hchecker__stat b { color: var(--ink); font-weight: 400; font-variant-numeric: tabular-nums; }
.hrg-tools .hchecker__stat span, .hrg-tools .hchecker__unit { text-transform: none; letter-spacing: normal; }
.hrg-tools .hero__title, .hrg-tools .hero__eyebrow, .hrg-tools .hero__meta-label, .hrg-tools .band__head h2,
.hrg-tools .kicker, .hrg-tools .facts dt, .hrg-tools .data-table th, .hrg-tools .card__eyebrow,
.hrg-tools .card__meta, .hrg-tools .card__meta *, .hrg-tools .tool-checks legend, .hrg-tools .rider-watch__eyebrow,
.hrg-tools .ruler__label, .hrg-tools .ruler__state, .hrg-tools .nearmiss__title {
  text-transform: none; letter-spacing: normal;
}
.hrg-tools .band__head h2::after, .hrg-tools .hero__title::after, .hrg-tools .link-tile__chev { display: none; }
.hrg-tools .hero__meta, .hrg-tools .split > *, .hrg-tools .card, .hrg-tools .rider-layout > *, .hrg-tools .tool-sheet > * { min-width: 0; }
.hrg-tools .card { border-top-width: 1px; }
.hrg-tools .table-wrap { max-width: 100%; overflow-x: auto; }
.hrg-tools .tool-sheet, .hrg-tools .rider-form, .hrg-tools .rider-card, .hrg-tools .rider-empty, .hrg-tools .rider-watch,
.hrg-tools .tool-checks, .hrg-tools .plan-steps li, .hrg-tools .haunt-checklist li, .hrg-tools .nearmiss__item { border-radius: 0; border-color: var(--line-strong); }
.hrg-tools .tool-sheet, .hrg-tools .rider-card { border-top: 3px solid var(--accent); }
.hrg-tools .rider-card { border-left: 1px solid var(--line-strong); }
.hrg-tools .tool-form input, .hrg-tools .tool-form select, .hrg-tools .career-control select, .hrg-tools .career-control input { border-radius: 0; }
.hrg-tools .tool-form input:focus-visible, .hrg-tools .tool-form select:focus-visible,
.hrg-tools .career-control select:focus-visible, .hrg-tools .career-control input:focus-visible,
.hrg-tools .tool-checks input:focus-visible, .hrg-tools .haunt-checklist input:focus-visible,
.hrg-tools .career-credit input:focus-visible, .hrg-tools .btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.hrg-tools .tool-output h2, .hrg-tools .tool-output h3, .hrg-tools .rider-card__head h3, .hrg-tools .rider-form__title { font-weight: 400; }
.hrg-tools .plan-steps__time { color: var(--ink); font-weight: 400; font-family: var(--font-display); font-size: 1.1rem; }
.hrg-tools .tool-notes summary, .hrg-tools .rider-card__parks summary { color: var(--ink); text-underline-offset: .2em; }
.hrg-tools .rider-empty { border-style: dashed; }
.hrg-tools .rider-badge { border-radius: 0; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); }
.hrg-tools .rider-badge--now, .hrg-tools .rider-badge--near, .hrg-tools .rider-badge--later, .hrg-tools .rider-badge--unknown { background: var(--surface-2); color: var(--ink); }
.hrg-tools .rider-badge::before, .hrg-tools .rider-badge--now::before { background: var(--ink); }
.hrg-tools .rider-badge--near::before { background: linear-gradient(to right, var(--ink) 50%, transparent 50%); border-color: var(--ink); }
.hrg-tools .rider-badge--later::before { background: transparent; border-color: var(--ink); }
.hrg-tools .rider-badge--unknown::before { background: transparent; border-color: var(--ink); }
.hrg-tools .nearmiss__fill, .hrg-tools .timing-result__fill { border-radius: 0; background: var(--ink); }
.hrg-tools .nearmiss__bar { border-radius: 0; border: 1px solid var(--line-strong); }
.hrg-tools .roi-lines, .hrg-tools .roi-lines strong, .hrg-tools .rider-ladder, .hrg-tools .rider-ladder strong { font-variant-numeric: tabular-nums lining-nums; }
.hrg-tools .hchecker__toast { border-radius: 0; }
@media (max-width: 640px) {
  .hrg-tools .tool-sheet { padding: var(--space-4); }
  .hrg-tools .career-controls, .hrg-tools .rider-card__head { gap: var(--space-2); }
}
}

/* Group 6: legal pages and shared footer chrome. Body class hrg-legal; screen only. */
@media screen {
.hrg-edition .site-footer .brandmark__mark { border-radius: 0; background: var(--accent); color: var(--paper); }
.hrg-edition .site-footer h2, .hrg-edition .site-footer__col h2 { text-transform: none; letter-spacing: normal; }
.hrg-legal .hero__title, .hrg-legal .hero__eyebrow, .hrg-legal .hero__meta-label, .hrg-legal .band__head h2,
.hrg-legal .doc-section h2, .hrg-legal .kicker, .hrg-legal .facts dt, .hrg-legal .data-table th,
.hrg-legal .card__eyebrow, .hrg-legal .card__meta, .hrg-legal .card__meta * { text-transform: none; letter-spacing: normal; }
.hrg-legal .band__head h2::after, .hrg-legal .hero__title::after, .hrg-legal .link-tile__chev { display: none; }
.hrg-legal .hero__meta, .hrg-legal .split > *, .hrg-legal .card { min-width: 0; }
.hrg-legal .legal-page { max-width: 44rem; overflow-wrap: anywhere; }
.hrg-legal .legal-page h2, .hrg-legal .legal-page__updated { text-transform: none; letter-spacing: normal; }
.hrg-legal .callout, .hrg-legal .card, .hrg-legal .facts { border-radius: 0; }
.hrg-legal .card { border-top-width: 1px; }
.hrg-legal .table-wrap { max-width: 100%; overflow-x: auto; }
.hrg-legal a:focus-visible, .hrg-legal .btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.hrg-legal .error-page { max-width: 44rem; }
.hrg-legal .error-page__code { font-family: var(--font-display); font-weight: 400; letter-spacing: normal; color: var(--muted); }
.hrg-legal .error-page .mt-5 { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); }
}
/* The same trust markers on paper; borders survive print.css's background reset. */
@media print {
.hrg-edition .freshness .freshness__dot { width: .8rem; height: .8rem; border: 2px solid var(--ink); border-radius: 50%; transform: none; }
.hrg-edition .freshness--good .freshness__dot { border-width: .4rem; }
.hrg-edition .freshness--warn .freshness__dot { border-radius: 0; transform: rotate(45deg); }
.hrg-edition .freshness--muted .freshness__dot { border-style: dotted; }
.hrg-edition .freshness--danger .freshness__dot, .hrg-edition .freshness--stale .freshness__dot { width: 0; height: 0; border: 0; border-left: .45rem solid transparent; border-right: .45rem solid transparent; border-bottom: .9rem solid var(--ink); border-radius: 0; transform: none; }
}
`
  }
  return css
}
