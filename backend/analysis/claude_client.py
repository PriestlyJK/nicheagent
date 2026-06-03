import anthropic
import json
from db.client import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
MODEL = "claude-opus-4-6"

SYSTEM_PROMPT = """You are an elite market intelligence analyst and venture scout with deep expertise in identifying startup opportunities before they become obvious.

Your methodology:
1. PATTERN DETECTION — You identify: multiple entrants (3+ new products in same niche = validation), creative velocity (surge in ad creatives = commercial demand proven), pain point clustering (same complaint across multiple communities = real problem), paywall shifts (incumbent raises prices = market gap opens), funding clustering (multiple seed rounds in adjacent space = smart money validation)

2. SPECIFICITY REQUIREMENT — Every claim must include real numbers. Never say "growing trend" — say "+41% in 90 days". Never say "multiple competitors" — name them with estimated ARR.

3. UNIQUENESS ENFORCEMENT — No two niches can address the same core problem. If you find pricing frustration across 3 tools, pick the MOST SPECIFIC underserved subsegment, not the generic category.

4. ANTI-HYPE FILTER — Reject niches that: have a well-funded dominant player (>$10M raised with PMF), are pure feature requests for existing tools, require enterprise sales cycles to validate, or need regulatory approval.

5. TIMING SIGNAL — Score timing: is this niche in emerging (0-6 months of signal), growing (6-18 months), or maturing (18+ months) phase? Emerging + growing = highest priority."""


def analyze_signals(signals: list[dict], existing_niches: list[str] = None) -> list[dict]:
    signals_json = json.dumps(signals[:50], ensure_ascii=False)
    existing = json.dumps(existing_niches or [])

    prompt = f"""Analyze these market signals and identify exactly 5 startup opportunities.

RAW SIGNALS FROM MULTIPLE SOURCES:
{signals_json}

ALREADY IN KNOWLEDGE BASE — DO NOT REPEAT THESE:
{existing}

REQUIREMENTS FOR EACH OPPORTUNITY:
1. name: Specific niche name. Not "AI tools" but "AI-powered invoice reconciliation for freelance accountants". Must be actionable and specific.

2. category: One of: ai_saas | health | b2b | creator | ecommerce | fintech | devtools | other

3. why_summary: EXACTLY 2 sentences. Sentence 1: what specific data proves demand (with numbers). Sentence 2: why no dominant solution exists yet (with evidence).

4. signal_score: 0-100. Formula: (post_volume * recency_weight * specificity_score * pain_intensity). Be precise, not round numbers.

5. fit_score: 0-100. Based on: API availability (can you build without proprietary data?), team size needed, regulatory risk, technical complexity. Lower = harder.

6. mvp_weeks: Integer. Realistic for 1-2 person team. Must account for: validation (1w), core build (2-4w), testing (1w), launch prep (1w).

7. competition: "low" | "medium" | "high". Low = no funded player with >$1M ARR. Medium = 1-2 players under $5M ARR. High = established players with PMF.

8. tags: Array of exactly 3 tags chosen from: ["pain cluster", "multiple entrants", "creative velocity", "funding cluster", "paywall shift", "review cluster", "trend acceleration", "whitespace", "low competition", "first mover"]

9. pattern_type: Primary pattern detected. One of: "multiple_entrants" | "pain_clustering" | "creative_velocity" | "paywall_shift" | "funding_cluster" | "whitespace"

10. timing: "emerging" | "growing" | "maturing"

11. competitors: Array of 2-3 REAL companies. Each with:
    - name: Company name
    - website: Real domain
    - arr_estimate: e.g. "~$800k ARR" or "pre-revenue"
    - funding: e.g. "$4M seed" or "bootstrapped"
    - founded_year: integer
    - key_weakness: ONE specific, exploitable gap (not generic)
    - ph_url: Product Hunt URL if exists

12. adjacent_niches: Array of 2 related opportunities. Each with:
    - name: Specific adjacent niche
    - demand_signal: One sentence with numbers
    - why_gap_exists: One sentence on why no product
    - heat: "hot" | "rising" | "stable"

13. sources_breakdown: Object with keys matching which sources contributed signals:
    - reddit_posts: count of Reddit posts that informed this
    - trend_signal: percentage change string or null
    - ph_launches: count of PH launches or null
    - app_reviews: count of app reviews or null

Return ONLY a valid JSON array of exactly 5 objects. No markdown, no explanation, no preamble.
Each object must have ALL fields above.
CRITICAL: Every niche must be genuinely different — different problem, different market, different user."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw.strip())


def generate_roadmap(niche_name: str, budget: str, team: str, timeline_weeks: int) -> dict:
    prompt = f"""Create a detailed, actionable startup roadmap for: "{niche_name}"

Parameters:
- Budget: {budget} (bootstrap = <$500 total, small = $500-5k, funded = $5k+)
- Team: {team} (solo = 1 person, two = 2 people, small = 3-5 people)
- Timeline: {timeline_weeks} weeks to MVP

Return JSON with this exact structure:
{{
  "phases": [
    {{
      "week_label": "Week 1-2",
      "title": "Phase title",
      "why": "Why this phase is critical — specific reasoning",
      "tasks": [
        "Specific actionable task with details",
        "Another task",
        "Another task",
        "Another task"
      ],
      "tools": [
        {{
          "name": "Tool name",
          "cost": "$X/mo or free",
          "url": "https://real-url.com",
          "why": "Specific reason to use this tool for this phase"
        }}
      ],
      "risks": [
        "Specific risk and how to mitigate it"
      ],
      "success_metric": "How you know this phase is done"
    }}
  ],
  "total_monthly_cost": "$XX/mo",
  "break_even_customers": N,
  "pricing_recommendation": "$X/mo — reasoning",
  "first_customer_channel": "Most specific acquisition channel with tactics"
}}

Use ONLY real tools with real current pricing (2025).
Be hyper-specific — no generic advice.
Return ONLY valid JSON."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=6000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    # Strip markdown fences
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            try:
                return json.loads(part)
            except:
                continue
    # Try direct parse
    return json.loads(raw.strip())


def explain_score(niche_name: str, signals: list[dict], score_type: str) -> str:
    prompt = f"""For the niche "{niche_name}", explain in exactly 3 bullet points why the {score_type} score is what it is.
Each bullet: start with a specific number or fact from these signals: {json.dumps(signals[:5])}
Format: • [fact] → [implication]
Return plain text only. No headers."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()
