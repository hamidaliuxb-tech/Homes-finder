# Homes Finder — PRD

## Original Problem Statement
Build a premium UAE real estate advisory & brokerage website ("Homes Finder") communicating Trust + Luxury + Professionalism + Investment Expertise. Full public marketing/listings site + admin CMS for a non-technical owner. Buy, Sell, Rent, Invest, Off-Plan, Commercial, Property Services, About, Contact, legal pages, WhatsApp integration, SEO, lead management.

## Architecture
- Frontend: React 19 (CRA/craco), react-router-dom, Tailwind + shadcn/ui, framer-motion, sonner. Fonts: Cormorant Garamond (serif headings) + Plus Jakarta Sans (body). Palette: deep navy/charcoal + champagne gold on white/off-white.
- Backend: FastAPI, MongoDB (motor). All routes under /api.
- Integrations: Emergent-managed Google Auth (admin), Emergent object storage (property images), Emergent Resend (lead notification emails).

## User Choices
- Admin: Emergent Google Auth; allowlist ADMIN_EMAILS = hamid.aliuxb@gmail.com, hamid.a@homesfinder.ae
- Image uploads: cloud object storage
- Leads: saved to CMS + emailed to hamid.a@homesfinder.ae
- Contact defaults: +971 50 118 4777 / hamid.a@homesfinder.ae (editable)
- Demo properties seeded, labelled "Demo Property"; no fake stats (conservative editable examples used)

## Personas
Buyers, sellers, tenants, landlords, HNWIs, expats, NRI/international investors, corporates, developers, family offices; plus the business owner (admin).

## Implemented (2026-06)
- Public pages: Home (hero + tabbed search, editable stats, category cards, featured properties, why-us, conversion CTA), Buy, Rent, Sell (valuation form + selling process), Invest (why-UAE, advisory services, ROI/yield calculator, disclaimers), Off-Plan (disclaimer + listings), Commercial (categories + listings), Property Services, About (mission/vision/values), Contact (details + form + map), 5 legal pages, Property Detail (gallery, specs, features/amenities, nearby, investment highlights, payment plan, map, ROI calc, sticky enquiry + call/WhatsApp).
- Property search & filters: purpose, category, emirate, community, type, bedrooms, max price, status; sort by price/newest/featured.
- Lead capture everywhere → stored in CRM + email notification (non-blocking).
- Floating + contextual WhatsApp links (editable number).
- Admin CMS: Google login, protected dashboard, Properties CRUD with multi-image upload, Leads CRM (status pipeline New→Lost, delete), Website Content editor (hero, stats, contact, WhatsApp, social, about, map lat/lng/url, FAQs, footer).
- SEO: per-page titles/meta/OG/canonical, JSON-LD (RealEstateAgent, Residence), semantic headings, breadcrumbs on detail page.
- Verified: backend 21/21 pytest pass; frontend flows pass (testing agent iteration_1, 100%/100%).

## Backlog (P1/P2)
- P1: Property image drag-to-reorder; lead export (CSV/Google Sheets); FAQ accordion surfaced on a public page.
- P2: CRM integrations (HubSpot/Zoho/Salesforce); saved searches / email alerts; mortgage calculator; multi-language (EN/AR RTL); WebP transcode on upload.

## Next Tasks
- Gather real company address, social links, actual statistics from owner and enter via CMS.
- Replace demo properties with real listings.
