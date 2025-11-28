import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getDepartures } from '@/utils/pidApi';
import { getWeather } from '@/utils/weatherApi';
import type { Departure } from '@/types/pid';
import type { WeatherData } from '@/types/weather';

// Definice všech stanic v aplikaci
export const ALL_STATIONS = {
  // Index.tsx stanice
  vozovnaCentrum: { id: 'U865Z1P', name: 'Vozovna Motol (Centrum)' },
  vozovnaRepy: { id: 'U865Z2P', name: 'Vozovna Motol (Řepy)' },
  motolZlicin: { id: ['U394Z3P', 'U394Z3'], name: 'Motol (Zličín)' },
  motolNemocnice: { id: ['U394Z4P', 'U394Z4'], name: 'Motol (Nemocnice)' },
  // Pragensis.tsx stanice
  vysehrad: { id: ['U527Z101P', 'U527Z102P'], name: 'Vyšehrad Metro C' },
  svatoplukova: { id: ['U724Z1P', 'U724Z2P'], name: 'Svatoplukova' },
};

// Weather lokace
export const WEATHER_LOCATIONS = {
  vozovnaMotol: { lat: 50.0755, lon: 14.4378, name: 'Vozovna Motol' },
  pragensis: { lat: 50.06506, lon: 14.4296026, name: 'Pragensis' },
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

interface DataContextType {
  // Departures pro každou stanici
  stationData: { [key: string]: StationDepartures };

  // Weather data
  weatherData: { [key: string]: WeatherState };

  // Čas synchronizovaný se serverem
  time: TimeState;

  // Zimní období (sněžení, zimní logo, zimní robot)
  isWinterPeriod: boolean;

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

  // Detekce zimního období (27.11 - 1.1)
  const isWinterPeriod = (() => {
    const month = time.currentTime.getMonth() + 1;
    const day = time.currentTime.getDate();
    return (month === 11 && day >= 27) || month === 12 || (month === 1 && day === 1);
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

  // Update current time every 2 seconds (reduces CPU load on slow PCs)
  useEffect(() => {
    const timer = setInterval(() => {
      const localTime = new Date();
      const adjustedTime = new Date(localTime.getTime() + time.timeOffset);
      setTime(prev => ({ ...prev, currentTime: adjustedTime }));
    }, 2000);

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
