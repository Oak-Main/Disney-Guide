import * as f from './format.mjs'

/** Recorded facts only. Missing is not false, zero is not missing, unknown is not "no". */
export function rideSpecItems (attraction, site) {
  const text = (value) => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
  const fields = [
    ['goesUpsideDown', 'Inversions', text],
    ['durationMinutes', 'Ride length', (v) => typeof v === 'number' ? f.duration(v) : text(v)],
    ['heightIn', 'Minimum height', (v) => typeof v === 'number' ? f.height(v) : text(v)],
    ['singleRider', 'Single rider', text],
    ['lightningLane', site.queue?.name || 'Paid queue', (v) => site.queue?.labels?.[v] ?? text(v)],
    ['typicalWait', 'Typical wait', text],
    ['getsWet', 'Getting wet', (v) => ['none', 'light', 'soaked'].includes(v) ? f.getsWet(v) : text(v)],
    ['intensity', 'Intensity', (v) => Number.isInteger(v) && v >= 1 && v <= 5 ? f.intensityLabel(v) : text(v)],
  ]
  return fields
    .filter(([key]) => Object.hasOwn(attraction, key) && attraction[key] != null && attraction[key] !== '')
    .map(([key, label, format]) => ({ label, value: format(attraction[key]) }))
}
