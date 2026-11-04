import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData, resolveTargets } from '../src/lib/data.mjs'
import { staleness } from '../src/lib/staleness.mjs'
import { loadSeasonal, MONTHS, urls } from '../src/lib/seasonal-data.mjs'
import { bandCovers, calendarPage } from '../src/seasonal/core.mjs'
import { monthPage } from '../src/seasonal/months.mjs'
import { eventPage } from '../src/seasonal/events.mjs'
import { statusIndex, statusParkPage } from '../src/seasonal/status.mjs'

test('every published event has one calendar link and one card in each applicable month', async () => {
  for (const operator of await resolveTargets([])) {
    const data = await loadSeasonal(operator.slug)
    const calendarRows = (calendarPage(data).html.match(/<div class="gantt__row" role="row">[\s\S]*?<\/div>/g) || []).join('\n')
    const cards = MONTHS.map(({ month, name }) => {
      const page = monthPage(data.monthByNumber.get(month), data).html
      const section = page.split(`<h2>What is on in ${name}</h2>`)[1]
      assert.ok(section, `${operator.slug}: missing events section for ${name}`)
      return section.split('</section>')[0]
    })
    for (const event of data.events) {
      const link = `href="${event.url}"`
      const bands = data.calendarBands.filter((band) => band.eventSlug === event.slug)
      assert.equal(bands.length, 1, event.slug)
      assert.equal(calendarRows.split(link).length - 1, 1, `calendar link for ${event.slug}`)
      const [band] = bands
      for (const { month, name } of MONTHS) {
        const listed = band.listingMonths?.includes(month) ?? bandCovers(band, month)
        assert.equal(cards[month - 1].split(link).length - 1, listed ? 1 : 0, `${event.slug} in ${name}`)
      }
    }
  }
})

test('the status index and park page date closure evidence from the regional tracker', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const freshness = { verified: '2020-07', reviewBy: '2020-10', confidence: 'expected' }
  const tracker = { resort: park.resort, items: [], freshness, staleness: staleness(freshness) }
  const seasonal = { closures: [tracker], closuresByResort: new Map([[park.resort, tracker]]) }
  for (const page of [statusIndex(data, seasonal), statusParkPage(park, data, seasonal)]) {
    assert.match(page.html, /Closure tracker checked July 2020 · Review overdue/)
    assert.match(page.html, /"dateModified"\s*:\s*"2020-07-01"/)
  }
  const missing = statusParkPage(park, data, { closures: [] }).html
  assert.match(missing, /Closure tracker has no recorded check/)
  assert.doesNotMatch(missing, /"dateModified"/)
  assert.ok(missing.includes('href="https://www.sixflags.com/magicmountain/scheduled-ride-closures"'))
})

test('Magic Mountain Holiday in the Park keeps its Southern California year-wrap and verified metadata', async () => {
  const data = await loadSeasonal('coasterguide')
  const slug = 'holiday-in-the-park-magic-mountain'
  const event = data.eventBySlug.get(slug)
  const months = data.months.filter((m) => m.events.includes(event)).map((m) => m.month)
  assert.deepEqual(months, [1, 11, 12])

  const rows = calendarPage(data).html.match(/<div class="gantt__row" role="row">[\s\S]*?<\/div>/g)
  const row = rows.find((item) => item.includes(`href="${urls.event(slug)}"`))
  assert.ok(row)
  assert.ok(row.includes('Southern California'))
  assert.equal((row.match(/gantt__bar--confirmed/g) || []).length, 2)
  assert.deepEqual([...row.matchAll(/grid-column:(\d+ \/ \d+)/g)].map((match) => match[1]), ['11 / 13', '1 / 2'])

  const { html } = eventPage(event, data)
  assert.ok(html.includes(`rel="canonical" href="${data.site.brand.origin}${event.url}"`))
  assert.ok(event.description.length >= 120 && event.description.length <= 160)
  const nodes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((match) => {
      const json = JSON.parse(match[1])
      return json['@graph'] ?? json
    })
  for (const type of ['Article', 'WebPage']) {
    assert.equal(nodes.find((node) => node['@type'] === type)?.dateModified, event.factCheck.verified)
  }
})
