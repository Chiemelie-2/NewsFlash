-- ─────────────────────────────────────────────────────────
-- Supabase / PostgreSQL schema for NewsFlash Football
-- ─────────────────────────────────────────────────────────

-- ── Articles table ──────────────────────────────────────────
create table if not exists articles (
    id               uuid primary key default gen_random_uuid(),
    title            text,
    source_url       text unique,
    source_name      text,          -- "Sky Sports", "BBC Sport", "ESPN", etc.
    published        timestamp,
    summary          text,
    headline         text,          -- AI-rewritten headline
    body             text,          -- AI-rewritten body
    tags             text[],        -- PostgreSQL array for tag list
    meta_description text,
    -- image_url: scraped OG image or Pixabay result.
    -- Saved by the scraper server-side. Frontend reads this first;
    -- falls back to AI-generated SVG if NULL.
    image_url        text,
    -- section: football platform nav section
    -- values: 'breaking' | 'transfers' | 'gist' | 'investigations'
    --         | 'analysis' | 'history' | 'players'
    section          text default 'breaking',
    public           boolean default false,
    created_at       timestamptz default now(),
    updated_at       timestamptz default now()
);

-- ── Comments table ───────────────────────────────────────────
create table if not exists comments (
    id             uuid primary key default gen_random_uuid(),
    article_id     uuid references articles(id) on delete cascade,
    parent_id      uuid references comments(id) on delete cascade,
    author_name    text not null,
    author_initial text,
    author_color   text,
    body           text not null,
    reactions      jsonb default '{"thumbs":0,"heart":0,"laugh":0}'::jsonb,
    reported       boolean default false,
    created_at     timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_articles_section  on articles(section);
create index if not exists idx_articles_public   on articles(public);
create index if not exists idx_articles_published on articles(published desc);
create index if not exists idx_comments_article  on comments(article_id);
create index if not exists idx_comments_parent   on comments(parent_id);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_articles_updated_at on articles;

create trigger update_articles_updated_at
    before update on articles
    for each row
    execute procedure update_updated_at_column();

-- ── Migration: add columns to existing tables ─────────────────
-- Run these if upgrading from the original NewsApp schema:
--
-- alter table articles add column if not exists image_url   text;
-- alter table articles add column if not exists section     text default 'breaking';
-- alter table articles add column if not exists source_name text;

-- ── Fan Polls table ───────────────────────────────────────────
create table if not exists polls (
    id         uuid primary key default gen_random_uuid(),
    question   text not null,
    options    jsonb not null,   -- [{id, label, emoji}]
    votes      jsonb default '{}'::jsonb,  -- {optionId: count}
    active     boolean default true,
    created_at timestamptz default now()
);

-- ── Transfer rumors table ─────────────────────────────────────
create table if not exists transfer_rumors (
    id            uuid primary key default gen_random_uuid(),
    player        text not null,
    player_nation text,
    from_club     text,
    from_league   text,
    to_club       text,
    to_league     text,
    fee           text,
    source        text,
    status        text default 'rumour',   -- 'confirmed' | 'likely' | 'rumour'
    updated_at    timestamptz default now(),
    created_at    timestamptz default now()
);
