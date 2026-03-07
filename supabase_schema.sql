-- ═══════════════════════════════════════════════════════════════
-- NewsFlash — Supabase Schema  (updated)
-- Run this in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════

create table if not exists articles (
    id               uuid primary key default gen_random_uuid(),
    title            text,
    source_url       text unique,
    published        timestamp,
    summary          text,
    headline         text,          -- AI SEO headline
    body             text,          -- AI rewritten article
    tags             text[],        -- SEO tags array
    meta_description text,          -- Google meta description
    image_url        text,          -- ← NEW: Pexels cached image URL
    public           boolean default false,
    created_at       timestamptz default now(),
    updated_at       timestamptz default now()
);

-- Index for fast tag lookups
create index if not exists idx_articles_tags on articles using gin(tags);
-- Index for fast source_url dedup checks
create index if not exists idx_articles_source_url on articles(source_url);

-- Trigger: auto-update updated_at
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

-- If upgrading from the original schema, run this to add the image_url column:
-- alter table articles add column if not exists image_url text;

-- ═══════════════════════════════════════════════════════════════
-- Comments table  (NEW — run this to enable comments)
-- ═══════════════════════════════════════════════════════════════

create table if not exists comments (
    id            uuid primary key default gen_random_uuid(),
    article_id    uuid not null references articles(id) on delete cascade,
    parent_id     uuid references comments(id) on delete cascade,
    author_name   text not null,
    author_initial text not null,
    author_color  text not null,
    body          text not null,
    reactions     jsonb not null default '{"thumbs":0,"heart":0,"laugh":0}',
    reported      boolean not null default false,
    created_at    timestamptz default now()
);

-- Indexes for fast lookups per article
create index if not exists idx_comments_article_id on comments(article_id);
create index if not exists idx_comments_parent_id  on comments(parent_id);

-- Enable Row Level Security (allow anyone to read + insert)
alter table comments enable row level security;

create policy "Anyone can read comments"
  on comments for select using (true);

create policy "Anyone can post comments"
  on comments for insert with check (true);

create policy "Anyone can update reactions"
  on comments for update using (true);

create policy "Anyone can report comments"
  on comments for update using (true);
