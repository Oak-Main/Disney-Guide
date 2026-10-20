import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData } from '../src/lib/data.mjs'
import { paletteCss } from '../src/lib/palette.mjs'
import { renderPage } from '../src/templates/layout.mjs'
import { guidePage, guidesIndex, compareIndex } from '../src/pages/docs.mjs'
import { freshnessRibbon, stalenessBanner } from '../src/templates/seasonal-components.mjs'
import { staleness, BUILD_MONTH } from '../src/lib/staleness.mjs'

const data = await loadData('universal')
const site = data.site
const off = { ...site, brand: { ...site.brand, hollywoodEdition: false } }
const render = site => renderPage({ site, page: { url: '/about/', title: 'About' }, body: '' })
const withoutClasses = text => String(text).replace(/\sclass="[^"]*"/g, '')

test('the site-wide class hook is strictly opt-in and Universal-only', () => {
  assert.match(render(site), /<html lang="en" class="hrg-edition">/)
  for (const disabled of [off, { ...site, operator: 'disney' }, { ...site, operator: 'coasterguide' }]) {
    assert.doesNotMatch(render(disabled), /class="hrg-edition"/)
    assert.match(render(disabled), /<html lang="en">/)
  }
  assert.equal(withoutClasses(render(site)), withoutClasses(render(off)))
})

test('completion styles are gated, with screen layout and print trust markers', () => {
  const css = paletteCss(site)
  const hooks = ['.hrg-edition', '.hrg-guide', '.hrg-seasonal', '.hrg-park-reference', '.hrg-tools', '.hrg-legal']
  for (const hook of hooks) assert.ok(css.includes(hook))
  assert.ok([...css.matchAll(/@media screen \{/g)].length >= 6)
  assert.ok(css.includes('@media print {'))
  for (const disabled of [off, { ...site, operator: 'disney' }]) {
    for (const hook of hooks) assert.ok(!paletteCss(disabled).includes(hook))
  }
})

test('guide and index changes preserve every word, attribute and node except classes', () => {
  const disabled = { ...data, site: off }
  const cases = [
    input => guidePage(data.guides[0], input),
    input => guidesIndex(input),
    input => compareIndex(input),
  ]
  for (const page of cases) assert.equal(withoutClasses(page(data).html), withoutClasses(page(disabled).html))
})

test('confidence labels remain authoritative and overdue always has its warning', () => {
  for (const [confidence, tone] of [['confirmed', 'good'], ['expected', 'warn'], ['historical', 'muted']]) {
    const freshness = { confidence, verified: BUILD_MONTH, reviewBy: BUILD_MONTH }
    const state = staleness(freshness)
    const ribbon = String(freshnessRibbon(freshness, state))
    assert.match(ribbon, new RegExp(`freshness--${tone}`))
    assert.ok(ribbon.includes(state.confidenceLabel))
  }
  const previous = new Date(`${BUILD_MONTH}-01T00:00:00Z`)
  previous.setUTCMonth(previous.getUTCMonth() - 1)
  const freshness = { confidence: 'confirmed', verified: previous.toISOString().slice(0, 7), reviewBy: previous.toISOString().slice(0, 7) }
  const state = staleness(freshness)
  assert.equal(state.state, 'stale')
  assert.match(String(freshnessRibbon(freshness, state)), /freshness--danger freshness--stale/)
  assert.match(String(freshnessRibbon(freshness, state)), /overdue/)
  assert.match(String(stalenessBanner(state)), /past their review date/)
})
