# Apelier — Full Static Code Audit
### 17 February 2026 — Traced against uploaded codebase

---

## CRITICAL BUGS (Breaking functionality)

### 1. Gallery tiles show "0 photos" — no photo_count column exists
**Files:** `galleries/page.tsx:63`, `types.ts:281`, `queries.ts:415-427`
**Root cause:** The `Gallery` TypeScript type has `photo_count?: number` (line 281), and the gallery card displays `{gallery.photo_count || 0}` (line 63). But **`photo_count` is NOT a database column** — it doesn't exist in any migration. The `getGalleries()` query (line 415) does `select('*, client:clients(...), job:jobs(...)')` which returns all gallery columns, but `photo_count` is never there.
**Fix:** Either add a computed count subquery in `getGalleries()` or count photos client-side after fetch. Simplest: add `.select('*, client:clients(...), job:jobs(...), photos(count)')` and map the count.

### 2. Gallery tiles show no cover image / preview thumbnail
**Files:** `galleries/page.tsx:44-45`
**Root cause:** The cover area is hardcoded to show a Camera icon placeholder (`<Camera className="w-8 h-8" />`). There's no logic to fetch or display a cover photo. The `Gallery` type doesn't have a `cover_image_url` on the DB table (only on booking_events). No query fetches the first photo's thumb_key as a cover.
**Fix:** In `getGalleries()`, join the first photo's `thumb_key`, generate a signed URL, and display it as the card background.

### 3. Multiple uploads create duplicate galleries per job
**Files:** `photo-upload.tsx:165-170`, `queries.ts:923-970`
**Root cause:** `startUpload()` calls `createGalleryForJob()` every time — line 170. This function (queries.ts:923) does a raw INSERT with **no check for existing gallery on that job**. Upload photos twice to the same job → two separate galleries, two separate review entries.
**Fix:** `createGalleryForJob` must check `getGalleryForJob(jobId)` first and return the existing gallery if one exists. The function `getGalleryForJob` already exists (line 1002) but is never called inside `createGalleryForJob`.

### 4. Old branding URLs still hardcoded
**Files:** `galleries/page.tsx:25`, `api/email/route.ts:264`
- Gallery link: `https://gallery.aperturesuite.com/` — should be `apelier.com.au`
- Email from address fallback: `noreply@aperturesuite.com` — should be `noreply@apelier.com.au`

---

## SIGNIFICANT ISSUES (Workflow problems)

### 5. Galleries page tab order wrong — no separation of Ready vs Delivered
**File:** `galleries/page.tsx:188`
**Current:** `['all', 'ready', 'delivered', 'processing']`
**Problem:** The first thing a photographer sees on the Galleries page is "All", mixing delivered galleries with ones awaiting action. Processing tab exists but the processing status only applies during AI editing.
**Fix:** Reorder to `['ready', 'delivered', 'all']`. Remove 'processing' tab entirely — processing galleries are in Auto Editor, not here.

### 6. No per-gallery settings — gallery name not editable
**File:** `gallery-detail.tsx:247, 283`
**Evidence:** Line 247 literally says `{/* Gallery info bar (read-only — settings controlled globally in Settings page) */}` and line 283 says `Gallery settings are managed globally in Settings → Branding → Gallery Settings.`
**Problem:** Photographer cannot rename a gallery, change description, set cover image, change access type, or set expiry per-gallery. All are global defaults.
**Impact:** Client-facing gallery title is the auto-generated job title (e.g. "Sarah Smith — Wedding Photography") with no way to customise it to something like "Sarah & James | 14.02.2026".

### 7. Empty review entries not cleaned up
**Files:** `review-workspace.tsx`, `processing-jobs/route.ts`
**Problem:** When all photos in a "Ready for Review" entry are rejected/culled, the processing job entry persists. No auto-cleanup logic exists. Combined with issue #3 (duplicate galleries), this means orphaned empty reviews pile up.
**Fix:** After bulk reject or when `stats.total === 0`, auto-delete the processing job.

### 8. Upload 4.5MB limit — partially fixed
**File:** `queries.ts:763-810`
**Status:** The signed URL approach IS implemented — files >4MB use `/api/upload-url` for direct-to-Supabase upload. Files ≤4MB go through `/api/upload` server route. This is **working as designed** but needs testing to confirm the signed URL path works in production (Vercel → Supabase Storage signed upload).

### 9. Job disappears from upload picker after first upload
**File:** `photo-upload.tsx:179`
**Root cause:** After uploading, line 179 does `await updateJob(selectedJob.id, { status: 'editing' })`. The `getUploadableJobs()` query (queries.ts:1125) filters for `IN ('upcoming', 'in_progress', 'editing', 'ready_for_review')` — so 'editing' IS included. However, after upload completes the component state resets via `setUploadComplete(true)` and the job picker may not refresh.
**Likely fix:** The job should still appear. This may be a state management issue where the component reloads and the job picker re-fetches. Needs live testing.

### 10. No package image limit enforcement
**Files:** `photo-upload.tsx:74-75`
**Status:** `existingPhotoCount` and `packageLimit` state variables exist (lines 74-75) but there's no visible enforcement — no "12/50 images" counter in the upload UI, no prevention of uploading beyond the limit. The data is tracked but not surfaced.

---

## MODERATE ISSUES (Polish / completeness)

### 11. Gallery password verification — ACTUALLY WORKING ✅
**File:** `api/gallery-password/route.ts`
**Previous belief:** "accepts any input." **Reality from code audit:** The `gallery-password` API route has proper SHA-256 hashing with salt (`_apelier_salt_2026`) and a `verify` action that compares hashes. If no `password_hash` is set on the gallery, it accepts any password (backwards compat, line 92-94). 
**Real issue:** There's no UI in the photographer dashboard to SET a gallery password. The `gallery-detail.tsx` settings are read-only. So passwords can only be set via the API directly.

### 12. Style profile isolation — WORKING ✅
**File:** `queries.ts:651-654`
**Previous belief:** "not enforced." **Reality:** `getStyleProfiles()` does filter by `photographer.id` (line 654). `createStyleProfile()` also sets `photographer_id` (line 682). The query-level isolation is correct. RLS would add DB-level enforcement.

### 13. No watermarks on client-facing gallery
**File:** `gallery/[slug]/page.tsx`
**Evidence:** Zero references to "watermark" in the client gallery page. Photos display directly from signed URLs with no watermark overlay.
**Fix requires:** Either server-side watermark generation (during AI processing → `watermarked_key`) or client-side canvas overlay.

### 14. Email templates not wired to triggers
**File:** `api/email/route.ts`
**Status:** 5 email templates exist (gallery_delivery, booking_confirmation, invoice, contract_signing, reminder). Only `gallery_delivery` is wired from the gallery deliver flow. Others have the template code but no trigger calls them from their respective workflows.

### 15. Workflows page is UI only
**File:** `workflows/page.tsx`
**Status:** Complete workflow configuration UI with 6 presets. Zero backend — toggling workflows on/off saves nothing, no cron or event system triggers them.

### 16. Analytics has mock calculations
**File:** `analytics/page.tsx`
**Status:** Pulls real Supabase data for some stats but some metrics are computed from mock formulas.

### 17. Branding logo upload is local preview only
**File:** `settings/page.tsx`
**Status:** Logo upload shows a preview in the browser but doesn't persist to Supabase Storage. Save button is a TODO stub.

---

## MINOR / COSMETIC

### 18. Indigo spinner colour — should be gold (rebrand)
**File:** `galleries/page.tsx:138`
**Evidence:** `border-indigo-500/30 border-t-indigo-500` — still indigo/violet, not gold rebrand.

### 19. Gallery filter tab styling — still indigo
**File:** `galleries/page.tsx:194-195`
**Evidence:** `border-indigo-500/40 bg-indigo-500/10 text-indigo-300` — should be gold per brand.

### 20. Mock data banners still reference indigo
**File:** `galleries/page.tsx:179`
**Evidence:** `bg-indigo-500/10 border-indigo-500/20 text-indigo-300`

---

## WHAT'S ACTUALLY WORKING WELL

- **Photo upload** — dual-path (server route <4MB, signed URL >4MB) ✅
- **Style profile isolation** — filtered by photographer_id ✅  
- **Gallery password hashing** — proper SHA-256 with salt ✅
- **Send to Gallery flow** — server-side API bypasses RLS, updates photos/gallery/job status ✅
- **Review workspace** — approve/reject/bulk/star/upload-more all implemented ✅
- **Processing queue** — polling, phase indicators, stale detection ✅
- **Contract e-signing** — complete flow with multi-stroke signature pad ✅
- **Booking system** — public page, auto-creates client/job/invoice ✅
- **Signed URL hydration** — batch photo URL signing in getPhotosWithUrls ✅

---

## PRIORITY FIX ORDER

1. **#3 — Duplicate galleries** (data corruption, creates orphaned records)
2. **#1 — Photo count on gallery cards** (broken display, visible to user)
3. **#2 — Cover image on gallery cards** (blank cards look broken)
4. **#4 — Old branding URLs** (links go nowhere)
5. **#5 — Gallery tab reorder** (UX, first thing photographer sees)
6. **#6 — Per-gallery settings** (can't customise gallery name for clients)
7. **#7 — Empty review cleanup** (orphaned entries pile up)
8. **#13 — Client gallery watermarks** (IP protection)
9. **#10 — Package limit enforcement UI** (state exists, just not displayed)
10. **#14 — Wire remaining email templates** (automation value)
