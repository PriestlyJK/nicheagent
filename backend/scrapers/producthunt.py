import httpx
import time

PH_GRAPHQL = "https://api.producthunt.com/v2/api/graphql"

# Register free API key at: https://www.producthunt.com/v2/oauth/applications
PH_TOKEN = None   # set via env if available — falls back to public scrape

QUERY = """
query SearchPosts($query: String!, $after: String) {
  posts(order: VOTES, topic: $query, after: $after) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        commentsCount
        createdAt
        website
        topics { edges { node { name } } }
        makers { edges { node { name profileUrl } } }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
"""

def scrape_launches(query: str, days_back: int = 30, limit: int = 20) -> list[dict]:
    """Fetch recent Product Hunt launches for a topic."""
    if not PH_TOKEN:
        return _scrape_public_fallback(query, limit)

    headers = {
        "Authorization": f"Bearer {PH_TOKEN}",
        "Content-Type": "application/json",
    }
    results = []
    try:
        resp = httpx.post(
            PH_GRAPHQL,
            json={"query": QUERY, "variables": {"query": query}},
            headers=headers,
            timeout=15,
        )
        data = resp.json()
        posts = data.get("data", {}).get("posts", {}).get("edges", [])

        for edge in posts[:limit]:
            node = edge["node"]
            results.append({
                "source": "producthunt",
                "source_url": node.get("url"),
                "title": node.get("name"),
                "content": node.get("tagline", "") + " — " + (node.get("description") or ""),
                "metadata": {
                    "votes": node.get("votesCount", 0),
                    "comments": node.get("commentsCount", 0),
                    "website": node.get("website"),
                    "created_at": node.get("createdAt"),
                    "makers": [
                        m["node"]["name"] for m in node.get("makers", {}).get("edges", [])
                    ],
                    "topics": [
                        t["node"]["name"] for t in node.get("topics", {}).get("edges", [])
                    ],
                },
            })
    except Exception as e:
        print(f"[ProductHunt] GraphQL error: {e}")

    return results


def _scrape_public_fallback(query: str, limit: int = 15) -> list[dict]:
    """Public search fallback when no API token is available."""
    results = []
    try:
        url = f"https://www.producthunt.com/search?q={query.replace(' ', '+')}"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; NicheAgent/1.0)"}
        resp = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)

        # Basic extraction from meta tags — enough for signal detection
        import re
        titles = re.findall(r'"name":"([^"]{10,80})"', resp.text)[:limit]
        for title in titles:
            results.append({
                "source": "producthunt",
                "source_url": url,
                "title": title,
                "content": "",
                "metadata": {"query": query},
            })
        time.sleep(1)
    except Exception as e:
        print(f"[ProductHunt] Fallback error: {e}")
    return results
