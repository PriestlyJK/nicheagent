import httpx
import time

META_ADS_URL = "https://www.facebook.com/ads/library/async/search_ads/"

def scrape_creative_count(query: str) -> dict:
    """
    Count active Meta ads for a query — proxy for commercial demand.
    Uses the public Meta Ads Library (no auth required).
    Returns count + sample ad titles.
    """
    params = {
        "q": query,
        "ad_type": "all",
        "active_status": "active",
        "countries[0]": "US",
        "media_type": "all",
        "search_type": "keyword_unordered",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://www.facebook.com/ads/library/",
    }
    result = {
        "source": "meta_ads",
        "source_url": f"https://www.facebook.com/ads/library/?q={query.replace(' ', '%20')}&active_status=active&ad_type=all&country=US",
        "title": f"Meta Ads Library: '{query}'",
        "content": "",
        "metadata": {
            "query": query,
            "ad_count": 0,
            "velocity_signal": "unknown",
        },
    }
    try:
        resp = httpx.get(
            META_ADS_URL,
            params=params,
            headers=headers,
            timeout=12,
            follow_redirects=True,
        )
        if resp.status_code == 200:
            import re
            # extract count from response
            count_match = re.search(r'"count":(\d+)', resp.text)
            if count_match:
                count = int(count_match.group(1))
                result["metadata"]["ad_count"] = count
                result["metadata"]["velocity_signal"] = (
                    "high" if count > 100 else
                    "medium" if count > 30 else
                    "low"
                )
                result["content"] = f"{count} active ads found for '{query}'"
        time.sleep(1.5)
    except Exception as e:
        print(f"[MetaAds] Error for '{query}': {e}")

    return result
