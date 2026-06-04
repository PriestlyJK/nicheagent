"""
Twitter/X scraper via nitter public instances + twitter.com search.
No API key needed — uses public search endpoints.
Returns tweets with EXACT URLs, never hallucinated.
"""
import httpx
import asyncio
import re
from typing import Optional
from datetime import datetime, timedelta

# Public Nitter instances (check alive ones)
NITTER_INSTANCES = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.1d4.us",
    "https://nitter.kavin.rocks",
]

# Twitter search via unofficial public API
TWITTER_SEARCH_URL = "https://twitter.com/search"


async def _try_nitter_rss(
    client: httpx.AsyncClient,
    query: str,
    instance: str,
    max_results: int = 15,
) -> list[dict]:
    """Fetch tweets via Nitter RSS feed."""
    encoded = query.replace(" ", "+")
    url = f"{instance}/search/rss?q={encoded}&f=tweets"

    try:
        resp = await client.get(url, timeout=10.0)
        if resp.status_code != 200:
            return []

        content = resp.text
        items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)

        results = []
        for item in items[:max_results]:
            title_m = re.search(r'<title>(.*?)</title>', item, re.DOTALL)
            link_m = re.search(r'<link>(.*?)</link>', item, re.DOTALL)
            desc_m = re.search(r'<description>(.*?)</description>', item, re.DOTALL)
            date_m = re.search(r'<pubDate>(.*?)</pubDate>', item, re.DOTALL)
            author_m = re.search(r'<dc:creator>(.*?)</dc:creator>', item, re.DOTALL)

            if not link_m:
                continue

            raw_link = link_m.group(1).strip()
            # Convert nitter URL to twitter URL
            twitter_url = raw_link
            for inst in NITTER_INSTANCES:
                twitter_url = twitter_url.replace(inst, "https://twitter.com")
            # Normalize: nitter.domain -> twitter.com
            twitter_url = re.sub(r'https://nitter\.[^/]+/', 'https://twitter.com/', twitter_url)

            tweet_id_m = re.search(r'/status/(\d+)', twitter_url)
            tweet_id = tweet_id_m.group(1) if tweet_id_m else ""

            author = author_m.group(1).strip() if author_m else "unknown"
            raw_desc = desc_m.group(1).strip() if desc_m else ""
            # Clean HTML tags
            clean_desc = re.sub(r'<[^>]+>', '', raw_desc).strip()
            # Decode HTML entities
            clean_desc = clean_desc.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')

            if not clean_desc or len(clean_desc) < 20:
                continue

            results.append({
                "source": "twitter",
                "source_url": twitter_url,
                "tweet_id": tweet_id,
                "author": author,
                "title": f"@{author} on Twitter",
                "content": clean_desc,
                "query_used": query,
            })

        return results

    except Exception as e:
        print(f"[Twitter] Nitter {instance} failed for '{query}': {e}")
        return []


async def _try_twitter_direct(
    client: httpx.AsyncClient,
    query: str,
    max_results: int = 10,
) -> list[dict]:
    """
    Try scraping Twitter search page directly.
    Often blocked but worth trying as fallback.
    """
    # Use Twitter's search API endpoint that's been around publicly
    encoded = query.replace(" ", "%20")
    url = f"https://twitter.com/search?q={encoded}&src=typed_query&f=live"

    try:
        resp = await client.get(
            url,
            timeout=10.0,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; research bot)",
                "Accept": "text/html,application/xhtml+xml",
            }
        )
        # Usually 200 but with login wall — just return empty
        return []
    except Exception:
        return []


STARTUP_TWITTER_QUERIES = [
    "I wish someone would build -filter:retweets",
    "pain point startup idea -filter:retweets",
    "no tool exists for -filter:retweets",
    "why is there no app that -filter:retweets",
    "looking for a SaaS that -filter:retweets",
    "frustrated with current tools -filter:retweets",
]


async def scrape_twitter_signals_async(
    user_queries: list[str],
    max_per_query: int = 15,
) -> list[dict]:
    """
    Scrape Twitter/X for startup pain signals.
    Returns deduplicated tweets with exact URLs.
    """
    seen_ids = set()
    all_results = []

    async with httpx.AsyncClient(
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
        follow_redirects=True,
    ) as client:

        # First: check which nitter instances are alive
        live_instances = []
        for inst in NITTER_INSTANCES:
            try:
                r = await client.get(f"{inst}/", timeout=5.0)
                if r.status_code == 200:
                    live_instances.append(inst)
                    if len(live_instances) >= 2:
                        break
            except Exception:
                continue

        if not live_instances:
            print("[Twitter] No live Nitter instances found. Skipping Twitter scrape.")
            return []

        # Build queries: user topics + pain signal templates
        all_queries = []
        for uq in user_queries:
            for template in STARTUP_TWITTER_QUERIES[:3]:
                all_queries.append(f"{uq} {template}")
            all_queries.append(uq)

        # Scrape via Nitter RSS
        tasks = []
        for query in all_queries:
            for inst in live_instances:
                tasks.append(_try_nitter_rss(client, query, inst, max_per_query))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for batch in results:
            if isinstance(batch, Exception):
                continue
            for tweet in batch:
                uid = tweet.get("tweet_id") or tweet.get("source_url")
                if uid and uid not in seen_ids:
                    seen_ids.add(uid)
                    all_results.append(tweet)

    print(f"[Twitter] Found {len(all_results)} unique tweets")
    return all_results


def scrape_twitter_signals(
    user_queries: list[str],
    max_per_query: int = 15,
) -> list[dict]:
    """Sync wrapper."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    scrape_twitter_signals_async(user_queries, max_per_query)
                )
                return future.result(timeout=45)
        else:
            return loop.run_until_complete(
                scrape_twitter_signals_async(user_queries, max_per_query)
            )
    except Exception as e:
        print(f"[Twitter] Scrape failed: {e}")
        return []
