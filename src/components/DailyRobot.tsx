import { useState, useEffect, useRef, memo, useCallback } from 'react';
import funFacts from '@/data/fun_facts.json';
import nameDays from '@/data/name_days.json';
import { useSeasonal } from "@/context/DataContext";

/**
 * Fáze animace robota. Pohyb je řízený čistě CSS transitions (viz index.css,
 * třídy .robot-sprite / .robot-phase-*), takže běží na kompozitoru GPU a
 * neseká se, i když je hlavní JS vlákno vytížené re-renderem tabule
 * (důležité pro Raspberry Pi).
 */
type RobotPhase = 'hidden' | 'movingLeft' | 'atLeft' | 'movingRight' | 'atRight' | 'movingAway';

const PHASE_CLASS: Record<RobotPhase, string> = {
  hidden: 'robot-phase-hidden',
  movingLeft: 'robot-phase-left',
  atLeft: 'robot-phase-left',
  movingRight: 'robot-phase-right',
  atRight: 'robot-phase-right',
  movingAway: 'robot-phase-away',
};

const DailyRobotComponent = ({ barColor, customMessages = [], robotImage }: { barColor?: string; customMessages?: string[]; robotImage?: string }) => {
  const { seasonalTheme } = useSeasonal();
  const [currentMessage, setCurrentMessage] = useState('');
  const [robotPhase, setRobotPhase] = useState<RobotPhase>('hidden');
  // Když se obrázek robota nepodaří načíst, spadneme na výchozího robota.
  const [imageFailed, setImageFailed] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showText, setShowText] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  const isAnimatingRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  // Postupná animace - robot jede z prava doleva a zpět.
  // Časová osa (ms od startu):
  //   0     movingLeft   – jede zprava doleva (4 s)
  //   4000  atLeft       – čeká vlevo
  //   6000  movingRight  – vrací se doprava (4 s), zobrazí se lišta
  //   10000 atRight      – zobrazí se text
  //   15000               – text i lišta zmizí
  //   16000 movingAway   – odjíždí doprava (3 s)
  //   19000 hidden       – konec
  useEffect(() => {
    const schedule = (fn: () => void, ms: number) => {
      timeoutsRef.current.push(setTimeout(fn, ms));
    };

    const startAnimation = () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      setMessageCounter(prev => prev + 1);
      // Robot je v DOM pořád (schovaný za pravým okrajem), takže stačí
      // přepnout fázi a CSS transition se rozjede z aktuální pozice.
      setRobotPhase('movingLeft');

      schedule(() => setRobotPhase('atLeft'), 4000);
      schedule(() => { setRobotPhase('movingRight'); setShowBackground(true); }, 6000);
      schedule(() => { setRobotPhase('atRight'); setShowText(true); }, 10000);
      schedule(() => { setShowText(false); setShowBackground(false); }, 15000);
      schedule(() => setRobotPhase('movingAway'), 16000);
      schedule(() => {
        setRobotPhase('hidden');
        isAnimatingRef.current = false;
      }, 19000);
    };

    // První zobrazení po 2 sekundách, pak každou minutu
    const initialTimer = setTimeout(startAnimation, 2000);
    const showTimer = setInterval(startAnimation, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(showTimer);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      isAnimatingRef.current = false;
    };
  }, []);

  const facingRight = robotPhase === 'movingRight' || robotPhase === 'atRight' || robotPhase === 'movingAway';
  const preferredImage = robotImage || seasonalTheme.robotTheme.image;
  const imageSrc = imageFailed ? '/pictures/robotz.png' : preferredImage;
  const isHidden = robotPhase === 'hidden';

  // Všechny tři prvky zůstávají v DOM trvale. Obrázek se tak stáhne a dekóduje
  // jen jednou při načtení stránky – ne při každém průjezdu (dřív se element
  // odpojoval a Raspberry Pi pak robota dekódovalo znovu, na pomalé síti se
  // místo něj stihl ukázat jen alt text a ikonka načítání).
  return (
    <>
      {/* Pozadí s textem */}
      <div
        aria-hidden={!showBackground}
        className={`robot-animation robot-fade fixed bottom-0 left-0 right-0 h-24 z-40 shadow-lg pointer-events-none ${barColor ? '' : 'bg-gradient-to-l from-blue-900 via-blue-800 to-blue-900/95'}`}
        style={{
          opacity: showBackground ? 1 : 0,
          ...(barColor ? { background: barColor } : {})
        }}
      />

      {/* Text vycentrovaný na celé obrazovce */}
      <div
        aria-hidden={!showText}
        className="robot-animation robot-fade fixed bottom-0 left-0 right-0 w-full h-24 z-50 flex items-center justify-center pointer-events-none"
        style={{ opacity: showText ? 1 : 0 }}
      >
        <div className="text-white font-bold text-center" style={{
          fontSize: `${Math.max(1.2, 2 * 1.0)}rem`,
          wordBreak: 'keep-all',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          {currentMessage}
        </div>
      </div>

      {/* Robot */}
      <div
        aria-hidden={isHidden}
        className={`robot-animation robot-sprite fixed z-[9999] pointer-events-none ${PHASE_CLASS[robotPhase]}`}
      >
        <img
          src={imageSrc}
          // Prázdný alt: kdyby se obrázek načítal pomalu, nechceme místo
          // robota vidět text „Robot autumn“ a ikonku obrázku.
          alt=""
          decoding="async"
          className={`robot-image w-auto object-contain ${facingRight ? 'robot-image-flipped' : ''}`}
          style={{ height: '16rem' }}
          onError={() => {
            if (!imageFailed) setImageFailed(true);
          }}
        />
      </div>
    </>
  );
};

export const DailyRobot = memo(DailyRobotComponent);
