"""Scraper and trend detector for NewsFlash Football.

This module reads Google News RSS (football-focused queries), filters
football-relevant entries, scrapes OG images from source pages, and
inserts new items into Supabase to avoid duplicates.

Image strategy:
  1. Scrape OG image from source article (og:image meta tag)
  2. Fall back to Pixabay API search by tags
  3. If neither available, leave image_url as NULL — frontend uses SVG fallback

Section tagging:
  Articles are auto-tagged into platform sections based on keyword matching:
  breaking | transfers | gist | investigations | analysis | history | players
"""

import os
import re
import requests
import feedparser
from bs4 import BeautifulSoup
from supabase import create_client, Client
from typing import List, Optional

# AI engine for rewriting summaries
try:
    from ai import engine
except ImportError:
    engine = None  # allow script to work even if ai module isn't available

# ── Configuration ───────────────────────────────────────────────

# Football-focused RSS queries via Google News
FOOTBALL_RSS_FEEDS = [
    "https://news.google.com/rss/search?q=premier+league&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=football+transfer&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=champions+league&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=la+liga&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=bundesliga&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=football+injury+news&hl=en-GB&gl=GB&ceid=GB:en",
]

# Keywords that must appear for an entry to be accepted
FOOTBALL_KEYWORDS = [
    "football", "soccer", "premier league", "la liga", "bundesliga",
    "serie a", "champions league", "transfer", "haaland", "mbapp",
    "bellingham", "salah", "kane", "messi", "ronaldo", "arsenal",
    "chelsea", "liverpool", "manchester", "barcelona", "real madrid",
    "juventus", "inter", "psg", "goal", "match", "fixture", "stadium",
    "manager", "coach", "referee", "var", "offside",
]

# Trusted football news sources — prefer these for image scraping
TRUSTED_SOURCES = [
    "bbc.co.uk/sport", "skysports.com", "theguardian.com/football",
    "espn.com/soccer", "goal.com", "marca.com", "sport.es",
]

# Pixabay API — server-side only, never exposed to browser
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
PIXABAY_BASE    = "https://pixabay.com/api/"

# Supabase connection (expects environment variables)
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


# ── RSS feed helpers ────────────────────────────────────────────

def fetch_feed(url: str):
    return feedparser.parse(url)


def filter_entries(entries, keywords: List[str]) -> List[dict]:
    """Return entries whose title contains any of the football keywords."""
    filtered = []
    for entry in entries:
        title = entry.get("title", "").lower()
        if any(kw.lower() in title for kw in keywords):
            filtered.append(entry)
    return filtered


# ── Image scraping ──────────────────────────────────────────────

def scrape_og_image(url: str) -> Optional[str]:
    """Attempt to scrape the og:image from the article's source page."""
    try:
        resp = requests.get(url, timeout=8, headers={
            "User-Agent": "Mozilla/5.0 (compatible; NewsFlash/1.0)"
        })
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]
        # Fallback to twitter:image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            return tw["content"]
    except Exception as e:
        print(f"OG image scrape failed for {url}: {e}")
    return None


def fetch_pixabay_image(query: str) -> Optional[str]:
    """
    Server-side Pixabay search — NOT called from the browser.
    Returns the web-format image URL or None.
    """
    if not PIXABAY_API_KEY:
        return None
    try:
        params = {
            "key": PIXABAY_API_KEY,
            "q": f"football {query}",
            "image_type": "photo",
            "orientation": "horizontal",
            "per_page": 5,
            "safesearch": "true",
        }
        resp = requests.get(PIXABAY_BASE, params=params, timeout=8)
        data = resp.json()
        hits = data.get("hits", [])
        if hits:
            return hits[0].get("webformatURL")
    except Exception as e:
        print(f"Pixabay fetch failed for '{query}': {e}")
    return None


# ── Section auto-tagging ─────────────────────────────────────────

SECTION_RULES = [
    ("transfers",      r"transfer|deal|sign|bid|fee|contract|move|join|agree"),
    ("breaking",       r"breaking|confirms|official|announce|sack|appoint|resign"),
    ("investigations", r"scandal|corrupt|fraud|investigat|allegation|ban|sanction"),
    ("gist",           r"viral|reaction|drama|locker|fan|funny|bizarre|social media"),
    ("analysis",       r"analys|tactic|formation|performance|how|why|breakdown"),
    ("history",        r"history|legend|greatest|classic|nostalgia|remember|career"),
    ("players",        r"player|profile|journey|childhood|story|struggle|achieve"),
]

def detect_section(title: str, summary: str) -> str:
    """Auto-tag article into a platform section based on content."""
    text = (title + " " + summary).lower()
    for section, pattern in SECTION_RULES:
        if re.search(pattern, text):
            return section
    return "breaking"  # default to breaking news


# ── DB helpers ──────────────────────────────────────────────────

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
    if hasattr(resp, "error") and resp.error:
        raise RuntimeError(f"Supabase error: {resp.error}")
    return bool(getattr(resp, "data", None)) and len(resp.data) > 0


def insert_article(entry: dict, image_url: Optional[str] = None, section: str = "breaking"):
    supa = get_supabase_client()
    article = {
        "title":       entry.get("title"),
        "source_url":  entry.get("link"),
        "published":   entry.get("published"),
        "summary":     entry.get("summary"),
        # image_url — scraped OG image or Pixabay result, used by frontend ArticleCard
        "image_url":   image_url,
        # section — maps to platform nav sections
        "section":     section,
        # enrichment fields filled later by AI engine
        "headline":    None,
        "body":        None,
        "tags":        [],
        "meta_description": None,
        "public":      True,
    }
    resp = supa.table("articles").insert(article).execute()
    if hasattr(resp, "error") and resp.error:
        raise RuntimeError(f"Failed to insert: {resp.error}")
    return resp.data


def main():
    all_entries: List[dict] = []

    # Collect from all football RSS feeds
    for feed_url in FOOTBALL_RSS_FEEDS:
        feed = fetch_feed(feed_url)
        print(f"Fetched {len(feed.entries)} entries from {feed_url}")
        matches = filter_entries(feed.entries, FOOTBALL_KEYWORDS)
        all_entries.extend(matches)

    # Deduplicate by URL within this run
    seen_urls = set()
    unique_entries = []
    for entry in all_entries:
        url = entry.get("link")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_entries.append(entry)

    print(f"{len(unique_entries)} unique football entries after deduplication")

    for entry in unique_entries:
        url = entry.get("link")
        if not url:
            continue

        if not exists_in_db(url):
            print(f"Processing: {url}")

            # Detect section from title + summary
            section = detect_section(
                entry.get("title", ""),
                entry.get("summary", ""),
            )

            # Image strategy: OG scrape first, then Pixabay
            image_url = scrape_og_image(url)
            if not image_url and PIXABAY_API_KEY:
                query = entry.get("title", "football")[:40]
                image_url = fetch_pixabay_image(query)

            print(f"  Section: {section} | Image: {'✓' if image_url else '✗'}")

            inserted = insert_article(entry, image_url=image_url, section=section)

            # AI enrichment (rewrite headline + body + tags)
            if inserted and engine:
                article_id = inserted[0].get("id")
                summary    = entry.get("summary", "")
                try:
                    enriched = engine.rewrite_summary(summary, url)
                    if article_id:
                        supa = get_supabase_client()
                        update_data: dict = {}
                        if enriched.get("headline"):
                            update_data["headline"]         = enriched["headline"]
                        if enriched.get("body"):
                            update_data["body"]             = enriched["body"]
                        if enriched.get("tags"):
                            update_data["tags"]             = enriched["tags"]
                        if enriched.get("meta"):
                            update_data["meta_description"] = enriched["meta"]
                        update_data["public"] = True
                        supa.table("articles").update(update_data).eq("id", article_id).execute()
                except Exception as e:
                    print(f"AI enrichment failed for {url}: {e}")
        else:
            print(f"Skipping existing: {url}")


if __name__ == "__main__":
    main()
