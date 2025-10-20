import { useState, useEffect } from "react";
import { Thermometer, Droplets, Wind, Eye, Sun, Moon, Gauge, Cloud, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeather } from "@/utils/weatherApi";
import type { WeatherData } from "@/types/weather";

interface WeatherWidgetProps {
  lat: number;
  lon: number;
  stationName: string;
}

export const WeatherWidget = ({ lat, lon, stationName }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getWeather(lat, lon);
        setWeather(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Aktualizace každých 10 minut
    const interval = setInterval(() => {
      fetchWeather();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-3 text-center text-gray-600">
          <Thermometer className="w-6 h-6 mx-auto mb-1 text-gray-400" />
          <p className="text-sm">Počasí není dostupné</p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (condition: string, rainChance: number, cloudiness: number) => {
    const lowerCondition = condition.toLowerCase();
    
    
    // Pokud je vysoká pravděpodobnost deště (nad 60%), ukázat deštové ikony
    if (rainChance > 60) {
      const icon = rainChance > 80 ? '🌧️' : '🌦️';
      return icon;
    }
    
    // Pokud je střední pravděpodobnost deště (20-60%), ukázat částečně zataženo s možností deště
    if (rainChance > 20) {
      return '🌦️';
    }
    
    // Jinak se řídit podle oblačnosti a popisu
    if (cloudiness > 80) {
      return '☁️'; // Overcast
    } else if (cloudiness > 50) {
      return '⛅'; // Partly cloudy
    } else if (cloudiness > 20) {
      return '🌤️'; // Mostly sunny
    }
    
    // Pro specifické podmínky z API
    if (lowerCondition.includes('snow') || lowerCondition.includes('sníh')) {
      return '❄️';
    }
    
    if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('mlha')) {
      return '🌫️';
    }
    
    if (lowerCondition.includes('thunderstorm') || lowerCondition.includes('bouřka')) {
      return '⛈️';
    }
    
    // Default pro jasné počasí
    return '☀️';
  };

  const getUvIndexDescription = (uv: number) => {
    if (uv <= 2) return { text: "Nízký", color: "text-green-600" };
    if (uv <= 5) return { text: "Střední", color: "text-yellow-600" };
    if (uv <= 7) return { text: "Vysoký", color: "text-orange-600" };
    if (uv <= 10) return { text: "Velmi vysoký", color: "text-red-600" };
    return { text: "Extrémní", color: "text-purple-600" };
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('cs-CZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRainChanceColor = (chance: number) => {
    if (chance <= 20) return "text-gray-500";
    if (chance <= 40) return "text-blue-400";
    if (chance <= 60) return "text-blue-500";
    if (chance <= 80) return "text-blue-600";
    return "text-blue-700";
  };

  const uvIndex = weather.uv || 0;
  const uvInfo = getUvIndexDescription(uvIndex);
  const rainChance = weather.rainChance || 0;
  const cloudiness = weather.clouds?.all || 0;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader className="pb-2 p-3">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
          <Thermometer className="w-4 h-4 text-blue-600" />
          Počasí - Vozovna Motol
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Main weather display */}
        <div className="text-center mb-3">
          <div className="text-3xl mb-2">
            {getWeatherIcon(weather.weather?.[0]?.description || 'clear', rainChance, cloudiness)}
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {Math.round(weather.main.temp)}°C
          </div>
          <div className="text-sm text-gray-600 capitalize mb-1">
            {weather.weather?.[0]?.description || 'Jasno'}
          </div>
          <div className="text-sm text-gray-500 mb-1">
            Pocitově {Math.round(weather.main.feels_like)}°C
          </div>
          <div className="text-xs text-gray-500">
            Min: {Math.round(weather.main.temp_min)}°C | Max: {Math.round(weather.main.temp_max)}°C
          </div>
        </div>

        {/* Rain chance highlight */}
        <div className="bg-blue-50 rounded-lg p-2 mb-3 border border-blue-200">
          <div className="flex items-center justify-center gap-2">
            <CloudRain className={`w-4 h-4 ${getRainChanceColor(rainChance)}`} />
            <div className="text-center">
              <div className="text-xs text-gray-600">Pravděpodobnost deště</div>
              <div className={`text-lg font-bold ${getRainChanceColor(rainChance)}`}>
                {rainChance}%
              </div>
            </div>
          </div>
        </div>

        {/* Weather details grid */}
        <div className="grid grid-cols-2 gap-2 mb-2 border-t border-blue-200 pt-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-3 h-3 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Vlhkost</div>
              <div className="text-sm font-semibold">{weather.main.humidity}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-3 h-3 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Nárazový vítr</div>
              <div className="text-sm font-semibold">
                {weather.gust ? Math.round(weather.gust * 3.6) : Math.round((weather.wind?.speed || 0) * 3.6)} km/h
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="w-3 h-3 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Viditelnost</div>
              <div className="text-sm font-semibold">{Math.round((weather.visibility || 10000) / 1000)} km</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Gauge className="w-3 h-3 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Tlak</div>
              <div className="text-sm font-semibold">{weather.main.pressure} hPa</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sun className="w-3 h-3 text-orange-500" />
            <div>
              <div className="text-xs text-gray-600">UV Index</div>
              <div className={`text-sm font-semibold ${uvInfo.color}`}>
                {uvIndex.toFixed(1)} ({uvInfo.text})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Cloud className="w-3 h-3 text-gray-500" />
            <div>
              <div className="text-xs text-gray-600">Oblačnost</div>
              <div className="text-sm font-semibold">{weather.clouds.all}%</div>
            </div>
          </div>
        </div>

        {/* Sun times */}
        <div className="grid grid-cols-2 gap-2 mb-2 border-t border-blue-200 pt-2">
          <div className="flex items-center gap-2">
            <Sun className="w-3 h-3 text-orange-500" />
            <div>
              <div className="text-xs text-gray-600">Východ slunce</div>
              <div className="text-sm font-semibold">{formatTime(weather.sys.sunrise)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Moon className="w-3 h-3 text-indigo-500" />
            <div>
              <div className="text-xs text-gray-600">Západ slunce</div>
              <div className="text-sm font-semibold">{formatTime(weather.sys.sunset)}</div>
            </div>
          </div>
        </div>

        {/* Update time */}
        <div className="text-xs text-gray-500 text-center border-t border-blue-200 pt-2">
          Aktualizováno {lastUpdate.toLocaleTimeString('cs-CZ')}
        </div>
      </CardContent>
    </Card>
  );
};
