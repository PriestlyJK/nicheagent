"""
Reddit scraper via Arctic Shift API.
No rate limits for normal usage. Sync. Simple.
Returns posts with exact URLs.
"""
import httpx
import time

ARCTIC_BASE = "https://arctic-shift.photon-reddit.com/api"

PAIN_SUBREDDITS = [
    "indiehackers", "SaaS", "startups", "Entrepreneur",
    "microsaas", "nocode", "webdev", "freelance",
]

PAIN_KEYWORDS = [
    "I wish there was", "why is there no", "sick of",
    "frustrated with", "can't find a tool", "no good solution",
    "anyone else struggle", "biggest problem with",
    "looking for software", "spending too much time",
]


def scrape_reddit_posts(query: str, limit: int = 15) -> list[dict]:
    """Fetch posts from Arctic Shift for a query. Returns exact URLs."""
    results = []
    try:
        with httpx.Client(
            headers={"User-Agent": "NicheAgent/1.0 research"},
            timeout=15.0,
        ) as client:
            resp = client.get(
                f"{ARCTIC_BASE}/posts/search",
                params={
                    "q": query,
                    "limit": limit,
                    "sort": "score",
                },
            )
            if resp.status_code != 200:
                print(f"[Reddit] Arctic Shift error {resp.status_code} for '{query}'")
                return []

            data = resp.json()
            posts = data.get("data", [])

            for p in posts:
                body = p.get("selftext", "").strip()
                if not body or body in ("[removed]", "[deleted]"):
                    continue
                if len(body) < 50:
                    continue

                post_id = p.get("id", "")
                sub = p.get("subreddit", "")
                title = p.get("title", "").strip()
                score = p.get("score", 0)
                permalink = p.get("permalink", "")

                if permalink:
                    url = f"https://www.reddit.com{permalink}"
                else:
                    url = f"https://www.reddit.com/r/{sub}/comments/{post_id}/"

                results.append({
                    "source": "reddit",
                    "source_url": url,
                    "title": title,
                    "content": f"{title}\n\n{body[:800]}",
                    "score": score,
                    "num_comments": p.get("num_comments", 0),
                    "subreddit": sub,
                    "author": p.get("author", ""),
                    "metadata": {
                        "score": score,
                        "subreddit": sub,
                        "post_id": post_id,
                    }
                })

    except Exception as e:
        print(f"[Reddit] Error for '{query}': {e}")

    return results


def scrape_pain_signals(topics: list[str], limit_per_query: int = 10) -> list[dict]:
    """
    Scrape Reddit for pain signals.
    Simple sync loop with 1s delay between requests to be polite.
    """
    all_signals = []
    seen_urls = set()

    queries = []
    for topic in topics[:5]:
        queries.append(topic)
        for kw in PAIN_KEYWORDS[:3]:
            queries.append(f"{topic} {kw}")

    for query in queries:
        posts = scrape_reddit_posts(query, limit=limit_per_query)
        for p in posts:
            url = p.get("source_url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_signals.append(p)
        time.sleep(1.0)  # polite delay

    print(f"[Reddit] Got {len(all_signals)} unique signals")
    return all_signals
