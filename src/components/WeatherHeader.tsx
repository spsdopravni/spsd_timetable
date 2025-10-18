
import { useState, useEffect } from 'react';
import { getWeather } from '@/utils/weatherApi';

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
        console.error('Weather fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 minut
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading || !weather) {
    return <div className="text-lg">Načítám počasí...</div>;
  }

  const getWeatherIcon = (description: string, isDay: boolean) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) return isDay ? 'fas fa-sun' : 'fas fa-moon';
    if (desc.includes('cloud')) return 'fas fa-cloud';
    if (desc.includes('rain')) return 'fas fa-cloud-rain';
    if (desc.includes('snow')) return 'fas fa-snowflake';
    if (desc.includes('storm')) return 'fas fa-bolt';
    if (desc.includes('fog') || desc.includes('mist')) return 'fas fa-smog';
    return isDay ? 'fas fa-sun' : 'fas fa-moon';
  };

  const getWeatherColor = (description: string, isDay: boolean) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) return isDay ? 'text-yellow-500' : 'text-blue-300';
    if (desc.includes('cloud')) return 'text-gray-400';
    if (desc.includes('rain')) return 'text-blue-500';
    if (desc.includes('snow')) return 'text-blue-200';
    if (desc.includes('storm')) return 'text-purple-500';
    if (desc.includes('fog') || desc.includes('mist')) return 'text-gray-300';
    return isDay ? 'text-yellow-500' : 'text-blue-300';
  };

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 20;
  const iconClass = getWeatherIcon(weather.weather[0].description, isDay);
  const iconColor = getWeatherColor(weather.weather[0].description, isDay);

  return (
    <div className="flex items-center gap-4">
      <i className={`${iconClass} ${iconColor} text-6xl`}></i>
      <span className="font-semibold">{Math.round(weather.main.temp)}°C</span>
    </div>
  );
};
