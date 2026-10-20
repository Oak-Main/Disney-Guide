import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { serviceWorkerVersion, buildServiceWorker } from '../src/build.mjs'
import { loadData } from '../src/lib/data.mjs'
import { heightCheckerPage } from '../src/pages/tools.mjs'

for (const operator of ['disney', 'universal', 'coasterguide']) {
  test(`${operator}: the generated worker precaches the exact stylesheet URL and declared display font for offline planning`, async () => {
    const dist = await mkdtemp(join(tmpdir(), 'disney-release-worker-'))
    try {
      const data = await loadData(operator)
      const page = heightCheckerPage(data)
      const href = page.html.match(/href="(\/assets\/css\/operator\.css\?[^"]+)"/)[1]
      await mkdir(join(dist, 'assets', 'css'), { recursive: true })
      await writeFile(join(dist, 'assets', 'css', 'operator.css'), 'body { color: white }')
      const font = data.site.brand.font?.file
      if (font) {
        await mkdir(join(dist, 'assets', 'fonts'), { recursive: true })
        await writeFile(join(dist, font), 'test font bytes')
      }
      await buildServiceWorker(dist, data, [page])
      const worker = await readFile(join(dist, 'sw.js'), 'utf8')
      const precache = JSON.parse(worker.match(/var PRECACHE_URLS = (\[[^\n]+\])/)[1])
      assert.equal(precache.filter(url => url === href).length, 1, 'offline cache keys must include the same stylesheet query version as the page')
      if (font) assert.equal(precache.filter(url => url === font).length, 1, 'the selected display face must be available even if its first request preceded worker activation')
    } finally {
      assert.ok(resolve(dist).startsWith(resolve(tmpdir()) + sep + 'disney-release-worker-'))
      await rm(dist, { recursive: true, force: true })
    }
  })
}

test('same-count accuracy corrections and script/style changes invalidate offline content revisions', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'coasterready-cache-revision-'))
  try {
    await mkdir(join(dist, 'assets', 'js'), { recursive: true })
    await mkdir(join(dist, 'assets', 'css'), { recursive: true })
    await writeFile(join(dist, 'assets', 'js', 'height-checker.js'), 'const height = 48')
    await writeFile(join(dist, 'assets', 'css', 'main.css'), 'body { color: black }')
    const data = { operator: 'coasterguide' }
    const pages = [{ url: '/rides/', html: 'Gold Rusher 48' }, { url: '/', html: 'Home' }]
    const revision = () => serviceWorkerVersion(data, pages, dist, 'worker-template')
    const original = await revision()
    assert.equal(await serviceWorkerVersion(data, [...pages].reverse(), dist, 'worker-template'), original)
    pages[0].html = 'Gold Rusher 49'
    assert.notEqual(await revision(), original, 'same page count cannot retain obsolete height HTML')
    pages[0].html = 'Gold Rusher 48'
    await writeFile(join(dist, 'assets', 'js', 'height-checker.js'), 'const height = 54')
    const changedScript = await revision()
    assert.notEqual(changedScript, original, 'corrected scripts require a new cache')
    await writeFile(join(dist, 'assets', 'css', 'main.css'), 'body { color: navy }')
    const changedStyle = await revision()
    assert.notEqual(changedStyle, changedScript, 'changed styles require a new cache')
    await mkdir(join(dist, 'assets', 'fonts'))
    await writeFile(join(dist, 'assets', 'fonts', 'display.woff2'), 'font revision one')
    const addedFont = await revision()
    assert.notEqual(addedFont, changedStyle, 'new font files require a new cache')
    await writeFile(join(dist, 'assets', 'fonts', 'display.woff2'), 'font revision two')
    assert.notEqual(await revision(), addedFont, 'same-size font corrections require a new cache')
    for (const extension of ['ttf', 'otf', 'woff']) {
      const beforeFont = await revision()
      const fontPath = join(dist, 'assets', 'fonts', `display.${extension}`)
      await writeFile(fontPath, 'font revision one')
      const addedFormat = await revision()
      assert.notEqual(addedFormat, beforeFont, `${extension} files require a new cache`)
      await writeFile(fontPath, 'font revision two')
      assert.notEqual(await revision(), addedFormat, `same-size ${extension} corrections require a new cache`)
    }
    const beforeSearch = await revision()
    await writeFile(join(dist, 'search-index.json'), '[{"name":"Gold Rusher"}]')
    const changedSearch = await revision()
    assert.notEqual(changedSearch, beforeSearch, 'search or status data changes require a new cache')
    await mkdir(join(dist, 'maps'))
    await writeFile(join(dist, 'maps', 'magic-mountain-map.svg'), '<svg><title>Coverage diagram</title></svg>')
    assert.notEqual(await revision(), changedSearch, 'map corrections require a new cache')
    assert.notEqual(await serviceWorkerVersion(data, pages, dist, 'changed-worker'), await revision())
  } finally {
    await rm(dist, { recursive: true, force: true })
  }
})
