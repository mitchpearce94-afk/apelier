# Aperture Suite — Master Document

**Version:** 2.0  
**Last Updated:** 14 February 2026  
**Project Location:** `C:\Users\mitch\OneDrive\Documents\aperture-suite`  
**GitHub:** `github.com/mitchpearce94-afk/aperture-suite`  
**Live URL:** Deployed on Vercel (auto-deploys from `main` branch)  
**Supabase Project:** `ibugbyrbjabpveybuqsv`

---

## 1. What Is Aperture Suite?

Aperture Suite is a vertically integrated SaaS platform for photographers that combines CRM/job management (replacing Studio Ninja), client gallery delivery (replacing Pic-Time), and AI-powered photo editing (replacing Aftershoot/Imagen) into a single product.

**The core promise:** From shutter click to client delivery in under 1 hour, versus the industry average of 4–8 weeks.

**Key differentiator:** The photographer's only manual actions are (1) adding a lead and (2) uploading photos after a shoot. Everything else — quoting, booking, invoicing, editing, delivery, follow-ups, reviews, referrals — is fully automated.

---

## 2. The Fully Automated Client Journey

This is the complete end-to-end flow. The photographer's only touchpoints are marked with 👤. Everything else happens automatically.

### Stage 1: Lead Capture
- **Automated sources:** Website contact form auto-creates lead → future: Facebook/Instagram lead ads via Meta API, email parsing
- **Manual sources:** 👤 Photographer manually adds lead from Instagram DMs, phone calls, word-of-mouth
- **System auto-responds** with a personalised enquiry response email within minutes

### Stage 2: Quoting
- System auto-generates a **client-facing quote link** (e.g. `yourbrand.aperturesuite.com/quote/abc123`)
- Client opens the link and sees: photographer's branding, package options with pricing, what's included (images, duration, deliverables), and options to add extras (additional images, prints, etc. — configurable by the photographer in Settings)
- Client **accepts or declines the quote:**
  - **Accept →** triggers Stage 3 (Booking)
  - **No response →** system auto-sends follow-up emails at configurable intervals ("Just checking in — did you have any questions about the quote?")
  - **Decline →** lead updated accordingly, optional "what could we do differently?" follow-up

### Stage 3: Booking
There are two paths to booking:

**Path A — Automated (from accepted quote):**
- **All of the following happen automatically when the client accepts the quote:**
  - Lead status → "Booked"
  - Job created with all details from the selected package (duration, included images, start/end time, any extras they added)
  - Job number assigned (permanent, auto-incrementing, never resets: #0001, #0002...)
  - Contract auto-sent to client for e-signing
  - Once contract signed → Invoice(s) generated and sent (see invoicing rules below)
  - Booking confirmation email sent to client with date, time, location, what to expect
  - Job added to calendar
  - Pre-shoot workflow automation triggered (reminder emails scheduled)

**Path B — Manual (direct booking from DM/phone call):**
- 👤 Photographer creates a job directly from the dashboard (client DMs saying "book me in for your available times", or books on a phone call)
- 👤 Selects the client (or creates new), picks a package, sets the date/time
- Same automation kicks in from that point: contract sent, invoices generated, confirmation email, calendar entry, workflow triggers

**Invoicing rules (apply to both paths):**
- If package requires deposit → Deposit invoice `INV-0001-DEP` sent immediately on booking (due on receipt) + Final invoice `INV-0001-FIN` created on booking, auto-sent 28 days before shoot date, with due date set to 14 days before shoot date
- If no deposit (pay in full) → Single invoice `INV-0001` created on booking, auto-sent 28 days before shoot date, with due date set to 14 days before shoot date
- **Payment happens separately** when the client pays their invoice(s) — not at the quoting/booking stage
- Overdue invoice reminders sent automatically at configurable intervals after the due date

### Stage 4: Pre-Shoot
- **7 days before:** Auto-email to client with shoot prep tips, location details, what to wear suggestions
- **1 day before:** Auto-reminder email with time, location, and any last-minute details
- **Final invoice reminder** if balance is still unpaid (configurable timing)
- Job status auto-updates to "In Progress" on shoot date

### Stage 5: Post-Shoot — Upload & AI Processing
- 👤 Photographer uploads RAW files to the job (browser upload or future desktop sync agent)
- **Job status workflow on upload:**
  1. Upload starts → Job status changes to **"Editing"**
  2. AI processing pipeline kicks off automatically (6 phases below)
  3. AI finishes → Job status changes to **"Ready for Review"** → photographer gets notification
  4. 👤 Photographer reviews and approves (Stage 6)
  5. 👤 Photographer clicks "Approve & Deliver" → Job status changes to **"Delivered"**
  6. Client views gallery AND invoice is paid → Job status auto-changes to **"Completed"**
  7. If invoice is unpaid after delivery → Job stays on "Delivered" with unpaid flag

- **AI processing pipeline (6 phases, 24 steps):**

  **Phase 0 — Analysis:** Scene detection (portrait/landscape/ceremony/reception), face detection, quality scoring (exposure, focus, noise), duplicate grouping, EXIF extraction

  **Phase 1 — Style Application:** Applies photographer's trained style profile (exposure, white balance, contrast, colour grading, shadows, highlights, HSL, tone curve). Trained from 50–200 reference images the photographer uploads (much lower barrier than Imagen's 3,000–5,000 requirement)

  **Phase 2 — Face & Skin Retouching:** Automatic skin smoothing (texture-preserving), blemish/acne removal, stray hair cleanup, red-eye removal, subtle teeth whitening

  **Phase 3 — Scene Cleanup:** Background person/distraction removal, exit sign removal, power line removal, lens flare removal, trash/bright distraction removal

  **Phase 4 — Composition:** Horizon straightening, crop optimisation, rule-of-thirds alignment

  **Phase 5 — QA & Output:** Final quality check, generate web-res + thumbnails + full-res outputs, verify all images processed

- **AI selects the top N images** based on the package's "Included Images" count (e.g. 50), using quality score, variety (different scenes/poses/people), and composition
- If AI can only find fewer good images than the package requires → notification to photographer
- If more selected than package count → notification to confirm or trim
- **48 hours post-shoot:** Auto-email asking client "How did we do?" (review request)

### Stage 6: Review & Approval
- 👤 Photographer receives notification that AI processing is complete
- 👤 Photographer opens the gallery workspace, scrolls through before/after previews
- 👤 Photographer approves the gallery (95%+ of images should be perfect; the prompt-based chat editor handles the other 5%)
- **Prompt-based editing** for edge cases: photographer types natural language instructions per image (e.g. "remove the person in the background", "make the sky more blue", "smooth out the wrinkles on the tablecloth"). AI interprets and applies using inpainting/generative fill. Non-destructive with full undo history.

### Stage 7: Delivery
- 👤 Photographer clicks "Approve & Deliver"
- **Everything else is automatic:**
  - Client-facing gallery created with photographer's branding, colours, logo, watermark settings
  - Gallery link generated (password-protected if configured)
  - Delivery email sent to client with gallery link
  - Gallery features: AI-powered search ("ceremony", "first dance"), face recognition grouping, favourites/heart system, configurable download permissions, social sharing with photographer credit, video support, print ordering
  - Client can view, download, favourite, share, and order prints
  - Photographer sees analytics: which images viewed, favourited, downloaded

### Stage 8: Post-Delivery Automations (run forever once configured)
- **3 days post-delivery:** Follow-up email — "Have you had a chance to view your gallery?"
- **Gallery expiry warning:** 7 days before gallery expires (if expiry is set)
- **Early bird print sales:** Promotional pricing on prints within first 2 weeks
- **Favourites follow-up:** "You favourited 12 images — would you like prints?"
- **Review request:** Prompt for Google/Facebook review with direct links
- **Referral prompt:** "Know someone who needs a photographer?" with referral link/discount
- **Anniversary email:** 1 year later — "Happy anniversary! Book a session to celebrate"
- **Overdue invoice reminders:** Automated escalation at configurable intervals

### Summary: What the Photographer Actually Does
| Action | Manual? |
|--------|---------|
| Add lead (from DM/call) | 👤 Yes |
| Create job directly (if client books via DM/phone) | 👤 Yes (optional path) |
| Upload photos after shoot | 👤 Yes |
| Review AI-edited gallery | 👤 Yes (quick scan) |
| Approve & deliver | 👤 Yes (one click) |
| Everything else | ✅ Automated |

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (React + TypeScript) | Dashboard, client galleries, SSR for SEO |
| Styling | Tailwind CSS | Utility-first responsive design |
| Hosting (Web) | Vercel | Auto-deploys from GitHub `main` branch |
| Database | Supabase (PostgreSQL) | Auth, data, RLS, real-time subscriptions |
| AI Service | Python FastAPI | RAW processing, GPU model inference |
| AI Hosting | Railway or Modal (GPU) | Scalable compute for image processing |
| Storage | Backblaze B2 (S3-compatible) | Photo storage ($0.005/GB vs AWS $0.023/GB) |
| CDN | Cloudflare R2 | Fast gallery delivery, watermarking |
| Queue | BullMQ (Redis) | Job queue for AI processing pipeline |
| Payments | Stripe + Stripe Connect | Client payments, photographer payouts |
| Email | Resend or Postmark | Transactional + marketing automations |
| AI/ML | LibRAW, Pillow, OpenCV, PyTorch | Image processing, style transfer, inpainting |

---

## 4. Database Schema (Supabase PostgreSQL)

**14 tables + RLS policies per photographer:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `photographers` | User accounts | auth_user_id, name, email, business_name, subscription_tier, next_job_number |
| `clients` | Client records | photographer_id, first_name, last_name, email, phone, address, tags, source, notes |
| `leads` | Sales pipeline | photographer_id, client_id, status (new/contacted/quoted/booked/lost), job_type, preferred_date, package_name, estimated_value, source, notes |
| `jobs` | Confirmed bookings | photographer_id, client_id, job_number, title, job_type, status, shoot_date, time, end_time, location, package_name, package_amount, included_images, notes |
| `invoices` | Billing | photographer_id, client_id, job_id, invoice_number, invoice_type (deposit/final/custom), status, line_items (JSONB), subtotal, tax_rate, tax_amount, total, due_date, paid_date |
| `contracts` | Agreement templates | photographer_id, name, content, merge_tags, is_default |
| `galleries` | Photo collections | photographer_id, job_id, client_id, name, status, cover_image_url, photo_count, is_published, password_hash, expires_at, settings (JSONB) |
| `photos` | Individual images | gallery_id, photographer_id, file_url, thumbnail_url, web_url, original_filename, file_size, width, height, ai_edits (JSONB), is_selected, is_favorited, sort_order |
| `style_profiles` | AI editing styles | photographer_id, name, settings (JSONB), reference_images, is_active |
| `processing_jobs` | AI queue | photographer_id, gallery_id, status, total_images, processed_images, started_at, completed_at, error_log |
| `workflows` | Automation rules | photographer_id, name, trigger, actions (JSONB), is_active, conditions (JSONB) |
| `templates` | Email/message templates | photographer_id, name, type, subject, body, merge_tags |
| `workflow_actions` | Executed automations | workflow_id, action_type, status, executed_at, result |
| `audit_log` | Activity tracking | photographer_id, action, entity_type, entity_id, details (JSONB) |

**Migrations applied:**
1. `20260213000000_initial_schema.sql` — Core 14 tables
2. `20260214000001_add_invoice_type.sql` — invoice_type column
3. `20260214000002_add_job_number.sql` — job_number + next_job_number counter
4. `20260214000003_add_job_time.sql` — time + end_time columns
5. `increment_job_number()` — Atomic RPC function for permanent job numbering

---

## 5. Current Build Status

### ✅ Fully Working
- **Auth:** Signup, login, logout, route protection via middleware, OAuth callback ready (Google/Apple buttons in UI, needs provider credentials in Supabase)
- **Dashboard:** Live stats from Supabase (total clients, leads, jobs, revenue), upcoming shoots, recent leads, gallery status
- **Clients:** Full CRUD — add, search, click-to-view slide-over, edit, delete. Searchable with tags/source/revenue tracking
- **Leads:** Full CRUD — add (new or existing client via searchable combobox), pipeline kanban view + list view, status transitions, package selector, edit slide-over, delete. Lost leads hidden from pipeline, visible in list with toggle. Sorted by preferred date (soonest first)
- **Jobs:** Full CRUD — add with package selector (auto-fills price, images, calculates end time from duration), permanent job numbering (#0001+), status tabs, cancel/restore, edit, delete. Time + end time fields throughout
- **Invoices:** Full CRUD — create custom or auto-generate from job. Deposit/final split based on package settings (25% default deposit). Job-linked invoice numbers (INV-0001-DEP/FIN). Line item editor, GST calculation, status management
- **Calendar:** Monthly view with colour-coded jobs, navigate months, today button, job detail popups with time ranges
- **Contracts:** Single universal template with conditional deposit/no-deposit sections. 10 sections covering all scenarios. Merge tags. Edit + reset to default
- **Workflows:** 6 pre-built automation presets (lead auto-response, booking confirmation, pre-shoot reminder, post-shoot, gallery delivery, payment reminders). All deposit-aware. Toggle on/off. Preview mode
- **Analytics:** Period filters, revenue/booked/conversion stats, bar chart revenue by month, lead source + job type breakdowns
- **Settings:**
  - Business Profile — saves to Supabase
  - Packages — name, price, duration, included images, description, deposit toggle + deposit %, active toggle. Updates existing job end times when duration changes
  - Branding — primary/secondary colours with contrast-aware preview, logo upload, watermark/download toggles
  - Notifications — email toggles, auto follow-up timing, overdue reminders
  - Billing — plan display, Stripe placeholder
- **Responsive Design:** Full mobile/tablet pass — collapsible sidebar with hamburger menu, sticky header, no horizontal scroll, responsive grids, mobile-optimised modals/slide-overs, horizontal scroll tabs
- **Deployment:** Live on Vercel, auto-deploys from GitHub main branch

### 🔧 Built but Not Yet Connected
- **Packages:** Stored in localStorage, not Supabase (works for single user, needs DB migration for multi-user)
- **Contracts:** Stored in localStorage
- **Workflows:** UI only, email sending not wired
- **Analytics:** Uses Supabase data but some mock calculations
- **Branding:** Logo upload is local preview only (needs file storage)

### ❌ Not Yet Built
- **File upload infrastructure** (Backblaze B2 / Supabase Storage)
- **AI editing workspace** (the in-browser photo review/edit UI)
- **AI processing pipeline** (Python service with 6 phases)
- **Style profile training** (upload reference images, train style)
- **Prompt-based per-image editing** (chat interface for individual photo edits)
- **Client-facing gallery pages** (public branded galleries)
- **Client-facing quote page** (view packages, add extras, accept/decline quote)
- **Public contact form** (auto-creates leads from website)
- **Email sending** (Resend/Postmark integration)
- **Stripe payment integration** (invoicing, deposits, print orders)
- **Print ordering / e-commerce** (client purchases prints from gallery)
- **Google/Apple OAuth** (buttons exist, needs provider credentials configured in Supabase)
- **Native app** (iOS/Android — React Native or Expo)
- **Full UI/UX redesign** (current dark theme is functional, not polished)
- **Complete user tutorial/documentation** (in-app walkthrough + standalone docs)

---

## 6. Critical Development Rules

**These rules exist because we hit painful build failures. Follow them every time.**

### Rule 1: types.ts is the single source of truth
- `apps/web/lib/types.ts` defines the shape of every data type (Job, Invoice, Client, Lead, etc.)
- `apps/web/lib/queries.ts` function signatures MUST match the field names in types.ts
- Page components pass data to queries functions — the fields they pass must exist in the function signature
- **Chain of truth:** `types.ts` → `queries.ts` function params → `page.tsx` create/update calls
- Before writing any create/update function, check the type definition first

### Rule 2: queries.ts functions handle photographer_id internally
- Every create function (`createNewClient`, `createLead`, `createJob`, `createInvoice`) calls `getCurrentPhotographer()` internally and adds `photographer_id` to the insert
- **NEVER pass `photographer_id` from a page component** — it will cause a TypeScript error because it's not in the function's param type
- If a page needs the photographer ID for display purposes, fetch it separately via `getCurrentPhotographer()`

### Rule 3: Field name mapping (types.ts ↔ database)
These are the actual field names. Do not invent alternatives:

| Type | Field | NOT this |
|------|-------|----------|
| Job | `date` | ~~shoot_date~~ |
| Job | `title` (optional) | ~~title (required)~~ |
| Invoice | `amount` | ~~subtotal~~ |
| Invoice | `tax` | ~~tax_amount~~ |
| Invoice | `currency` | (don't omit) |
| Lead | `location` | (don't omit from createLead) |

### Rule 4: RLS policies need WITH CHECK for INSERT
- Supabase `FOR ALL USING (...)` covers SELECT/UPDATE/DELETE but NOT INSERT
- INSERT requires separate `FOR INSERT WITH CHECK (...)`
- Migration `20260214000005_fix_rls_policies.sql` fixed this — don't revert to `FOR ALL`

### Rule 5: Always run `npx next build` before pushing
- TypeScript strict mode catches field mismatches at build time
- `npm run dev` does NOT catch these — it uses loose compilation
- Never push code that hasn't passed `npx next build`

### Rule 6: When editing queries.ts or types.ts
1. Check `types.ts` for the interface definition
2. Update `queries.ts` function params to match exactly
3. Check every page that calls the function — ensure fields match
4. Run `npx next build` to verify
5. Only then push

---

## 7. File Structure

```
aperture-suite/
├── apps/
│   └── web/                          # Next.js 14 frontend
│       ├── app/
│       │   ├── (auth)/               # Auth pages
│       │   │   ├── login/page.tsx
│       │   │   ├── signup/page.tsx
│       │   │   └── layout.tsx
│       │   ├── (dashboard)/          # Protected dashboard pages
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── clients/page.tsx
│       │   │   ├── leads/page.tsx
│       │   │   ├── jobs/page.tsx
│       │   │   ├── invoices/page.tsx
│       │   │   ├── galleries/page.tsx
│       │   │   ├── calendar/page.tsx
│       │   │   ├── contracts/page.tsx
│       │   │   ├── workflows/page.tsx
│       │   │   ├── analytics/page.tsx
│       │   │   ├── editing/page.tsx   # Placeholder
│       │   │   ├── settings/page.tsx
│       │   │   └── layout.tsx
│       │   ├── auth/callback/route.ts # OAuth callback
│       │   ├── layout.tsx
│       │   └── page.tsx              # Landing page
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── sidebar.tsx
│       │   │   ├── top-bar.tsx
│       │   │   └── stat-card.tsx
│       │   └── ui/
│       │       ├── button.tsx
│       │       ├── combobox.tsx       # Searchable client dropdown
│       │       ├── confirm-dialog.tsx
│       │       ├── data-table.tsx
│       │       ├── empty-state.tsx
│       │       ├── form-fields.tsx
│       │       ├── modal.tsx
│       │       ├── slide-over.tsx
│       │       └── status-badge.tsx
│       ├── lib/
│       │   ├── auth-actions.ts
│       │   ├── queries.ts            # All Supabase CRUD operations
│       │   ├── types.ts              # TypeScript interfaces
│       │   ├── utils.ts
│       │   └── supabase/
│       │       ├── client.ts
│       │       └── server.ts
│       ├── styles/globals.css
│       ├── middleware.ts              # Auth route protection
│       └── [config files]
├── services/
│   └── ai-engine/                    # Python FastAPI service
│       ├── app/
│       │   ├── main.py
│       │   ├── routers/
│       │   │   ├── health.py
│       │   │   ├── process.py
│       │   │   └── style.py
│       │   ├── pipeline/             # 6-phase AI processing
│       │   ├── models/
│       │   ├── storage/
│       │   └── workers/
│       ├── Dockerfile
│       ├── railway.toml
│       └── requirements.txt
├── supabase/
│   └── migrations/                   # SQL migrations
│       ├── 20260213000000_initial_schema.sql
│       ├── 20260214000001_add_invoice_type.sql
│       ├── 20260214000002_add_job_number.sql
│       ├── 20260214000003_add_job_time.sql
│       ├── 20260214000004_job_number_counter.sql
│       └── 20260214000005_fix_rls_policies.sql
├── docs/
│   └── Aperture-Suite-Master-Document.md
├── packages/shared/                  # Shared types/constants
├── package.json                      # Root monorepo config
└── turbo.json                        # Turborepo build config
```

---

## 8. Competitive Landscape

| Feature | Aperture Suite | Studio Ninja | Pic-Time | Aftershoot | Imagen |
|---------|---------------|-------------|----------|-----------|--------|
| CRM & Booking | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI Photo Editing | ✅ | ❌ | ❌ | ✅ | ✅ |
| Client Galleries | ✅ | ❌ | ✅ | ❌ | ❌ |
| Prompt-Based Edits | ✅ | ❌ | ❌ | ❌ | ❌ |
| Auto Scene Cleanup | ✅ | ❌ | ❌ | ❌ | ❌ |
| End-to-End Automation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Print Ordering | ✅ (planned) | ❌ | ✅ | ❌ | ❌ |
| Combined cost | $39–89/mo | $28–45/mo | $15–58/mo | $15–30/mo | $7+/mo |
| Separate tools total | — | $68–149/mo combined | — | — | — |

**Studio Ninja weakness:** Acquired by ImageQuix, support quality declined, years of unfulfilled feature requests (bulk email, date-specific workflows). Wide open door for migration.

**AI editing advantage:** Aftershoot requires local processing. Imagen charges $0.05/photo with 3,000–5,000 image training requirement. Aperture Suite: cloud-based, bundled in subscription, only 50–200 reference images to train style.

---

## 9. Package & Invoicing System

### Packages (configured in Settings)
- Name, price, duration (hours), included images count
- Optional deposit requirement: toggle + percentage (default 25%)
- Active/inactive toggle for quoting
- Changing package duration auto-syncs existing job end times

### Invoice Flow
- **Package with deposit:** Creates `INV-{JOB#}-DEP` (25% of package, sent immediately on booking, due on receipt) + `INV-{JOB#}-FIN` (75% remaining, auto-sent 28 days before shoot, due 14 days before shoot)
- **Package without deposit:** Creates `INV-{JOB#}` (full amount, auto-sent 28 days before shoot, due 14 days before shoot)
- **Custom invoices:** Manual line items for one-off billing
- Line item editor with qty × price, adjustable GST %

### Job Numbering
- Permanent auto-incrementing counter stored on `photographers.next_job_number`
- Atomic increment via `increment_job_number()` RPC — no duplicates even with concurrent requests
- Never resets, even if all jobs are deleted
- Format: `#0001`, `#0002`, etc.

---

## 10. AI Processing Pipeline (6 Phases, 24 Steps)

### Phase 0 — Image Analysis
Scene type detection, face detection + counting, quality scoring (exposure, focus, noise, composition), duplicate/burst grouping, EXIF metadata extraction

### Phase 1 — Style Application
Apply photographer's trained style profile: exposure, white balance, contrast, colour grading, shadows, highlights, HSL, tone curve. Style learned from 50–200 reference images.

### Phase 2 — Face & Skin Retouching
Skin smoothing (texture-preserving), blemish/acne removal, stray hair cleanup, red-eye removal, subtle teeth whitening

### Phase 3 — Scene Cleanup
Background person/distraction removal, exit sign removal, power line removal, lens flare removal, trash/bright distraction removal in venue shots

### Phase 4 — Composition
Horizon straightening, crop optimisation, rule-of-thirds alignment

### Phase 5 — QA & Output
Final quality check, generate web-res + thumbnail + full-res outputs, verify all images processed, select top N based on package's included images count

### Photographer Controls
Every automated step has a configurable level: Off → Flag Only → Auto-Fix. Set defaults once, override per-shoot.

### Prompt-Based Editing (Edge Cases)
For the ~5% of images the AI doesn't get perfect:
- Natural language prompts per image ("remove the person in the background")
- Draw + prompt for precision masking
- Click + prompt for quick removals
- Batch prompts across multiple images
- Conversational refinement ("make it more subtle")
- Powered by: Grounding DINO + SAM 2 (auto-detection) → Stable Diffusion inpainting / InstructPix2Pix (editing)
- Non-destructive with full undo history

---

## 11. Migration Strategy

### Supported Import Sources
- **Studio Ninja:** CSV export of clients, leads, jobs
- **HoneyBook:** CSV contacts export
- **Dubsado:** CSV client data
- **17hats:** CSV export
- **Táve:** CSV export
- **Lightroom:** Style/preset import for AI training

### Smart Import Features
- AI auto-detects column mappings ("First Name" vs "fname" vs "Client First Name")
- Platform-specific importers ("I'm coming from Studio Ninja")
- Template Recreation Assistant: paste contract text → AI structures it with merge tags
- Concierge migration service: free with annual plans

---

## 12. TODO List (Priority Order)

### High Priority — Core Functionality
1. File upload infrastructure (Backblaze B2 or Supabase Storage)
2. AI editing workspace UI (in-browser photo review/approval)
3. AI processing pipeline implementation (Python service, 6 phases)
4. Client-facing gallery pages (public branded galleries with downloads)
5. Client-facing quote page (view packages, add extras, accept/decline — triggers booking flow)
6. Stripe payment integration (deposits, final payments, print orders)
7. Email sending (Resend/Postmark — transactional + marketing automations)
8. Move packages and contracts from localStorage to Supabase

### Medium Priority — Features
9. Google OAuth provider setup (credentials in Supabase)
10. Apple OAuth provider setup
11. Style profile training system (upload 50–200 reference images)
12. Prompt-based per-image editing
13. Public contact form (auto-creates leads from website)
14. Print ordering / e-commerce in client galleries
15. Migration import wizard (CSV from Studio Ninja, HoneyBook, etc.)
16. Custom domain support for galleries

### Lower Priority — Polish
17. Full UI/UX redesign (move beyond dark prototype aesthetic)
18. Native app (iOS/Android — React Native or Expo)
19. Complete user tutorial/documentation (in-app walkthrough + standalone)
20. Revisit "lost" lead status — consider removing or rethinking
21. Quick-add lead button (floating "+", minimal fields for fast DM/call entry)

---

## 13. Deployment & DevOps

### Local Development
```powershell
cd "C:\Users\mitch\OneDrive\Documents\aperture-suite\apps\web"
npm run dev
# → http://localhost:3000
```

### Build & Deploy
```powershell
# Test build locally first
cd "C:\Users\mitch\OneDrive\Documents\aperture-suite\apps\web"
npx next build

# Push to deploy (Vercel auto-deploys from main)
cd "C:\Users\mitch\OneDrive\Documents\aperture-suite"
git add .
git commit -m "descriptive message"
git push
```

### Supabase Migrations
Run new SQL in Supabase Dashboard → SQL Editor. Migration files stored in `supabase/migrations/` for version control.

**Migrations that MUST be run in Supabase SQL Editor (in order):**
1. `20260213000000_initial_schema.sql` — Core 14 tables (already run during initial setup)
2. `20260214000001_add_invoice_type.sql` — `invoice_type` column on invoices
3. `20260214000002_add_job_number.sql` — `job_number` column on jobs
4. `20260214000003_add_job_time.sql` — `time` + `end_time` columns on jobs
5. `20260214000004_job_number_counter.sql` — `next_job_number` on photographers + `increment_job_number()` RPC
6. `20260214000005_fix_rls_policies.sql` — **Critical:** Proper INSERT policies with `WITH CHECK` for all tables

### Bugs Fixed (14 Feb 2026 Session)
- **Wrong function imports:** `clients/page.tsx` and `leads/page.tsx` imported `createClient` instead of `createNewClient`
- **RLS INSERT blocked:** Original policies used `FOR ALL USING(...)` which doesn't cover INSERT — fixed with separate `FOR INSERT WITH CHECK` policies
- **Dashboard stats mismatch:** Dashboard expected `total_clients` etc. but `getDashboardStats()` returns `totalClients` — aligned field names
- **photographer_id passed to create functions:** Pages passed `photographer_id` but the functions handle it internally — removed from all pages (clients, leads, jobs, invoices)
- **Invoice field mismatch:** `createInvoice` used `subtotal/tax_rate/tax_amount` but Invoice type uses `amount/tax/currency` — aligned queries.ts to match types.ts
- **Job title type error:** `createJob` required `title` as `string` but pages passed `undefined` — made optional
- **Missing `location` on createLead:** Lead type has `location` but `createLead` params didn't include it — added
- **`shoot_date` vs `date`:** `getJobs()` and `getDashboardStats()` used `shoot_date` in queries but database column is `date` — caused 400 errors on all job fetches
- **Missing database columns:** `time`, `end_time`, `job_number`, `next_job_number` columns didn't exist until migrations 2-4 were run

### Environment Variables (Vercel + .env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ibugbyrbjabpveybuqsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]
```

### File Move Commands
All files delivered with PowerShell `Move-Item` commands from Downloads to project directory with `-Force` flag. Git push commands included after every change that needs deploying.

---

## 14. Key Design Decisions

- **Monorepo (Turborepo):** Shared types and constants between frontend and AI service
- **Next.js 14 App Router:** Server components for SEO on public galleries, client components for interactive dashboard
- **Supabase RLS:** Every table has row-level security scoped to `photographer_id` — multi-tenant by default
- **Package-driven automation:** Deposit %, included images, duration — all set per package, inherited by every job using that package
- **Permanent job numbering:** Counter on photographer record, atomic increment, never resets
- **Invoice numbers tied to jobs:** Always traceable (`INV-0001-DEP` tells you exactly which job and what type)
- **AI controls per-step:** Photographers choose how aggressive each AI phase is — from "off" to "auto-fix"
- **Style training from 50–200 images:** Much lower barrier than competitors (Imagen needs 3,000–5,000)
