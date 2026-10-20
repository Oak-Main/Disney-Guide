# Hollywood Ride Guide facelift

## Scope and checkout

Implemented on `replit/hrg-facelift` in a clean original-source Git worktree based on
`origin/main`. All commit paths match the original repository (`src/`, `data/`, `assets/`,
`test/`, `docs/`); no files were moved or renamed. The migrated Replit application and its
preview configuration were not changed. Push status is reported separately with delivery.

The original-source baseline is `/tmp/baseline-dist`. The earlier migrated-app snapshot was
preserved separately at `/tmp/replit-migration-baseline-dist`: it has migration-specific
`status.js` and service-worker output and is not the comparison target for this checkout.

## Changes by file

- `data/universal/site.json`: editable `home` copy map with today's defaults; League Gothic
  declaration; `studio-call-sheet` motif; `studio-board` chrome; edition, network and CSS-cache
  flags. The generic hero photo reference now resolves to the existing Universal backlot
  asset. No other operator's data changed.
- `assets/fonts/league-gothic-latin-400.woff2`: regular 400, normal width, Latin subset,
  **10,436 bytes**, below the 24 KB limit. League Gothic by The League of Moveable Type /
  The League Gothic Project Authors, SIL OFL 1.1.
- `assets/fonts/league-gothic-OFL.txt`: the font's complete OFL licence beside the font.
  Sources: Google Fonts' League Gothic Latin WOFF2 and
  `https://github.com/google/fonts/tree/main/ofl/leaguegothic`. No external runtime font request.
- `src/lib/home-copy.mjs`: complete copy-slot defaults and authored-template character limits;
  named data placeholders; explicit errors for an invalid requested slot or oversized override.
- `src/pages/core.mjs`: reads optional `site.home`; preserves coverage-specific CoasterReady
  wording. Universal opens with existing resort names and taglines as choices below the H1,
  before the lede; then parks, then tools, then the remaining existing sections. The opening
  is typographic rather than the sisters' photographic hero. Cards still read each park's
  `heroImage`. The photo interlude uses the existing Universal lagoon image.
- `src/templates/components.mjs`: optional `hero.afterTitle` insertion point. When absent it
  emits no extra markup or whitespace.
- `src/lib/palette.mjs`: generated operator CSS only. Five signatures: slate-stripe section
  rules, film-frame card/photo edges, tracked display-face data labels, slate-tab kicker
  markers, and ruled data tables. No new monospace styling or animation. Adds the opaque,
  rectangular studio-board masthead; keeps the float-glass output unchanged. Includes
  responsive destination, spec, comparison, verdict and About-network treatments.
- `src/build.mjs`: excludes the two new League Gothic assets unless that font is selected.
  This is essential: the original unconditional asset copy would otherwise add files to
  both sister outputs. Service-worker logic is unchanged.
- `src/templates/layout.mjs`: optional operator-only CSS version, without changing the shared
  asset version; conditional footer-column filtering and the network-column lookup.
  The studio-call-sheet WOFF2 is preloaded before render-blocking stylesheets to prevent the
  late display-font swap. No preload is emitted for either sister's motif.
- `src/lib/ride-specs.mjs`: formats only the eight approved recorded fields. Missing/null/empty
  fields disappear; false remains “No”; zero remains a recorded value. Unknown enum values
  are not converted into an assumed answer.
- `src/pages/park.mjs`: replaces Universal's existing hero-side facts with the data-only spec
  panel. Existing fact-panel titles are reused; historical rides retain recorded/historical
  labelling. No narrative, structured data, or attraction records changed.
- `src/pages/docs.mjs`: opt-in comparison-table and verdict modifiers; original contender
  data, winner labels, captions and editorial verdicts remain unchanged.
- `src/pages/legal.mjs`: About receives the authored network heading and links from the same
  footer-column data when the flag is enabled. Other legal pages do not receive them.
- `test/hrg-facelift.test.mjs`: nine new tests covering copy defaults/limits, brand gates,
  false/zero/missing facts, font assets, homepage ordering/photos, comparison modifiers,
  and About-only network placement.
- `test/operator-palette.test.mjs`: with the owner's explicit exception, the two font-family
  assertions now check each operator's declared family rather than hard-coding Archivo Black.
  No factual expectations or other existing test expectations were changed.
- `docs/HRG-FACELIFT.md`: these implementation, switch-off, copy and owner notes.

No changes to shared `main.css`, browser tools, analytics, JSON-LD builders, URLs,
sitemaps, redirects, service-worker behaviour, validation/factcheck scripts, or protected data.
Universal's normal generated service-worker content hash changes with its HTML/CSS, as intended.

## Switch-off controls

All keys below are in Universal's `site.json`:

| Control | Switch off / default behaviour |
| --- | --- |
| `brand.hollywoodEdition` | Set `false` or remove: original homepage composition and ride facts; no special comparison modifiers. The operator's font, palette and photo declarations remain independent. |
| `brand.motif` | Remove `studio-call-sheet` to stop emitting its CSS. Also disable `hollywoodEdition` when restoring the original layout. |
| `brand.chrome` | Remove to use the shared conventional masthead. Unknown values fail the build. |
| `brand.font` | Remove to restore the house display-font token and omit the new font assets. |
| `brand.assetVersion` | Remove to use the unchanged shared CSS version. Advance this operator-only value when publishing later CSS changes. |
| `brand.networkLinksOnAboutOnly` | Set `false` or remove: restore the network footer column everywhere and remove the extra About section. Independent of the edition flag. |
| `home` | Remove any key, or the whole map: use its exact pre-facelift default. The map uses literal dotted/bracketed keys, not nested objects. |

## Copy-slot inventory

Limits are characters in the authored template, before substitution. Placeholders:
`{parkCount}`, `{foodCount}`, `{guideCount}`, `{month}`, `{shortDisclaimer}`. Counts, names,
dates, links and legal text remain data-derived. CoasterReady's existing coverage-specific
branches are not replaced by the ordinary default lede/intro/tool wording.

The two longest funding slots have 350-character budgets rather than the earlier 310-character
proposal; the existing copy is preserved verbatim, never truncated.

| Key in `home` | Current default template | Max |
| --- | --- | ---: |
| `hero.kicker` | {parkCount} US parks · independent & unofficial | 55 |
| `hero.title` | Know exactly what your family can ride, eat, and skip. | 70 |
| `hero.lede` | Every height requirement, every ride worth queueing for, every snack worth the money — checked, dated, and built to work on park WiFi. No affiliate-driven rankings, no reprinted press releases. | 240 |
| `hero.actions.height` | Check what your kid can ride | 40 |
| `hero.actions.food` | Build a snack list | 40 |
| `hero.stats.attractions` | Attractions documented | 32 |
| `hero.stats.heights` | Height requirements | 32 |
| `hero.stats.food` | Snacks with real prices | 32 |
| `hero.stats.dining` | Places to eat | 32 |
| `hero.reviewLabel` | Seasonal information reviewed | 36 |
| `trust[0].title` | Independent and unofficial | 36 |
| `trust[0].body` | We buy our own tickets. No park pays for a place on this site. | 100 |
| `trust[1].title` | Every fact is dated | 30 |
| `trust[1].body` | Each page carries the month it was checked, and says so when it is overdue. | 110 |
| `trust[2].title` | Rankings are not for sale | 36 |
| `trust[2].body` | Affiliate links exist and are disclosed. They never change an order or a verdict. | 110 |
| `trust[3].title` | Works without signal | 30 |
| `trust[3].body` | The tools keep running on park WiFi, or on none at all. | 100 |
| `parks.title` | Start with your park | 36 |
| `parks.kicker` | The {parkCount} parks | 30 |
| `parks.intro` | Each park hub links to its full ride list, height chart, dining, printable map, accessibility notes, and a first-timer plan you can actually follow. | 190 |
| `tools.title` | Three things we do that a search result cannot | 60 |
| `tools.kicker` | Tools, not listicles | 32 |
| `tools.height.eyebrow` | Interactive | 24 |
| `tools.height.title` | Height Checker | 30 |
| `tools.height.summary` | Drag one slider to your child’s height and see, park by park, the recorded height conditions, rules that need checking and near misses. | 190 |
| `tools.food.eyebrow` | Saves offline | 30 |
| `tools.food.title` | Food Tracker | 30 |
| `tools.food.summary` | Mark {foodCount} snacks as want, tried, or skip. It saves on your device, shares as a link, prints as a checklist, and keeps working when the park WiFi does not. | 210 |
| `tools.maps.eyebrow` | Printable | 24 |
| `tools.maps.title` | Park maps | 30 |
| `tools.maps.summary` | Clean schematic maps drawn from open geographic data — no clutter, no ads baked into the image, and they print on one page in black and white. | 190 |
| `photoBand.kicker` | The day you will still be talking about | 50 |
| `photoBand.title` | The fireworks at the end of a very long, very good day. | 70 |
| `photoBand.lede` | You will forget the queue times by next week. You will still be describing this part in ten years. That is the trip this site exists to help you plan — not the most attractions, the best day. | 230 |
| `photoBand.label` | Start with when to go | 32 |
| `seasonal.title` | Seasonal guide for {month} | 55 |
| `seasonal.kicker` | What may be running | 32 |
| `seasonal.intro` | These event windows overlap this month. Each card states whether this year is confirmed, expected, or drawn from the last confirmed cycle. | 180 |
| `timing.title` | Thinking about when to go | 44 |
| `timing.kicker` | Timing | 22 |
| `timing.intro` | Every month graded on crowds, cost, weather, and what is actually running — including the months we think you should avoid. | 160 |
| `timing.rankLabel` | Rank the months by what you care about | 48 |
| `timing.allLabel` | All twelve, graded | 30 |
| `guides.title` | The guides people actually need | 45 |
| `guides.kicker` | Planning | 22 |
| `guides.allLabel` | All {guideCount} guides | 34 |
| `calendar.title` | The whole year on one page | 44 |
| `calendar.kicker` | Seasonal calendar | 30 |
| `calendar.intro` | Season ranges for parties, festivals and overlays. Colour shows how much has been confirmed; check each event page for its exact dates. | 160 |
| `calendar.label` | Open the full calendar | 32 |
| `compare.title` | Settle the argument | 36 |
| `compare.kicker` | Comparisons | 28 |
| `compare.intro` | We commit to an answer on every comparison page. Hedging is not a service. | 100 |
| `compare.allLabel` | All comparisons | 30 |
| `funding.title` | How this site pays for itself | 44 |
| `funding.body[0]` | A small number of affiliate links, mostly to authorized ticket resellers, and nothing else at present. That is the entire business model today. Display advertising may follow; if it does, it will be disclosed here before it ships. Affiliate links are disclosed directly above the link, not buried in the footer. | 350 |
| `funding.body[1]` | What that money does not buy is placement. No restaurant, ride, or reseller can pay to be ranked higher, described more kindly, or added to a “best of” list. When we think something is overpriced or overrated, we say so — including things we would earn a commission on. | 280 |
| `funding.body[2]` | {shortDisclaimer} We buy our own tickets. | 130 |
| `funding.policyLabel` | Read the editorial policy | 32 |
| `funding.independenceTitle` | Independent and unofficial | 36 |
| `funding.knowledgeTitle` | We say what we actually know | 40 |
| `funding.knowledgeBody` | Permanent facts carry the month we last checked them. Anything that moves with the season also says whether it is **confirmed**, **expected**, or **last cycle** — and a page past its own review date says so in a banner nobody here can switch off. Most sites publish this year’s dates whether or not anyone announced them. | 350 |

## Photos and deferred owner decisions

- The three suitable park images already map through `heroImage`: Epic Universe → Universal
  lagoon; Islands of Adventure → Universal express lane; Hollywood → Universal studio backlot.
  Florida remains on `universal-studio-backlot`, deliberately sharing Hollywood's image under
  the approved exception. No park records changed. The food flatlay is not a suitable park view.
- No new image was generated or downloaded. No `scene-*`, `hero-*`, `halloween-*`, or `day-end`
  photo is used by the new Universal homepage.
- The owner writes new Hollywood copy. All slots still carry today's text, including the
  fireworks interlude; no alternative claims or marketing wording were invented.
- **Resolved test-policy decision:** the owner approved changing only the two hard-coded
  font-family assertions to check each operator's declared family. This preserves the
  font-wiring contract for both Archivo Black and League Gothic; it does not relax any
  attraction facts, palette values, contrast thresholds or other expected values.
- **Unmet requirement:** the measured Lighthouse mobile performance score is **61**, below
  the ≥90 target. The owner approved a temporary CLI outside the repository; no application
  dependency or lockfile changed. Further performance work is still needed. A score of 100
  on automated accessibility checks is not a complete WCAG 2.2 audit.

### Florida park-card image prompt — owner only, not executed

Obtain an appropriately licensed or commissioned, wide 16:9 decorative view of an anonymous
Florida studio-park pedestrian street at dusk: palms, unbranded art-deco soundstage facades,
warm practical lights and pavement reflections, with cool navy shadows. Compose for a centre
crop at 50% / 55%. Make it clearly distinct from the existing distant backlot and lagoon
images. No logos, globe mark, licensed typefaces, ride vehicles, characters, identifiable
people, Hollywood Sign or readable branded signage. Do not imply it is a documentary image
of the named park. Supply the existing 640/1280/1920 JPEG, WebP and AVIF variants with
documented usage rights; register a new `universal-*` key before changing Florida's `heroImage`.

## Verification and commits

- Executed the six requested build / sister-build / silent-diff checkpoints before their
  respective commits. Repeated those narrow checks for the responsive correction. Both
  sister directories remain byte-identical to the original-source baseline, including
  generated service workers and assets.
- Ran the requested Full gate once. `npm test`: **238 passed, 1 failed**, solely the pre-existing
  hard-coded Archivo Black font assertion above. All palette contrast checks passed.
  The `&&` chain stopped there; the remaining validation, factcheck, all-operator build and
  site-audit commands were then executed once separately and passed. Audit emitted its
  existing advisory messages, with no problems across all three sites.
- After the responsive correction, the nine facelift tests passed again; a targeted Universal
  audit also passed.
- With the owner's narrow exception, reran `node --test test/operator-palette.test.mjs`:
  **26 passed, 0 failed**, including all three operators' WCAG palette checks and both
  configured-font checks. No second Full gate was run.
- Added a Universal-only font preload after the first performance audit identified a late
  display-font swap. Repeated the narrow operator builds and sister diffs: still silent.
  The nine facelift tests also verify preload presence and its motif-off absence.
- Local Chromium captures checked the homepage, ride facts and comparison pages at desktop
  and mobile widths. No document overflow or page-script exceptions were observed. Both
  destination choices fit in the opening 390×844 mobile viewport. Comparison cells use
  full-width stacked values on phones rather than squeezing text alongside long labels.
- A cold mobile local-server comparison, scrolling through lazy images, measured roughly
  **309 KB** of resource bodies after versus **358 KB** for the imported pre-facelift build:
  about 14% less. This is an uncompressed local resource measurement, not Lighthouse.
- Lighthouse **13.5.0**, default mobile simulated throttling, 412×823 viewport, cold browser,
  against `http://127.0.0.1:3000/` serving `dist/universal`: initial performance **61**;
  after font preloading, **performance 61 / accessibility 100 / best practices 100 / SEO 100**.
  Final FCP **2.0 s**, LCP **5.6 s**, total blocking time **610 ms**, CLS **0**, speed index
  **4.0 s**. Preloading eliminated the initial **0.228** CLS but did not meet the performance
  target. The existing approximately 110 KB render-blocking stylesheet and third-party
  analytics downloads remain findings. Analytics and tool scripts were not changed.
  This uncompressed local static-server audit is not a production-hosting measurement.
- The temporary tool and cache stayed under `/tmp`; error-reporting telemetry was disabled.
  One initial CLI invocation stopped at an interactive prompt without running an audit;
  two completed audits measured the pre- and post-preload versions. The final HTML report
  is supplied separately as an ignored generated artifact, not committed application code.
- Six requested implementation commits, one responsive correction commit, then
  `hrg: facelift notes`, followed by the owner-approved font-validation correction and final
  validation notes, including the scoped font preload. No push, merge, deployment, or change
  to the migrated app preview. The branch is not represented as meeting the ≥90 performance
  acceptance target.

## Owner-requested final review

The owner subsequently requested another Full gate, a sister check, an eight-viewport
browser review, exact file weights, and a push of the review branch only. The earlier
one-gate implementation limit does not prevent this explicitly requested final review.

- Full gate: **passed**, including **239 tests / 239 passed / 0 failed**, both validators,
  both factcheckers, all three operator builds, and the three-site audit. Existing
  advisory messages remain advisory; no protected data or expectations were altered.
- Exact sister command:

  ```sh
  diff -rq /tmp/baseline-dist/disney dist/disney; diff -rq /tmp/baseline-dist/coasterguide dist/coasterguide
  ```

  Output: **empty, 0 bytes**.
- Browser review at **390×844** and **1280×900** covered `/`,
  `/universal-orlando/universal-studios-florida/rides/revenge-of-the-mummy/`,
  `/compare/universal-orlando-vs-universal-hollywood/`, and
  `/universal-hollywood/universal-studios-hollywood/rides/the-simpsons-ride/`.
  Full-page scrolling, ride facts/history, mobile comparison cells, mobile menu and Tab
  navigation were checked. No horizontal document overflow, unintentional visible text
  clipping, focus trap, focus obstruction, console errors or page exceptions were found.
  Focus showed a 2 px gold outline. Visual contrast review was supported by the passing
  quantitative palette tests; it is not represented as a complete WCAG audit.
- No application fix was needed in this final review. Eight PNG captures were delivered
  separately from ignored `generated-artifacts/hrg-review/` in the Replit workspace.
  Comparison captures frame the head-to-head table; the others frame the page opening.

### Exact uncompressed file weights

“Before” was rebuilt from the original-source common ancestor in a temporary directory,
not inferred from the migrated application or from compressed HTTP transfers.

| File | Before, bytes | After, bytes | Change |
| --- | ---: | ---: | ---: |
| `dist/universal/index.html` | 60,358 | 60,663 | +305 |
| `dist/universal/assets/css/operator.css` | 704 | 8,346 | +7,642 |
| `assets/fonts/league-gothic-latin-400.woff2` | Not present | 10,436 | +10,436 |
| These files combined | 61,062 | 79,445 | +18,383 |

These requested file sizes increased; they are not the weight of the entire homepage,
which also includes shared CSS/JS, images and other resources. The earlier approximately
309 KB versus 358 KB local resource-body measurement was a different measurement and is
not substituted for this table. The previously documented mobile Lighthouse performance
shortfall remains **61 versus the ≥90 target**, as the owner elected to stop that work.
No additional Lighthouse/performance optimization was attempted during this final review.

Only `replit/hrg-facelift` is authorized for the review push. Do not open a pull request,
merge, force-push, or push to `main`; the owner controls review and merging.

## Park hub

- `src/pages/park.mjs`: only when `isHollywoodEdition(site)`, the existing `Opened` and
  `A full day is` facts move from the hero meta list into a slate passed through the
  existing `hero({ afterTitle })`. Values, labels, links and `heroImage` are unchanged; the
  slate omits the full-day fact when the data lacks it. Off, `afterTitle` is undefined and the
  hero meta list is as before.
- `src/lib/palette.mjs`: `.hrg-park-slate` and `.hrg-park-page` CSS, emitted only when the
  studio-call-sheet motif and Universal edition flag are both enabled. Labels use sentence
  case with normal tracking; section rules below the slate stay quiet. Link-tile chevrons
  are suppressed. No monospace, numbered markers, new text or images.
- Existing `heroImage` is the only Universal photo source; no generic-image fallback is
  introduced. The Universal CSS cache key advances to `32-hrg-hub`; copy is unchanged.
- Universal and sister builds passed. The sister check was silent. Both example park hubs
  were captured at 390×844 and 1280×900: no horizontal page overflow or clipped slate text.
- No main.css, JS, schema, URL or protected data changes.

## Rides list

- `src/pages/park.mjs` (`ridesPage`): only when `isHollywoodEdition(site)`, the body is wrapped in
  `hrg-park-page hrg-rides-page` and the table gains `hrg-running-order`. Columns and cells reorder together
  to Attraction, Height, Land, Type, Intensity, Scare, queue; sort indexes follow the new positions.
  Labels, cell data, links, in-page IDs, caption and closed list are unchanged. Disabled order is the legacy order.
- `src/lib/palette.mjs`: `.hrg-running-order` rules in the Universal-edition CSS block: fixed 9rem height
  column; at 760px and below, rows become a grid with name left and height right, other facts below, and the
  header row stays visible as a wrapping list. Classes are meant to be reused for the land page later.
- Long recorded height restrictions open through a native `<details>` inside the height cell:
  the existing height value is its summary and the existing rule text is retained in full.
  This avoids turning a fixed-width height column into a paragraph-high row. No replacement
  wording or JavaScript is added.
- `src/templates/components.mjs` accepts optional disclosures and optional per-cell numeric
  sort values. Both default off. The Universal renderer supplies recorded height, intensity
  and scare values to the existing sorter's cell attributes; rule text cannot corrupt the
  numeric sort. No eligibility rule or sorter JavaScript changes.
- Universal CSS cache key: `33-hrg-rides`. Universal and sister builds passed; sister output
  was silent. Screenshots at 390×844 and 1280×900 show a fixed height edge with no horizontal
  page overflow. Mobile height sorting and keyboard disclosure/focus were checked.
- No protected data, schema, main.css or authored copy changes.

## Land page

- `src/pages/park.mjs` (`landPage`): only when `isHollywoodEdition(site)`, the body is wrapped in
  `hrg-park-page hrg-land-page` and the existing `C.attractionInline` list is wrapped in `hrg-running-list`.
  No card content, fields, links, images or copy changed; the disabled path keeps the legacy template calls.
- `src/lib/palette.mjs`: compact hero and `.hrg-running-list` rules in the Universal-edition block. The
  attraction name and its existing height badge sit on a grid with the same fixed 9rem right column
  at both widths; badges wrap instead of pushing the name offscreen.
- `src/templates/components.mjs`: an optional decorative-arrow switch defaults to today's output.
  The Universal land and rides inline blocks disable it; link wording and destinations stay intact.
- Universal CSS cache key: `34-hrg-land`. Universal and sister builds passed, with silent sister
  diffs. Both example lands were captured at 390×844 and 1280×900, at their compact headers and
  attraction rows: no horizontal page overflow. Measured link contrast is at least 4.60:1;
  the coloured height figures exceed 6:1.
- New tests cover opt-in/off rendering, CSS isolation, preserved height rules, numeric sort
  attributes and optional link decoration. Existing tests and protected files are unchanged.

## Live waits panel

- `src/lib/palette.mjs`: CSS only, in the Universal-edition block and scoped under `.hrg-park-page`. It restyles the
  existing `live-wait-*`, `live-indicator`, `wait-time` and `live-weather` markup that `assets/js/live-park-data.js`
  writes, as a departure board: large tabular-figure waits in the existing display face, ruled rows, a static
  indicator (no pulse), neutral band colours with an accent underline on the high band, and a wrapping weather row.
  No JS, markup, copy or font changes.
- The loading placeholder is restyled; on `data-live-status="error"` it gets an accented, dashed treatment. The JS
  leaves the placeholder text unchanged on error, and CSS cannot change that. The placeholder is hidden once
  `data-live-status="loaded"` is set.
- Pre-existing limitations, not changed or fixed here: `fetchJson` discards the ingest envelope's metadata
  (such as `fetchedAt` and `stale`), so stale data cannot be detected or flagged; and the wait and weather renderers
  both write into the same `data-live-wait`/`data-live-weather` container, so whichever finishes last overwrites the other.
- Universal CSS cache key: `35-hrg-live`. Universal and sister builds passed; sister diffs
  were silent. Captures at 390×844 and 1280×900 use intercepted fixture responses with the
  actual, unchanged renderer for waits, weather, unavailable and stale-envelope cases;
  loading was captured with page scripts disabled. All five states fit both viewports.
  Wait figures use tabular numeric features and the indicator has no animation.
- A stale-envelope fixture still renders as loaded with no stale marker: that confirms
  the existing limitation rather than claiming CSS can fix it. These screenshots are
  visual fixtures, not current park conditions.

## Park-template extension: final checks

Four staged commits: `hrg: park hub`, `hrg: rides list`, `hrg: land page`,
`hrg: live waits panel`. Each stage rebuilt Universal and both sisters, followed by
the silent baseline diffs and its requested 390px/1280px captures before committing.

Full gate passed: `npm test` (246 tests), `npm run validate`, `npm run factcheck`,
`node src/build.mjs` (931 pages), `npm run audit:site`. Validation retains 97
existing warnings; the audit retains 36 non-blocking notes and reports no problems.
The final sister check produced no output. No JavaScript, protected data, factual
expectations, URLs, schema, shared CSS or dependencies changed.

Exact uncompressed weights, with the earlier approved facelift distinguished from
this park-template extension:

| File | Original baseline | Before extension | After extension |
| --- | ---: | ---: | ---: |
| `dist/universal/index.html` | 60,358 B | 60,663 B | 60,668 B |
| `dist/universal/assets/css/operator.css` | 704 B | 8,346 B | 17,778 B |
| League Gothic WOFF2 | Not present | 10,436 B | 10,436 B |

The extension adds five HTML bytes through the longer cache token and 9,432 CSS
bytes. It does not add an image or font. The previously documented mobile performance
shortfall remains unchanged in scope; no new Lighthouse or loading-optimization pass
was undertaken.

## Restaurant page

- `src/pages/dining.mjs` (`restaurantPage`): only when `isHollywoodEdition(site)`, the body is wrapped in
  `hrg-park-page hrg-dining-page`. The existing price tier and price note follow the name through
  `hero({ afterTitle })`, with service and recorded dietary values as small sentence-case chips.
  The existing verdict moves, once, into the hero after its price/chips, ahead of the lede and long facts;
  it is omitted when missing and
  keeps its heading and text. Disabled output is the legacy template.
- `src/lib/palette.mjs`: `.hrg-dining-*` rules in the Universal-edition block. Tabular figures; no
  monospace, tracked capitals, images, copy or JS.
- Price and service are moved rather than repeated in the hero's metadata. The original cost fact,
  verification date and all other facts remain available in the aside.
- Universal CSS cache key: `36-hrg-restaurant`. Universal and sister builds passed; both sister
  diffs were silent. Mel's Diner and Food Tracker were captured at 390×844 and 1280×900,
  with additional verdict/card views. No document overflow or clipped verdict text was found.

## Dining hub

- `src/pages/dining.mjs` (`diningHub`): only when `isHollywoodEdition(site)`, the body is wrapped in
  `hrg-park-page hrg-dining-hub` and the table gains `hrg-dining-table`. Columns and cells reorder together
  to Restaurant, Price, Land, Service, Cuisine, Reservations; the existing price `data-value` span is kept.
  Service text is wrapped in a small bordered chip. Copy, links, caption and cards are unchanged; disabled
  output is the legacy template.
- `src/lib/palette.mjs`: `.hrg-dining-table` rules in the Universal-edition block: fixed price column with
  tabular figures; at 760px and below rows become name-left, price-right with other facts below.
- The Universal Price header sorts numerically using the existing price-tier length supplied
  as per-cell metadata. No sorter JavaScript changes. The table keeps its explicit table role.
- Universal CSS cache key: `37-hrg-dining-hub`. Universal and both sisters built successfully;
  sister diffs were silent. The Florida dining hub and Food Tracker were captured at 390×844
  and 1280×900, including table/card views. No horizontal document overflow was found.

## Snacks and food cards

- `src/templates/components.mjs`: `foodCard` and `diningCard` accept optional `{ site }`; flag is computed from
  `isHollywoodEdition`. Edition `foodCard` only adds `hrg-food-card` to its root; children, ids, data hooks and
  tracker buttons are unchanged. Edition `diningCard` uses `card` with new optional `className` and `afterTitle`
  (both emit nothing when absent): name, existing price tier, then service and recorded dietary chips; summary,
  badges and facts remain. Without `site` output is unchanged.
- Seven calls pass `site`: dining hub, restaurant and snacks, park hub food, land dining and food, tools tracker card.
- `src/pages/dining.mjs` (`snacksPage`): wrapped in `hrg-park-page hrg-snacks-page` when the edition is on.
- `src/lib/palette.mjs`: `.hrg-food-card` fixed 6.5rem price column, tabular figures, bordered diet chips;
  `.hrg-dining-card` and `.hrg-snacks-page` rules in the edition block. Tracker page state controls untouched.
- Food and dining cards share a fixed 6.5rem price column. Dining-card price and name occupy
  the first row, so varying title lengths cannot move prices below one another. All card
  chips and nested metadata labels use sentence case and normal tracking.
- Universal CSS cache key: `38-hrg-food-cards`. Universal and both sisters built; sister
  diffs were silent. Captures at 390×844 and 1280×900 cover Florida snacks, dining cards,
  Mel's Diner and Food Tracker, including content-level views. No document overflow was found.

## Food tracker presentation

- `src/pages/tools.mjs`: under `isHollywoodEdition(site)` the existing `page-tracker` body class gains
  `hrg-food-tracker`. No markup, hooks, text or state changes; off, the class is unchanged.
- `src/lib/palette.mjs`: CSS only, in the edition block. Sentence-case labels; states read from the existing
  `data-state` and `aria-pressed` on `hrg-food-card`, so snacks and restaurant pages match. Want: heavier frame and
  inset left bar. Tried: recessed. Skip: dashed frame and struck title. Pressed buttons gain a heavier border,
  weight and underline in addition to the existing icon and label. Cards keep full opacity. The toolbar is static
  at 760px and below, sticky above.
- Universal CSS cache key: `39-hrg-food-tracker`. Universal and both sisters rebuilt;
  sister diffs were silent. Final 390×844 and 1280×900 captures cover Mel's Diner, Florida
  dining, Florida snacks and Food Tracker, plus separate Want/Tried/Skip state views.
- Real controls were clicked in fresh temporary browser sessions. All three saved states
  survived reload with the exact same version-2 localStorage value. Want filtering, price
  sorting and visible, unobscured keyboard focus passed at both widths. All state cards
  retain opacity 1 and have distinct non-colour border/shadow/title treatments.
- `assets/js/food-tracker.js` and all other browser scripts are unchanged.

## Dining extension: final checks

Four stages were built and captured before their respective commits:
`hrg: restaurant page`, `hrg: dining hub`, `hrg: snacks and food cards`,
`hrg: food tracker presentation`.

- Full gate passed: **253 tests**, data and seasonal validation, factcheck, **931-page**
  all-operator build and the site audit. The existing 97 validation warnings and 36
  non-blocking audit notes remain; the audit reports no problems.
- Both sister checks produced **no output**. Source checks also confirm no change to
  browser scripts, schema, validation/factcheck scripts, sister data or shared `main.css`.
- Seven new tests cover verdict placement/omission, opt-in/off gates, default and sister
  card output, class-only food-card and tracker changes, missing/zero prices and CSS isolation.
  Existing test expectations are unchanged.
- Review captures are supplied separately from ignored generated output. The last
  checkpoint shows final styling; the earlier checkpoints record each staged result.
- No new images, copy, fonts, packages, URLs, state keys, share encoding or persistence
  behaviour were introduced. Service and dietary chip text comes from recorded fields.
  The existing performance decision remains out of scope; no new optimization pass ran.

## Group 1: shared components

- `layout.mjs`: `<html class="hrg-edition">` only under `isHollywoodEdition(site)`; otherwise bytes unchanged.
- `palette.mjs`: CSS in the Hollywood edition block, all scoped `.hrg-edition` and inside `@media screen`.
- New treatments: square corners and call-sheet rules on callouts, keypoints, tips, toc, faq, affiliate, link tiles, search panel; grades, height badges and pills as bordered greyscale (border style/weight differentiates); meters filled in ink; link-tile chevrons hidden; tables scroll inside `.table-wrap`.
- Freshness shapes (greyscale): confirmed (`--good`) solid circle; expected (`--warn`) hollow diamond; last cycle (`--muted`) dotted ring; overdue/unverified (`--danger`, `--stale`) solid triangle with double left rule. All labels and banners untouched; stale wins via existing class.
- Cache token `40-hrg-shared`. Universal and both sisters built; both sister checks were silent.
  Ride and real search-result overlay captured at 390px. The overlay's field uses a bounded
  grid so its Close control remains inside the panel. Search results and Escape closing passed.
  A normalized comparison of all 267 Universal HTML files found no change beyond classes
  and the permitted operator stylesheet cache token. Guide print and freshness proof follow
  with their relevant page groups. No copy, image, data or script changes.

## Group 2: guides and comparison indexes

- `src/pages/docs.mjs`: under `isHollywoodEdition(site)` only, guidePage, guidesIndex and compareIndex gain body classes `hrg-guide`, `hrg-guides-index`, `hrg-compare-index`. Off, output is unchanged. No markup, copy or schema change.
- `palette.mjs`: CSS in the edition block, inside `@media screen`. Sentence-case normal-tracking labels, slate rule and link-tile chevrons removed, 44rem prose measure, ruled doc sections, flat 1px card top rule, scrolling inside `.table-wrap`, `min-width: 0` on grid children, visible focus on card links.
- Cache token `41-hrg-guides`. All operators built and sister checks were silent.
  Express Pass guide, guides index and comparison index captured at 390px: no page
  overflow or script exceptions. All 267 normalized Universal HTML files remain identical.

## Group 3: seasonal pages

- `src/seasonal/*`: every listed page function (including tripTimingPage) gains `bodyClass: 'hrg-seasonal'` only under `isHollywoodEdition(site)`. Off, output is unchanged. Freshness contract and its four-shape CSS are untouched.
- `palette.mjs`: screen-only CSS. Sentence case incl. nested card meta spans, slate rule and chevrons hidden, square ruled panels for window strip, editions, give/take, resort split, verdict, month cards and timing controls; 44rem prose measure; tables and Gantt scroll inside their wrappers.
- New treatment (Gantt, none existed): confirmed solid grey, expected dashed outline, last cycle hatched, applied to bars and legend swatches so the legend is not colour-only. Positions unchanged. Month-level and as-of chips become square bordered neutrals.
- The mobile Gantt stacks each existing label over its full-width timeline. All 12 month
  columns fit without horizontal scrolling, so no new keyboard hook or tool logic is needed.
  Header month tracks align with the unchanged bar coordinates. Its pre-existing resort
  label "Both" remains unchanged; correcting that copy needs owner approval.
- The confidence heading uses readable body type, not a decorative display label.
  Cache token `42-hrg-seasonal`. All operators built; sister comparisons were silent.
  Both priority holiday events, calendar, closures, status and September captured at 390px.
  No document overflow or page exceptions. All 267 normalized HTML pages remain identical.
- Greyscale proof includes actual confirmed, expected and last-cycle ribbons. The current
  September build data contains no overdue Universal ribbon, so overdue is an explicitly
  labelled browser-only fixture using the unchanged freshness/staleness renderers, not a
  fabricated park update. Its warning and overdue wording remain visible.
- Ride and Express Pass guide print media were checked in Chromium: white paper, black
  title, hidden navigation and no horizontal overflow. Print-preview screenshots and A4
  PDFs are supplied separately. No print stylesheet or package changes were needed.

## Group 4: park reference, parks index, resorts, companies

- `park.mjs` (heightsPage, accessibilityPage, firstTimerPage, mapPage, bestRidesPage) and `core.mjs` (parksIndexPage, companyPages, resortPages): `bodyClass: 'hrg-park-reference'` only under `isHollywoodEdition(site)`. Off, output is unchanged. No markup, copy or data changes.
- `palette.mjs`: screen-only CSS. Sentence-case labels incl. nested card meta, slate rule and chevrons hidden, ruled rank items, ink pros/cons markers, 44rem prose, tables and `.parkmap-wrap` scroll inside wrappers. Map SVG, legend and print untouched. Best-rides has no hideable arrow span, so none was hidden.
- Cache token `43-hrg-reference`. Height figures use tabular display type; full recorded
  rider conditions remain in readable body type. Map and table frames use square corners.
  Heights, accessibility, first-timer, map, best rides, parks index and Orlando resort
  captured at 390px with no page overflow or script exceptions. All operator builds passed;
  sister checks were silent. All 267 normalized Universal HTML files remain identical.

## Group 5: tools

- `src/pages/tools.mjs`: heightCheckerPage, dayBlueprintPage, roadTripPage, careerLadderPage, expressRoiPage, hauntPlannerPage, myRidersPage and toolsIndex gain `bodyClass: 'hrg-tools'` only under `isHollywoodEdition(site)`. Food tracker keeps `page-tracker hrg-food-tracker`; tripTiming keeps `hrg-seasonal`. Off, output is unchanged.
- `palette.mjs`: screen-only CSS covering static and script-rendered result classes (tool-sheet, tool-checks, plan-steps, nearmiss, ruler labels, rider cards and badges, haunt checklist). Sentence case, square ruled frames, ink fills, 3px focus outlines on native controls. Rider badges keep their existing shapes (dot, half, ring, dashed ring) and drop their colour fills.
- No JS, markup, ids, data hooks or copy changed.
- Cache token `44-hrg-tools`. Height checker, tools index, My Riders, Express ROI and
  Haunt Planner captured at 390px. An Express ROI intrinsic-width overflow was corrected
  using bounded form fields, removing the redundant outer pill and retaining native controls
  at their original readable font size. Tool controls stay inside their frames. Height
  control/stat panels reuse the square frame. All operator builds and silent sister
  checks passed; all 267 normalized HTML files remain unchanged.

## Group 6: legal pages and footer chrome

- `src/pages/legal.mjs`: the standard legal pages (via the shared helper), offline and 404 pass `bodyClass: 'hrg-legal'` to `renderPage` only under `isHollywoodEdition(site)`. Off, output is unchanged.
- `palette.mjs`: screen-only CSS. Sentence-case labels, 44rem wrapping prose (long emails and URLs wrap), square cards and callouts, scrolling tables, visible focus.
- Footer brandmark: root-scoped `.hrg-edition .site-footer .brandmark__mark` reuses the existing studio-board header recipe (square, accent gold, paper ink). No new treatment; footer headings sentence case.
- Existing screen freshness shapes, copy, arrows, URLs, schema and data are unchanged.
  Scoped operator print CSS reproduces the same four marker shapes using borders so
  they survive the shared print stylesheet's background reset; no paper, layout,
  navigation or pagination rules are changed. Confirmed is a filled circle,
  expected a hollow diamond, last cycle a dotted ring, overdue a triangle.
- Cache token `45-hrg-legal`. All eight legal/system URLs captured at 390px.
  Corrected low-contrast offline/404 status headings and separated wrapped action buttons;
  styled the actual `.legal-page` container and headings. No page overflow or script errors.
  The existing 404 button's “All six parks” wording is protected copy and remains
  untouched, like the pre-existing seasonal Gantt “Both” label noted above.

## Complete-identity verification

- Full gate passed: `npm test && npm run validate && npm run factcheck &&
  node src/build.mjs && npm run audit:site`. Includes four new regression tests
  for strict brand opt-in, emitted style scopes, class-only guide/index markup,
  and authoritative confidence/overdue warnings. Existing warnings remain.
- Universal, Disney and Coasterguide built after each of the six groups. Both
  sister diffs were silent, including after the final full build.
- All 267 Universal HTML documents retain identical content, non-class attributes
  and structure, excluding only class attributes and the operator CSS cache token.
  Protected scripts, shared stylesheets, data and tooling have no diff; the sole
  Universal data edit is the permitted asset-version increment.
- Thirty example URLs checked at 390px: no page overflow or page exceptions.
  Search and Escape checked; tool controls checked against their panel bounds.
  The ignored review gallery contains 67 checkpoint/detail/print/greyscale captures.
- Ride and guide print media checked for white paper, black headings, hidden
  navigation and no overflow; native A4 PDFs saved outside the repository.
  All four freshness shapes also checked under print media. The overdue proof is
  explicitly a browser-only fixture: no currently built Universal page has that state.
- No new imagery, fonts, copy, browser logic or dependencies. The only missing
  visual equivalent was the Gantt's state grammar (solid / dashed / hatched);
  the paper trust markers adapt existing shapes rather than adding another motif.
- This remains the original-source review branch. The migrated Replit app and
  its preview are intentionally unchanged. No pull request or merge.
