# Nasazení tabule na Raspberry Pi

Řeší symptom **„po delším běhu to zatuhne"**. V repu do teď nebyla žádná
systemd unit ani watchdog — když Chromium spadlo nebo appka hodila
neodchycenou chybu, nic to nezvedlo. Tabule u vchodu nemá klávesnici.

## Co je tady

| soubor | co dělá |
|---|---|
| `tabule-web.service` | servíruje `dist/` přes `python3 -m http.server` (žádný build za běhu) |
| `tabule-kiosk.service` | spouští `tabule-chromium.sh`, `Restart=always` |
| `tabule-chromium.sh` | přepínače Chromia i s vysvětlením, proč jsou nastavené |
| `tabule-restart.timer` | preventivní restart kiosku ve 3:30 ráno |
| `tabule-watchdog.sh` + `.service` | kontroluje, že stránka opravdu žije (ne jen že proces běží) |
| `install.sh` | nainstaluje a zapne všechno výše |
| `diagnose.sh` | 6 čísel z Pi, která rozhodnou spor optimalizace vs. jiná distribuce |

## Důležité: jak se tabule spouští dnes

`package.json` má `"dev"` i `"start"` nastavené na `vite build && vite preview`.
Pokud tabule startuje takhle, Pi při **každém bootu** pouští rollup + terser
(`passes: 2`) a pak vedle Chromia trvale sedí Node proces. Na 1–2 GB RAM je
to OOM otázka času.

Tyhle unity místo toho servírují předpřipravený `dist/`, který se builduje
na jiném stroji a nakopíruje na Pi.

## Instalace

```bash
# na vývojovém stroji
npm run build
rsync -a dist/ pi@tabule:/opt/tabule/dist/
rsync -a deploy/ pi@tabule:/opt/tabule/deploy/

# na Pi
cd /opt/tabule/deploy && sudo ./install.sh /spsmotol
```

Argument je routa, kterou má tabule zobrazovat. Pozor na přesné názvy,
`src/App.tsx` definuje: `/spsmotol`, `/spsmoravska`, `/bikefest`,
`/makerfaire`, `/pidday/letna`, `/pidday/motol`, `/depo-kacerov`.
Routa `/` je marketingová landing page, **ne** tabule.

## Než začneš cokoli optimalizovat

```bash
sudo ./diagnose.sh
```

Vypíše model Pi, rozlišení výstupu, stav throttlingu, čím se tabule spouští
a na jakou URL míří. Bez těchhle čísel je jakékoli rozhodnutí sázka —
podrobně v `docs/PERF_ARBITRAZ.md`, sekce 4.


## Chromium na Pi: co zapnout a co ne

**GPU nevypínej.** `--disable-gpu` hodí kompozici i canvas na CPU přes
SwiftShader. Na Pi je to nejhorší možná volba — VideoCore VI kompozici
zvládá, Cortex-A72 ne. Vypínat GPU má smysl jen tehdy, když ovladač padá,
a to je oprava ovladače, ne optimalizace.

Chceš pravý opak, a je to už v `tabule-chromium.sh`:

```
--use-gl=egl --ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy
--disable-software-rasterizer
```

To poslední je pojistka: když GPU cesta selže, ať to spadne viditelně místo
tiché jízdy na software rendereru. Ta totiž vypadá přesně jako „slabý
hardware“ a zmátla by každé měření.

**Ověř, že GPU opravdu jede.** V `chrome://gpu` musí být *Canvas*,
*Compositing* a *Rasterization* „Hardware accelerated“. Když tam stojí
„Software only“, oprava je v systému, ne v Chromiu:

```
# /boot/firmware/config.txt
dtoverlay=vc4-kms-v3d
max_framebuffers=2
```

**Co se naopak vyplatí vypnout** (tabule nemá zvuk, uživatele, rozšíření ani
druhou záložku): `--mute-audio`, `--disable-extensions`, `--disable-sync`,
`--disable-background-networking`, `--disable-component-update`,
`--renderer-process-limit=1`. Každý renderer navíc je na 1–2 GB RAM znát.

**Pro 24/7 je nutné** `--disable-background-timer-throttling` a
`--disable-renderer-backgrounding`. Bez nich Chromium po čase uspí časovače
i v kiosku a tabule ukazuje stará data, aniž by cokoli spadlo — což je jeden
z projevů, které vypadají jako „zatuhnutí“.

**Větší výhra než jakýkoli přepínač:** pokud televize běží ve 4K, přepni
výstup na 1080p (`video=HDMI-A-1:1920x1080@60D` v `cmdline.txt`).
Čtyřnásobná plocha ke kompozici stojí víc než všechny optimalizace kódu
dohromady a na 55" z chodby to nikdo nepozná. Zjistí `diagnose.sh`.
