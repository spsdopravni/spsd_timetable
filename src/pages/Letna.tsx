import { useEffect } from "react";
import { TramDeparturesConnected } from "@/components/TramDeparturesConnected";
import { DailyRobot } from "@/components/DailyRobot";
import { Snowfall } from "@/components/Snowfall";
import { ChristmasGarland } from "@/components/ChristmasGarland";
import { useSeasonal, useTime } from "@/context/DataContext";

const ACCENT = "#dc301b"; // PID červená

const Letna = () => {
  const time = useTime();
  const { seasonalTheme } = useSeasonal();

  useEffect(() => {
    document.body.classList.add('tram-display');
    return () => document.body.classList.remove('tram-display');
  }, []);

  const currentTime = time.currentTime;

  return (
    <>
      <div className="flex flex-col overflow-hidden h-screen relative" style={{ background: '#fafafa' }}>
        {/* Header */}
        <div className="text-white shadow-lg relative" style={{ background: '#1a1a1a', height: '13.5vh', minHeight: '112px' }}>
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: ACCENT }} />
          <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: ACCENT }} />

          <div className="px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 relative z-10 h-full">
            {/* Absolutně centrovaný titulek — vždy uprostřed šířky tabule */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
              <h1 className="font-black leading-tight tracking-tight text-center" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.75rem)' }}>
                Speciální linky
              </h1>
            </div>

            {/* Loga vlevo + čas vpravo */}
            <div className="relative flex items-center justify-between h-full gap-4">
              <div className="flex items-center gap-5">
                <img
                  src="/pictures/pid-logo.png"
                  alt="PID — Pražská integrovaná doprava"
                  className="object-contain h-10 sm:h-14 lg:h-16"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.outerHTML = '<span style="color:#dc301b;font-weight:900;font-size:1.6rem;letter-spacing:0.05em">PID</span>';
                  }}
                />
                <div className="hidden sm:block h-12 w-0.5 bg-white/30 rounded-full" />
                <img src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png" alt="SPŠD" className="hidden sm:block object-contain h-10 lg:h-14" />
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="font-bold text-6xl lg:text-7xl leading-none">{currentTime.toLocaleTimeString('cs-CZ')}</div>
                <div className="text-2xl lg:text-3xl leading-none" style={{ color: ACCENT }}>
                  {currentTime.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>

          <ChristmasGarland />
        </div>

        {/* Odjezdy z Letenské pláně — 2 sloupce: PID 1–4 | PID 5–8 */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div className="text-white px-3 shadow-lg flex items-center justify-center rounded-lg" style={{ background: ACCENT, height: '6vh', minHeight: '70px', maxHeight: '90px' }}>
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <i className="fa-solid fa-bus text-white text-xl"></i>
                <h2 className="font-black leading-none text-white" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>Nejbližší odjezdy</h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected stationKey="piddayLetenskaA" maxItems={7} showTimesInMinutes={true} stationName="Letenská pláň" disableAnimations={false} />
            </div>
          </div>

          <div className="hidden lg:block w-1" style={{ background: ACCENT }} />

          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div className="text-white px-3 shadow-lg flex items-center justify-center rounded-lg" style={{ background: ACCENT, height: '6vh', minHeight: '70px', maxHeight: '90px' }}>
              <div className="flex items-center justify-center gap-3 w-full h-full">
                <i className="fa-solid fa-bus text-white text-xl"></i>
                <h2 className="font-black leading-none text-white" style={{ fontSize: 'clamp(1.75rem, 3.5vh, 2.5rem)' }}>Další odjezdy do 30 min</h2>
              </div>
            </div>
            <div className="flex-1">
              <TramDeparturesConnected stationKey="piddayLetenskaB" maxItems={7} showTimesInMinutes={true} stationName="Letenská pláň" disableAnimations={false} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-bus text-xl" style={{ color: ACCENT }}></i>
            <span className="font-bold text-white text-sm">Autobusový den PID · Letenská pláň · 16. 5. 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">pid.cz</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">Střední průmyslová škola dopravní, a.s.</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <DailyRobot barColor="#1a1a1a" robotImage="/pictures/pidday.png" customMessages={[
          "Vítejte na Autobusovém dni PID 2026!",
          "Den PID · Letenská pláň · sobota 16. května 2026 · 10:00–17:00",
          "Jezdí 8 speciálních linek (1–8) s historickými i moderními autobusy",
          "Jízdy speciálními linkami jsou ZDARMA — místenky bezplatně na zastávce",
          "Místenky vydáváme 60 minut před odjezdem u nástupní zastávky",
          "Bez místenky pojedete také běžnou linkou 7 a historickou tramvají 43",
          "Odjezdová tabule od Střední průmyslové školy dopravní · sps-dopravni.cz",
          "#studujSPSD · Střední průmyslová škola dopravní",
          "#pracujvDPP · Dopravní podnik hlavního města Prahy",
          "Statická výstava autobusů PID — přijďte si je prohlédnout zblízka!",
          "PID přepraví ročně přes 1,3 miliardy cestujících",
          "pid.cz · Pražská integrovaná doprava",
          "Sledujte nás na Instagramu @spsdopravni",
        ]} />
      </div>

      {seasonalTheme.showSnowfall && <Snowfall />}
    </>
  );
};

export default Letna;
