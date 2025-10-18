import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { TramDepartures } from "@/components/TramDepartures";
import { WeatherWidget } from "@/components/WeatherWidget";
import { RouteInfo } from "@/components/RouteInfo";
import { Settings } from "@/components/Settings";
import { WeatherHeader } from "@/components/WeatherHeader";
import { DailyRobot } from "@/components/DailyRobot";

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
          <img src="/pictures/metroB.png" alt="Metro B" className="w-8 h-8" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-8 h-8 bg-yellow-500 text-white font-bold text-sm rounded" title="Metro B">B</span>';
          }} />)
        </div>
      ),
      displayName: (
        <div className="flex items-center gap-2">
          Motol (Směr Zličín 
          <img src="/pictures/metroB.png" alt="Metro B" className="w-8 h-8" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-8 h-8 bg-yellow-500 text-white font-bold text-sm rounded" title="Metro B">B</span>';
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
          <img src="/pictures/metroA.png" alt="Metro A" className="w-8 h-8" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white font-bold text-sm rounded" title="Metro A">A</span>';
          }} />)
        </div>
      ),
      displayName: (
        <div className="flex items-center gap-2">
          Motol (Směr Nemocnice Motol 
          <img src="/pictures/metroA.png" alt="Metro A" className="w-8 h-8" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span class="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white font-bold text-sm rounded" title="Metro A">A</span>';
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

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tram-display-settings');
    const defaultSettings = {
      showRightPanel: true,
      isFullscreen: false,
      zoomLevel: 1.0,
      splitView: true,
      textSize: 2.1,
      logoSize: 1.0,
      showWeatherInHeader: false,
      vozovnaOnlyMode: false,
      showTimesInMinutes: false,
      vozovnaUnifiedHeader: false
    };
    
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsedSettings,
          textSize: typeof parsedSettings.textSize === 'number' && !isNaN(parsedSettings.textSize)
            ? parsedSettings.textSize
            : 2.1,
          logoSize: typeof parsedSettings.logoSize === 'number' && !isNaN(parsedSettings.logoSize)
            ? parsedSettings.logoSize
            : 1.0
        };
      } catch (error) {
        console.error('Error parsing settings from localStorage:', error);
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
        newSettings.textSize = typeof value === 'number' && !isNaN(value) ? value : 2.1;
      }

      if (key === 'logoSize') {
        newSettings.logoSize = typeof value === 'number' && !isNaN(value) ? value : 1.0;
      }
      
      return newSettings;
    });
  };

  const fetchWorldTime = async (): Promise<Date> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Prague', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const serverTime = new Date(data.datetime);
      console.log('✅ World time fetched:', serverTime.toLocaleTimeString());
      return serverTime;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⚠️ World time API timeout, using local time');
      } else {
        console.log('⚠️ Using local time (world time API unavailable)');
      }
      return new Date();
    }
  };

  const calculateStationIndex = (time: Date) => {
    const totalSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
    const cyclePosition = totalSeconds % 60;
    
    console.log('🕐 Total seconds from start of day:', totalSeconds, 'Cycle position:', cyclePosition);
    
    if (cyclePosition < 15) {
      return 0;
    } else if (cyclePosition < 30) {
      return 1;
    } else if (cyclePosition < 45) {
      return 2;
    } else {
      return 3;
    }
  };

  useEffect(() => {
    const initializeTime = async () => {
      console.log('🚀 Initializing world time...');
      const serverTime = await fetchWorldTime();
      setWorldTime(serverTime);
      setCurrentTime(serverTime);
      
      const stationIndex = calculateStationIndex(serverTime);
      console.log('🎯 Initial station index:', stationIndex);
      setCurrentStationIndex(stationIndex);
    };
    
    initializeTime();
  }, []);

  useEffect(() => {
    if (!worldTime) return;

    const updateTimeAndStation = () => {
      const now = new Date();
      const elapsed = now.getTime() - worldTime.getTime();
      const currentWorldTime = new Date(worldTime.getTime() + elapsed);
      
      setCurrentTime(currentWorldTime);
      
      const newStationIndex = calculateStationIndex(currentWorldTime);
      
      if (newStationIndex !== currentStationIndex) {
        console.log('🔄 Station changing from', currentStationIndex, 'to', newStationIndex);
        setIsTransitioning(true);
        
        setCurrentStationIndex(newStationIndex);
        console.log('🎯 Station index changed to:', newStationIndex);
        
        setTimeout(() => {
          setIsTransitioning(false);
          console.log('✅ Station transition completed');
        }, 800);
      }
    };

    updateTimeAndStation();
    
    const timer = setInterval(updateTimeAndStation, 1000);
    
    const syncTimer = setInterval(async () => {
      console.log('🔄 Re-syncing with world time...');
      const newWorldTime = await fetchWorldTime();
      setWorldTime(newWorldTime);
    }, 300000);
    
    return () => {
      clearInterval(timer);
      clearInterval(syncTimer);
    };
  }, [worldTime, currentStationIndex]);

  const motolStations = [
    stations[2],
    stations[3]
  ];

  const vozovnaStations = [
    stations[0],
    stations[1]
  ];

  const currentStation = stations[currentStationIndex];
  console.log('📍 Current station:', currentStation?.textName || currentStation?.displayName, 'Index:', currentStationIndex);

  const getCurrentMotolStation = () => {
    const stationIndex = currentStationIndex;
    console.log('🏠 Getting Motol station for index:', stationIndex);
    
    if (stationIndex === 2) {
      console.log('🎯 Selected Motol station (2):', motolStations[0]?.textName);
      return motolStations[0];
    } else if (stationIndex === 3) {
      console.log('🎯 Selected Motol station (3):', motolStations[1]?.textName);
      return motolStations[1];
    } else if (stationIndex === 0) {
      console.log('🎯 Selected Motol station (0) - using Zličín:', motolStations[0]?.textName);
      return motolStations[0];
    } else {
      console.log('🎯 Selected Motol station (1) - using Nemocnice:', motolStations[1]?.textName);
      return motolStations[1];
    }
  };

  const getCurrentVozovnaStation = () => {
    const stationIndex = currentStationIndex;
    console.log('🚗 Getting Vozovna station for index:', stationIndex);
    
    if (stationIndex === 0) {
      console.log('🎯 Selected Vozovna station (0):', vozovnaStations[0]?.textName);
      return vozovnaStations[0];
    } else if (stationIndex === 1) {
      console.log('🎯 Selected Vozovna station (1):', vozovnaStations[1]?.textName);
      return vozovnaStations[1];
    } else if (stationIndex === 2) {
      console.log('🎯 Selected Vozovna station (2) - using Centrum:', vozovnaStations[0]?.textName);
      return vozovnaStations[0];
    } else {
      console.log('🎯 Selected Vozovna station (3) - using Řepy:', vozovnaStations[1]?.textName);
      return vozovnaStations[1];
    }
  };

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
                  ? 'w-16 h-16 sm:w-24 md:w-32 lg:w-48 xl:w-[512px] sm:h-16 md:h-24 lg:h-32 xl:h-48 2xl:h-[512px]'
                  : 'w-12 h-12 sm:w-16 md:w-20 lg:w-24 xl:w-32 2xl:w-96 sm:h-12 md:h-16 lg:h-20 xl:h-24 2xl:h-32 3xl:h-96'
              }`}
              style={getLogoStyle()}
            />
          </div>
          <div className="flex-1 text-center sm:hidden">
            <h1 className={`font-bold leading-tight ${
              settings.isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-8xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl'
            }`}>
              Vozovna Motol
            </h1>
          </div>
        </div>

        <div className="hidden sm:block flex-1 text-center">
          <h1 className={`font-bold leading-tight ${settings.isFullscreen ? 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-8xl' : 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl'}`}>
            Vozovna Motol
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <i className={`fa-solid fa-person-walking text-blue-100 animate-pulse ${settings.isFullscreen ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'}`}></i>
            <div className={`text-blue-100 ${settings.isFullscreen ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'}`}>
              <span className="font-semibold">Motol</span> • 6 min • 400m
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 sm:gap-2 md:gap-4 lg:gap-6 w-full sm:w-auto">
          {settings.showWeatherInHeader && (
            <div className={`${settings.isFullscreen ? 'text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl' : 'text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl'}`}>
              <WeatherHeader lat={50.0755} lon={14.4378} />
            </div>
          )}
          <div className="text-right">
            <div className={`font-bold ${
              settings.isFullscreen ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl 2xl:text-8xl' : 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl 2xl:text-7xl'
            }`}>
              {currentTime.toLocaleTimeString('cs-CZ')}
            </div>
            <div className={`text-blue-100 mt-1 sm:mt-2 ${
              settings.isFullscreen ? 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-4xl' : 'text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-3xl'
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
          <i className={`fa-solid fa-person-walking text-blue-100 animate-pulse ${
            settings.isFullscreen ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg'
          }`}></i>
          <div className={`text-blue-100 ${
            settings.isFullscreen ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg'
          }`}>
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
                      ? 'w-24 h-24 sm:w-[512px] sm:h-[512px]'
                      : 'w-20 h-20 sm:w-96 sm:h-96'
                  }`}
                  style={getLogoStyle()}
                />
              </div>
            </div>

            <div className="flex-1 text-center">
              <h1 className={`font-bold leading-tight ${
                settings.isFullscreen ? 'text-2xl sm:text-7xl' : 'text-xl sm:text-6xl'
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
                        ? 'w-32 h-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-[512px] sm:h-32 md:h-40 lg:h-48 xl:h-56 2xl:h-64 3xl:h-[512px]'
                        : 'w-24 h-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 2xl:w-96 sm:h-24 md:h-28 lg:h-32 xl:h-36 2xl:h-40 3xl:h-96'
                      : settings.isFullscreen
                      ? 'w-20 h-20 sm:w-24 md:w-28 lg:w-32 xl:w-56 2xl:h-56 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-56'
                      : 'w-16 h-16 sm:w-20 md:w-24 lg:w-28 xl:w-48 2xl:h-48 sm:h-16 md:h-20 lg:h-24 xl:h-28 2xl:h-48'
                  }`}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className={`font-bold leading-tight ${
                  settings.isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-8xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl'
                }`}>
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
              <div className="flex items-center gap-2 sm:gap-4 text-center">
                <i className={`fa-solid fa-person-walking text-blue-100 animate-pulse ${
                  settings.isFullscreen ? 'text-lg sm:text-5xl' : 'text-base sm:text-4xl'
                }`}></i>
                <div>
                  <div className={`font-semibold ${
                    settings.isFullscreen ? 'text-lg sm:text-4xl' : 'text-base sm:text-3xl'
                  }`}>Motol</div>
                  <div className={`text-blue-100 ${
                    settings.isFullscreen ? 'text-base sm:text-3xl' : 'text-sm sm:text-2xl'
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
                settings.isFullscreen ? 'text-2xl sm:text-7xl' : 'text-xl sm:text-6xl'
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
                  settings.isFullscreen ? 'text-3xl sm:text-8xl' : 'text-2xl sm:text-7xl'
                }`}>
                  {currentTime.toLocaleTimeString('cs-CZ')}
                </div>
                <div className={`text-blue-100 mt-1 sm:mt-2 ${
                  settings.isFullscreen ? 'text-base sm:text-4xl' : 'text-sm sm:text-3xl'
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
              <h1 className={`font-bold leading-tight ${
                settings.isFullscreen ? 'text-lg sm:text-7xl' : 'text-base sm:text-6xl'
              }`}>
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
                  settings.isFullscreen ? 'text-3xl sm:text-8xl' : 'text-2xl sm:text-7xl'
                }`}>
                  {currentTime.toLocaleTimeString('cs-CZ')}
                </div>
                <div className={`text-blue-100 mt-1 sm:mt-2 ${
                  settings.isFullscreen ? 'text-base sm:text-4xl' : 'text-sm sm:text-3xl'
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
      
      console.log('🚗 Vozovna only mode - showing both directions');
      
      if (settings.vozovnaUnifiedHeader) {
        // Unified header mode
        return (
          <div
            className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 overflow-hidden h-screen`}
            style={{
              transform: `scale(${settings.zoomLevel})`,
              transformOrigin: 'top left',
              width: `${100 / settings.zoomLevel}%`,
              height: `${100 / settings.zoomLevel}%`
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {renderUnifiedHeader()}

              <div className={`${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
                <div
                  className="h-full opacity-100 transform translate-x-0"
                  style={{ fontSize: `${effectiveTextSize}em` }}
                >
                  <TramDepartures
                    key={`vozovna1-${Array.isArray(currentVozovnaStation1.id) ? currentVozovnaStation1.id.join(',') : currentVozovnaStation1.id}`}
                    stationId={currentVozovnaStation1.id}
                    textSize={effectiveTextSize}
                    maxItems={5}
                    customTitle={currentVozovnaStation1.direction}
                    showTimesInMinutes={settings.showTimesInMinutes}
                  />
                </div>
              </div>

              <div className={`${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
                <div
                  className="h-full opacity-100 transform translate-x-0"
                  style={{ fontSize: `${effectiveTextSize}em` }}
                >
                  <TramDepartures
                    key={`vozovna2-${Array.isArray(currentVozovnaStation2.id) ? currentVozovnaStation2.id.join(',') : currentVozovnaStation2.id}`}
                    stationId={currentVozovnaStation2.id}
                    textSize={effectiveTextSize}
                    maxItems={5}
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

            <DailyRobot textSize={effectiveTextSize} />
          </div>
        );
      }
      
      // Two headers mode (original)
      return (
        <div
          className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col lg:flex-row overflow-hidden h-screen`}
          style={{
            transform: `scale(${settings.zoomLevel})`,
            transformOrigin: 'top left',
            width: `${100 / settings.zoomLevel}%`,
            height: `${100 / settings.zoomLevel}%`
          }}
        >
          <div className="flex-1 flex flex-col h-1/2 lg:h-full">
            {renderLeftHeader(currentVozovnaStation1)}
            <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
              <div
                className="h-full opacity-100 transform translate-x-0"
                style={{ fontSize: `${effectiveTextSize}em` }}
              >
                <TramDepartures
                  key={`vozovna1-${Array.isArray(currentVozovnaStation1.id) ? currentVozovnaStation1.id.join(',') : currentVozovnaStation1.id}`}
                  stationId={currentVozovnaStation1.id}
                  textSize={effectiveTextSize}
                  maxItems={5}
                  customTitle={currentVozovnaStation1.direction}
                  showTimesInMinutes={settings.showTimesInMinutes}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col h-1/2 lg:h-full">
            {renderRightHeader(currentVozovnaStation2)}
            <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
              <div
                className="h-full opacity-100 transform translate-x-0"
                style={{ fontSize: `${effectiveTextSize}em` }}
              >
                <TramDepartures
                  key={`vozovna2-${Array.isArray(currentVozovnaStation2.id) ? currentVozovnaStation2.id.join(',') : currentVozovnaStation2.id}`}
                  stationId={currentVozovnaStation2.id}
                  textSize={effectiveTextSize}
                  maxItems={5}
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
      );
    }
    
    // Normal split view mode (Motol + Vozovna)
    const currentMotolStation = getCurrentMotolStation();
    const currentVozovnaStation = getCurrentVozovnaStation();
    
    console.log('🔄 Split view rendering - Current index:', currentStationIndex);
    console.log('🏠 Current Motol station:', currentMotolStation?.textName);
    console.log('🚗 Current Vozovna station:', currentVozovnaStation?.textName);
    console.log('🎭 Is transitioning:', isTransitioning);
    
    return (
      <div
        className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden h-screen`}
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
            height: settings.isFullscreen ? '330px' : '275px'
          }}
        >
          <div className="absolute inset-0 bg-blue-900/80"></div>
          <div className="px-1 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-4 relative z-10 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full gap-4">
              {/* Left station */}
              <div className="flex flex-col sm:flex-row items-center justify-between h-full">
                <div className="flex items-center gap-1 sm:gap-4 lg:gap-6">
                  <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
                    <img
                      src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
                      alt="Logo školy"
                      className={`object-contain ${
                        settings.isFullscreen
                          ? 'w-20 h-20 sm:w-24 md:w-28 lg:w-32 xl:w-56 2xl:h-56 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-56'
                          : 'w-16 h-16 sm:w-20 md:w-24 lg:w-28 xl:w-48 2xl:h-48 sm:h-16 md:h-20 lg:h-24 xl:h-28 2xl:h-48'
                      }`}
                      style={getLogoStyle()}
                    />
                  </div>
                  <div className="flex-1 text-center lg:text-left">
                    <h1 className={`font-bold leading-tight ${
                      settings.isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-8xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl'
                    }`}>
                      {React.isValidElement(currentMotolStation.displayName) ?
                        currentMotolStation.displayName :
                        (currentMotolStation.textName || currentMotolStation.displayName)
                      }
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-center">
                  <i className={`fa-solid fa-person-walking text-blue-100 animate-pulse ${
                    settings.isFullscreen ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'
                  }`}></i>
                  <div>
                    <div className={`font-semibold ${
                      settings.isFullscreen ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'
                    }`}>Motol</div>
                    <div className={`text-blue-100 ${
                      settings.isFullscreen ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'
                    }`}>6 min • 400m</div>
                  </div>
                </div>
              </div>

              {/* Right station */}
              <div className="flex flex-col sm:flex-row items-center justify-between h-full">
                <div className="flex-1 text-center order-2 lg:order-1">
                  <h1 className={`font-bold leading-tight ${
                    settings.isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-8xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl'
                  }`}>
                    {React.isValidElement(currentVozovnaStation.displayName) ?
                      currentVozovnaStation.displayName :
                      (currentVozovnaStation.textName || currentVozovnaStation.displayName)
                    }
                  </h1>
                </div>
                <div className="flex flex-col items-center lg:items-end gap-1 sm:gap-2 md:gap-4 lg:gap-6 order-1 lg:order-2">
                  {settings.showWeatherInHeader && (
                    <div className={`${
                      settings.isFullscreen ? 'text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl' : 'text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl'
                    }`}>
                      <WeatherHeader lat={50.0755} lon={14.4378} />
                    </div>
                  )}
                  <div className="text-center lg:text-right">
                    <div className={`font-bold ${
                      settings.isFullscreen ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl 2xl:text-8xl' : 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl 2xl:text-7xl'
                    }`}>
                      {currentTime.toLocaleTimeString('cs-CZ')}
                    </div>
                    <div className={`text-blue-100 mt-1 sm:mt-2 ${
                      settings.isFullscreen ? 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-4xl' : 'text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-3xl'
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
        </div>

        {/* Content area */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
            <div
              className={`h-full transition-all duration-800 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-8' : 'opacity-100 transform translate-x-0'}`}
              style={{ fontSize: `${effectiveTextSize}em` }}
            >
              <TramDepartures
                key={`motol-${Array.isArray(currentMotolStation.id) ? currentMotolStation.id.join(',') : currentMotolStation.id}-${currentStationIndex}`}
                stationId={currentMotolStation.id}
                textSize={effectiveTextSize}
                maxItems={5}
                showTimesInMinutes={settings.showTimesInMinutes}
              />
            </div>
          </div>

          <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
            <div
              className={`h-full transition-all duration-800 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-8' : 'opacity-100 transform translate-x-0'}`}
              style={{ fontSize: `${effectiveTextSize}em` }}
            >
              <TramDepartures
                key={`vozovna-${Array.isArray(currentVozovnaStation.id) ? currentVozovnaStation.id.join(',') : currentVozovnaStation.id}-${currentStationIndex}`}
                stationId={currentVozovnaStation.id}
                textSize={effectiveTextSize}
                maxItems={5}
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

        <DailyRobot textSize={effectiveTextSize} />

        <DailyRobot textSize={getEffectiveTextSize()} />
      </div>
    );
  }

  const effectiveTextSize = getEffectiveTextSize();
  
  return (
    <div
      className={`bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden ${
        settings.isFullscreen ? 'h-screen' : 'min-h-screen'
      }`}
      style={{
        transform: `scale(${settings.zoomLevel})`,
        transformOrigin: 'top left',
        width: `${100 / settings.zoomLevel}%`,
        height: `${100 / settings.zoomLevel}%`
      }}
    >
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
                    ? 'w-20 h-20 sm:w-80 sm:h-80'
                    : 'w-16 h-16 sm:w-72 sm:h-72'
                }`}
                style={getLogoStyle()}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className={`font-bold leading-tight ${
                settings.isFullscreen ? 'text-lg sm:text-7xl' : 'text-base sm:text-6xl'
              }`}>
                {React.isValidElement(currentStation.displayName) ?
                    currentStation.displayName :
                    (currentStation.textName || currentStation.displayName)
                  }
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-center">
            <i className={`fa-solid fa-person-walking text-blue-100 animate-pulse ${
              settings.isFullscreen ? 'text-5xl' : 'text-4xl'
            }`}></i>
            <div>
              <div className={`font-semibold ${
                settings.isFullscreen ? 'text-4xl' : 'text-3xl'
              }`}>
                Motol
              </div>
              <div className={`text-blue-100 ${
                settings.isFullscreen ? 'text-3xl' : 'text-2xl'
              }`}>6 min • 400m</div>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-center sm:text-right">
              <div className={`font-bold ${
                settings.isFullscreen ? 'text-3xl sm:text-8xl' : 'text-2xl sm:text-7xl'
              }`}>
                {currentTime.toLocaleTimeString('cs-CZ')}
              </div>
              <div className={`text-blue-100 mt-1 sm:mt-2 ${
                settings.isFullscreen ? 'text-base sm:text-4xl' : 'text-sm sm:text-3xl'
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
            <i className={`fa-solid fa-person-walking text-blue-100 animate-pulse ${
              settings.isFullscreen ? 'text-xl' : 'text-lg'
            }`}></i>
            <div className={`text-blue-100 ${
              settings.isFullscreen ? 'text-xl' : 'text-lg'
            }`}>
              <span className="font-semibold">Motol</span> • 6 min • 400m
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className={`flex-1 ${settings.isFullscreen ? 'p-1' : 'p-2'} overflow-hidden`}>
          <div
            className={`h-full transition-all duration-800 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-8' : 'opacity-100 transform translate-x-0'}`}
            style={{ fontSize: `${effectiveTextSize}em` }}
          >
            <TramDepartures
              key={`${Array.isArray(currentStation.id) ? currentStation.id.join(',') : currentStation.id}-${currentStationIndex}`}
              stationId={currentStation.id}
              textSize={effectiveTextSize}
              maxItems={5}
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
  );
};

export default Index;
