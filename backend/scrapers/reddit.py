import httpx
import time

ARCTIC_BASE = "https://arctic-shift.photon-reddit.com"
PAIN_SUBREDDITS = ["indiehackers", "SaaS", "startups", "microsaas", "nocode", "freelance"]
PAIN_PHRASES = ["wish there was", "frustrated with", "no good solution", "sick of", "can't find a tool"]

def scrape_reddit_posts(query: str, subreddit: str = None, limit: int = 10) -> list[dict]:
    results = []
    try:
        params = {"limit": limit, "sort": "score", "query": query}
        if subreddit:
            params["subreddit"] = subreddit
        with httpx.Client(headers={"User-Agent": "NicheAgent/1.0"}, timeout=15.0) as client:
            resp = client.get(f"{ARCTIC_BASE}/api/posts/search", params=params)
            if resp.status_code != 200:
                print(f"[Reddit] Error {resp.status_code} for '{query}'")
                return []
            for p in resp.json().get("data", []):
                body = p.get("selftext", "").strip()
                if not body or body in ("[removed]", "[deleted]") or len(body) < 50:
                    continue
                post_id = p.get("id", "")
                sub = p.get("subreddit", "")
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
    except Exception as e:
        print(f"[Reddit] Error for '{query}': {e}")
    return results

def scrape_pain_signals(topics: list[str], limit_per_query: int = 10) -> list[dict]:
    all_signals = []
    seen_urls = set()
    for topic in topics[:4]:
        for phrase in PAIN_PHRASES[:3]:
            for p in scrape_reddit_posts(f"{topic} {phrase}", limit=limit_per_query):
                if p["source_url"] not in seen_urls:
                    seen_urls.add(p["source_url"])
                    all_signals.append(p)
            time.sleep(1.5)
        for sub in PAIN_SUBREDDITS[:3]:
            for p in scrape_reddit_posts(topic, subreddit=sub, limit=8):
                if p["source_url"] not in seen_urls:
                    seen_urls.add(p["source_url"])
                    all_signals.append(p)
            time.sleep(1.5)
    print(f"[Reddit] Got {len(all_signals)} signals")
    return all_signals
