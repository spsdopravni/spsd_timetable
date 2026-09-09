# Nasazení tabule na Raspberry Pi

Řeší symptom **„po delším běhu to zatuhne"**. V repu do teď nebyla žádná
systemd unit ani watchdog — když Chromium spadlo nebo appka hodila
neodchycenou chybu, nic to nezvedlo. Tabule u vchodu nemá klávesnici.

## Co je tady

| soubor | co dělá |
|---|---|
| `tabule-web.service` | servíruje `dist/` přes `python3 -m http.server` (žádný build za běhu) |
| `tabule-kiosk.service` | Chromium v kiosk módu, `Restart=always` |
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
