# SPŠD Odjezdová tabule

Webová aplikace zobrazující odjezdové tabule MHD pro budovy Střední průmyslové školy dopravní v Praze. Zobrazuje odjezdy tramvají a autobusů v reálném čase, aktuální počasí a zprávy od správců.

Vytvořeno pro SPŠD — Adam "Brozovec" Brož

## Popis projektu

Aplikace slouží jako digitální odjezdová tabule umístěná na displejích v budovách školy. Zobrazuje živé odjezdy MHD ze zastávek v okolí daného pracoviště, přizpůsobená sezonními tématy (Vánoce, jaro apod.) a zobrazuje vlastní zprávy od administrátorů (oznámení, novinky, zajímavosti).

**Škola:** Střední průmyslová škola dopravní, Praha  
**Hlavní budova:** Motolská 3, Praha 5 — Motol

## Funkce

- Živé odjezdy tramvají a autobusů (API Golemio / PID)
- Automatické střídání zastávek (Vozovna Motol / Motol, každých 15 sekund)
- Robot s animovanými zprávami (pozdravy, novinky, zajímavosti, svátky)
- Sezonní témata (Vánoce, Velikonoce, léto...)
- Počasí v reálném čase
- Admin panel pro správu zpráv a tabulí
- Podpora více budov / tabulí
- Role-based přístup (admin / správce tabule)
- PWA — instalovatelné jako aplikace

## Tech stack

| Technologie | Verze / Popis |
|---|---|
| React | 18 |
| TypeScript | 5 |
| Vite | 5 |
| Tailwind CSS | 3 |
| Supabase | Backend, auth, databáze (PostgreSQL) |
| React Router | v6 — routování |
| Framer Motion | Animace robota |
| Font Awesome | 6.5 — ikony (CDN) |
| Golemio API | Odjezdy MHD Praha |
| WeatherAPI | Aktuální počasí |

## Architektura

```
Prohlížeč (React SPA)
    ├── /            → Index (výběr tabule nebo přechod na Motol)
    ├── /menu        → Menu výběru tabule (načítá tabule ze Supabase)
    ├── /spsmotol    → Odjezdová tabule Motol (Golemio API)
    └── /admin       → Admin panel (Supabase auth + DB)

Supabase (PostgreSQL + Auth)
    ├── boards         → Tabule (budovy školy)
    ├── profiles       → Uživatelé s rolemi
    ├── board_managers → Přiřazení správců k tabulím
    ├── messages       → Vlastní zprávy (zobrazují se v robotovi)
    └── fun_facts      → Zajímavosti (zobrazují se v robotovi)
```

## Instalace a spuštění

### Požadavky

- Node.js 18+
- npm nebo pnpm
- Účet na [Supabase](https://supabase.com) (free tier stačí)
- Klíč API pro [Golemio](https://api.golemio.cz) (pro odjezdy)
- Klíč API pro [WeatherAPI](https://www.weatherapi.com) (pro počasí, volitelné)

### Kroky

```bash
# 1. Naklonujte repozitář
git clone <url-repozitare>
cd spsd_timetable

# 2. Nainstalujte závislosti
npm install

# 3. Vytvořte soubor .env.local a vyplňte proměnné (viz níže)

# 4. Nastavte Supabase databázi (viz sekce Supabase nastavení)

# 5. Spusťte vývojový server
npm run dev
```

Aplikace poběží na `http://localhost:5173`.

## Supabase nastavení

### 1. Vytvoření projektu

1. Přejděte na [app.supabase.com](https://app.supabase.com)
2. Vytvořte nový projekt
3. Zkopírujte **Project URL** a **anon public** klíč do `.env.local`

### 2. Spuštění SQL schématu

V Supabase dashboardu otevřete **SQL Editor** a spusťte následující SQL:

```sql
-- Boards (tabule)
CREATE TABLE boards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  stops text[] DEFAULT '{}',
  route text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User profiles with roles
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
  created_at timestamptz DEFAULT now()
);

-- Which managers manage which boards
CREATE TABLE board_managers (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, board_id)
);

-- Messages
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'message' CHECK (type IN ('message', 'news', 'fact', 'alert')),
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  priority int DEFAULT 0,
  show_from timestamptz,
  show_until timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies pro boards
CREATE POLICY "Public read active boards" ON boards FOR SELECT USING (active = true);
CREATE POLICY "Auth manage boards" ON boards FOR ALL USING (auth.role() = 'authenticated');

-- Policies pro profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Auth read all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');

-- Policies pro messages
CREATE POLICY "Public read messages" ON messages FOR SELECT USING (active = true);
CREATE POLICY "Auth manage messages" ON messages FOR ALL USING (auth.role() = 'authenticated');

-- Policies pro board_managers
CREATE POLICY "Auth read board_managers" ON board_managers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage board_managers" ON board_managers FOR ALL USING (auth.role() = 'authenticated');

-- Fun facts (zajímavosti)
CREATE TABLE fun_facts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fun_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active facts" ON fun_facts FOR SELECT USING (active = true);
CREATE POLICY "Auth manage facts" ON fun_facts FOR ALL USING (auth.role() = 'authenticated');

-- Trigger: automaticky vytvoří profil při registraci / pozvání uživatele
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'manager')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### 3. Vytvoření prvního admin uživatele

1. V Supabase dashboardu přejděte do **Authentication → Users**
2. Klikněte **Invite user** a zadejte svůj e-mail
3. Otevřete odkaz z e-mailu a nastavte heslo
4. Spusťte v SQL Editoru (nahraďte e-mail):

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'vas@email.cz';
```

### 4. Přidání výchozí tabule Motol

```sql
INSERT INTO boards (name, slug, address, stops, route, active)
VALUES (
  'Budova Motol',
  'motol',
  'Motolská 3, Praha 5',
  ARRAY['Vozovna Motol', 'Motol (metro A, B)'],
  '/spsmotol',
  true
);
```

## Environment variables

Vytvořte soubor `.env.local` v kořeni projektu:

| Proměnná | Popis | Povinná |
|---|---|---|
| `VITE_SUPABASE_URL` | URL vašeho Supabase projektu | Ano |
| `VITE_SUPABASE_ANON_KEY` | Anon (public) klíč Supabase | Ano |
| `VITE_GOLEMIO_API_KEY` | API klíč pro Golemio (odjezdy MHD) | Ano |
| `VITE_WEATHER_API_KEY` | API klíč pro WeatherAPI (počasí) | Ne |

Příklad `.env.local`:

```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOLEMIO_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
VITE_WEATHER_API_KEY=abc123def456
```

> **Pozor:** Soubor `.env.local` nesmí být commitován do gitu (je zahrnut v `.gitignore`).

## Vercel deployment

### Nasazení

1. Pushněte kód na GitHub
2. Přihlaste se na [vercel.com](https://vercel.com)
3. Klikněte **Add New Project** a vyberte váš GitHub repozitář
4. Framework preset: **Vite**
5. Klikněte **Deploy**

### Environment variables na Vercel

Po deploymentu přejděte do **Settings → Environment Variables** a přidejte všechny proměnné ze sekce výše.

Poté spusťte nový deployment: **Deployments → Redeploy**.

### Vlastní doména

V **Settings → Domains** přidejte vlastní doménu (např. `tabule.sps-dopravni.cz`).

> Nezapomeňte přidat doménu také do **Supabase → Authentication → URL Configuration → Site URL** a **Redirect URLs**.

## Admin panel

Admin panel je dostupný na adrese `/admin`.

### Přihlášení

Použijte e-mail a heslo nastavené v Supabase Authentication.

### Role uživatelů

| Role | Možnosti |
|---|---|
| **Administrátor** | Plný přístup: správa tabulí, zpráv, uživatelů; pozvaní nových uživatelů; změna rolí |
| **Správce tabule** | Omezený přístup: spravuje pouze zprávy pro tabule, ke kterým má přiřazený přístup |

### Sekce admin panelu

**Přehled** — statistiky (počet tabulí, zpráv, uživatelů), rychlé akce, přehled posledních zpráv

**Tabule** — seznam budov/tabulí. Admin může přidávat a editovat (název, slug, adresa, zastávky MHD, route, aktivní/neaktivní). Správce vidí pouze své tabule.

**Zprávy** — správa zpráv zobrazovaných na tabulích roboty:
- Typ: Zpráva / Novinka / Zajímavost
- Přiřazení ke konkrétní tabuli nebo globálně (všem tabulím)
- Priorita (vyšší = dřív se zobrazí)
- Volitelné datum zobrazení (od / do)
- Aktivace / deaktivace

**Uživatelé** (pouze admin) — pozvání nových uživatelů, přiřazení tabulí ke správcům, změna rolí, smazání uživatelů

### Pozvání nového správce

1. Přejděte do **Uživatelé → Pozvat uživatele**
2. Vyplňte e-mail, jméno a roli
3. Pro roli Správce vyberte tabule, ke kterým má mít přístup
4. Klikněte **Odeslat pozvánku**

Uživatel obdrží e-mail s odkazem pro nastavení hesla.

> **Poznámka:** Funkce pozvánek vyžaduje, aby projekt na Supabase měl povoleno odesílání e-mailů (výchozí nastavení u nových projektů). Zvoucí admin musí mít v projektu service_role klíč nebo Supabase musí mít povolené `inviteUserByEmail` pro authenticated uživatele.

## Struktura projektu

```
spsd_timetable/
├── public/
│   └── pictures/              # Obrázky (loga, robot, metro ikony)
├── src/
│   ├── components/
│   │   ├── DailyRobot.tsx     # Animovaný robot se zprávami
│   │   ├── TramDeparturesConnected.tsx
│   │   ├── WeatherWidget.tsx
│   │   └── ...
│   ├── context/
│   │   ├── DataContext.tsx    # Sdílená data (čas, sezonní téma)
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   └── useCustomMessages.ts  # Hook pro načítání zpráv ze Supabase
│   ├── lib/
│   │   └── supabase.ts        # Supabase client + TypeScript typy
│   ├── pages/
│   │   ├── Admin.tsx          # Admin panel (kompletní CRUD)
│   │   ├── Index.tsx          # Úvodní stránka
│   │   ├── Menu.tsx           # Výběr tabule (načítá z DB)
│   │   └── Spsmotol.tsx       # Odjezdová tabule Motol
│   └── App.tsx                # Routování
├── index.html
├── .env.local                 # Lokální env proměnné (neni v gitu)
├── vite.config.ts
└── tailwind.config.ts
```

## Vývoj

```bash
# Vývojový server
npm run dev

# Build pro produkci
npm run build

# Preview produkčního buildu
npm run preview

# Kontrola kódu (ESLint)
npm run lint
```

## Licence

Interní projekt školy SPŠD Praha. Není určeno pro veřejné použití bez souhlasu školy.
