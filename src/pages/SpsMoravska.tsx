import React, { useState, useEffect } from "react";
import { TramDeparturesConnected } from "@/components/TramDeparturesConnected";
import { Settings } from "@/components/Settings";
import { WeatherHeader } from "@/components/WeatherHeader";
import { DailyRobot } from "@/components/DailyRobot";
import { Snowfall } from "@/components/Snowfall";
import { ChristmasGarland } from "@/components/ChristmasGarland";
import { useDataContext } from "@/context/DataContext";

const SpsMoravska = () => {
  const { time, seasonalTheme, getDeparturesForStation } = useDataContext();

  useEffect(() => {
    document.body.classList.add('tram-display');
    return () => document.body.classList.remove('tram-display');
  }, []);

  const stations = [
    {
      id: "U354Z1P",
      name: "Jana Masaryka",
      directionJsx: (
        <div className="inline-flex items-center gap-2">
          Karlovo náměstí
          <img src="/pictures/metroB.svg" alt="Metro B" className="flex-shrink-0" style={{ width: '1em', height: '1em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-yellow-500 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em" title="Metro B">B</span>';
          }} />
        </div>
      ),
      direction: "Karlovo náměstí",
      simpleName: "Jana Masaryka",
    },
    {
      id: "U354Z2P",
      name: "Jana Masaryka",
      direction: "Kubánské náměstí",
      simpleName: "Jana Masaryka",
    },
    {
      id: "U744Z1P",
      name: "Šumavská",
      directionJsx: (
        <div className="inline-flex items-center gap-2">
          I. P. Pavlova
          <img src="/pictures/metroC.svg" alt="Metro C" className="flex-shrink-0" style={{ width: '1em', height: '1em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-red-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em" title="Metro C">C</span>';
          }} />
        </div>
      ),
      direction: "I. P. Pavlova",
      simpleName: "Šumavská",
    },
    {
      id: "U744Z2P",
      name: "Šumavská",
      directionJsx: (
        <div className="inline-flex items-center gap-2">
          Želivského
          <img src="/pictures/metroA.svg" alt="Metro A" className="flex-shrink-0" style={{ width: '1em', height: '1em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-green-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em" title="Metro A">A</span>';
          }} />
        </div>
      ),
      direction: "Želivského",
      simpleName: "Šumavská",
    },
  ];

  const currentTime = time.currentTime;
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isDirectionFadingOut, setIsDirectionFadingOut] = useState(false);
  const [directionAnimationKey, setDirectionAnimationKey] = useState(0);

  // Metro data
  interface MetroDirection {
    headsign: string;
    nextMin: number | null;
    interval: number | null;
  }
  const [metroDirections, setMetroDirections] = useState<MetroDirection[]>([]);
  const [activeMetroLine, setActiveMetroLine] = useState<"A" | "C">("A");

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tram-display-settings-moravska');
    const defaultSettings = {
      showWeatherInHeader: false,
      showTimesInMinutes: true,
      testAlert: false,
      disableAnimations: false
    };
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved), showTimesInMinutes: true };
      } catch { return defaultSettings; }
    }
    return defaultSettings;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('tram-display-settings-moravska', JSON.stringify(settings));
  }, [settings]);

  // Metro v headeru rotuje s tram stanicí:
  //   Jana Masaryka (index 0) → Metro A (Náměstí Míru)
  //   Šumavská     (index 1) → Metro C (I. P. Pavlova)
  useEffect(() => {
    const isA = activeMetroLine === "A";
    const stationKey = isA ? 'namestiMiruMetro' : 'ipPavlovaMetro';
    // Hlavní termini podle linky — zkrácené spoje (Skalka, Petřiny, Muzeum,
    // Nádraží Holešovice — short turn na C) se vyřadí.
    const MAIN_TERMINI = isA
      ? ['Nemocnice Motol', 'Depo Hostivař']
      : ['Letňany', 'Háje'];

    const metroData = getDeparturesForStation(stationKey);
    if (metroData.departures.length === 0) {
      setMetroDirections([]);
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);

    const byDirection: Record<string, typeof metroData.departures> = {};
    for (const dep of metroData.departures) {
      const h = dep.headsign || '';
      if (!MAIN_TERMINI.includes(h)) continue;
      if (!byDirection[h]) byDirection[h] = [];
      byDirection[h].push(dep);
    }

    const dirs: MetroDirection[] = Object.entries(byDirection).map(([headsign, deps]) => {
      const sorted = [...deps].sort((a, b) => a.arrival_timestamp - b.arrival_timestamp);
      const nextDep = sorted[0];
      const diff = nextDep.arrival_timestamp - nowSec;
      const nextMin = diff > 0 ? Math.ceil(diff / 60) : null;

      let interval: number | null = null;
      if (sorted.length >= 2) {
        const count = Math.min(sorted.length, 3);
        const gaps: number[] = [];
        for (let i = 1; i < count; i++) {
          gaps.push(sorted[i].arrival_timestamp - sorted[i - 1].arrival_timestamp);
        }
        interval = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length / 60);
      }

      return { headsign, nextMin, interval };
    });

    // Preferovaný směr první: Motol pro A, Letňany pro C (oba centrum-směr).
    dirs.sort((a, b) => {
      const prefA = isA ? a.headsign.includes('Motol') : a.headsign === 'Letňany';
      const prefB = isA ? b.headsign.includes('Motol') : b.headsign === 'Letňany';
      if (prefA) return -1;
      if (prefB) return 1;
      return 0;
    });

    setMetroDirections(dirs);
  }, [currentTime, getDeparturesForStation, activeMetroLine]);

  const handleLogoClick = () => {
    setLogoClickCount(prev => prev + 1);
    if (logoClickTimer) clearTimeout(logoClickTimer);
    const timer = setTimeout(() => {
      if (logoClickCount + 1 >= 3) setShowSettings(true);
      setLogoClickCount(0);
    }, 500);
    setLogoClickTimer(timer);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const calculateStationIndex = (time: Date) => {
    const totalSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
    const cyclePosition = totalSeconds % 30;
    return cyclePosition < 15 ? 0 : 1;
  };

  useEffect(() => {
    const newIndex = calculateStationIndex(currentTime);
    if (newIndex !== currentStationIndex) {
      setIsDirectionFadingOut(true);
      setTimeout(() => {
        setCurrentStationIndex(newIndex);
        setActiveMetroLine(newIndex === 0 ? "A" : "C");
        setDirectionAnimationKey(prev => prev + 1);
        setIsDirectionFadingOut(false);
      }, 400);
    }
  }, [currentTime, currentStationIndex]);

  // 0 = Jana Masaryka (A + B), 1 = Šumavská (A + B)
  const leftStation = currentStationIndex === 0 ? stations[0] : stations[2];
  const rightStation = currentStationIndex === 0 ? stations[1] : stations[3];
  const mainStationName = currentStationIndex === 0 ? "Jana Masaryka" : "Šumavská";

  const leftStationKey = currentStationIndex === 0 ? 'janaMasarykaA' : 'sumavskaA';
  const rightStationKey = currentStationIndex === 0 ? 'janaMasarykaB' : 'sumavskaB';

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden h-screen relative">
        {/* Header */}
        <div
          className="text-white shadow-lg relative"
          style={{
            backgroundImage: "url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')",
            backgroundSize: 'auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            height: '13.5vh',
            minHeight: '112px'
          }}
        >
          <div className="absolute inset-0 bg-blue-900/80"></div>

          <div className="px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 relative z-10 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 items-center">
              {/* Logo + metro info */}
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 justify-start">
                <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                  <img
                    src={seasonalTheme.logoPath}
                    alt="Logo školy"
                    className="object-contain w-56 h-40 sm:w-64 md:w-80 lg:w-96 xl:w-[28rem] sm:h-40 md:h-40 lg:h-40 xl:h-40"
                  />
                </div>
              </div>

              {/* Center — název zastávky + metro */}
              <div className="text-center">
                <h1 className="font-bold leading-tight text-6xl" key={`main-station-${currentStationIndex}`}>
                  {mainStationName}
                </h1>
                {/* Metro rotuje s stanicí: A (Nám. Míru) ↔ C (I. P. Pavlova) */}
                {metroDirections.length > 0 && (() => {
                  const metroSvg = activeMetroLine === "A" ? "/pictures/metroA.svg" : "/pictures/metroC.svg";
                  const fallbackBg = activeMetroLine === "A" ? "bg-green-600" : "bg-red-600";
                  const fallbackLetter = activeMetroLine;
                  const stationLabel = activeMetroLine === "A" ? "Nám. Míru" : "I. P. Pavlova";
                  return (
                    <div className="mt-2 text-2xl text-blue-100" key={`metro-${activeMetroLine}`}>
                      <img src={metroSvg} alt={activeMetroLine} className="inline-block mr-2" style={{ width: '1em', height: '1em', verticalAlign: 'middle' }} onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.outerHTML = `<span class="inline-flex items-center justify-center ${fallbackBg} text-white font-bold rounded" style="width:1em;height:1em;font-size:0.5em;vertical-align:middle">${fallbackLetter}</span>`;
                      }} />
                      <span className="text-blue-300 mr-2">{stationLabel}</span>
                      {metroDirections.map((dir, i) => (
                        <span key={i} className="inline-flex items-center">
                          {i > 0 && (
                            <>
                              <span className="text-blue-400 mx-2">·</span>
                              <img src={metroSvg} alt={activeMetroLine} className="flex-shrink-0 mr-1" style={{ width: '0.9em', height: '0.9em' }} onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.outerHTML = `<span class="inline-flex items-center justify-center ${fallbackBg} text-white font-bold rounded flex-shrink-0 mr-1" style="width:0.9em;height:0.9em;font-size:0.5em">${fallbackLetter}</span>`;
                              }} />
                            </>
                          )}
                          <span className="text-blue-200">{dir.headsign}</span>
                          <span className="font-bold text-white ml-2">{dir.nextMin ?? '—'} min</span>
                          {dir.interval !== null && (
                            <span className="text-blue-300 text-lg"> / {dir.interval} min</span>
                          )}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Time */}
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <div className="font-bold text-7xl">
                    {currentTime.toLocaleTimeString('cs-CZ')}
                  </div>
                  <div className="text-blue-100 mt-2 text-3xl">
                    {currentTime.toLocaleDateString('cs-CZ', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ChristmasGarland />
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div className={`${settings.disableAnimations ? '' : `direction-header-animation ${isDirectionFadingOut ? 'fade-out' : ''}`} bg-white/95 border-b-8 border-blue-600 text-gray-800 px-3 shadow-lg flex items-center justify-center rounded-lg`} style={{ height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`left-header-${directionAnimationKey}`}>
              <div className="flex items-center justify-center gap-2 w-full h-full">
                <h2 className="font-bold leading-none" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>
                  {(leftStation as any).directionJsx || leftStation.direction}
                </h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected
                key={`left-${leftStationKey}-${currentStationIndex}`}
                stationKey={leftStationKey}
                maxItems={7}
                showTimesInMinutes={settings.showTimesInMinutes}
                stationName={leftStation.simpleName}
                disableAnimations={settings.disableAnimations}
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div className={`${settings.disableAnimations ? '' : `direction-header-animation ${isDirectionFadingOut ? 'fade-out' : ''}`} bg-white/95 border-b-8 border-blue-600 text-gray-800 px-3 shadow-lg flex items-center justify-center rounded-lg`} style={{ height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`right-header-${directionAnimationKey}`}>
              <div className="flex items-center justify-center gap-2 w-full h-full">
                <h2 className="font-bold leading-none" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>
                  {(rightStation as any).directionJsx || rightStation.direction}
                </h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected
                key={`right-${rightStationKey}-${currentStationIndex}`}
                stationKey={rightStationKey}
                maxItems={7}
                showTimesInMinutes={settings.showTimesInMinutes}
                stationName={rightStation.simpleName}
                disableAnimations={settings.disableAnimations}
              />
            </div>
          </div>
        </div>

        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingChange={handleSettingChange}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <DailyRobot />
      </div>

      {seasonalTheme.showSnowfall && <Snowfall />}
    </>
  );
};

export default SpsMoravska;
