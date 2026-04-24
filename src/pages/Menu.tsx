import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Building {
  name: string;
  address: string;
  stops: string[];
  route: string;
  available: boolean;
}

const BUILDINGS: Building[] = [
  {
    name: "Budova Motol",
    address: "Motolská 3, Praha 5",
    stops: ["Vozovna Motol", "Motol (metro A, B)"],
    route: "/spsmotol",
    available: true,
  },
  {
    name: "Budova Košíře",
    address: "Křížová 1, Praha 5",
    stops: ["Košíře"],
    route: "/kosire",
    available: false,
  },
  {
    name: "Budova Moravská",
    address: "Moravská 3, Praha 2",
    stops: ["Jana Masaryka", "Šumavská", "Náměstí Míru (metro A)"],
    route: "/spsmoravska",
    available: true,
  },
];

const SPECIAL_EVENTS = [
  { key: "bikefest", label: "Prague Bike Fest 2026", icon: "fa-solid fa-bicycle", route: "/bikefest", available: true },
  { key: "pragensis", label: "Škola Pragensis", icon: "fa-solid fa-star", route: "/pragensis", available: false },
];

const Menu = () => {
  const navigate = useNavigate();
  const [ostatniOpen, setOstatniOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <button
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Zpět
        </button>
        <img
          src="/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png"
          alt="SPŠD"
          className="h-10 object-contain"
        />
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2 text-center">
            Výběr tabule
          </p>
          <h1 className="text-3xl font-black text-white text-center mb-10">
            Kde se nacházíte?
          </h1>

          {/* Budovy */}
          <div className="space-y-3 mb-4">
            {BUILDINGS.map((b, idx) => (
              <button
                key={idx}
                onClick={() => b.available && navigate(b.route)}
                disabled={!b.available}
                className={`w-full text-left rounded-2xl border p-5 transition-all group
                  ${b.available
                    ? "border-white/15 hover:border-blue-500 hover:bg-white/5 cursor-pointer"
                    : "border-white/5 opacity-40 cursor-not-allowed"
                  }`}
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                      ${b.available ? "bg-blue-600/30 group-hover:bg-blue-600/50" : "bg-white/5"} transition-colors`}>
                      <i className="fa-solid fa-building text-blue-400 text-lg"></i>
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg leading-tight">{b.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                        <i className="fa-solid fa-location-dot text-[10px]"></i>
                        {b.address}
                      </div>
                      {b.stops.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {b.stops.map((s, i) => (
                            <span key={i} className="text-[11px] border border-white/10 text-gray-400 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                              <i className="fa-solid fa-train-tram text-[9px] mr-1"></i>{s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {b.available
                      ? <i className="fa-solid fa-chevron-right text-blue-400 group-hover:translate-x-1 transition-transform"></i>
                      : <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">Brzy</span>
                    }
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Ostatní */}
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            <button
              onClick={() => setOstatniOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <i className="fa-solid fa-ellipsis text-gray-400"></i>
                </div>
                <span className="font-semibold text-white">Ostatní</span>
              </div>
              <i className={`fa-solid fa-chevron-down text-gray-500 transition-transform ${ostatniOpen ? "rotate-180" : ""}`}></i>
            </button>

            {ostatniOpen && (
              <div className="border-t border-white/10 px-4 py-3 space-y-2">
                <p className="text-gray-600 text-xs uppercase tracking-widest px-1 mb-2">Akce</p>
                {SPECIAL_EVENTS.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => e.available && navigate(e.route)}
                    disabled={!e.available}
                    className={`w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 transition-colors
                      ${e.available
                        ? "hover:bg-white/5 cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                      <i className={`${e.icon} text-yellow-400 text-sm`}></i>
                    </div>
                    <span className="text-white font-medium text-sm">{e.label}</span>
                    {!e.available && <span className="ml-auto text-[10px] text-gray-600 font-semibold uppercase tracking-wide">Brzy</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Credit footer */}
      <div className="text-center text-[11px] text-gray-600 pb-6 px-4">
        Created and designed by{" "}
        <a
          href="https://brozovec.eu"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gray-400 hover:text-blue-400 transition-colors"
        >
          Adam &quot;Brozovec&quot; Brož
        </a>
      </div>

    </div>
  );
};

export default Menu;
