

# Sync Codebase from Knowledge-base Repository

## Summary
The `nrashid7/Knowledge-base` repo (infobase-web folder) contains the original, more complete version of the project from Cursor. The primary gap is the **data files** — the KB repo has all 39 guides while the current Lovable project only has 7 in the English data files. The source code (pages, components, lib) is structurally identical between the two repos, with the Lovable version actually having improvements (bug fixes for the `supabaseUrl` crash, SEO additions, Bengali name translations in featured sites).

## What will change

### 1. Replace English data files (39 guides instead of 7)
- **`src/data/public_guides.json`** — download the full 39-guide version from the KB repo
- **`src/data/public_guides_index.json`** — download the full 39-entry index from the KB repo

### 2. Keep Lovable-specific improvements (no changes needed)
These files were improved in Lovable and should NOT be overwritten:
- `src/lib/api/govSiteUtils.ts` — fixes the `supabaseUrl` crash by decoupling utilities
- `src/lib/guidesStore.ts` — has the `any` type fix for EN/BN dataset switching
- `src/pages/Index.tsx` — has Bengali name translations in FEATURED_SITES and additional sections
- `src/pages/Guides.tsx` — has SEO component addition
- `src/components/SEO.tsx` — has custom OG image
- `index.html` — has custom OG meta tags

### 3. Verify Bengali data files are in sync
Check that `public_guides_bn.json` and `public_guides_index_bn.json` already match (they appear to have all 39 guides already).

## Technical Details
- The data files will be fetched from `raw.githubusercontent.com/nrashid7/Knowledge-base/main/infobase-web/src/data/`
- The JSON files are large but static — they'll be downloaded and written directly
- No code logic changes are needed; the existing `guidesStore.ts` will automatically pick up the expanded dataset
- Build will be verified after replacement

## Risk
Low — only replacing data JSON files with known-good versions from the source repo. All code files are preserved with their Lovable improvements.

