"""Simple wrapper for Google AI Studio (Gemini) rewriting agent."""

import os
import requests
from typing import Dict

# Official Gemini API base and model version
#  use v1 endpoint for broader compatibility
# API_BASE = "https://generativelanguage.googleapis.com/v1/models"
# you can change this to a model available to your API key
# common free-tier model: text-bison-001
# MODEL = "text-bison-001"
# API_KEY = os.getenv("GOOGLE_AI_KEY")
# PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
MODEL = "gemini-1.5-flash"          # free tier model — change to gemini-1.5-pro for higher quality
API_KEY = os.getenv("GOOGLE_AI_KEY")

AGENTIC_PROMPT =  """\
You are a senior SEO journalist. Given a raw news summary, produce:
Maintain a professional tone. Ensure 100% \originality.
1. SEO_HEADLINE: A compelling, keyword-rich headline (max 70 chars).
2. META: A Google-ready meta description (max 155 chars).
3. TAGS: 5 comma-separated topic tags (lowercase, no #).
4. BODY: A 300-word rewritten article in professional journalistic style.

Format your response EXACTLY like this (no markdown, no extra lines):
SEO_HEADLINE: <headline>
META: <meta description>
TAGS: <tag1, tag2, tag3, tag4, tag5>
BODY:
<full article body here>
"""


def fetch_image(query: str) -> str:
    """Fetch a relevant image URL from Pexels."""
    if not PEXELS_API_KEY:
        return ""
    
    try:
        resp = requests.get(
            "https://api.pexels.com/v1/search",
            headers={"Authorization": PEXELS_API_KEY},
            params={"query": query, "per_page": 1},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("photos"):
            return data["photos"][0]["src"]["large"]
    except:
        pass
    return ""


def rewrite_summary(summary: str, source: str) -> Dict[str, str]:
    """Send summary to Gemini and return enriched article dict."""
    if not API_KEY:
        raise RuntimeError("GOOGLE_AI_KEY not set in environment")

    prompt = f"{AGENTIC_PROMPT}\n\nRAW SUMMARY:\n{summary}\n\nSOURCE: {source}"

    url = f"{API_BASE}/{MODEL}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 800},
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code == 404:
            # Try alternate generateText endpoint
            url2 = f"{API_BASE}/{MODEL}:generateText?key={API_KEY}"
            resp = requests.post(url2, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.RequestException as e:
        body = getattr(e.response, 'text', None) if hasattr(e, 'response') else None
        # log failure and return simple fallback
        print(f"AI request failed ({e}); body={body}")
        return {
            "headline": summary[:70],
            "body": summary,
            "tags": [],
            "meta": summary[:155],
        }

   # Parse structured output
    headline, meta, tags_str, body_lines = "", "", "", []
    current = None
    for line in text.splitlines():
        low = line.lower()
        if low.startswith("seo_headline:"):
            headline = line.split(":", 1)[1].strip()
            current = "headline"
        elif low.startswith("meta:"):
            meta = line.split(":", 1)[1].strip()
            current = "meta"
        elif low.startswith("tags:"):
            tags_str = line.split(":", 1)[1].strip()
            current = "tags"
        elif low.startswith("body:"):
            current = "body"
            rest = line.split(":", 1)[1].strip()
            if rest:
                body_lines.append(rest)
        elif current == "body":
            body_lines.append(line)

    tags = [t.strip() for t in tags_str.split(",") if t.strip()]
    body = "\n".join(body_lines).strip()

    # Fetch image using first tag or headline
    image_query = tags[0] if tags else headline.split()[:3]
    image_url = fetch_image(image_query if isinstance(image_query, str) else " ".join(image_query))

    return {"headline": headline, "body": body, "tags": tags, "meta": meta, "image_url": image_url,}



if __name__ == "__main__":
    # quick manual test
    sample = "NASA launches new rover to Mars, aims to collect rock samples."
    print(rewrite_summary(sample, "https://nasa.gov/news"))


#""" (
#   "Act as a senior journalist. Rewrite the following news summary into a 400-word article. "
#    "Maintain a professional tone. Ensure 100% originality. Include a catchy headline, "
#   "meta-description, and 5 relevant tags. "
#   "Format your response with clear sections:\n"
#   "Headline: <the headline>\n"
#    "Meta: <meta description>\n"
#   "Tags: <comma-separated tags>\n"
#   "Body: <the full article body>"
#) """