# Nasazení a klíče k API

Projekt běží na dvou místech a **obě potřebují klíče v prostředí**, ne v kódu.

## Proč se to změnilo

Čtyři Golemio klíče a klíč k WeatherAPI byly natvrdo ve zdrojácích, tedy
i v klientském bundlu — čitelné z DevTools i přímo z GitHubu. Klient teď
posílá jen jméno slotu v hlavičce `X-Api-Slot` (`k1`, `k2`, `k3`,
`pragensis`) a skutečný klíč doplní až server.

```
prohlížeč                server                      Golemio
   │  GET /api/pid/…       │                           │
   │  X-Api-Slot: k2       ├─ X-Access-Token: <klíč 2> ─►
```

Serverem je podle nasazení buď serverless funkce na Vercelu
(`api/pid/[...path].ts`), nebo nginx v Dockeru
(`docker/nginx.conf.template`). Chování je stejné.

## ⚠️ Vercel — nastav PŘED nasazením

Bez těchhle proměnných **tabule nezobrazí žádné odjezdy**. Funkce vrátí 500
s hláškou, který klíč chybí — nespadne to potichu, ale data nebudou.

Vercel → Project → Settings → Environment Variables:

| proměnná | k čemu |
|---|---|
| `GOLEMIO_KEY_1` | výchozí slot, většina zastávek |
| `GOLEMIO_KEY_2` | Motol nástupiště C/D |
| `GOLEMIO_KEY_3` | Jana Masaryka, Šumavská |
| `GOLEMIO_KEY_PRAGENSIS` | Vyšehrad, Svatoplukova, Náměstí Míru |
| `WEATHER_KEY` | WeatherAPI |

Nejsou to `VITE_*` proměnné — zůstávají na serveru a do buildu se nedostanou.

## Docker

Viz `docs/DOCKER.md`. Stejné klíče, jen v `.env.docker`, plus
`METEO_UPSTREAM` na školní meteostanici.

## Ověření po nasazení

```bash
# musí vrátit data, ne 500 a ne HTML
curl -s 'https://<doména>/api/pid/v2/pid/departureboards?ids=U865Z1P' \
  -H 'X-Api-Slot: k1' | head -c 200
```

Že klíč opravdu není v bundlu:

```bash
curl -s https://<doména>/assets/index-*.js | grep -c eyJhbGciOiJIUzI1NiI   # → 0
```

## Přímé volání bez proxy

Jen pro případ, že by se to hostilo někde bez serverové části: nastav při
buildu `VITE_API_PROXY=""` a klíče jako `VITE_GOLEMIO_KEY_1..3`,
`VITE_GOLEMIO_KEY_PRAGENSIS`, `VITE_WEATHER_KEY`. Skončí ale v bundlu,
takže je to nouzová varianta.
