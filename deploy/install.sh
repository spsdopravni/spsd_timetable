#!/bin/bash
# Nainstaluje a zapne provozni vrstvu tabule.
# Pouziti:  sudo ./install.sh /spsmotol
set -e
[ "$EUID" -eq 0 ] || { echo "Spust pres sudo."; exit 1; }

ROUTE="${1:-/spsmotol}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "TABULE_URL=http://127.0.0.1:8080${ROUTE}" > /etc/default/tabule
echo "-> /etc/default/tabule: http://127.0.0.1:8080${ROUTE}"

[ -f /opt/tabule/dist/index.html ] || echo "!! /opt/tabule/dist/index.html chybi - nakopiruj build z vyvojoveho stroje."

install -m 644 "$DIR"/tabule-web.service      /etc/systemd/system/
install -m 644 "$DIR"/tabule-kiosk.service    /etc/systemd/system/
install -m 644 "$DIR"/tabule-restart.service  /etc/systemd/system/
install -m 644 "$DIR"/tabule-restart.timer    /etc/systemd/system/
install -m 644 "$DIR"/tabule-watchdog.service /etc/systemd/system/
chmod +x "$DIR"/tabule-watchdog.sh "$DIR"/diagnose.sh "$DIR"/soak.sh

systemctl daemon-reload
systemctl enable --now tabule-web.service
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
