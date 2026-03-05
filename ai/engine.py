"""Simple wrapper for Google AI Studio (Gemini) rewriting agent."""

import os
import requests
from typing import Dict

# Official Gemini API base and model version
# use v1 endpoint for broader compatibility
API_BASE = "https://generativelanguage.googleapis.com/v1/models"
# you can change this to a model available to your API key
# common free-tier model: text-bison-001
MODEL = "text-bison-001"
API_KEY = os.getenv("GOOGLE_AI_KEY")

AGENTIC_PROMPT = (
    "Act as a senior journalist. Rewrite the following news summary into a 400-word article. "
    "Maintain a professional tone. Ensure 100% originality. Include a catchy headline, "
    "meta-description, and 5 relevant tags. "
    "Format your response with clear sections:\n"
    "Headline: <the headline>\n"
    "Meta: <meta description>\n"
    "Tags: <comma-separated tags>\n"
    "Body: <the full article body>"
)


def rewrite_summary(summary: str, source: str) -> Dict[str, str]:
    """Send the summary to Gemini and return a dict with headline, body, tags, etc."""
    if not API_KEY:
        raise RuntimeError("GOOGLE_AI_KEY not set in environment")

    prompt = f"{AGENTIC_PROMPT}\n\nSummary:\n{summary}\n\nSource: {source}"

    # Call the real Gemini API. `generateContent` is newer, fallback to `generateText`.
    url = f"{API_BASE}/{MODEL}:generateContent?key={API_KEY}"
    headers = {"Content-Type": "application/json"}
    # payload structure for v1 models (text-bison, etc.)
    payload = {
        "input": prompt,
        "temperature": 0.7,
        "max_output_tokens": 1000,
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code == 404:
            # Try alternate generateText endpoint
            url2 = f"{API_BASE}/{MODEL}:generateText?key={API_KEY}"
            resp = requests.post(url2, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.RequestException as e:
        body = getattr(e.response, 'text', None) if hasattr(e, 'response') else None
        # log failure and return simple fallback
        print(f"AI request failed ({e}); body={body}")
        return {
            "headline": summary[:60] + "...",
            "body": summary,
            "tags": [],
            "meta": "",
        }

    # Extract text from the response
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        print(f"Unable to parse AI response, returning summary. raw={data}")
        return {
            "headline": summary[:60] + "...",
            "body": summary,
            "tags": [],
            "meta": "",
        }

    # Parse the structured output
    lines = text.splitlines()
    headline = ""
    meta = ""
    tags: list[str] = []
    body_lines: list[str] = []
    current_section = None

    for line in lines:
        line_lower = line.lower()
        if line_lower.startswith("headline:"):
            headline = line.partition(":")[2].strip()
            current_section = "headline"
        elif line_lower.startswith("meta:"):
            meta = line.partition(":")[2].strip()
            current_section = "meta"
        elif line_lower.startswith("tags:"):
            tags = [t.strip() for t in line.partition(":")[2].split(",") if t.strip()]
            current_section = "tags"
        elif line_lower.startswith("body:"):
            current_section = "body"
            # consume the "Body:" prefix and add any remainder to body_lines
            body_text = line.partition(":")[2].strip()
            if body_text:
                body_lines.append(body_text)
        else:
            # continuation of current section
            if current_section == "body":
                body_lines.append(line)

    body = "\n".join(body_lines).strip()

    result = {
        "headline": headline,
        "body": body,
        "tags": tags,
        "meta": meta,
    }
    return result


if __name__ == "__main__":
    # quick manual test
    sample = "NASA launches new rover to Mars, aims to collect rock samples."
    print(rewrite_summary(sample, "https://nasa.gov/news"))