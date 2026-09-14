# Dummy Bank Test App

A minimal fake bank account-creation + login page for testing a ConsentIQ integration. No consent checkboxes are included on purpose.

## Deploy live (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shubhPujara02/dummy-bank)

Click the button above, sign in with your GitHub account, and Render will build and host this app for you on a public URL — no server setup needed. It uses the `render.yaml` blueprint at the repo root.

> Note: on Render's free tier, the disk is not persistent across deploys/restarts, so `data/signups.csv` can reset when the service restarts or redeploys. Fine for integration testing; if you need durable storage, swap the CSV file for a database later.

## Run locally

```bash
npm install
npm start
```

Then open http://localhost:4000

- **http://localhost:4000/** — account creation form (Name, Mobile, Email)
- **http://localhost:4000/login.html** — login with the registered mobile number

## Data storage

Signups are stored in `data/signups.csv` (columns: `name,mobile,email,created_at`). This file is created automatically on first run and is git-ignored.

## API

- `POST /api/signup` — body `{ name, mobile, email }`
- `POST /api/login` — body `{ mobile }`
