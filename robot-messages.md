# Systém zpráv animovaného robota

## Přehled fungování
Robot se zobrazuje každou minutu s různými zprávami podle času, dne v týdnu a školního kalendáře.

## Priorita zpráv (od nejvyšší po nejnižší)

### 1. Speciální školní dny (celý den)
- **První den po vánocích (3. ledna)**: "Vítejte zpátky po vánočních prázdninách! Přejeme úspěšný školní rok!"
- **První den po jarních prázdninách (1. dubna)**: "Vítejte zpátky po jarních prázdninách! Doufáme, že jste si odpočinuli!"
- **První den po velikonočních prázdninách (19. dubna)**: "Vítejte zpátky po velikonočních prázdninách! Těšíme se na vás!"
- **První školní den (1. září)**: "Vítejte zpátky po letních prázdninách! Nový školní rok začíná!"
- **První den po podzimních prázdninách (1. listopadu)**: "Vítejte zpátky po podzimních prázdninách! Pokračujeme ve studiu!"

### 2. Prázdniny (celý den)
- **Vánoční prázdniny (22.12-2.1)**: "Užijte si vánoční prázdniny! Uvidíme se po Novém roce!"
- **Jarní prázdniny (25-31.3)**: "Užijte si jarní prázdniny! Odpočiňte si a naberte síly!"
- **Velikonoční prázdniny (15-18.4)**: "Užijte si velikonoční prázdniny! Veselé Velikoce!"
- **Letní prázdniny (29.6-31.8)**: "Užijte si letní prázdniny! Krásné léto a uvidíme se v září!"
- **Podzimní prázdniny (26-31.10)**: "Užijte si podzimní prázdniny! Odpočiňte si a uvidíme se po nich!"

### 3. Speciální dny v týdnu (celý den)
- **Pátek**: "Je pátek! Přejeme vám hezký víkend a odpočinek!"
- **Pondělí**: "Doufáme, že jste si užili víkend! Vítejte zpátky v novém týdnu!"

### 4. Časové zprávy (konkrétní hodiny)
- **11:00-12:59**: "Čas na oběd! Užijte si chvilku pohody a dobré jídlo!"
- **20:00-23:59**: "Přejeme vám hezký večer a vidíme se zítra!"

### 5. Rotující zprávy (ostatní časy)
Každou minutu se střídají podle schématu 5 minut:

#### Pozice 0 (1. minuta): Zpráva o svátku
- **Se svátkem**: "Dobré ráno! Dnes je pondělí a má svátek Lukáš!"
- **Bez svátku**: "Dobré ráno! Dnes je pondělí, přeji příjemný den!"

#### Pozice 1-3 (2.-4. minuta): Fun fakty o dopravě
Náhodně vybraný ze 76 faktů, například:
- "Víte že nejrychlejší vlak na světě je japonský maglev s rychlostí 603 km/h?"
- "Víte že tramvaje v Praze jezdí už od roku 1891? První byla koňka!"

#### Pozice 4 (5. minuta): Zpráva o svátku
- Stejné jako pozice 0

## Pozdravi podle času
- **6:00-9:59**: "Dobré ráno!"
- **10:00-11:59**: "Dobré dopoledne!"
- **12:00-16:59**: "Dobré poledne!"
- **17:00-5:59**: "Dobrý večer!"

## Animace robota
- **Zobrazení**: Robot přijíždí každou minutu zprava
- **Fáze 1 (0-2s)**: Robot jede zprava doleva
- **Fáze 2 (2-3s)**: Robot stojí vlevo
- **Fáze 3 (3-5.5s)**: Robot se vrací doprava s modrým pozadím
- **Fáze 4 (5.5-12s)**: Robot stojí vpravo se zprávou na pozadí
- **Fáze 5 (12s+)**: Vše zmizí

## Kalendář svátků
Robot obsahuje kompletní český kalendář se všemi 365/366 jmény podle tradičního českého kalendáře.

## Fun fakty o dopravě (76 různých)

### České dopravní zajímavosti
- Historické fakty (tramvaje od 1891, metro od 1974)
- Rekordy (nejdelší trať linka 22 - 28 km)
- Technologie (T3 Coupé, ForCity Plus s WiFi)
- České firmy (Škoda Transportation, SOR, Karosa)

### Světové dopravní zajímavosti
- Rychlostní rekordy (japonský maglev 603 km/h)
- Velikosti (Tokyo metro 40 mil. cestujících denně)
- Technologie (Rotterdamské bezdrátové tramvaje)
- Unikáty (metro v Moskvě jako paláce)

## Aktualizace
- **Zprávy**: Každou minutu
- **Pozdravi**: Každou hodinu
- **Svátek**: Denně o půlnoci
- **Animace**: Každou minutu od spuštění aplikace