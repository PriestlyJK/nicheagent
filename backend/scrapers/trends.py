import time
from pytrends.request import TrendReq
from pytrends.exceptions import ResponseError

def get_trend_velocity(keywords: list[str], timeframe: str = "today 3-m") -> dict:
    """
    Returns % growth for each keyword over the timeframe.
    timeframe options: 'today 1-m', 'today 3-m', 'today 12-m'
    """
    pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
    results = {}

    # pytrends allows max 5 keywords per request
    for i in range(0, len(keywords), 5):
        batch = keywords[i:i+5]
        try:
            pytrends.build_payload(batch, timeframe=timeframe, geo="")
            time.sleep(2)   # avoid 429

            df = pytrends.interest_over_time()
            if df.empty:
                for kw in batch:
                    results[kw] = {"avg": 0, "trend": "unknown", "pct_change": 0}
                continue

            for kw in batch:
                if kw not in df.columns:
                    results[kw] = {"avg": 0, "trend": "unknown", "pct_change": 0}
                    continue

                series = df[kw].dropna()
                if len(series) < 4:
                    results[kw] = {"avg": 0, "trend": "unknown", "pct_change": 0}
                    continue

                avg = int(series.mean())
                first_half = series[:len(series)//2].mean()
                second_half = series[len(series)//2:].mean()

                if first_half > 0:
                    pct_change = int(((second_half - first_half) / first_half) * 100)
                else:
                    pct_change = 0

                trend = "rising" if pct_change > 15 else "falling" if pct_change < -15 else "stable"

                results[kw] = {
                    "avg": avg,
                    "trend": trend,
                    "pct_change": pct_change,
                    "peak": int(series.max()),
                }

        except ResponseError as e:
            print(f"[Trends] Rate limited, waiting 30s: {e}")
            time.sleep(30)
            for kw in batch:
                results[kw] = {"avg": 0, "trend": "unknown", "pct_change": 0}
        except Exception as e:
            print(f"[Trends] Error for batch {batch}: {e}")
            for kw in batch:
                results[kw] = {"avg": 0, "trend": "unknown", "pct_change": 0}

    return results


def get_related_queries(keyword: str) -> list[str]:
    """Get breakout/top related queries for a keyword."""
    pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
    try:
        pytrends.build_payload([keyword], timeframe="today 3-m")
        time.sleep(2)
        related = pytrends.related_queries()
        rising = related.get(keyword, {}).get("rising")
        if rising is not None and not rising.empty:
            return rising["query"].tolist()[:10]
    except Exception as e:
        print(f"[Trends] Related queries error for '{keyword}': {e}")
    return []
