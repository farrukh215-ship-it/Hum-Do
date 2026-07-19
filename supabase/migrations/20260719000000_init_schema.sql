-- Har banda: husband ya wife
create table if not exists profiles (
  id uuid references auth.users primary key,
  name text,
  role text check (role in ('husband','wife'))
);

-- Har entry: income ya expense
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('income','expense')) not null,
  amount numeric not null,
  category text not null,
  note text,
  created_at timestamptz default now()
);

-- Security ON
alter table profiles enable row level security;
alter table transactions enable row level security;

-- Dono partners SAARA data dekh sakte hain (shared ledger)
drop policy if exists "read all tx" on transactions;
create policy "read all tx" on transactions for select to authenticated using (true);

drop policy if exists "insert own tx" on transactions;
create policy "insert own tx" on transactions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own tx" on transactions;
create policy "update own tx" on transactions for update to authenticated using (auth.uid() = user_id);

drop policy if exists "delete own tx" on transactions;
create policy "delete own tx" on transactions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles for select to authenticated using (true);

drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update to authenticated using (auth.uid() = id);

-- Realtime ON taake auto-update ho
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table transactions;
  end if;
end $$;
