#!/bin/bash
# Nainstaluje a zapne provozni vrstvu tabule.
#
# Pouziti:
#   sudo ./install.sh /spsmotol                              # dist/ hosti Pi samo
#   sudo ./install.sh /spsmotol http://server.skola:8080     # hosti skolni server
#
# Druha varianta je preferovana: Pi je pak jen prohlizec a odpada z nej
# build i Node proces. Viz docs/DOCKER.md.
set -e
[ "$EUID" -eq 0 ] || { echo "Spust pres sudo."; exit 1; }

ROUTE="${1:-/spsmotol}"
ORIGIN="${2:-}"
DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -n "$ORIGIN" ]; then
  REMOTE=1
  BASE="${ORIGIN%/}"
else
  REMOTE=0
  BASE="http://127.0.0.1:8080"
fi

echo "TABULE_URL=${BASE}${ROUTE}" > /etc/default/tabule
echo "-> /etc/default/tabule: ${BASE}${ROUTE}"

if [ "$REMOTE" -eq 0 ]; then
  [ -f /opt/tabule/dist/index.html ] || echo "!! /opt/tabule/dist/index.html chybi - nakopiruj build z vyvojoveho stroje."
else
  if ! curl -sf --max-time 5 -o /dev/null "${BASE}/healthz"; then
    echo "!! ${BASE}/healthz neodpovida - zkontroluj, ze kontejner bezi a Pi na nej dosahne."
  else
    echo "-> server odpovida na ${BASE}/healthz"
  fi
fi

[ "$REMOTE" -eq 0 ] && install -m 644 "$DIR"/tabule-web.service /etc/systemd/system/
install -m 644 "$DIR"/tabule-kiosk.service    /etc/systemd/system/
install -m 644 "$DIR"/tabule-restart.service  /etc/systemd/system/
install -m 644 "$DIR"/tabule-restart.timer    /etc/systemd/system/
install -m 644 "$DIR"/tabule-watchdog.service /etc/systemd/system/
chmod +x "$DIR"/tabule-watchdog.sh "$DIR"/diagnose.sh "$DIR"/soak.sh

systemctl daemon-reload
if [ "$REMOTE" -eq 0 ]; then
  systemctl enable --now tabule-web.service
else
  # Web hosti skolni server, lokalni ho nepotrebujeme.
  systemctl disable --now tabule-web.service 2>/dev/null || true
fi
systemctl enable --now tabule-kiosk.service
systemctl enable --now tabule-watchdog.service
systemctl enable --now tabule-restart.timer

echo
echo "Hotovo. Stav:"
systemctl --no-pager --lines=0 status tabule-web tabule-kiosk tabule-watchdog 2>/dev/null | grep -E 'Active|●' || true
echo
echo "Logy:      journalctl -fu tabule-kiosk"
echo "Watchdog:  journalctl -fu tabule-watchdog"
echo "Diagnoza:  sudo $DIR/diagnose.sh"
