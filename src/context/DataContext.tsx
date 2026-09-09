import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { getDepartures } from '@/utils/pidApi';
import { getWeather } from '@/utils/weatherApi';
import { generatePid3Departures, generatePidDayLetenskaDepartures } from '@/utils/piddayDepartures';
import { generateDepoKacerovOut } from '@/utils/depoKacerovMetro';
import type { Pid3StopName } from '@/data/piddaySchedule';
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
  // I. P. Pavlova metro C (rotace s A v hlavičce Moravská)
  ipPavlovaMetro: { id: ['U118Z101P', 'U118Z102P'], name: 'I. P. Pavlova (metro C)' },
  // Výstaviště — Bikefest
  vystavisteA: { id: 'U532Z1P', name: 'Výstaviště (A)' },
  vystavisteB: { id: 'U532Z2P', name: 'Výstaviště (B)' },
  vystavisteC: { id: 'U532Z3P', name: 'Výstaviště (C)' },
  vystavisteVlak: { id: 'U532Z301', name: 'Praha-Výstaviště (vlak)' },
  // Metro C pro Bikefest (Vltavská + Nádraží Holešovice)
  vltavskaMetro: { id: ['U100Z101P', 'U100Z102P'], name: 'Vltavská (metro C)' },
  holesoviceMetro: { id: ['U115Z101P', 'U115Z102P'], name: 'Nádraží Holešovice (metro C)' },
  prahaBubny: { id: 'U100Z301', name: 'Praha-Bubny (vlak)' },
  // Sparta tram (Letenská pláň) — Den PID 2026
  spartaA: { id: 'U692Z1P', name: 'Sparta (A)' },
  spartaB: { id: 'U692Z2P', name: 'Sparta (B)' },
  // Depo Kačerov — Den otevřených dveří (6. 6. 2026).
  // Tabule stojí přímo u zastávky „Depo Kačerov" (NE terminál Kačerov).
  // Metro C jede jako speciální „vložený spoj" (viz depoKacerovMetro*
  // ve PIDDAY_VIRTUAL_STATIONS); zde jen autobusová zastávka Depo Kačerov.
  depoKacerovBusA: { id: 'U79Z1P', name: 'Depo Kačerov (A)' },
  depoKacerovBusB: { id: 'U79Z2P', name: 'Depo Kačerov (B)' },
};

// Virtuální stanice generované lokálně (Den PID 2026).
// Nemají stop_id v PID API — odjezdy se počítají z lokálního JŘ.
type PidDayVirtualStation = {
  name: string;
  generate: (now: Date) => Departure[];
};

export const PIDDAY_VIRTUAL_STATIONS: Record<string, PidDayVirtualStation> = {
  pid3Letna: {
    name: 'Letenská pláň (PID3)',
    generate: (now) => generatePid3Departures('Letenská pláň' as Pid3StopName, now, 8),
  },
  pid3VozovnaMotol: {
    name: 'Vozovna Motol (PID3)',
    generate: (now) => generatePid3Departures('Vozovna Motol' as Pid3StopName, now, 8),
  },
  piddayLetenska: {
    name: 'Letenská pláň · Den PID',
    generate: (now) => generatePidDayLetenskaDepartures(now, 20),
  },
  // 2-sloupcová tabule — chronologické pokračování, levý 7, pravý 7.
  piddayLetenskaA: {
    name: 'Letenská pláň · sloupec 1',
    generate: (now) => generatePidDayLetenskaDepartures(now, 14).slice(0, 7),
  },
  piddayLetenskaB: {
    name: 'Letenská pláň · sloupec 2',
    generate: (now) => generatePidDayLetenskaDepartures(now, 14).slice(7, 14),
  },
  // Den otevřených dveří depo Kačerov — vložený spoj metra C (6. 6. 2026).
  // Tabule stojí v depu, takže ukazujeme jen odjezdy Z DEPA → Nádraží Holešovice.
  depoKacerovMetroOut: {
    name: 'Depo Kačerov → Nádraží Holešovice',
    generate: (now) => generateDepoKacerovOut(now, 10),
  },
};

// Weather lokace
export const WEATHER_LOCATIONS = {
  vozovnaMotol: { lat: 50.0755, lon: 14.4378, name: 'Vozovna Motol' },
  moravska: { lat: 50.0735, lon: 14.4407, name: 'Moravská' },
};

// MANUAL TIME OVERRIDE — pro testování PID Day tabule mimo provozní hodiny.
// Když nastaveno {h,m}, čas se "posune" na dnešek HH:MM a normálně tiká dál.
// Pro reálný čas nastav `null` (a smaž tento override před produkčním nasazením).
const MANUAL_TIME_OVERRIDE: { hours: number; minutes: number } | null = null;

function computeManualOffset(): number | null {
  if (!MANUAL_TIME_OVERRIDE) return null;
  const target = new Date();
  target.setHours(MANUAL_TIME_OVERRIDE.hours, MANUAL_TIME_OVERRIDE.minutes, 0, 0);
  return target.getTime() - Date.now();
}

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

  // Funkce pro manuální refresh
  refreshStation: (stationKey: string) => Promise<void>;
  refreshWeather: (locationKey: string) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Získání dat pro stanici
  getDeparturesForStation: (stationKey: string) => StationDepartures;
  getWeatherForLocation: (locationKey: string) => WeatherState;

  /** Přihlásí zastávku k odběru; vrací odhlašovací funkci. */
  subscribeStation: (stationKey: string) => () => void;
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

/* Čas se mění 1×/s, data 1×/60 s, sezóna 1×/den. Když všechno viselo na
   jednom context value, měnila se jeho reference každou sekundu a překreslil
   se celý strom tabule — memo() na komponentách proti tomu nic nezmůže.
   Proto tři oddělené contexty: kdo čte jen data, ten se s hodinami netiká. */
const TimeContext = createContext<TimeState | undefined>(undefined);
const SeasonalContext = createContext<{ seasonalTheme: SeasonalTheme; isWinterPeriod: boolean } | undefined>(undefined);
const TimeOffsetContext = createContext<number>(0);

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

  // Které zastávky jsou opravdu na obrazovce. Dřív se každých 60 s stahovalo
  // všech 21 z ALL_STATIONS na každé tabuli, i když Motol zobrazuje čtyři —
  // 17 zbytečných requestů za minutu a s každým další překreslení stromu.
  // Počítáme reference, ne jen přítomnost: stejnou zastávku může zobrazovat
  // víc komponent najednou a odchod jedné nesmí sebrat data ostatním.
  const stationRefs = useRef<Map<string, number>>(new Map());
  const [activeVersion, setActiveVersion] = useState(0);

  const subscribeStation = useCallback((key: string) => {
    const n = stationRefs.current.get(key) ?? 0;
    stationRefs.current.set(key, n + 1);
    if (n === 0) setActiveVersion(v => v + 1);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const cur = stationRefs.current.get(key) ?? 0;
      if (cur <= 1) {
        stationRefs.current.delete(key);
        setActiveVersion(v => v + 1);
      } else {
        stationRefs.current.set(key, cur - 1);
      }
    };
  }, []);

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

  // Sezóna se mění jednou za den, ne každou sekundu. Dřív se oba objekty
  // přepočítávaly při každém tiku hodin a novou referencí překreslily
  // všechny konzumenty, včetně robota.
  const dayKey = `${time.currentTime.getMonth() + 1}-${time.currentTime.getDate()}`;

  const isWinterPeriod = useMemo(() => {
    const [m, d] = dayKey.split('-').map(Number);
    return m === 12 && d >= 20 && d <= 26;
  }, [dayKey]);

  const seasonalTheme: SeasonalTheme = useMemo(() => {
    const [month, day] = dayKey.split('-').map(Number);

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
  }, [dayKey]);

  // Initialize - load all data on mount
  useEffect(() => {
    const initialize = async () => {
      // Sync time (manual override má přednost pro testovací režim)
      const manual = computeManualOffset();
      const offset = manual !== null ? manual : await fetchWorldTime();
      setTime(prev => ({ ...prev, timeOffset: offset }));

      // Data zastávek natáhne refresh efekt níž, a to jen pro ty,
      // které jsou opravdu na obrazovce.

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

  // Refresh jen těch zastávek, které jsou opravdu na obrazovce.
  useEffect(() => {
    const tick = () => stationRefs.current.forEach((_, key) => fetchStationDepartures(key));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [fetchStationDepartures, activeVersion]);

  // Den PID 2026 — generování virtuálních PID3 odjezdů z lokálního JŘ.
  // Regenerace každých 30 s, aby seznam pravidelně odbavoval projeté odjezdy.
  useEffect(() => {
    // Jen pro virtuální zastávky, které někdo zobrazuje. Dřív se generovalo
    // všech šest každých 30 s na každé tabuli — a zápis do stationData
    // pokaždé překreslil celý strom, i na Motole, kde se nezobrazují.
    const wanted = Object.keys(PIDDAY_VIRTUAL_STATIONS).filter(k => stationRefs.current.has(k));
    if (wanted.length === 0) return;

    const regenerate = () => {
      const now = new Date(Date.now() + time.timeOffset);
      setStationData(prev => {
        const next = { ...prev };
        for (const key of wanted) {
          const conf = PIDDAY_VIRTUAL_STATIONS[key];
          next[key] = {
            departures: conf.generate(now),
            alerts: [],
            loading: false,
            error: null,
            lastUpdate: now,
          };
        }
        return next;
      });
    };
    regenerate();
    const interval = setInterval(regenerate, 30 * 1000);
    return () => clearInterval(interval);
  }, [time.timeOffset, activeVersion]);

  // Refresh weather every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(WEATHER_LOCATIONS).forEach(key => {
        fetchWeatherData(key);
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Re-sync time every 10 minutes (přeskakuje se v manuálním overridu, jinak
  // by se nastavený fake čas pravidelně přepisoval na reálný).
  useEffect(() => {
    if (MANUAL_TIME_OVERRIDE) return;
    const interval = setInterval(async () => {
      const offset = await fetchWorldTime();
      setTime(prev => ({ ...prev, timeOffset: offset }));
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWorldTime]);

  // Každý provider dostane vlastní memoizovanou hodnotu, aby se reference
  // měnila jen tehdy, když se opravdu změnila jeho data.
  const timeValue = useMemo(() => time, [time]);

  const seasonalValue = useMemo(
    () => ({ seasonalTheme, isWinterPeriod }),
    [seasonalTheme, isWinterPeriod]
  );

  // Pozor: `time` tu schválně NENÍ. Kdyby bylo, měnila by se reference
  // datového value každou sekundu a celé rozdělení contextů by nemělo smysl —
  // konzumenti odjezdů by se překreslovali dál. Kdo chce hodiny, bere useTime().
  const dataValue = useMemo<DataContextType>(() => ({
    stationData,
    weatherData,
    refreshStation,
    refreshWeather,
    refreshAll,
    getDeparturesForStation,
    getWeatherForLocation,
    subscribeStation,
  }), [
    stationData, weatherData,
    refreshStation, refreshWeather, refreshAll,
    getDeparturesForStation, getWeatherForLocation, subscribeStation,
  ]);

  return (
    <TimeOffsetContext.Provider value={time.timeOffset}>
    <TimeContext.Provider value={timeValue}>
      <SeasonalContext.Provider value={seasonalValue}>
        <DataContext.Provider value={dataValue}>
          {children}
        </DataContext.Provider>
      </SeasonalContext.Provider>
    </TimeContext.Provider>
    </TimeOffsetContext.Provider>
  );
};

/* ── granulární hooky ────────────────────────────────────────────────
   Komponenta si má brát jen to, co opravdu potřebuje. Hodiny v hlavičce
   chtějí useTime(), robot useSeasonal(), seznam odjezdů useStation(). */

/** Tik hodin. Mění se každou sekundu — ber jen tam, kde jde o vteřiny. */
export const useTime = (): TimeState => {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error('useTime musí být uvnitř DataProvider');
  return ctx;
};

/** Posun oproti serverovému času. Mění se jednou za 10 minut — bezpečné
    číst i tam, kde se nesmí překreslovat každou sekundu. */
export const useTimeOffset = (): number => useContext(TimeOffsetContext);

/** Sezónní téma (logo, robot, sněžení). Mění se jednou za den. */
export const useSeasonal = () => {
  const ctx = useContext(SeasonalContext);
  if (!ctx) throw new Error('useSeasonal musí být uvnitř DataProvider');
  return ctx;
};

/**
 * Odjezdy pro jednu zastávku. Zároveň ji přihlásí k odběru, takže se
 * stahuje jen to, co je opravdu na obrazovce.
 */
export const useStations = (stationKeys: string[]): void => {
  const { subscribeStation } = useDataContext();
  const key = stationKeys.join('|');
  useEffect(() => {
    const offs = key ? key.split('|').map(k => subscribeStation(k)) : [];
    return () => offs.forEach(off => off());
  }, [subscribeStation, key]);
};

export const useStation = (stationKey: string): StationDepartures => {
  const { getDeparturesForStation, subscribeStation } = useDataContext();
  useEffect(() => subscribeStation(stationKey), [subscribeStation, stationKey]);
  return getDeparturesForStation(stationKey);
};
