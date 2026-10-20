import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { paletteCss } from '../src/lib/palette.mjs'
import { restaurantPage, diningHub, snacksPage } from '../src/pages/dining.mjs'
import { foodTrackerPage } from '../src/pages/tools.mjs'
import { diningCard, foodCard } from '../src/templates/components.mjs'

const data = await loadData('universal')
data.seasonal = await loadSeasonal('universal', data)
const park = data.parks.find(p => p.slug === 'universal-studios-hollywood')
const restaurant = park.dining.find(r => r.slug === 'mels-diner')
const item = park.food[0]
const off = { ...data, site: { ...data.site, brand: { ...data.site.brand, hollywoodEdition: false } } }
const withoutClasses = html => String(html).replace(/class="[^"]*"/g, '')

test('restaurant verdict appears once near the name and disappears if missing', () => {
  const html = restaurantPage(restaurant, data).html
  assert.equal([...html.matchAll(/class="verdict-box hrg-dining-verdict"/g)].length, 1)
  assert.ok(html.indexOf('hrg-dining-price') < html.indexOf('hrg-dining-verdict'))
  assert.ok(html.indexOf('hrg-dining-verdict') < html.indexOf('class="hero__lede"'))
  assert.doesNotMatch(restaurantPage({ ...restaurant, verdict: null }, data).html, /hrg-dining-verdict/)
})

test('dining page composition and card classes require the existing edition flag', () => {
  for (const page of [restaurantPage(restaurant, off), diningHub(park, off), snacksPage(park, off)]) {
    assert.doesNotMatch(page.html, /hrg-dining-|hrg-snacks-|hrg-food-card/)
  }
  assert.match(diningHub(park, data).html, /data-sort-index="1" data-sort-type="number">Price/)
  assert.match(diningHub(park, off).html, /data-sort-index="1" data-sort-type="text">Land/)
})

test('dining cards retain exact default output when disabled or on a sister operator', () => {
  const original = String(diningCard(restaurant))
  assert.equal(String(diningCard(restaurant, { site: off.site })), original)
  assert.equal(String(diningCard(restaurant, { site: { ...data.site, operator: 'disney' } })), original)
  assert.match(String(diningCard(restaurant, { site: data.site })), /hrg-dining-card/)
})

test('Universal food cards change classes only, preserving every tracker hook and word', () => {
  const original = String(foodCard(item, { tracker: true }))
  const edition = String(foodCard(item, { tracker: true, site: data.site }))
  assert.match(edition, /hrg-food-card/)
  assert.equal(withoutClasses(edition), withoutClasses(original))
  assert.equal(String(foodCard(item, { tracker: true, site: off.site })), original)
})

test('missing food prices stay unknown while a recorded zero remains zero', () => {
  const unknown = String(foodCard({ ...item, price: null }, { site: data.site }))
  assert.match(unknown, /Price unverified/)
  assert.doesNotMatch(unknown, /data-price="0"/)
  assert.match(String(foodCard({ ...item, price: 0 }, { site: data.site })), /data-price="0"/)
})

test('tracker presentation changes no main content or data attributes beyond classes', () => {
  const enabled = foodTrackerPage(data).html
  const disabled = foodTrackerPage(off).html
  assert.match(enabled, /page-tracker hrg-food-tracker/)
  const main = html => html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1]
  assert.equal(withoutClasses(main(enabled)), withoutClasses(main(disabled)))
})

test('new dining and tracker CSS is isolated and prices use tabular figures', () => {
  const css = paletteCss(data.site)
  assert.match(css, /\.hrg-dining-card/)
  assert.match(css, /\.hrg-food-card/)
  assert.match(css, /\.hrg-food-tracker/)
  assert.match(css, /font-variant-numeric:\s*tabular-nums/)
  assert.doesNotMatch(paletteCss(off.site), /\.hrg-dining-|\.hrg-food-card|\.hrg-food-tracker/)
})
