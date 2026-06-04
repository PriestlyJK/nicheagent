"""
HackerNews scraper via Firebase API.
100% public, no rate limits, no auth needed.
"""
import httpx

HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_NEW = "https://hacker-news.firebaseio.com/v0/newstories.json"
HN_ASK = "https://hacker-news.firebaseio.com/v0/askstories.json"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{id}.json"

STARTUP_KEYWORDS = [
    "saas", "startup", "indie", "founder", "product", "launch",
    "pain", "problem", "tool", "side project", "mrr", "b2b",
    "solopreneur", "micro", "niche", "idea", "market",
]


def scrape_hackernews(max_items: int = 30) -> list[dict]:
    """Fetch startup-relevant HN stories. Returns exact HN URLs."""
    results = []

    with httpx.Client(timeout=10.0) as client:
        # Get story IDs from multiple feeds
        all_ids = []
        for endpoint in [HN_ASK, HN_TOP]:
            try:
                resp = client.get(endpoint)
                ids = resp.json()[:100]
                all_ids.extend(ids)
            except Exception as e:
                print(f"[HN] Feed error: {e}")

        # Deduplicate
        seen = set()
        unique_ids = []
        for sid in all_ids:
            if sid not in seen:
                seen.add(sid)
                unique_ids.append(sid)

        # Fetch each story
        found = 0
        for story_id in unique_ids:
            if found >= max_items:
                break
            try:
                resp = client.get(HN_ITEM.format(id=story_id))
                item = resp.json()
                if not item or item.get("dead") or item.get("deleted"):
                    continue

                title = (item.get("title") or "").lower()
                text = (item.get("text") or "").lower()

                # Filter startup-relevant
                if not any(kw in title or kw in text for kw in STARTUP_KEYWORDS):
                    continue

                item_id = item.get("id")
                score = item.get("score", 0)
                comments = item.get("descendants", 0)
                full_title = item.get("title", "")
                full_text = item.get("text", "")[:600]
                author = item.get("by", "")

                results.append({
                    "source": "hackernews",
                    "source_url": f"https://news.ycombinator.com/item?id={item_id}",
                    "title": full_title,
                    "content": f"{full_title}\n\n{full_text}" if full_text else full_title,
                    "score": score,
                    "num_comments": comments,
                    "author": author,
                    "metadata": {
                        "score": score,
                        "item_id": item_id,
                        "external_url": item.get("url", ""),
                    }
                })
                found += 1

            except Exception as e:
                print(f"[HN] Item {story_id} error: {e}")
                continue

    print(f"[HN] Got {len(results)} startup signals")
    return results
