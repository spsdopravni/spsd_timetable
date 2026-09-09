# Raspberry Pi 4 – plynulé animace tabule

Tabule běží v Chromiu na Raspberry Pi 4 (8 GB). Tento dokument shrnuje,
co je v kódu udělané kvůli výkonu a jak nastavit samotné Pi, aby se
animace (robot, prolínání směrů) nesekaly.

## Co je optimalizované v kódu

| Oblast | Dřív | Teď |
|---|---|---|
| Robot (`DailyRobot`) | framer-motion, pohyb počítaný JavaScriptem každý snímek na hlavním vlákně | čisté CSS transitions na `transform`/`opacity` – běží na GPU kompozitoru, nezávisle na JS |
| Stín robota | `filter: drop-shadow` na 16rem obrázku, přepočítávaný za jízdy | odstraněn |
| Countdown v panelech | každý panel měl vlastní `setInterval` 1 s navíc k tikání kontextu → až 4 překreslení/s | čas se bere z `DataContext`, jedno překreslení za sekundu |
| `DataContext` | nový objekt hodnoty i sezónního tématu při každém tiku | `useMemo`, téma se mění jen s datem |
| Globální CSS | `img { transform: translateZ(0) }` – každá ikonka vlastní GPU vrstva | odstraněno, vrstvu má jen robot |
| Sněžení | 40 vloček | 25 vloček |

## Nastavení Raspberry Pi

### 1. Rozlišení výstupu: 1080p, ne 4K

Největší rozdíl. Pi 4 kompozituje 4K obraz jen s velkými obtížemi.
Nastav TV/HDMI výstup na 1920×1080 @ 60 Hz (`raspi-config` → Display,
nebo v `/boot/firmware/cmdline.txt` přidej `video=HDMI-A-1:1920x1080@60`).

### 2. KMS grafický ovladač

V `/boot/firmware/config.txt` musí být aktivní:

```
dtoverlay=vc4-kms-v3d
max_framebuffers=2
```

Starší `fkms` nebo úplně vypnutý overlay znamená softwarové vykreslování.

### 3. Chromium s hardwarovou akcelerací

Spouštěcí příkaz pro kiosk (např. v `~/.config/labwc/autostart` nebo
`~/.config/lxsession/LXDE-pi/autostart`):

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --ignore-gpu-blocklist \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --enable-accelerated-2d-canvas \
  --num-raster-threads=4 \
  --disable-smooth-scrolling \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  https://timetable.brozovec.eu/spsmotol
```

Ověření: otevři `chrome://gpu` a zkontroluj, že položky *Canvas*,
*Compositing*, *Rasterization* a *WebGL* jsou „Hardware accelerated“.

### 4. Ostatní

- Vypni spořič obrazovky a DPMS (`xset s off`, `xset -dpms` na X11;
  na Wayland/labwc nastav v `~/.config/wlr-randr` / nastavení Pi).
- Nenechávej v Chromiu otevřené další taby ani rozšíření.
- Aktivní chlazení: při dlouhodobém běhu Pi 4 bez chladiče throttluje
  CPU i GPU (`vcgencmd get_throttled` má vracet `0x0`).
- V nastavení tabule (3× klik na logo) je volba **Vypnout animace** –
  vypne prolínání karet a hlaviček směrů, robot zůstane. Použij, pokud
  by i po výše uvedeném něco škubalo.
