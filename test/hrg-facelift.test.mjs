import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { HOME_COPY_SLOTS, homeCopy } from '../src/lib/home-copy.mjs'
import { rideSpecItems } from '../src/lib/ride-specs.mjs'
import { isHollywoodEdition, paletteCss, chromeCss } from '../src/lib/palette.mjs'
import { loadData } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { homePage } from '../src/pages/core.mjs'
import { attractionPage } from '../src/pages/park.mjs'
import { comparePage } from '../src/pages/docs.mjs'
import { legalPages } from '../src/pages/legal.mjs'
import { renderPage } from '../src/templates/layout.mjs'
import { raw } from '../src/lib/html.mjs'

const site = JSON.parse(await readFile(new URL('../data/universal/site.json', import.meta.url), 'utf8'))

test('every approved homepage slot is editable and defaults to the pre-facelift text', () => {
  assert.deepEqual(Object.keys(site.home).sort(), Object.keys(HOME_COPY_SLOTS).sort())
  for (const [key, [text, max]] of Object.entries(HOME_COPY_SLOTS)) {
    assert.equal(site.home[key], text, key)
    assert.ok(text.length <= max, `${key} fits its limit`)
  }
  assert.equal(homeCopy({}, { parkCount: 4 })('hero.kicker'), '4 US parks · independent & unofficial')
  assert.equal(homeCopy({ home: { 'hero.title': 'Owner title' } }, {})('hero.title'), 'Owner title')
  assert.throws(() => homeCopy({ home: { 'hero.title': 'x'.repeat(71) } }, {})('hero.title'), /at most/)
})

test('Hollywood edition is opt-in and never applies to a sister operator', () => {
  assert.equal(isHollywoodEdition(site), true)
  assert.equal(isHollywoodEdition({ ...site, operator: 'disney' }), false)
  assert.equal(isHollywoodEdition({ ...site, brand: { ...site.brand, hollywoodEdition: false } }), false)
})

test('ride specs omit absent values, preserve false and zero, and do not infer unknown enums', () => {
  assert.deepEqual(rideSpecItems({}, site), [])
  assert.deepEqual(rideSpecItems({ heightIn: null, typicalWait: '', durationMinutes: undefined }, site), [])
  const items = rideSpecItems({
    goesUpsideDown: false, durationMinutes: 0, heightIn: 0, singleRider: false,
    lightningLane: 'none', getsWet: 'unverified', intensity: 0, typicalWait: 'Recorded wait',
  }, site)
  assert.equal(items.length, 8)
  const map = Object.fromEntries(items.map(({ label, value }) => [label, value]))
  assert.equal(map.Inversions, 'No')
  assert.equal(map['Single rider'], 'No')
  assert.equal(map['Ride length'], '0 min')
  assert.equal(map['Minimum height'], 'No minimum height')
  assert.equal(map[site.queue.name], site.queue.labels.none)
  assert.equal(map['Getting wet'], 'unverified')
  assert.equal(map.Intensity, '0')
})

test('studio motif is emitted only for its name and the new CSS never requests monospace', () => {
  const css = paletteCss(site)
  assert.ok(css.includes('Studio call-sheet'))
  assert.ok(!css.includes('--font-mono'))
  assert.ok(!paletteCss({ ...site, brand: { ...site.brand, motif: undefined } }).includes('.hrg-destination'))
  assert.ok(chromeCss(site).includes("data-chrome='studio-board'"))
})

test('League Gothic is regular-only, self-hosted Latin WOFF2 below 24KB, with OFL beside it', async () => {
  assert.equal(site.brand.font.family, 'League Gothic')
  assert.equal(site.brand.font.weight, 400)
  assert.ok((await stat(new URL('../assets/fonts/league-gothic-latin-400.woff2', import.meta.url))).size <= 24 * 1024)
  assert.match(await readFile(new URL('../assets/fonts/league-gothic-OFL.txt', import.meta.url), 'utf8'), /SIL OPEN FONT LICENSE Version 1.1/)
  const page = (value) => renderPage({ site: value, page: { url: '/', title: 'Test' }, body: raw('') })
  assert.ok(page(site).includes('rel="preload" href="/assets/fonts/league-gothic-latin-400.woff2"'))
  assert.ok(!page({ ...site, brand: { ...site.brand, motif: undefined } }).includes('rel="preload"'))
})

const data = await loadData('universal')
const seasonal = await loadSeasonal('universal', data)
const withoutEdition = { ...data, site: { ...data.site, brand: { ...data.site.brand, hollywoodEdition: false } } }

test('Universal opens with the destination choice, parks, then tools and uses only its own photos', () => {
  const html = homePage(data, seasonal).html
  const positions = ['hrg-destinations', site.home['parks.title'], site.home['tools.title']].map((s) => html.indexOf(s))
  assert.ok(positions[0] >= 0 && positions[0] < positions[1] && positions[1] < positions[2])
  assert.ok(positions[0] < html.indexOf(site.home['hero.lede']), 'destination choice precedes the long lede, including on mobile')
  for (const match of html.matchAll(/\/assets\/img\/photos\/([a-z0-9-]+?)-\d+\.(?:jpg|webp|avif)/g)) {
    assert.ok(match[1].startsWith('universal-'), match[1])
  }
  assert.ok(!homePage(withoutEdition, seasonal).html.includes('hrg-destinations'))
})

test('the top ride spec panel is Universal-only and does not render a missing minimum', () => {
  const ride = data.parks.flatMap((p) => p.attractions).find((a) => a.hasPage)
  const html = attractionPage({ ...ride, goesUpsideDown: false, singleRider: false, heightIn: null }, data).html
  const panel = html.match(/<div class="hrg-specs">([\s\S]*?)<\/dl>/)?.[1]
  assert.ok(panel)
  assert.match(panel, /<dt>Inversions<\/dt>\s*<dd>No/)
  assert.match(panel, /<dt>Single rider<\/dt>\s*<dd>No/)
  assert.ok(!panel.includes('<dt>Minimum height</dt>'))
  assert.ok(!attractionPage(ride, withoutEdition).html.includes('hrg-specs'))
})

test('comparison table and verdict modifiers switch off with the edition flag', () => {
  const page = [...data.compareBySlug.values()].find((p) => p.verdict && p.dimensions?.length)
  const html = comparePage(page, data).html
  assert.ok(html.includes('hrg-head-to-head'))
  assert.ok(html.includes('hrg-verdict'))
  const legacy = comparePage(page, withoutEdition).html
  assert.ok(!legacy.includes('hrg-head-to-head') && !legacy.includes('hrg-verdict'))
})

test('network links move to About only; default-off flag retains the original footer', () => {
  const pages = legalPages(data, seasonal)
  const about = pages.find((p) => p.url === '/about/').html
  assert.ok(about.split('<footer')[0].includes('Our park-guide network'))
  for (const page of pages) {
    assert.ok(!page.html.split('<footer')[1].includes('Our park-guide network'), page.url)
    if (page.url !== '/about/') assert.ok(!page.html.includes('Our park-guide network'), page.url)
  }
  const legacySite = { ...site, brand: { ...site.brand, networkLinksOnAboutOnly: false } }
  const legacy = renderPage({ site: legacySite, page: { url: '/', title: 'Test' }, body: raw('') })
  assert.ok(legacy.split('<footer')[1].includes('Our park-guide network'))
})
