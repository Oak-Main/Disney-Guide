# HANDOFF — Disney-Guide (coasterready.com, ridereadyguide.com, hollywoodrideguide.com)

Remediation Wave 1. Branch `mm/fixwave1`, branched off a freshly fetched `main`
(`9c18f1e Merge pull request #69 from kevynsgrin-a11y/ctr/six-flags-fright-fest-titles`).

This one repo builds three sites. The audit's 41-page `Article` finding on
coasterready.com is 64 blocks here, and the same generator produces the defect on
both sibling sites.

---

## Generated, not hand-maintained

Every page of all three sites is generated. `npm run build` →
`node scripts/validate.mjs && node scripts/validate-seasonal.mjs && node
scripts/factcheck.mjs && node scripts/factcheck-seasonal.mjs && node
src/build.mjs`, writing to `dist/coasterguide` (coasterready.com),
`dist/disney` (ridereadyguide.com) and `dist/universal`
(hollywoodrideguide.com). Source of truth is `src/` plus `data/`. No built HTML
was edited.

Build result on this branch: **921 pages across 3 sites, 0 errors.**

## The finding, and the two different answers

The audit reported `Article.datePublished` and `Article.image` missing. They are
not the same problem and were not treated the same way.

**`image` — fixed.** `src/lib/schema.mjs` now emits
`image: site.socialImage || undefined`. That is the exact value the layout
already writes as `og:image` and `twitter:image` on all 258 coasterready pages
(`https://coasterready.com/assets/img/photos/social-card-coasterready-1280.png`,
sourced from `photos.social` in `data/coasterguide/site.json`). The page already
made this claim; the fix makes it machine-readable. All 64 blocks gained it, and
the two sibling sites gain it too.

Where a site has no social card the property stays `undefined` rather than
pointing at an unrelated image.

**`datePublished` — not fixed, and that is the correct outcome.** There is no
publish date anywhere in the source. The data carries `lastVerified`, which is a
*modified* date; a page is not published on the day it was last verified, and a
git date is not a publication record. Both would be false statements in
structured data that a crawler and a reader would believe. All 64 pages are in
`schema-review.csv` with the URL, the type, why it could not be automated, and
what a human has to supply.

## The honest consequence

**`schemaBlocksInvalid` did not move**: 64 before, 64 after on coasterready.com.
The invalid-block count only falls when both required properties are present, and
one of them has no legitimate source. What did change is 128 missing properties
across the three sites, plus an exact list of what remains and who must supply
it. This is reported rather than dressed up: the class was not fixed.

## `meta-review.csv` — written, not applied

41 coasterready descriptions exceed 155 characters. None are duplicates, so fix
class 2 makes them DRAFT-FOR-HUMAN. Each row carries the current text, current
length, a proposed trim built from that page's own H1 and first paragraph, and
where the proposal came from. **None were applied to the build.**

The drafts are weak where the H1 and the opening paragraph repeat each other —
e.g. `Six Flags Great America. Six Flags Great America` — which is the signal
that they need a human rewrite rather than a mechanical cut. That is what the
DRAFT-FOR-HUMAN label is for.

## Before / after, all three sites

| Class | coasterguide 258p | disney 399p | universal 264p |
| --- | --- | --- | --- |
| schemaBlocksInvalid | 64 → 64 | 84 → 84 | 64 → 64 |
| schemaUnknownTypeNotices | 2 → 2 | 0 → 0 | 0 → 0 |
| missingTitle | 0 → 0 | 0 → 0 | 0 → 0 |
| duplicateTitle | 0 → 0 | 0 → 0 | 0 → 0 |
| missingMetaDescription | 0 → 0 | 0 → 0 | 0 → 0 |
| metaDescriptionOver155 | 41 → 41 | 33 → 33 | 48 → 48 |
| missingCanonical | 0 → 0 | 0 → 0 | 0 → 0 |
| crossDomainCanonical | 0 → 0 | 0 → 0 | 0 → 0 |
| thinNoindexCandidates | 0 → 0 | 0 → 0 | 0 → 0 |
| affiliateLinksMissingSponsored | 0 → 0 | 0 → 0 | 0 → 0 |
| blankTargetMissingNoopener | 0 → 0 | 0 → 0 | 0 → 0 |
| legacyAdScriptPages | 0 → 0 | 0 → 0 | 0 → 0 |
| imagesMissingAlt | 1 → 1 | 31 → 31 | 12 → 12 |
| imagesMissingWidth / Height | 0 → 0 | 0 → 0 | 0 → 0 |
| imagesMissingLoading | 0 → 0 | 0 → 0 | 0 → 0 |
| imagesMissingDecoding | 0 → 0 | 0 → 0 | 0 → 0 |
| externalScriptsNotDeferred | 0 → 0 | 0 → 0 | 0 → 0 |
| pagesMissingViewport | 0 → 0 | 0 → 0 | 0 → 0 |
| **pagesMissingPreconnect** | **258 → 258** | **399 → 399** | **264 → 264** |

**No class regressed, and no class improved except the `image` half of the
schema defect, which is not separately countable.** The two sibling sites are
deliberately untouched apart from the shared generator change.

## Not done, and why

- **`pagesMissingPreconnect` is 258 / 399 / 264 and is not fixed.** Fix class 8
  says preconnect only to hosts each site's built HTML actually loads, with no
  ad-network preconnect. That needs a per-site host inventory of the *built*
  output before anything is added, and it was not guessed at. All three sites
  self-host their fonts (`Archivo Black` from `/assets/fonts/`), so the
  `fonts.gstatic.com` preconnect that would be conventional here is not needed
  and would be pure waste.
- **`imagesMissingAlt` is 1 / 31 / 12** and untouched: alt text is content, and
  the wave routes ambiguous cases to `alt-review.csv` rather than inventing
  descriptions. That CSV was scoped to the other repos.
- **`metaDescriptionOver155`** is reported in `meta-review.csv` and deliberately
  not applied, per the rule that only duplicate-to-unique fixes are automatic.

## Files changed

- `src/lib/schema.mjs` — the `article()` generator: adds `image`, leaves
  `datePublished` explicitly undefined with a comment explaining why.
- `schema-review.csv` — 64 rows, `Article.datePublished`, needs a human.
- `meta-review.csv` — 41 rows, DRAFT-FOR-HUMAN, not applied.

`dist/` is gitignored, so the commit is source and review data only.
