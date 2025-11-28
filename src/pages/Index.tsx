import React, { useState, useEffect } from "react";
import { TramDeparturesConnected } from "@/components/TramDeparturesConnected";
import { WeatherWidget } from "@/components/WeatherWidget";
import { RouteInfo } from "@/components/RouteInfo";
import { Settings } from "@/components/Settings";
import { WeatherHeader } from "@/components/WeatherHeader";
import { DailyRobot } from "@/components/DailyRobot";
import { AlertBanner } from "@/components/AlertBanner";
import { Snowfall } from "@/components/Snowfall";
import { useDataContext } from "@/context/DataContext";

const Index = () => {
  const { time, isWinterPeriod } = useDataContext();

  const stations = [
    {
      id: "U865Z1P",
      name: "Vozovna (Centrum)",
      displayName: "Vozovna Motol (Centrum)",
      textName: "Vozovna Motol (Centrum)",
      simpleName: "Vozovna Motol",
      direction: "Centrum",
      lat: 50.0755,
      lon: 14.4037
    },
    {
      id: "U865Z2P",
      name: "Vozovna Motol (Řepy)",
      displayName: "Vozovna Motol (Řepy)",
      textName: "Vozovna Motol (Řepy)",
      simpleName: "Vozovna Motol",
      direction: "Řepy",
      lat: 50.0755,
      lon: 14.4037
    },
    {
      id: ["U394Z3P", "U394Z3"],
      name: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Zličín
          <img src="/pictures/metroB.svg" alt="Metro B" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-yellow-500 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro B">B</span>';
          }} />
        </div>
      ),
      displayName: (
        <img src="/pictures/metroB.svg" alt="Metro B" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.outerHTML = '<span class="inline-flex items-center justify-center bg-yellow-500 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro B">B</span>';
        }} />
      ),
      direction: "Zličín",
      textName: "Zličín Metro B",
      simpleName: "Motol",
      lat: 50.0675,
      lon: 14.3365
    },
    {
      id: ["U394Z4P", "U394Z4"],
      name: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Nemocnice Motol
          <img src="/pictures/metroA.svg" alt="Metro A" className="flex-shrink-0" style={{ width: '1em', height: '1em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-green-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro A">A</span>';
          }} />
        </div>
      ),
      displayName: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Nemocnice Motol
          <img src="/pictures/metroA.svg" alt="Metro A" className="flex-shrink-0" style={{ width: '1em', height: '1em'}} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-green-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro A">A</span>';
          }} />
        </div>
      ),
      direction: "Nemocnice Motol",
      textName: "Nemocnice Motol Metro A",
      simpleName: "Motol",
      lat: 50.0677,
      lon: 14.3357
    }
  ];

  const currentTime = time.currentTime;
  const timeOffset = time.timeOffset;
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isDirectionFadingOut, setIsDirectionFadingOut] = useState(false);
  const [directionAnimationKey, setDirectionAnimationKey] = useState(0);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tram-display-settings');
    const defaultSettings = {
      showWeatherInHeader: false,
      showTimesInMinutes: true,
      testAlert: false,
      snowyLogo: true,
      disableAnimations: false
    };

    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsedSettings,
          showTimesInMinutes: true // Vždycky zapnutý odpočet
        };
      } catch (error) {
        return defaultSettings;
      }
    }

    return defaultSettings;
  });

  // Helper funkce pro získání správné cesty k logu
  const getLogoPath = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Sněžné logo fixně od 27.11 do 1.1
    const isWinterPeriod = (month === 11 && day >= 27) || month === 12 || (month === 1 && day === 1);

    if (isWinterPeriod || settings.snowyLogo) {
      return "/pictures/snow_spsd.png";
    }
    return "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png";
  };

  const [showSettings, setShowSettings] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('tram-display-settings', JSON.stringify(settings));
  }, [settings]);


  const handleLogoClick = () => {
    setLogoClickCount(prev => prev + 1);
    
    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }
    
    const timer = setTimeout(() => {
      if (logoClickCount + 1 >= 3) {
        setShowSettings(true);
      }
      setLogoClickCount(0);
    }, 500);
    
    setLogoClickTimer(timer);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const calculateStationIndex = (time: Date) => {
    const totalSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
    const cyclePosition = totalSeconds % 30; // 30 sekundový cyklus (15s + 15s)

    // 0 = Vozovna Motol (0-15 sekund)
    // 1 = Motol (15-30 sekund)
    if (cyclePosition < 15) {
      return 0;
    } else {
      return 1;
    }
  };

  // Station switching based on time from context
  useEffect(() => {
    const newStationIndex = calculateStationIndex(currentTime);

    if (newStationIndex !== currentStationIndex) {
      // Start fade out animation
      setIsDirectionFadingOut(true);

      // After fade out, change station
      setTimeout(() => {
        setCurrentStationIndex(newStationIndex);
        setDirectionAnimationKey(prev => prev + 1);
        setIsDirectionFadingOut(false);
      }, 400); // 300ms fade out + 100ms buffer
    }
  }, [currentTime, currentStationIndex]);

  const motolStations = [
    stations[2],
    stations[3]
  ];

  const vozovnaStations = [
    stations[0],
    stations[1]
  ];

  // Normal split view mode - vždy jedna zastávka, obě směry
  // currentStationIndex 0 = Vozovna Motol (Řepy + Centrum)
  // currentStationIndex 1 = Motol (Zličín + Nemocnice)

  const leftStation = currentStationIndex === 0 ? vozovnaStations[1] : motolStations[0]; // Řepy nebo Zličín
  const rightStation = currentStationIndex === 0 ? vozovnaStations[0] : motolStations[1]; // Centrum nebo Nemocnice
  const mainStationName = currentStationIndex === 0 ? "Vozovna Motol" : "Motol";

  // Station keys pro DataContext
  const leftStationKey = currentStationIndex === 0 ? 'vozovnaRepy' : 'motolZlicin';
  const rightStationKey = currentStationIndex === 0 ? 'vozovnaCentrum' : 'motolNemocnice';

  return (
      <>
      <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden h-screen relative">
        {/* Unified header for split view */}
        <div
          className="text-white shadow-lg relative"
          style={{
            backgroundImage: `url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')`,
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
              {/* Left side - Logo and Weather */}
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 justify-start">
                <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                  <img
                    src={getLogoPath()}
                    alt="Logo školy"
                    className="object-contain w-56 h-40 sm:w-64 md:w-80 lg:w-96 xl:w-[28rem] sm:h-40 md:h-40 lg:h-40 xl:h-40"
                  />
                </div>

                {settings.showWeatherInHeader && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border-2 border-white/30">
                    <WeatherHeader lat={50.0755} lon={14.4378} />
                  </div>
                )}
              </div>

              {/* Center - název zastávky */}
              <div className="text-center">
                <h1 className="font-bold leading-tight text-6xl" key={`main-station-${currentStationIndex}`}>
                  {mainStationName}
                </h1>
              </div>

              {/* Right side - Time and Date */}
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
        </div>

        {/* Content area */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left panel - Směr Řepy nebo Směr Zličín */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            {/* Direction header - elegant style */}
            <div className={`${settings.disableAnimations ? '' : `direction-header-animation ${isDirectionFadingOut ? 'fade-out' : ''}`} bg-white/95 border-b-8 border-blue-600 text-gray-800 px-3 mb-2 shadow-lg flex items-center justify-center rounded-lg`} style={{ height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`left-header-${directionAnimationKey}`}>
              <div className="flex items-center justify-center gap-2 w-full h-full">
                <h2 className="font-bold leading-none" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>
                  {React.isValidElement(leftStation.name) ? (
                    <div className="flex items-center justify-center gap-2">
                      {leftStation.name}
                    </div>
                  ) : leftStation.direction}
                </h2>
              </div>
            </div>

            <div
              className={`flex-1`}
            >
              <TramDeparturesConnected
                key={`left-${leftStationKey}-${currentStationIndex}`}
                stationKey={leftStationKey}
                maxItems={7}
                showTimesInMinutes={settings.showTimesInMinutes}
                stationName={leftStation.simpleName || leftStation.textName || mainStationName}
                disableAnimations={settings.disableAnimations}
              />
            </div>
          </div>

          {/* Right panel - Směr Centrum nebo Směr Nemocnice Motol */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            {/* Direction header - elegant style */}
            <div className={`${settings.disableAnimations ? '' : `direction-header-animation ${isDirectionFadingOut ? 'fade-out' : ''}`} bg-white/95 border-b-8 border-blue-600 text-gray-800 px-3 mb-2 shadow-lg flex items-center justify-center rounded-lg`} style={{ height: '6vh', minHeight: '70px', maxHeight: '90px' }} key={`right-header-${directionAnimationKey}`}>
              <div className="flex items-center justify-center gap-2 w-full h-full">
                <h2 className="font-bold leading-none" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>
                  {React.isValidElement(rightStation.name) ? (
                    <div className="flex items-center justify-center gap-2">
                      {rightStation.name}
                    </div>
                  ) : rightStation.direction}
                </h2>
              </div>
            </div>

            <div
              className={`flex-1`}
            >
              <TramDeparturesConnected
                key={`right-${rightStationKey}-${currentStationIndex}`}
                stationKey={rightStationKey}
                maxItems={7}
                showTimesInMinutes={settings.showTimesInMinutes}
                stationName={rightStation.simpleName || rightStation.textName || mainStationName}
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

      {/* Robot na celé šířce dole */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <DailyRobot />
      </div>

      {/* Sněžení v zimním období */}
      {(isWinterPeriod || settings.snowyLogo) && <Snowfall />}
      </>
    );
};

export default Index;
