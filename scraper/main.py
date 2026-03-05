"""Scraper and trend detector for NewsApp.

This module reads Google News RSS, filters trends, and inserts new items
into Supabase to avoid duplicates.
"""

import os
import feedparser
from supabase import create_client, Client
from typing import List

# AI engine for rewriting summaries
try:
    from ai import engine
except ImportError:
    engine = None  # allow script to work even if ai module isn't available

# configuration
RSS_URL = "https://news.google.com/rss"
KEYWORDS = ["iPhone", "Nvidia", "Apple", "Microsoft", "Google", "AI", "OpenAI", "ChatGPT", "Meta", "Amazon", "Tesla", "Bitcoin", "Crypto", "Tech", "Software", "Business", "News"]  # tech + general news

# supabase connection (expects environment variables)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client: Client | None = None


def get_supabase_client() -> Client:
    global client
    if client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("Supabase URL/KEY not configured in environment")
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return client


def fetch_feed(url: str = RSS_URL):
    return feedparser.parse(url)


def filter_entries(entries, keywords: List[str]) -> List[dict]:
    """Return entries whose title contains any of the keywords."""
    filtered = []
    for entry in entries:
        title = entry.get("title", "")
        if any(keyword.lower() in title.lower() for keyword in keywords):
            filtered.append(entry)
    return filtered


from postgrest import APIError

def exists_in_db(url: str) -> bool:
    supa = get_supabase_client()
    try:
        resp = supa.table("articles").select("id").eq("source_url", url).limit(1).execute()
    except APIError as e:
        # common case: table doesn't exist
        raise RuntimeError(
            "Database error when checking for existing article. "
            "Make sure the 'articles' table is created in Supabase. "
            f"(original: {e})"
        )
    # older versions returned resp.error, newer just use status_code/data
    if hasattr(resp, "error") and resp.error:
        raise RuntimeError(f"Supabase error: {resp.error}")
    return bool(getattr(resp, "data", None)) and len(resp.data) > 0


def insert_article(entry: dict):
    supa = get_supabase_client()
    article = {
        "title": entry.get("title"),
        "source_url": entry.get("link"),
        "published": entry.get("published"),
        "summary": entry.get("summary"),
        # enrichment fields will be filled later
        "headline": None,
        "body": None,
        "tags": [],
        "meta_description": None,
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
            # inserted is a list of rows returned by Supabase client
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