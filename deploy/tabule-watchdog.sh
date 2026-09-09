#!/bin/bash
# Kontroluje, ze tabule opravdu ZIJE - ne jen ze proces bezi.
#
# Zamrznute hlavni vlakno, ErrorBoundary cekajici na klik nebo bila obrazovka
# po selhanem lazy chunku vypadaji pro systemd jako zdravy proces. Proto se
# ptame primo DevTools protokolu, jestli stranka jeste odpovida.

set -u
PORT=9222
FAILS=0
MAX_FAILS=3
SLEEP=60

log() { echo "$(date '+%F %T') watchdog: $*"; }

while true; do
  sleep "$SLEEP"

  # 1) Odpovida vubec DevTools endpoint?
  if ! targets=$(curl -sf --max-time 10 "http://127.0.0.1:${PORT}/json/list" 2>/dev/null); then
    FAILS=$((FAILS + 1))
    log "DevTools neodpovida (${FAILS}/${MAX_FAILS})"
    [ "$FAILS" -ge "$MAX_FAILS" ] && { log "restartuji kiosk"; systemctl restart tabule-kiosk.service; FAILS=0; }
    continue
  fi

  # 2) Je otevrena aspon jedna stranka na nasi URL?
  if ! echo "$targets" | grep -q '"type": *"page"'; then
    FAILS=$((FAILS + 1))
    log "zadna otevrena stranka (${FAILS}/${MAX_FAILS})"
    [ "$FAILS" -ge "$MAX_FAILS" ] && { log "restartuji kiosk"; systemctl restart tabule-kiosk.service; FAILS=0; }
    continue
  fi

  # 3) Zije jeste zdroj stranky? Kdyz hosti skolni server, restart lokalni
  #    sluzby nema smysl - jen to zalogujeme, at je v journalu videt proc
  #    tabule visi na stare cache.
  ORIGIN=$(sed -n 's|^TABULE_URL=\(https\?://[^/]*\).*|\1|p' /etc/default/tabule 2>/dev/null)
  ORIGIN=${ORIGIN:-http://127.0.0.1:8080}
  if ! curl -sf --max-time 10 -o /dev/null "${ORIGIN}/healthz"; then
    if systemctl is-enabled --quiet tabule-web.service 2>/dev/null; then
      log "lokalni web neodpovida, restartuji tabule-web"
      systemctl restart tabule-web.service
    else
      log "zdroj ${ORIGIN} neodpovida (hosti ho jiny stroj)"
    fi
    continue
  fi

  FAILS=0
done
