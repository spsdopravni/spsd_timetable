import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getDepartures } from '@/utils/pidApi';
import { getWeather } from '@/utils/weatherApi';
import type { Departure } from '@/types/pid';
import type { WeatherData } from '@/types/weather';

// Definice všech stanic v aplikaci
export const ALL_STATIONS = {
  // Motol
  vozovnaCentrum: { id: 'U865Z1P', name: 'Vozovna Motol (Centrum)' },
  vozovnaRepy: { id: 'U865Z2P', name: 'Vozovna Motol (Řepy)' },
  motolZlicin: { id: ['U394Z3P', 'U394Z3'], name: 'Motol (Zličín)' },
  motolNemocnice: { id: ['U394Z4P', 'U394Z4'], name: 'Motol (Nemocnice)' },
  // Moravská
  janaMasarykaA: { id: 'U354Z1P', name: 'Jana Masaryka (A)' },
  janaMasarykaB: { id: 'U354Z2P', name: 'Jana Masaryka (B)' },
  sumavskaA: { id: 'U744Z1P', name: 'Šumavská (A)' },
  sumavskaB: { id: 'U744Z2P', name: 'Šumavská (B)' },
  // Náměstí Míru metro (jen pro odpočet v headeru)
  namestiMiruMetro: { id: ['U476Z101P', 'U476Z102P'], name: 'Náměstí Míru (metro A)' },
  // Výstaviště — Bikefest
  vystavisteA: { id: 'U532Z1P', name: 'Výstaviště (A)' },
  vystavisteB: { id: 'U532Z2P', name: 'Výstaviště (B)' },
  vystavisteC: { id: 'U532Z3P', name: 'Výstaviště (C)' },
  vystavisteVlak: { id: 'U532Z301', name: 'Praha-Výstaviště (vlak)' },
  // Metro C pro Bikefest (Vltavská + Nádraží Holešovice)
  vltavskaMetro: { id: ['U100Z101P', 'U100Z102P'], name: 'Vltavská (metro C)' },
  holesoviceMetro: { id: ['U115Z101P', 'U115Z102P'], name: 'Nádraží Holešovice (metro C)' },
  prahaBubny: { id: 'U100Z301', name: 'Praha-Bubny (vlak)' },
};

// Weather lokace
export const WEATHER_LOCATIONS = {
  vozovnaMotol: { lat: 50.0755, lon: 14.4378, name: 'Vozovna Motol' },
  moravska: { lat: 50.0735, lon: 14.4407, name: 'Moravská' },
};

interface StationDepartures {
  departures: Departure[];
  alerts: any[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface TimeState {
  currentTime: Date;
  timeOffset: number;
}

interface SeasonalTheme {
  logoPath: string;
  robotTheme: {
    image: string;
    theme: string;
  };
  showSnowfall: boolean;
}

interface DataContextType {
  // Departures pro každou stanici
  stationData: { [key: string]: StationDepartures };

  // Weather data
  weatherData: { [key: string]: WeatherState };

  // Čas synchronizovaný se serverem
  time: TimeState;

  // Zimní období (sněžení, zimní logo, zimní robot) - deprecated, use seasonalTheme
  isWinterPeriod: boolean;

  // Seasonal theme (logo, robot, snowfall)
  seasonalTheme: SeasonalTheme;

  // Funkce pro manuální refresh
  refreshStation: (stationKey: string) => Promise<void>;
  refreshWeather: (locationKey: string) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Získání dat pro stanici
  getDeparturesForStation: (stationKey: string) => StationDepartures;
  getWeatherForLocation: (locationKey: string) => WeatherState;
}

const defaultStationData: StationDepartures = {
  departures: [],
  alerts: [],
  loading: true,
  error: null,
  lastUpdate: null,
};

const defaultWeatherState: WeatherState = {
  data: null,
  loading: true,
  error: null,
  lastUpdate: null,
};

const DataContext = createContext<DataContextType | null>(null);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Station data state
  const [stationData, setStationData] = useState<{ [key: string]: StationDepartures }>({});

  // Weather data state
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherState }>({});

  // Time state
  const [time, setTime] = useState<TimeState>({
    currentTime: new Date(),
    timeOffset: 0,
  });

  // Fetch world time for synchronization
  const fetchWorldTime = useCallback(async (): Promise<number> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Prague', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      const serverTime = new Date(data.datetime);
      const localTime = new Date();
      return serverTime.getTime() - localTime.getTime();
    } catch (error) {
      return 0;
    }
  }, []);

  // Fetch departures for a station
  const fetchStationDepartures = useCallback(async (stationKey: string) => {
    const station = ALL_STATIONS[stationKey as keyof typeof ALL_STATIONS];
    if (!station) return;

    setStationData(prev => ({
      ...prev,
      [stationKey]: {
        ...defaultStationData,
        ...(prev[stationKey] || {}),
        loading: prev[stationKey]?.departures.length === 0, // Only show loading if no data yet
      }
    }));

    try {
      const result = await getDepartures(station.id);
      setStationData(prev => ({
        ...prev,
        [stationKey]: {
          departures: result.departures || [],
          alerts: result.alerts || [],
          loading: false,
          error: null,
          lastUpdate: new Date(),
        }
      }));
    } catch (error: any) {
      setStationData(prev => ({
        ...prev,
        [stationKey]: {
          ...prev[stationKey],
          loading: false,
          error: error.message === 'RATE_LIMIT' ? 'API limit - čekám...' : 'Chyba načítání',
        }
      }));
    }
  }, []);

  // Fetch weather for a location
  const fetchWeatherData = useCallback(async (locationKey: string) => {
    const location = WEATHER_LOCATIONS[locationKey as keyof typeof WEATHER_LOCATIONS];
    if (!location) return;

    setWeatherData(prev => ({
      ...prev,
      [locationKey]: {
        ...defaultWeatherState,
        ...(prev[locationKey] || {}),
        loading: prev[locationKey]?.data === null,
      }
    }));

    try {
      const data = await getWeather(location.lat, location.lon);
      setWeatherData(prev => ({
        ...prev,
        [locationKey]: {
          data,
          loading: false,
          error: null,
          lastUpdate: new Date(),
        }
      }));
    } catch (error) {
      setWeatherData(prev => ({
        ...prev,
        [locationKey]: {
          ...prev[locationKey],
          loading: false,
          error: 'Počasí není dostupné',
        }
      }));
    }
  }, []);

  // Refresh functions
  const refreshStation = useCallback(async (stationKey: string) => {
    await fetchStationDepartures(stationKey);
  }, [fetchStationDepartures]);

  const refreshWeather = useCallback(async (locationKey: string) => {
    await fetchWeatherData(locationKey);
  }, [fetchWeatherData]);

  const refreshAll = useCallback(async () => {
    const stationPromises = Object.keys(ALL_STATIONS).map(key => fetchStationDepartures(key));
    const weatherPromises = Object.keys(WEATHER_LOCATIONS).map(key => fetchWeatherData(key));
    await Promise.all([...stationPromises, ...weatherPromises]);
  }, [fetchStationDepartures, fetchWeatherData]);

  // Get data helpers
  const getDeparturesForStation = useCallback((stationKey: string): StationDepartures => {
    return stationData[stationKey] || defaultStationData;
  }, [stationData]);

  const getWeatherForLocation = useCallback((locationKey: string): WeatherState => {
    return weatherData[locationKey] || defaultWeatherState;
  }, [weatherData]);

  // Detekce vánočního období (20.12 - 26.12) - sněžení a zimní logo (deprecated)
  const isWinterPeriod = (() => {
    const month = time.currentTime.getMonth() + 1;
    const day = time.currentTime.getDate();
    return month === 12 && day >= 20 && day <= 26;
  })();

  // Seasonal theme calculation (same logic as DailyRobot)
  const seasonalTheme: SeasonalTheme = (() => {
    const month = time.currentTime.getMonth() + 1;
    const day = time.currentTime.getDate();

    // Silvestr a Nový rok (27.12 - 6.1) - NEJVYŠŠÍ PRIORITA
    if ((month === 12 && day >= 27) || (month === 1 && day <= 6)) {
      return {
        logoPath: '/pictures/snow_spsd.png', // Zimní logo pro nový rok
        robotTheme: { image: '/pictures/robot-newyear.png', theme: 'newyear' },
        showSnowfall: true
      };
    }

    // Vánoční téma (20. - 26. prosince)
    if (month === 12 && day >= 20 && day < 27) {
      return {
        logoPath: '/pictures/snow_spsd.png', // Zimní logo pro vánoce
        robotTheme: { image: '/pictures/robot-christmas.png', theme: 'christmas' },
        showSnowfall: true
      };
    }

    // Halloween téma (20. října - 26. listopadu)
    if ((month === 10 && day >= 20) || (month === 11 && day <= 26)) {
      return {
        logoPath: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png', // Normální logo
        robotTheme: { image: '/pictures/robot-halloween.png', theme: 'halloween' },
        showSnowfall: false
      };
    }

    // Velikonoce (pohyblivý svátek - přibližně březen/duben)
    // Zjednodušená detekce: kolem velikonoc v dubnu (10-20.4)
    if (month === 4 && day >= 10 && day <= 20) {
      return {
        logoPath: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png', // Normální logo
        robotTheme: { image: '/pictures/robot-easter.png', theme: 'easter' },
        showSnowfall: false
      };
    }

    // Jarní téma (1. března - 31. května, kromě velikonoc)
    if (month >= 3 && month <= 5) {
      return {
        logoPath: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png', // Normální logo
        robotTheme: { image: '/pictures/robot-spring.png', theme: 'spring' },
        showSnowfall: false
      };
    }

    // Letní téma (1. června - 31. srpna)
    if (month >= 6 && month <= 8) {
      return {
        logoPath: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png', // Normální logo
        robotTheme: { image: '/pictures/robot-summer.png', theme: 'summer' },
        showSnowfall: false
      };
    }

    // Podzimní téma (1. září - 19. října)
    if (month === 9 || (month === 10 && day < 20)) {
      return {
        logoPath: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png', // Normální logo
        robotTheme: { image: '/pictures/robot-autumn.png', theme: 'autumn' },
        showSnowfall: false
      };
    }

    // Zimní téma (27. listopadu - 19. prosince, před vánocemi)
    if ((month === 11 && day >= 27) || (month === 12 && day < 20)) {
      return {
        logoPath: '/pictures/snow_spsd.png', // Zimní logo
        robotTheme: { image: '/pictures/robot-winter.png', theme: 'winter' },
        showSnowfall: true
      };
    }

    // Výchozí klasický robot
    return {
      logoPath: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png', // Normální logo
      robotTheme: { image: '/pictures/robotz.png', theme: 'classic' },
      showSnowfall: false
    };
  })();

  // Initialize - load all data on mount
  useEffect(() => {
    const initialize = async () => {
      // Sync time
      const offset = await fetchWorldTime();
      setTime(prev => ({ ...prev, timeOffset: offset }));

      // Load all station data
      Object.keys(ALL_STATIONS).forEach(key => {
        fetchStationDepartures(key);
      });

      // Load weather data
      Object.keys(WEATHER_LOCATIONS).forEach(key => {
        fetchWeatherData(key);
      });
    };

    initialize();
  }, [fetchWorldTime, fetchStationDepartures, fetchWeatherData]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const localTime = new Date();
      const adjustedTime = new Date(localTime.getTime() + time.timeOffset);
      setTime(prev => ({ ...prev, currentTime: adjustedTime }));
    }, 1000);

    return () => clearInterval(timer);
  }, [time.timeOffset]);

  // Refresh departures every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(ALL_STATIONS).forEach(key => {
        fetchStationDepartures(key);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchStationDepartures]);

  // Refresh weather every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(WEATHER_LOCATIONS).forEach(key => {
        fetchWeatherData(key);
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Re-sync time every 10 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const offset = await fetchWorldTime();
      setTime(prev => ({ ...prev, timeOffset: offset }));
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWorldTime]);

  const value: DataContextType = {
    stationData,
    weatherData,
    time,
    isWinterPeriod,
    seasonalTheme,
    refreshStation,
    refreshWeather,
    refreshAll,
    getDeparturesForStation,
    getWeatherForLocation,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
