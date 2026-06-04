import httpx
import time

ARCTIC_BASE = "https://arctic-shift.photon-reddit.com"
SUBREDDITS = ["indiehackers", "SaaS", "startups", "microsaas", "nocode", "freelance", "Entrepreneur", "webdev"]

def scrape_subreddit(subreddit: str, query: str, limit: int = 15) -> list[dict]:
    try:
        with httpx.Client(headers={"User-Agent": "NicheAgent/1.0"}, timeout=15.0) as client:
            resp = client.get(f"{ARCTIC_BASE}/api/posts/search", params={
                "subreddit": subreddit,
                "query": query,
                "limit": limit,
                "sort": "desc",
            })
            if resp.status_code != 200:
                print(f"[Reddit] {resp.status_code} for r/{subreddit} '{query}'")
                return []
            results = []
            for p in resp.json().get("data", []):
                body = p.get("selftext", "").strip()
                if not body or body in ("[removed]", "[deleted]") or len(body) < 50:
                    continue
                post_id = p.get("id", "")
                sub = p.get("subreddit", subreddit)
                permalink = p.get("permalink", "")
                url = f"https://www.reddit.com{permalink}" if permalink else f"https://www.reddit.com/r/{sub}/comments/{post_id}/"
                results.append({
                    "source": "reddit", "source_url": url,
                    "title": p.get("title", "").strip(),
                    "content": f"{p.get('title','')}\n\n{body[:800]}",
                    "score": p.get("score", 0), "num_comments": p.get("num_comments", 0),
                    "subreddit": sub, "author": p.get("author", ""),
                    "metadata": {"score": p.get("score", 0), "subreddit": sub},
                })
            return results
    except Exception as e:
        print(f"[Reddit] Error r/{subreddit}: {e}")
        return []

def scrape_pain_signals(topics: list[str], limit_per_query: int = 10) -> list[dict]:
    all_signals = []
    seen_urls = set()
    for topic in topics[:4]:
        for sub in SUBREDDITS[:5]:
            for p in scrape_subreddit(sub, topic, limit=limit_per_query):
                if p["source_url"] not in seen_urls:
                    seen_urls.add(p["source_url"])
                    all_signals.append(p)
            time.sleep(1.0)
    print(f"[Reddit] Got {len(all_signals)} signals")
    return all_signals
