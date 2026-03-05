A self-sustaining, AI-driven news engine with $0 initial overhead.

📌 1. Project Vision

To build a fully automated news platform that detects trends, sources facts, rewrites original content using LLMs, and publishes them to a modern web interface—leveraging free-tier APIs and local compute to bypass all startup costs.


🛠 2. The "Zero-Cost" Technical Stack

Layer Technology Why?
Frontend Next.js 15 (App Router) Best for SEO and hosted free on Vercel.

Database Supabase (PostgreSQL) Free tier includes 500MB (thousands of articles).
Trend Engine PyTrends / Google News RSS Free scraping/parsing of real-time search spikes.
AI Brain Gemini 1.5 Flash (via Google AI Studio) Massive free tier for fast, high-quality rewriting.
Automation GitHub Actions Free "Cron Jobs" to run your scripts every 1-4 hours.

Images Pexels API Free high-res stock photos to avoid copyright issues.


🏗 3. Step-by-Step Build Guide

Phase 1: The Scraper & Trend Detector (Stage 1)

Step 1.1: A Python script should be set up using feedparser to read from the Google News RSS feed.

Step 1.2: Filter trends by keywords (e.g., If the title contains "iPhone" or "Nvidia," tag it as Technology).

Step 1.3: Prevent duplicates by checking the URL against your Supabase database before processing.

> **Quick start**
> 1. `cd scraper` and create a virtual environment:
>    ```bash
>    python -m venv .venv
>    .venv\Scripts\activate   # Windows
>    pip install -r requirements.txt
>    ```
> 2. Configure `SUPABASE_URL` and `SUPABASE_KEY` as environment variables.
> 3. Run `python main.py` to fetch the RSS feed and insert any new tech‑keyword articles.
> 4. Later we'll wrap this in a GitHub Actions cron job (`.github/workflows/scrape.yml`).

Phase 2: The AI Content Engine (Stage 2)
Step 2.1: Get a Google AI Studio API Key (Free).

Step 2.2: Create the "Agentic Prompt":

    "Act as a senior journalist. Rewrite the following news summary into a 400-word article. Maintain a professional tone. Ensure 100% originality. Include a catchy headline, meta-description, and 5 relevant tags."

Step 2.3: Implement Source Attribution. Automatically append "Source: [Original News Site]" at the bottom to remain legally safe.

> **Implementation notes**
> 1. `cd ai` and set up a virtualenv:
>    ```bash
>    python -m venv .venv
>    .venv\Scripts\activate   # Windows
>    pip install -r requirements.txt
>    ```
> 2. Put your Google AI key in an `.env` file or export `GOOGLE_AI_KEY`.
> 3. Use `ai/engine.py` as the core rewrite function. It exports `rewrite_summary(summary, source)`.
> 4. Later the workflow can call this module after the scraper and store the enriched article fields back in Supabase.
>
> **Pipeline integration**
> - `scraper/main.py` now imports `ai.engine` when available.
> - After a new entry is inserted it immediately calls `rewrite_summary()` and updates the same row with `headline`, `body`, `tags`, and `meta_description`.
> - Articles are created with `public=false`; an admin toggle can flip this when ready to publish.


Phase 3: The Frontend & Database (Stage 3)

Step 3.1: Deploy a Next.js template. Use Tailwind CSS for a modern, mobile-first news layout.

Step 3.2: Connect to Supabase. Fetch articles based on category (Football, Tech, etc.).

Step 3.3: SEO Setup: Use next-sitemap to automatically generate a sitemap for Google Search Console.

Phase 4: Automation (Stage 4)

Step 4.1: Create a .github/workflows/scrape.yml file.

Step 4.2: Set it to run every 2 hours. This script will trigger the scraper, call the AI, and save the result to the DB without you touching a button.

⚖️ 4. Content Safety & Legal Logic
Anti-Hallucination: The AI is strictly told to only use facts found in the RSS snippet/source URL.
Plagiarism Bypass: The AI is instructed to restructure the narrative, changing the "voice" while keeping the facts.
Human-in-the-Loop (Optional): Create a simple "Admin" page in your app where you can "Toggle Public" on/off if you want to review articles before they go live.

💰 5. The "Builder's" Financial Roadmap
Months 1-3 ($0/mo): Use free tiers (Gemini Flash + Vercel + Supabase).
Month 4+ ($10-$20/mo): As traffic grows, apply for Microsoft for Startups to get $2,500 in OpenAI credits to upgrade to GPT-4o.
Revenue Goal: Once you hit 10,000 monthly views, integrate Google AdSense to cover all future API costs.

📈 6. MVP Feature List
Breaking News Ticker: Real-time updates at the top.
Category Filters: Football, Tech, Business, Entertainment.
Search Bar: Indexed by Supabase full-text search.
Dark Mode: For a modern "Tech News" feel.
Newsletter Signup: Connect to Mailchimp (Free tier) to build an audience.

🧑‍💻 7. Final Action Items for the Builder
Register a Domain: (.com or .news).
Set up the Repo: Initialize your GitHub repository.
API Keys: Secure your NewsAPI, Google AI Studio, and Supabase keys.
