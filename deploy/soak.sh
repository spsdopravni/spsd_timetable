#!/bin/bash
# Odpovida na otazku "je to vubec leak?" (kriterium K6).
# Nech bezet 24 h, pak: rust > 5 MB/h monotonne = leak existuje.
#                       rust < 1 MB/h nebo plato po 2-3 h = leak neexistuje,
#                       hledat ho je ztrata casu a pricina je jinde.
OUT="${1:-$HOME/soak.csv}"
echo "ts,renderer_rss_kb,total_rss_kb,temp,throttled" > "$OUT"
while true; do
  r=$(ps -eo rss,args | grep -- '[-]-type=renderer' | awk '{s+=$1} END{print s+0}')
  a=$(ps -eo rss,args | grep -i '[c]hromium' | awk '{s+=$1} END{print s+0}')
  t=$(vcgencmd measure_temp 2>/dev/null | tr -d "temp='C")
  g=$(vcgencmd get_throttled 2>/dev/null | cut -d= -f2)
  echo "$(date +%s),$r,$a,$t,$g" >> "$OUT"
  sleep 60
done
