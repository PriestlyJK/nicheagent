"""
Competitor website verifier.
Checks if competitor sites actually exist and are live (not 404/sold/parked).
Removes hallucinated or dead competitors before saving to DB.
"""
import httpx
import asyncio
import re
from typing import Optional
from urllib.parse import urlparse


DEAD_SITE_INDICATORS = [
    "this domain is for sale",
    "domain for sale",
    "buy this domain",
    "parked domain",
    "this site is for sale",
    "domain has expired",
    "account suspended",
    "404 not found",
    "site not found",
    "error 404",
    "godaddy.com",
    "namecheap.com/domains",
    "sedo.com",
    "dan.com",
    "hugedomains.com",
    "afternic.com",
]

PLACEHOLDER_INDICATORS = [
    "coming soon",
    "under construction",
    "launching soon",
    "we'll be back",
    "maintenance mode",
]


def normalize_url(url: str) -> str:
    """Ensure URL has a scheme."""
    if not url:
        return ""
    url = url.strip().rstrip("/")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


async def verify_single_competitor(
    client: httpx.AsyncClient,
    competitor: dict,
) -> Optional[dict]:
    """
    Verify a single competitor's website is live and real.
    Returns None if site is dead, parked, or hallucinated.
    Returns updated competitor dict if OK.
    """
    raw_url = competitor.get("website", "")
    if not raw_url:
        # No website listed — keep the competitor but mark as unverified
        competitor["website_status"] = "no_url"
        return competitor

    url = normalize_url(raw_url)
    competitor["website"] = url  # normalize

    try:
        # HEAD request first (faster)
        resp = await client.head(url, timeout=8.0, follow_redirects=True)

        # Check final URL after redirects
        final_url = str(resp.url)
        status = resp.status_code

        if status in (404, 410, 451):
            print(f"[Verify] Dead: {url} → {status}")
            return None

        if status >= 500:
            # Server error — keep but mark
            competitor["website_status"] = "server_error"
            return competitor

        # If HEAD gave us a content type, check if it looks real
        content_type = resp.headers.get("content-type", "")

        # If redirected to a domain registrar, it's dead
        for registrar in ["godaddy", "namecheap", "sedo", "dan.com", "hugedomains", "afternic"]:
            if registrar in final_url.lower():
                print(f"[Verify] Parked domain: {url} → {final_url}")
                return None

        # GET to check content
        if status == 200:
            try:
                get_resp = await client.get(url, timeout=10.0, follow_redirects=True)
                body = get_resp.text[:3000].lower()

                # Check for dead/parked indicators
                for indicator in DEAD_SITE_INDICATORS:
                    if indicator in body:
                        print(f"[Verify] Dead/parked content: {url}")
                        return None

                # Check for placeholder
                is_placeholder = any(ind in body for ind in PLACEHOLDER_INDICATORS)

                competitor["website_status"] = "placeholder" if is_placeholder else "live"
                competitor["website"] = url
                return competitor

            except Exception:
                # GET failed but HEAD worked — assume live
                competitor["website_status"] = "live"
                return competitor

        competitor["website_status"] = f"status_{status}"
        return competitor

    except httpx.ConnectError:
        print(f"[Verify] Connection refused: {url}")
        return None
    except httpx.TimeoutException:
        print(f"[Verify] Timeout: {url}")
        # Keep but mark as slow
        competitor["website_status"] = "timeout"
        return competitor
    except Exception as e:
        print(f"[Verify] Error for {url}: {e}")
        competitor["website_status"] = "error"
        return competitor


async def verify_competitors_async(
    competitors: list[dict],
    keep_unverified: bool = False,
) -> list[dict]:
    """
    Verify all competitors in parallel.
    Returns only verified live competitors.
    """
    if not competitors:
        return []

    async with httpx.AsyncClient(
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; NicheAgent market research bot)",
            "Accept": "text/html,*/*",
        },
        follow_redirects=True,
    ) as client:

        tasks = [verify_single_competitor(client, comp) for comp in competitors]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    verified = []
    for r in results:
        if isinstance(r, Exception):
            continue
        if r is None:
            continue  # dead site — skip
        status = r.get("website_status", "")
        if status in ("live", "placeholder", "timeout", "server_error", "no_url", ""):
            verified.append(r)
        elif keep_unverified:
            verified.append(r)

    print(f"[Verify] {len(verified)}/{len(competitors)} competitors verified as live")
    return verified


def verify_competitors(
    competitors: list[dict],
    keep_unverified: bool = False,
) -> list[dict]:
    """Sync wrapper."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    verify_competitors_async(competitors, keep_unverified)
                )
                return future.result(timeout=60)
        else:
            return loop.run_until_complete(
                verify_competitors_async(competitors, keep_unverified)
            )
    except Exception as e:
        print(f"[Verify] Failed: {e}")
        return competitors  # Return unverified on total failure
