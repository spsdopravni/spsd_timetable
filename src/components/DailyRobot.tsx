import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import funFacts from '@/data/fun_facts.json';
import nameDays from '@/data/name_days.json';

export const DailyRobot = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [robotPhase, setRobotPhase] = useState('hidden'); // 'hidden', 'movingLeft', 'atLeft', 'movingRight', 'atRight', 'movingAway'
  const [showBackground, setShowBackground] = useState(false);
  const [showText, setShowText] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getDayName = () => {
    const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    return days[new Date().getDay()];
  };

  const getRobotTheme = () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    // Silvestr a Nový rok (25.12 - 2.1) - NEJVYŠŠÍ PRIORITA
    if ((month === 12 && day >= 27) || (month === 1 && day <= 2)) {
      return {
        image: '/pictures/robot-newyear.png',
        theme: 'newyear'
      };
    }

    // Vánoční téma (1. prosince - 24. prosince)
    if (month === 12 && day < 27) {
      return {
        image: '/pictures/robot-christmas.png',
        theme: 'christmas'
      };
    }

    // Halloween téma (20. října - 1. listopadu)
    if ((month === 10 && day >= 20) || (month === 11 && day <= 1)) {
      return {
        image: '/pictures/robot-halloween.png',
        theme: 'halloween'
      };
    }

    // Velikonoce (pohyblivý svátek - přibližně březen/duben)
    // Zjednodušená detekce: kolem velikonoc v dubnu (10-20.4)
    if (month === 4 && day >= 10 && day <= 20) {
      return {
        image: '/pictures/robot-easter.png',
        theme: 'easter'
      };
    }

    // Jarní téma (1. března - 31. května, kromě velikonoc)
    if (month >= 3 && month <= 5) {
      return {
        image: '/pictures/robot-spring.png',
        theme: 'spring'
      };
    }

    // Letní téma (1. června - 31. srpna)
    if (month >= 6 && month <= 8) {
      return {
        image: '/pictures/robot-summer.png',
        theme: 'summer'
      };
    }

    // Podzimní téma (1. září - 19. října)
    if (month === 9 || (month === 10 && day < 20)) {
      return {
        image: '/pictures/robot-autumn.png',
        theme: 'autumn'
      };
    }

    // Zimní téma (3. ledna - 28. února)
    if ((month === 1 && day > 2) || month === 2) {
      return {
        image: '/pictures/robot-winter.png',
        theme: 'winter'
      };
    }

    // Výchozí klasický robot
    return {
      image: '/pictures/robotz.png',
      theme: 'classic'
    };
  };

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
      // Vánoční prázdniny
      'beforeChristmas': (month === 12 && day >= 22) || (month === 1 && day <= 2),
      'afterChristmas': month === 1 && day === 3,

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

      // První školní den po prázdninách
      if (holidays.afterChristmas) {
        return `${greeting} Vítejte zpátky po vánočních prázdninách! Přejeme úspěšný školní rok!`;
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

      // Před prázdninami
      if (holidays.beforeChristmas) {
        return `${greeting} Užijte si vánoční prázdniny! Uvidíme se po Novém roce!`;
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
      // PROMO ROZVRHY - propagace spsd-rozvrhy.vercel.app
      const promoMessages = [
        '📅 Bakaláři nefungují? Zkus spsd-rozvrhy.vercel.app — rozvrh, který nikdy nespí!',
        '🚀 Rozvrh rychlejší než Bakaláři? spsd-rozvrhy.vercel.app — vyzkoušej a uvidíš!',
        '💡 Tip pro studenty: spsd-rozvrhy.vercel.app — rozvrh bez čekání a výmluv!',
        '⚡ Když Bakaláři padnou, spsd-rozvrhy.vercel.app tě zachrání!',
        '📱 Rozvrh v kapse? spsd-rozvrhy.vercel.app — funguje vždy a všude!'
      ];
      return promoMessages[Math.floor(Math.random() * promoMessages.length)];
    }
  };

  const [robotTheme, setRobotTheme] = useState(() => getRobotTheme());

  useEffect(() => {
    setCurrentMessage(generateMessage());
    // Aktualizovat téma robota při každé změně zprávy
    setRobotTheme(getRobotTheme());
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
            className="robot-animation fixed bottom-0 left-0 right-0 h-24 z-40 bg-gradient-to-l from-blue-900 via-blue-800 to-blue-900/95 shadow-lg"
            style={{
              willChange: 'width, opacity',
              backfaceVisibility: 'hidden'
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: showBackground ? '100%' : 0,
              opacity: showBackground ? 1 : 0
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: 'linear',
              type: 'tween'
            }}
          />

          {/* Text vycentrovaný na celé obrazovce */}
          <motion.div
            className="robot-animation fixed bottom-0 left-0 right-0 w-full h-24 z-50 flex items-center justify-center"
            style={{
              willChange: 'opacity, transform',
              backfaceVisibility: 'hidden'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: showText ? 1 : 0,
              scale: showText ? 1 : 0.8
            }}
            transition={{ duration: 1, delay: 0.5, ease: 'linear', type: 'tween' }}
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
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}
            animate={{
              x: robotPhase === 'movingLeft' ? 'calc(-100vw + 50px)' :
                 robotPhase === 'atLeft' ? 'calc(-100vw + 50px)' :
                 robotPhase === 'movingRight' ? 'calc(-85vw + 50px)' :
                 robotPhase === 'atRight' ? 'calc(-85vw + 50px)' :
                 robotPhase === 'movingAway' ? 'calc(100vw)' :
                 'calc(100vw + 50px)',
              opacity: robotPhase === 'hidden' ? 0 : 1,
              scale: robotPhase === 'hidden' ? 0.8 : 1
            }}
            transition={{
              duration: robotPhase === 'movingLeft' ? 4 :
                       robotPhase === 'movingRight' ? 4 :
                       robotPhase === 'movingAway' ? 3 : 1,
              ease: 'linear',
              type: 'tween'
            }}
          >
            <motion.img
              src={robotTheme.image}
              alt={`Robot ${robotTheme.theme}`}
              className="w-auto object-contain"
              style={{
                height: `${Math.max(5, 12 * 1.0)}rem`,
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