#!/bin/bash
# 6 cisel z Pi, ktera rozhodnou spor "optimalizovat appku vs. jina distribuce".
# Podrobne zduvodneni v docs/PERF_ARBITRAZ.md, sekce 4.

echo "=============================================="
echo " SPSD tabule - diagnostika  $(date '+%F %T')"
echo "=============================================="

echo
echo "--- K0: cim a na jakou URL se tabule spousti ---"
ps -eo args | grep -i '[c]hromium' | tr ' ' '\n' | grep -E '^--kiosk|^--app|^http' | head
if ps -eo args | grep -qE '[v]ite preview|[n]pm run dev|[n]pm start'; then
  echo "!! POZOR: bezi vite preview / npm run dev."
  echo "   package.json ma 'dev' i 'start' = 'vite build && vite preview',"
  echo "   takze Pi pri kazdem bootu builduje a pak tu trvale sedi Node."
  echo "   -> prejdi na deploy/tabule-web.service (staticky dist/) NEZ merit cokoli."
fi
url=$(ps -eo args | grep -i '[c]hromium' | tr ' ' '\n' | grep -E '^--app=|^https?://' | head -1)
case "$url" in
  */moravska*|*/letna*|*/pidday\ *|*/depokacerov*)
    echo "!! POZOR: tahle routa v src/App.tsx neexistuje." ;;
esac
if echo "$url" | grep -qE '(=https?://[^/]+/?$)'; then
  echo "!! POZOR: miri na '/', coz je marketingova landing page, ne tabule."
fi

echo
echo "--- K1: napajeni a teplota (nejcastejsi falesny 'slaby hardware') ---"
if command -v vcgencmd >/dev/null; then
  t=$(vcgencmd get_throttled)
  echo "$t   $(vcgencmd measure_temp)   $(vcgencmd measure_clock arm)"
  if [ "$t" != "throttled=0x0" ]; then
    echo "!! Nenulove. Pi po cast doby nebezelo na plnem taktu."
    echo "   Bity 0-3 = deje se ted, bity 16-19 = stalo se od bootu."
    echo "   -> vymen zdroj za oficialni 5,1V/3A a pridej chladic."
    echo "   -> DO TE DOBY NEMER NIC JINEHO, vsechna cisla jsou merenim kabelu."
  else
    echo "OK - hardware je cisty, pokracuj."
  fi
else
  echo "vcgencmd neni k dispozici (nejspis to neni Raspberry Pi OS)"
fi

echo
echo "--- K2: rozliseni vystupu (4K = 4x vic fill-rate) ---"
cat /sys/class/drm/card*-HDMI-A-1/modes 2>/dev/null | head -3
if cat /sys/class/drm/card*-HDMI-A-1/modes 2>/dev/null | head -1 | grep -q 3840; then
  echo "!! 4K. Pridej do /boot/firmware/cmdline.txt:  video=HDMI-A-1:1920x1080@60D"
  echo "   Na 55\" z chodby to nikdo nepozna a je to vetsi vyhra nez vsechny code fixy."
fi

echo
echo "--- K3: model a pamet ---"
tr -d '\0' < /proc/device-tree/model 2>/dev/null; echo
free -m | head -2
swapon --show 2>/dev/null | head -3

echo
echo "--- K6: roste pamet rendereru? (spust soak.sh na 24 h) ---"
ps -eo rss,args | grep -- '[-]-type=renderer' | awk '{s+=$1} END{printf "renderer RSS celkem: %.1f MB\n", s/1024}'

echo
echo "--- K7: stopy po padech ---"
dmesg -T 2>/dev/null | grep -iE 'oom|killed process|segfault|under-voltage' | tail -10
echo "(prazdne = zadny pad v kernel logu)"

echo
echo "--- disk (plna SD karta se chova jako 'zatuhnuti') ---"
df -h / /var/log 2>/dev/null | head -3
dmesg -T 2>/dev/null | grep -i mmc | grep -iE 'error|timeout' | tail -5

echo
echo "=============================================="
echo " Zbyva rucne: chrome://gpu -> radky Canvas a Compositing."
echo " 'Software only' => vsechny GPU nalezy jsou 5-10x drazsi,"
echo " fix je dtoverlay=vc4-kms-v3d v config.txt, ne zmena kodu."
echo "=============================================="
