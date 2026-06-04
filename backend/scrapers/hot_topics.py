"""
Hot Topics engine.
Scrapes trending startup/SaaS discussions from Reddit + HackerNews.
Returns threads with EXACT URLs for the hot topic banners.
Updates should run every 6 hours via GitHub Actions or background task.
"""
import httpx
import asyncio
from datetime import datetime, timedelta
import json
import os


HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{id}.json"
HN_SHOW_STORIES = "https://hacker-news.firebaseio.com/v0/showstories.json"
HN_ASK_STORIES = "https://hacker-news.firebaseio.com/v0/askstories.json"

HOT_SUBREDDITS = [
    "SaaS", "indiehackers", "startups", "Entrepreneur", "microsaas"
]

STARTUP_HOT_KEYWORDS = [
    "saas", "startup", "indie", "solopreneur", "founder", "build", "launch",
    "product", "niche", "micro", "b2b", "app", "tool", "software", "side project",
    "mrr", "revenue", "growth", "market", "idea", "pain point",
]


async def _fetch_hn_hot(client: httpx.AsyncClient, max_items: int = 20) -> list[dict]:
    """Fetch trending HN stories about startups/SaaS/indie."""
    hot = []

    for endpoint in [HN_SHOW_STORIES, HN_ASK_STORIES, HN_TOP_STORIES]:
        try:
            resp = await client.get(endpoint, timeout=10.0)
            story_ids = resp.json()[:100]

            tasks = [
                client.get(HN_ITEM.format(id=sid), timeout=8.0)
                for sid in story_ids[:50]
            ]
            item_resps = await asyncio.gather(*tasks, return_exceptions=True)

            for r in item_resps:
                if isinstance(r, Exception):
                    continue
                try:
                    item = r.json()
                except Exception:
                    continue

                if not item or item.get("dead") or item.get("deleted"):
                    continue

                title = (item.get("title") or "").lower()
                text = (item.get("text") or "").lower()

                # Check if startup-relevant
                if not any(kw in title or kw in text for kw in STARTUP_HOT_KEYWORDS):
                    continue

                score = item.get("score", 0)
                comments = item.get("descendants", 0)
                item_id = item.get("id")

                hot.append({
                    "source": "hackernews",
                    "source_url": f"https://news.ycombinator.com/item?id={item_id}",
                    "external_url": item.get("url", ""),
                    "title": item.get("title", ""),
                    "content": item.get("text", "")[:500] or item.get("title", ""),
                    "score": score,
                    "comments": comments,
                    "item_id": str(item_id),
                    "type": item.get("type", "story"),
                    "author": item.get("by", ""),
                    "time": item.get("time", 0),
                })

            if len(hot) >= max_items:
                break

        except Exception as e:
            print(f"[HotTopics] HN fetch error: {e}")
            continue

    return hot[:max_items]


async def _fetch_reddit_hot(
    client: httpx.AsyncClient,
    subreddit: str,
    max_items: int = 10,
) -> list[dict]:
    """Fetch hot posts from a subreddit."""
    url = f"https://www.reddit.com/r/{subreddit}/hot.json"
    try:
        resp = await client.get(
            url,
            params={"limit": max_items},
            timeout=10.0,
            headers={"User-Agent": "NicheAgent/1.0 research"},
        )
        resp.raise_for_status()
        posts = resp.json().get("data", {}).get("children", [])

        results = []
        for p in posts:
            d = p.get("data", {})
            if d.get("stickied") or not d.get("selftext"):
                continue

            score = d.get("score", 0)
            if score < 10:
                continue

            permalink = d.get("permalink", "")
            post_id = d.get("id", "")
            full_url = f"https://www.reddit.com{permalink}" if permalink else \
                       f"https://www.reddit.com/r/{subreddit}/comments/{post_id}/"

            results.append({
                "source": "reddit",
                "source_url": full_url,
                "subreddit": subreddit,
                "title": d.get("title", ""),
                "content": d.get("selftext", "")[:500],
                "score": score,
                "comments": d.get("num_comments", 0),
                "post_id": post_id,
                "author": d.get("author", ""),
                "created_utc": d.get("created_utc", 0),
                "flair": d.get("link_flair_text", ""),
            })

        return results

    except Exception as e:
        print(f"[HotTopics] Reddit r/{subreddit} error: {e}")
        return []


def _generate_quick_ideas(title: str, content: str, source: str) -> list[str]:
    """
    Generate 2-3 quick startup ideas based on the thread title.
    These are fast heuristic ideas, NOT Claude-generated (for speed).
    Claude can refine them later.
    """
    title_lower = title.lower()
    content_lower = content.lower()
    ideas = []

    # Heuristic idea generation based on keywords
    if any(w in title_lower for w in ["api", "integration", "connect", "sync"]):
        ideas.append("API aggregator that auto-syncs between the mentioned tools")

    if any(w in title_lower for w in ["automate", "manual", "tedious", "repetitive"]):
        ideas.append("Workflow automation layer that eliminates the manual steps discussed")

    if any(w in title_lower for w in ["price", "cost", "expensive", "afford", "cheap"]):
        ideas.append("Cost-effective alternative targeting the price gap mentioned")

    if any(w in title_lower for w in ["track", "monitor", "analytics", "metrics", "report"]):
        ideas.append("Lightweight analytics dashboard focused on the metrics discussed")

    if any(w in title_lower for w in ["find", "search", "discover", "source"]):
        ideas.append("AI-powered discovery tool for the domain mentioned")

    if any(w in title_lower for w in ["hire", "freelance", "talent", "team"]):
        ideas.append("Niche talent marketplace for the specific role or skill discussed")

    if any(w in title_lower for w in ["content", "write", "generate", "create"]):
        ideas.append("Specialized content generator tuned to the format/niche discussed")

    if any(w in title_lower for w in ["legal", "contract", "compliance", "gdpr", "privacy"]):
        ideas.append("Compliance automation tool for the legal requirement mentioned")

    if not ideas:
        ideas = [
            "SaaS tool solving the specific workflow mentioned",
            "Community/marketplace around this pain point",
        ]

    return ideas[:3]


async def scrape_hot_topics_async(max_per_source: int = 15) -> list[dict]:
    """
    Scrape trending discussions. Returns hot topics with exact URLs.
    Each has quick_ideas (heuristic, fast).
    """
    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [
            _fetch_hn_hot(client, max_per_source),
        ] + [
            _fetch_reddit_hot(client, sub, max_per_source)
            for sub in HOT_SUBREDDITS
        ]

        all_batches = await asyncio.gather(*tasks, return_exceptions=True)

    all_hot = []
    seen = set()

    for batch in all_batches:
        if isinstance(batch, Exception):
            continue
        for item in batch:
            uid = item.get("source_url") or item.get("post_id") or item.get("item_id")
            if uid in seen:
                continue
            seen.add(uid)

            # Add quick ideas
            item["quick_ideas"] = _generate_quick_ideas(
                item.get("title", ""),
                item.get("content", ""),
                item.get("source", ""),
            )

            # Engagement score for sorting
            item["engagement"] = item.get("score", 0) + item.get("comments", 0) * 2

            all_hot.append(item)

    # Sort by engagement
    all_hot.sort(key=lambda x: x.get("engagement", 0), reverse=True)
    return all_hot[:30]  # top 30 hot threads


def scrape_hot_topics(max_per_source: int = 15) -> list[dict]:
    """Sync wrapper."""
    try:
        return asyncio.run(scrape_hot_topics_async(max_per_source))
    except Exception as e:
        print(f"[HotTopics] Failed: {e}")
        return []


def cache_hot_topics(topics: list[dict], cache_path: str = "/tmp/hot_topics_cache.json"):
    """Save to file cache for quick retrieval."""
    try:
        cache = {
            "updated_at": datetime.utcnow().isoformat(),
            "topics": topics,
        }
        with open(cache_path, "w") as f:
            json.dump(cache, f)
        print(f"[HotTopics] Cached {len(topics)} topics")
    except Exception as e:
        print(f"[HotTopics] Cache write error: {e}")


def load_cached_hot_topics(
    cache_path: str = "/tmp/hot_topics_cache.json",
    max_age_hours: int = 6,
) -> Optional[list[dict]]:
    """Load from cache if fresh enough."""
    try:
        if not os.path.exists(cache_path):
            return None
        with open(cache_path) as f:
            cache = json.load(f)
        updated = datetime.fromisoformat(cache["updated_at"])
        age = datetime.utcnow() - updated
        if age > timedelta(hours=max_age_hours):
            return None
        return cache["topics"]
    except Exception:
        return None


from typing import Optional
