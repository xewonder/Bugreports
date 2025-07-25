# Bug Tracking Software

This is the fixed version with a working mention (@) system across all features.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```

3. Run development server:
   ```
   npm run dev
   ```

## Supabase SQL for Mentions Table

```
create table if not exists public.user_mentions_mgg2024 (
  id uuid default gen_random_uuid() primary key,
  mentioned_user_id uuid references auth.users(id),
  mentioned_by_id uuid references auth.users(id),
  content_type text,
  content_id uuid,
  seen boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.user_mentions_mgg2024 enable row level security;

create policy "Allow read for mentioned users"
on public.user_mentions_mgg2024
for select
using (mentioned_user_id = auth.uid());

create policy "Allow insert for authenticated users"
on public.user_mentions_mgg2024
for insert
with check (mentioned_by_id = auth.uid());
```
