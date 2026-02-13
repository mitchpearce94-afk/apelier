# Aperture Suite — Feature Overview

**For:** Business Partner Review  
**Date:** 14 February 2026

---

## What Is Aperture Suite?

Aperture Suite is an all-in-one platform for photographers that replaces three separate subscriptions:

- **Studio Ninja** (CRM & job management) — $28–45/mo
- **Pic-Time** (client galleries & delivery) — $15–58/mo  
- **Aftershoot / Imagen** (AI photo editing) — $15–30/mo

Instead of paying $68–149/month for three disconnected tools, photographers get everything in one place — and it's fully automated end-to-end.

**The promise:** The photographer's only manual actions are adding leads and uploading photos. Everything else — quoting, booking, invoicing, editing, delivery, follow-ups — is automated.

---

## The Fully Automated Client Journey

Items marked 👤 are the photographer's only manual steps. Everything else is automatic.

### 1. Lead Comes In
- Website contact form → lead auto-created
- Instagram DM or phone call → 👤 photographer adds lead manually (name, contact, job type)
- **System auto-sends** a personalised enquiry response email

### 2. Quoting (Automatic)
- System generates a branded quote link for the client
- Client opens the link and sees the photographer's packages, pricing, what's included, and options to add extras
- Client **accepts or declines:**
  - **Accept →** moves to booking (Stage 3)
  - **No response →** system auto-sends follow-up emails
  - **Decline →** lead updated, optional follow-up sent

### 3. Booking
There are two paths to booking:

**Path A — Automated (from accepted quote):**
- Lead converts to "Booked" and a job is created automatically
- Contract auto-sent to client for e-signing
- Once signed → invoices generated (see below)
- Booking confirmation email sent, job added to calendar, reminders scheduled

**Path B — Manual (client books via DM or phone call):**
- Photographer creates a job directly from the dashboard
- Same automation kicks in: contract sent, invoices generated, confirmation email, calendar entry

**Invoicing (applies to both paths):**
- If package requires deposit → Deposit invoice sent immediately on booking (due on receipt) + Final invoice created on booking, auto-sent to client 28 days before the shoot, due 14 days before the shoot
- If no deposit (pay in full) → Single invoice created on booking, auto-sent to client 28 days before the shoot, due 14 days before the shoot
- **Payment happens when the client pays their invoice — not at the quoting or booking stage**
- Overdue reminders sent automatically after the due date

### 4. Pre-Shoot Reminders (Automatic)
- 7 days before: Client gets a prep email (what to wear, location details)
- 1 day before: Final reminder with time and location
- Unpaid balance reminders sent automatically

### 5. After the Shoot
- 👤 Photographer uploads RAW photos to the platform
- **Job status automatically progresses through:**
  1. **"Editing"** — triggered the moment files start uploading
  2. AI processing runs automatically (6 phases):
     - Analyses every image (quality, faces, scenes, duplicates)
     - Applies the photographer's personal editing style
     - Retouches skin, removes blemishes, fixes red-eye
     - Cleans up backgrounds (removes distracting people, exit signs, power lines)
     - Straightens horizons, optimises crop
     - Selects the best images based on the package's included count
  3. **"Ready for Review"** — AI finishes, photographer gets a notification
  4. Photographer reviews and approves (Stage 6)
  5. **"Delivered"** — photographer clicks "Approve & Deliver" (Stage 7)
  6. **"Completed"** — auto-triggers when the client has viewed the gallery AND the invoice is marked paid
- 48 hours after shoot: "How did we do?" review email sent to client

### 6. Photographer Reviews (Quick Check)
- 👤 Photographer gets a notification that editing is done
- 👤 Scrolls through the gallery — 95%+ should be perfect
- For the ~5% that need tweaks: type a prompt like "remove the person in the background" or "make the sky bluer" — AI applies it in seconds
- 👤 Clicks "Approve & Deliver"

### 7. Client Gets Their Photos (Automatic)
- Branded gallery created with photographer's logo and colours
- Client receives delivery email with gallery link
- Client can: view all photos, search by scene type, favourite images, download, share on social media, order prints
- Photographer sees which images the client viewed and favourited

### 8. Follow-Up Automations (Run Forever)
- Gallery reminder emails if client hasn't viewed yet
- Print sale promotions
- "You favourited 12 images — want prints?" follow-ups
- Google/Facebook review requests
- Referral prompts with discount codes
- 1-year anniversary email with booking link
- Overdue invoice reminders

---

## What's Different vs Competitors

| | Aperture Suite | Studio Ninja + Pic-Time + Aftershoot |
|---|---|---|
| Number of subscriptions | 1 | 3 |
| Delivery time | Under 1 hour | 4–8 weeks (industry average) |
| Manual editing work | ~5% (prompt-based fixes) | 100% (manual Lightroom editing) |
| Auto-generate invoices from booking | ✅ | ❌ |
| Auto-deliver to client | ✅ | ❌ (manual re-upload to Pic-Time) |
| AI removes distractions automatically | ✅ | ❌ |
| Client can search photos by scene | ✅ | ❌ |
| Post-delivery marketing automations | ✅ | Partial |

**Studio Ninja's weakness:** Acquired by ImageQuix. Support quality dropped. Basic features like bulk email and date-specific workflows have been requested for years with no delivery. Photographers are frustrated and looking for alternatives.

**AI editing advantage:** Aftershoot needs local computer processing. Imagen charges per photo and requires 3,000–5,000 images to train your style. Aperture Suite: cloud-based, included in subscription, and only needs 50–200 reference images to learn your style.

---

## Current Build Status

### What's Working Now (Live on Vercel)
- User accounts & login (email, Google/Apple OAuth ready)
- Full CRM: clients, leads (pipeline kanban + list view), jobs, invoices — all with full create/edit/delete
- Package system with pricing, duration, included images, optional deposit percentage
- Auto-calculated end times, permanent auto-incrementing job numbering (#0001, #0002...)
- Invoice auto-generation from jobs (deposit + final split, or single invoice) with GST
- Calendar with monthly view and job colour coding
- Contract templates with conditional deposit/no-deposit sections and merge tags
- 6 pre-built workflow automation presets (deposit-aware, togglable, with preview)
- Analytics dashboard with period filters, revenue/conversion charts, lead source breakdowns
- Settings: business profile, packages with deposit toggle, branding with logo upload, notifications
- Full mobile responsive design
- Supabase PostgreSQL database with row-level security (multi-tenant by default)
- Auto-deploys from GitHub to Vercel

### What's Next to Build
1. File upload system (cloud photo storage)
2. AI editing workspace (review/approve interface)
3. AI processing engine (Python service — 6 phases, 24 steps)
4. Client-facing galleries (branded, downloads, favourites, print ordering)
5. Client-facing quote page (view packages, add extras, accept/decline)
6. Stripe payment integration
7. Email automation (Resend or Postmark)
8. Native mobile app (iOS/Android)
9. Full UI/UX design polish

---

## Package & Invoicing Logic

Photographers set up their packages in Settings:
- **Mini Session** — $250, 30 min, 20 images, no deposit
- **Family Session** — $450, 1 hour, 50 images, no deposit  
- **Full Day Wedding** — $3,500, 8 hours, 500 images, 25% deposit required

When a client books a package **with deposit:**
- Deposit invoice: `INV-0001-DEP` — 25% ($875), sent immediately on booking, due on receipt
- Final invoice: `INV-0001-FIN` — 75% ($2,625), auto-sent 28 days before shoot, due 14 days before shoot

When a client books a package **without deposit:**
- Single invoice: `INV-0001` — full amount, auto-sent 28 days before shoot, due 14 days before shoot

Everything is tied to the job number for easy tracking.

---

## Time Savings for Photographers

| Task | Without Aperture Suite | With Aperture Suite |
|------|----------------------|-------------------|
| Respond to enquiry | 10–15 min | Automatic |
| Send quote & follow up | 20–30 min | Automatic (client self-serves) |
| Create invoice | 10 min | Automatic on booking |
| Edit 500 wedding photos | 8–13 hours | 45–85 min (just reviewing AI work) |
| Deliver to client | 30–60 min (export, upload, email) | One click |
| Follow-up emails | 15–30 min each | Automatic |
| **Total per wedding** | **12–18 hours** | **~2 hours** |

A photographer doing 30 weddings/year saves **300–480 hours** — that's $15,000–$48,000 in time value at $50–100/hour.

---

## Test It Out

The CRM is live. Create an account, add some test clients and leads, create jobs with different packages, generate invoices, and explore the full workflow. Everything saves to the cloud so you can access it from any device.

Send any feedback, questions, or feature ideas — this is the time to shape it before we build the heavy features (AI editing, galleries, payments).
