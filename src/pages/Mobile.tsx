import { useNavigate } from "react-router-dom";
import { useDataContext } from "@/context/DataContext";

const BUILDINGS = [
  { name: "Budova Motol", route: "/m/motol", stops: ["Vozovna Motol", "Motol (metro A, B)"] },
  { name: "Budova Moravská", route: "/m/moravska", stops: ["Jana Masaryka", "Šumavská"] },
  { name: "Maker Faire Prague", route: "/m/makerfaire", stops: ["Výstaviště", "Praha-Bubny"] },
];

const Mobile = () => {
  const navigate = useNavigate();
  const { seasonalTheme, time } = useDataContext();
  const currentTime = time.currentTime;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>

      {/* Header */}
      <div
        className="text-white shadow-lg relative"
        style={{
          backgroundImage: "url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')",
          backgroundSize: "auto", backgroundPosition: "center", backgroundRepeat: "repeat",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/85" />
        <div
          className="relative z-10 px-5 pb-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <img src={seasonalTheme.logoPath} alt="SPŠD" className="h-12 object-contain" />
            <div className="text-right">
              <div className="text-3xl font-bold leading-none">
                {currentTime.toLocaleTimeString("cs-CZ")}
              </div>
              <div className="text-sm text-blue-200 mt-1">
                {currentTime.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Building selection */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <p className="text-blue-500 text-xs font-semibold uppercase tracking-widest mb-2">Odjezdy</p>
        <h1 className="text-2xl font-black text-gray-900 mb-6">Kde se nacházíte?</h1>

        <div className="w-full max-w-md space-y-3">
          {BUILDINGS.map((b) => (
            <button
              key={b.route}
              onClick={() => navigate(b.route)}
              className="w-full text-left rounded-2xl border-2 border-gray-200 bg-white p-5 active:bg-blue-50 active:border-blue-400 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{b.name}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {b.stops.map((s, i) => (
                      <span key={i} className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full bg-gray-50">
                        <i className="fa-solid fa-train-tram text-[9px] mr-1"></i>{s}
                      </span>
                    ))}
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-blue-400 text-lg"></i>
              </div>
            </button>
          ))}
        </div>

        {/* Credit */}
        <div className="mt-8 text-center text-[11px] text-gray-500 dark:text-gray-400">
          Created and designed by{" "}
          <a
            href="https://brozovec.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 dark:text-blue-400 active:text-blue-700"
          >
            Adam &quot;Brozovec&quot; Brož
          </a>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
