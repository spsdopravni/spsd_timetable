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

-- RLS policies
alter table notification_subscriptions enable row level security;

-- Kdokoliv může vložit (anon)
create policy "Anyone can insert" on notification_subscriptions
  for insert with check (true);

-- Kdokoliv může číst svoje (podle push_endpoint)
create policy "Anyone can read own" on notification_subscriptions
  for select using (true);

-- Kdokoliv může updatovat (notified flag)
create policy "Anyone can update" on notification_subscriptions
  for update using (true);

-- Kdokoliv může smazat
create policy "Anyone can delete" on notification_subscriptions
  for delete using (true);
