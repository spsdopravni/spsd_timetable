import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import funFacts from '@/data/fun_facts.json';
import nameDays from '@/data/name_days.json';
import { useDataContext } from '@/context/DataContext';
const DailyRobotComponent = ({ barColor, customMessages = [], robotImage }: { barColor?: string; customMessages?: string[]; robotImage?: string }) => {
  const { seasonalTheme } = useDataContext();
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [robotPhase, setRobotPhase] = useState('hidden'); // 'hidden', 'movingLeft', 'atLeft', 'movingRight', 'atRight', 'movingAway'
  const [showBackground, setShowBackground] = useState(false);
  const [showText, setShowText] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getDayName = useCallback(() => {
    const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    return days[new Date().getDay()];
  }, []);


  const getNameDayInfo = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const key = `${month}-${day}`;
    return (nameDays as {[key: string]: string})[key] || null;
  };

  const getFunFacts = () => {
    return funFacts[Math.floor(Math.random() * funFacts.length)];
  };

  const getSchoolHolidays = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Prázdniny a speciální dny
    const holidays = {
      // Vánoční období (20.12. - 26.12.)
      'christmas': month === 12 && day >= 20 && day <= 26,

      // Novoroční období (27.12. - 6.1.)
      'newYear': (month === 12 && day >= 27) || (month === 1 && day <= 6),

      // První den po novém roce (7.1.)
      'afterNewYear': month === 1 && day === 7,

      // Jarní prázdniny (březen)
      'beforeSpring': month === 3 && day >= 25 && day <= 31,
      'afterSpring': month === 4 && day === 1,

      // Velikonoční prázdniny (duben - může se lišit podle roku)
      'beforeEaster': month === 4 && day >= 15 && day <= 18,
      'afterEaster': month === 4 && day === 19,

      // Letní prázdniny
      'beforeSummer': (month === 6 && day >= 29) || month === 7 || (month === 8 && day <= 31),
      'afterSummer': month === 9 && day === 1,

      // Podzimní prázdniny (říjen)
      'beforeAutumn': month === 10 && day >= 26 && day <= 31,
      'afterAutumn': month === 11 && day === 1
    };

    return holidays;
  };

  const generateMessage = () => {
    // Pokud jsou custom messages, zobrazuj jen ty
    if (customMessages.length > 0) {
      return customMessages[messageCounter % customMessages.length];
    }

    const day = getDayName();
    const nameDay = getNameDayInfo();
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const dayOfWeek = new Date().getDay(); // 0=neděle, 1=pondělí, ..., 5=pátek, 6=sobota
    const holidays = getSchoolHolidays();

    let greeting = '';
    if (hour < 10) greeting = 'Dobré ráno!';
    else if (hour < 12) greeting = 'Dobré dopoledne!';
    else if (hour < 17) greeting = 'Dobré poledne!';
    else greeting = 'Dobrý večer!';

    // STŘÍDÁNÍ: 0 = pozdravi, 1 = fun fakty, 2 = svátek, 3 = promo rozvrhy
    const cyclePosition = messageCounter % 4;

    if (cyclePosition === 0) {
      // POZDRAVI - různé podle situace včetně prázdnin

      // Novoroční období (27.12. - 6.1.)
      if (holidays.newYear) {
        const year = new Date().getFullYear();
        const newYearMessages = [
          `${greeting} Šťastný nový rok ${year}! Přejeme vám úspěšný rok!`,
          `${greeting} Vítejte v roce ${year}! Ať se vám daří!`,
          `${greeting} Přejeme krásný nový rok ${year}!`,
        ];
        return newYearMessages[Math.floor(Math.random() * newYearMessages.length)];
      }

      // První den po novém roce (7.1.)
      if (holidays.afterNewYear) {
        return `${greeting} Vítejte zpátky po novoročních prázdninách! Přejeme úspěšný rok!`;
      }

      if (holidays.afterSpring) {
        return `${greeting} Vítejte zpátky po jarních prázdninách! Doufáme, že jste si odpočinuli!`;
      }
      if (holidays.afterEaster) {
        return `${greeting} Vítejte zpátky po velikonočních prázdninách! Těšíme se na vás!`;
      }
      if (holidays.afterSummer) {
        return `${greeting} Vítejte zpátky po letních prázdninách! Nový školní rok začíná!`;
      }
      if (holidays.afterAutumn) {
        return `${greeting} Vítejte zpátky po podzimních prázdninách! Pokračujeme ve studiu!`;
      }

      // Vánoční období (20. - 26.12.)
      if (holidays.christmas) {
        return `${greeting} Přejeme vám krásné Vánoce! Užijte si svátky!`;
      }
      if (holidays.beforeSpring) {
        return `${greeting} Užijte si jarní prázdniny! Odpočiňte si a naberte síly!`;
      }
      if (holidays.beforeEaster) {
        return `${greeting} Užijte si velikonoční prázdniny! Veselé Velikoce!`;
      }
      if (holidays.beforeSummer) {
        return `${greeting} Užijte si letní prázdniny! Krásné léto a uvidíme se v září!`;
      }
      if (holidays.beforeAutumn) {
        return `${greeting} Užijte si podzimní prázdniny! Odpočiňte si a uvidíme se po nich!`;
      }

      // Pondělní vítání po víkendu
      if (dayOfWeek === 1) {
        return `${greeting} Doufáme, že jste si užili víkend! Vítejte zpátky v novém týdnu!`;
      }

      // Zpráva o obědě (11:00-13:00)
      if (hour >= 11 && hour < 13) {
        return `${greeting} Čas na oběd! Užijte si chvilku pohody a dobré jídlo!`;
      }

      // Páteční víkendové přání (celý pátek)
      if (dayOfWeek === 5) {
        return `${greeting} Je pátek! Přejeme vám hezký víkend a odpočinek!`;
      }

      // Večerní zpráva (20:00-23:59)
      if (hour >= 20) {
        return `${greeting} Přejeme vám hezký večer a vidíme se zítra!`;
      }

      // Standardní zpráva s datem
      return `${greeting} Dnes je ${day}, přeji příjemný den!`;
    } else if (cyclePosition === 1) {
      // FUN FAKTY
      return getFunFacts();
    } else if (cyclePosition === 2) {
      // SVÁTEK
      if (nameDay) {
        return `${greeting} Dnes má svátek ${nameDay}!`;
      } else {
        return `${greeting} Dnes je ${day}, přeji příjemný den!`;
      }
    } else {
      // Fallback na fun fact
      return getFunFacts();
    }
  };

  useEffect(() => {
    setCurrentMessage(generateMessage());
  }, [messageCounter]);

  // Postupná animace - robot jede z prava doleva a zpět
  useEffect(() => {
    const startAnimation = () => {
      // Pokud už animace běží, přeskoč
      if (isAnimating) {
        return;
      }

      setIsAnimating(true);
      setMessageCounter(prev => prev + 1); // Změna textu při každém zobrazení
      setIsVisible(true);
      setRobotPhase('movingLeft');

      // Robot dorazí doleva po 4 sekundách
      setTimeout(() => {
        setRobotPhase('atLeft');
      }, 4000);

      // Robot se začne vracet doprava po 2 sekundách
      setTimeout(() => {
        setRobotPhase('movingRight');
        setShowBackground(true);
      }, 6000);

      // Robot dorazí doprava s pozadím
      setTimeout(() => {
        setRobotPhase('atRight');
        setShowText(true);
      }, 10000);

      // Text a pozadí zmizí po 15 sekundách
      setTimeout(() => {
        setShowText(false);
        setShowBackground(false);
      }, 15000);

      // Robot odjíždí doprava po 16 sekundách (po zmizení textu)
      setTimeout(() => {
        setRobotPhase('movingAway');
      }, 16000);

      // Vše úplně zmizí po 19 sekundách
      setTimeout(() => {
        setRobotPhase('hidden');
        setIsVisible(false);
        setIsAnimating(false); // Animace skončila
      }, 19000);
    };

    // První zobrazení po 2 sekundách
    const initialTimer = setTimeout(startAnimation, 2000);

    // Pak každou minutu
    const showTimer = setInterval(startAnimation, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(showTimer);
    };
  }, [isAnimating]); // Závislost na isAnimating

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Pozadí s textem */}
          <motion.div
            className={`robot-animation fixed bottom-0 left-0 right-0 h-24 z-40 shadow-lg ${barColor ? '' : 'bg-gradient-to-l from-blue-900 via-blue-800 to-blue-900/95'}`}
            style={{
              willChange: 'opacity',
              transform: 'translateZ(0)',
              ...(barColor ? { background: barColor } : {})
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: showBackground ? 1 : 0
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: 'linear'
            }}
          />

          {/* Text vycentrovaný na celé obrazovce */}
          <motion.div
            className="robot-animation fixed bottom-0 left-0 right-0 w-full h-24 z-50 flex items-center justify-center"
            style={{
              willChange: 'opacity',
              transform: 'translateZ(0)'
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: showText ? 1 : 0
            }}
            transition={{ duration: 0.5, ease: 'linear' }}
          >
            <div className="text-white font-bold text-center" style={{
              fontSize: `${Math.max(1.2, 2 * 1.0)}rem`,
              wordBreak: 'keep-all',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              {currentMessage}
            </div>
          </motion.div>

          {/* Robot */}
          <motion.div
            className="robot-animation fixed z-[9999]"
            style={{
              bottom: '0px',
              right: '0px',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)'
            }}
            animate={{
              x: robotPhase === 'movingLeft' ? 'calc(-100vw + 50px)' :
                 robotPhase === 'atLeft' ? 'calc(-100vw + 50px)' :
                 robotPhase === 'movingRight' ? 'calc(-85vw + 50px)' :
                 robotPhase === 'atRight' ? 'calc(-85vw + 50px)' :
                 robotPhase === 'movingAway' ? 'calc(100vw)' :
                 'calc(100vw + 50px)',
              opacity: robotPhase === 'hidden' ? 0 : 1
            }}
            transition={{
              duration: robotPhase === 'movingLeft' ? 4 :
                       robotPhase === 'movingRight' ? 4 :
                       robotPhase === 'movingAway' ? 3 : 1,
              ease: 'linear'
            }}
          >
            <motion.img
              src={robotImage || seasonalTheme.robotTheme.image}
              alt={robotImage ? 'Robot' : `Robot ${seasonalTheme.robotTheme.theme}`}
              className="w-auto object-contain"
              style={{
                height: '16rem',
                filter: 'drop-shadow(4px 4px 12px rgba(0,0,0,0.4))',
                // Zrcadlově otočit doprava, když jede zprava doleva
                transform: (robotPhase === 'movingRight' || robotPhase === 'atRight' || robotPhase === 'movingAway')
                  ? 'scaleX(-1)'
                  : 'scaleX(1)',
                transition: 'transform 0.3s ease-in-out'
              }}
              onError={(e) => {
                // Fallback na výchozí robot, pokud obrázek neexistuje
                const target = e.target as HTMLImageElement;
                if (target.src !== '/pictures/robotz.png') {
                  target.src = '/pictures/robotz.png';
                }
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const DailyRobot = memo(DailyRobotComponent);