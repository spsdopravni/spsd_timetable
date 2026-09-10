import React, { useEffect, useState } from "react";
import { TramDeparturesConnected } from "@/components/TramDeparturesConnected";
import { DailyRobot } from "@/components/DailyRobot";
import { Snowfall } from "@/components/Snowfall";
import { ALL_STATIONS, useSeasonal, useTime } from "@/context/DataContext";
import { walkingMinutes } from "@/utils/walking";
import { getStopCoords } from "@/utils/pidApi";

// Fixní poloha tabule = zastávka Depo Kačerov. Pěší časy k nástupištím A/B se
// počítají odsud (počítač stojí na místě, GPS prohlížeče nedává smysl).
const DISPLAY_LOCATION = { lat: 50.04566, lon: 14.47051 };

const ACCENT = "#E20613"; // DPP / metro C červená

// 2 obrazovky, každá 15 s. Každá obrazovka má levý a pravý sloupec.
// Obrazovka 0 = speciální „vložený spoj" metra C (depo Kačerov ↔ Holešovice),
// generovaný lokálně (klíče v PIDDAY_VIRTUAL_STATIONS, nejsou v PID API).
// Obrazovka 1 = autobusová zastávka Depo Kačerov (nástupiště A/B), živé API.
type Col = {
  stationKey: string;
  label: string;
  hint: string;
  icon: string;
  stationName: string;
};
const SCREENS: { type: "metro" | "bus"; subtitle: string; left: Col; right?: Col }[] = [
  {
    type: "metro",
    subtitle: "Vložený spoj metra C",
    left: {
      stationKey: "depoKacerovMetroOut",
      label: "Z depa Kačerov → Nádraží Holešovice",
      hint: "Speciální vložený spoj — odjezd přímo z depa",
      icon: "fa-solid fa-arrow-right-from-bracket",
      stationName: "Depo Kačerov",
    },
  },
  {
    type: "bus",
    subtitle: "Zastávka Depo Kačerov",
    left: {
      stationKey: "depoKacerovBusA",
      label: "Nástupiště A",
      hint: "118 Spořilov · 138 Skalka · 170 Jižní Město",
      icon: "fa-solid fa-bus",
      stationName: "Depo Kačerov",
    },
    right: {
      stationKey: "depoKacerovBusB",
      label: "Nástupiště B",
      hint: "118 Smíchovské n. · 138 Ak. věd · 170 Pražská čtvrť",
      icon: "fa-solid fa-bus",
      stationName: "Depo Kačerov",
    },
  },
];

const DepoKacerov = () => {
  const time = useTime();
  const { seasonalTheme } = useSeasonal();

  useEffect(() => {
    document.body.classList.add("tram-display");
    return () => document.body.classList.remove("tram-display");
  }, []);

  const currentTime = time.currentTime;

  const totalSeconds =
    currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
  const screenIndex = Math.floor(totalSeconds / 15) % SCREENS.length;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(screenIndex);
  const [animKey, setAnimKey] = useState(0);

  // Walking time z fixní polohy tabule (DISPLAY_LOCATION) ke každému nástupišti.
  const [stopCoords, setStopCoords] = useState<Record<string, { lat: number; lon: number } | null>>({});
  // Pěší časy jen pro reálné zastávky (busy). Metro shuttle jsou virtuální
  // stanice bez stop_id, takže pro ně walk badge nepočítáme.
  const platformKeys = ["depoKacerovBusA", "depoKacerovBusB"];
  useEffect(() => {
    for (const key of platformKeys) {
      const conf = (ALL_STATIONS as Record<string, { id: string | string[] }>)[key];
      if (!conf) continue;
      const stopId = Array.isArray(conf.id) ? conf.id[0] : conf.id;
      if (!stopId || stopCoords[stopId] !== undefined) continue;
      getStopCoords(stopId).then((c) => setStopCoords((prev) => ({ ...prev, [stopId]: c })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function walkSecondsFor(stationKey: string): number | undefined {
    const conf = (ALL_STATIONS as Record<string, { id: string | string[] }>)[stationKey];
    if (!conf) return undefined;
    const stopId = Array.isArray(conf.id) ? conf.id[0] : conf.id;
    const sc = stopId ? stopCoords[stopId] : null;
    if (!sc) return undefined;
    return walkingMinutes(DISPLAY_LOCATION.lat, DISPLAY_LOCATION.lon, sc.lat, sc.lon) * 60;
  }

  useEffect(() => {
    if (screenIndex !== displayIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setDisplayIndex(screenIndex);
        setAnimKey((prev) => prev + 1);
        setIsTransitioning(false);
      }, 400);
    }
  }, [screenIndex, displayIndex]);

  const current = SCREENS[displayIndex];

  const renderColumn = (col: Col, side: "left" | "right") => (
    <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
      <div
        className={`${isTransitioning ? "direction-header-animation fade-out" : "direction-header-animation"} text-white px-3 shadow-lg flex items-center justify-center rounded-lg`}
        style={{ background: ACCENT, height: "6vh", minHeight: "70px", maxHeight: "96px" }}
        key={`${side}-${animKey}`}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full py-1">
          <div className="flex items-center justify-center gap-3">
            <i className={`${col.icon} text-white/90 text-xl`}></i>
            <h2 className="font-black leading-none text-white" style={{ fontSize: "clamp(1.6rem, 3.2vh, 2.4rem)" }}>
              {col.label}
            </h2>
            {walkSecondsFor(col.stationKey) !== undefined && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-base font-bold">
                <i className="fa-solid fa-person-walking" /> {Math.round(walkSecondsFor(col.stationKey)! / 60)} min
              </span>
            )}
          </div>
          <div className="text-white/80 text-sm font-medium leading-none truncate max-w-full">{col.hint}</div>
        </div>
      </div>
      <div className="flex-1">
        <TramDeparturesConnected
          stationKey={col.stationKey}
          maxItems={7}
          showTimesInMinutes={true}
          stationName={col.stationName}
          disableAnimations={false}
          walkSeconds={walkSecondsFor(col.stationKey)}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col overflow-hidden h-screen relative" style={{ background: "#fafafa" }}>
        {/* Header */}
        <div className="text-white shadow-lg relative" style={{ background: "#1a1a1a", height: "13.5vh", minHeight: "112px" }}>
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: ACCENT }} />
          <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: ACCENT }} />

          <div className="px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 relative z-10 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] w-full gap-6 items-center">
              {/* Loga */}
              <div className="flex items-center gap-4 justify-start min-w-0 overflow-hidden">
                <img
                  src="/pictures/dpp-logo.svg"
                  alt="Dopravní podnik Praha"
                  className="object-contain h-10 lg:h-12 max-w-[150px] lg:max-w-[200px] flex-shrink-0"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.outerHTML =
                      '<span class="inline-flex items-center justify-center bg-red-600 text-white font-black rounded-xl px-4" style="height:3rem;font-size:1.75rem">DPP</span>';
                  }}
                />
                <div className="hidden sm:block h-10 w-px bg-white/20 flex-shrink-0" />
                <img
                  src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
                  alt="SPŠD"
                  className="hidden sm:block object-contain h-10 lg:h-12 max-w-[180px] lg:max-w-[230px]"
                />
              </div>

              {/* Název zastávky + podtitul obrazovky */}
              <div className="text-center min-w-0 px-2">
                <h1
                  className="font-black leading-tight tracking-tight whitespace-nowrap"
                  style={{ fontSize: "clamp(2.25rem, 3.2vw, 3.25rem)" }}
                  key={`title-${animKey}`}
                >
                  Depo Kačerov
                </h1>
                <div className="mt-1 text-2xl font-bold" style={{ color: ACCENT }} key={`sub-${animKey}`}>
                  {current.type === "metro" ? (
                    <i className="fa-solid fa-train-subway mr-2" />
                  ) : (
                    <i className="fa-solid fa-bus mr-2" />
                  )}
                  <span className="text-white">{current.subtitle}</span>
                </div>
              </div>

              {/* Čas */}
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <div className="font-bold text-7xl">{currentTime.toLocaleTimeString("cs-CZ")}</div>
                  <div className="mt-2 text-3xl" style={{ color: ACCENT }}>
                    {currentTime.toLocaleDateString("cs-CZ", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content — jedno- nebo dvousloupcová tabule podle screenIndex */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {renderColumn(current.left, "left")}
          {current.right && (
            <>
              <div className="hidden lg:block w-1" style={{ background: ACCENT }} />
              {renderColumn(current.right, "right")}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2" style={{ background: "#1a1a1a" }}>
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-door-open text-xl" style={{ color: ACCENT }}></i>
            <span className="font-bold text-white text-sm">Den otevřených dveří · Depo Kačerov</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">dpp.cz</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">Střední průmyslová škola dopravní, a.s.</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <DailyRobot
          barColor="#1a1a1a"
          robotImage="/pictures/robot-depo-kacerov.png"
          customMessages={[
            "Vítejte na Dni otevřených dveří v depu Kačerov!",
            "Den otevřených dveří · Depo Kačerov · sobota 6. června 2026 · 10.00–16.00",
            "Depo Kačerov je nejstarší depo pražského metra — slouží lince C od roku 1974.",
            "Odjezdová tabule od Střední průmyslové školy dopravní · sps-dopravni.cz",
            "#studujSPSD · Střední průmyslová škola dopravní",
            "#pracujvDPP · Dopravní podnik hlavního města Prahy",
            "Speciální vložený spoj metra C jezdí přímo z depa na Nádraží Holešovice.",
            "Ze zastávky Depo Kačerov jedou autobusy 118, 138 a 170.",
            "DPP přepraví přes miliardu cestujících ročně.",
            "Víte, že linka C byla první linkou pražského metra? Otevřela v roce 1974.",
            "#studujSPSD · Přijď na den otevřených dveří naší školy!",
            "Sledujte nás na Instagramu @spsdopravni",
            "Děkujeme, že jste přišli! Hezký den přeje SPŠD.",
            "dpp.cz · Dopravní podnik hlavního města Prahy",
          ]}
        />
      </div>

      {seasonalTheme.showSnowfall && <Snowfall />}
    </>
  );
};

export default DepoKacerov;
