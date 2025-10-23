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
      name: "Vozovna Motol (Směr Centrum)",
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
        <div className="flex items-center gap-2">
          Motol (Směr Zličín
          <img src="/pictures/metroB.png" alt="Metro B" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-yellow-500 text-white font-bold text-xl sm:text-2xl md:text-3xl rounded" title="Metro B">B</span>';
          }} />)
        </div>
      ),
      displayName: (
        <div className="flex items-center gap-2">
          Motol (Směr Zličín
          <img src="/pictures/metroB.png" alt="Metro B" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-yellow-500 text-white font-bold text-xl sm:text-2xl md:text-3xl rounded" title="Metro B">B</span>';
          }} />)
        </div>
      ),
      textName: "Motol (Směr Zličín Metro B)",
      lat: 50.0675,
      lon: 14.3365
    },
    {
      id: ["U394Z4P", "U394Z4"],
      name: (
        <div className="flex items-center gap-2">
          Motol (Směr Nemocnice Motol
          <img src="/pictures/metroA.png" alt="Metro A" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-green-600 text-white font-bold text-xl sm:text-2xl md:text-3xl rounded" title="Metro A">A</span>';
          }} />)
        </div>
      ),
      displayName: (
        <div className="flex items-center gap-2">
          Motol (Směr Nemocnice Motol
          <img src="/pictures/metroA.png" alt="Metro A" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-green-600 text-white font-bold text-xl sm:text-2xl md:text-3xl rounded" title="Metro A">A</span>';
          }} />)
        </div>
      ),
      textName: "Motol (Směr Nemocnice Motol Metro A)",
      lat: 50.0677,
      lon: 14.3357
    }
  ];

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [worldTime, setWorldTime] = useState<Date | null>(null);
  const [timeOffset, setTimeOffset] = useState(0); // Offset mezi serverovým a lokálním časem

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tram-display-settings');
    const defaultSettings = {
      showRightPanel: true,
      isFullscreen: false,
      zoomLevel: 1.0,
      splitView: true,
      textSize: 1.4,
      logoSize: 1.0,
      showWeatherInHeader: false,
      vozovnaOnlyMode: false,
      showTimesInMinutes: true,
      vozovnaUnifiedHeader: false,
      testAlert: false,
      lowPerformanceMode: false
    };
    
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsedSettings,
          textSize: typeof parsedSettings.textSize === 'number' && !isNaN(parsedSettings.textSize)
            ? parsedSettings.textSize
            : 1.4,
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
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };

      if (key === 'textSize') {
        newSettings.textSize = typeof value === 'number' && !isNaN(value) ? value : 1.4;
      }

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
        setWorldTime(serverTime);
      } else {
        // Fallback na lokální čas
        setTimeOffset(0);
        setWorldTime(new Date());
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
        setWorldTime(serverTime);
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
        setIsTransitioning(true);
        setCurrentStationIndex(newStationIndex);

        setTimeout(() => {
          setIsTransitioning(false);
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

  const getEffectiveTextSize = () => {
    if (settings.isFullscreen) {
      return settings.textSize * 1.8;
    }
    return settings.textSize;
  };

  const getLogoClasses = (baseSize: string) => {
    const multiplier = settings.logoSize;
    const sizes = {
      'w-12 h-12': `w-${Math.round(12 * multiplier)} h-${Math.round(12 * multiplier)}`,
      'w-16 h-16': `w-${Math.round(16 * multiplier)} h-${Math.round(16 * multiplier)}`,
      'w-20 h-20': `w-${Math.round(20 * multiplier)} h-${Math.round(20 * multiplier)}`,
      'w-24 h-24': `w-${Math.round(24 * multiplier)} h-${Math.round(24 * multiplier)}`,
      'w-32 h-32': `w-${Math.round(32 * multiplier)} h-${Math.round(32 * multiplier)}`,
    };

    // Pokud multiplier je větší než 1, použijeme inline style
    if (multiplier !== 1.0) {
      return baseSize;
    }

    return sizes[baseSize] || baseSize;
  };

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
        height: settings.isFullscreen ? '330px' : '275px'
      }}
    >
      <div className="absolute inset-0 bg-blue-900/80"></div>

      <div className="px-1 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-4 relative z-10 h-full flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto">
          <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
            <img
              src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
              alt="Logo školy"
              className={`object-contain ${
                settings.isFullscreen
                  ? 'w-32 h-32 sm:w-48 md:w-64 lg:w-80 xl:w-96 sm:h-32 md:h-48 lg:h-64 xl:h-80 2xl:h-96'
                  : 'w-24 h-24 sm:w-32 md:w-40 lg:w-48 xl:w-64 sm:h-24 md:h-32 lg:h-40 xl:h-48 2xl:h-64'
              }`}
              style={getLogoStyle()}
            />
          </div>
          <div className="flex-1 text-center sm:hidden">
            <h1 className={`font-bold leading-tight`} style={{
              fontSize: settings.isFullscreen ? 'clamp(1.5rem, 4vw, 6rem)' : 'clamp(1.2rem, 3vw, 4rem)'
            }}>
              Vozovna Motol
            </h1>
          </div>
        </div>

        <div className="hidden sm:block flex-1 text-center">
          <h1 className={`font-bold leading-tight`} style={{
            fontSize: settings.isFullscreen ? 'clamp(1.8rem, 5vw, 7rem)' : 'clamp(1.5rem, 4vw, 5rem)'
          }}>
            Vozovna Motol
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <i className={`fa-solid fa-person-walking text-blue-100`} style={{
              fontSize: settings.isFullscreen ? 'clamp(2.25rem, 6vw, 7.5rem)' : 'clamp(1.8rem, 4.5vw, 6rem)',
              animation: 'walking-bounce 1.5s ease-in-out infinite, icon-glow-pulse 2s ease-in-out infinite'
            }}></i>
            <div className={`text-blue-100`} style={{
              fontSize: settings.isFullscreen ? 'clamp(2.25rem, 6vw, 7.5rem)' : 'clamp(1.8rem, 4.5vw, 6rem)'
            }}>
              <span className="font-semibold">Motol</span> • 6 min • 400m
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 sm:gap-2 md:gap-4 lg:gap-6 w-full sm:w-auto">
          {settings.showWeatherInHeader && (
            <div className={`${settings.isFullscreen ? 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl' : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl'}`}>
              <WeatherHeader lat={50.0755} lon={14.4378} />
            </div>
          )}
          <div className="text-right">
            <div className={`font-bold`} style={{
              fontSize: settings.isFullscreen ? 'clamp(3rem, 8vw, 8rem)' : 'clamp(2.5rem, 6vw, 6rem)'
            }}>
              {currentTime.toLocaleTimeString('cs-CZ')}
            </div>
            <div className={`text-blue-100 mt-1 sm:mt-2`} style={{
              fontSize: settings.isFullscreen ? 'clamp(1.2rem, 3vw, 3rem)' : 'clamp(1rem, 2.5vw, 2.5rem)'
            }}>
              {currentTime.toLocaleDateString('cs-CZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Mobile walking info */}
        <div className="sm:hidden flex items-center justify-center gap-1 mt-1 w-full">
          <i className={`fa-solid fa-person-walking text-blue-100`} style={{
            fontSize: settings.isFullscreen ? 'clamp(3rem, 9vw, 6rem)' : 'clamp(2.25rem, 6vw, 4.5rem)',
            animation: 'walking-bounce 1.5s ease-in-out infinite, icon-glow-pulse 2s ease-in-out infinite'
          }}></i>
          <div className={`text-blue-100`} style={{
            fontSize: settings.isFullscreen ? 'clamp(3rem, 9vw, 6rem)' : 'clamp(2.25rem, 6vw, 4.5rem)'
          }}>
            <span className="font-semibold">Motol</span> • 6 min • 400m
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
        height: settings.isFullscreen ? '330px' : '275px'
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
                  src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
                  alt="Logo školy"
                  className={`object-contain ${
                    settings.isFullscreen
                      ? 'w-32 h-32 sm:w-[512px] sm:h-[512px]'
                      : 'w-24 h-24 sm:w-96 sm:h-96'
                  }`}
                  style={getLogoStyle()}
                />
              </div>
            </div>

            <div className="flex-1 text-center">
              <h1 className={`font-bold leading-tight ${
                settings.isFullscreen ? 'text-4xl sm:text-9xl' : 'text-xl sm:text-6xl'
              }`}>
                Vozovna Motol
              </h1>
            </div>
          </div>
        ) : (
          // Normal split view layout
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
            <div className="flex items-center gap-1 sm:gap-4 lg:gap-6 w-full sm:w-auto">
              <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                <img
                  src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
                  alt="Logo školy"
                  className={`object-contain ${
                    settings.vozovnaOnlyMode && settings.splitView
                      ? settings.isFullscreen
                        ? 'w-40 h-40 sm:w-56 md:w-64 lg:w-80 xl:w-96 2xl:w-[512px] sm:h-40 md:h-56 lg:h-64 xl:h-80 2xl:h-96 3xl:h-[512px]'
                        : 'w-32 h-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-96 sm:h-32 md:h-40 lg:h-48 xl:h-56 2xl:h-64 3xl:h-96'
                      : settings.isFullscreen
                      ? 'w-28 h-28 sm:w-32 md:w-40 lg:w-48 xl:w-80 2xl:h-80 sm:h-28 md:h-32 lg:h-40 xl:h-48 2xl:h-80'
                      : 'w-24 h-24 sm:w-28 md:w-32 lg:w-40 xl:w-64 2xl:h-64 sm:h-24 md:h-28 lg:h-32 xl:h-40 2xl:h-64'
                  }`}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-bold leading-tight transition-all duration-500 ease-in-out hover:scale-105 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl" key={`station-${currentStationIndex}`}>
                  {React.isValidElement(station.displayName) ?
                    station.displayName :
                    (station.textName || station.displayName)
                  }
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-4 w-full sm:w-auto">
              {settings.showWeatherInHeader && (
                <div className={`${
                  settings.isFullscreen ? 'text-2xl sm:text-6xl' : 'text-xl sm:text-5xl'
                }`}>
                  <WeatherHeader lat={50.0755} lon={14.4378} />
                </div>
              )}
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-center">
                <i className={`fa-solid fa-person-walking text-blue-100 ${
                  settings.isFullscreen ? 'text-3xl sm:text-[7.5rem]' : 'text-3xl sm:text-[9rem]'
                }`} style={{
                  animation: 'walking-bounce 1.5s ease-in-out infinite, icon-glow-pulse 2s ease-in-out infinite'
                }}></i>
                <div>
                  <div className={`font-semibold ${
                    settings.isFullscreen ? 'text-3xl sm:text-6xl' : 'text-xl sm:text-5xl'
                  }`}>Motol</div>
                  <div className={`text-blue-100 ${
                    settings.isFullscreen ? 'text-xl sm:text-5xl' : 'text-base sm:text-3xl'
                  }`}>6 min • 400m</div>
                </div>
              </div>
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
        height: settings.isFullscreen ? '330px' : '275px'
      }}
    >
      <div className="absolute inset-0 bg-blue-900/80"></div>

      <div className="px-2 sm:px-6 py-2 sm:py-4 relative z-10 h-full flex items-center">
        {settings.vozovnaOnlyMode && settings.splitView ? (
          // Vozovna only mode layout - centered title
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
            <div className="flex-1 text-center order-2 sm:order-1">
              <h1 className={`font-bold leading-tight ${
                settings.isFullscreen ? 'text-4xl sm:text-9xl' : 'text-xl sm:text-6xl'
              }`}>
                Vozovna Motol
              </h1>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-6 order-1 sm:order-2">
              {settings.showWeatherInHeader && (
                <div className={`${
                  settings.isFullscreen ? 'text-2xl sm:text-6xl' : 'text-xl sm:text-5xl'
                }`}>
                  <WeatherHeader lat={50.0755} lon={14.4378} />
                </div>
              )}
              <div className="text-center sm:text-right">
                <div className={`font-bold ${
                  settings.isFullscreen ? 'text-5xl sm:text-[8rem]' : 'text-4xl sm:text-6xl'
                }`}>
                  {currentTime.toLocaleTimeString('cs-CZ')}
                </div>
                <div className={`text-blue-100 mt-1 sm:mt-2 ${
                  settings.isFullscreen ? 'text-xl sm:text-4xl' : 'text-lg sm:text-3xl'
                }`}>
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
              <h1 className="font-bold leading-tight transition-all duration-500 ease-in-out hover:scale-105 text-xl sm:text-6xl" key={`single-station-${currentStationIndex}`}>
                {React.isValidElement(station.displayName) ?
                  station.displayName :
                  (station.textName || station.displayName)
                }
              </h1>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-6 order-1 sm:order-2">
              {settings.showWeatherInHeader && (
                <div className={`${
                  settings.isFullscreen ? 'text-2xl sm:text-6xl' : 'text-xl sm:text-5xl'
                }`}>
                  <WeatherHeader lat={50.0755} lon={14.4378} />
                </div>
              )}
              <div className="text-center sm:text-right">
                <div className={`font-bold ${
                  settings.isFullscreen ? 'text-5xl sm:text-[8rem]' : 'text-4xl sm:text-6xl'
                }`}>
                  {currentTime.toLocaleTimeString('cs-CZ')}
                </div>
                <div className={`text-blue-100 mt-1 sm:mt-2 ${
                  settings.isFullscreen ? 'text-xl sm:text-4xl' : 'text-lg sm:text-3xl'
                }`}>
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
    const effectiveTextSize = getEffectiveTextSize();
    
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

              <div className={`${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden min-h-0`}>
                <div
                  className="h-full opacity-100 transform translate-x-0 min-h-full"
                  style={{ fontSize: `${effectiveTextSize}em` }}
                >
                  <TramDepartures
                    key={`vozovna1-${Array.isArray(currentVozovnaStation1.id) ? currentVozovnaStation1.id.join(',') : currentVozovnaStation1.id}`}
                    stationId={currentVozovnaStation1.id}
                    textSize={effectiveTextSize}
                    maxItems={8}
                    customTitle={currentVozovnaStation1.direction}
                    showTimesInMinutes={settings.showTimesInMinutes}
                    lowPerformanceMode={settings.lowPerformanceMode}
                  />
                </div>
              </div>

              <div className={`${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden min-h-0`}>
                <div
                  className="h-full opacity-100 transform translate-x-0 min-h-full"
                  style={{ fontSize: `${effectiveTextSize}em` }}
                >
                  <TramDepartures
                    key={`vozovna2-${Array.isArray(currentVozovnaStation2.id) ? currentVozovnaStation2.id.join(',') : currentVozovnaStation2.id}`}
                    stationId={currentVozovnaStation2.id}
                    textSize={effectiveTextSize}
                    maxItems={8}
                    customTitle={currentVozovnaStation2.direction}
                    showTimesInMinutes={settings.showTimesInMinutes}
                    lowPerformanceMode={settings.lowPerformanceMode}
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
          <DailyRobot textSize={effectiveTextSize} />
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
            <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden min-h-0`}>
              <div
                className="h-full opacity-100 transform translate-x-0 min-h-full"
                style={{ fontSize: `${effectiveTextSize}em` }}
              >
                <TramDepartures
                  key={`vozovna1-${Array.isArray(currentVozovnaStation1.id) ? currentVozovnaStation1.id.join(',') : currentVozovnaStation1.id}`}
                  stationId={currentVozovnaStation1.id}
                  textSize={effectiveTextSize}
                  maxItems={8}
                  customTitle={currentVozovnaStation1.direction}
                  showTimesInMinutes={settings.showTimesInMinutes}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col h-1/2 lg:h-full min-h-0">
            {renderRightHeader(currentVozovnaStation2)}
            <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden min-h-0`}>
              <div
                className="h-full opacity-100 transform translate-x-0 min-h-full"
                style={{ fontSize: `${effectiveTextSize}em` }}
              >
                <TramDepartures
                  key={`vozovna2-${Array.isArray(currentVozovnaStation2.id) ? currentVozovnaStation2.id.join(',') : currentVozovnaStation2.id}`}
                  stationId={currentVozovnaStation2.id}
                  textSize={effectiveTextSize}
                  maxItems={8}
                  customTitle={currentVozovnaStation2.direction}
                  showTimesInMinutes={settings.showTimesInMinutes}
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
        <DailyRobot textSize={effectiveTextSize} />
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
            height: settings.isFullscreen ? '450px' : '380px'
          }}
        >
          <div className="absolute inset-0 bg-blue-900/80"></div>

          <div className="px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 relative z-10 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 items-center">
              {/* Left side - Logo + Walking Info */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 justify-start">
                <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                  <img
                    src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
                    alt="Logo školy"
                    className={`object-contain ${
                      settings.isFullscreen
                        ? 'w-56 h-56 sm:w-64 md:w-80 lg:w-96 xl:w-[28rem] sm:h-56 md:h-64 lg:h-80 xl:h-96'
                        : 'w-48 h-48 sm:w-56 md:w-64 lg:w-80 xl:w-96 sm:h-48 md:h-56 lg:h-64 xl:h-80'
                    }`}
                    style={getLogoStyle()}
                  />
                </div>

                {/* Walking info - vždy viditelné */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                  <i className={`fa-solid fa-person-walking text-blue-100 ${
                    settings.isFullscreen ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                  }`} style={{animation: 'walking-bounce 1.5s ease-in-out infinite, icon-glow-pulse 2s ease-in-out infinite'}}></i>
                  <div>
                    <div className={`font-semibold text-white ${
                      settings.isFullscreen ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'
                    }`}>Motol</div>
                    <div className={`text-blue-100 font-semibold ${
                      settings.isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl'
                    }`}>6 min • 400m</div>
                  </div>
                </div>
              </div>

              {/* Center - VELKEJ název zastávky */}
              <div className="text-center">
                <h1 className={`font-bold leading-tight transition-all duration-500 ease-in-out ${
                  settings.isFullscreen
                    ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl'
                    : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl'
                }`} key={`main-station-${currentStationIndex}`}>
                  {mainStationName}
                </h1>
              </div>

              {/* Right side - Time and Date */}
              <div className="flex flex-col items-center lg:items-end gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                {settings.showWeatherInHeader && (
                  <div className={`${
                    settings.isFullscreen
                      ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
                      : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                  }`}>
                    <WeatherHeader lat={50.0755} lon={14.4378} />
                  </div>
                )}
                <div className="text-center lg:text-right">
                  <div className={`font-bold ${
                    settings.isFullscreen
                      ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl'
                      : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
                  }`}>
                    {currentTime.toLocaleTimeString('cs-CZ')}
                  </div>
                  <div className={`text-blue-100 mt-1 sm:mt-2 ${
                    settings.isFullscreen
                      ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                      : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'
                  }`}>
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
          <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden flex flex-col min-h-0`}>
            {/* Direction header - elegant style */}
            <div className={`bg-white/95 border-l-8 sm:border-l-[12px] md:border-l-[16px] border-blue-600 text-gray-800 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 mb-2 shadow-lg`}>
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <i className={`fas fa-arrow-right text-blue-600 ${
                  settings.isFullscreen ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                }`}></i>
                <h2 className={`font-bold ${
                  settings.isFullscreen ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                }`} key={`left-dir-${currentStationIndex}`}>
                  {React.isValidElement(leftStation.displayName) ? (
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                      {leftStation.direction}
                      {leftStation.displayName}
                    </div>
                  ) : leftStation.direction}
                </h2>
              </div>
            </div>

            <div
              className={`flex-1 min-h-full`}
              style={{ fontSize: `${effectiveTextSize}em` }}
            >
              <TramDepartures
                key={`left-${Array.isArray(leftStation.id) ? leftStation.id.join(',') : leftStation.id}-${currentStationIndex}`}
                stationId={leftStation.id}
                textSize={effectiveTextSize}
                maxItems={6}
                showTimesInMinutes={settings.showTimesInMinutes}
              />
            </div>
          </div>

          {/* Right panel - Směr Centrum nebo Směr Nemocnice Motol */}
          <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden flex flex-col min-h-0`}>
            {/* Direction header - elegant style */}
            <div className={`bg-white/95 border-l-8 sm:border-l-[12px] md:border-l-[16px] border-blue-600 text-gray-800 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 mb-2 shadow-lg`}>
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <i className={`fas fa-arrow-right text-blue-600 ${
                  settings.isFullscreen ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                }`}></i>
                <h2 className={`font-bold ${
                  settings.isFullscreen ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                }`} key={`right-dir-${currentStationIndex}`}>
                  {React.isValidElement(rightStation.displayName) ? (
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                      {rightStation.direction}
                      {rightStation.displayName}
                    </div>
                  ) : rightStation.direction}
                </h2>
              </div>
            </div>

            <div
              className={`flex-1 min-h-full`}
              style={{ fontSize: `${effectiveTextSize}em` }}
            >
              <TramDepartures
                key={`right-${Array.isArray(rightStation.id) ? rightStation.id.join(',') : rightStation.id}-${currentStationIndex}`}
                stationId={rightStation.id}
                textSize={effectiveTextSize}
                maxItems={6}
                showTimesInMinutes={settings.showTimesInMinutes}
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
      <DailyRobot textSize={effectiveTextSize} />
      </>
    );
  }

  const effectiveTextSize = getEffectiveTextSize();

  return (
    <>
    <div
      className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden relative ${
        settings.isFullscreen ? 'h-screen' : 'min-h-screen'
      }`}
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
            textSize={effectiveTextSize}
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
          height: settings.isFullscreen ? '330px' : '275px'
        }}
      >
        <div className="absolute inset-0 bg-blue-900/80"></div>

        <div className="px-1 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-4 relative z-10 h-full flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-6 w-full sm:w-auto">
            <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
              <img
                src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
                alt="Logo školy"
                className={`object-contain ${
                  settings.isFullscreen
                    ? 'w-28 h-28 sm:w-96 sm:h-96'
                    : 'w-24 h-24 sm:w-80 sm:h-80'
                }`}
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

          <div className="hidden sm:flex items-center justify-center gap-4 text-center">
            <i className={`fa-solid fa-person-walking text-blue-100 ${
              settings.isFullscreen ? 'text-[10.5rem]' : 'text-[9rem]'
            }`} style={{
              animation: 'walking-bounce 1.5s ease-in-out infinite, icon-glow-pulse 2s ease-in-out infinite'
            }}></i>
            <div>
              <div className={`font-semibold ${
                settings.isFullscreen ? 'text-[9rem]' : 'text-[7.5rem]'
              }`}>
                Motol
              </div>
              <div className={`text-blue-100 ${
                settings.isFullscreen ? 'text-[7.5rem]' : 'text-6xl'
              }`}>6 min • 400m</div>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-center sm:text-right">
              <div className={`font-bold ${
                settings.isFullscreen ? 'text-5xl sm:text-[12rem]' : 'text-4xl sm:text-9xl'
              }`}>
                {currentTime.toLocaleTimeString('cs-CZ')}
              </div>
              <div className={`text-blue-100 mt-1 sm:mt-2 ${
                settings.isFullscreen ? 'text-xl sm:text-6xl' : 'text-lg sm:text-5xl'
              }`}>
                {currentTime.toLocaleDateString('cs-CZ', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Mobile walking info */}
          <div className="sm:hidden flex items-center justify-center gap-1 mt-1 w-full">
            <i className={`fa-solid fa-person-walking text-blue-100 ${
              settings.isFullscreen ? 'text-3xl' : 'text-3xl'
            }`} style={{
              animation: 'walking-bounce 1.5s ease-in-out infinite, icon-glow-pulse 2s ease-in-out infinite'
            }}></i>
            <div className={`text-blue-100 ${
              settings.isFullscreen ? 'text-3xl' : 'text-3xl'
            }`}>
              <span className="font-semibold">Motol</span> • 6 min • 400m
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden min-h-0`}>
          <div
            className={`h-full min-h-full`}
            style={{ fontSize: `${effectiveTextSize}em` }}
          >
            <TramDepartures
              key={`${Array.isArray(currentStation.id) ? currentStation.id.join(',') : currentStation.id}-${currentStationIndex}`}
              stationId={currentStation.id}
              textSize={effectiveTextSize}
              maxItems={8}
              showTimesInMinutes={settings.showTimesInMinutes}
            />
          </div>
        </div>

        {settings.showRightPanel && (
          <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
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
    <DailyRobot textSize={effectiveTextSize} />
    </>
  );
};

export default Index;
