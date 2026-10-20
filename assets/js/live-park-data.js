// Live park data for the park-guide network (ridereadyguide.com = Disney,
// hollywoodrideguide.com = Universal, coasterready.com = coasters).
// Reads pre-warmed data from the TrueAPI ingest worker (ingest.oakandmain.dev)
// — no visitor page-load ever triggers an upstream API call (Phase 1 invariant).
//
// Sources (CORS-open, KV-only, refreshed on the */7 and */17 cron slots):
//   /data/queue-times/parks/<id>/queue_times.json — wait times, nested in
//     lands[].rides[] with { name, is_open, wait_time } (flat data.rides is
//     the fallback shape).
//   /data/open-meteo-weather?latitude=..&longitude=..&... — park-city weather.
//     Params MUST match the ingest feed's OM_WEATHER_CITIES query exactly or
//     the canonical-key read misses (multi-feed API, no fallback).
//
// Rendering: progressive enhancement. Pages render fully without this module;
// [data-live-wait] / [data-live-weather] targets fill in when data arrives.
// Weather resolves independently of queue coverage and response order.

(function () {
  'use strict'

  var INGEST = 'https://ingest.oakandmain.dev/data'

  // Queue-Times park IDs from the ingest's QUEUE_TIMES_PARK_IDS allowlist.
  // ID ↔ name pairs verified against the ingest's warmed parks.json (the
  // authoritative list) 2026-10-07 — 334 is Epic Universe and 66 is Universal
  // Studios Hollywood, not the other way round.
  var PARKS = {
    // Disney operator (ridereadyguide.com)
    6:  { name: 'Magic Kingdom', weather: { latitude: 28.39, longitude: -81.35 } },
    7:  { name: "Disney's Hollywood Studios", weather: { latitude: 28.39, longitude: -81.35 } },
    8:  { name: "Disney's Animal Kingdom", weather: { latitude: 28.39, longitude: -81.35 } },
    16: { name: 'Disneyland Park', weather: { latitude: 33.81, longitude: -117.92 } },
    17: { name: 'Disney California Adventure', weather: { latitude: 33.81, longitude: -117.92 } },

    // Universal operator (hollywoodrideguide.com)
    65: { name: 'Universal Studios Florida', weather: { latitude: 28.39, longitude: -81.35 } },
    64: { name: 'Islands of Adventure', weather: { latitude: 28.39, longitude: -81.35 } },
    334: { name: 'Epic Universe', weather: { latitude: 28.39, longitude: -81.35 } },
    66: { name: 'Universal Studios Hollywood', weather: { latitude: 34.1, longitude: -118.33 } },

    // CoasterReady operator (coasterready.com)
    34: { name: 'Six Flags Over Texas', weather: { latitude: 32.75, longitude: -97.08 } },
    32: { name: 'Six Flags Magic Mountain', weather: { latitude: 34.42, longitude: -118.54 } },
    38: { name: 'Six Flags Great America', weather: { latitude: 42.37, longitude: -87.94 } },
    37: { name: 'Six Flags Great Adventure', weather: { latitude: 40.09, longitude: -74.34 } },
    61: { name: "Knott's Berry Farm", weather: { latitude: 33.87, longitude: -118.0 } },
    279: { name: 'LEGOLAND California', weather: { latitude: 33.16, longitude: -117.35 } },
    280: { name: 'LEGOLAND Florida', weather: { latitude: 27.99, longitude: -81.69 } },
    21: { name: 'SeaWorld Orlando', weather: { latitude: 28.39, longitude: -81.35 } },
    20: { name: 'SeaWorld San Diego', weather: { latitude: 32.76, longitude: -117.23 } },
    22: { name: 'SeaWorld San Antonio', weather: { latitude: 29.45, longitude: -98.51 } },
  }

  // Site park slug → Queue-Times ID. Slugs match data/<operator>/parks/.
  var SLUG_TO_QT_ID = {
    // Disney (ridereadyguide.com)
    'magic-kingdom': 6,
    'hollywood-studios': 7,
    'animal-kingdom': 8,
    'disneyland-park': 16,
    'california-adventure': 17,
    // Universal (hollywoodrideguide.com)
    'universal-studios-florida': 65,
    'islands-of-adventure': 64,
    'epic-universe': 334,
    'universal-studios-hollywood': 66,
    // CoasterReady (coasterready.com)
    'six-flags-over-texas': 34,
    'magic-mountain': 32,
    'great-america': 38,
    'great-adventure': 37,
    'knotts-berry-farm': 61,
    'legoland-california': 279,
    'legoland-florida': 280,
    'seaworld-orlando': 21,
    'seaworld-san-diego': 20,
    'seaworld-san-antonio': 22,
  }

  // EPCOT has no warmed queue feed in this client; Orlando weather remains available.
  var WEATHER_ONLY = {
    epcot: { name: 'EPCOT', weather: { latitude: 28.39, longitude: -81.35 } },
  }

  // EXACT query the ingest's open-meteo-weather feed warmed (feeds.mjs
  // OM_WEATHER_FEEDS). Any deviation is a canonical-key miss → 404.
  var WEATHER_QUERY = {
    hourly: 'temperature_2m,precipitation_probability,weathercode',
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,windspeed_10m_max',
    forecast_days: '3',
    timezone: 'auto',
  }

  function fetchJson(url) {
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then(function (envelope) {
        return envelope && typeof envelope === 'object' && 'data' in envelope
          ? envelope
          : { data: envelope }
      })
  }

  function sourceNote(feed) {
    var fetched = Date.parse(feed.fetchedAt)
    var expired = Number.isFinite(fetched) && Number.isFinite(feed.ttlSeconds)
      && feed.ttlSeconds > 0 && Date.now() - fetched > feed.ttlSeconds * 1000
    var note = feed.stale === true || expired ? 'Stale cached data' : 'Cached source data'
    if (Number.isFinite(fetched)) note += ' · retrieved ' + new Date(fetched).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    if (typeof feed.stale !== 'boolean' || !Number.isFinite(fetched)) note += ' · Freshness unknown'
    return note
  }

  function validNumber(value) {
    return typeof value === 'number' && Number.isFinite(value)
  }

  function allRides(data) {
    if (!data) return []
    if (Array.isArray(data.rides)) return data.rides
    var out = []
    var lands = data.lands || []
    for (var i = 0; i < lands.length; i++) {
      var rides = (lands[i] && lands[i].rides) || []
      for (var j = 0; j < rides.length; j++) out.push(rides[j])
    }
    return out
  }

  function formatWait(minutes) {
    if (!validNumber(minutes) || minutes < 0) return 'Wait unavailable'
    if (minutes === 0) return '0m · Walk-on'
    if (minutes >= 60) return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm'
    return minutes + 'm'
  }

  function waitBand(minutes) {
    if (!validNumber(minutes) || minutes < 0) return 'unknown'
    if (minutes <= 20) return 'low'
    if (minutes <= 45) return 'medium'
    return 'high'
  }

  function escapeHtml(s) {
    if (!s) return ''
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function weatherDescription(code) {
    if (code == null) return 'Weather unavailable'
    if (code === 0) return 'Clear sky'
    if (code <= 3) return 'Partly cloudy'
    if (code <= 48) return 'Foggy'
    if (code <= 67) return 'Rain'
    if (code <= 77) return 'Snow'
    if (code <= 82) return 'Rain showers'
    if (code <= 86) return 'Snow showers'
    return 'Thunderstorm'
  }

  function weatherIcon(code) {
    if (code == null) return '—'
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '🌨️'
    return '⛈️'
  }

  function sectionSlot(container, className) {
    var slot = container.querySelector('.' + className)
    if (!slot) {
      slot = document.createElement('div')
      slot.className = className
      container.appendChild(slot)
    }
    return slot
  }

  function waitSlot(container) {
    var placeholder = container.querySelector('.live-wait-placeholder')
    if (placeholder) placeholder.remove()
    return sectionSlot(container, 'live-wait-slot')
  }

  function weatherSlot(container) {
    return sectionSlot(container, 'live-weather-slot')
  }

  function renderWaitTimes(container, parkId) {
    var park = PARKS[parkId]
    if (!park) return

    fetchJson(INGEST + '/queue-times/parks/' + parkId + '/queue_times.json')
      .then(function (feed) {
        var data = feed.data
        var rides = allRides(data)
        var operating = rides.filter(function (r) { return r && r.is_open === true })
        var open = operating.slice().sort(function (a, b) {
          var aWait = validNumber(a.wait_time) && a.wait_time >= 0 ? a.wait_time : -1
          var bWait = validNumber(b.wait_time) && b.wait_time >= 0 ? b.wait_time : -1
          return bWait - aWait
        })

        var html = '<div class="live-wait-grid" role="region" aria-label="Current wait times for ' + escapeHtml(park.name) + '">'
        html += '<h3 class="live-wait-header">' + escapeHtml(park.name) + ' — Current Waits</h3>'
        html += '<p class="live-wait-meta">Queue-Times · ' + escapeHtml(sourceNote(feed)) + '</p>'

        if (open.length) {
          html += '<ul class="live-wait-list">'
          open.slice(0, 10).forEach(function (ride) {
            html += '<li class="live-wait-item">'
            html += '<span class="ride-name">' + escapeHtml(ride.name) + '</span>'
            html += '<span class="wait-time wait-' + waitBand(ride.wait_time) + '">' + formatWait(ride.wait_time) + '</span>'
            html += '</li>'
          })
          html += '</ul>'
          html += '<p class="live-wait-footer">' + operating.length + ' attractions operating</p>'
        } else {
          html += '<p class="live-wait-closed">' + (rides.length ? 'No operating attractions reported by this feed.' : 'Wait times unavailable.') + '</p>'
        }

        html += '</div>'

        waitSlot(container).innerHTML = html
        container.setAttribute('data-live-status', 'loaded')
      })
      .catch(function (err) {
        container.setAttribute('data-live-status', 'error')
        waitSlot(container).innerHTML = '<p class="live-wait-closed">Wait times unavailable.</p>'
        if (window.console && console.log) console.log('live-wait: ' + err.message)
      })
  }

  function renderWeather(container, park) {
    if (!park) return

    var params = new URLSearchParams({
      latitude: park.weather.latitude,
      longitude: park.weather.longitude,
      hourly: WEATHER_QUERY.hourly,
      daily: WEATHER_QUERY.daily,
      forecast_days: WEATHER_QUERY.forecast_days,
      timezone: WEATHER_QUERY.timezone,
    })

    fetchJson(INGEST + '/open-meteo-weather?' + params.toString())
      .then(function (feed) {
        var data = feed.data
        var slot = weatherSlot(container)
        if (!data || !data.daily || !data.daily.time || !data.daily.time.length) {
          slot.innerHTML = '<p class="live-wait-closed">Weather unavailable.</p>'
          container.setAttribute('data-weather-status', 'error')
          return
        }

        var code = data.daily.weathercode ? data.daily.weathercode[0] : null
        var maxValue = data.daily.temperature_2m_max && data.daily.temperature_2m_max[0]
        var minValue = data.daily.temperature_2m_min && data.daily.temperature_2m_min[0]
        var units = data.daily_units && data.daily_units.temperature_2m_max
        var range = validNumber(maxValue) && validNumber(minValue)
          ? Math.round(minValue) + '°–' + Math.round(maxValue) + (units === '°C' || units === '°F' ? units : '°')
          : 'Temperature unavailable'

        slot.innerHTML = '<div class="live-weather" role="region" aria-label="Park weather forecast">'
          + '<span class="weather-icon" aria-hidden="true">' + weatherIcon(code) + '</span>'
          + '<span class="weather-desc">' + weatherDescription(code) + '</span>'
          + '<span class="weather-range">' + escapeHtml(range) + '</span>'
          + '</div>'
          + '<p class="live-wait-meta">Forecast for ' + escapeHtml(data.daily.time[0]) + ' · ' + escapeHtml(sourceNote(feed)) + '</p>'
        container.setAttribute('data-weather-status', 'loaded')
      })
      .catch(function (err) {
        weatherSlot(container).innerHTML = '<p class="live-wait-closed">Weather unavailable.</p>'
        container.setAttribute('data-weather-status', 'error')
        if (window.console && console.log) console.log('live-weather: ' + err.message)
      })
  }

  // Progressive enhancement: scan for data-live-wait / data-live-weather
  // targets. Accepts a Queue-Times park ID (integer) or a park slug. A target
  // with no mapping clears its placeholder (no fetch, no stuck "Loading…").
  function init() {
    var waitTargets = document.querySelectorAll('[data-live-wait]')
    for (var i = 0; i < waitTargets.length; i++) {
      var el = waitTargets[i]
      // Reserve the wait section before either request resolves, keeping weather below it.
      sectionSlot(el, 'live-wait-slot')
      var raw = el.getAttribute('data-live-wait')
      var parkId = parseInt(raw, 10) || SLUG_TO_QT_ID[raw] || 0
      if (parkId && PARKS[parkId]) renderWaitTimes(el, parkId)
      else {
        waitSlot(el).innerHTML = '<p class="live-wait-closed">Wait times unavailable for this park.</p>'
        el.setAttribute('data-live-status', 'unsupported')
      }
    }

    var weatherTargets = document.querySelectorAll('[data-live-weather]')
    for (var j = 0; j < weatherTargets.length; j++) {
      var el2 = weatherTargets[j]
      var raw2 = el2.getAttribute('data-live-weather')
      var parkId2 = parseInt(raw2, 10) || SLUG_TO_QT_ID[raw2] || 0
      var weatherPark = PARKS[parkId2] || WEATHER_ONLY[raw2]
      if (weatherPark) renderWeather(el2, weatherPark)
      else {
        weatherSlot(el2).innerHTML = '<p class="live-wait-closed">Weather unavailable for this park.</p>'
        el2.setAttribute('data-weather-status', 'unsupported')
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
