const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_DIR = path.join(__dirname, 'data');
const CSV_PATH = path.join(DATA_DIR, 'signups.csv');
const CSV_HEADER = 'name,mobile,email,created_at\n';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CSV_PATH)) fs.writeFileSync(CSV_PATH, CSV_HEADER);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function escapeCsv(value) {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function readSignups() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8').trim();
  const lines = raw.split('\n').slice(1).filter(Boolean);
  return lines.map((line) => {
    const [name, mobile, email, created_at] = line
      .match(/(".*?"|[^,]+)(?=,|$)/g)
      .map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
    return { name, mobile, email, created_at };
  });
}

app.post('/api/signup', (req, res) => {
  const { name, mobile, email } = req.body || {};

  if (!name || !mobile || !email) {
    return res.status(400).json({ error: 'name, mobile and email are required' });
  }
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'mobile must be a 10-digit number' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'email is invalid' });
  }

  const signups = readSignups();
  if (signups.some((s) => s.mobile === mobile)) {
    return res.status(409).json({ error: 'an account with this mobile number already exists' });
  }

  const row = [name, mobile, email, new Date().toISOString()].map(escapeCsv).join(',') + '\n';
  fs.appendFileSync(CSV_PATH, row);

  res.status(201).json({ message: 'account created', account: { name, mobile, email } });
});

app.post('/api/login', (req, res) => {
  const { mobile } = req.body || {};

  if (!mobile) {
    return res.status(400).json({ error: 'mobile is required' });
  }

  const signups = readSignups();
  const account = signups.find((s) => s.mobile === mobile);

  if (!account) {
    return res.status(404).json({ error: 'no account found for this mobile number' });
  }

  res.json({ message: 'login success', account });
});

app.listen(PORT, () => {
  console.log(`Dummy Bank test app running at http://localhost:${PORT}`);
});
