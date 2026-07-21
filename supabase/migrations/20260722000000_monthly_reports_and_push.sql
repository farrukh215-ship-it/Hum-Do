create table if not exists monthly_reports (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) not null,
  month date not null,
  report_json jsonb not null,
  ai_summary text,
  generated_at timestamptz default now(),
  unique (household_id, month)
);

alter table monthly_reports enable row level security;

drop policy if exists "read household monthly reports" on monthly_reports;
create policy "read household monthly reports" on monthly_reports
  for select to authenticated using (household_id = get_my_household_id());

drop policy if exists "insert household monthly reports" on monthly_reports;
create policy "insert household monthly reports" on monthly_reports
  for insert to authenticated with check (household_id = get_my_household_id());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'monthly_reports'
  ) then
    alter publication supabase_realtime add table monthly_reports;
  end if;
end $$;

create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) not null,
  user_id uuid references profiles(id) not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

-- Auto-stamp household_id from the inserting user's own profile, same pattern
-- as set_transaction_household()/set_recurring_household().
create or replace function set_push_subscription_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.household_id := (select household_id from profiles where id = new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_set_push_subscription_household on push_subscriptions;
create trigger trg_set_push_subscription_household
  before insert on push_subscriptions
  for each row execute function set_push_subscription_household();

drop policy if exists "read own or household push subscriptions" on push_subscriptions;
create policy "read own or household push subscriptions" on push_subscriptions
  for select to authenticated
  using (auth.uid() = user_id or household_id = get_my_household_id());

drop policy if exists "insert own push subscriptions" on push_subscriptions;
create policy "insert own push subscriptions" on push_subscriptions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "delete own push subscriptions" on push_subscriptions;
create policy "delete own push subscriptions" on push_subscriptions
  for delete to authenticated using (auth.uid() = user_id);
