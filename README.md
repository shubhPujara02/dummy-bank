# Dummy Bank × HubSpot × ConsentIQ test lab

A fictitious bank ("Dummy Bank") for learning and testing how **ConsentIQ** (consent system of record)
works alongside **HubSpot** (the bank's CRM).

```
 Visitor ──► Dummy Bank website ──► lead data ──► HubSpot (CRM)
                     │                                 ▲
                     └──► consent ──► ConsentIQ ───────┘  (ConsentIQ → HubSpot connector syncs consent downstream)
```

* Lead data (name, mobile, email, product…) is pushed to HubSpot by the site's backend.
* Consent is **not** captured by the site yet. That's on purpose, so you can wire in ConsentIQ next and
  watch the consent records flow from ConsentIQ into HubSpot.

## What's in here

| Path | What it is |
|---|---|
| `public/index.html` | Landing page: products, quick-eligibility box, **Request a callback** lead form |
| `public/open-account.html` | Account opening form (richer lead: city, product, income band, language) |
| `public/login.html` → `dashboard.html` | Log in with mobile, fake account dashboard with a "Manage my consent" link |
| `public/privacy.html` | Sample privacy notice (purposes: account opening, sales follow-up, marketing, analytics) |
| `public/leads.html` | **Test view**: every lead the site captured, its HubSpot sync status, and consent status |
| `partials/head.html` | ConsentIQ blocker + third-party trackers, injected into every page (for the Cookie Scanner) |
| `lib/catalog.js` | Shared values: products, income bands, lead channels, KYC status, languages, HubSpot custom properties |
| `lib/hubspot.js` | Tiny HubSpot CRM v3 client (create custom properties, batch upsert contacts by email) |
| `scripts/generate-leads.js` | Generates 200 deterministic dummy contacts |
| `data/seed/hubspot-contacts.csv` / `.json` | The 200 generated contacts (emails are `@example.com`, so nothing reaches a real inbox) |
| `scripts/seed-hubspot.js` | Pushes the 200 contacts into your HubSpot portal |

## Run locally

```bash
npm install
npm start                                   # http://localhost:4000
HUBSPOT_ACCESS_TOKEN=pat-xxx npm start      # same, with live HubSpot sync
```

Tip: open `http://localhost:4000/?utm_source=newsletter&utm_campaign=diwali` and then submit a form: the UTM
values are attached to the lead.

## Step 1: Create a free HubSpot account (do this yourself)

1. Go to <https://www.hubspot.com/products/crm> → **Get free CRM**.
2. Sign up with your email, verify it, and pick a company name such as **Dummy Bank**.
3. Skip the onboarding wizards. You now have a free portal with a Contacts database.

## Step 2: Create a Private App token

1. In HubSpot: **Settings (⚙) → Integrations → Private Apps → Create a private app**
   (on newer portals: **Development → Legacy apps → Create → Private**).
2. Name: `Dummy Bank Website`.
3. **Scopes** tab, tick:
   * `crm.objects.contacts.read`
   * `crm.objects.contacts.write`
   * `crm.schemas.contacts.read`
   * `crm.schemas.contacts.write`
4. **Create app** → copy the access token (`pat-na1-…`). Treat it like a password. Never commit it.

## Step 3: Load the 200 dummy contacts

**Option A, script (recommended).** It also creates the custom properties:

```bash
npm run generate                                   # (re)creates data/seed/* — already committed
HUBSPOT_ACCESS_TOKEN=pat-xxx npm run seed:hubspot
```

It creates a **Dummy Bank** property group with `db_product_interest`, `db_income_band`, `db_lead_channel`,
`db_kyc_status`, `db_preferred_language` and `db_customer_id`, then upserts all 200 contacts by email.
It's safe to run again: you get updates, not duplicates.

**Option B, manual import.** In HubSpot, go to **Contacts → Import → File from computer → One file → Contacts** and
upload `data/seed/hubspot-contacts.csv`. Create the `db_*` properties first (or create them while mapping
columns), and keep the internal option values exactly as in `lib/catalog.js`.

What the data looks like: Indian names and cities, `+91` mobiles, a mix of lifecycle stages
(subscriber → customer), lead statuses, products, income bands and acquisition channels, which is enough to build
segments such as "home-loan leads from Google Ads in Gujarat".

## Step 4: Turn on live sync from the website

Set `HUBSPOT_ACCESS_TOKEN` (locally, or on Render under **Environment**). Every account signup or callback
request then creates or updates a HubSpot contact:

| Site field | HubSpot property |
|---|---|
| first / last name, email | `firstname`, `lastname`, `email` |
| mobile | `mobilephone` (`+91…`) |
| city | `city` (+ `country = India`) |
| product, income, language | `db_product_interest`, `db_income_band`, `db_preferred_language` |
| which form | `db_lead_channel` = `website_signup` / `website_callback` |
| signup only | `lifecyclestage = customer`, `db_customer_id`, `db_kyc_status = not_started` |

Check `/leads.html` to see whether each lead synced, was skipped, or hit an error (hover the pill to see the reason).

## Deploy (Render)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shubhPujara02/dummy-bank)

`render.yaml` is included; Render asks for `HUBSPOT_ACCESS_TOKEN` on first deploy. On the free tier,
`data/db.json` (local leads/accounts) resets on restart, but HubSpot keeps everything.

## API

* `POST /api/signup`: `{ firstName, lastName, mobile, email, city, product, incomeBand, language, utm }`
* `POST /api/callback`: `{ firstName, lastName, mobile, email, product, preferredTime, utm }`
* `POST /api/login`: `{ mobile }`
* `GET  /api/leads`: captured leads + HubSpot sync status (test only)
* `GET  /api/catalog`, `GET /api/health`

## ConsentIQ integration

| Where | ConsentIQ method | What happens |
|---|---|---|
| Every page | Cookie banner (`blocker.js`, property key `1a4bca7c-…`) | Trackers stay blocked until the visitor consents |
| Callback form (`/`) and Open account (`/open-account.html`) | Embed (`embed.js`, consent point `368ba711-…`) | The privacy notice and consent statements render inside the form. On submit the site calls `consentiq.capture({ email })` first; the lead is saved and sent to HubSpot **only if** consent is recorded |
| Dashboard "Manage my consent" | Popup (`consent-modal.js`) with the customer's email as identifier | Customer reviews or changes their consent |
| Privacy page | Popup (link trigger) | Opens the hosted notice in a modal |

What `capture()` returned is kept on the lead as a receipt (see the Consent column on `/leads.html`).
ConsentIQ remains the system of record, and its HubSpot connector syncs consent to the contact.

In ConsentIQ, make sure the property's domain includes `dummy-bank-7gcw.onrender.com`. Otherwise
the widget won't load and the forms say "The consent form is still loading".
