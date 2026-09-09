# Nasazení přes Docker

Tabule je statická SPA. Kontejner je nginx, který ji servíruje a zároveň
dělá **proxy na Golemio, WeatherAPI a školní meteostanici**. To druhé je
podstatnější, než to zní — viz níže.

## Rychlý start

```bash
cp .env.docker.example .env.docker   # a doplň klíče
docker compose up -d --build
curl -s localhost:8080/healthz       # → ok
```

Kontejner poslouchá na `127.0.0.1:8080`. Na serveru, kde běží víc projektů,
si před něj postav reverse proxy; pokud ho chceš vystavit napřímo, změň
v `docker-compose.yml` mapování na `"8080:80"`.

## Proč proxy, a ne jen statika

**Klíče k API byly do teď v klientském bundlu.** Čtyři Golemio a jeden
WeatherAPI, natvrdo ve zdrojácích — kdokoli si je mohl přečíst z DevTools
nebo přímo z GitHubu. Teď je má jen nginx v proměnných prostředí.

Funguje to takhle: klient posílá jen **jméno slotu** v hlavičce
`X-Api-Slot` (`k1`, `k2`, `k3`, `pragensis`), nginx podle něj doplní
skutečný klíč do `X-Access-Token` a slot z požadavku odstraní.

```
prohlížeč                nginx                      Golemio
   │  GET /api/pid/…       │                           │
   │  X-Api-Slot: k2       │                           │
   ├──────────────────────►│  X-Access-Token: <klíč 2> │
   │                       ├──────────────────────────►│
```

Druhý důvod je **sdílená cache**. Odpovědi se drží 20 s, takže obě tabule
plus mobilní uživatelé se odbaví jedním dotazem místo desítek. A když
Golemio vypadne nebo začne limitovat (`429`), nginx vydá poslední známou
odpověď místo prázdné tabule.

Třetí důvod: **`/meteo` do teď v produkci nefungovalo vůbec.** Proxy na
meteostanici existovala jen ve `vite.config.ts` pod `server`, což platí
jenom pro vývojový server.

## Než to poprvé spustíš

⚠️ **Vygeneruj si nové klíče.** Ty původní jsou ve veřejné historii
repozitáře, takže je nutné je na Golemiu a WeatherAPI zneplatnit a udělat
nové. Přesunutí do proměnných prostředí samo o sobě staré klíče nezneplatní.

Kontejner musí ze školní sítě dosáhnout na meteostanici
(`METEO_UPSTREAM`, výchozí `http://10.0.10.208`). Pokud na ni nedosáhne,
meteopanel po třech neúspěších zhasne a zkouší to dál jednou za minutu —
tabule kvůli tomu nespadne.

## Proměnné prostředí

| proměnná | k čemu | výchozí |
|---|---|---|
| `GOLEMIO_KEY_1..3`, `GOLEMIO_KEY_PRAGENSIS` | klíče pro jednotlivé sloty | — |
| `WEATHER_KEY` | WeatherAPI | — |
| `METEO_UPSTREAM` | školní meteostanice | `http://10.0.10.208` |
| `GOLEMIO_UPSTREAM` / `WEATHER_UPSTREAM` | jde přesměrovat na testovací stub | veřejné API |
| `NGINX_PORT` | port uvnitř kontejneru | `80` |

Build args:

| arg | k čemu |
|---|---|
| `VITE_USE_MOCK_DATA` | `true` = běží na vymyšlených datech, k vyzkoušení bez klíčů |

`VITE_API_PROXY=/api` nastavuje Dockerfile napevno — bez něj by se klient
snažil chodit přímo na Golemio a potřeboval by klíče v buildu.

## Co image obsahuje

Dvoufázový build: `node:22-alpine` postaví bundle, `nginx:1.27-alpine` ho
servíruje. Výsledek má ~56 MB a neobsahuje `node_modules` ani zdrojáky.

Konfigurace nginxu je **šablona**, kterou entrypoint prožene `envsubst`
při startu. Klíče tedy nejsou zapečené v obrazu — stejný image jde použít
na tabuli i na testovacím stroji, liší se jen prostředí.

Nastavené hlavičky:

- `/assets/` a `/webfonts/` — `immutable`, rok. Soubory mají hash v názvu.
- `/index.html` — `no-store`. **Tohle je důležité pro kiosk:** kdyby se
  index cachoval, po redeployi by prohlížeč držel starý manifest a lazy
  chunky by mu přestaly existovat. To je jedna z příčin „bílé obrazovky",
  které jsme hledali.
- SPA fallback na `/index.html`, takže `/spsmotol` i `/m/motol` fungují
  po přímém načtení.

## Ověření po nasazení

```bash
curl -s localhost:8080/healthz                        # ok
curl -so /dev/null -w '%{http_code}\n' localhost:8080/spsmotol   # 200
curl -sI localhost:8080/index.html | grep -i cache    # no-store

# cache musí u druhého dotazu hlásit HIT
curl -sI 'localhost:8080/api/pid/v2/pid/departureboards?ids=U865Z1P' | grep -i x-cache
curl -sI 'localhost:8080/api/pid/v2/pid/departureboards?ids=U865Z1P' | grep -i x-cache
```

Že klíč v bundlu opravdu není:

```bash
docker run --rm --entrypoint sh spsd-tabule:latest \
  -c 'grep -rl "eyJhbGciOiJIUzI1NiI" /usr/share/nginx/html || echo "čisté"'
```

## Tabule na Raspberry Pi

Pi teď nic nehostí — je to jen prohlížeč ukazující na server. V
`deploy/install.sh` proto jako druhý argument předej adresu serveru:

```bash
sudo ./install.sh /spsmotol http://server.skola.local:8080
```

`deploy/tabule-web.service` se v tom případě nepoužívá.
