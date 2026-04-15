import { useEffect } from "react";

const TECH = [
  "React 18", "TypeScript", "Vite", "Tailwind CSS",
  "Framer Motion", "React Router v6", "PID Golemio API", "WeatherAPI.com", "Vercel",
];

const STATS = [
  { value: "20+", label: "komponent" },
  { value: "~5 000", label: "řádků kódu" },
  { value: "12", label: "zastávek" },
  { value: "8", label: "sezónních témat" },
  { value: "< 2s", label: "načtení" },
  { value: "24/7", label: "provoz" },
];

const FEATURES = [
  { icon: "fa-solid fa-train-tram", title: "Real-time odjezdy", desc: "Data z PID Golemio API, aktualizace každých 60 s." },
  { icon: "fa-solid fa-rotate", title: "Rotace zastávek", desc: "Automatické přepínání Vozovna Motol ↔ metro Motol každých 15 s." },
  { icon: "fa-solid fa-cloud-sun", title: "Počasí", desc: "Teplota, vlhkost, vítr a UV index pro lepší přípravu na cestu." },
  { icon: "fa-solid fa-shield-halved", title: "Záložní data", desc: "Při výpadku API se zobrazí poslední platná data s upozorněním." },
  { icon: "fa-solid fa-display", title: "55\" displej", desc: "Navrženo pro fullscreen na TV u vchodu — vysoký kontrast, velké písmo." },
  { icon: "fa-solid fa-masks-theater", title: "Sezónní maskot", desc: "8 variant robota podle ročního období — Vánoce, Halloween a další." },
];

const PROBLEMS = [
  { icon: "fa-solid fa-circle-exclamation", text: "Stovky studentů SPŠD denně čekají na tramvaj, ale uvnitř školy nejsou žádné informace o odjezdech." },
  { icon: "fa-solid fa-stopwatch", text: "Zbytečný spěch na zastávku nebo čekání venku v mrazu — bez přesné informace nelze plánovat." },
  { icon: "fa-solid fa-mobile-screen", text: "Mobilní aplikace jako PID Lítačka vyžadují aktivní vyhledávání — pro pasivní zobrazení nevhodné." },
];


const Index = () => {
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(15,23,42,0.85)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png" alt="SPŠD" className="h-8 object-contain" />
            <span className="font-bold text-white hidden sm:block">Odjezdová tabule</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/spsdopravni/spsd_timetable" target="_blank" rel="noopener noreferrer"
               className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
              <i className="fa-brands fa-github"></i>
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a href="/menu"
               className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2">
              <i className="fa-solid fa-train-tram"></i>
              Otevřít tabuli
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)' }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-28">
          {/* Prize badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <i className="fa-solid fa-trophy"></i>
            Cena poroty · Cena děkana Fakulty dopravní ČVUT 2026 · Moderní technologie v dopravě
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">
                Střední průmyslová škola dopravní · Praha
              </p>
              <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
                Odjezdová<br />
                <span className="text-blue-400">tabule</span>
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                Webová aplikace zobrazující real-time odjezdy tramvají PID na velkoplošném displeji u vstupu do školy. Žádná obsluha, žádná instalace — jen prohlížeč.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/menu"
                   className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/40">
                  <i className="fa-solid fa-train-tram"></i>
                  Tabule SPŠD Motol
                </a>
                <a href="https://github.com/spsdopravni/spsd_timetable" target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  <i className="fa-brands fa-github"></i>
                  Zdrojový kód
                </a>
              </div>
            </div>

            {/* Right — screenshot tabule */}
            <div className="hidden lg:block">
              <img
                src="/pictures/tabule-screenshot.png"
                alt="Ukázka odjezdové tabule"
                className="rounded-2xl shadow-2xl border border-white/10 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="border-y border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-black text-blue-400 mb-0.5">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROBLÉM */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">Proč to vzniklo</p>
            <h2 className="text-3xl font-black mb-8">Problém, který každý u nás zná</h2>
            <div className="space-y-6">
              {PROBLEMS.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <i className={`${item.icon} text-blue-500 text-xl flex-shrink-0 mt-0.5`}></i>
                  <p className="text-gray-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">Řešení</p>
            <h3 className="text-xl font-bold mb-6">Webová tabule na 55" displeji</h3>
            <div className="space-y-3">
              {[
                "Real-time odjezdy přímo z PID API Golemio",
                "Automatická rotace mezi zastávkami každých 15 sekund",
                "Aktuální počasí a předpověď",
                "Fullscreen bez obsluhy — jen zapnout TV",
                "Záložní data při výpadku internetu",
                "Sezónní témata maskota — 8 variant",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-blue-500 mt-1 flex-shrink-0 text-sm"></i>
                  <span className="text-gray-300 text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FUNKCE */}
      <div className="border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Co umí</p>
          <h2 className="text-3xl font-black mb-12">Klíčové funkce</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-6 hover:border-blue-500/40 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-10 h-10 rounded-lg bg-blue-900/60 flex items-center justify-center mb-4">
                  <i className={`${f.icon} text-blue-400 text-lg`}></i>
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARCHITEKTURA */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Jak to funguje</p>
        <h2 className="text-3xl font-black mb-12">Architektura</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01", icon: "fa-solid fa-database", title: "Datové zdroje",
              items: ["PID Golemio API — real-time odjezdy", "WeatherAPI.com — počasí", "WorldTimeAPI — sync času"],
            },
            {
              step: "02", icon: "fa-brands fa-react", title: "Frontend (React)",
              items: ["React 18 + TypeScript", "DataContext — centrální stav", "Cache 20 s — méně API volání"],
            },
            {
              step: "03", icon: "fa-solid fa-display", title: "Zobrazení",
              items: ["Vercel hosting + HTTPS", "Fullscreen na 55\" TV", "timetable.brozovec.eu"],
            },
          ].map((col, i) => (
            <div key={i} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-blue-900/60 flex items-center justify-center flex-shrink-0">
                  <i className={`${col.icon} text-blue-400`}></i>
                </div>
                <h3 className="font-bold text-lg">{col.title}</h3>
              </div>
              <ul className="space-y-2">
                {col.items.map((item, j) => (
                  <li key={j} className="text-gray-400 text-sm flex gap-2">
                    <i className="fa-solid fa-arrow-right text-blue-600 flex-shrink-0 mt-0.5 text-xs"></i>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* MASKOTI */}
      <div className="border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Sezónní témata</p>
          <h2 className="text-3xl font-black mb-4">8 variant maskota</h2>
          <p className="text-gray-400 mb-10 max-w-lg">Školní robot se mění podle ročního období a svátků. Vánoce, Halloween, Velikonoce, Nový rok a další.</p>
          <div className="flex flex-wrap gap-6 items-end">
            {[
              { src: "/pictures/robotz.png", label: "Klasický" },
              { src: "/pictures/robot-spring.png", label: "Jaro" },
              { src: "/pictures/robot-summer.png", label: "Léto" },
              { src: "/pictures/robot-autumn.png", label: "Podzim" },
              { src: "/pictures/robot-winter.png", label: "Zima" },
              { src: "/pictures/robot-halloween.png", label: "Halloween" },
              { src: "/pictures/robot-christmas.png", label: "Vánoce" },
              { src: "/pictures/robot-newyear.png", label: "Nový rok" },
            ].map((r, i) => (
              <div key={i} className="text-center">
                <img src={r.src} alt={r.label} className="h-20 object-contain mx-auto mb-2 drop-shadow-lg" />
                <span className="text-gray-500 text-xs">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KDE NÁS NAJDETE */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Kde nás najdete</p>
        <h2 className="text-3xl font-black mb-4">Akce a budovy</h2>
        <p className="text-gray-400 mb-10 max-w-lg">Naše tabule fungují v budovách Střední průmyslové školy dopravní a na vybraných akcích.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* SPŠD budovy */}
          <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-10 h-10 rounded-lg bg-blue-900/60 flex items-center justify-center mb-4">
              <i className="fa-solid fa-building text-blue-400 text-lg"></i>
            </div>
            <h3 className="font-bold text-lg mb-2">Budovy SPŠD</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Odjezdové tabule fungují v budovách Střední průmyslové školy dopravní — Motol a Moravská.</p>
          </div>

          {/* Prague Bike Fest */}
          <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/bikefest-logo.svg" alt="Prague Bike Fest" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Prague Bike Fest 2026</h3>
            <p className="text-gray-400 text-sm leading-relaxed">25.–26. dubna 2026 · Výstaviště Praha. Speciální tabule s vlastním designem a maskotem.</p>
          </div>

          {/* Schola Pragensis */}
          <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/schola-pragensis-logo.svg" alt="Schola Pragensis" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Schola Pragensis</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Veletrh středních škol v Kongresovém centru Praha. Tabule pro návštěvníky přímo na akci.</p>
          </div>
        </div>
      </div>

      {/* TECH */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Stack</p>
        <h2 className="text-3xl font-black mb-8">Použité technologie</h2>
        <div className="flex flex-wrap gap-2">
          {TECH.map((t, i) => (
            <span key={i} className="border border-white/15 text-gray-300 text-sm px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* TÝM */}
      <div className="border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Autoři</p>
          <h2 className="text-3xl font-black mb-10">Tým</h2>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
            {[
              { name: "Adam Brož", cls: "2.A · Informační technologie", email: "broz979171@mot.sps-dopravni.cz" },
              { name: "Štefan Barát", cls: "3.A · Informační technologie", email: "barat70671@mot.sps-dopravni.cz" },
            ].map((a, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-user text-blue-400 text-lg"></i>
                </div>
                <h3 className="font-bold text-lg">{a.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{a.cls}</p>
                <a href={`mailto:${a.email}`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors break-all flex items-center gap-1.5">
                  <i className="fa-solid fa-envelope text-xs flex-shrink-0"></i>
                  {a.email}
                </a>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm mt-8">Střední průmyslová škola dopravní, a.s. · Praha · Leden 2026</p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/10" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-black mb-4">Vyzkoušejte si to</h2>
          <p className="text-gray-400 mb-8 text-lg">Běží na <span className="text-white font-semibold">timetable.brozovec.eu</span> · 24/7 · bez obsluhy</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/menu"
               className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-900/40 text-lg">
              <i className="fa-solid fa-train-tram"></i>
              Tabule SPŠD Motol
            </a>
            <a href="https://github.com/spsdopravni/spsd_timetable" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg">
              <i className="fa-brands fa-github"></i>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-600 text-sm">
        <p>© 2026 Adam Brož & Štefan Barát · SPŠD Praha · Data: PID Golemio API · Hosting: Vercel</p>
      </footer>

    </div>
  );
};

export default Index;
