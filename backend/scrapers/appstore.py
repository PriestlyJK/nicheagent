"""
App Store scraper via iTunes Search API (public, no key needed).
Returns apps with EXACT URLs + top 1-star review content for pain signals.
"""
import httpx
import asyncio
import re

ITUNES_SEARCH = "https://itunes.apple.com/search"
ITUNES_LOOKUP = "https://itunes.apple.com/lookup"
RSS_REVIEWS = "https://itunes.apple.com/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"


async def _search_apps(
    client: httpx.AsyncClient,
    query: str,
    country: str = "us",
    limit: int = 10,
) -> list[dict]:
    """Search App Store for apps matching query."""
    try:
        resp = await client.get(
            ITUNES_SEARCH,
            params={
                "term": query,
                "entity": "software",
                "country": country,
                "limit": limit,
                "lang": "en_us",
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        results = resp.json().get("results", [])
        return results
    except Exception as e:
        print(f"[AppStore] Search error for '{query}': {e}")
        return []


async def _fetch_reviews(
    client: httpx.AsyncClient,
    app_id: str,
    country: str = "us",
) -> list[dict]:
    """Fetch recent reviews for an app. Returns 1-star reviews as pain signals."""
    url = f"https://itunes.apple.com/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"
    try:
        resp = await client.get(url, timeout=10.0)
        resp.raise_for_status()
        feed = resp.json().get("feed", {})
        entries = feed.get("entry", [])

        # First entry is app metadata, skip it
        if entries and "im:name" not in str(entries[0].get("im:rating", {})):
            entries = entries[1:]

        pain_reviews = []
        for entry in entries:
            rating_raw = entry.get("im:rating", {})
            if isinstance(rating_raw, dict):
                rating = int(rating_raw.get("label", 5))
            else:
                rating = 5

            if rating > 2:
                continue

            title_raw = entry.get("title", {})
            title = title_raw.get("label", "") if isinstance(title_raw, dict) else ""
            content_raw = entry.get("content", {})
            content = content_raw.get("label", "") if isinstance(content_raw, dict) else ""
            author_raw = entry.get("author", {}).get("name", {})
            author = author_raw.get("label", "anonymous") if isinstance(author_raw, dict) else "anonymous"

            if not content or len(content) < 30:
                continue

            pain_reviews.append({
                "title": title,
                "content": content[:800],
                "rating": rating,
                "author": author,
            })

        return pain_reviews[:5]  # top 5 pain reviews

    except Exception as e:
        print(f"[AppStore] Reviews error for app {app_id}: {e}")
        return []


async def scrape_appstore_signals_async(
    queries: list[str],
    max_apps_per_query: int = 5,
) -> list[dict]:
    """
    Scrape App Store for pain signals in 1-star reviews.
    Returns signals with EXACT app URL + review content.
    """
    all_signals = []
    seen_app_ids = set()

    async with httpx.AsyncClient(
        headers={"User-Agent": "NicheAgent/1.0 research"},
        follow_redirects=True,
    ) as client:

        # First: search for apps
        search_tasks = [
            _search_apps(client, q, limit=max_apps_per_query)
            for q in queries
        ]
        search_results = await asyncio.gather(*search_tasks, return_exceptions=True)

        apps_to_review = []
        for batch in search_results:
            if isinstance(batch, Exception):
                continue
            for app in batch:
                app_id = str(app.get("trackId", ""))
                if not app_id or app_id in seen_app_ids:
                    continue
                seen_app_ids.add(app_id)
                apps_to_review.append(app)

        # Then: fetch reviews for each app
        review_tasks = [
            _fetch_reviews(client, str(app["trackId"]))
            for app in apps_to_review
        ]
        review_batches = await asyncio.gather(*review_tasks, return_exceptions=True)

        for app, reviews in zip(apps_to_review, review_batches):
            if isinstance(reviews, Exception):
                continue
            if not reviews:
                continue

            app_name = app.get("trackName", "Unknown App")
            app_id = str(app.get("trackId", ""))
            app_url = app.get("trackViewUrl", f"https://apps.apple.com/app/id{app_id}")
            developer = app.get("artistName", "Unknown Dev")
            rating = app.get("averageUserRating", 0)
            rating_count = app.get("userRatingCount", 0)
            category = app.get("primaryGenreName", "")
            price = app.get("price", 0)
            description = app.get("description", "")[:300]

            for review in reviews:
                signal_content = (
                    f"App: {app_name} (★{rating:.1f}, {rating_count:,} ratings)\n"
                    f"Category: {category} | Price: ${price}\n"
                    f"Developer: {developer}\n"
                    f"Review ({review['rating']}★) by {review['author']}: "
                    f"{review['title']}\n{review['content']}"
                )

                all_signals.append({
                    "source": "appstore",
                    "source_url": app_url,
                    "title": f"1-star review of {app_name}: {review['title']}",
                    "content": signal_content,
                    "app_name": app_name,
                    "app_id": app_id,
                    "developer": developer,
                    "category": category,
                    "rating": rating,
                    "price": price,
                    "review_rating": review["rating"],
                    "metadata": {
                        "app_name": app_name,
                        "app_url": app_url,
                        "developer": developer,
                        "rating": rating,
                        "rating_count": rating_count,
                    }
                })

    print(f"[AppStore] Found {len(all_signals)} pain signals from reviews")
    return all_signals


def scrape_appstore_signals(
    queries: list[str],
    max_apps_per_query: int = 5,
) -> list[dict]:
    """Sync wrapper."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    scrape_appstore_signals_async(queries, max_apps_per_query)
                )
                return future.result(timeout=60)
        else:
            return loop.run_until_complete(
                scrape_appstore_signals_async(queries, max_apps_per_query)
            )
    except Exception as e:
        print(f"[AppStore] Scrape failed: {e}")
        return []
