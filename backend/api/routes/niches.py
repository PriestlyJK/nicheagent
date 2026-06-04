from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from db.client import get_db
from db.models import NicheOut, ScanOut
from scrapers import reddit, trends, producthunt, metaads, appstore
from scrapers.twitter import scrape_twitter_signals
from scrapers.verify import verify_competitors
from scrapers.hot_topics import scrape_hot_topics, cache_hot_topics, load_cached_hot_topics
from analysis.claude_client import analyze_signals, generate_roadmap
import uuid
from datetime import datetime, timezone

router = APIRouter()

SCAN_TOPICS = [
    "async video feedback", "solopreneur tools", "B2B voice agents SMB",
    "sleep optimization app", "GDPR compliance startup", "creator monetization",
    "micro SaaS", "remote work tools", "no-code automation", "indie hacker tools",
]

@router.get("/", response_model=list[NicheOut])
def get_niches(
    category: str | None = None,
    sort_by: str = Query("signal_score", enum=["signal_score", "fit_score", "mvp_weeks", "competition"]),
    limit: int = Query(20, le=50),
):
    db = get_db()
    query = db.table("niches").select("*")
    if category:
        query = query.eq("category", category)
    order_asc = sort_by == "mvp_weeks"
    query = query.order(sort_by, desc=not order_asc).limit(limit)
    result = query.execute()
    return result.data


# ── SCAN routes MUST come before /{niche_id} ──
@router.post("/scan", response_model=ScanOut)
def trigger_scan(background_tasks: BackgroundTasks):
    db = get_db()
    scan_id = str(uuid.uuid4())
    db.table("scans").insert({
        "id": scan_id,
        "status": "running",
        "triggered_by": "manual",
    }).execute()
    background_tasks.add_task(_run_scan, scan_id)
    return {"id": scan_id, "status": "running", "sources_done": [],
            "niches_found": 0, "signals_found": 0, "triggered_by": "manual",
            "started_at": datetime.now(timezone.utc).isoformat()}


@router.get("/scan/{scan_id}", response_model=ScanOut)
def get_scan_status(scan_id: uuid.UUID):
    db = get_db()
    scan = db.table("scans").select("*").eq("id", str(scan_id)).single().execute()
    if not scan.data:
        raise HTTPException(404, "Scan not found")
    return scan.data


# ── NEW: Hot topics endpoint ──
@router.get("/hot-topics")
def get_hot_topics(refresh: bool = False, limit: int = 15):
    if not refresh:
        cached = load_cached_hot_topics()
        if cached:
            return {"topics": cached[:limit], "from_cache": True}
    topics = scrape_hot_topics(15)
    cache_hot_topics(topics)
    return {"topics": topics[:limit], "from_cache": False}


# ── Niche detail routes ──
@router.get("/{niche_id}")
def get_niche(niche_id: uuid.UUID):
    db = get_db()
    niche = db.table("niches").select("*").eq("id", str(niche_id)).single().execute()
    if not niche.data:
        raise HTTPException(404, "Niche not found")
    signals = db.table("signals").select("*").eq("niche_id", str(niche_id)).execute()
    competitors = db.table("competitors").select("*").eq("niche_id", str(niche_id)).execute()
    return {
        **niche.data,
        "signals": signals.data,
        "competitors": competitors.data,
    }


@router.get("/{niche_id}/roadmap")
def get_roadmap(
    niche_id: uuid.UUID,
    budget: str = Query("bootstrap", enum=["bootstrap", "small", "funded"]),
    team: str = Query("solo", enum=["solo", "two", "small"]),
    timeline_weeks: int = Query(5, ge=1, le=12),
):
    db = get_db()
    niche = db.table("niches").select("name").eq("id", str(niche_id)).single().execute()
    if not niche.data:
        raise HTTPException(404, "Niche not found")
    roadmap = generate_roadmap(niche.data["name"], budget, team, timeline_weeks)
    return roadmap


def _run_scan(scan_id: str):
    """Background task: scrape all sources, analyze, store results."""
    db = get_db()
    all_signals = []
    sources_done = []

    try:
        # 1. Reddit (fixed async scraper)
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        signals = reddit.scrape_pain_signals(SCAN_TOPICS[:5])
        all_signals.extend(signals)
        sources_done.append("reddit")
        db.table("scans").update({"sources_done": sources_done}).eq("id", scan_id).execute()

        # 2. Google Trends
        trend_data = trends.get_trend_velocity(SCAN_TOPICS[:5])
        for kw, data in trend_data.items():
            all_signals.append({
                "source": "trends",
                "source_url": f"https://trends.google.com/trends/explore?q={kw}",
                "title": f"Google Trends: {kw}",
                "content": f"Trend: {data['trend']}, change: {data['pct_change']}%",
                "metadata": data,
            })
        sources_done.append("google_trends")
        db.table("scans").update({"sources_done": sources_done}).eq("id", scan_id).execute()

        # 3. Product Hunt
        for topic in SCAN_TOPICS[:3]:
            ph_signals = producthunt.scrape_launches(topic, limit=10)
            all_signals.extend(ph_signals)
        sources_done.append("producthunt")
        db.table("scans").update({"sources_done": sources_done}).eq("id", scan_id).execute()

        # 4. Meta Ads
        for topic in SCAN_TOPICS[:3]:
            meta = metaads.scrape_creative_count(topic)
            all_signals.append(meta)
        sources_done.append("meta_ads")

        # 5. App Store (fixed scraper with real 1-star reviews)
        for topic in SCAN_TOPICS[:2]:
            app_signals = appstore.scrape_appstore_signals([topic])
            all_signals.extend(app_signals)
        sources_done.append("appstore")

        # 6. Twitter/X (NEW — добавляємо тихо)
        try:
            twitter_signals = scrape_twitter_signals(SCAN_TOPICS[:3])
            all_signals.extend(twitter_signals)
            sources_done.append("twitter")
            db.table("scans").update({"sources_done": sources_done}).eq("id", scan_id).execute()
        except Exception as te:
            print(f"[Scan] Twitter scrape skipped: {te}")

        # existing niche names to avoid dupes
        existing = db.table("niches").select("name").execute()
        existing_names = [n["name"] for n in (existing.data or [])]

        # store raw signals
        SIG_ALLOWED = {"source", "source_url", "title", "content", "metadata", "niche_id", "scan_id"}
        clean_signals = []
        for sig in all_signals:
            sig["scan_id"] = scan_id
            sig_clean = {k: v for k, v in sig.items() if k in SIG_ALLOWED}
            if "metadata" in sig_clean and not isinstance(sig_clean["metadata"], dict):
                sig_clean["metadata"] = {"value": str(sig_clean["metadata"])}
            clean_signals.append(sig_clean)
        if clean_signals:
            try:
                db.table("signals").insert(clean_signals).execute()
            except Exception as se:
                print(f"[Scan] Signals batch insert error: {se}")
                for s in clean_signals:
                    try:
                        db.table("signals").insert(s).execute()
                    except Exception:
                        pass

        # 7. Claude analysis
        niches_data = analyze_signals(all_signals, existing_names)

        # 8. Store niches + verified competitors
        NICHE_ALLOWED = {
            "id", "name", "category", "why_summary", "signal_score", "fit_score",
            "mvp_weeks", "competition", "tags", "scan_id"
        }
        COMP_ALLOWED = {
            "niche_id", "name", "website", "arr_estimate", "funding",
            "team_size", "founded_year", "gaps", "strengths", "ph_url", "li_url", "metadata"
        }

        for niche in niches_data:
            competitors = niche.pop("competitors", [])
            # clean extra fields Claude sometimes returns
            for key in ("adjacent_niches", "pattern_type", "timing", "sources_breakdown",
                        "is_golden", "evidence", "_translated"):
                niche.pop(key, None)
            niche["scan_id"] = scan_id
            if "id" not in niche:
                niche["id"] = str(uuid.uuid4())
            niche_clean = {k: v for k, v in niche.items() if k in NICHE_ALLOWED}
            if isinstance(niche_clean.get("tags"), str):
                niche_clean["tags"] = [niche_clean["tags"]]
            if not isinstance(niche_clean.get("tags"), list):
                niche_clean["tags"] = []

            result = db.table("niches").insert(niche_clean).execute()
            if result.data:
                niche_id = result.data[0]["id"]

                # Verify competitor websites before saving
                if competitors:
                    try:
                        competitors = verify_competitors(competitors)
                    except Exception as ve:
                        print(f"[Scan] Verify skipped: {ve}")

                for comp in competitors:
                    comp["niche_id"] = niche_id
                    comp_clean = {k: v for k, v in comp.items() if k in COMP_ALLOWED}
                    if isinstance(comp_clean.get("gaps"), str):
                        comp_clean["gaps"] = [comp_clean["gaps"]]
                    if isinstance(comp_clean.get("strengths"), str):
                        comp_clean["strengths"] = [comp_clean["strengths"]]
                    if not isinstance(comp_clean.get("gaps"), list):
                        comp_clean["gaps"] = []
                    # Fix team_size: convert "11-50" string to integer (take lower bound)
                    if "team_size" in comp_clean and isinstance(comp_clean["team_size"], str):
                        try:
                            comp_clean["team_size"] = int(comp_clean["team_size"].split("-")[0])
                        except:
                            comp_clean.pop("team_size", None)
                    if comp_clean.get("name"):
                        try:
                            db.table("competitors").insert(comp_clean).execute()
                        except Exception as ce:
                            print(f"[Scan] Competitor insert error: {ce}")

        db.table("scans").update({
            "status": "done",
            "sources_done": sources_done,
            "niches_found": len(niches_data),
            "signals_found": len(all_signals),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", scan_id).execute()

    except Exception as e:
        print(f"[Scan] Failed: {e}")
        db.table("scans").update({
            "status": "failed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", scan_id).execute()
