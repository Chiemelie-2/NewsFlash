-- Supabase/PostgreSQL schema for NewsApp articles table

create table if not exists articles (
    id uuid primary key default gen_random_uuid(),
    title text,
    source_url text unique,
    published timestamp,
    summary text,
    headline text,
    body text,
    tags text[],         -- PostgreSQL array for tag list
    meta_description text,
    public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Optional: trigger to update updated_at on row change
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
