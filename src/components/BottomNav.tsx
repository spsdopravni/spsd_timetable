import { useNavigate, useLocation } from "react-router-dom";
import { Train, Map, Settings } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}

const items: NavItem[] = [
  {
    to: "/m",
    label: "Odjezdy",
    icon: <Train className="w-[18px] h-[18px]" />,
    match: (p) => p === "/m" || p.startsWith("/m/") && !p.startsWith("/m/map") && !p.startsWith("/m/profile"),
  },
  {
    to: "/m/map",
    label: "Mapa",
    icon: <Map className="w-[18px] h-[18px]" />,
    match: (p) => p.startsWith("/m/map"),
  },
  {
    to: "/m/profile",
    label: "Nastavení",
    icon: <Settings className="w-[18px] h-[18px]" />,
    match: (p) => p.startsWith("/m/profile"),
  },
];

/**
 * Sticky bottom navigation pro mobilní stránky. Instagram-style 3 záložky.
 * Respektuje safe-area-inset-bottom (iPhone home indicator).
 */
export function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[150] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch max-w-md mx-auto">
        {items.map((it) => {
          const active = it.match(loc.pathname);
          return (
            <button
              key={it.to}
              onClick={() => nav(it.to)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 active:text-gray-700"
              }`}
            >
              {it.icon}
              <span className="text-[9px] font-semibold leading-none">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
