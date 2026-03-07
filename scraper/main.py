"""Scraper and trend detector for NewsFlash.
  ✅ Uses Pixabay API (free, no attribution required, 100 req/min)
  ✅ Fetches an image per article and saves image_url to Supabase DB
  ✅ Falls back gracefully if Pixabay API key is not set
"""

import os
import feedparser
import requests
from supabase import create_client, Client
from typing import List, Optional
from postgrest import APIError

try:
    from ai import engine
except ImportError:
    engine = None

RSS_URL = "https://news.google.com/rss"
KEYWORDS = [
    "iPhone", "Nvidia", "Apple", "Microsoft", "Google", "AI", "OpenAI",
    "ChatGPT", "Meta", "Amazon", "Tesla", "Bitcoin", "Crypto", "Tech",
    "Software", "Business", "News",
]

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ── Get your free Pixabay key at https://pixabay.com/api/docs/ ──
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY", "")

client: Client | None = None


def get_supabase_client() -> Client:
    global client
    if client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("Supabase URL/KEY not configured in environment")
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return client


# ── Pixabay helper ───────────────────────────────────────────────
def fetch_pixabay_image(query: str) -> Optional[str]:
    """Return the first Pixabay photo URL for *query*, or None.
    No attribution required — Pixabay license allows free commercial use.
    """
    if not PIXABAY_API_KEY:
        return None
    try:
        resp = requests.get(
            "https://pixabay.com/api/",
            params={
                "key": PIXABAY_API_KEY,
                "q": query,
                "image_type": "photo",
                "orientation": "horizontal",
                "per_page": 3,
                "safesearch": "true",
                "order": "popular",
            },
            timeout=10,
        )
        resp.raise_for_status()
        hits = resp.json().get("hits", [])
        if hits:
            # webformatURL is ~640px wide — good balance of quality vs storage
            return hits[0]["webformatURL"]
    except Exception as e:
        print(f"  Pixabay lookup failed: {e}")
    return None


def fetch_feed(url: str = RSS_URL):
    return feedparser.parse(url)


def filter_entries(entries, keywords: List[str]) -> List[dict]:
    filtered = []
    for entry in entries:
        title = entry.get("title", "")
        if any(kw.lower() in title.lower() for kw in keywords):
            filtered.append(entry)
    return filtered


def exists_in_db(url: str) -> bool:
    supa = get_supabase_client()
    try:
        resp = supa.table("articles").select("id").eq("source_url", url).limit(1).execute()
    except APIError as e:
        raise RuntimeError(
            "Database error when checking for existing article. "
            "Make sure the 'articles' table is created in Supabase. "
            f"(original: {e})"
        )
    if hasattr(resp, "error") and resp.error:
        raise RuntimeError(f"Supabase error: {resp.error}")
    return bool(getattr(resp, "data", None)) and len(resp.data) > 0


def insert_article(entry: dict):
    supa = get_supabase_client()

    title = entry.get("title", "")
    # Use first 4 words of title as image search query
    pix_query = " ".join(title.split()[:4])
    image_url = fetch_pixabay_image(pix_query)
    if image_url:
        print(f"  ✓ Pixabay image found")
    else:
        print(f"  ℹ No Pixabay image — frontend will generate AI preview")

    article = {
        "title": title,
        "source_url": entry.get("link"),
        "published": entry.get("published"),
        "summary": entry.get("summary"),
        "headline": None,
        "body": None,
        "tags": [],
        "meta_description": None,
        "image_url": image_url,
        "public": True,
    }
    resp = supa.table("articles").insert(article).execute()
    if hasattr(resp, "error") and resp.error:
        raise RuntimeError(f"Failed to insert: {resp.error}")
    return resp.data


def main():
    feed = fetch_feed()
    entries = feed.entries
    print(f"Fetched {len(entries)} entries from RSS")
    matches = filter_entries(entries, KEYWORDS)
    print(f"{len(matches)} entries match keywords")

    for entry in matches:
        url = entry.get("link")
        if not exists_in_db(url):
            print(f"Inserting {url}")
            inserted = insert_article(entry)
            if inserted and engine:
                article_id = inserted[0].get("id")
                summary = entry.get("summary", "")
                try:
                    enriched = engine.rewrite_summary(summary, url)
                    if article_id:
                        supa = get_supabase_client()
                        update_data = {}
                        if enriched.get("headline"):
                            update_data["headline"] = enriched["headline"]
                        if enriched.get("body"):
                            update_data["body"] = enriched["body"]
                        if enriched.get("tags"):
                            update_data["tags"] = enriched["tags"]
                        if enriched.get("meta"):
                            update_data["meta_description"] = enriched["meta"]
                        update_data["public"] = True
                        supa.table("articles").update(update_data).eq("id", article_id).execute()
                except Exception as e:
                    print(f"AI enrichment failed for {url}: {e}")
        else:
            print(f"Skipping existing article {url}")


if __name__ == "__main__":
    main()
