/**
 * Homepage copy slots. site.home is an optional, flat map using the keys below.
 * Defaults are the pre-facelift copy; operators without overrides render unchanged.
 * Limits apply to the authored template, before data placeholders are expanded.
 */
export const HOME_COPY_SLOTS = {
  'hero.kicker': ['{parkCount} US parks · independent & unofficial', 55],
  'hero.title': ['Know exactly what your family can ride, eat, and skip.', 70],
  'hero.lede': ['Every height requirement, every ride worth queueing for, every snack worth the money — checked, dated, and built to work on park WiFi. No affiliate-driven rankings, no reprinted press releases.', 240],
  'hero.actions.height': ['Check what your kid can ride', 40],
  'hero.actions.food': ['Build a snack list', 40],
  'hero.stats.attractions': ['Attractions documented', 32],
  'hero.stats.heights': ['Height requirements', 32],
  'hero.stats.food': ['Snacks with real prices', 32],
  'hero.stats.dining': ['Places to eat', 32],
  'hero.reviewLabel': ['Seasonal information reviewed', 36],
  'trust[0].title': ['Independent and unofficial', 36],
  'trust[0].body': ['We buy our own tickets. No park pays for a place on this site.', 100],
  'trust[1].title': ['Every fact is dated', 30],
  'trust[1].body': ['Each page carries the month it was checked, and says so when it is overdue.', 110],
  'trust[2].title': ['Rankings are not for sale', 36],
  'trust[2].body': ['Affiliate links exist and are disclosed. They never change an order or a verdict.', 110],
  'trust[3].title': ['Works without signal', 30],
  'trust[3].body': ['The tools keep running on park WiFi, or on none at all.', 100],
  'parks.title': ['Start with your park', 36],
  'parks.kicker': ['The {parkCount} parks', 30],
  'parks.intro': ['Each park hub links to its full ride list, height chart, dining, printable map, accessibility notes, and a first-timer plan you can actually follow.', 190],
  'tools.title': ['Three things we do that a search result cannot', 60],
  'tools.kicker': ['Tools, not listicles', 32],
  'tools.height.eyebrow': ['Interactive', 24],
  'tools.height.title': ['Height Checker', 30],
  'tools.height.summary': ['Drag one slider to your child’s height and see, park by park, the recorded height conditions, rules that need checking and near misses.', 190],
  'tools.food.eyebrow': ['Saves offline', 30],
  'tools.food.title': ['Food Tracker', 30],
  'tools.food.summary': ['Mark {foodCount} snacks as want, tried, or skip. It saves on your device, shares as a link, prints as a checklist, and keeps working when the park WiFi does not.', 210],
  'tools.maps.eyebrow': ['Printable', 24],
  'tools.maps.title': ['Park maps', 30],
  'tools.maps.summary': ['Clean schematic maps drawn from open geographic data — no clutter, no ads baked into the image, and they print on one page in black and white.', 190],
  'photoBand.kicker': ['The day you will still be talking about', 50],
  'photoBand.title': ['The fireworks at the end of a very long, very good day.', 70],
  'photoBand.lede': ['You will forget the queue times by next week. You will still be describing this part in ten years. That is the trip this site exists to help you plan — not the most attractions, the best day.', 230],
  'photoBand.label': ['Start with when to go', 32],
  'seasonal.title': ['Seasonal guide for {month}', 55],
  'seasonal.kicker': ['What may be running', 32],
  'seasonal.intro': ['These event windows overlap this month. Each card states whether this year is confirmed, expected, or drawn from the last confirmed cycle.', 180],
  'timing.title': ['Thinking about when to go', 44],
  'timing.kicker': ['Timing', 22],
  'timing.intro': ['Every month graded on crowds, cost, weather, and what is actually running — including the months we think you should avoid.', 160],
  'timing.rankLabel': ['Rank the months by what you care about', 48],
  'timing.allLabel': ['All twelve, graded', 30],
  'guides.title': ['The guides people actually need', 45],
  'guides.kicker': ['Planning', 22],
  'guides.allLabel': ['All {guideCount} guides', 34],
  'calendar.title': ['The whole year on one page', 44],
  'calendar.kicker': ['Seasonal calendar', 30],
  'calendar.intro': ['Season ranges for parties, festivals and overlays. Colour shows how much has been confirmed; check each event page for its exact dates.', 160],
  'calendar.label': ['Open the full calendar', 32],
  'compare.title': ['Settle the argument', 36],
  'compare.kicker': ['Comparisons', 28],
  'compare.intro': ['We commit to an answer on every comparison page. Hedging is not a service.', 100],
  'compare.allLabel': ['All comparisons', 30],
  'funding.title': ['How this site pays for itself', 44],
  'funding.body[0]': ['A small number of affiliate links, mostly to authorized ticket resellers, and nothing else at present. That is the entire business model today. Display advertising may follow; if it does, it will be disclosed here before it ships. Affiliate links are disclosed directly above the link, not buried in the footer.', 350],
  'funding.body[1]': ['What that money does not buy is placement. No restaurant, ride, or reseller can pay to be ranked higher, described more kindly, or added to a “best of” list. When we think something is overpriced or overrated, we say so — including things we would earn a commission on.', 280],
  'funding.body[2]': ['{shortDisclaimer} We buy our own tickets.', 130],
  'funding.policyLabel': ['Read the editorial policy', 32],
  'funding.independenceTitle': ['Independent and unofficial', 36],
  'funding.knowledgeTitle': ['We say what we actually know', 40],
  'funding.knowledgeBody': ['Permanent facts carry the month we last checked them. Anything that moves with the season also says whether it is **confirmed**, **expected**, or **last cycle** — and a page past its own review date says so in a banner nobody here can switch off. Most sites publish this year’s dates whether or not anyone announced them.', 350],
}

export function homeCopy (site, values) {
  return (key) => {
    const slot = HOME_COPY_SLOTS[key]
    if (!slot) throw new Error(`Unknown homepage copy slot: ${key}`)
    const text = site.home?.[key] ?? slot[0]
    if (typeof text !== 'string' || text.length > slot[1]) {
      throw new Error(`home["${key}"] must be a string of at most ${slot[1]} characters`)
    }
    return text.replace(/\{(\w+)\}/g, (token, name) => Object.hasOwn(values, name) ? String(values[name]) : token)
  }
}
