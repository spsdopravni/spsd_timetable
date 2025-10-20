
import type { WeatherData } from "@/types/weather";

const WEATHER_API_KEY = "8877ab34e77243f995a161549251806";
const WEATHER_BASE = "https://api.weatherapi.com/v1";

// Funkce pro parsování času ve formátu "6:30 AM" nebo "18:45"
const parseTimeString = (timeStr: string, date: string): number => {
  try {
    // WeatherAPI vrací čas ve formátu "6:30 AM" nebo "18:45"
    const cleanTime = timeStr.trim();
    
    // Pokud obsahuje AM/PM, převedeme na 24h formát
    if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
      const [time, period] = cleanTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      const dateTime = new Date(`${date}T${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      return Math.floor(dateTime.getTime() / 1000);
    } else {
      // Už je ve 24h formátu
      const dateTime = new Date(`${date}T${cleanTime}:00`);
      return Math.floor(dateTime.getTime() / 1000);
    }
  } catch (error) {
    console.error('Error parsing time:', timeStr, error);
    // Fallback na aktuální čas
    return Math.floor(Date.now() / 1000);
  }
};

// Mapování WeatherAPI na OpenWeatherMap formát
const mapWeatherApiToOpenWeather = (data: any): WeatherData => {
  const today = new Date().toISOString().split('T')[0];
  
  const sunrise = parseTimeString(data.forecast.forecastday[0].astro.sunrise, today);
  const sunset = parseTimeString(data.forecast.forecastday[0].astro.sunset, today);
  
  const rainChance = data.forecast.forecastday[0].day.chance_of_rain;
  const cloudiness = data.current.cloud;
  const condition = data.current.condition.text;
  
  
  return {
    coord: {
      lat: data.location.lat,
      lon: data.location.lon
    },
    weather: [{
      id: data.current.condition.code,
      main: data.current.condition.text,
      description: data.current.condition.text.toLowerCase(),
      icon: data.current.condition.icon
    }],
    main: {
      temp: data.current.temp_c,
      feels_like: data.current.feelslike_c,
      temp_min: data.forecast.forecastday[0].day.mintemp_c,
      temp_max: data.forecast.forecastday[0].day.maxtemp_c,
      pressure: data.current.pressure_mb,
      humidity: data.current.humidity
    },
    visibility: data.current.vis_km * 1000, // převod na metry
    wind: {
      speed: data.current.wind_kph / 3.6, // převod na m/s
      deg: data.current.wind_degree
    },
    clouds: {
      all: data.current.cloud
    },
    dt: Math.floor(new Date(data.location.localtime).getTime() / 1000),
    sys: {
      type: 1,
      id: 0,
      country: data.location.country,
      sunrise: sunrise,
      sunset: sunset
    },
    timezone: 0,
    id: 0,
    name: data.location.name,
    cod: 200,
    uv: data.current.uv,
    gust: data.current.gust_kph ? data.current.gust_kph / 3.6 : undefined, // převod na m/s
    rainChance: rainChance
  };
};

export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    
    const response = await fetch(
      `${WEATHER_BASE}/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=1&aqi=no&alerts=no&lang=cs`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    return mapWeatherApiToOpenWeather(data);
  } catch (error) {
    console.error("Error fetching weather:", error);
    
    // Fallback na mock data při chybě
    const mockWeather: WeatherData = {
      coord: { lat, lon },
      weather: [{
        id: 800,
        main: "Clear",
        description: "jasno",
        icon: "01d"
      }],
      main: {
        temp: 15,
        feels_like: 15,
        temp_min: 10,
        temp_max: 20,
        pressure: 1013,
        humidity: 60
      },
      visibility: 10000,
      wind: {
        speed: 5,
        deg: 180
      },
      clouds: {
        all: 20
      },
      dt: Math.floor(Date.now() / 1000),
      sys: {
        type: 1,
        id: 0,
        country: "CZ",
        sunrise: Math.floor(Date.now() / 1000) - 3600,
        sunset: Math.floor(Date.now() / 1000) + 3600
      },
      timezone: 3600,
      id: 0,
      name: "Prague",
      cod: 200,
      uv: 3,
      gust: undefined,
      rainChance: 25
    };
    
    return mockWeather;
  }
};
