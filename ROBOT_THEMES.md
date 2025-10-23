# 🤖 Návod: Tématické varianty robůtka

Aplikace nyní podporuje automatické přepínání vzhledu robůtka podle období roku!

## 📅 Přehled témat a období

Robůtek se automaticky mění podle aktuálního data:

| Téma | Období | Soubor obrázku |
|------|--------|----------------|
| 🎃 **Halloween** | 20. října - 1. listopadu | `/public/pictures/robot-halloween.png` |
| 🎄 **Vánoce** | 1. - 30. prosince | `/public/pictures/robot-christmas.png` |
| 🎆 **Silvestr/Nový rok** | 31. prosince - 2. ledna | `/public/pictures/robot-newyear.png` |
| 🐰 **Velikonoce** | 10. - 20. dubna | `/public/pictures/robot-easter.png` |
| 🌸 **Jaro** | 1. března - 31. května | `/public/pictures/robot-spring.png` |
| ☀️ **Léto** | 1. června - 31. srpna | `/public/pictures/robot-summer.png` |
| 🍂 **Podzim** | 1. září - 19. října | `/public/pictures/robot-autumn.png` |
| ❄️ **Zima** | 3. ledna - 28. února | `/public/pictures/robot-winter.png` |
| 🤖 **Klasický** | Ostatní dny (fallback) | `/public/pictures/robotz.png` |

## 🎨 Jak přidat nový obrázek robota

### Krok 1: Připravte obrázek
- Formát: **PNG** (s průhledným pozadím)
- Doporučená velikost: **šířka ~300-500px, výška ~400-600px**
- Robot by měl směřovat **doleva** (← směr)
- Ukládejte do složky: `/public/pictures/`

### Krok 2: Pojmenování souboru
Používejte konzistentní naming podle tématu:
```
robot-halloween.png   ← Halloween téma
robot-christmas.png   ← Vánoční téma
robot-summer.png      ← Letní téma
...atd.
```

### Krok 3: Žádný další kód není potřeba!
Stačí vytvořit obrázek s názvem podle tabulky výše a umístit ho do `/public/pictures/`.

Aplikace automaticky:
✅ Detekuje aktuální datum
✅ Vybere správný obrázek
✅ Zobrazí tématického robota
✅ Pokud obrázek neexistuje, použije výchozí `robotz.png`

## 🔧 Pokročilé: Úprava období nebo přidání nového tématu

Pokud chcete změnit období nebo přidat úplně nové téma:

1. Otevřete soubor: `src/components/DailyRobot.tsx`
2. Najděte funkci `getRobotTheme()`
3. Přidejte nebo upravte podmínku:

```typescript
// Příklad: Přidat téma pro Den dětí (1. června)
if (month === 6 && day === 1) {
  return {
    image: '/pictures/robot-children-day.png',
    theme: 'childrenday'
  };
}
```

## 🎭 Tipy pro tvorbu tématických robotů

- **Halloween**: Přidejte dýni, klobouk čarodějnice, nebo pavoučí síť
- **Vánoce**: Čepice Santa Clause, vánoční stromek, dárky
- **Léto**: Sluneční brýle, koupací plavky, nafukovací kruh
- **Jaro**: Květiny, motýli, pastelové barvy
- **Podzim**: Listí, svetr, horká čokoláda
- **Zima**: Čepice, šála, rukavice, sněhulák

## 📝 Poznámka
Priorita kontroly období je shora dolů - pokud je například 31. prosince, použije se Silvestr/Nový rok místo obecných Vánoc.

---

Vytvořeno pro SPŠD Timetable App 🚋
