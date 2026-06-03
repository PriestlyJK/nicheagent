import httpx
import time

def search_apps(query: str, country: str = "us", limit: int = 10) -> list[dict]:
    """Search App Store for apps matching query, return top results."""
    url = "https://itunes.apple.com/search"
    params = {
        "term": query,
        "country": country,
        "media": "software",
        "limit": limit,
    }
    apps = []
    try:
        resp = httpx.get(url, params=params, timeout=10)
        data = resp.json()
        for app in data.get("results", []):
            apps.append({
                "app_id": str(app.get("trackId", "")),
                "name": app.get("trackName", ""),
                "rating": app.get("averageUserRating", 0),
                "rating_count": app.get("userRatingCount", 0),
                "price": app.get("price", 0),
                "description": app.get("description", "")[:500],
                "url": app.get("trackViewUrl", ""),
            })
        time.sleep(1)
    except Exception as e:
        print(f"[AppStore] Search error for '{query}': {e}")
    return apps


def get_reviews(app_id: str, country: str = "us", limit: int = 50) -> list[dict]:
    """Fetch recent App Store reviews for a specific app ID."""
    url = f"https://itunes.apple.com/{country}/rss/customerreviews/page=1/id={app_id}/sortBy=mostRecent/json"
    reviews = []
    try:
        resp = httpx.get(url, timeout=10)
        data = resp.json()
        entries = data.get("feed", {}).get("entry", [])

        for entry in entries[:limit]:
            if not isinstance(entry, dict):
                continue
            reviews.append({
                "source": "appstore",
                "source_url": f"https://apps.apple.com/{country}/app/id{app_id}",
                "title": entry.get("title", {}).get("label", ""),
                "content": entry.get("content", {}).get("label", "")[:600],
                "metadata": {
                    "app_id": app_id,
                    "rating": int(entry.get("im:rating", {}).get("label", 0)),
                    "version": entry.get("im:version", {}).get("label", ""),
                    "author": entry.get("author", {}).get("name", {}).get("label", ""),
                    "updated": entry.get("updated", {}).get("label", ""),
                },
            })
        time.sleep(1)
    except Exception as e:
        print(f"[AppStore] Reviews error for app {app_id}: {e}")
    return reviews


def scrape_niche_reviews(query: str) -> list[dict]:
    """Full pipeline: search apps → fetch reviews → return all signals."""
    apps = search_apps(query, limit=5)
    all_signals = []
    for app in apps:
        if app["rating_count"] > 100:    # only apps with meaningful review volume
            reviews = get_reviews(app["app_id"])
            all_signals.extend(reviews)
    return all_signals
