# 🕐 Test synchronizace času a headerů

## ✅ **Implementace dokončena**

Všechny stránky nyní používají **globální synchronizovaný čas** z DataContext:

### 📍 **Synchronizované stránky:**
1. **Index** (`/`) - Vozovna Motol
2. **Pragensis** (`/pragensis`) - Vyšehrad + Svatoplukova
3. **Moravská** (`/moravska`) - Jana Masaryka, Náměstí Míru, Šumavská
4. **Košíře** (`/kosire`) - Košíře Left + Right

### ⚙️ **Jak funguje synchronizace:**

#### 🕒 **Globální čas:**
- **DataContext** obsahuje `time.currentTime` a `time.timeOffset`
- Čas se **synchronizuje** s https://worldtimeapi.org/api/timezone/Europe/Prague
- Aktualizuje se každé **2 sekundy** pro všechny komponenty současně
- **Timeoffset** se načítá při startu aplikace

#### 📄 **Header synchronizace:**
- Všechny stránky používají **stejný header design**
- **Čas** se zobrazuje v pravém horním rohu
- **Datum** s českými názvy dnů a měsíců
- **Logo** s seasonal změnami (zima/léto/vánoce/atd.)

#### 🔄 **Automatická aktualizace:**
```typescript
// V DataContext.tsx
useEffect(() => {
  const timer = setInterval(() => {
    const localTime = new Date();
    const adjustedTime = new Date(localTime.getTime() + time.timeOffset);
    setTime(prev => ({ ...prev, currentTime: adjustedTime }));
  }, 2000);

  return () => clearInterval(timer);
}, [time.timeOffset]);
```

### 🧪 **Jak testovat synchronizaci:**

1. **Otevři aplikaci** na `http://localhost:4173/`
2. **Zkontroluj čas** v headeru Index stránky
3. **Přejdi na jiné stránky** (`/pragensis`, `/moravska`, `/kosire`)
4. **Ověř**, že čas je **identický** na všech stránkách
5. **Počkej 2 sekundy** - čas se má aktualizovat současně všude

### ✅ **Výsledek:**
- ✅ **Čas je synchronizovaný** napříč všemi stránkami
- ✅ **Header design je konzistentní**
- ✅ **Datum a čas** se zobrazuje ve stejném formátu
- ✅ **Automatické aktualizace** každé 2 sekundy
- ✅ **Server synchronization** s worldtimeapi.org
- ✅ **Seasonal logos** fungují na všech stránkách

### 🔍 **Technical details:**

**DataContext poskytuje:**
```typescript
interface TimeState {
  currentTime: Date;
  timeOffset: number;
}
```

**Každá stránka používá:**
```typescript
const { time, isWinterPeriod } = useDataContext();
const currentTime = time.currentTime;
```

**Header zobrazuje:**
```typescript
{currentTime.toLocaleTimeString('cs-CZ')}
{currentTime.toLocaleDateString('cs-CZ', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
```

### 🎯 **Benefits:**
- **Konzistentní UX** - uživatel vidí stejný čas na všech stránkách
- **Server synchronization** - čas je přesný podle českého času
- **Performance** - jeden globální timer místo více lokálních
- **Maintainability** - jedna implementace pro všechny stránky