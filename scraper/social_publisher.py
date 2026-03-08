"""
social_publisher.py — Auto-post new articles to Twitter/X and Facebook.

FIXES vs original:
  ✅ OpenAI client variable name conflicted with Tweepy client (both named `client`)
  ✅ `article` variable was undefined at module level — now passed as argument
  ✅ Facebook post used `article["url"]` — wrong key, should be `article["source_url"]`
  ✅ Twitter message can exceed 280 chars — now truncated safely
  ✅ OpenAI switched to Gemini AI (matches rest of project, no extra API key needed)
  ✅ All credentials moved to environment variables — never hardcode keys
  ✅ Wrapped in main() so it only runs when called, not on import
  ✅ Added error handling so one platform failure doesn't crash the other
  ✅ Integrated into scraper/main.py flow — called after each new article is inserted

SETUP:
  Add these to your environment (GitHub Actions secrets / Vercel env vars):

  Twitter/X:
    TWITTER_CONSUMER_KEY
    TWITTER_CONSUMER_SECRET
    TWITTER_ACCESS_TOKEN
    TWITTER_ACCESS_TOKEN_SECRET

  Facebook:
    FACEBOOK_PAGE_ID
    FACEBOOK_PAGE_ACCESS_TOKEN
    (Get a Page Access Token at: https://developers.facebook.com/tools/explorer/)

  Google AI (already used by ai/engine.py):
    GOOGLE_AI_KEY
"""

import os
import re
import requests
import tweepy


# ── Credentials from environment ────────────────────────────────────
TWITTER_CONSUMER_KEY        = os.getenv("TWITTER_CONSUMER_KEY", "")
TWITTER_CONSUMER_SECRET     = os.getenv("TWITTER_CONSUMER_SECRET", "")
TWITTER_ACCESS_TOKEN        = os.getenv("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET", "")

FACEBOOK_PAGE_ID            = os.getenv("FACEBOOK_PAGE_ID", "")
FACEBOOK_PAGE_ACCESS_TOKEN  = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")

GOOGLE_AI_KEY               = os.getenv("GOOGLE_AI_KEY", "")


# ── AI caption generator (Gemini 1.5 Flash — free tier) ─────────────
def generate_social_caption(headline: str, url: str, platform: str) -> str:
    """Generate a platform-specific social media caption using Gemini."""
    if not GOOGLE_AI_KEY:
        # Fallback: simple template if no AI key
        return _fallback_caption(headline, url, platform)

    if platform == "twitter":
        instruction = (
            "Write a punchy Twitter/X post for this news headline. "
            "Max 220 characters (leave room for the link). "
            "Include 2 relevant hashtags. No quotes around the text."
        )
    else:
        instruction = (
            "Write an engaging Facebook post for this news headline. "
            "2-3 sentences. Conversational tone. "
            "Include 3 relevant hashtags at the end."
        )

    prompt = f"{instruction}\n\nHeadline: {headline}\nLink: {url}"

    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_AI_KEY}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.8, "maxOutputTokens": 300},
            },
            timeout=20,
        )
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        return text
    except Exception as e:
        print(f"  AI caption failed ({e}), using fallback")
        return _fallback_caption(headline, url, platform)


def _fallback_caption(headline: str, url: str, platform: str) -> str:
    """Simple template caption when AI is unavailable."""
    tags = "#News #Breaking"
    if platform == "twitter":
        # Stay well under 280 chars
        short = headline[:180] + "…" if len(headline) > 180 else headline
        return f"{short}\n\n{url}\n\n{tags}"
    else:
        return f"{headline}\n\nRead the full story: {url}\n\n{tags}"


# ── Twitter / X ──────────────────────────────────────────────────────
def post_to_twitter(article: dict) -> bool:
    """Post article to Twitter/X. Returns True on success."""
    missing = [k for k in [
        TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET,
        TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
    ] if not k]
    if missing:
        print("  ⚠️  Twitter credentials not set — skipping")
        return False

    try:
        # Use a separate variable name (not `client`) to avoid conflict
        twitter = tweepy.Client(
            consumer_key=TWITTER_CONSUMER_KEY,
            consumer_secret=TWITTER_CONSUMER_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_TOKEN_SECRET,
        )

        headline  = article.get("headline") or article.get("title", "")
        source_url = article.get("source_url", "")

        caption = generate_social_caption(headline, source_url, "twitter")

        # Twitter hard limit: 280 chars. Truncate safely if AI over-generated.
        if len(caption) > 280:
            caption = caption[:277] + "…"

        twitter.create_tweet(text=caption)
        print(f"  ✅ Posted to Twitter: {headline[:60]}")
        return True

    except tweepy.TweepyException as e:
        print(f"  ❌ Twitter post failed: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Twitter unexpected error: {e}")
        return False


# ── Facebook ─────────────────────────────────────────────────────────
def post_to_facebook(article: dict) -> bool:
    """Post article to a Facebook Page. Returns True on success."""
    if not FACEBOOK_PAGE_ID or not FACEBOOK_PAGE_ACCESS_TOKEN:
        print("  ⚠️  Facebook credentials not set — skipping")
        return False

    try:
        headline   = article.get("headline") or article.get("title", "")
        source_url = article.get("source_url", "")   # ← fixed: was article["url"]
        image_url  = article.get("image_url")

        caption = generate_social_caption(headline, source_url, "facebook")

        # Post with image if available (looks much better in feed)
        if image_url:
            api_url = f"https://graph.facebook.com/v19.0/{FACEBOOK_PAGE_ID}/photos"
            payload = {
                "caption": f"{caption}\n\n{source_url}",
                "url": image_url,
                "access_token": FACEBOOK_PAGE_ACCESS_TOKEN,
            }
        else:
            api_url = f"https://graph.facebook.com/v19.0/{FACEBOOK_PAGE_ID}/feed"
            payload = {
                "message": caption,
                "link": source_url,
                "access_token": FACEBOOK_PAGE_ACCESS_TOKEN,
            }

        response = requests.post(api_url, data=payload, timeout=15)
        result = response.json()

        if "error" in result:
            print(f"  ❌ Facebook API error: {result['error'].get('message')}")
            return False

        print(f"  ✅ Posted to Facebook: {headline[:60]}")
        return True

    except Exception as e:
        print(f"  ❌ Facebook post failed: {e}")
        return False


# ── Main entry point ─────────────────────────────────────────────────
def publish_article(article: dict):
    """
    Call this after inserting a new article.
    article dict must have: headline (or title), source_url, image_url (optional)

    Example usage in scraper/main.py:
        from social_publisher import publish_article
        publish_article(inserted_article)
    """
    print(f"  📢 Publishing to social media...")
    post_to_twitter(article)
    post_to_facebook(article)


# ── Standalone test ──────────────────────────────────────────────────
if __name__ == "__main__":
    test_article = {
        "headline": "Test: AI Breaks New Record in Benchmark Scores",
        "source_url": "https://example.com/ai-benchmark",
        "image_url": None,
    }
    publish_article(test_article)
