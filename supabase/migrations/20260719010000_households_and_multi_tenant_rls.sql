-- ============================================================
-- Households: multi-couple tenant isolation
-- ============================================================

create table if not exists households (
  id uuid default gen_random_uuid() primary key,
  invite_code text not null unique,
  created_at timestamptz default now()
);

alter table profiles add column if not exists household_id uuid references households(id);
alter table transactions add column if not exists household_id uuid references households(id);

alter table households enable row level security;

-- ------------------------------------------------------------
-- Security-definer helper: lets a profiles/transactions RLS
-- policy read the CALLER's own household_id without recursing
-- into the profiles policy that uses it (runs as table owner,
-- which bypasses RLS since we never FORCE ROW LEVEL SECURITY).
-- ------------------------------------------------------------
create or replace function get_my_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Auto-stamp transactions.household_id from the inserting
-- user's own profile, so client code never has to pass it.
-- ------------------------------------------------------------
create or replace function set_transaction_household()
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

drop trigger if exists trg_set_transaction_household on transactions;
create trigger trg_set_transaction_household
  before insert on transactions
  for each row execute function set_transaction_household();

-- ------------------------------------------------------------
-- Live-data backfill: only auto-merges if it finds EXACTLY the
-- 2 known legacy profiles with no household yet. Any other count
-- (0 = fresh install, >2 = unexpected) is left untouched.
-- ------------------------------------------------------------
do $$
declare
  v_household_id uuid;
  v_code text;
  v_null_count int;
begin
  select count(*) into v_null_count from profiles where household_id is null;

  if v_null_count = 2 then
    loop
      v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when not exists (select 1 from households h where h.invite_code = v_code);
    end loop;

    insert into households (invite_code) values (v_code) returning id into v_household_id;

    update profiles set household_id = v_household_id where household_id is null;

    raise notice 'Backfilled 2 legacy profiles into household % (invite code %)', v_household_id, v_code;
  elsif v_null_count > 0 then
    raise notice 'Expected exactly 2 legacy profiles without household_id, found %. Skipped auto-backfill.', v_null_count;
  end if;
end $$;

update transactions t
set household_id = p.household_id
from profiles p
where t.user_id = p.id
  and t.household_id is null
  and p.household_id is not null;

-- ------------------------------------------------------------
-- Lock the columns down now that legacy data is backfilled, and
-- enforce "at most one husband + one wife per household".
-- ------------------------------------------------------------
alter table profiles alter column household_id set not null;
alter table transactions alter column household_id set not null;

create unique index if not exists profiles_household_role_unique
  on profiles (household_id, role)
  where household_id is not null and role is not null;

-- ------------------------------------------------------------
-- Household create/join RPCs (SECURITY DEFINER: must work before
-- the caller has any household-scoped visibility at all).
-- ------------------------------------------------------------
create or replace function create_household(p_name text, p_role text)
returns table(household_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_code text;
begin
  if exists (select 1 from profiles where id = auth.uid() and household_id is not null) then
    raise exception 'Aap pehle se ek ghar mein shamil hain';
  end if;

  if p_role not in ('husband', 'wife') then
    raise exception 'Role ghalat hai';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from households h where h.invite_code = v_code);
  end loop;

  insert into households (invite_code) values (v_code) returning id into v_household_id;

  insert into profiles (id, name, role, household_id)
  values (auth.uid(), p_name, p_role, v_household_id)
  on conflict (id) do update
    set name = excluded.name, role = excluded.role, household_id = excluded.household_id;

  return query select v_household_id, v_code;
end;
$$;

grant execute on function create_household(text, text) to authenticated;

create or replace function find_household_by_invite_code(p_code text)
returns table(household_id uuid, taken_roles text[])
language sql
security definer
set search_path = public
stable
as $$
  select h.id, coalesce(array_agg(p.role) filter (where p.role is not null), '{}')
  from households h
  left join profiles p on p.household_id = h.id
  where h.invite_code = upper(p_code)
  group by h.id;
$$;

grant execute on function find_household_by_invite_code(text) to authenticated;

create or replace function join_household(p_code text, p_name text, p_role text)
returns table(household_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_taken_count int;
begin
  if exists (select 1 from profiles where id = auth.uid() and household_id is not null) then
    raise exception 'Aap pehle se ek ghar mein shamil hain';
  end if;

  if p_role not in ('husband', 'wife') then
    raise exception 'Role ghalat hai';
  end if;

  select h.id into v_household_id from households h where h.invite_code = upper(p_code);

  if v_household_id is null then
    raise exception 'Invite code sahi nahi hai';
  end if;

  select count(*) into v_taken_count
  from profiles p
  where p.household_id = v_household_id and p.role = p_role and p.id <> auth.uid();

  if v_taken_count > 0 then
    raise exception 'Yeh role pehle se liya gaya hai';
  end if;

  insert into profiles (id, name, role, household_id)
  values (auth.uid(), p_name, p_role, v_household_id)
  on conflict (id) do update
    set name = excluded.name, role = excluded.role, household_id = excluded.household_id;

  return query select v_household_id;
exception
  when unique_violation then
    raise exception 'Yeh role pehle se liya gaya hai';
end;
$$;

grant execute on function join_household(text, text, text) to authenticated;

-- ------------------------------------------------------------
-- RLS rewrite: replace the "using (true)" free-for-all policies
-- with household-scoped ones.
-- ------------------------------------------------------------
drop policy if exists "read all tx" on transactions;
create policy "read household tx" on transactions
  for select to authenticated
  using (household_id = get_my_household_id());

drop policy if exists "read profiles" on profiles;
create policy "read household profiles" on profiles
  for select to authenticated
  using (auth.uid() = id or household_id = get_my_household_id());

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and household_id = get_my_household_id());

drop policy if exists "read own household" on households;
create policy "read own household" on households
  for select to authenticated
  using (id = get_my_household_id());
