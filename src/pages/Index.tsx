import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

function useIsMobile() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;
  }, []);
}

const TECH = [
  "React 18", "TypeScript", "Vite", "Tailwind CSS",
  "Framer Motion", "React Router v6", "PID Golemio API", "WeatherAPI.com",
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
  { icon: "fa-solid fa-circle-exclamation", text: "Stovky studentů Střední průmyslové školy dopravní, a.s. denně čekají na tramvaj, ale uvnitř školy nejsou žádné informace o odjezdech." },
  { icon: "fa-solid fa-stopwatch", text: "Zbytečný spěch na zastávku nebo čekání venku v mrazu — bez přesné informace nelze plánovat." },
  { icon: "fa-solid fa-mobile-screen", text: "Mobilní aplikace jako PID Lítačka vyžadují aktivní vyhledávání — pro pasivní zobrazení nevhodné." },
];

// --- Animace ---
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// Společné props pro scroll-reveal kontejner
const reveal = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
} as const;

const Index = () => {
  const isMobile = useIsMobile();
  const boardLink = isMobile ? "/m" : "/menu";

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
            <img src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png" alt="Střední průmyslová škola dopravní, a.s." className="h-8 object-contain" />
            <span className="font-bold text-white hidden sm:block">Odjezdová tabule</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/spsdopravni/spsd_timetable" target="_blank" rel="noopener noreferrer"
               className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
              <i className="fa-brands fa-github"></i>
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a href={boardLink}
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

        {/* Animovaný glow */}
        <motion.div
          aria-hidden
          className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-28">
          {/* Prize badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8"
          >
            <i className="fa-solid fa-trophy"></i>
            Cena poroty · Cena děkana Fakulty dopravní ČVUT 2026 · Moderní technologie v dopravě
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.p variants={fadeUp} className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">
                Střední průmyslová škola dopravní, a.s. · Praha
              </motion.p>
              <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
                Odjezdová<br />
                <span className="text-blue-400">tabule</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                Webová aplikace zobrazující real-time odjezdy tramvají PID na velkoplošném displeji u vstupu do školy. Žádná obsluha, žádná instalace — jen prohlížeč.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <motion.a href={boardLink}
                   whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                   className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/40">
                  <i className="fa-solid fa-train-tram"></i>
                  Tabule Střední průmyslová škola dopravní, a.s. — Motol
                </motion.a>
                <motion.a href="https://github.com/spsdopravni/spsd_timetable" target="_blank" rel="noopener noreferrer"
                   whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                   className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  <i className="fa-brands fa-github"></i>
                  Zdrojový kód
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right — screenshot tabule */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40, rotateY: 8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            >
              <motion.img
                src="/pictures/tabule-screenshot.png"
                alt="Ukázka odjezdové tabule"
                className="rounded-2xl shadow-2xl border border-white/10 w-full object-cover"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.4, ease: EASE }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="border-y border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <motion.div
            variants={stagger} {...reveal}
            className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center"
          >
            {STATS.map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="text-2xl font-black text-blue-400 mb-0.5">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* PROBLÉM */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div variants={stagger} {...reveal}>
            <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">Proč to vzniklo</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black mb-8">Problém, který každý u nás zná</motion.h2>
            <div className="space-y-6">
              {PROBLEMS.map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="flex gap-4">
                  <i className={`${item.icon} text-blue-500 text-xl flex-shrink-0 mt-0.5`}></i>
                  <p className="text-gray-400 leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp} {...reveal}
            className="rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(255,255,255,0.04)' }}
          >
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
          </motion.div>
        </div>
      </div>

      {/* FUNKCE */}
      <div className="border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={stagger} {...reveal}>
            <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Co umí</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black mb-12">Klíčové funkce</motion.h2>
          </motion.div>
          <motion.div variants={stagger} {...reveal} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="group rounded-xl border border-white/10 p-6 hover:border-blue-500/40 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-900/60 flex items-center justify-center mb-4 group-hover:bg-blue-700/70 transition-colors">
                  <i className={`${f.icon} text-blue-400 text-lg`}></i>
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ARCHITEKTURA */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <motion.div variants={stagger} {...reveal}>
          <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Jak to funguje</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl font-black mb-12">Architektura</motion.h2>
        </motion.div>
        <motion.div variants={stagger} {...reveal} className="grid md:grid-cols-3 gap-6">
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
              items: ["Zabezpečené HTTPS připojení", "Fullscreen na 55\" TV", "timetable.brozovec.eu"],
            },
          ].map((col, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}
            >
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
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* MASKOTI */}
      <div className="border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={stagger} {...reveal}>
            <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Sezónní témata</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black mb-4">8 variant maskota</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 mb-10 max-w-lg">Školní robot se mění podle ročního období a svátků. Vánoce, Halloween, Velikonoce, Nový rok a další.</motion.p>
          </motion.div>
          <motion.div variants={stagger} {...reveal} className="flex flex-wrap gap-6 items-end">
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
              <motion.div key={i} variants={fadeUp} className="text-center">
                <motion.img
                  src={r.src} alt={r.label}
                  className="h-20 object-contain mx-auto mb-2 drop-shadow-lg"
                  whileHover={{ y: -8, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                />
                <span className="text-gray-500 text-xs">{r.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* PERSONALIZOVANÉ TABULE */}
      <div className="border-t border-white/10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0f172a 60%, #1a1a1a 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#FDD835' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: '#FDD835' }} />

        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <motion.div variants={stagger} {...reveal}>
              <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FDD835' }}>
                Na míru pro vaši akci
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-black mb-6 leading-tight">
                Děláme personalizované<br />
                tabule pro <span style={{ color: '#FDD835' }}>vaše akce</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-300 text-lg leading-relaxed mb-6">
                Chystáte festival, konferenci nebo sportovní akci? Navrhneme tabuli v barvách a stylu vaší akce — s vlastním logem, maskotem a zastávkami MHD v okolí.
              </motion.p>
              <motion.ul variants={stagger} className="space-y-3 mb-8">
                {[
                  "Vlastní branding — logo, barvy, typografie",
                  "Maskot vaší akce na místě robota",
                  "Výběr konkrétních zastávek a linek",
                  "Nasazení na libovolný TV nebo projektor",
                ].map((t, i) => (
                  <motion.li key={i} variants={fadeUp} className="flex items-start gap-3">
                    <i className="fa-solid fa-check mt-1 flex-shrink-0 text-sm" style={{ color: '#FDD835' }}></i>
                    <span className="text-gray-300">{t}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.a
                variants={fadeUp}
                href="mailto:broz979171@mot.sps-dopravni.cz?subject=Personalizovan%C3%A1%20tabule%20pro%20akci"
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all shadow-lg"
                style={{ background: '#FDD835', color: '#1a1a1a' }}
              >
                <i className="fa-solid fa-envelope"></i>
                Mám zájem o tabuli
              </motion.a>
            </motion.div>

            {/* Right — Bikefest showcase */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: 'rgba(253, 216, 53, 0.3)' }}>
                <img
                  src="/pictures/bikefest-tabule.png"
                  alt="Prague Bike Fest — personalizovaná tabule"
                  className="w-full object-cover"
                />
              </div>
              {/* Bikefest robot overlay */}
              <motion.img
                src="/pictures/robot-bikefest.png"
                alt="Bikefest maskot"
                className="absolute -bottom-6 -right-4 lg:-right-8 h-32 lg:h-40 object-contain drop-shadow-2xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Bikefest badge */}
              <div
                className="absolute -top-3 left-4 lg:left-6 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"
                style={{ background: '#FDD835', color: '#1a1a1a' }}
              >
                <i className="fa-solid fa-bicycle"></i>
                Prague Bike Fest 2026
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* KDE NÁS NAJDETE */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <motion.div variants={stagger} {...reveal}>
          <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Kde nás najdete</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl font-black mb-4">Akce a budovy</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-10 max-w-lg">Naše tabule fungují v budovách Střední průmyslové školy dopravní a na vybraných akcích.</motion.p>
        </motion.div>

        <motion.div variants={stagger} {...reveal} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Budovy školy */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-10 h-10 rounded-lg bg-blue-900/60 flex items-center justify-center mb-4">
              <i className="fa-solid fa-building text-blue-400 text-lg"></i>
            </div>
            <h3 className="font-bold text-lg mb-2">Budovy školy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Odjezdové tabule fungují v budovách Střední průmyslové školy dopravní, a.s. — Motol a Moravská.</p>
          </motion.div>

          {/* Maker Faire Prague */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/makerfaire-logo.svg" alt="Maker Faire Prague" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Maker Faire Prague</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Výstaviště Praha · největší festival kreativity, vědy a technologií. Tabule s vlastním maskotem na stánku školy.</p>
          </motion.div>

          {/* Den PID — Letná */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/pid-logo-white.svg" alt="Den PID" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Den PID — Letná</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Letenská pláň · sobota 16. května 2026 · 10:00–17:00. Tabule speciální linky PID3.</p>
          </motion.div>

          {/* Den PID — Vozovna Motol */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/pid-logo-white.svg" alt="Den PID" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Den PID — Vozovna Motol</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Autobusový Den PID · 16. května 2026. Tabule v historické vozovně z roku 1936.</p>
          </motion.div>

          {/* Depo Kačerov — Den otevřených dveří */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/dpp-logo.svg" alt="Depo Kačerov" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Depo Kačerov</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Den otevřených dveří · sobota 6. června 2026 · 10.00–16.00. Nejstarší depo pražského metra (linka C).</p>
          </motion.div>

          {/* Prague Bike Fest */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/bikefest-logo.svg" alt="Prague Bike Fest" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Prague Bike Fest 2026</h3>
            <p className="text-gray-400 text-sm leading-relaxed">25.–26. dubna 2026 · Výstaviště Praha. Speciální tabule s vlastním designem a maskotem.</p>
          </motion.div>

          {/* Schola Pragensis */}
          <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/pictures/schola-pragensis-logo.svg" alt="Schola Pragensis" className="h-10 object-contain mb-4" />
            <h3 className="font-bold text-lg mb-2">Schola Pragensis</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Veletrh středních škol v Kongresovém centru Praha. Tabule pro návštěvníky přímo na akci.</p>
          </motion.div>
        </motion.div>
      </div>

      {/* TECH */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <motion.div variants={stagger} {...reveal}>
          <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Stack</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl font-black mb-8">Použité technologie</motion.h2>
        </motion.div>
        <motion.div variants={stagger} {...reveal} className="flex flex-wrap gap-2">
          {TECH.map((t, i) => (
            <motion.span
              key={i}
              variants={fadeUp}
              whileHover={{ y: -3, borderColor: 'rgba(96,165,250,0.5)' }}
              className="border border-white/15 text-gray-300 text-sm px-4 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {t}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* TÝM */}
      <div className="border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={stagger} {...reveal}>
            <motion.p variants={fadeUp} className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Autoři</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black mb-10">Tým</motion.h2>
          </motion.div>
          <motion.div variants={stagger} {...reveal} className="grid gap-5 max-w-sm">
            {[
              { name: "Adam Brož", cls: "2.A · Informační technologie", email: "broz979171@mot.sps-dopravni.cz" },
            ].map((a, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-user text-blue-400 text-lg"></i>
                </div>
                <h3 className="font-bold text-lg">{a.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{a.cls}</p>
                <a href={`mailto:${a.email}`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors break-all flex items-center gap-1.5">
                  <i className="fa-solid fa-envelope text-xs flex-shrink-0"></i>
                  {a.email}
                </a>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-gray-600 text-sm mt-8">Střední průmyslová škola dopravní, a.s.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/10" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
        <motion.div
          variants={stagger} {...reveal}
          className="max-w-6xl mx-auto px-6 py-24 text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-black mb-4">Vyzkoušejte si to</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-8 text-lg">Běží na <span className="text-white font-semibold">timetable.brozovec.eu</span> · 24/7 · bez obsluhy</motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
            <motion.a href={boardLink}
               whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
               className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-900/40 text-lg">
              <i className="fa-solid fa-train-tram"></i>
              Tabule Střední průmyslová škola dopravní, a.s. — Motol
            </motion.a>
            <motion.a href="https://github.com/spsdopravni/spsd_timetable" target="_blank" rel="noopener noreferrer"
               whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
               className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg">
              <i className="fa-brands fa-github"></i>
              GitHub
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-600 text-sm space-y-1">
        <p>
          © 2026{" "}
          <a href="https://brozovec.eu" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
            Adam &quot;Brozovec&quot; Brož
          </a>
          {" · "}Střední průmyslová škola dopravní, a.s. · Data: PID Golemio API
        </p>
        <p className="text-gray-700 text-xs">
          Created and designed by{" "}
          <a href="https://brozovec.eu" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors font-semibold">
            Adam &quot;Brozovec&quot; Brož
          </a>
        </p>
      </footer>

    </div>
  );
};

export default Index;
