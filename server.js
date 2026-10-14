const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const catalog = require('./lib/catalog');
const store = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const HEAD_HTML = fs.readFileSync(path.join(__dirname, 'partials', 'head.html'), 'utf8');

app.use(express.json());

// Serve HTML pages with the shared <head> (shared trackers)
// injected at the <!--#head--> marker, so every page carries the same tags.
app.get(['/', '/*.html'], (req, res, next) => {
  const file = req.path === '/' ? 'index.html' : req.path.slice(1);
  const full = path.join(PUBLIC_DIR, file);
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full)) return next();
  const html = fs.readFileSync(full, 'utf8').replace('<!--#head-->', HEAD_HTML);
  res.type('html').send(html);
});
app.use(express.static(PUBLIC_DIR));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

function validateLead(body, { requireAccountFields }) {
  const errors = [];
  if (!body.firstName) errors.push('first name is required');
  if (!body.lastName) errors.push('last name is required');
  if (!MOBILE_RE.test(body.mobile || '')) errors.push('mobile must be a valid 10-digit Indian number');
  if (!EMAIL_RE.test(body.email || '')) errors.push('email is invalid');
  if (!catalog.isValid(catalog.PRODUCTS, body.product)) errors.push('choose a product');
  if (requireAccountFields) {
    if (!body.city) errors.push('city is required');
    if (!catalog.isValid(catalog.INCOME_BANDS, body.incomeBand)) errors.push('choose an income band');
  }
  if (body.language && !catalog.isValid(catalog.LANGUAGES, body.language)) errors.push('invalid language');
  return errors;
}

function pick(body) {
  const s = (v) => (typeof v === 'string' ? v.trim() : '');
  return {
    firstName: s(body.firstName),
    lastName: s(body.lastName),
    mobile: s(body.mobile),
    email: s(body.email).toLowerCase(),
    city: s(body.city),
    product: s(body.product),
    incomeBand: s(body.incomeBand),
    language: s(body.language) || 'en',
    preferredTime: s(body.preferredTime),
    utm: {
      source: s(body.utm?.source),
      medium: s(body.utm?.medium),
      campaign: s(body.utm?.campaign),
    },
  };
}

function newLead(fields, channel, customerId) {
  return {
    id: crypto.randomUUID(),
    ...fields,
    channel,
    customerId: customerId || null,
    createdAt: new Date().toISOString(),
  };
}

app.get('/api/catalog', (req, res) => {
  const { PRODUCTS, INCOME_BANDS, LANGUAGES } = catalog;
  res.json({ products: PRODUCTS, incomeBands: INCOME_BANDS, languages: LANGUAGES });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/signup', async (req, res) => {
  const fields = pick(req.body || {});
  const errors = validateLead(fields, { requireAccountFields: true });
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  if (store.findAccount((a) => a.mobile === fields.mobile)) {
    return res.status(409).json({ error: 'an account with this mobile number already exists' });
  }

  const customerId = 'DB' + String(crypto.randomInt(0, 1e8)).padStart(8, '0');
  const account = store.addAccount({ customerId, ...fields, createdAt: new Date().toISOString() });
  const lead = store.addLead(newLead(fields, 'website_signup', customerId));

  res.status(201).json({ message: 'account created', account });
});

app.post('/api/callback', async (req, res) => {
  const fields = pick(req.body || {});
  const errors = validateLead(fields, { requireAccountFields: false });
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  const lead = store.addLead(newLead(fields, 'website_callback'));
  res.status(201).json({ message: 'callback requested', leadId: lead.id });
});

app.post('/api/login', (req, res) => {
  const mobile = String(req.body?.mobile || '').trim();
  if (!mobile) return res.status(400).json({ error: 'mobile is required' });

  const account = store.findAccount((a) => a.mobile === mobile);
  if (!account) return res.status(404).json({ error: 'no account found for this mobile number' });

  res.json({ message: 'login success', account });
});

// Test-only: lets you see what the site captured.
app.get('/api/leads', (req, res) => {
  res.json({ leads: store.listLeads().slice().reverse() });
});

app.listen(PORT, () => {
  console.log(`Dummy Bank running at http://localhost:${PORT}`);
});
