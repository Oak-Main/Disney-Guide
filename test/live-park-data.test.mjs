import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../assets/js/live-park-data.js', import.meta.url), 'utf8')

class Element {
  constructor (className = '') { this.className = className; this.children = []; this.attrs = {}; this.html = '' }
  set innerHTML (value) { this.html = value; this.children = [] }
  get innerHTML () { return this.html + this.children.map(x => x.innerHTML).join('') }
  appendChild (node) { node.parent = this; this.children.push(node); return node }
  remove () { this.parent.children = this.parent.children.filter(x => x !== this) }
  querySelector (selector) { return this.children.find(x => selector === '.' + x.className) || null }
  setAttribute (name, value) { this.attrs[name] = value }
  getAttribute (name) { return this.attrs[name] ?? null }
}

function client (slug = 'magic-kingdom') {
  const container = new Element()
  container.attrs = { 'data-live-wait': slug, 'data-live-weather': slug }
  const placeholder = new Element('live-wait-placeholder')
  placeholder.innerHTML = 'Loading current wait times…'
  container.appendChild(placeholder)
  const requests = []
  const fetch = url => new Promise((resolve, reject) => requests.push({ url, resolve, reject }))
  const document = {
    readyState: 'complete',
    createElement: () => new Element(),
    querySelectorAll: selector => ['[data-live-wait]', '[data-live-weather]'].includes(selector) ? [container] : [],
  }
  new Function('window', 'document', 'fetch', 'URLSearchParams', source)({ console: { log () {} } }, document, fetch, URLSearchParams)
  const wait = requests.find(x => x.url.includes('/queue-times/'))
  const weather = requests.find(x => x.url.includes('/open-meteo-weather?'))
  async function respond (request, data, metadata = {}) {
    assert.ok(request, 'expected source request')
    request.resolve({ ok: true, json: async () => ({ data, fetchedAt: new Date().toISOString(), stale: false, ttlSeconds: 300, ...metadata }) })
    await new Promise(resolve => setImmediate(resolve))
  }
  return { container, requests, wait, weather, respond }
}

const weatherData = { daily: { time: ['2026-10-20'], weathercode: [0], temperature_2m_max: [0], temperature_2m_min: [-2] }, daily_units: { temperature_2m_max: '°C' } }
const rides = (...entries) => ({ lands: [{ rides: entries }] })
const ride = (name, wait_time, is_open = true) => ({ name, wait_time, is_open })

test('zero-minute waits remain visible and missing, invalid and closed values cannot become zero', async () => {
  const c = client()
  await c.respond(c.wait, rides(ride('Walk-on ride', 0), ride('Missing wait', null), ride('Invalid wait', -5), ride('String wait', '0'), ride('Closed ride', 0, false)))
  assert.match(c.container.innerHTML, /Walk-on ride/)
  assert.match(c.container.innerHTML, /0m.*Walk-on/)
  assert.match(c.container.innerHTML, /Wait unavailable/)
  assert.doesNotMatch(c.container.innerHTML, /wait times posting shortly|Closed ride/)
  assert.doesNotMatch(c.container.innerHTML, /Invalid wait[^<]*<[^>]*>0/)
})

test('an empty top-level rides array cannot hide populated land rides', async () => {
  const c = client()
  await c.respond(c.wait, { rides: [], lands: [{ rides: [ride('Nested walk-on', 0)] }] })
  assert.match(c.container.innerHTML, /Nested walk-on/)
  assert.match(c.container.innerHTML, /0m.*Walk-on/)
  assert.doesNotMatch(c.container.innerHTML, /Wait times unavailable/)
})

test('land and unlanded rides are combined without duplicate provider IDs', async () => {
  const c = client()
  const nested = { ...ride('Nested attraction', 20), id: 1 }
  await c.respond(c.wait, { lands: [{ rides: [nested, { ...ride('Closed attraction', 0, false), id: 2 }] }], rides: [{ ...nested }, { ...ride('Unlanded attraction', 0), id: 3 }] })
  assert.equal((c.container.innerHTML.match(/Nested attraction/g) || []).length, 1)
  assert.match(c.container.innerHTML, /Unlanded attraction/)
  assert.match(c.container.innerHTML, /2 attractions operating/)
  assert.doesNotMatch(c.container.innerHTML, /Closed attraction/)
})

for (const order of ['weather-first', 'wait-first']) {
  test(`independent wait and weather content survives ${order} response order`, async () => {
    const c = client()
    const waitResponse = () => c.respond(c.wait, rides(ride('Test ride', 15)))
    const weatherResponse = () => c.respond(c.weather, weatherData)
    if (order === 'weather-first') { await weatherResponse(); await waitResponse() } else { await waitResponse(); await weatherResponse() }
    assert.match(c.container.innerHTML, /Test ride/)
    assert.match(c.container.innerHTML, /Clear sky/)
    assert.match(c.container.innerHTML, /−?2°|\-2°/)
    assert.match(c.container.innerHTML, /0°/)
    assert.deepEqual(c.container.children.map(el => el.className), ['live-wait-slot', 'live-weather-slot'], 'response order must not reorder the visible sections')
  })
}

test('EPCOT receives independent Orlando weather without an unsupported queue request or a stuck loader', async () => {
  const c = client('epcot')
  assert.equal(c.wait, undefined)
  assert.match(c.weather?.url || '', /latitude=28\.39/)
  await c.respond(c.weather, weatherData)
  assert.match(c.container.innerHTML, /Clear sky/)
  assert.doesNotMatch(c.container.innerHTML, /Loading current wait/)
})

test('Universal queue requests retain the provider-confirmed Islands 64 and Studios 65 mappings', () => {
  assert.match(client('islands-of-adventure').wait.url, /parks\/64\//)
  assert.match(client('universal-studios-florida').wait.url, /parks\/65\//)
})

test('stale and unknown freshness are visible without a fabricated refresh cadence', async () => {
  const c = client()
  await c.respond(c.wait, rides(ride('Cached walk-on', 0)), { stale: true, fetchedAt: '2026-10-01T12:34:56Z' })
  assert.match(c.container.innerHTML, /Stale cached data/)
  assert.match(c.container.innerHTML, /2026-10-01 12:34 UTC/)
  assert.doesNotMatch(c.container.innerHTML, /updates every 5 min/)
  const unknown = client()
  await unknown.respond(unknown.wait, rides(ride('Unknown age', 10)), { stale: undefined, fetchedAt: undefined })
  assert.match(unknown.container.innerHTML, /Freshness unknown/)
})

test('empty or failed sources show unavailable instead of claiming the park is closed or retaining loading text', async () => {
  const c = client()
  await c.respond(c.wait, {})
  assert.match(c.container.innerHTML, /Wait times unavailable/)
  assert.doesNotMatch(c.container.innerHTML, /Park closed|Loading current wait/)
  const failed = client()
  failed.wait.reject(new Error('source unavailable'))
  await new Promise(resolve => setImmediate(resolve))
  assert.match(failed.container.innerHTML, /Wait times unavailable/)
  assert.doesNotMatch(failed.container.innerHTML, /Loading current wait/)
})

test('missing temperatures remain unavailable while a genuine zero degree reading is preserved', async () => {
  const c = client()
  await c.respond(c.weather, { daily: { time: ['2026-10-20'], weathercode: [0] } })
  assert.match(c.container.innerHTML, /Temperature unavailable/)
  assert.doesNotMatch(c.container.innerHTML, /0°/)
})
