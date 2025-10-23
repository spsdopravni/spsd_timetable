import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  alerts: any[];
}

export const AlertBanner = ({ alerts }: AlertBannerProps) => {
  const [currentAlert, setCurrentAlert] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Filtruj a zpracuj alerts
  const processedAlerts = alerts
    .filter(alert => alert && (alert.text || alert.title || alert.description))
    .map(alert => ({
      text: alert.text || alert.title || alert.description || "Informace o dopravě",
      priority: alert.priority || 0,
      category: alert.category || "info"
    }))
    .sort((a, b) => b.priority - a.priority); // Seřaď podle priority

  useEffect(() => {
    if (processedAlerts.length > 0) {
      setIsVisible(true);

      // Rotuj alerts každých 8 sekund
      if (processedAlerts.length > 1) {
        const interval = setInterval(() => {
          setCurrentAlert(prev => (prev + 1) % processedAlerts.length);
        }, 8000);

        return () => clearInterval(interval);
      }
    } else {
      setIsVisible(false);
    }
  }, [processedAlerts.length]);

  if (!isVisible || processedAlerts.length === 0) {
    return null;
  }

  const alert = processedAlerts[currentAlert];

  return (
    <div className="w-full mb-4">
      <div
        className="bg-red-600 text-white overflow-hidden relative rounded-lg shadow-lg border-2 border-red-700"
        style={{ minHeight: `${Math.max(3.5, 5.5 * 1.0)}rem` }}
      >
        {/* Pozadí s gradientem pro lepší vzhled */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 opacity-90"></div>

        <div className="relative flex items-center h-full px-4 py-3">
          {/* Ikona upozornění */}
          <div className="flex-shrink-0 mr-3">
            <AlertTriangle
              className="text-white"
              style={{
                width: `${Math.max(2.0, 3.0 * 1.0)}rem`,
                height: `${Math.max(2.0, 3.0 * 1.0)}rem`
              }}
            />
          </div>

          {/* Scrollující text */}
          <div className="flex-1 overflow-hidden">
            <div
              className="whitespace-nowrap font-bold text-white"
              style={{
                fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem`,
                lineHeight: '1.2',
                animation: `scroll-left ${Math.max(15, alert.text.length * 0.2)}s linear infinite`
              }}
            >
              🚨 {alert.text} 🚨
            </div>
          </div>

          {/* Indikátor počtu alerts */}
          {processedAlerts.length > 1 && (
            <div className="flex-shrink-0 ml-3">
              <div
                className="bg-red-800 text-white rounded-full px-2 py-1 text-center font-bold"
                style={{
                  fontSize: `${Math.max(0.8, 1.2 * 1.0)}rem`,
                  minWidth: `${Math.max(2.0, 3.0 * 1.0)}rem`
                }}
              >
                {currentAlert + 1}/{processedAlerts.length}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};