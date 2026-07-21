create table if not exists recurring_transactions (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) not null,
  user_id uuid references profiles(id) not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  note text,
  day_of_month int not null check (day_of_month between 1 and 31),
  last_applied_month text,
  created_at timestamptz default now()
);

alter table recurring_transactions enable row level security;

-- Auto-stamp household_id from the inserting user's own profile, same
-- pattern as set_transaction_household() for the transactions table, so
-- client code never has to look up/pass its own household_id.
create or replace function set_recurring_household()
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

drop trigger if exists trg_set_recurring_household on recurring_transactions;
create trigger trg_set_recurring_household
  before insert on recurring_transactions
  for each row execute function set_recurring_household();

drop policy if exists "read household recurring transactions" on recurring_transactions;
create policy "read household recurring transactions" on recurring_transactions
  for select to authenticated using (household_id = get_my_household_id());

drop policy if exists "insert household recurring transactions" on recurring_transactions;
create policy "insert household recurring transactions" on recurring_transactions
  for insert to authenticated with check (household_id = get_my_household_id());

drop policy if exists "update household recurring transactions" on recurring_transactions;
create policy "update household recurring transactions" on recurring_transactions
  for update to authenticated
  using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

drop policy if exists "delete household recurring transactions" on recurring_transactions;
create policy "delete household recurring transactions" on recurring_transactions
  for delete to authenticated using (household_id = get_my_household_id());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recurring_transactions'
  ) then
    alter publication supabase_realtime add table recurring_transactions;
  end if;
end $$;
