#!/bin/bash
# Spousti Chromium v kiosk rezimu.
#
# Samostatny skript, ne dlouhy ExecStart: systemd nespousti prikaz pres
# shell, takze v ExecStart nejdou komentare ani zalamovani s vysvetlenim.
# Tady jde obojí a je videt, proc je ktery prepinac nastaveny.

set -u
URL="${TABULE_URL:-http://127.0.0.1:8080/spsmotol}"
PROFILE="${TABULE_PROFILE:-/home/pi/.config/chromium}"

# Chromium si po tvrdem padu pamatuje "crashed" stav a pri startu ukaze
# dialog, ktery na tabuli bez klavesnice nikdo nezavre.
PREFS="$PROFILE/Default/Preferences"
if [ -f "$PREFS" ]; then
  sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/; s/"exited_cleanly":false/"exited_cleanly":true/' "$PREFS" 2>/dev/null || true
fi

# Uspavani obrazovky vypada jako pad aplikace - cerna obrazovka, zivy proces.
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

exec /usr/bin/chromium-browser \
  --kiosk \
  --app="$URL" \
  --user-data-dir="$PROFILE" \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --no-first-run \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --remote-debugging-port=9222 \
  \
  `: '── GPU: ZAPNOUT, ne vypnout ────────────────────────────────'` \
  `: '--disable-gpu hodi kompozici i canvas na CPU (SwiftShader).'` \
  `: 'Na Pi je to nejhorsi volba: VideoCore VI kompozici zvlada,'` \
  `: 'Cortex-A72 ne. Vypinat GPU ma smysl jen kdyz ovladac pada.'` \
  --use-gl=egl \
  --ignore-gpu-blocklist \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  `: 'Kdyz GPU cesta selze, at to spadne viditelne misto tiche'` \
  `: 'jizdy na software rendereru, ktera vypada jako slaby hardware.'` \
  --disable-software-rasterizer \
  \
  `: '── co se vyplati vypnout ───────────────────────────────────'` \
  `: 'Tabule nema zvuk, uzivatele, rozsireni ani druhou zalozku.'` \
  --mute-audio \
  --disable-extensions \
  --disable-sync \
  --disable-background-networking \
  --disable-component-update \
  --check-for-update-interval=31536000 \
  --disable-translate \
  --disable-features=Translate,TranslateUI,MediaRouter,OptimizationHints \
  `: 'Jedna stranka = jeden renderer. Kazdy dalsi proces je na 1-2 GB znat.'` \
  --renderer-process-limit=1 \
  \
  `: '── 24/7 provoz ─────────────────────────────────────────────'` \
  `: 'Bez tohohle Chromium po case uspi casovace i v kiosku a odjezdy'` \
  `: 'prestanou tikat - tabule ukazuje stara data, aniz by cokoli spadlo.'` \
  --disable-background-timer-throttling \
  --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows \
  `: 'Cache na SD kartu drz malou: opotrebeni a plny disk se projevi'` \
  `: 'jako zatuhnuti, ktere vypada jako chyba aplikace.'` \
  --disk-cache-size=33554432 \
  --media-cache-size=1
