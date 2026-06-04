"""
Claude API client for NicheAgent.
Simple sync calls, no async complications.
"""
import anthropic
import json
import re
import os
from typing import Optional

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
MODEL = "claude-opus-4-6"


def analyze_signals(
    signals: list[dict],
    existing_names: list[str] = None,
    user_profile: Optional[dict] = None,
    language: str = "en",
) -> list[dict]:
    """
    Analyze signals and return niche opportunities.
    Compatible with original signature: analyze_signals(signals, existing_names)
    """
    if not signals:
        return []

    existing_names = existing_names or []

    # Format signals for Claude
    signals_text = "\n\n---\n\n".join([
        f"SOURCE: {s.get('source', '?').upper()}\n"
        f"URL: {s.get('source_url', 'no-url')}\n"
        f"CONTENT: {s.get('content', '')[:500]}"
        for s in signals[:40]
    ])

    existing_note = ""
    if existing_names:
        existing_note = f"\nALREADY IN DB (skip these): {', '.join(existing_names[:10])}"

    prompt = f"""You are a startup niche analyst. Analyze these real user signals and find startup opportunities.
{existing_note}

SIGNALS:
{signals_text}

Find 5-7 distinct startup niches. Return ONLY valid JSON array, no markdown:
[
  {{
    "name": "Specific niche name",
    "category": "AI & SaaS|Health tech|B2B tools|Dev tools|Creator|Other",
    "why_summary": "2-3 sentences explaining the pain and opportunity",
    "signal_score": 1-100,
    "fit_score": 1-100,
    "mvp_weeks": 4-16,
    "competition": "low|medium|high",
    "tags": ["tag1", "tag2", "tag3"],
    "competitors": [
      {{
        "name": "Real company name",
        "website": "domain.com",
        "arr_estimate": "$XM ARR",
        "gaps": ["gap1", "gap2"],
        "strengths": ["strength1"],
        "funding": "bootstrapped|seed|series-a|unknown",
        "founded_year": 2020
      }}
    ]
  }}
]"""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=16000,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()

        # Clean markdown if present
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')

        # Find JSON array
        start = raw.find('[')
        end = raw.rfind(']') + 1
        if start >= 0 and end > start:
            raw = raw[start:end]

        niches = json.loads(raw)
        if not isinstance(niches, list):
            niches = [niches]

        return niches

    except json.JSONDecodeError as e:
        print(f"[Claude] JSON parse error: {e}")
        print(f"[Claude] Raw response (first 500): {raw[:500] if 'raw' in locals() else 'N/A'}")
        return []
    except Exception as e:
        print(f"[Claude] Analysis error: {e}")
        return []


def generate_roadmap(
    niche_name: str,
    budget: str = "bootstrap",
    team: str = "solo",
    timeline_weeks: int = 5,
) -> dict:
    """Generate a startup roadmap for a niche."""

    prompt = f"""Create a startup launch roadmap for: {niche_name}
Budget: {budget} | Team: {team} | Timeline: {timeline_weeks} weeks

Return ONLY valid JSON:
{{
  "niche": "{niche_name}",
  "total_weeks": {timeline_weeks},
  "total_monthly_cost": "$X-Y/mo",
  "break_even_customers": N,
  "pricing_recommendation": "$X/mo — explanation",
  "first_customer_channel": "specific channel and why",
  "tech_stack": "specific technologies",
  "phases": [
    {{
      "week_label": "Week 1-2",
      "title": "Phase title",
      "why": "Why this phase matters",
      "tasks": ["specific task 1", "specific task 2", "specific task 3"],
      "tools": [
        {{"name": "Tool name", "url": "https://...", "cost": "$X/mo or free"}}
      ],
      "success_metric": "How you know this phase is done",
      "risks": ["main risk"]
    }}
  ]
}}

Create 4 phases: Validate → Build → Launch → Grow"""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')

        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start >= 0 and end > start:
            raw = raw[start:end]

        return json.loads(raw)

    except Exception as e:
        print(f"[Claude] Roadmap error: {e}")
        return {"error": str(e), "phases": []}
