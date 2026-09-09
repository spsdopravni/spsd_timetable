# ARBITRÁŽ: SPŠD odjezdová tabule

## 1) VERDIKT

**Pravdu má uživatel v tom, že aplikace jde doladit — ale nemá pravdu v tom, že tím vyřeší oba symptomy; pravdu má učitel v tom, že současné řešení není provozuschopné 24/7, ale nemá pravdu v tom, že „to nejde“, protože nikdo nezměřil ani jedno číslo z cílového zařízení.** Symptom (a) je aplikační a opravitelný v řádu hodin; symptom (b) **nemá v kódu prokázanou příčinu** a řeší se provozní vrstvou (systemd + auto-recovery), ne refaktorem.

Pořadí kroků, závazně:

| # | Krok | Čas | Kdo měl pravdu |
|---|---|---|---|
| 0 | 6 čísel z Pi + zjistit, čím a na jakou URL se to spouští | 20 min | měřicí pozice |
| 1 | Provozní pojistka: systemd `Restart=always`, noční restart, `location.reload` v ErrorBoundary + globální `error`/`unhandledrejection` | 30 min | učitel / runtime pozice |
| 2 | `src/main.tsx:7` podmíněně + blokující CDN z `index.html:50,56-57` pryč | 60 min | uživatel (změřeno v buildu) |
| 3 | Pět triviálních code fixů (seznam v §5) | 90 min | uživatel |
| 4 | **Změřit znovu stejnou metodikou** a rozhodnout, jestli pokračovat | 30 min | měřicí pozice |
| 5 | Střední refaktor (rozdělení contextu, registr stanic, timeouty v `pidApi.ts`) — jen pokud krok 4 ukáže, že je potřeba | 1–2 dny | uživatel |
| 6 | Jiná distribuce / jiný runtime / jiný HW — **jen** pokud floor test v kroku 0 propadne | dny | učitel |

Kroky 1 a 2 udělejte i v případě, že se spor rozhodne opačně, než čekáte. Nic nevylučují a nic nerozbíjejí.

---

## 2) ROZKLAD SYMPTOMŮ

Tohle je jádro sporu: **oba symptomy mají jinou příčinu a každý vyhrává jiná strana.** Většina hádky vzniká z toho, že se o nich mluví jako o jedné věci („appka je pomalá a padá“).

### Symptom (a) — trhané animace, nízké FPS

**Nejpravděpodobnější příčina: kolize jediné povolené animace s vteřinovým re-renderem celého stromu na jednom vlákně.**

Ověřil jsem přímo v `src/index.css:109-122`, a je to důležitější, než jak s tím pracoval audit:

```css
* { animation-duration: 0s !important; transition-duration: 0s !important; ... }
.robot-animation, .robot-animation * { animation-duration: revert !important; ... }
```

Tedy: **v celé aplikaci jsou vypnuté všechny CSS animace kromě robota.** Z toho plyne přesná diagnóza:

1. **Robot je jediná pohyblivá vrstva na obrazovce** (mimo sezónu sněžení — dnes 9. 9. Snowfall vůbec není namountovaný, `DataContext.tsx:330-405` ho pouští jen 27. 11.–6. 1.). Nemáte tedy „appku plnou animací“, máte jednu animaci.
2. Ta jedna animace běží kvůli `DailyRobot.tsx:243` (`}, [isAnimating]`) s periodou **21 s místo 60 s** — ověřeno, `setInterval(startAnimation, 60000)` na ř. 237 se cleanupem nikdy nedožije prvního tiknutí. Aktivní pohyb transformu je podle verifikace ~12 s z 21 s, tedy **duty cycle ~57 % místo zamýšlených ~20 %**.
3. Framer-motion tuhle animaci nepočítá na kompozitoru, ale **v JS na hlavním vlákně 60×/s** — a to je hlavní vlákno, na kterém současně probíhá 2–3× za sekundu rekonciliace ~450–500 elementů (`DataContext.tsx:439` tik + `Spsmotol.tsx:93/257` živé hodiny + `TramDeparturesConnected.tsx:44` vlastní interval ×2 instance).
4. Blanket vypínač na `index.css:109` se framer-motion **vůbec netýká** (animuje inline `style`, ne CSS animace). „Low-end mód“ je tedy naruby: vypnul jste levné composited animace a nechal běžet tu jedinou drahou.

**Strategie, která to řeší: optimalizace aplikace (pozice uživatele).** Konkrétně `DailyRobot.tsx:243 → []` + ref, odstranění duplicitního intervalu na `TramDeparturesConnected.tsx:37-49`, a vytažení vteřinového tiku z globálního contextu. To jsou jednotky až desítky řádků.

**Ale — jedna nezměřená proměnná může tuhle diagnózu přebít:** pokud Pi žene 55" TV ve **3840×2160** nebo pokud `chrome://gpu` hlásí *Software only*, je hrdlo fill-rate a `drop-shadow(4px 4px 12px)` na 256px robotovi (`DailyRobot.tsx:322`) přes celou šířku panelu stojí 4× víc, než kdokoli počítá. To je faktor, který žádný React fix nesundá, a řeší se **jedním řádkem v `cmdline.txt`**. Proto je krok 0 před krokem 3.

*Poctivé přiznání směrem k uživateli:* verifikační kolo srazilo tři z pěti „FPS nálezů“ na low/medium — `index.css:131` (translateZ) je cargo-cult, ale vrstvy jsou malé a dopad nízký; Snowfall je 41 dní v roce a dnes neběží; memoizace context value sama o sobě neušetří skoro nic, protože Spsmotol si čas čte přímo. Reálně velký zůstal **jeden**: robot.

### Symptom (b) — po delším běhu to zatuhne

**Nejpravděpodobnější příčina: neznámá. A to je nejdůležitější věta celé arbitráže.**

Audit prošel celý `src/` a **nenašel jedno rostoucí pole**: `apiCache` má strop 100 (`apiCache.ts:16` + `evictOldest` ř. 87), historie v meteo hooku je stropovaná na 8 vzorků, všechny `setInterval` mají cleanup, počet timerů za 24 h neroste. To je silný negativní nález a mluví **proti** hypotéze „leak v Reactu“.

Tři hypotézy, které audit nabídl, verifikace postupně oslabila:

- **518 000 meteo fetchů/den → GC tlak → OOM.** Neobstojí. Odpovědi jsou ~100 B JSON, krátkoživotné objekty zametá scavenger. Navíc `useMeteoStation.ts:264-277` má **circuit breaker**, který audit přehlédl: po 3 neúspěšných cyklech `setAvailable(false)` polling natrvalo zastaví. Zbývá úzký, ale reálný scénář: fetch, který se **nikdy neodmítne** (TCP bez RST, zamrzlý ESP uprostřed odpovědi) → `Promise.allSettled` se nevyřeší → breaker se nespustí → fronta pending requestů roste bez stropu. To je skutečná díra a opravuje se šesti řádky (in-flight guard + `AbortSignal.timeout`), ale je to okrajová větev, ne hlavní mechanismus.
- **Supabase poller / Firebase SW.** Jeden fetch za 30 s. Zanedbatelné pro stabilitu (významné pro start, viz níže).
- **Nezrušené `setTimeout` v DailyRobotu.** Ohraničené, neakumulují se.

Naproti tomu tři fakta, která jsem ověřil a která symptom (b) vysvětlují **beze zbytku a bez ohledu na kvalitu JS**:

1. `grep -rn "location.reload|requestFullscreen|wakeLock|navigator.onLine" src/` → **nula výskytů.** `ErrorBoundary.tsx:44` čeká na lidský klik. Tabule bez klávesnice se po jakékoli neodchycené chybě **nikdy sama nezotaví**. Jedna selhaná `import()` lazy chunku po redeployi (typicky když se přebuildí, zatímco tab běží se starým manifestem) = trvale mrtvá obrazovka. Vypadá to přesně jako „zatuhlo po 24 h“.
2. `find` přes celý repo na `*.service`, `*.sh`, `nginx*`, `Dockerfile*` → **nula souborů.** Není systemd unit s `Restart=always`, není watchdog, není noční restart. Když Chromium spadne, nic ho nezvedne.
3. `package.json:7,9` — **`dev` i `start` jsou `vite build && vite preview`.** Pokud tabule startuje takhle, Pi při každém bootu pouští rollup + terser s `passes: 2` (`vite.config.ts:37`) a pak vedle Chromia trvale sedí Node proces. Na 1 GB RAM je to OOM otázka času.

**Strategie, která to řeší: provozní vrstva (pozice učitele / runtime pozice), ne kód.** Za 15 minut práce zavřete celou třídu problémů — včetně těch, které nikdo nenajde (fragmentace heapu Chromia, GPU texture cache, kernel OOM).

**Závěr k (b): uživatel tenhle symptom nemá čím vysvětlit. To je nejsilnější bod učitele v celém sporu** — ne proto, že by měl pravdu ohledně hardwaru, ale proto, že řešení bez auto-recovery není pro provoz 24/7 u vchodu školy přijatelné, i kdyby v něm nebyl jediný bug.

**Bonusový podpůrný symptom:** `useMeteoStation.ts:271` volá `setAvailable(false)` a `setAvailable(true)` se **nevolá nikde**. Po třech selháních (jeden krátký výpadek WiFi v noci) je meteo panel mrtvý až do reloadu. To je funkční bug, který sám o sobě vypadá jako „ráno to jelo, večer už ne“.

---

## 3) SCÉNÁŘE

| Scénář | Vyhrává | Proč | Co je ztráta času |
|---|---|---|---|
| **Pi 4 (2–4 GB), 1080p, HW akcelerace OK** | **Uživatel** (kroky 2–3) + provozní pojistka | 638 kB JS a 2–3 rekonciliace/s na obsah, který se mění 1×/min, je 20× víc práce než potřeba. Robot fix + odstranění duplicitních tiků dostane FPS nahoru. | Výměna distribuce (400 MB z 4 GB = šum), rewrite do vanilla, nový HW |
| **Pi 4, ale TV běží ve 4K** | **Konfigurace OS** (krok 0/1 z OS pozice) | Fill-rate je 4×. `video=HDMI-A-1:1920x1080@60` v `cmdline.txt` je větší výhra než všech pět code fixů dohromady, a je zdarma. Na 55" ze vzdálenosti chodby to nikdo nepozná. | Ladit memoizaci contextu, dokud běží 4K |
| **`chrome://gpu` hlásí Software only** | **Konfigurace OS** | `react-snowfall` i kompozice běží přes SwiftShader na CPU. Všechna pořadí oprav z auditu jsou vylosovaná, dokud tohle platí. Fix = `dtoverlay=vc4-kms-v3d` + `--use-gl=egl`. | Cokoli v `src/` |
| **Pi 3 / Zero 2W (512 MB – 1 GB)** | **Učitel, částečně** | 638 kB JS + Chromium renderer + GPU proces + SW proces + framebuffer 55" panelu na 512 MB je aritmeticky neudržitelné. Tady je Pi OS Lite + cage rozdíl mezi „jede“ a „nejede“, a rewrite do statického HTML je obhajitelný. | Trvat na tom, že to jde doladit v Reactu |
| **`get_throttled != 0x0` (podpětí / throttling)** | **Nikdo z nich; hardware setup** | Nenulová hodnota znamená, že Pi po část času neběželo na 1,5 GHz. Všechna měření výkonu jsou pak měřením napájecího kabelu. Fix stojí 400 Kč za oficiální 5,1 V/3 A zdroj a chladič. | Dva dny refaktoru |
| **Opravdu jen leak/bug v kódu** | **Uživatel** — ale i tak potřebuje krok 1 | Neexistenci leaku nelze dokázat. Po opravě všech nálezů dostanete pomalejší růst, ne nulový. Noční restart to uzavře definitivně. | Hledat leak, který podle auditu není |
| **Tabule míří na `/` nebo na neexistující routu** | **Nikdo; je to překlep** | `App.tsx:87-105` definuje `/spsmoravska`, `/pidday/letna`, `/pidday/motol`, `/depo-kacerov` — ne `/moravska`, `/letna`, `/pidday`, `/depokacerov` ze zadání. A `/` je marketingová landing page (`Index.tsx`, framer-motion scroll-reveal), ne tabule. | Úplně všechno ostatní |

---

## 4) ROZHODOVACÍ KRITÉRIA

Formulováno jako „když naměříš X, udělej Y“. Všechno v této sekci je 20 minut práce a rozhodne to spor líp než celý audit.

**K0 — Čím a kam to míří** (10 s)
```
ps -eo args | grep -i chromium | tr ' ' '\n' | grep -E '^--|^http'
```
- URL je `/` nebo `/moravska`/`/letna`/`/pidday`/`/depokacerov` → **stop, oprav URL v launcheru a měř znovu.** Zbytek sporu je bezpředmětný.
- V příkazu je `npm run dev` nebo `npm start` → **stop.** `package.json:7` je `vite build && vite preview`. Přejdi na nginx + předpřipravený `dist/`, teprve pak měř cokoli.

**K1 — Napájení a teplota** (5 s)
```
vcgencmd get_throttled ; vcgencmd measure_temp
```
- `0x0` po ≥24 h běhu → hardware je čistý, pokračuj na K2.
- Cokoli jiného (typicky `0x50000`) → **vyměň zdroj a přidej chladič, a do té doby neměř nic jiného.** Bity 16–19 pamatují historii od bootu.

**K2 — Rozlišení** (5 s)
```
cat /sys/class/drm/card*-HDMI-A-1/modes | head -1
```
- `3840x2160` → přidej `video=HDMI-A-1:1920x1080@60D` do `/boot/firmware/cmdline.txt`, rebootuj, změř znovu. **Očekávej 2–4× na fill-rate bound scénách.** Tohle udělej před jakýmkoli zásahem do `src/`.
- `1920x1080` → tenhle argument je mrtvý, pokračuj.

**K3 — GPU cesta** (30 s)
`chrome://gpu`, řádky *Canvas* a *Compositing*:
- „Software only“ / „Disabled“ → `dtoverlay=vc4-kms-v3d` v `config.txt` + `--use-gl=egl --enable-gpu-rasterization --ignore-gpu-blocklist`. Do té doby jsou GPU nálezy z auditu 5–10× dražší, než audit odhaduje, a pořadí oprav je špatně.
- „Hardware accelerated“ → `index.css:131` a Snowfall jsou minoritní, jdi rovnou na robota a rendery.

**K4 — Floor test** (20 min, rozhodne celý spor)

Statická HTML stránka: 14 řádků textu, hodiny tikající 1×/s, jeden `div` animovaný CSS `@keyframes` s `translate3d` přes celou šířku, rAF čítač frame time. Spusť ve stejném Chromiu, stejný fullscreen, stejná TV, 10 minut.
- **p95 frame time ≤ 20 ms → hardware STAČÍ. Spor vyhrál uživatel, jde se ladit React** a učitel má argument jen k symptomu (b).
- **p95 > 50 ms → hardware nebo konfigurace nestačí, ladění Reactu je marnost.** Vrať se na K2/K3, a pokud jsou čisté, má pravdu učitel a jde se na plán B.

**K5 — Meteo je fantom?** (17 s)
```
sudo tcpdump -nn -i any 'host 10.0.10.208 and tcp[tcpflags] & tcp-syn != 0' -c 100
```
`vite.config.ts:9-18` definuje proxy na `/meteo` **jen pod `server`, ne pod `preview`**, a v repu není nginx konfigurace. Pokud tabule běží přes `vite preview`, všech 12 fetchů vrací lokální 404, circuit breaker se do 6 s spustí a **celý nález „518 400 requestů/den“ je nulový**.
- Doběhne za ~17 s → nález platí, oprav `POLL_INTERVAL` + abort + guard.
- Nedoběhne → **škrtni ho ze seznamu** a soustřeď se jinam.

**K6 — Je to vůbec leak?** (24 h čekání, 10 min nastavení)
```
while true; do echo "$(date +%s),$(ps -eo rss,args | grep -- '--type=renderer' | grep -v grep | awk '{s+=$1} END{print s+0}')" >> ~/soak.csv; sleep 60; done
```
- Růst > 5 MB/h monotónně → leak existuje, jdi po něm heap snapshoty s odstupem 1 h a 4 h.
- Růst < 1 MB/h nebo plató po 2–3 h → **leak neexistuje, hledat ho je ztráta času.** Příčina (b) je jinde: `dmesg -T | grep -i 'oom\|killed process'`, ErrorBoundary, nebo pád Chromia.

**K7 — Až to příště zatuhne, NEREBOOTUJ.** Toto je nejcennější měření z celého protokolu, protože rozlišuje čtyři různé příčiny se čtyřmi různými fixy:
```
ps aux | grep -c '[c]hromium'
curl -s http://localhost:9222/json | head -5
dmesg -T | tail -40 | grep -iE 'oom|killed|segfault|under-voltage'
```
- renderer žije + DevTools odpovídá + starý obraz → zaseknuté hlavní vlákno nebo ErrorBoundary
- renderer mrtvý + OOM v dmesg → paměť
- Chromium celé pryč → pád, chybí `Restart=always`
- černá obrazovka + živé Chromium → DPMS/screensaver, ne aplikace vůbec

**K8 — Smluvní kritérium (dohodnout s učitelem PŘEDEM, písemně)**

> „Na tomto Pi, na routě `/spsmotol`, při `get_throttled = 0x0`, po dobu 30 minut: p95 frame time ≤ 33 ms, long tasks > 50 ms méně než 2/s, a renderer RSS po 12 h neroste rychleji než 1 MB/h.“

Splněno → aplikaci jde doladit, spor končí. Nesplněno ani po celém seznamu oprav → jde se na plán B. Bez předem dohodnutého čísla se ten spor nedá vyhrát ani prohrát, jen donekonečna vést.

---

## 5) POŘADÍ OPRAV (až po krocích 0–1)

Pořadí je podle poměru jistota/riziko, ne podle velikosti nálezu v auditu.

1. **`src/main.tsx:7`** → `if (location.pathname.startsWith('/m')) { import('./utils/notificationService').then(m => m.initNotifications()); }`. Změřeno probe buildem: entry chunk **229 040 B → 33 440 B (−85 %)**. Jediný nález, jehož efekt je změřený, ne odhadnutý. Nulové riziko pro tabuli.
2. **`index.html:50,56-57`** → self-hostovaný FA subset + Firebase compat pryč z `<head>`. Odstraní **169 876 B blokujících externích zdrojů** a jedinou prokázanou příčinu bílé obrazovky po výpadku proudu (`index.html:67` hodí `ReferenceError`, když gstatic nedojede).
3. **`src/components/DailyRobot.tsx:243`** → `}, []);` + `useRef` místo state, a šest vnitřních `setTimeout` posbírat do pole a v cleanupu zrušit. **Největší jednotlivý dopad na FPS.** Falzifikovatelné bez profileru: stopky před obrazovkou, počet průjezdů robota za 5 minut — dnes ~14, po opravě ~5.
4. **`src/hooks/useMeteoStation.ts:86`** → `POLL_INTERVAL = 15_000` (komentář na ř. 87 s tím sám počítá) + in-flight guard + `AbortSignal.timeout(3000)`. Zavře jedinou reálnou unbounded větev v repu. Zároveň doplnit `setAvailable(true)` po úspěchu — dnes se nevolá nikde a panel je po prvním nočním výpadku mrtvý navždy.
5. **`src/components/TramDeparturesConnected.tsx:37-49`** → smazat vlastní interval, číst čas z contextu. A ř. 355 `slice(0, 7)` → `slice(0, maxItems)`, aby šlo na slabším HW zkusit 5 řádků.
6. **`src/index.css:131`** → smazat `img, video { translateZ }`. Nízký dopad, ale nulové riziko a je to prokazatelně cargo-cult.
7. **Až po změření kroků 1–6:** rozdělit `DataContext` (`:439` tik zvlášť od `stationData`), memoizovat `seasonalTheme` (`:330`) na den místo na sekundu, registr aktivních stanic místo `Object.keys(ALL_STATIONS)` (`:451`), timeouty do `pidApi.ts`.

**Co nedělat:** přepis do vanilla JS, výměna distribuce, cog/WPE, nákup HW — dokud floor test (K4) nepropadne. Všechny tři jsou dny práce a žádná neopraví `DailyRobot.tsx:243`.

---

## 6) CO ŘÍCT UČITELI

> Symptomy jsou dva a mají různé příčiny: trhané FPS má v kódu konkrétní, ověřenou příčinu na `DailyRobot.tsx:243` a v duplicitních vteřinových re-renderech, a to je opravitelné během hodin — ale zatuhnutí po 24 h v kódu prokázanou příčinu **nemá**, a máte pravdu, že řešení bez auto-recovery není pro provoz 24/7 přijatelné, protože v celém `src/` není jediné `location.reload` a v repu není žádná systemd unit s `Restart=always`.
>
> Navrhuji proto rozdělit spor na dvě části: provozní pojistku (watchdog + noční restart + auto-reload při chybě, 30 minut práce) uděláme okamžitě bez ohledu na výsledek diskuse, a paralelně změříme šest čísel přímo z Pi — model, rozlišení výstupu, `chrome://gpu`, `vcgencmd get_throttled`, čím se tabule spouští a na jakou URL míří — protože dosud jsme oba argumentovali bez jediného údaje z toho konkrétního zařízení.
>
> Dohodněme se předem na čísle, které spor rozhodne: „p95 frame time ≤ 33 ms po dobu 30 minut a renderer RSS po 12 h neroste rychleji než 1 MB/h“ — když to po opravách naměříme, aplikace se doladit dala; když ne ani po celém seznamu, měl jste pravdu a jdeme na jiné řešení.

---

## 7) CO KAŽDÁ STRANA PŘEHLÉDLA (pro úplnost)

- **Uživatel** nadhodnotil React nálezy: verifikace srazila `DataContext` memoizaci, `index.css:131` i Snowfall na medium/low, a jeho vysvětlení symptomu (b) přes „GC tlak z 518k fetchů“ neobstálo — v `useMeteoStation.ts:264-277` je circuit breaker, který ten scénář v drtivé většině případů zastaví do 6 sekund.
- **Učitel** (OS/HW pozice) správně ukázal na nezměřené multiplikátory (rozlišení, GPU cesta, throttling, `vite preview` na Pi), ale **výměna distribuce sama o sobě neopraví nic** — jen dá případnému leaku víc prostoru. Sám to v argumentaci přiznal, což je férové.
- **Runtime pozice** má pravdu v tom, že poměr 638 kB JS ku 2 kB informací je absurdní, a v tom, že prohlížeč nemá supervizi. Rewrite ale prohrává na ceně: pět fixů za ~30 řádků proti několika dnům práce, a znovu by se objevily bugy už vychytané v `TramDeparturesConnected.tsx` (583 ř.).
- **Měřicí pozice** má procesně pravdu, ale přeceňuje sebe: pět triviálních fixů je pod hodinu práce a nulové riziko — ty se udělají a měří se potom, ne naopak. Měřit napřed má smysl u všeho, co stojí víc než hodinu nebo mění architekturu.
- **Všichni čtyři** přehlédli, že `src/index.css:109-122` vypíná úplně všechny animace kromě robota. To mění diagnózu symptomu (a) z „appka je plná animací“ na „jedna animace běží 3× častěji, než má, a naráží na 2–3 rekonciliace za sekundu“ — což je mnohem lépe opravitelné a mnohem přesněji zacílené.