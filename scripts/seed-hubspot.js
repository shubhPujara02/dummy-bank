// Pushes data/seed/hubspot-contacts.json into your HubSpot portal.
//   1. creates the "Dummy Bank" property group + db_* custom properties
//   2. upserts all contacts by email (safe to re-run; no duplicates)
// Usage: HUBSPOT_ACCESS_TOKEN=pat-xxx node scripts/seed-hubspot.js

const fs = require('fs');
const path = require('path');
const hubspot = require('../lib/hubspot');

const SEED_FILE = path.join(__dirname, '..', 'data', 'seed', 'hubspot-contacts.json');

async function main() {
  if (!hubspot.isConfigured()) {
    console.error('Set HUBSPOT_ACCESS_TOKEN to your HubSpot Private App token first (see README).');
    process.exit(1);
  }
  if (!fs.existsSync(SEED_FILE)) {
    console.error('Seed file missing. Run: npm run generate');
    process.exit(1);
  }

  const created = await hubspot.ensureProperties();
  console.log(created.length ? `Created properties: ${created.join(', ')}` : 'Custom properties already exist.');

  // HubSpot rejects empty strings for some property types, so drop them.
  const contacts = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')).map((c) =>
    Object.fromEntries(Object.entries(c).filter(([, v]) => v !== '')));

  const results = await hubspot.upsertContacts(contacts);
  const fresh = results.filter((r) => r.new).length;
  console.log(`Upserted ${results.length} contacts (${fresh} new, ${results.length - fresh} updated).`);
}

main().catch((err) => {
  console.error(err.message);
  if (err.status === 401) console.error('→ Token invalid or expired.');
  if (err.status === 403) console.error('→ Token is missing scopes. Needs crm.objects.contacts.read/write and crm.schemas.contacts.read/write.');
  process.exit(1);
});
