
# Tramvajové odjezdy Praha

Webová aplikace pro sledování odjezdů tramvají v Praze s aktuálním počasím.

## 🚋 Funkce

- **Sledování odjezdů tramvají** - Zobrazení aktuálních odjezdů z vybraných zastávek
- **Vyhledávání zastávek** - Rychlé vyhledávání tramvajových zastávek v Praze
- **Informace o trasách** - Detaily o tramvajových linkách a jejich trasách
- **Aktuální počasí** - Widget s aktuálním počasím na základě polohy
- **Responzivní design** - Optimalizováno pro mobilní zařízení i desktop

## 🛠️ Technologie

Projekt je postaven na moderních webových technologiích:

- **React 18** - Frontend framework
- **TypeScript** - Typová bezpečnost
- **Vite** - Rychlý build nástroj
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Komponenty uživatelského rozhraní
- **TanStack Query** - Správa stavu a cache
- **React Router** - Routing
- **Lucide React** - Ikony

## 🚀 Rychlý start

### Požadavky

- Node.js (doporučujeme instalaci přes [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm nebo jiný package manager

### Instalace a spuštění

```bash
# 1. Klonování repozitáře
git clone <YOUR_GIT_URL>

# 2. Přechod do složky projektu
cd <YOUR_PROJECT_NAME>

# 3. Instalace závislostí
npm install

# 4. Spuštění vývojového serveru
npm run dev
```

Aplikace bude dostupná na `http://localhost:5173`

### Dostupné skripty

```bash
npm run dev          # Spuštění vývojového serveru
npm run build        # Build produkční verze
npm run preview      # Náhled produkční verze
npm run lint         # Kontrola kódu
```

## 📱 Použití

1. **Výběr zastávky** - Použijte vyhledávání pro nalezení tramvajové zastávky
2. **Zobrazení odjezdů** - Aplikace zobrazí aktuální odjezdy tramvají
3. **Počasí** - V hlavičce vidíte aktuální počasí pro vaši polohu
4. **Nastavení** - Můžete si upravit oblíbené zastávky a další preference


## 🔧 Konfigurace

Aplikace využívá následující API:

- **PID API** - Pro data o tramvajích a zastávkách
- **OpenWeatherMap API** - Pro informace o počasí

## 📂 Struktura projektu

```
src/
├── components/         # React komponenty
│   ├── ui/            # Základní UI komponenty (shadcn/ui)
│   ├── WeatherHeader.tsx
│   ├── TramDepartures.tsx
│   └── ...
├── pages/             # Stránky aplikace
├── hooks/             # Custom React hooks
├── utils/             # Utility funkce a API
├── types/             # TypeScript definice
└── lib/               # Knihovny a konfigurace
```

## 📄 Licence

Tento projekt je open source a dostupný pod MIT licencí.

---

Vytvořeno pro SPSD By Adam ''Brozovec'' Brož
```
</lov-codee>
