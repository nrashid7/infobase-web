

# Comprehensive Optimization Plan for INFOBASE — Publish-Ready

## Issues Found

### 1. Missing Bengali Translations in Directory (~100+ entries)
Many `govDirectory.ts` entries are missing `nameBn`. Key categories affected:
- **Power & Energy** (~15 entries missing): West Zone Power, NESCO, Ashuganj Power, Coal Power Gen, SREDA, Power Cell, several oil/gas companies
- **Local Government** (several entries): Rajshahi WASA, BAPARD, PDBF, SFDF, Milkvita, BSBL
- **Water Resources** (~5 entries): Joint River Commission, River Research Institute, IWM, CEGIS, Haor & Wetlands
- **Transport** (~3 entries): Road Transport Highway Div, Bridges Div, Bridge Authority, DMTCL
- **Railways** (~1 entry): Dept of Railway Inspection
- **Shipping** (~4 entries): BIWTC, BSC, Land Port Authority, Marine Academy, NMI, NRCC
- **Civil Aviation** (~2 entries): Hotels International, Bangladesh Services
- **ICT** (~3 entries): BCC, Software Technology Park, Bangladesh Post Office, Teletalk

**Fix:** Add `nameBn` translations for all ~100+ missing entries in `govDirectory.ts`.

### 2. NotFound Page Not Bilingual
`NotFound.tsx` is hardcoded in English only — no Bengali translations for "Page not found" or "Return to Home". It also doesn't use the `MainLayout`, causing inconsistent UX.

**Fix:** Add bilingual support via `useLanguage()` and use proper layout/styling consistent with the rest of the app.

### 3. OG Image Uses Lovable Default
`SEO.tsx` and `index.html` both reference `https://lovable.dev/opengraph-image-p98pqg.png` — a generic Lovable placeholder, not an INFOBASE-branded image.

**Fix:** This requires a custom OG image. For now, update the alt text and ensure `og:site_name` is set. Flag for user to provide a branded image later.

### 4. Contact Email is Fake
Both `About.tsx` and `Directory.tsx` reference `hello@infobase.gov.bd` and `contact@infobase.gov.bd` — `.gov.bd` domains the project doesn't own. This could mislead users.

**Fix:** Change to a neutral placeholder or remove email links until a real contact method is established. Use `hello@infobase.lovable.app` or remove mailto links.

### 5. SEO: Missing `og:site_name` and `og:url`
The `SEO.tsx` component doesn't set `og:site_name` or `og:url`, which are important for social sharing.

**Fix:** Add `og:site_name` = "INFOBASE" and `og:url` = canonical URL.

### 6. Header Logo Subtitle Not Bilingual
The header shows "BD Gov Guides" in English regardless of language setting.

**Fix:** Switch to Bengali equivalent when `language === 'bn'`.

### 7. Featured Sites on Homepage Missing Bengali Names
The `FEATURED_SITES` array in `Index.tsx` only has English `name` — no `nameBn` field. When Bengali is active, site names still show in English.

**Fix:** Add `nameBn` to each featured site entry and render conditionally.

### 8. Index.html Pre-rendered Shell is English-Only
The initial loader shows "Every Government Service / One Place" in English. Users with Bengali preference see English flash before React hydrates.

**Fix:** Accept this as a minor trade-off for LCP performance. No change needed — React hydrates quickly.

---

## Implementation Plan (Single Execution)

### Task 1: Add Missing Bengali Translations to govDirectory.ts
Add `nameBn` to all ~100+ entries currently missing it across all categories. This is the largest task.

### Task 2: Fix NotFound Page
- Add `useLanguage()` hook
- Add bilingual text for "404", "Page not found", and "Return to Home"
- Style consistently with the rest of the app

### Task 3: Fix Header Logo Subtitle
Change "BD Gov Guides" to conditionally render Bengali: `সরকারি সেবা গাইড`

### Task 4: Fix Featured Sites Bengali Names
Add `nameBn` to each `FEATURED_SITES` entry in `Index.tsx` and render conditionally

### Task 5: Fix Contact Emails
- Change `hello@infobase.gov.bd` → remove or use `infobase.lovable.app`
- Change `contact@infobase.gov.bd` → same treatment

### Task 6: SEO Improvements
- Add `og:site_name` and `og:url` to `SEO.tsx`
- Add `twitter:card` meta tag in `SEO.tsx`
- These are low-effort, high-impact for social sharing

### Task 7: Minor UI Polish
- Ensure the `Guides` page SEO component is used (currently missing `<SEO>` tag)

---

## What This Does NOT Include (Per Your Request)
- No scraping changes
- No edge function modifications
- No database changes
- No new features — purely optimization of existing content

## Estimated Scope
~7 files modified, mostly `govDirectory.ts` (bulk of the work). All changes are safe, non-breaking, and can run in one go.

