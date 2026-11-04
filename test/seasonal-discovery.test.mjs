import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveTargets } from '../src/lib/data.mjs'
import { loadSeasonal, MONTHS, urls } from '../src/lib/seasonal-data.mjs'
import { bandCovers, calendarPage } from '../src/seasonal/core.mjs'
import { monthPage } from '../src/seasonal/months.mjs'
import { eventPage } from '../src/seasonal/events.mjs'

test('every published event has one calendar link and one card in each applicable month', async () => {
  for (const operator of await resolveTargets([])) {
    const data = await loadSeasonal(operator.slug)
    const calendar = calendarPage(data).html
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
      assert.equal(calendar.split(link).length - 1, 1, `calendar link for ${event.slug}`)
      const [band] = bands
      for (const { month, name } of MONTHS) {
        const listed = band.listingMonths?.includes(month) ?? bandCovers(band, month)
        assert.equal(cards[month - 1].split(link).length - 1, listed ? 1 : 0, `${event.slug} in ${name}`)
      }
    }
  }
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
