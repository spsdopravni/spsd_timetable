
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

  const getWeatherEmoji = (description: string, isDay: boolean) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) return isDay ? '☀️' : '🌙';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('storm')) return '⛈️';
    if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
    return isDay ? '☀️' : '🌙';
  };

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 20;
  const emoji = getWeatherEmoji(weather.weather[0].description, isDay);

  return (
    <div className="flex items-center gap-4">
      <span className="text-6xl">{emoji}</span>
      <span className="font-semibold">{Math.round(weather.main.temp)}°C</span>
    </div>
  );
};
