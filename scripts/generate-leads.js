// Generates N deterministic dummy Dummy-Bank leads (default 200) and writes:
//   data/seed/hubspot-contacts.csv  – ready for HubSpot's manual Import wizard
//   data/seed/hubspot-contacts.json – used by scripts/seed-hubspot.js
// Usage: node scripts/generate-leads.js [count]

const fs = require('fs');
const path = require('path');
const { PRODUCTS, INCOME_BANDS, LEAD_CHANNELS, KYC_STATUSES, LANGUAGES } = require('../lib/catalog');

const COUNT = Number(process.argv[2]) || 200;
const OUT_DIR = path.join(__dirname, '..', 'data', 'seed');

// Seeded PRNG (mulberry32) so every run produces the same 200 people.
let seed = 20261013;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const values = (list) => list.map((o) => o.value);

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan',
  'Kabir', 'Dhruv', 'Harsh', 'Karan', 'Nikhil', 'Rahul', 'Siddharth', 'Yash', 'Manish', 'Pranav',
  'Aanya', 'Diya', 'Ananya', 'Saanvi', 'Aadhya', 'Isha', 'Kavya', 'Meera', 'Riya', 'Priya',
  'Neha', 'Pooja', 'Sneha', 'Shreya', 'Tanvi', 'Nisha', 'Anjali', 'Divya', 'Kriti', 'Zara'];
const LAST = ['Sharma', 'Verma', 'Patel', 'Shah', 'Mehta', 'Desai', 'Iyer', 'Nair', 'Reddy', 'Rao',
  'Gupta', 'Agarwal', 'Joshi', 'Kulkarni', 'Pillai', 'Banerjee', 'Chatterjee', 'Das', 'Singh', 'Khan',
  'Pujara', 'Trivedi', 'Bhatt', 'Menon', 'Kapoor', 'Malhotra', 'Chopra', 'Saxena', 'Mishra', 'Pandey'];
const CITIES = [
  ['Mumbai', 'Maharashtra'], ['Pune', 'Maharashtra'], ['Ahmedabad', 'Gujarat'], ['Surat', 'Gujarat'],
  ['Rajkot', 'Gujarat'], ['Bengaluru', 'Karnataka'], ['Chennai', 'Tamil Nadu'], ['Hyderabad', 'Telangana'],
  ['Kolkata', 'West Bengal'], ['Delhi', 'Delhi'], ['Jaipur', 'Rajasthan'], ['Lucknow', 'Uttar Pradesh'],
  ['Kochi', 'Kerala'], ['Indore', 'Madhya Pradesh'], ['Chandigarh', 'Chandigarh'],
];
const JOBS = ['Software Engineer', 'Teacher', 'Doctor', 'Chartered Accountant', 'Business Owner', 'Sales Manager',
  'Student', 'Architect', 'Pharmacist', 'Civil Servant', 'Freelancer', 'Nurse', 'Consultant', 'Retired'];
const EMPLOYERS = ['Infosys', 'TCS', 'Wipro', 'Self-employed', 'Apollo Hospitals', 'Reliance', 'Govt. of India',
  'Zomato', 'L&T', 'HCL', 'Kotak', '—'];
const LEAD_STATUS = ['NEW', 'OPEN', 'IN_PROGRESS', 'ATTEMPTED_TO_CONTACT', 'CONNECTED', 'UNQUALIFIED', 'BAD_TIMING'];
const LANG_BY_STATE = { Gujarat: 'gu', Maharashtra: 'mr', 'Tamil Nadu': 'ta', 'West Bengal': 'bn', 'Uttar Pradesh': 'hi', Delhi: 'hi', Rajasthan: 'hi' };

function build(i) {
  const first = pick(FIRST);
  const last = pick(LAST);
  const [city, state] = pick(CITIES);
  const n = String(i + 1).padStart(3, '0');
  const mobile = pick(['9', '8', '7', '6']) + String(Math.floor(rand() * 1e9)).padStart(9, '0');
  const channel = pick(values(LEAD_CHANNELS));
  const isCustomer = rand() < 0.35;
  const lifecycle = isCustomer ? 'customer' : pick(['subscriber', 'lead', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity']);
  const language = rand() < 0.6 ? 'en' : LANG_BY_STATE[state] || pick(values(LANGUAGES));

  return {
    // example.com is reserved for testing, so these never reach a real inbox.
    email: `${first}.${last}.${n}@example.com`.toLowerCase(),
    firstname: first,
    lastname: last,
    mobilephone: `+91${mobile}`,
    city,
    state,
    country: 'India',
    jobtitle: pick(JOBS),
    company: pick(EMPLOYERS),
    lifecyclestage: lifecycle,
    hs_lead_status: isCustomer ? 'CONNECTED' : pick(LEAD_STATUS),
    db_product_interest: pick(values(PRODUCTS)),
    db_income_band: pick(values(INCOME_BANDS)),
    db_lead_channel: channel,
    db_kyc_status: isCustomer ? pick(['verified', 'verified', 'pending']) : pick(values(KYC_STATUSES)),
    db_preferred_language: language,
    db_customer_id: isCustomer ? 'DB' + String(10000000 + i * 7919).slice(-8) : '',
  };
}

function toCsv(rows) {
  const cols = Object.keys(rows[0]);
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

const rows = Array.from({ length: COUNT }, (_, i) => build(i));
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'hubspot-contacts.json'), JSON.stringify(rows, null, 2) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'hubspot-contacts.csv'), toCsv(rows));
console.log(`Wrote ${rows.length} contacts to ${path.relative(process.cwd(), OUT_DIR)}/`);
