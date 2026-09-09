import React, { useState, useEffect } from "react";
import { TramDeparturesConnected } from "@/components/TramDeparturesConnected";
import { DailyRobot } from "@/components/DailyRobot";
import { Snowfall } from "@/components/Snowfall";
import { ChristmasGarland } from "@/components/ChristmasGarland";
import { useDataContext } from "@/context/DataContext";

const ACCENT = "#dc301b"; // PID červená

const VozovnaMotolPidDay = () => {
  const { time, seasonalTheme } = useDataContext();

  useEffect(() => {
    document.body.classList.add('tram-display');
    return () => document.body.classList.remove('tram-display');
  }, []);

  const currentTime = time.currentTime;

  // Stanice – stejná struktura jako Spsmotol.tsx (Vozovna Motol ↔ Motol s metry)
  const stations = [
    {
      id: "U865Z1P",
      name: "Vozovna Motol (Centrum)",
      direction: "Centrum",
      textName: "Vozovna Motol (Centrum)",
      simpleName: "Vozovna Motol",
    },
    {
      id: "U865Z2P",
      name: "Vozovna Motol (Řepy)",
      direction: "Řepy",
      textName: "Vozovna Motol (Řepy)",
      simpleName: "Vozovna Motol",
    },
    {
      id: ["U394Z3P", "U394Z3"],
      name: (
        <div className="inline-flex items-center gap-2">
          Zličín
          <img src="/pictures/metroB.svg" alt="Metro B" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-yellow-500 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro B">B</span>';
          }} />
        </div>
      ),
      direction: "Zličín",
      textName: "Zličín Metro B",
      simpleName: "Motol",
    },
    {
      id: ["U394Z4P", "U394Z4"],
      name: (
        <div className="inline-flex items-center gap-2">
          Nemocnice Motol
          <img src="/pictures/metroA.svg" alt="Metro A" className="flex-shrink-0" style={{ width: '1em', height: '1em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-green-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro A">A</span>';
          }} />
        </div>
      ),
      direction: "Nemocnice Motol",
      textName: "Nemocnice Motol Metro A",
      simpleName: "Motol",
    }
  ];

  // 30s cycling: 0-15s = Vozovna Motol, 15-30s = Motol (s metry)
  const calculateStationIndex = (t: Date) => {
    const totalSeconds = t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();
    return (totalSeconds % 30) < 15 ? 0 : 1;
  };

  const [currentStationIndex, setCurrentStationIndex] = useState(() => calculateStationIndex(currentTime));
  const [isDirectionFadingOut, setIsDirectionFadingOut] = useState(false);
  const [directionAnimationKey, setDirectionAnimationKey] = useState(0);

  useEffect(() => {
    const newIdx = calculateStationIndex(currentTime);
    if (newIdx !== currentStationIndex) {
      setIsDirectionFadingOut(true);
      setTimeout(() => {
        setCurrentStationIndex(newIdx);
        setDirectionAnimationKey(prev => prev + 1);
        setIsDirectionFadingOut(false);
      }, 400);
    }
  }, [currentTime, currentStationIndex]);

  const vozovnaStations = [stations[0], stations[1]];
  const motolStations = [stations[2], stations[3]];

  // Levý = Řepy / Zličín, Pravý = Centrum / Nemocnice
  const leftStation  = currentStationIndex === 0 ? vozovnaStations[1] : motolStations[0];
  const rightStation = currentStationIndex === 0 ? vozovnaStations[0] : motolStations[1];
  const mainStationName = currentStationIndex === 0 ? "Vozovna Motol" : "Motol";

  const leftStationKey  = currentStationIndex === 0 ? 'vozovnaRepy'    : 'motolZlicin';
  const rightStationKey = currentStationIndex === 0 ? 'vozovnaCentrum' : 'motolNemocnice';

  return (
    <>
      <div className="flex flex-col overflow-hidden h-screen relative" style={{ background: '#fafafa' }}>
        {/* Header */}
        <div className="text-white shadow-lg relative" style={{ background: '#1a1a1a', height: '13.5vh', minHeight: '112px' }}>
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: ACCENT }} />
          <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: ACCENT }} />

          <div className="px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 relative z-10 h-full">
            {/* Cycling název zastávky uprostřed */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
              <h1
                className="font-black leading-tight tracking-tight text-center"
                style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.75rem)' }}
                key={`main-station-${currentStationIndex}`}
              >
                {mainStationName}
              </h1>
            </div>

            <div className="relative flex items-center justify-between h-full gap-4">
              <div className="flex items-center gap-5">
                <img
                  src="/pictures/pid-logo.png"
                  alt="PID — Pražská integrovaná doprava"
                  className="object-contain h-10 sm:h-14 lg:h-16"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.outerHTML = '<span style="color:#dc301b;font-weight:900;font-size:1.6rem;letter-spacing:0.05em">PID</span>';
                  }}
                />
                <div className="hidden sm:block h-12 w-0.5 bg-white/30 rounded-full" />
                <img src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png" alt="SPŠD" className="hidden sm:block object-contain h-10 lg:h-14" />
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="font-bold text-6xl lg:text-7xl leading-none">{currentTime.toLocaleTimeString('cs-CZ')}</div>
                <div className="text-2xl lg:text-3xl leading-none" style={{ color: ACCENT }}>
                  {currentTime.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>

          <ChristmasGarland />
        </div>

        {/* Content: 2 cycling sloupce + 3. trvalý sloupec PID3 */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Levý cycling sloupec — Vozovna→Řepy / Motol→Zličín */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div
              className={`direction-header-animation ${isDirectionFadingOut ? 'fade-out' : ''} text-white px-3 shadow-lg flex items-center justify-center rounded-lg`}
              style={{ background: ACCENT, height: '6vh', minHeight: '70px', maxHeight: '90px' }}
              key={`left-header-${directionAnimationKey}`}
            >
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <i className="fa-solid fa-location-dot text-white text-xl"></i>
                <h2 className="font-black leading-none text-white" style={{ fontSize: 'clamp(1.5rem, 3vh, 2.25rem)' }}>
                  {mainStationName} →&nbsp;
                  {React.isValidElement(leftStation.name) ? (
                    <span className="inline-flex items-center gap-2">{leftStation.name}</span>
                  ) : leftStation.direction}
                </h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected
                key={`left-${leftStationKey}-${currentStationIndex}`}
                stationKey={leftStationKey}
                maxItems={7}
                showTimesInMinutes={true}
                stationName={leftStation.simpleName || leftStation.textName || mainStationName}
                disableAnimations={false}
              />
            </div>
          </div>

          <div className="hidden lg:block w-1" style={{ background: ACCENT }} />

          {/* Prostřední cycling sloupec — Vozovna→Centrum / Motol→Nemocnice */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div
              className={`direction-header-animation ${isDirectionFadingOut ? 'fade-out' : ''} text-white px-3 shadow-lg flex items-center justify-center rounded-lg`}
              style={{ background: ACCENT, height: '6vh', minHeight: '70px', maxHeight: '90px' }}
              key={`right-header-${directionAnimationKey}`}
            >
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <i className="fa-solid fa-location-dot text-white text-xl"></i>
                <h2 className="font-black leading-none text-white" style={{ fontSize: 'clamp(1.5rem, 3vh, 2.25rem)' }}>
                  {mainStationName} →&nbsp;
                  {React.isValidElement(rightStation.name) ? (
                    <span className="inline-flex items-center gap-2">{rightStation.name}</span>
                  ) : rightStation.direction}
                </h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected
                key={`right-${rightStationKey}-${currentStationIndex}`}
                stationKey={rightStationKey}
                maxItems={7}
                showTimesInMinutes={true}
                stationName={rightStation.simpleName || rightStation.textName || mainStationName}
                disableAnimations={false}
              />
            </div>
          </div>

          <div className="hidden lg:block w-1" style={{ background: ACCENT }} />

          {/* Pravý trvalý sloupec — Linka PID3 (Den PID) */}
          <div className="flex-1 lg:max-w-[26vw] p-2 overflow-hidden flex flex-col min-h-0">
            <div
              className="text-white px-3 shadow-lg flex items-center justify-center rounded-lg"
              style={{ background: '#1a1a1a', height: '6vh', minHeight: '70px', maxHeight: '90px', border: `2px solid ${ACCENT}` }}
            >
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <span
                  className="inline-flex items-center justify-center font-black px-3 py-1 rounded"
                  style={{ background: '#8dc63f', color: '#fff', fontSize: 'clamp(1rem, 2.2vh, 1.5rem)', lineHeight: 1 }}
                  title="PID3 — speciální linka Den PID 2026"
                >PID3</span>
                <h2 className="font-black leading-none text-white" style={{ fontSize: 'clamp(1.25rem, 2.6vh, 1.85rem)' }}>
                  → Letenská
                </h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected
                stationKey="pid3VozovnaMotol"
                maxItems={7}
                showTimesInMinutes={true}
                stationName="Linka PID3"
                disableAnimations={false}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-bus text-xl" style={{ color: ACCENT }}></i>
            <span className="font-bold text-white text-sm">Autobusový den PID · Vozovna Motol · 16. 5. 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">pid.cz</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">Střední průmyslová škola dopravní, a.s.</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <DailyRobot barColor="#1a1a1a" robotImage="/pictures/pidday.png" customMessages={[
          "Vítejte ve Vozovně Motol — zastávka linky PID3 (Den PID 2026)!",
          "Den PID · Letenská pláň · sobota 16. května 2026 · 10:00–17:00",
          "Linka PID3 přijíždí každých 15 min a odváží vás zpět na Letnou",
          "Jízdy speciálními linkami jsou ZDARMA — místenky bezplatně na zastávce",
          "Tramvajové linky 9, 10, 16 z Vozovny Motol jezdí jako obvykle",
          "Z Motola přestoupíte na metro B (Zličín) nebo metro A (Nemocnice Motol)",
          "Odjezdová tabule od Střední průmyslové školy dopravní · sps-dopravni.cz",
          "#studujSPSD · Střední průmyslová škola dopravní",
          "#pracujvDPP · Dopravní podnik hlavního města Prahy",
          "Vozovna Motol slouží tramvajím od roku 1936",
          "PID přepraví ročně přes 1,3 miliardy cestujících",
          "pid.cz · Pražská integrovaná doprava",
          "sps-dopravni.cz · Střední průmyslová škola dopravní",
          "Sledujte nás na Instagramu @spsdopravni",
        ]} />
      </div>

      {seasonalTheme.showSnowfall && <Snowfall />}
    </>
  );
};

export default VozovnaMotolPidDay;
