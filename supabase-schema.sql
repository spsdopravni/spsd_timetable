-- Tabulka pro notifikační subscriptions
-- Spusť tohle v Supabase Dashboard → SQL Editor

create table if not exists notification_subscriptions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),

  -- Push subscription z browseru (Web Push API)
  push_endpoint text not null,
  push_p256dh text not null,
  push_auth text not null,

  -- Co sledujeme
  trip_id text not null,
  route_short_name text not null,
  headsign text not null,
  station_name text not null,

  -- Typ upozornění: 'stop' nebo 'minutes'
  notify_type text not null check (notify_type in ('stop', 'minutes')),

  -- Pro typ 'stop' — na jaké zastávce upozornit
  notify_stop_name text,
  notify_stop_id text,           -- GTFS stop_id, robustnější než název
  notify_stop_sequence int,      -- pořadí zastávky v trip-u → server porovnává přímo s last_stop.sequence

  -- Pro typ 'minutes' — kolik minut před příjezdem
  notify_minutes int,

  -- Stav
  notified boolean default false,
  arrival_timestamp bigint not null, -- unix timestamp příjezdu na cílovou zastávku

  -- Auto-cleanup: smaže se po odjezdu
  expires_at timestamptz not null
);

-- Index pro rychlé hledání aktivních subscriptions
create index if not exists idx_active_subs on notification_subscriptions (notified, expires_at)
  where notified = false;

-- Migrace pro existující deploy (idempotentní):
alter table notification_subscriptions add column if not exists notify_stop_id text;
alter table notification_subscriptions add column if not exists notify_stop_sequence int;

-- Auto-cleanup starých záznamů (starších než 1 hodina)
-- Supabase pg_cron extension
select cron.schedule(
  'cleanup-old-notifications',
  '*/10 * * * *', -- každých 10 minut
  $$delete from notification_subscriptions where expires_at < now()$$
);

-- Tabulka pro historický sběr zpoždění → predikce typu "linka 9 ráno mívá +3 min"
create table if not exists delay_snapshots (
  id bigserial primary key,
  observed_at timestamptz default now() not null,
  route_short_name text not null,
  route_type int not null,
  trip_id text,
  delay_seconds int not null,
  hour_of_day smallint not null, -- 0-23 pro snadnou agregaci
  day_of_week smallint not null  -- 0-6
);

create index if not exists idx_delay_route_hour
  on delay_snapshots (route_short_name, hour_of_day, day_of_week);

-- Cleanup starších než 60 dní
select cron.unschedule('cleanup-old-delays')
  where exists (select 1 from cron.job where jobname = 'cleanup-old-delays');
select cron.schedule(
  'cleanup-old-delays',
  '0 4 * * *', -- denně ve 4:00
  $$delete from delay_snapshots where observed_at < now() - interval '60 days'$$
);

-- View: průměrné zpoždění per linka × hodina (pro rychlé čtení z FE)
create or replace view delay_averages as
select
  route_short_name,
  route_type,
  hour_of_day,
  round(avg(delay_seconds)) as avg_delay_seconds,
  count(*) as samples
from delay_snapshots
where observed_at > now() - interval '14 days'
group by route_short_name, route_type, hour_of_day;

-- RLS
alter table delay_snapshots enable row level security;
drop policy if exists "Anyone can insert delay" on delay_snapshots;
drop policy if exists "Anyone can read delay" on delay_snapshots;
create policy "Anyone can insert delay" on delay_snapshots for insert with check (true);
create policy "Anyone can read delay" on delay_snapshots for select using (true);

-- RLS policies
-- Klient přidává hlavičku `x-fcm-token: <jeho FCM token>` ke každému dotazu
-- (viz src/utils/supabase.ts → fetchWithFcmToken). RLS ji čte přes
-- `current_setting('request.headers', true)` a vyžaduje match s push_endpoint
-- pro SELECT/UPDATE/DELETE. INSERT zůstává otevřený.
alter table notification_subscriptions enable row level security;

-- Smaž staré "anyone" policies (idempotentní migrace)
drop policy if exists "Anyone can insert" on notification_subscriptions;
drop policy if exists "Anyone can read own" on notification_subscriptions;
drop policy if exists "Anyone can update" on notification_subscriptions;
drop policy if exists "Anyone can delete" on notification_subscriptions;

-- INSERT: kdokoliv (anon klient se musí umět přihlásit k odběru bez auth)
create policy "Insert own subs" on notification_subscriptions
  for insert with check (true);

-- SELECT: jen řádky odpovídající FCM tokenu v hlavičce
create policy "Select own subs" on notification_subscriptions
  for select using (
    push_endpoint = (current_setting('request.headers', true)::jsonb ->> 'x-fcm-token')
  );

-- UPDATE: jen vlastní (např. notified flag)
create policy "Update own subs" on notification_subscriptions
  for update using (
    push_endpoint = (current_setting('request.headers', true)::jsonb ->> 'x-fcm-token')
  );

-- DELETE: jen vlastní
create policy "Delete own subs" on notification_subscriptions
  for delete using (
    push_endpoint = (current_setting('request.headers', true)::jsonb ->> 'x-fcm-token')
  );
