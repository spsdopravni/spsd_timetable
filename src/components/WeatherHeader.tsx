
import { useState, useEffect } from 'react';
import { getWeather } from '@/utils/weatherApi';
import { Droplets, Wind, CloudRain, Thermometer } from 'lucide-react';

interface WeatherHeaderProps {
  lat: number;
  lon: number;
}

export const WeatherHeader = ({ lat, lon }: WeatherHeaderProps) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getWeather(lat, lon);
        setWeather(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 minut
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading || !weather) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-20 w-20 bg-white/30 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 w-24 bg-white/30 rounded"></div>
            <div className="h-4 w-32 bg-white/30 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getWeatherIcon = (description: string, isDay: boolean) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny') || desc.includes('jasno')) return isDay ? 'fas fa-sun' : 'fas fa-moon';
    if (desc.includes('cloud') || desc.includes('oblač')) return 'fas fa-cloud';
    if (desc.includes('rain') || desc.includes('déšť') || desc.includes('dest')) return 'fas fa-cloud-rain';
    if (desc.includes('snow') || desc.includes('sníh') || desc.includes('snih')) return 'fas fa-snowflake';
    if (desc.includes('storm') || desc.includes('bouř')) return 'fas fa-bolt';
    if (desc.includes('fog') || desc.includes('mist') || desc.includes('mlh')) return 'fas fa-smog';
    return isDay ? 'fas fa-sun' : 'fas fa-moon';
  };

  const getWeatherColor = (description: string, isDay: boolean) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny') || desc.includes('jasno')) return isDay ? 'text-yellow-400' : 'text-blue-300';
    if (desc.includes('cloud') || desc.includes('oblač')) return 'text-gray-300';
    if (desc.includes('rain') || desc.includes('déšť') || desc.includes('dest')) return 'text-blue-400';
    if (desc.includes('snow') || desc.includes('sníh') || desc.includes('snih')) return 'text-blue-200';
    if (desc.includes('storm') || desc.includes('bouř')) return 'text-purple-400';
    if (desc.includes('fog') || desc.includes('mist') || desc.includes('mlh')) return 'text-gray-400';
    return isDay ? 'text-yellow-400' : 'text-blue-300';
  };

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 20;
  const iconClass = getWeatherIcon(weather.weather[0].description, isDay);
  const iconColor = getWeatherColor(weather.weather[0].description, isDay);

  // Capitalize first letter of description
  const weatherDesc = weather.weather[0].main.charAt(0).toUpperCase() + weather.weather[0].main.slice(1);

  return (
    <div className="flex flex-col gap-2">
      {/* Main weather display */}
      <div className="flex items-center gap-3">
        {/* Weather icon */}
        <div className="flex-shrink-0">
          <i className={`${iconClass} ${iconColor} text-5xl drop-shadow-lg`}></i>
        </div>

        {/* Temperature and description */}
        <div className="flex flex-col gap-0.5">
          <div className="text-4xl font-bold text-white drop-shadow-lg leading-none">
            {Math.round(weather.main.temp)}°
          </div>
          <div className="text-sm font-medium text-white/90">
            {weatherDesc}
          </div>
        </div>
      </div>

      {/* Additional weather details */}
      <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/20">
        {/* Humidity */}
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-white/70">Vlhkost</span>
            <span className="text-sm font-semibold text-white">{weather.main.humidity}%</span>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-white/70">Vítr</span>
            <span className="text-sm font-semibold text-white">{Math.round(weather.wind.speed * 3.6)} km/h</span>
          </div>
        </div>

        {/* Rain chance */}
        <div className="flex items-center gap-1.5">
          <CloudRain className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-white/70">Déšť</span>
            <span className="text-sm font-semibold text-white">{weather.rainChance}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
