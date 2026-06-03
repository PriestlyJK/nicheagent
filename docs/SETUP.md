# Setup guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- Accounts on: Supabase, Anthropic, Reddit, Railway, Vercel

---

## Step 1 — Supabase (10 min)

1. Go to https://supabase.com → New project
2. Copy your project URL and keys from Settings → API
3. Go to SQL Editor → New query → paste contents of `backend/db/schema.sql` → Run
4. Enable pgvector: SQL Editor → `create extension if not exists vector;` → Run

---

## Step 2 — Reddit API (5 min)

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app" → type: **script**
3. Name: NicheAgent, redirect: http://localhost:8080
4. Copy client_id (under app name) and client_secret

---

## Step 3 — Backend locally

```bash
cd backend
cp .env.example .env
# Fill in all values in .env

pip install -r requirements.txt

# Run
uvicorn api.main:app --reload --port 8000
```

Test: http://localhost:8000/health → should return `{"status":"ok"}`
API docs: http://localhost:8000/docs

---

## Step 4 — Frontend locally

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Open: http://localhost:3000

---

## Step 5 — Deploy backend to Railway

1. Go to https://railway.app → New project → Deploy from GitHub
2. Select the `backend/` folder as root
3. Add all environment variables from `.env`
4. Railway auto-detects Procfile and deploys
5. Copy the Railway URL (e.g. `https://nicheagent.railway.app`)

---

## Step 6 — Deploy frontend to Vercel

1. Go to https://vercel.com → New project → Import from GitHub
2. Set root directory to `frontend/`
3. Add env vars:
   - `NEXT_PUBLIC_API_URL` = your Railway URL
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy → get your live URL

---

## Step 7 — Trigger first scan

```bash
curl -X POST https://your-railway-url.railway.app/api/niches/scan
```

Wait 2-3 minutes → check status:
```bash
curl https://your-railway-url.railway.app/api/niches/scan/{scan_id}
```

---

## Cost summary

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0/mo |
| Railway | Starter | $5/mo |
| Vercel | Hobby | $0/mo |
| Claude API | Pay-as-you-go | ~$10–15/mo |
| Reddit API | Free | $0/mo |
| **Total** | | **~$15–20/mo** |
