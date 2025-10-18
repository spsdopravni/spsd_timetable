import React, { useState, useEffect } from 'react';

interface DailyRobotProps {
  textSize?: number;
}

export const DailyRobot = ({ textSize = 1.0 }: DailyRobotProps) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const getDayName = () => {
    const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    return days[new Date().getDay()];
  };

  const getNameDayInfo = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Základní český kalendář svátků (můžeme rozšířit)
    const nameDays: {[key: string]: string} = {
      '1-1': 'Nový rok',
      '1-6': 'Tři králové',
      '3-19': 'Josef',
      '4-30': 'Žofie',
      '5-1': 'Svátek práce',
      '5-8': 'Den vítězství',
      '7-5': 'Cyril a Metoděj',
      '7-6': 'Jan Hus',
      '9-28': 'Václav',
      '10-28': 'Den vzniku Československa',
      '11-17': 'Den boje za svobodu',
      '12-24': 'Štědrý den',
      '12-25': 'Boží hod vánoční',
      '12-26': 'Štěpán',
      '10-18': 'Jarda',  // Příklad pro dnešek
    };

    const key = `${month}-${day}`;
    return nameDays[key] || null;
  };

  const generateMessage = () => {
    const day = getDayName();
    const nameDay = getNameDayInfo();
    const hour = new Date().getHours();

    let greeting = '';
    if (hour < 10) greeting = 'Dobré ráno!';
    else if (hour < 17) greeting = 'Dobrý den!';
    else greeting = 'Dobrý večer!';

    if (nameDay) {
      return (
        <span>
          {greeting} Dnes je {day} a má svátek {nameDay}! <i className="fas fa-birthday-cake text-yellow-500 ml-1"></i>
        </span>
      );
    } else {
      return (
        <span>
          {greeting} Dnes je {day}, přeji příjemný den! <i className="fas fa-sun text-yellow-500 ml-1"></i>
        </span>
      );
    }
  };

  useEffect(() => {
    setCurrentMessage(generateMessage());

    // Aktualizace každou hodinu
    const interval = setInterval(() => {
      setCurrentMessage(generateMessage());
    }, 3600000); // 1 hodina

    return () => clearInterval(interval);
  }, []);

  // Automatické skrytí po 8 sekundách, zobrazení každou minutu
  useEffect(() => {
    // První zobrazení po 2 sekundách
    const initialTimer = setTimeout(() => {
      setIsVisible(true);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 8000); // Skrýt po 8 sekundách

      return () => clearTimeout(hideTimer);
    }, 2000);

    // Pak každou minutu
    const showTimer = setInterval(() => {
      setIsVisible(true);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 8000); // Skrýt po 8 sekundách

      return () => clearTimeout(hideTimer);
    }, 60000); // Zobrazit každou minutu

    return () => {
      clearTimeout(initialTimer);
      clearInterval(showTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-end gap-3 max-w-md transition-all duration-1000 ease-out ${
        isVisible ? 'transform translate-x-0 translate-y-0 opacity-100' : 'transform translate-x-full translate-y-full opacity-0'
      }`}
      style={{ fontSize: `${Math.max(0.8, 1.2 * textSize)}rem` }}
    >
      {/* Bubble s textem */}
      <div className={`bg-white/95 backdrop-blur-sm border-2 border-blue-300 rounded-2xl p-3 shadow-xl relative transition-all duration-500 ${
        isVisible ? 'animate-pulse scale-100' : 'scale-0'
      }`}>
        {/* Šipka */}
        <div className="absolute bottom-2 right-[-8px] w-0 h-0 border-l-8 border-l-blue-300 border-t-8 border-t-transparent border-b-8 border-b-transparent"></div>

        <div className="text-gray-800 font-medium leading-tight">
          {currentMessage}
        </div>
      </div>

      {/* Robot obrázek */}
      <div className={`flex-shrink-0 transition-all duration-700 ${
        isVisible ? 'animate-bounce scale-100' : 'scale-0 rotate-180'
      }`}>
        <div style={{
          width: `${Math.max(4, 6 * textSize)}rem`,
          height: `${Math.max(4, 6 * textSize)}rem`,
          background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
          <i className="fas fa-robot" style={{ fontSize: `${Math.max(1.5, 2.5 * textSize)}rem`, color: 'white' }}></i>
        </div>
      </div>
    </div>
  );
};