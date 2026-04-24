import React, { useEffect, useState } from "react";
import { TramDeparturesConnected } from "@/components/TramDeparturesConnected";
import { DailyRobot } from "@/components/DailyRobot";
import { Snowfall } from "@/components/Snowfall";
import { ChristmasGarland } from "@/components/ChristmasGarland";
import { MeteoStation } from "@/components/MeteoStation";
import { useDataContext, ALL_STATIONS } from "@/context/DataContext";
import { useUserLocation } from "@/utils/useUserLocation";
import { walkingMinutes } from "@/utils/walking";
import { getStopCoords } from "@/utils/pidApi";

const Bikefest = () => {
  const { time, seasonalTheme, getDeparturesForStation } = useDataContext();

  useEffect(() => {
    document.body.classList.add('tram-display');
    return () => document.body.classList.remove('tram-display');
  }, []);

  const currentTime = time.currentTime;

  // 3 obrazovky, každá 15s
  // 0 = Výstaviště tram (A | B)
  // 1 = Praha-Výstaviště vlak
  // 2 = Praha-Bubny vlak
  const totalSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
  const screenIndex = Math.floor(totalSeconds / 15) % 3;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(screenIndex);
  const [animKey, setAnimKey] = useState(0);

  // GPS-based walking time pro jednotlivá nástupiště. Pokud uživatel polohu
  // nepovolí, fallback na hardcoded heuristiku v TramDeparturesConnected.
  const userLoc = useUserLocation();
  const [stopCoords, setStopCoords] = useState<Record<string, { lat: number; lon: number } | null>>({});
  const platformKeys = ["vystavisteA", "vystavisteB", "vystavisteVlak", "prahaBubny"];
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
    if (!userLoc.location) return undefined;
    const conf = (ALL_STATIONS as Record<string, { id: string | string[] }>)[stationKey];
    if (!conf) return undefined;
    const stopId = Array.isArray(conf.id) ? conf.id[0] : conf.id;
    const sc = stopId ? stopCoords[stopId] : null;
    if (!sc) return undefined;
    return walkingMinutes(userLoc.location.lat, userLoc.location.lon, sc.lat, sc.lon) * 60;
  }

  useEffect(() => {
    if (screenIndex !== displayIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setDisplayIndex(screenIndex);
        setAnimKey(prev => prev + 1);
        setIsTransitioning(false);
      }, 400);
    }
  }, [screenIndex, displayIndex]);

  const screens = [
    { title: 'Výstaviště', icon: 'fa-solid fa-train-tram', type: 'tram' },
    { title: 'Vlakové nádraží Praha-Výstaviště', icon: 'fa-solid fa-train', type: 'vlak' },
    { title: 'Vlakové nádraží Praha-Bubny', icon: 'fa-solid fa-train', type: 'vlak' },
  ];
  const current = screens[displayIndex];

  // Metro C header — střídání Vltavská / Holešovice
  const metroStations = [
    { key: 'vltavskaMetro', name: 'Vltavská' },
    { key: 'holesoviceMetro', name: 'Nádraží Holešovice' },
  ];
  const metroIdx = Math.floor(currentTime.getSeconds() / 10) % 2;
  const currentMetro = metroStations[metroIdx];
  const metroData = getDeparturesForStation(currentMetro.key);

  let metroInterval: number | null = null;
  if (metroData.departures.length >= 2) {
    const sorted = [...metroData.departures].sort((a, b) => a.arrival_timestamp - b.arrival_timestamp);
    const count = Math.min(sorted.length, 3);
    const gaps: number[] = [];
    for (let i = 1; i < count; i++) {
      gaps.push(sorted[i].arrival_timestamp - sorted[i - 1].arrival_timestamp);
    }
    metroInterval = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length / 60);
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden h-screen relative" style={{ background: '#fafafa' }}>
        {/* Header */}
        <div className="text-white shadow-lg relative" style={{ background: '#1a1a1a', height: '13.5vh', minHeight: '112px' }}>
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: '#FDD835' }} />
          <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: '#FDD835' }} />

          <div className="px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 relative z-10 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 items-center">
              {/* Loga */}
              <div className="flex items-center gap-6 justify-start">
                <img src="/pictures/bikefest-logo.svg" alt="Prague Bike Fest" className="object-contain h-16 sm:h-20 lg:h-24" />
                <div className="hidden sm:block h-12 w-px bg-white/20" />
                <img src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png" alt="SPŠD" className="hidden sm:block object-contain h-16 lg:h-20" />
              </div>

              {/* Název zastávky + metro C */}
              <div className="text-center">
                <h1 className="font-black leading-tight tracking-tight whitespace-nowrap" style={{ fontSize: current.type === 'vlak' ? 'clamp(2rem, 4vw, 3.5rem)' : '3.75rem' }} key={`title-${animKey}`}>
                  {current.title}
                </h1>
                <div className="mt-2 text-2xl" style={{ color: '#FDD835' }}>
                  <img src="/pictures/metroC.svg" alt="C" className="inline-block mr-2" style={{ width: '1em', height: '1em', verticalAlign: 'middle' }} onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.outerHTML = '<span class="inline-flex items-center justify-center bg-red-600 text-white font-bold rounded" style="width:1em;height:1em;font-size:0.5em;vertical-align:middle">C</span>';
                  }} />
                  <span className="text-white">{currentMetro.name}</span>
                  {metroInterval !== null && (
                    <span className="ml-2" style={{ color: '#FDD835' }}>interval ~{metroInterval} min</span>
                  )}
                </div>
              </div>

              {/* Čas */}
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <div className="font-bold text-7xl">{currentTime.toLocaleTimeString('cs-CZ')}</div>
                  <div className="mt-2 text-3xl" style={{ color: '#FDD835' }}>
                    {currentTime.toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ChristmasGarland />
        </div>

        {/* Meteostanice */}
        <MeteoStation variant="bikefest" />

        {/* Content — mění se podle screenIndex */}
        {displayIndex === 0 && (
          /* Výstaviště tram — A | B */
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
            <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
              <div className={`${isTransitioning ? 'direction-header-animation fade-out' : 'direction-header-animation'} text-gray-900 px-3 shadow-lg flex items-center justify-center rounded-lg`} style={{ background: '#FDD835', height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`left-${animKey}`}>
                <div className="flex items-center justify-center gap-3 w-full h-full">
                  <i className="fa-solid fa-location-dot text-gray-800 text-xl"></i>
                  <h2 className="font-black leading-none text-gray-900" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>Nástupiště A</h2>
                  {walkSecondsFor('vystavisteA') !== undefined && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-900/15 px-3 py-1 text-base font-bold">
                      <i className="fa-solid fa-person-walking" /> {Math.round(walkSecondsFor('vystavisteA')! / 60)} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <TramDeparturesConnected stationKey="vystavisteA" maxItems={7} showTimesInMinutes={true} stationName="Výstaviště" disableAnimations={false} walkSeconds={walkSecondsFor('vystavisteA')} />
              </div>
            </div>

            <div className="hidden lg:block w-1" style={{ background: '#FDD835' }} />

            <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
              <div className={`${isTransitioning ? 'direction-header-animation fade-out' : 'direction-header-animation'} text-gray-900 px-3 shadow-lg flex items-center justify-center rounded-lg`} style={{ background: '#FDD835', height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`right-${animKey}`}>
                <div className="flex items-center justify-center gap-3 w-full h-full">
                  <i className="fa-solid fa-location-dot text-gray-800 text-xl"></i>
                  <h2 className="font-black leading-none text-gray-900" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>Nástupiště B</h2>
                  {walkSecondsFor('vystavisteB') !== undefined && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-900/15 px-3 py-1 text-base font-bold">
                      <i className="fa-solid fa-person-walking" /> {Math.round(walkSecondsFor('vystavisteB')! / 60)} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <TramDeparturesConnected stationKey="vystavisteB" maxItems={7} showTimesInMinutes={true} stationName="Výstaviště" disableAnimations={false} walkSeconds={walkSecondsFor('vystavisteB')} />
              </div>
            </div>
          </div>
        )}

        {displayIndex === 1 && (
          /* Praha-Výstaviště vlak */
          <div className="flex flex-col flex-1 overflow-hidden min-h-0 p-2">
            <div className={`${isTransitioning ? 'direction-header-animation fade-out' : 'direction-header-animation'} text-gray-900 px-3 shadow-lg flex items-center justify-center rounded-lg`} style={{ background: '#FDD835', height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`vlak1-${animKey}`}>
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <i className="fa-solid fa-train text-gray-800 text-xl"></i>
                <h2 className="font-black leading-none text-gray-900" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>Vlakové nádraží Praha-Výstaviště</h2>
                {walkSecondsFor('vystavisteVlak') !== undefined && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-900/15 px-3 py-1 text-base font-bold">
                    <i className="fa-solid fa-person-walking" /> {Math.round(walkSecondsFor('vystavisteVlak')! / 60)} min
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected stationKey="vystavisteVlak" maxItems={7} showTimesInMinutes={true} stationName="Praha-Výstaviště" disableAnimations={false} walkSeconds={walkSecondsFor('vystavisteVlak')} />
            </div>
          </div>
        )}

        {displayIndex === 2 && (
          /* Praha-Bubny vlak */
          <div className="flex flex-col flex-1 overflow-hidden min-h-0 p-2">
            <div className={`${isTransitioning ? 'direction-header-animation fade-out' : 'direction-header-animation'} text-gray-900 px-3 shadow-lg flex items-center justify-center rounded-lg`} style={{ background: '#FDD835', height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`vlak2-${animKey}`}>
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <i className="fa-solid fa-train text-gray-800 text-xl"></i>
                <h2 className="font-black leading-none text-gray-900" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>Vlakové nádraží Praha-Bubny</h2>
                {walkSecondsFor('prahaBubny') !== undefined && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-900/15 px-3 py-1 text-base font-bold">
                    <i className="fa-solid fa-person-walking" /> {Math.round(walkSecondsFor('prahaBubny')! / 60)} min
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected stationKey="prahaBubny" maxItems={7} showTimesInMinutes={true} stationName="Praha-Bubny" disableAnimations={false} walkSeconds={walkSecondsFor('prahaBubny')} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-bicycle text-xl" style={{ color: '#FDD835' }}></i>
            <span className="font-bold text-white text-sm">Prague Bike Fest 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">praguebikefest.cz</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">Střední průmyslová škola dopravní, a.s.</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <DailyRobot barColor="#1a1a1a" robotImage="/pictures/robot-bikefest.png" customMessages={[
          "Vítejte na Prague Bike Fest 2026!",
          "Prague Bike Fest · 25.–26. dubna 2026 · Výstaviště Praha",
          "Nejbližší metro C: Vltavská (5 min chůze) nebo Nádraží Holešovice (8 min chůze)",
          "Odjezdová tabule od Střední průmyslové školy dopravní · sps-dopravni.cz",
          "#studujSPSD · Střední průmyslová škola dopravní",
          "#pracujvDPP · Dopravní podnik hlavního města Prahy",
          "praguebikefest.cz · Největší cyklistický festival v Česku",
          "sps-dopravni.cz · Střední průmyslová škola dopravní",
          "Děkujeme, že jezdíte na kole!",
          "Víte, že Prahu protíná přes 200 km cyklostezek?",
          "Praha má jeden z nejlepších systémů MHD na světě!",
          "#studujSPSD · Přijď na den otevřených dveří!",
          "Sledujte nás na Instagramu @spsdopravni",
          "DPP přepraví přes miliardu cestujících ročně",
          "Prague Bike Fest 2026 · praguebikefest.cz",
        ]} />
      </div>

      {seasonalTheme.showSnowfall && <Snowfall />}
    </>
  );
};

export default Bikefest;
