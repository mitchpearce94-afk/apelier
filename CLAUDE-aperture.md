# CLAUDE.md — Aperture Suite

## Project Overview
Aperture Suite is an all-in-one SaaS platform for professional photographers combining CRM/business management, AI photo editing, and client gallery delivery. The core value proposition: upload RAW photos → AI edits automatically → one-click deliver to client gallery. Enables same-day delivery vs the industry standard of 4-8 weeks.

**Owner:** Mitchell Pearce (photographer running his own business in Burpengary East, QLD, Australia)

## Tech Stack
- **Frontend:** Next.js 14 (React) on Vercel
- **Backend API:** Next.js API Routes on Vercel
- **AI Service:** Python FastAPI on Railway (+ GPU provider)
- **Database:** PostgreSQL on Supabase
- **Auth:** Supabase Auth
- **File Storage:** Backblaze B2 (S3-compatible)
- **CDN:** Cloudflare R2 / Cloudflare CDN
- **Job Queue:** BullMQ (Redis) on Railway
- **Real-time:** Supabase Realtime
- **Email:** Resend or Postmark
- **Payments:** Stripe

## Repository Structure
Monorepo using Turborepo:
- `apps/web/` — Next.js 14 app (frontend + API routes)
  - `app/(auth)/` — Login, signup, forgot password
  - `app/(dashboard)/` — Photographer dashboard (jobs, clients, calendar, invoices, contracts, workflows, gallery, settings, analytics)
  - `app/(client)/` — Client-facing gallery pages
  - `app/api/` — API routes (auth, jobs, clients, gallery, upload, ai, webhooks)
  - `components/` — Shared React components
  - `lib/` — Utilities, Supabase client
- `services/ai-engine/` — Python FastAPI service
  - `app/pipeline/` — 6-phase AI processing (ingest → style edit → retouch → cleanup → compose → finalize)
  - `app/routers/` — process.py, style.py, health.py
  - `app/workers/` — BullMQ job consumers
- `packages/shared/` — Shared TypeScript types and constants
- `supabase/` — Migrations and config

## Key Database Tables
- **photographers** — Platform users (subscription, branding, Stripe)
- **clients** — Photographer's clients (name, email, tags, source)
- **leads** — Pre-booking inquiries (status: new → contacted → quoted → booked → lost)
- **jobs** — Confirmed bookings (status: upcoming → in_progress → editing → delivered → completed)
- **invoices** — Stripe-integrated invoicing
- **contracts** — Digital contracts with e-signatures
- **galleries** — Photo galleries (access control, download permissions, branding)
- **photos** — Individual photos (RAW key, edited key, web key, thumb key, EXIF, AI edits, quality score)
- **style_profiles** — AI editing style models per photographer
- **processing_jobs** — AI processing queue status
- **workflows** — Automation rules (trigger → steps with delays/conditions)
- **email_templates, contract_templates, questionnaire_templates**

## Current Phase
Phase 1 — Foundation. Project scaffolding initiated. Research, architecture, and schema design complete. Building: auth, database migrations, basic dashboard layout, file upload infrastructure.

## Roadmap Summary
1. **Phase 1 (current):** Scaffolding, auth, DB migrations, dashboard layout, B2 upload
2. **Phase 2:** CRM core (clients, leads, jobs, calendar, invoicing, contracts, questionnaires, email)
3. **Phase 3:** AI editing engine (RAW ingestion, style profiles, 6-phase pipeline, prompt editing, WebGL workspace)
4. **Phase 4:** Client gallery (theming, downloads, face search, favorites, print store, analytics)
5. **Phase 5:** Automation, migration importers, marketplaces, custom domains, mobile app

## Development Commands
```bash
# Web app
cd apps/web && npm run dev  # localhost:3000

# AI service
cd services/ai-engine && uvicorn app.main:app --reload  # localhost:8000

# Supabase
supabase start  # local dev
```

## Deployment
- **Web app:** Vercel (auto-deploy from `main` branch)
- **AI service:** Railway (auto-deploy from `main` branch)
- **Database:** Supabase cloud
- **Branch strategy:** `main` (production), `dev` (development), feature branches

## Coding Conventions
- TypeScript for all frontend code
- Tailwind CSS for styling
- React Server Components where possible (Next.js 14 App Router)
- Supabase client via `lib/` utilities
- API routes follow RESTful conventions
- Python FastAPI for AI service with type hints
- All database changes via Supabase migrations

## Important Notes
- Mitchell uses Windows. For pip commands use `python -m pip` instead of `pip` directly.
- Project path: `C:\Users\mitch\OneDrive\Documents\Photo AI\aperture-suite`
- Competing with: Studio Ninja, HoneyBook, Dubsado (CRM), Aftershoot, Imagen AI (editing), Pic-Time, Pixieset (galleries)
- The "lost" lead status is under review — Mitchell may remove or rethink it
- Future plans include native iOS/Android app, Google/Apple OAuth, file uploads, AI editing, email integration, Stripe, galleries, contact form, UI redesign, and full user tutorial/docs
