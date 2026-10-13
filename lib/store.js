// Tiny JSON-file store for leads and accounts. Good enough for a test app;
// on Render's free tier the file resets on redeploy.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function load() {
  if (!fs.existsSync(DB_PATH)) return { accounts: [], leads: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function save(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function findAccount(predicate) {
  return load().accounts.find(predicate);
}

function addAccount(account) {
  const db = load();
  db.accounts.push(account);
  save(db);
  return account;
}

function addLead(lead) {
  const db = load();
  db.leads.push(lead);
  save(db);
  return lead;
}

function updateLead(id, patch) {
  const db = load();
  const lead = db.leads.find((l) => l.id === id);
  if (lead) Object.assign(lead, patch);
  save(db);
  return lead;
}

function listLeads() {
  return load().leads;
}

module.exports = { findAccount, addAccount, addLead, updateLead, listLeads };
