import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import funFacts from '@/data/fun_facts.json';
import nameDays from '@/data/name_days.json';
import { useSeasonal } from '@/context/DataContext';
/** Cílová pozice a doba přesunu pro každou fázi průjezdu robota. */
const ROBOT_PHASES: Record<string, { x: string; ms: number }> = {
  hidden:      { x: 'calc(100vw + 50px)',  ms: 0 },
  movingLeft:  { x: 'calc(-100vw + 50px)', ms: 4000 },
  atLeft:      { x: 'calc(-100vw + 50px)', ms: 0 },
  movingRight: { x: 'calc(-85vw + 50px)',  ms: 4000 },
  atRight:     { x: 'calc(-85vw + 50px)',  ms: 0 },
  movingAway:  { x: 'calc(100vw)',         ms: 3000 },
};

const DailyRobotComponent = ({ barColor, customMessages = [], robotImage }: { barColor?: string; customMessages?: string[]; robotImage?: string }) => {
  const { seasonalTheme } = useSeasonal();
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [robotPhase, setRobotPhase] = useState('hidden'); // 'hidden', 'movingLeft', 'atLeft', 'movingRight', 'atRight', 'movingAway'
  const [showBackground, setShowBackground] = useState(false);
  const [showText, setShowText] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  // Běh animace držíme v ref, ne ve state: kdyby to byl state, každá jeho
  // změna by restartovala efekt níž a tím zahodila 60s interval (viz komentář
  // u efektu). Do renderu tahle hodnota stejně nevstupuje.
  const isAnimatingRef = useRef(false);

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
    // Fázové timeouty jedné otočky robota. Bez tohohle pole zůstávaly po
    // odmountování viset a dostřelovaly setState do mrtvé komponenty.
    const phaseTimers: ReturnType<typeof setTimeout>[] = [];
    const push = (t: ReturnType<typeof setTimeout>) => { phaseTimers.push(t); return t; };

    const startAnimation = () => {
      // Pokud už animace běží, přeskoč
      if (isAnimatingRef.current) {
        return;
      }

      isAnimatingRef.current = true;
      setMessageCounter(prev => prev + 1); // Změna textu při každém zobrazení
      setIsVisible(true);
      setRobotPhase('movingLeft');

      // Robot dorazí doleva po 4 sekundách
      push(setTimeout(() => {
        setRobotPhase('atLeft');
      }, 4000));

      // Robot se začne vracet doprava po 2 sekundách
      push(setTimeout(() => {
        setRobotPhase('movingRight');
        setShowBackground(true);
      }, 6000));

      // Robot dorazí doprava s pozadím
      push(setTimeout(() => {
        setRobotPhase('atRight');
        setShowText(true);
      }, 10000));

      // Text a pozadí zmizí po 15 sekundách
      push(setTimeout(() => {
        setShowText(false);
        setShowBackground(false);
      }, 15000));

      // Robot odjíždí doprava po 16 sekundách (po zmizení textu)
      push(setTimeout(() => {
        setRobotPhase('movingAway');
      }, 16000));

      // Vše úplně zmizí po 19 sekundách
      push(setTimeout(() => {
        setRobotPhase('hidden');
        setIsVisible(false);
        isAnimatingRef.current = false; // Animace skončila
      }, 19000));
    };

    // První zobrazení po 2 sekundách
    const initialTimer = setTimeout(startAnimation, 2000);

    // Pak každou minutu
    const showTimer = setInterval(startAnimation, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(showTimer);
      phaseTimers.forEach(clearTimeout);
    };
    // Prázdné deps schválně. Dřív tu bylo [isAnimating], jenže startAnimation
    // hned na začátku isAnimating měnil → efekt se cleanupnul a spustil znovu
    // → 60s interval se zahodil dřív, než jednou tiknul, a robot jezdil
    // s periodou ~21 s místo 60 s (naměřeno: mountedPct 90 %, movingPct 53 %).
  }, []);

  // Kam a jak dlouho pro každou fázi. Dřív to řešil framer-motion, jenže ten
  // neumí interpolovat calc() na kompozitoru — dopočítával ho v JS a přepisoval
  // inline styl každý snímek. Naměřeno: robot sám dělal 12,3 přepočtů stylů za
  // sekundu a 24 ze 64 ms CPU. CSS transition na transform zvládne totéž
  // na kompozitoru: styl se zapíše jednou za fázi, ne 60× za sekundu.
  const phase = ROBOT_PHASES[robotPhase] ?? ROBOT_PHASES.hidden;
  const facingLeft = robotPhase === 'movingRight' || robotPhase === 'atRight' || robotPhase === 'movingAway';

  return (
    <>
      {/* Pozadí s textem */}
      {isVisible && <div
        className={`robot-animation fixed bottom-0 left-0 right-0 h-24 z-40 shadow-lg ${barColor ? '' : 'bg-gradient-to-l from-blue-900 via-blue-800 to-blue-900/95'}`}
        style={{
          opacity: showBackground ? 1 : 0,
          ...(barColor ? { background: barColor } : {}),
        }}
      />}

      {/* Text vycentrovaný na celé obrazovce */}
      {isVisible && <div
        className="robot-animation fixed bottom-0 left-0 right-0 w-full h-24 z-50 flex items-center justify-center"
        style={{ opacity: showText ? 1 : 0 }}
      >
        <div
          className="text-white font-bold text-center"
          style={{ fontSize: '2rem', wordBreak: 'keep-all', whiteSpace: 'nowrap', overflow: 'hidden' }}
        >
          {currentMessage}
        </div>
      </div>}

      {/* Robot — kontejner je namontovaný pořád. Kdyby se odmontovával,
          transition by při startu neměla odkud vyjít a robot by na cílovou
          pozici skočil místo aby přejel (ověřeno měřením transformu). */}
      <div
        className="robot-animation fixed z-[9999]"
        style={{
          bottom: 0,
          right: 0,
          opacity: robotPhase === 'hidden' ? 0 : 1,
          transform: `translate3d(${phase.x}, 0, 0)`,
          ['--robot-dur' as string]: `${phase.ms}ms`,
          // Vrstvu na GPU drž jen když se opravdu hýbe, ne 24/7.
          willChange: phase.ms > 0 ? 'transform' : 'auto',
        }}
      >
        <img
          src={robotImage || seasonalTheme.robotTheme.image}
          alt={robotImage ? 'Robot' : `Robot ${seasonalTheme.robotTheme.theme}`}
          className="w-auto object-contain robot-sprite"
          style={{
            height: '16rem',
            transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/pictures/robotz.png') {
              target.src = '/pictures/robotz.png';
            }
          }}
        />
      </div>
    </>
  );
};

export const DailyRobot = memo(DailyRobotComponent);