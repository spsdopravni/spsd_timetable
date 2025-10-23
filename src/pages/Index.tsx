import React, { useState, useEffect } from "react";
import { TramDepartures } from "@/components/TramDepartures";
import { WeatherWidget } from "@/components/WeatherWidget";
import { RouteInfo } from "@/components/RouteInfo";
import { Settings } from "@/components/Settings";
import { WeatherHeader } from "@/components/WeatherHeader";
import { DailyRobot } from "@/components/DailyRobot";
import { AlertBanner } from "@/components/AlertBanner";

const Index = () => {
  const stations = [
    {
      id: "U865Z1P",
      name: "Vozovna (Směr Centrum)",
      displayName: "Vozovna Motol (Směr Centrum)",
      textName: "Vozovna Motol (Směr Centrum)",
      simpleName: "Vozovna Motol",
      direction: "Směr Centrum",
      lat: 50.0755,
      lon: 14.4037
    },
    {
      id: "U865Z2P",
      name: "Vozovna Motol (Směr Řepy)",
      displayName: "Vozovna Motol (Směr Řepy)",
      textName: "Vozovna Motol (Směr Řepy)",
      simpleName: "Vozovna Motol",
      direction: "Směr Řepy",
      lat: 50.0755,
      lon: 14.4037
    },
    {
      id: ["U394Z3P", "U394Z3"],
      name: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Směr Zličín
          <img src="/pictures/metroB.svg" alt="Metro B" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-yellow-500 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro B">B</span>';
          }} />
        </div>
      ),
      displayName: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Směr Zličín
          <img src="/pictures/metroB.svg" alt="Metro B" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-yellow-500 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro B">B</span>';
          }} />
        </div>
      ),
      textName: "Směr Zličín Metro B",
      simpleName: "Motol",
      lat: 50.0675,
      lon: 14.3365
    },
    {
      id: ["U394Z4P", "U394Z4"],
      name: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Směr Nemocnice Motol
          <img src="/pictures/metroA.svg" alt="Metro A" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-green-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro A">A</span>';
          }} />
        </div>
      ),
      displayName: (
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
          Směr Nemocnice Motol
          <img src="/pictures/metroA.svg" alt="Metro A" className="flex-shrink-0" style={{ width: '1em', height: '1em', marginTop: '0.15em' }} onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center bg-green-600 text-white font-bold rounded flex-shrink-0" style="width: 1em; height: 1em; font-size: 0.6em; margin-top: 0.15em" title="Metro A">A</span>';
          }} />
        </div>
      ),
      textName: "Směr Nemocnice Motol Metro A",
      simpleName: "Motol",
      lat: 50.0677,
      lon: 14.3357
    }
  ];

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0); // Offset mezi serverovým a lokálním časem

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tram-display-settings');
    const defaultSettings = {
      showRightPanel: true,
      zoomLevel: 1.0,
      splitView: true,
      logoSize: 1.0,
      showWeatherInHeader: false,
      vozovnaOnlyMode: false,
      showTimesInMinutes: true,
      vozovnaUnifiedHeader: false,
      testAlert: false,
      lowPerformanceMode: false,
      snowyLogo: false
    };

    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsedSettings,
          logoSize: typeof parsedSettings.logoSize === 'number' && !isNaN(parsedSettings.logoSize)
            ? parsedSettings.logoSize
            : 1.0,
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
    return settings.snowyLogo
      ? "/pictures/snow_spsd.png"
      : "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png";
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
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      if (key === 'logoSize') {
        newSettings.logoSize = typeof value === 'number' && !isNaN(value) ? value : 1.0;
      }

      return newSettings;
    });
  };

  // Synchronizace času s WorldTimeAPI
  const fetchWorldTime = async (): Promise<Date | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Prague', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const serverTime = new Date(data.datetime);
      return serverTime;
    } catch (error) {
      // Fallback na lokální čas
      return null;
    }
  };

  const calculateStationIndex = (time: Date) => {
    const totalSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
    const cyclePosition = totalSeconds % 20; // 20 sekundový cyklus (10s + 10s)

    // 0 = Vozovna Motol (0-10 sekund)
    // 1 = Motol (10-20 sekund)
    if (cyclePosition < 10) {
      return 0;
    } else {
      return 1;
    }
  };

  // Inicializace a synchronizace času
  useEffect(() => {
    const initializeTime = async () => {
      const serverTime = await fetchWorldTime();

      if (serverTime) {
        const localTime = new Date();
        const offset = serverTime.getTime() - localTime.getTime();
        setTimeOffset(offset);
        // setWorldTime(serverTime);
      } else {
        // Fallback na lokální čas
        setTimeOffset(0);
        // setWorldTime(new Date());
      }
    };

    initializeTime();

    // Re-synchronizace každých 10 minut (600000 ms) - optimalizováno pro 1 GB RAM
    const syncInterval = setInterval(async () => {
      const serverTime = await fetchWorldTime();
      if (serverTime) {
        const localTime = new Date();
        const offset = serverTime.getTime() - localTime.getTime();
        setTimeOffset(offset);
        // setWorldTime(serverTime);
      }
    }, 600000); // 10 minut

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    const updateTimeAndStation = () => {
      // Použij offset pro přesný čas
      const localTime = new Date();
      const adjustedTime = new Date(localTime.getTime() + timeOffset);
      setCurrentTime(adjustedTime);

      const newStationIndex = calculateStationIndex(adjustedTime);

      if (newStationIndex !== currentStationIndex) {
        // setIsTransitioning(true);
        setCurrentStationIndex(newStationIndex);

        setTimeout(() => {
          // setIsTransitioning(false);
        }, 100);
      }
    };

    // Inicializace při prvním načtení
    updateTimeAndStation();

    // Update každou sekundu
    const timer = setInterval(updateTimeAndStation, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [currentStationIndex, timeOffset]);

  const motolStations = [
    stations[2],
    stations[3]
  ];

  const vozovnaStations = [
    stations[0],
    stations[1]
  ];

  const currentStation = stations[currentStationIndex];

  const getLogoStyle = () => {
    if (settings.logoSize !== 1.0) {
      return {
        transform: `scale(${settings.logoSize})`,
        transformOrigin: 'center'
      };
    }
    return {};
  };

  const renderUnifiedHeader = () => (
    <div
      className="text-white shadow-lg relative col-span-2"
      style={{
        backgroundImage: `url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')`,
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
        height: '7.5vh',
        minHeight: '60px'
      }}
    >
      <div className="absolute inset-0 bg-blue-900/80"></div>

      <div className="relative z-10 h-full px-4 flex items-center justify-between gap-6">
        {/* Vlevo - Logo školy */}
        <div className="cursor-pointer flex-shrink-0" onClick={handleLogoClick}>
          <img
            src={getLogoPath()}
            alt="Logo školy"
            className="object-contain"
            style={{
              height: '7vh',
              maxHeight: '70px',
              width: 'auto'
            }}
          />
        </div>

        {/* Uprostřed - Stanice */}
        <div className="flex-1 text-center">
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(1.5rem, 4vh, 3rem)' }}
          >
            Vozovna Motol
          </h1>
          <div
            className="flex items-center justify-center gap-2 mt-1 text-blue-100"
            style={{ fontSize: 'clamp(0.75rem, 1.5vh, 1rem)' }}
          >
            <i className="fas fa-person-walking"></i>
            <span>6 min • 400 m</span>
          </div>
        </div>

        {/* Vpravo - Čas a datum */}
        <div className="text-right flex-shrink-0">
          <div
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(1.75rem, 4.5vh, 3.5rem)' }}
          >
            {currentTime.toLocaleTimeString('cs-CZ')}
          </div>
          <div
            className="text-blue-100 mt-1"
            style={{ fontSize: 'clamp(0.75rem, 1.8vh, 1.25rem)' }}
          >
            {currentTime.toLocaleDateString('cs-CZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeftHeader = (station: any) => (
    <div
      className="text-white shadow-lg relative"
      style={{
        backgroundImage: `url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')`,
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
        height: '9vh',
        minHeight: '90px'
      }}
    >
      <div className="absolute inset-0 bg-blue-900/80"></div>

      <div className="px-2 sm:px-6 py-2 sm:py-4 relative z-10 h-full flex items-center">
        {settings.vozovnaOnlyMode && settings.splitView ? (
          // Vozovna only mode layout - centered title
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-6">
              <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                <img
                  src={getLogoPath()}
                  alt="Logo školy"
                  className="object-contain w-32 h-32 sm:w-[512px] sm:h-[512px]"
                  style={getLogoStyle()}
                />
              </div>
            </div>

            <div className="flex-1 text-center">
              <h1 className="font-bold leading-tight text-6xl">
                Vozovna Motol
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2 text-blue-100">
                <i className="fas fa-person-walking text-2xl"></i>
                <span className="text-xl font-semibold">6 min • 400 m</span>
              </div>
            </div>
          </div>
        ) : (
          // Normal split view layout
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                <img
                  src={getLogoPath()}
                  alt="Logo školy"
                  className="object-contain w-64 h-64"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-bold leading-tight text-4xl" key={`station-${currentStationIndex}`}>
                  {React.isValidElement(station.displayName) ?
                    station.displayName :
                    (station.textName || station.displayName)
                  }
                </h1>
                {(station.textName === "Vozovna Motol" || station.simpleName === "Vozovna Motol") && (
                  <div className="flex items-center gap-2 mt-2 text-blue-100">
                    <i className="fas fa-person-walking text-xl"></i>
                    <span className="text-lg font-semibold">6 min • 400 m</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {settings.showWeatherInHeader && (
                <div className="text-5xl">
                  <WeatherHeader lat={50.0755} lon={14.4378} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRightHeader = (station: any) => (
    <div
      className="text-white shadow-lg relative"
      style={{
        backgroundImage: `url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')`,
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
        height: '9vh',
        minHeight: '90px'
      }}
    >
      <div className="absolute inset-0 bg-blue-900/80"></div>

      <div className="px-2 sm:px-6 py-2 sm:py-4 relative z-10 h-full flex items-center">
        {settings.vozovnaOnlyMode && settings.splitView ? (
          // Vozovna only mode layout - centered title
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
            <div className="flex-1 text-center order-2 sm:order-1">
              <h1 className="font-bold leading-tight text-4xl sm:text-9xl">
                Vozovna Motol
              </h1>
            </div>

            <div className="flex flex-col items-end gap-3 order-1 sm:order-2">
              {settings.showWeatherInHeader && (
                <div className="text-5xl">
                  <WeatherHeader lat={50.0755} lon={14.4378} />
                </div>
              )}
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
        ) : (
          // Normal split view layout
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
            <div className="flex-1 text-center order-2 sm:order-1">
              <h1 className="font-bold leading-tight text-4xl" key={`single-station-${currentStationIndex}`}>
                {React.isValidElement(station.displayName) ?
                  station.displayName :
                  (station.textName || station.displayName)
                }
              </h1>
              {(station.textName === "Vozovna Motol" || station.simpleName === "Vozovna Motol") && (
                <div className="flex items-center justify-center gap-2 mt-2 text-blue-100">
                  <i className="fas fa-person-walking text-xl"></i>
                  <span className="text-lg font-semibold">6 min • 400 m</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 order-1 sm:order-2">
              {settings.showWeatherInHeader && (
                <div className="text-5xl">
                  <WeatherHeader lat={50.0755} lon={14.4378} />
                </div>
              )}
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
        )}
      </div>
    </div>
  );

  if (settings.splitView) {
    // If Vozovna only mode is enabled, show both Vozovna stations
    if (settings.vozovnaOnlyMode) {
      const currentVozovnaStation1 = vozovnaStations[0]; // Směr Centrum
      const currentVozovnaStation2 = vozovnaStations[1]; // Směr Řepy

      if (settings.vozovnaUnifiedHeader) {
        // Unified header mode
        return (
          <>
          <div
            className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 overflow-hidden h-screen relative`}
            style={{
              transform: `scale(${settings.zoomLevel})`,
              transformOrigin: 'top left',
              width: `${100 / settings.zoomLevel}%`,
              height: `${100 / settings.zoomLevel}%`
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-screen">
              {renderUnifiedHeader()}

              <div className="p-2 overflow-hidden min-h-0">
                <div
                  className="h-full opacity-100 transform translate-x-0 min-h-full"
                >
                  <TramDepartures
                    key={`vozovna1-${Array.isArray(currentVozovnaStation1.id) ? currentVozovnaStation1.id.join(',') : currentVozovnaStation1.id}`}
                    stationId={currentVozovnaStation1.id}
                    maxItems={8}
                    customTitle={currentVozovnaStation1.direction}
                    showTimesInMinutes={settings.showTimesInMinutes}
                    lowPerformanceMode={settings.lowPerformanceMode}
                    stationName={currentVozovnaStation1.simpleName || currentVozovnaStation1.textName}
                  />
                </div>
              </div>

              <div className="p-2 overflow-hidden min-h-0">
                <div
                  className="h-full opacity-100 transform translate-x-0 min-h-full"
                >
                  <TramDepartures
                    key={`vozovna2-${Array.isArray(currentVozovnaStation2.id) ? currentVozovnaStation2.id.join(',') : currentVozovnaStation2.id}`}
                    stationId={currentVozovnaStation2.id}
                    maxItems={8}
                    customTitle={currentVozovnaStation2.direction}
                    showTimesInMinutes={settings.showTimesInMinutes}
                    lowPerformanceMode={settings.lowPerformanceMode}
                    stationName={currentVozovnaStation2.simpleName || currentVozovnaStation2.textName}
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
        </>
        );
      }
      
      // Two headers mode (original)
      return (
        <>
        <div
          className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col lg:flex-row overflow-hidden h-screen relative`}
          style={{
            transform: `scale(${settings.zoomLevel})`,
            transformOrigin: 'top left',
            width: `${100 / settings.zoomLevel}%`,
            height: `${100 / settings.zoomLevel}%`
          }}
        >
          <div className="flex-1 flex flex-col h-1/2 lg:h-full min-h-0">
            {renderLeftHeader(currentVozovnaStation1)}
            <div className="flex-1 p-2 overflow-hidden min-h-0">
              <div
                className="h-full opacity-100 transform translate-x-0 min-h-full"
                >
                <TramDepartures
                  key={`vozovna1-${Array.isArray(currentVozovnaStation1.id) ? currentVozovnaStation1.id.join(',') : currentVozovnaStation1.id}`}
                  stationId={currentVozovnaStation1.id}
                  maxItems={8}
                  customTitle={currentVozovnaStation1.direction}
                  showTimesInMinutes={settings.showTimesInMinutes}
                  stationName={currentVozovnaStation1.simpleName || currentVozovnaStation1.textName}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col h-1/2 lg:h-full min-h-0">
            {renderRightHeader(currentVozovnaStation2)}
            <div className="flex-1 p-2 overflow-hidden min-h-0">
              <div
                className="h-full opacity-100 transform translate-x-0 min-h-full"
                >
                <TramDepartures
                  key={`vozovna2-${Array.isArray(currentVozovnaStation2.id) ? currentVozovnaStation2.id.join(',') : currentVozovnaStation2.id}`}
                  stationId={currentVozovnaStation2.id}
                  maxItems={8}
                  customTitle={currentVozovnaStation2.direction}
                  showTimesInMinutes={settings.showTimesInMinutes}
                  stationName={currentVozovnaStation2.simpleName || currentVozovnaStation2.textName}
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
        </>
      );
    }
    
    // Normal split view mode - vždy jedna zastávka, obě směry
    // currentStationIndex 0 = Vozovna Motol (Řepy + Centrum)
    // currentStationIndex 1 = Motol (Zličín + Nemocnice)

    const leftStation = currentStationIndex === 0 ? vozovnaStations[1] : motolStations[0]; // Řepy nebo Zličín
    const rightStation = currentStationIndex === 0 ? vozovnaStations[0] : motolStations[1]; // Centrum nebo Nemocnice
    const mainStationName = currentStationIndex === 0 ? "Vozovna Motol" : "Motol";

    return (
      <>
      <div
        className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden h-screen relative`}
        style={{
          transform: `scale(${settings.zoomLevel})`,
          transformOrigin: 'top left',
          width: `${100 / settings.zoomLevel}%`,
          height: `${100 / settings.zoomLevel}%`
        }}
      >
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
              {/* Left side - Logo */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 justify-start">
                <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                  <img
                    src={getLogoPath()}
                    alt="Logo školy"
                    className="object-contain w-56 h-56 sm:w-64 md:w-80 lg:w-96 xl:w-[28rem] sm:h-56 md:h-64 lg:h-80 xl:h-96"
                    style={getLogoStyle()}
                  />
                </div>
              </div>

              {/* Center - název zastávky */}
              <div className="text-center">
                <h1 className="font-bold leading-tight text-6xl" key={`main-station-${currentStationIndex}`}>
                  {mainStationName}
                </h1>
              </div>

              {/* Right side - Time and Date */}
              <div className="flex flex-col items-end gap-3">
                {settings.showWeatherInHeader && (
                  <div className="text-5xl">
                    <WeatherHeader lat={50.0755} lon={14.4378} />
                  </div>
                )}
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
            <div className="bg-white/95 border-l-8 border-blue-600 text-gray-800 px-3 mb-2 shadow-lg flex items-center rounded-lg" style={{ height: '6vh', minHeight: '70px', maxHeight: '90px' }}>
              <div className="flex items-center gap-2 w-full h-full">
                <i className="fas fa-arrow-right text-blue-600 flex-shrink-0" style={{ fontSize: 'clamp(2rem, 3.5vh, 3rem)' }}></i>
                <h2 className="font-bold flex-1 leading-none" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }} key={`left-dir-${currentStationIndex}`}>
                  {React.isValidElement(leftStation.displayName) ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0">{leftStation.direction}</span>
                      <div className="flex-shrink-0 flex items-center" style={{ maxHeight: '100%' }}>{leftStation.displayName}</div>
                    </div>
                  ) : leftStation.direction}
                </h2>
              </div>
            </div>

            <div
              className={`flex-1`}
            >
              <TramDepartures
                key={`left-${Array.isArray(leftStation.id) ? leftStation.id.join(',') : leftStation.id}-${currentStationIndex}`}
                stationId={leftStation.id}
                  maxItems={7}
                showTimesInMinutes={settings.showTimesInMinutes}
                stationName={leftStation.simpleName || leftStation.textName || mainStationName}
              />
            </div>
          </div>

          {/* Right panel - Směr Centrum nebo Směr Nemocnice Motol */}
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            {/* Direction header - elegant style */}
            <div className="bg-white/95 border-l-8 border-blue-600 text-gray-800 px-3 mb-2 shadow-lg flex items-center rounded-lg" style={{ height: '6vh', minHeight: '70px', maxHeight: '90px' }}>
              <div className="flex items-center gap-2 w-full h-full">
                <i className="fas fa-arrow-right text-blue-600 flex-shrink-0" style={{ fontSize: 'clamp(2rem, 3.5vh, 3rem)' }}></i>
                <h2 className="font-bold flex-1 leading-none" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }} key={`right-dir-${currentStationIndex}`}>
                  {React.isValidElement(rightStation.displayName) ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0">{rightStation.direction}</span>
                      <div className="flex-shrink-0 flex items-center" style={{ maxHeight: '100%' }}>{rightStation.displayName}</div>
                    </div>
                  ) : rightStation.direction}
                </h2>
              </div>
            </div>

            <div
              className={`flex-1`}
            >
              <TramDepartures
                key={`right-${Array.isArray(rightStation.id) ? rightStation.id.join(',') : rightStation.id}-${currentStationIndex}`}
                stationId={rightStation.id}
                  maxItems={7}
                showTimesInMinutes={settings.showTimesInMinutes}
                stationName={rightStation.simpleName || rightStation.textName || mainStationName}
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
      </>
    );
  }

  return (
    <>
    <div
      className="bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden relative h-screen"
      style={{
        transform: `scale(${settings.zoomLevel})`,
        transformOrigin: 'top left',
        width: `${100 / settings.zoomLevel}%`,
        height: `${100 / settings.zoomLevel}%`
      }}
    >
      {/* Global Alert Banner - Fixed position at top */}
      {settings.testAlert && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <AlertBanner
            alerts={[
              { text: "NEHODA: Tramvaj linka 9 a 10 - střet s vozidlem na zastávce Anděl - očekávejte zpoždění 15-20 minut", priority: 1 },
              { text: "VÝLUKA: Tramvaj linka 22 mezi zastávkami I. P. Pavlova a Karlovo náměstí - náhradní autobusová doprava X22", priority: 2 },
              { text: "TECHNICKÁ ZÁVADA: Linka 12 zkrácena do zastávky Výstaviště - úsek do Sídliště Barrandov mimo provoz", priority: 3 },
              { text: "UZAVŘENÍ MOSTU: Libeňský most uzavřen - linky 1, 3, 8, 24, 25 jezdí odklonem přes Palmovku", priority: 2 },
              { text: "OMEZENÍ: Tramvaje na trati Národní divadlo - Palackého náměstí jedou sníženou rychlostí kvůli opravě výhybek", priority: 3 },
              { text: "ZMĚNA TRASY: Linka 20 dočasně neobsluhuje zastávku Arbesovo náměstí - použijte linku 9 nebo 12", priority: 2 },
              { text: "ZPOŽDĚNÍ: Tramvaje na lince 22 směr Bílá Hora mají zpoždění 10-15 minut kvůli technické závadě vozu", priority: 3 },
              { text: "AKCE: Karlovo náměstí - objížďka tramvají kvůli veřejné akci - použijte metro linku B", priority: 2 }
            ]}
          />
        </div>
      )}

      <div
        className="text-white shadow-lg relative"
        style={{
          backgroundImage: `url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')`,
          backgroundSize: 'auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          height: '200px'
        }}
      >
        <div className="absolute inset-0 bg-blue-900/80"></div>

        <div className="px-3 py-2 relative z-10 h-full flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-6 w-full sm:w-auto">
            <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
              <img
                src={getLogoPath()}
                alt="Logo školy"
                className="object-contain w-28 h-28 sm:w-96 sm:h-96"
                style={getLogoStyle()}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-bold leading-tight transition-all duration-500 ease-in-out hover:scale-105 text-xl sm:text-6xl" key={`split-station-${currentStationIndex}`}>
                {React.isValidElement(currentStation.displayName) ?
                    currentStation.displayName :
                    (currentStation.textName || currentStation.displayName)
                  }
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-center sm:text-right">
              <div className="font-bold text-5xl sm:text-[12rem]">
                {currentTime.toLocaleTimeString('cs-CZ')}
              </div>
              <div className="text-blue-100 mt-1 sm:mt-2 text-xl sm:text-6xl">
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

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        <div className="flex-1 p-2 overflow-hidden min-h-0">
          <div
            className={`h-full min-h-full`}
          >
            <TramDepartures
              key={`${Array.isArray(currentStation.id) ? currentStation.id.join(',') : currentStation.id}-${currentStationIndex}`}
              stationId={currentStation.id}
              maxItems={8}
              showTimesInMinutes={settings.showTimesInMinutes}
              stationName={currentStation.simpleName || currentStation.textName || ""}
            />
          </div>
        </div>

        {settings.showRightPanel && (
          <div className="flex-1 p-2 overflow-hidden">
            <div className="h-full grid grid-rows-1 lg:grid-rows-2 grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="overflow-hidden">
                <WeatherWidget
                  lat={currentStation.lat}
                  lon={currentStation.lon}
                  stationName="Praha"
                />
              </div>
              <div className="overflow-hidden">
                <RouteInfo
                  stationId={Array.isArray(currentStation.id) ? currentStation.id[0] : currentStation.id}
                />
              </div>
            </div>
          </div>
        )}
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
    </>
  );
};

export default Index;
