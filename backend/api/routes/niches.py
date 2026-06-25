from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from db.client import get_db
from db.models import NicheOut, ScanOut
from scrapers.appstore import scrape_appstore_signals
from scrapers.reddit import scrape_pain_signals
from scrapers.hackernews import scrape_hackernews
from analysis.claude_client import analyze_signals, generate_roadmap, filter_duplicate_niches
import uuid
from datetime import datetime, timezone

router = APIRouter()

SCAN_TOPICS = [
    "micro saas", "solopreneur tools", "B2B startup pain",
    "indie hacker", "no-code automation", "creator monetization",
    "GDPR compliance", "async video feedback", "sleep optimization app",
    "remote work tools",
]

NICHE_ALLOWED = {
    "id", "name", "category", "why_summary", "signal_score",
    "fit_score", "mvp_weeks", "competition", "tags", "scan_id"
}
COMP_ALLOWED = {
    "niche_id", "name", "website", "arr_estimate", "funding",
    "team_size", "founded_year", "gaps", "strengths", "ph_url", "li_url"
}
SIG_ALLOWED = {
    "source", "source_url", "title", "content", "metadata", "niche_id", "scan_id"
}


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
    return result.data or []


# ── SCAN — must be before /{niche_id} ──────────────────────────────────────
class ScanRequest(BaseModel):
    topics: list[str] = []

@router.post("/scan", response_model=ScanOut)
def trigger_scan(background_tasks: BackgroundTasks, req: ScanRequest = None):
    db = get_db()
    scan_id = str(uuid.uuid4())
    custom_topics = (req.topics if req and req.topics else [])
    db.table("scans").insert({
        "id": scan_id,
        "status": "running",
        "triggered_by": "manual",
        "sources_done": [],
        "niches_found": 0,
        "signals_found": 0,
    }).execute()
    background_tasks.add_task(_run_scan, scan_id, custom_topics)
    return {
        "id": scan_id, "status": "running", "sources_done": [],
        "niches_found": 0, "signals_found": 0, "triggered_by": "manual",
        "started_at": datetime.now(timezone.utc).isoformat(), "finished_at": None,
    }


@router.get("/scan/{scan_id}", response_model=ScanOut)
def get_scan_status(scan_id: uuid.UUID):
    db = get_db()
    result = db.table("scans").select("*").eq("id", str(scan_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Scan not found")
    return result.data



@router.get("/signals")
def get_signals(
    source: str | None = None,
    limit: int = Query(20, le=100),
):
    """Get scraped signals by source for sliders. Must be before /{niche_id}."""
    db = get_db()
    query = db.table("signals").select("id,source,source_url,title,content,metadata,created_at")
    if source:
        query = query.eq("source", source)
    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data or []

# ── Niche detail ───────────────────────────────────────────────────────────
@router.get("/{niche_id}")
def get_niche(niche_id: uuid.UUID):
    db = get_db()
    niche = db.table("niches").select("*").eq("id", str(niche_id)).single().execute()
    if not niche.data:
        raise HTTPException(404, "Niche not found")
    try:
        signals_result = db.table("signals").select("*").eq("niche_id", str(niche_id)).limit(20).execute()
        signals = signals_result.data or []
        if not signals and niche.data.get("scan_id"):
            scan_signals = db.table("signals").select("source,source_url,title,content,metadata").eq("scan_id", niche.data["scan_id"]).limit(10).execute()
            signals = scan_signals.data or []
    except Exception as e:
        print(f"[Niche] Signals error: {e}")
        signals = []
    competitors = db.table("competitors").select("*").eq("niche_id", str(niche_id)).execute()
    competitors_data = competitors.data if hasattr(competitors, "data") else competitors
    return {**niche.data, "signals": signals, "competitors": competitors_data}


@router.get("/{niche_id}/roadmap")
def get_roadmap(
    niche_id: uuid.UUID,
    budget: str = Query("bootstrap", enum=["bootstrap", "small", "funded"]),
    team: str = Query("solo", enum=["solo", "two", "small"]),
    timeline_weeks: int = Query(5, ge=1, le=12),
):
    db = get_db()
    niche = db.table("niches").select("name,why_summary,category").eq("id", str(niche_id)).single().execute()
    if not niche.data:
        raise HTTPException(404, "Niche not found")
    roadmap = generate_roadmap(niche.data["name"], budget, team, timeline_weeks)
    return roadmap


# ── Background scan ────────────────────────────────────────────────────────

def _similar(a: str, b: str) -> bool:
    a_words = set(a.lower().split())
    b_words = set(b.lower().split())
    stop = {"for","the","a","an","and","or","of","in","to","with","&","platform","saas","tool","app","service","system"}
    a_words -= stop
    b_words -= stop
    if not a_words or not b_words:
        return False
    overlap = len(a_words & b_words) / max(len(a_words), len(b_words))
    return overlap >= 0.7


def _run_scan(scan_id: str, custom_topics: list[str] = []):
    """
    Simple sync scan — no async, no event loop issues.
    1. App Store (works 100%)
    2. HackerNews (works 100%)
    3. Reddit via Arctic Shift (reliable, polite delays)
    4. Claude analysis
    5. Save to Supabase
    """
    db = get_db()
    all_signals = []
    sources_done = []

    def update_status(sources, count=None):
        upd = {"sources_done": sources}
        if count is not None:
            upd["signals_found"] = count
        db.table("scans").update(upd).eq("id", scan_id).execute()

    try:
        # ── 1. App Store ─────────────────────────────────────────────────
        topics_to_use = custom_topics if custom_topics else SCAN_TOPICS
        print(f"[Scan] Topics: {topics_to_use[:3]}")
        print("[Scan] Starting App Store scrape...")
        try:
            appstore_queries = topics_to_use[:6]
            app_signals = scrape_appstore_signals(appstore_queries, max_apps_per_query=4)
            all_signals.extend(app_signals)
            sources_done.append("appstore")
            update_status(sources_done, len(all_signals))
            print(f"[Scan] App Store: {len(app_signals)} signals")
        except Exception as e:
            print(f"[Scan] App Store failed: {e}")

        # ── 2. HackerNews ────────────────────────────────────────────────
        print("[Scan] Starting HackerNews scrape...")
        try:
            hn_signals = scrape_hackernews(max_items=25)
            all_signals.extend(hn_signals)
            sources_done.append("hackernews")
            update_status(sources_done, len(all_signals))
            print(f"[Scan] HackerNews: {len(hn_signals)} signals")
        except Exception as e:
            print(f"[Scan] HackerNews failed: {e}")

        # ── 3. Reddit (Arctic Shift) ──────────────────────────────────────
        print("[Scan] Starting Reddit scrape...")
        try:
            reddit_signals = scrape_pain_signals(topics_to_use[:5], limit_per_query=8)
            all_signals.extend(reddit_signals)
            sources_done.append("reddit")
            update_status(sources_done, len(all_signals))
            print(f"[Scan] Reddit: {len(reddit_signals)} signals")
        except Exception as e:
            print(f"[Scan] Reddit failed: {e}")

        print(f"[Scan] Total signals: {len(all_signals)}")

        if not all_signals:
            raise Exception("No signals collected from any source")

        # ── 4. Save raw signals ───────────────────────────────────────────
        clean_signals = []
        for sig in all_signals:
            sig_clean = {k: v for k, v in sig.items() if k in SIG_ALLOWED}
            sig_clean["scan_id"] = scan_id
            if "metadata" in sig_clean and not isinstance(sig_clean["metadata"], dict):
                sig_clean["metadata"] = {"value": str(sig_clean["metadata"])}
            clean_signals.append(sig_clean)

        if clean_signals:
            try:
                db.table("signals").insert(clean_signals).execute()
            except Exception as e:
                print(f"[Scan] Signals insert error: {e}")
                for s in clean_signals:
                    try:
                        db.table("signals").insert(s).execute()
                    except Exception:
                        pass

        # ── 5. Claude analysis ────────────────────────────────────────────
        print("[Scan] Starting Claude analysis...")
        existing = db.table("niches").select("name").execute()
        existing_names = [n["name"] for n in (existing.data or [])]

        niches_data = analyze_signals(all_signals[:50], existing_names)
        print(f"[Scan] Claude found {len(niches_data)} niches")
        niches_data = filter_duplicate_niches(niches_data, existing_names)
        print(f"[Scan] After dedup: {len(niches_data)} niches")

        # ── 6. Save niches + competitors ──────────────────────────────────
        saved_count = 0
        for niche in niches_data:
            try:
                competitors = niche.pop("competitors", [])

                # Remove extra fields
                for key in ["adjacent_niches", "pattern_type", "timing",
                            "sources_breakdown", "is_golden", "evidence", "_translated"]:
                    niche.pop(key, None)

                niche["id"] = str(uuid.uuid4())
                niche["scan_id"] = scan_id

                if not isinstance(niche.get("tags"), list):
                    niche["tags"] = []

                n_clean = {k: v for k, v in niche.items() if k in NICHE_ALLOWED}
                # Skip if too similar to existing niche
                niche_name = n_clean.get("name", "")
                if any(_similar(niche_name, ex) for ex in existing_names):
                    print(f"[Scan] Skipped duplicate: {niche_name}")
                    continue
                existing_names.append(niche_name)
                result = db.table("niches").insert(n_clean).execute()

                if result.data:
                    niche_id = result.data[0]["id"]
                    saved_count += 1
                    print(f"[Scan] Saved: {n_clean.get('name')}")

                    # Link signals to this niche based on source overlap
                    try:
                        db.table("signals").update({"niche_id": niche_id}).eq("scan_id", scan_id).is_("niche_id", "null").limit(15).execute()
                    except Exception as se:
                        print(f"[Scan] Signal link error: {se}")

                    for comp in competitors:
                        try:
                            comp["niche_id"] = niche_id

                            # Fix team_size: convert "11-50" → integer
                            if isinstance(comp.get("team_size"), str):
                                try:
                                    comp["team_size"] = int(comp["team_size"].split("-")[0])
                                except Exception:
                                    comp.pop("team_size", None)

                            if isinstance(comp.get("gaps"), str):
                                comp["gaps"] = [comp["gaps"]]
                            if isinstance(comp.get("strengths"), str):
                                comp["strengths"] = [comp["strengths"]]
                            if not isinstance(comp.get("gaps"), list):
                                comp["gaps"] = []

                            c_clean = {k: v for k, v in comp.items() if k in COMP_ALLOWED}
                            if c_clean.get("name"):
                                db.table("competitors").insert(c_clean).execute()
                        except Exception as ce:
                            print(f"[Scan] Competitor error: {ce}")

            except Exception as ne:
                print(f"[Scan] Niche save error: {ne}")

        # ── 7. Mark done ──────────────────────────────────────────────────
        db.table("scans").update({
            "status": "done",
            "sources_done": sources_done,
            "niches_found": saved_count,
            "signals_found": len(all_signals),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", scan_id).execute()

        print(f"[Scan] Complete: {saved_count} niches saved")

    except Exception as e:
        print(f"[Scan] Fatal error: {e}")
        db.table("scans").update({
            "status": "failed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", scan_id).execute()
