import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { paletteCss } from '../src/lib/palette.mjs'
import { parkHub, ridesPage, landPage } from '../src/pages/park.mjs'
import { heightRequirementCell, dataTable, attractionInline } from '../src/templates/components.mjs'

const data = await loadData('universal')
data.seasonal = await loadSeasonal('universal', data)
const park = data.parks.find(p => p.slug === 'universal-studios-hollywood')
const land = park.lands.find(l => l.slug === 'lower-lot')
const disabled = {
  ...data,
  site: { ...data.site, brand: { ...data.site.brand, hollywoodEdition: false } },
}

test('all three park templates opt in through the Universal edition flag', () => {
  assert.match(parkHub(park, data).html, /class="hrg-park-page hrg-park-hub"/)
  assert.match(ridesPage(park, data).html, /data-table--stack hrg-running-order/)
  assert.match(landPage(land, data).html, /class="hrg-running-list"/)
})

test('disabled templates emit neither edition wrappers nor height disclosures', () => {
  for (const page of [parkHub(park, disabled), ridesPage(park, disabled), landPage(land, disabled)]) {
    assert.doesNotMatch(page.html, /hrg-park-page|hrg-park-slate|hrg-running-|hrg-height-rule/)
  }
  assert.match(ridesPage(park, disabled).html, /data-sort-index="1" data-sort-type="text">Land/)
})

test('new template styles require both Universal identity and its edition flag', () => {
  assert.match(paletteCss(data.site), /\.hrg-running-list/)
  for (const site of [
    disabled.site,
    { ...data.site, operator: 'disney' },
    { ...data.site, brand: { ...data.site.brand, motif: 'float-glass' } },
  ]) {
    assert.doesNotMatch(paletteCss(site), /\.hrg-park-slate|\.hrg-running-|\.hrg-height-rule/)
  }
})

test('a height disclosure keeps the recorded rules and numeric metadata', () => {
  const ride = { heightIn: 40, heightMaxIn: 76, accompaniedBelowIn: 48, heightNote: 'Recorded restriction.' }
  const html = String(heightRequirementCell(ride, { disclosure: true }))
  assert.match(html, /<details class="hrg-height-rule"/)
  assert.match(html, /data-value="40"/)
  assert.match(html, /data-height-max="76"/)
  assert.match(html, /data-accompanied-below="48"/)
  assert.match(html, /76&quot; maximum; Accompaniment required below 48&quot;; Recorded restriction\./)
  assert.doesNotMatch(String(heightRequirementCell(ride)), /<details/)
  assert.doesNotMatch(String(heightRequirementCell({ heightIn: null }, { disclosure: true })), /<details|data-value="0"/)
})

test('Universal numeric sorting uses cell values, not the rider-rule prose', () => {
  const html = ridesPage(park, data).html
  assert.match(html, /data-sort-index="1" data-sort-type="number">Height/)
  assert.match(html, /data-label="Height" data-value="\d+"/)
  const options = { columns: ['Ride', 'Height'], rows: [['A', '40']] }
  assert.doesNotMatch(String(dataTable(options)), /data-value=/)
  assert.match(String(dataTable({ ...options, sortValues: [{ 1: 40 }] })), /data-label="Height" data-value="40"/)
})

test('decorative link arrows are optional without changing the link wording', () => {
  const ride = park.attractions.find(a => a.hasPage)
  assert.match(String(attractionInline(ride)), / →<\/a>/)
  assert.doesNotMatch(String(attractionInline(ride, { decorativeArrow: false })), /→/)
  assert.ok(String(attractionInline(ride, { decorativeArrow: false })).includes(`Full guide to ${ride.name}`))
})

test('live board styles stay scoped, tabular and motionless', () => {
  const css = paletteCss(data.site)
  const live = css.slice(css.indexOf('/* Live waits and weather:'))
  assert.match(live, /\.hrg-park-page \.live-wait-grid/)
  assert.match(live, /font-variant-numeric:\s*tabular-nums/)
  assert.match(live, /\.hrg-park-page \.live-indicator[^}]*animation:\s*none/)
  assert.doesNotMatch(live, /monospace|text-transform:\s*uppercase/)
  assert.doesNotMatch(paletteCss(disabled.site), /\.live-wait-grid|\.live-weather/)
})
