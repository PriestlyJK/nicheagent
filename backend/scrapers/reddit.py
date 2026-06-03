import httpx
import time
from datetime import datetime, timezone

SUBREDDITS_BY_CATEGORY = {
    "startup": ["SideProject", "startups", "entrepreneur", "microsaas", "SaaS"],
    "pain":    ["productmanagement", "smallbusiness", "freelance", "webdev"],
    "hot":     ["technology", "business", "investing"],
}

PAIN_KEYWORDS = [
    "looking for a tool", "wish there was", "no solution", "too expensive",
    "can't find", "alternative to", "anyone built", "pain point",
    "frustrated with", "I'd pay for", "missing feature", "nobody has built",
    "why is there no", "need a tool", "struggling with",
]

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


def _fetch_json(url: str, params: dict = None) -> dict:
    try:
        r = httpx.get(url, params=params, headers=HEADERS, timeout=15, follow_redirects=True)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"[Reddit] fetch error {url}: {e}")
    return {}


def scrape_rising_posts(subreddits: list[str] = None, limit: int = 25) -> list[dict]:
    """Get posts currently gaining traction — rising feed."""
    subs = subreddits or SUBREDDITS_BY_CATEGORY["startup"][:4]
    results = []
    for sub in subs:
        data = _fetch_json(f"https://www.reddit.com/r/{sub}/rising.json", {"limit": limit})
        posts = data.get("data", {}).get("children", [])
        for p in posts:
            d = p.get("data", {})
            results.append(_normalize_post(d, source_hint="rising"))
        print(f"[Reddit] r/{sub}/rising: {len(posts)} posts")
        time.sleep(1.5)
    return [r for r in results if r]


def scrape_hot_posts(subreddits: list[str] = None, limit: int = 25) -> list[dict]:
    """Get hot posts from last 24h — high engagement."""
    subs = subreddits or SUBREDDITS_BY_CATEGORY["pain"][:3]
    results = []
    for sub in subs:
        data = _fetch_json(f"https://www.reddit.com/r/{sub}/hot.json", {"limit": limit, "t": "day"})
        posts = data.get("data", {}).get("children", [])
        for p in posts:
            d = p.get("data", {})
            results.append(_normalize_post(d, source_hint="hot"))
        print(f"[Reddit] r/{sub}/hot: {len(posts)} posts")
        time.sleep(1.5)
    return [r for r in results if r]


def scrape_pain_search(topics: list[str], limit: int = 20) -> list[dict]:
    """Search PullPush for pain-point posts about specific topics."""
    results = []
    for topic in topics:
        try:
            r = httpx.get(
                "https://api.pullpush.io/reddit/search/submission/",
                params={"q": topic, "size": limit, "sort": "desc", "sort_type": "score"},
                headers=HEADERS, timeout=20, follow_redirects=True
            )
            if r.status_code == 200:
                posts = r.json().get("data", [])
                for p in posts:
                    normalized = _normalize_pullpush(p)
                    if normalized:
                        results.append(normalized)
                print(f"[Reddit] search '{topic}': {len(posts)} posts")
            else:
                print(f"[Reddit] search '{topic}': HTTP {r.status_code}")
            time.sleep(1)
        except Exception as e:
            print(f"[Reddit] search error '{topic}': {e}")
    return results


def scrape_pain_signals(topics: list[str]) -> list[dict]:
    """Main pipeline: rising + hot + search."""
    all_signals = []

    # 1. Rising posts — gaining traction RIGHT NOW
    rising = scrape_rising_posts(SUBREDDITS_BY_CATEGORY["startup"][:3], limit=20)
    all_signals.extend(rising)
    print(f"[Reddit] Rising: {len(rising)} posts")

    # 2. Hot posts from pain subreddits
    hot = scrape_hot_posts(SUBREDDITS_BY_CATEGORY["pain"][:3], limit=20)
    # filter to pain-related only
    pain_hot = [p for p in hot if any(
        kw in (p.get("title", "") + " " + p.get("content", "")).lower()
        for kw in PAIN_KEYWORDS
    )]
    all_signals.extend(pain_hot)
    print(f"[Reddit] Hot pain: {len(pain_hot)} posts")

    # 3. PullPush search for specific topics
    search_signals = scrape_pain_search(topics[:5], limit=20)
    all_signals.extend(search_signals)

    # Deduplicate by title
    seen = set()
    unique = []
    for s in all_signals:
        key = s.get("title", "")[:60]
        if key not in seen:
            seen.add(key)
            unique.append(s)

    print(f"[Reddit] Total unique signals: {len(unique)}")
    return unique


def _normalize_post(d: dict, source_hint: str = "") -> dict | None:
    if not d.get("title"):
        return None
    return {
        "source": "reddit",
        "source_url": f"https://reddit.com{d.get('permalink', '')}",
        "title": d.get("title", ""),
        "content": (d.get("selftext") or "")[:1000],
        "metadata": {
            "subreddit": d.get("subreddit", ""),
            "score": d.get("score", 0),
            "upvote_ratio": d.get("upvote_ratio", 0),
            "num_comments": d.get("num_comments", 0),
            "created_utc": d.get("created_utc", 0),
            "source_type": source_hint,
            "is_self": d.get("is_self", True),
        },
    }


def _normalize_pullpush(p: dict) -> dict | None:
    if not p.get("title"):
        return None
    return {
        "source": "reddit",
        "source_url": f"https://reddit.com{p.get('permalink', '')}",
        "title": p.get("title", ""),
        "content": (p.get("selftext") or "")[:1000],
        "metadata": {
            "subreddit": p.get("subreddit", ""),
            "score": p.get("score", 0),
            "num_comments": p.get("num_comments", 0),
            "created_utc": p.get("created_utc", 0),
            "source_type": "search",
        },
    }
