/**
 * The ride status pages: what we can honestly say about whether a ride is running.
 *
 * The honesty split is the whole design. Two kinds of truth are available:
 *
 * 1. SCHEDULED closures - published by the operator on their calendars, verified into our
 *    closures trackers by the normal gates. These wear our confidence styling and say so.
 * 2. Everything else. An "open" ride is "not scheduled for closure" - unscheduled downtime
 *    happens without warning and the operator publishes no pre-opening downtime list (they
 *    surface it per-attraction in their apps, in the day). For that, this page carries
 *    guest reports: anonymous, unverified pings from people at the park, rendered in a
 *    visual language deliberately distinct from anything the freshness contract uses, and
 *    expiring from a rolling window so nothing stale can survive a day.
 *
 * The client half (assets/js/status.js) hydrates the guest-report layer from /api/status.
 */

import { html, raw, escapeHtml } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import { isHollywoodEdition } from '../lib/palette.mjs'
import * as C from '../templates/components.mjs'
import { urls } from '../lib/data.mjs'
import { isMonth } from '../lib/staleness.mjs'
import * as f from '../lib/format.mjs'

const OFFICIAL_LINKS = {
  'walt-disney-world': {
    label: 'My Disney Experience app and the attraction pages at disneyworld.disney.go.com',
    href: 'https://disneyworld.disney.go.com/faq/parks/non-operational-attractions/',
  },
  disneyland: {
    label: 'the daily park-hours calendar at disneyland.disney.go.com',
    href: 'https://disneyland.disney.go.com/faq/parks/closures/',
  },
  'universal-orlando': {
    label: 'the official Universal Orlando Resort app',
    href: 'https://www.universalorlando.com/web/en/us/landing-page/mobile-app',
  },
  'universal-hollywood': {
    label: 'the official Universal Studios Hollywood app',
    href: 'https://www.universalstudioshollywood.com/web/en/us/the-universal-studios-hollywood-mobile-app',
  },
  'seaworld-san-antonio': {
    label: 'the SeaWorld San Antonio app for in-park ride information',
    href: 'https://seaworld.com/san-antonio/mobile-app/',
  },
}

// CoasterReady regions contain parks run by different operators.
const PARK_CLOSURES = {
  'magic-mountain': 'https://www.sixflags.com/magicmountain/scheduled-ride-closures',
  'knotts-berry-farm': 'https://www.sixflags.com/knotts/scheduled-ride-closures',
  'great-america': 'https://www.sixflags.com/greatamerica/scheduled-ride-closures',
  'great-adventure': 'https://www.sixflags.com/greatadventure/scheduled-ride-closures',
  'six-flags-over-texas': 'https://www.sixflags.com/overtexas/scheduled-ride-closures',
  'seaworld-san-diego': 'https://seaworld.com/san-diego/park-info/ride-attraction-schedule/',
  'seaworld-orlando': 'https://seaworld.com/orlando/park-info/ride-attraction-schedule/',
  'legoland-california': 'https://www.legoland.com/california/plan-your-visit/know-before-you-go/temporary-closures/',
  'legoland-florida': 'https://www.legoland.com/florida/plan-your-visit/know-before-you-go/temporary-closures/',
}

/** The standing disclaimer. Persistent, above the fold, and repeated in the footer of the page. */
function statusDisclaimer (site) {
  return html`
    <div class="callout callout--note status-disclaimer" role="note">
      <h3>Read this first: what this page can and cannot tell you</h3>
      <p>${site.brand.name} is an independent, unofficial publication with no affiliation to Disney or any park operator. <strong>Scheduled closures</strong> come from our dated trackers. <strong>Guest reports</strong> are anonymous pings from people at the park — they are <strong>not verified by us, and we cannot confirm any ride's actual operating status</strong>. Reports may be wrong, duplicated, or out of date, and they expire automatically: nothing older than twelve hours can influence anything on this page. Before you walk to a ride, check the park’s official app for current operations.</p>
    </div>
  `
}

/** Build the scheduled-closure lookup for one park across all resort trackers. */
function scheduledFor (seasonal, park) {
  const map = new Map()
  for (const tracker of (seasonal && seasonal.closures) || []) {
    for (const item of tracker.items || []) {
      if (item.parkSlug === park.slug) map.set(item.attractionSlug, item)
    }
  }
  return map
}

function scheduledLabel (item) {
  if (item.status === 'permanently-closed') return { label: 'Closed — permanently', tone: 'danger', note: item.note }
  if (item.status === 'under-construction') return { label: 'Not yet open — under construction', tone: 'muted', note: item.note }
  if (item.status === 'indefinite') return { label: 'Closed — no reopening announced', tone: 'warn', note: item.note }
  if (item.status === 'closed') return { label: 'Closed', tone: 'muted', note: item.note }
  if (item.reopening) return {
    label: `Closed — scheduled${item.reopeningConfidence === 'confirmed' ? `, reopening ${f.humanDate(item.reopening)}` : ''}`,
    tone: 'warn',
    note: item.note,
  }
  return { label: 'Closed — scheduled', tone: 'warn', note: item.note }
}

function closureReview (tracker) {
  if (!isMonth(tracker?.freshness?.verified)) return 'Closure tracker has no recorded check'
  const checked = `Closure tracker checked ${f.humanDate(tracker.freshness.verified)}`
  return tracker.staleness?.state === 'fresh' ? checked : `${checked} · ${tracker.staleness?.label || 'Review date unknown'}`
}

export function statusIndex (data, seasonal) {
  const { site, parks } = data
  const url = urls.statusIndex()
  const lastCheck = (seasonal?.closures || []).map((t) => t.freshness?.verified).filter(isMonth).sort().at(-1)
  const trail = [{ label: 'Home', href: '/' }, { label: 'Ride status', href: url }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Live-ish, and honest about which parts',
      title: 'Ride status',
      lede: 'Check when each regional closure tracker was reviewed. Guest reports from inside the park expire after twelve hours. Consult the park’s own app for today’s ride availability.',
      tone: 'compact',
    })}

    ${C.section({
      children: html`
        ${statusDisclaimer(site)}
        <div class="mt-5">
          ${C.cardGrid(parks.map((p) => C.card({
            href: urls.statusPark(p.slug),
            title: `${p.name} ride status`,
            summary: `${p.attractions.length} listed attractions · ${closureReview(seasonal?.closuresByResort?.get(p.resort))}`,
          })), { columns: 3 })}
        </div>
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'How the guest-report tiers work',
      children: html`
        <div class="split split--even">
          <div class="prose">
            <p>Anyone at the park can tap <em>report closed</em> on a ride — no account, no name, nothing tracked. When <strong>two people</strong> report the same ride within <strong>two hours</strong>, the page shows an amber advisory: guests are reporting it down, be aware. When <strong>seven or more</strong> report it within <strong>twelve hours</strong>, the line turns red and reads as confirmed by guests — guests, not us, and never the operator.</p>
            <p>Reports carry a plain-English price: they are anecdotes, not data. The tiers exist because one person's one-off is noise and seven strangers agreeing within a morning is signal — strong enough to act on, weak enough to verify against the operator's app before you walk across a park.</p>
          </div>
          <div>
            ${C.callout({ type: 'tip', title: 'Why we will never say "confirmed closed"', body: 'The site\'s whole value is that "confirmed" means verified against a named source. A guest report is never that. The red tier says reported by seven or more guests — the operator\'s app is the only place the word confirmed belongs.' })}
            ${C.callout({ type: 'note', title: 'Reset and freshness', body: 'Every report expires exactly twelve hours after it was made, so each morning starts clean and nothing from yesterday can colour today. This is a rolling window by design — fresher than a single nightly reset.' })}
          </div>
        </div>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        ...(isHollywoodEdition(site) ? { bodyClass: 'hrg-seasonal' } : {}),
        title: 'Ride status',
        titleTail: ' — scheduled closures and guest reports',
        description: 'Find scheduled ride closures by park, each regional tracker’s last review, and anonymous guest reports from the past twelve hours.',
        trail,
        modified: lastCheck && `${lastCheck}-01`,
      },
      body,
    }),
  }
}

export function statusParkPage (park, data, seasonal) {
  const { site } = data
  const url = urls.statusPark(park.slug)
  const trail = [{ label: 'Home', href: '/' }, { label: 'Ride status', href: urls.statusIndex() }, { label: park.shortLabel || park.name, href: url }]
  const scheduled = scheduledFor(seasonal, park)
  const tracker = seasonal?.closuresByResort?.get(park.resort)
  const lastCheck = tracker?.freshness?.verified
  const closuresUrl = PARK_CLOSURES[park.slug]
  const official = closuresUrl
    ? { href: closuresUrl, label: `${park.name} scheduled closures` }
    : OFFICIAL_LINKS[park.slug] || OFFICIAL_LINKS[park.resort]
  /* Every attraction the dataset knows: open rides as live rows, closed or unbuilt ones
     as their verified tracker state - a board that omits the closed rides answers a
     different question than the one a reader brings to it. */
  const rides = park.attractions.map((a) => {
    const item = scheduled.get(a.slug) || (a.isOpen ? null : { status: 'closed', note: a.closedNote || null })
    return { slug: a.slug, name: a.name, url: a.url, item, isOpen: a.isOpen }
  })
  const closedCount = rides.filter((r) => r.item).length

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${park.resortInfo ? park.resortInfo.name : ''} · ride status`,
      title: `${park.name} today`,
      lede: `${closureReview(tracker)}. Check the park’s own app for same-day ride availability.`,
      tone: 'compact',
      meta: [
        { label: 'No closure listed', value: String(rides.length - closedCount) },
        { label: 'Closed or scheduled', value: String(closedCount) },
        { label: 'Guest reports', value: 'rolling 12-hour window' },
      ],
    })}

    ${C.section({
      children: html`
        ${statusDisclaimer(site)}
        ${tracker?.url ? html`<p class="small mt-4"><a href="${tracker.url}">Regional closure tracker and review notes</a></p>` : ''}
        ${official ? html`<p class="small mt-4">Official park source: <a href="${official.href}" rel="noopener">${official.label}</a></p>` : ''}
        <div class="mt-5 status-board" data-status-board="${park.slug}" data-turnstile-key="0x4AAAAAAEuLe7a9JPDqEtAx">
          <noscript><p class="callout callout--note">Guest reports need JavaScript. The scheduled-closure table below is complete without them.</p></noscript>
          <div data-status-rows>
            ${rides.map((r) => {
              if (r.item) {
                const s = scheduledLabel(r.item)
                return html`<div class="status-row status-row--scheduled" data-ride="${r.slug}">
                  <span class="status-row__name"><a href="${r.url}">${r.name}</a></span>
                  <span class="pill pill--tone-${s.tone} status-row__pill">${s.label}</span>
                  ${r.item.note ? html`<span class="status-row__note">${r.item.note}</span>` : ''}
                </div>`
              }
              return html`<div class="status-row" data-ride="${r.isOpen ? r.slug : ''}">
                <span class="status-row__name">${r.url ? html`<a href="${r.url}">${r.name}</a>` : r.name}</span>
                <span class="pill status-row__pill status-row__pill--open" data-open-pill>No closure listed</span>
                <span class="status-row__report" data-report-slot></span>
              </div>`
            })}
          </div>
        </div>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        ...(isHollywoodEdition(site) ? { bodyClass: 'hrg-seasonal' } : {}),
        title: `${park.name} ride status`,
        titleTail: ' — closures and guest reports',
        description: `Ride status at ${park.name}, including dated closure records and guest reports from the past twelve hours. Check the park’s app for same-day operations.`,
        trail,
        modified: isMonth(lastCheck) ? `${lastCheck}-01` : undefined,
        noindex: false,
      },
      body,
      scripts: ['/assets/js/status.js'],
    }),
  }
}
