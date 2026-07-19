create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) not null,
  category text not null,
  monthly_limit numeric not null check (monthly_limit > 0),
  created_at timestamptz default now(),
  unique (household_id, category)
);

alter table budgets enable row level security;

drop policy if exists "read household budgets" on budgets;
create policy "read household budgets" on budgets
  for select to authenticated using (household_id = get_my_household_id());

drop policy if exists "insert household budgets" on budgets;
create policy "insert household budgets" on budgets
  for insert to authenticated with check (household_id = get_my_household_id());

drop policy if exists "update household budgets" on budgets;
create policy "update household budgets" on budgets
  for update to authenticated
  using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

drop policy if exists "delete household budgets" on budgets;
create policy "delete household budgets" on budgets
  for delete to authenticated using (household_id = get_my_household_id());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budgets'
  ) then
    alter publication supabase_realtime add table budgets;
  end if;
end $$;
