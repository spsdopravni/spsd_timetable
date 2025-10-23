# 🔧 Dev/Prod Mode - Mock Data vs Real API

Aplikace automaticky rozpoznává prostředí a přepína mezi mock daty a skutečným API.

## 🎭 Automatické rozpoznávání

### Development Mode (Mock Data)
```bash
npm run dev
```
- ✅ **Mock data** - nevolá API
- ✅ Rychlý development bez limitu API
- ✅ Předvídatelná testovací data
- ✅ Simuluje různé scénáře (zpoždění, noční linky, školní tramvaje...)

**V konzoli uvidíš:**
```
🔧 Environment: development
📊 Using mock data: true
🎭 DEV MODE: Returning mock data instead of calling API
```

### Production Mode (Real API)
```bash
npm run build
npm run preview
```
- ✅ **Skutečné API** - Golemio PID API
- ✅ Real-time data o odjezdech
- ✅ Aktuální polohy vozidel
- ✅ Živá zpoždění

**V konzoli uvidíš:**
```
🔧 Environment: production
📊 Using mock data: false
```

## ⚙️ Manuální Override

Pokud chceš **vynuceně použít mock data i v production** nebo **API v development**:

### 1. Vytvoř soubor `.env`
```bash
cp .env.example .env
```

### 2. Nastav hodnotu
```env
# Vždy používat mock data (i v production)
VITE_USE_MOCK_DATA=true

# Vždy používat API (i v dev módu)
VITE_USE_MOCK_DATA=false

# Automatické rozpoznávání (výchozí)
VITE_USE_MOCK_DATA=
```

### 3. Restart dev serveru
```bash
# Ctrl+C pro zastavení
npm run dev
```

**V konzoli pak uvidíš:**
```
🔧 Environment: development
📊 Using mock data: true
⚙️ Mock data forced via VITE_USE_MOCK_DATA: true
```

## 📊 Mock Data Features

Mock data v `src/utils/mockData.ts` obsahují:

- ✅ 7 různých odjezdů (tramvaje + autobus)
- ✅ Různá zpoždění (-30s, 0s, +1min, +2min)
- ✅ Noční linka (91)
- ✅ Školní tramvaj (#8466)
- ✅ Různé features (WiFi, klimatizace, USB, NP...)
- ✅ Speciální linka 174 do Luky (s Metro B ikonou)
- ✅ Realistické časy (2min, 5min, 8min, 10min, 13min, 15min, 17min)

## 🛠️ Přidání vlastních mock dat

Uprav soubor `src/utils/mockData.ts`:

```typescript
export const getMockDepartures = () => {
  const now = Math.floor(Date.now() / 1000);

  const mockDepartures: Departure[] = [
    {
      arrival_timestamp: now + 120, // za 2 minuty
      route_short_name: "9",
      headsign: "Spojovací",
      is_night: false,
      // ... další properties
    },
    // Přidej další odjezdy...
  ];

  return { departures: mockDepartures, alerts: [] };
};
```

## 🚀 Deployment

Pro deployment na production:

```bash
# Build pro production (automaticky použije API)
npm run build

# Deploy do dist/
# (Upload dist/ folder na hosting)
```

Production build **VŽDY** používá skutečné API (pokud není nastaveno `VITE_USE_MOCK_DATA=true`).

---

**Pro rychlý development: `npm run dev` (mock data)**
**Pro testování API: vytvoř `.env` s `VITE_USE_MOCK_DATA=false`**
**Pro production: `npm run build` (real API)**
