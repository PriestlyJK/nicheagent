"""
Reddit scraper via PullPush API.
Returns posts with EXACT URLs, subreddit, author, score.
Zero hallucination: if it's not in the API response, it's not in the output.
"""
import httpx
import asyncio
import time
from typing import Optional

PULLPUSH_BASE = "https://api.pullpush.io/reddit/search/submission/"
PUSHSHIFT_FALLBACK = "https://api.pushshift.io/reddit/search/submission/"

PAIN_SUBREDDITS = [
    "indiehackers", "SaaS", "startups", "Entrepreneur",
    "smallbusiness", "solopreneur", "microsaas", "digitalnomad",
    "freelance", "webdev", "productivity", "nocode",
]

PAIN_KEYWORDS = [
    "I wish there was", "why is there no", "sick of", "frustrated with",
    "can't find a tool", "looking for software", "does anyone know a tool",
    "spending too much time", "manual process", "no good solution",
    "pain point", "hate that", "wish someone would build",
    "anyone else struggle", "biggest problem with",
]

async def _fetch_pullpush(
    client: httpx.AsyncClient,
    query: str,
    subreddit: Optional[str] = None,
    size: int = 25,
    after_days: int = 90,
) -> list[dict]:
    """Fetch posts from PullPush. Returns raw posts with real metadata."""
    after_ts = int(time.time()) - (after_days * 86400)
    params = {
        "q": query,
        "size": size,
        "sort": "desc",
        "sort_type": "score",
        "after": after_ts,
    }
    if subreddit:
        params["subreddit"] = subreddit

    try:
        await asyncio.sleep(1.0)
        resp = await client.get(PULLPUSH_BASE, params=params, timeout=15.0)
        resp.raise_for_status()
        data = resp.json()
        posts = data.get("data", [])
    except Exception as e:
        print(f"[Reddit] PullPush error for '{query}': {e}")
        posts = []

    results = []
    for p in posts:
        if not p.get("selftext") or p["selftext"] in ("[removed]", "[deleted]", ""):
            continue
        score = p.get("score", 0)
        if score < 2:
            continue

        permalink = p.get("permalink", "")
        post_id = p.get("id", "")
        sub = p.get("subreddit", "")
        title = p.get("title", "").strip()
        body = p.get("selftext", "").strip()[:1500]

        full_url = f"https://www.reddit.com{permalink}" if permalink else \
                   f"https://www.reddit.com/r/{sub}/comments/{post_id}/"

        results.append({
            "source": "reddit",
            "source_url": full_url,
            "permalink": permalink,
            "post_id": post_id,
            "subreddit": sub,
            "title": title,
            "content": f"{title}\n\n{body}",
            "score": score,
            "num_comments": p.get("num_comments", 0),
            "author": p.get("author", "[deleted]"),
            "created_utc": p.get("created_utc", 0),
            "query_used": query,
        })

    return results


async def scrape_pain_signals_async(
    queries: list[str],
    max_per_query: int = 20,
    after_days: int = 90,
) -> list[dict]:
    """
    Async parallel Reddit scrape. Returns deduplicated signals with EXACT URLs.
    """
    seen_ids = set()
    all_signals = []

    async with httpx.AsyncClient(
        headers={"User-Agent": "NicheAgent/1.0 research bot"},
        follow_redirects=True,
    ) as client:
        tasks = []

        # Query × top subreddits (focus mode)
        for query in queries:
            for sub in SUBREDDIT_TARGETS_FOR_QUERY(query):
                tasks.append(_fetch_pullpush(client, query, sub, max_per_query, after_days))

            # Also search pain keywords in general
            for kw in PAIN_KEYWORDS[:5]:
                combined = f"{query} {kw}"
                tasks.append(_fetch_pullpush(client, combined, None, 10, after_days))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for batch in results:
            if isinstance(batch, Exception):
                continue
            for post in batch:
                uid = post.get("post_id") or post.get("source_url")
                if uid and uid not in seen_ids:
                    seen_ids.add(uid)
                    all_signals.append(post)

    # Sort by engagement
    all_signals.sort(key=lambda x: x.get("score", 0) + x.get("num_comments", 0) * 2, reverse=True)
    return all_signals


def SUBREDDIT_TARGETS_FOR_QUERY(query: str) -> list[str]:
    """Pick relevant subreddits based on query content."""
    q = query.lower()
    targets = ["indiehackers", "SaaS", "startups"]

    if any(w in q for w in ["health", "medical", "fitness", "wellness"]):
        targets += ["HealthIT", "digitalhealth", "QuantifiedSelf"]
    if any(w in q for w in ["developer", "dev", "code", "api", "sdk"]):
        targets += ["webdev", "programming", "devops"]
    if any(w in q for w in ["marketing", "content", "seo", "social"]):
        targets += ["marketing", "SEO", "content_marketing"]
    if any(w in q for w in ["finance", "accounting", "invoice", "payroll"]):
        targets += ["smallbusiness", "Entrepreneur", "accounting"]
    if any(w in q for w in ["ai", "llm", "gpt", "automation"]):
        targets += ["artificial", "MachineLearning", "ChatGPTPromptEngineering"]

    return list(dict.fromkeys(targets))[:5]


def scrape_pain_signals(
    queries: list[str],
    max_per_query: int = 20,
    after_days: int = 90,
) -> list[dict]:
    """Sync wrapper for async scraper."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    scrape_pain_signals_async(queries, max_per_query, after_days)
                )
                return future.result(timeout=60)
        else:
            return loop.run_until_complete(
                scrape_pain_signals_async(queries, max_per_query, after_days)
            )
    except Exception as e:
        print(f"[Reddit] Scrape failed: {e}")
        return []
