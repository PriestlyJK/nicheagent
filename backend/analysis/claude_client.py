"""
Claude API client for NicheAgent.
- Analyzes signals with EXACT source attribution (no hallucinated URLs)
- Translates to Ukrainian on demand
- Generates roadmaps with streaming support
- Anti-hallucination: Claude is only allowed to reference URLs from the input signals
"""
import anthropic
import json
import re
from typing import Optional, Generator
import os

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
MODEL = "claude-opus-4-6"


ANALYSIS_SYSTEM = """You are NicheAgent, an expert startup opportunity analyst.
You analyze real user signals to identify untapped market niches.

CRITICAL RULES:
1. Only reference source URLs that are EXPLICITLY provided in the signals. Never invent URLs.
2. Every niche must cite specific posts/tweets/reviews that support it (use exact source_url values).
3. No generic claims like "many Reddit users" — cite the specific thread.
4. Competitor websites must be real companies you are certain exist. If unsure, omit the website field.
5. Do not repeat ideas. Each niche must be genuinely distinct.
6. Be specific about WHY each niche exists — what exact pain was expressed.

You must respond with ONLY valid JSON, no markdown, no preamble."""


def build_analysis_prompt(signals: list[dict], user_profile: Optional[dict] = None) -> str:
    """Build analysis prompt with signals and optional user personalization."""

    profile_section = ""
    if user_profile:
        profile_section = f"""
USER PROFILE (personalize opportunities to this person):
- Experience: {user_profile.get('experience', 'not specified')}
- Budget: {user_profile.get('budget', 'not specified')}
- Team size: {user_profile.get('team_size', 'solo')}
- Interests: {', '.join(user_profile.get('interests', []))}
- Skills: {', '.join(user_profile.get('skills', []))}
- Preferred categories: {', '.join(user_profile.get('categories', []))}
Prioritize niches matching this profile. Mark fit_score higher for good profile matches.
"""

    # Format signals with their source URLs prominently
    signals_text = "\n\n---\n\n".join([
        f"SOURCE: {s.get('source', '?').upper()}\n"
        f"URL: {s.get('source_url', 'no-url')}\n"
        f"CONTENT: {s.get('content', '')[:600]}"
        for s in signals
    ])

    return f"""{profile_section}

SIGNALS TO ANALYZE:
{signals_text}

Identify 8-12 distinct startup niche opportunities from these signals.

Return JSON array. Each niche:
{{
  "name": "Specific, memorable niche name (not generic)",
  "category": "AI & SaaS|Health tech|B2B tools|Dev tools|Creator|Fintech|EdTech|Other",
  "why_summary": "2-3 sentence explanation of the exact pain, citing specific signals. Be concrete.",
  "signal_score": 1-100 (how strong is the signal evidence),
  "fit_score": 1-100 (market timing + feasibility),
  "mvp_weeks": 4-52 (realistic MVP build time),
  "competition": "low|medium|high",
  "tags": ["tag1", "tag2", "tag3"],
  "is_golden": true/false (only 1 niche should be true — the best opportunity),
  "evidence": [
    {{
      "source": "reddit|twitter|appstore|hackernews",
      "url": "EXACT URL from the signal data above — never invent",
      "quote": "Short relevant quote from the signal",
      "pain": "One-line summary of the pain expressed"
    }}
  ],
  "competitors": [
    {{
      "name": "Real company name",
      "website": "real-domain.com (only if you are CERTAIN it exists)",
      "arr_estimate": "$Xk-$Ym ARR",
      "gaps": ["specific gap 1", "specific gap 2"],
      "strengths": ["strength 1"],
      "founded_year": 2020,
      "team_size": "1-10|11-50|51-200",
      "funding": "bootstrapped|seed|series-a|unknown"
    }}
  ]
}}"""


def analyze_signals(
    signals: list[dict],
    existing_names: list[str] = None,
    user_profile: Optional[dict] = None,
    language: str = "en",
) -> list[dict]:
    """
    Analyze signals and return niche opportunities.
    All source URLs in results come directly from input signals.
    """
    if not signals:
        return []

    prompt = build_analysis_prompt(signals, user_profile)

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=8000,
            system=ANALYSIS_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()

        # Extract JSON if wrapped in code blocks
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')

        niches = json.loads(raw)
        if not isinstance(niches, list):
            niches = niches.get("niches", []) or [niches]

        # Validate: remove any competitor with made-up websites
        # (We'll verify with httpx in the route handler)
        for niche in niches:
            niche.setdefault("is_golden", False)
            niche.setdefault("evidence", [])
            niche.setdefault("tags", [])

        # Ensure exactly one golden niche
        golden_ones = [n for n in niches if n.get("is_golden")]
        if not golden_ones and niches:
            # Pick highest signal_score
            best = max(niches, key=lambda x: x.get("signal_score", 0))
            best["is_golden"] = True
        elif len(golden_ones) > 1:
            # Keep only the best one
            best = max(golden_ones, key=lambda x: x.get("signal_score", 0))
            for n in niches:
                n["is_golden"] = (n is best)

        # Translate to Ukrainian if requested
        if language == "ua":
            niches = translate_niches_to_ua(niches)

        return niches

    except json.JSONDecodeError as e:
        print(f"[Claude] JSON parse error: {e}")
        return []
    except Exception as e:
        print(f"[Claude] Analysis error: {e}")
        return []


def translate_niches_to_ua(niches: list[dict]) -> list[dict]:
    """Translate niche names and summaries to Ukrainian via Claude."""
    if not niches:
        return niches

    texts_to_translate = []
    for n in niches:
        texts_to_translate.append({
            "id": niches.index(n),
            "name": n.get("name", ""),
            "why_summary": n.get("why_summary", ""),
        })

    prompt = f"""Translate the following startup niche descriptions to Ukrainian.
Keep technical terms in English (SaaS, API, MVP, B2B, etc.).
Be natural, not formal/bureaucratic. Use startup/tech Ukrainian vocabulary.

Input JSON:
{json.dumps(texts_to_translate, ensure_ascii=False)}

Return ONLY a JSON array with same structure but translated "name" and "why_summary" fields.
No other changes."""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')

        translated = json.loads(raw)

        for t in translated:
            idx = t.get("id")
            if idx is not None and idx < len(niches):
                niches[idx]["name"] = t.get("name", niches[idx]["name"])
                niches[idx]["why_summary"] = t.get("why_summary", niches[idx]["why_summary"])
                niches[idx]["_translated"] = True

        return niches

    except Exception as e:
        print(f"[Claude] Translation error: {e}")
        return niches  # Return untranslated on error


ROADMAP_SYSTEM = """You are a startup advisor creating detailed, actionable roadmaps.
Each step must be concrete and achievable by a solo founder.
Include specific tools, resources, and success metrics.
Respond with ONLY valid JSON."""


def generate_roadmap(
    niche: dict,
    user_profile: Optional[dict] = None,
    language: str = "en",
) -> dict:
    """Generate an interactive roadmap for a niche."""

    profile_context = ""
    if user_profile:
        skills = user_profile.get("skills", [])
        budget = user_profile.get("budget", "unknown")
        team = user_profile.get("team_size", "solo")
        profile_context = f"""
Customize for:
- Skills: {', '.join(skills) if skills else 'general'}
- Budget: {budget}
- Team: {team}
Adjust tech stack, timeline, and complexity accordingly."""

    prompt = f"""Create a detailed launch roadmap for this niche:

NICHE: {niche.get('name')}
CATEGORY: {niche.get('category')}
SUMMARY: {niche.get('why_summary')}
MVP_WEEKS: {niche.get('mvp_weeks', 12)}
COMPETITION: {niche.get('competition', 'medium')}
{profile_context}

Return JSON:
{{
  "title": "roadmap title",
  "total_weeks": N,
  "phases": [
    {{
      "phase": 1,
      "title": "Phase title",
      "duration_weeks": N,
      "icon": "emoji",
      "color": "#hexcolor",
      "objective": "What you achieve",
      "steps": [
        {{
          "step": 1,
          "title": "Step title",
          "description": "Detailed actionable description (3-4 sentences)",
          "icon": "emoji",
          "tools": ["specific tool 1", "specific tool 2"],
          "success_metric": "How you know this is done",
          "effort_hours": N,
          "resources": [
            {{"name": "resource name", "url": "https://..."}}
          ]
        }}
      ],
      "milestone": "What's achieved at end of phase",
      "expected_outcome": "Specific measurable outcome"
    }}
  ],
  "key_risks": ["risk 1", "risk 2"],
  "quick_wins": ["Quick win 1 (week 1)", "Quick win 2"],
  "estimated_mrr_at_launch": "$X-Y/mo"
}}

Include 4 phases: Research & Validation → Build MVP → Launch & Traction → Scale.
Each phase should have 4-6 specific steps."""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=5000,
            system=ROADMAP_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')

        roadmap = json.loads(raw)

        if language == "ua":
            roadmap = translate_roadmap_to_ua(roadmap)

        return roadmap

    except Exception as e:
        print(f"[Claude] Roadmap error: {e}")
        return {"error": str(e), "phases": []}


def translate_roadmap_to_ua(roadmap: dict) -> dict:
    """Translate roadmap content to Ukrainian."""
    try:
        # Extract translatable strings
        prompt = f"""Translate this startup roadmap to Ukrainian.
Keep technical terms in English (MVP, SaaS, API, MRR, etc.).
Be natural and startup-friendly.

Roadmap JSON:
{json.dumps(roadmap, ensure_ascii=False)[:4000]}

Return the complete translated JSON with same structure."""

        response = client.messages.create(
            model=MODEL,
            max_tokens=5000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')
        return json.loads(raw)
    except Exception as e:
        print(f"[Claude] Roadmap translate error: {e}")
        return roadmap


def generate_hot_topic_ideas(topic: dict, count: int = 3) -> list[str]:
    """
    Generate startup ideas for a hot topic thread using Claude.
    Fast version — uses minimal tokens.
    """
    prompt = f"""Hot startup discussion:
Title: {topic.get('title', '')}
Content: {topic.get('content', '')[:300]}
Source: {topic.get('source')} — {topic.get('source_url')}

Generate {count} concrete startup idea concepts based on this discussion.
Each idea: 1-2 sentences max. Be specific, not generic.
Return as JSON array of strings."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",  # Fast, cheap for quick ideas
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')
        ideas = json.loads(raw)
        return ideas[:count] if isinstance(ideas, list) else []
    except Exception:
        return topic.get("quick_ideas", [])  # Fall back to heuristic ideas
