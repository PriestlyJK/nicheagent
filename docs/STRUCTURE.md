# NicheAgent — project structure

```
nicheagent/
├── backend/                  ← Python FastAPI (Railway)
│   ├── scrapers/             ← one file per data source
│   │   ├── reddit.py         ← PRAW: pain point posts
│   │   ├── trends.py         ← pytrends: velocity data
│   │   ├── producthunt.py    ← GraphQL: new launches
│   │   ├── metaads.py        ← public API: creative count
│   │   └── appstore.py       ← review scraper
│   ├── analysis/
│   │   ├── claude_client.py  ← Claude API calls
│   │   ├── scorer.py         ← signal → niche score
│   │   └── prompts.py        ← all prompt templates
│   ├── api/
│   │   ├── main.py           ← FastAPI app entry point
│   │   ├── routes/
│   │   │   ├── niches.py     ← GET /niches, POST /scan
│   │   │   ├── users.py      ← auth, profiles
│   │   │   └── social.py     ← reactions, interests
│   │   └── middleware.py     ← CORS, rate limiting
│   ├── db/
│   │   ├── client.py         ← Supabase client
│   │   ├── schema.sql        ← full DB schema
│   │   └── models.py         ← Pydantic models
│   └── scheduler/
│       └── cron.py           ← daily auto-scan
│
├── frontend/                 ← Next.js 14 (Vercel)
│   └── src/
│       ├── app/              ← App Router pages
│       │   ├── page.tsx      ← dashboard (/)
│       │   ├── saved/        ← saved niches
│       │   ├── sources/      ← sources overview
│       │   └── profile/      ← user profile
│       ├── components/
│       │   ├── ui/           ← reusable primitives
│       │   ├── dashboard/    ← main feed, stat cards
│       │   ├── detail/       ← expanded niche panel
│       │   └── wizard/       ← onboarding flow
│       ├── lib/
│       │   ├── api.ts        ← fetch wrapper for backend
│       │   └── supabase.ts   ← Supabase browser client
│       ├── hooks/            ← useNiches, useUser etc.
│       └── types/            ← shared TypeScript types
│
├── scripts/
│   └── seed_demo.py          ← populate demo data
│
└── docs/
    ├── STRUCTURE.md          ← this file
    ├── SETUP.md              ← how to run locally
    └── DEPLOY.md             ← Railway + Vercel deploy
```
