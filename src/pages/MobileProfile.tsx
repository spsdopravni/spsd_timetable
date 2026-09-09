import { useEffect, useState } from "react";
import { Sun, Moon, MonitorSmartphone, Bell, BellOff, ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useDarkMode } from "@/utils/useDarkMode";

const MobileProfile = () => {
  const { pref, setPref, isDark } = useDarkMode();
  const [notifPerm, setNotifPerm] = useState<string>("unsupported");

  useEffect(() => {
    if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:text-gray-100"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 52px)" }}
    >
      <div
        className="px-5 pt-12 pb-8 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Nastavení</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nastavení appky a notifikací</div>
      </div>

      {/* Vzhled */}
      <section className="px-4 mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 px-1">
          Vzhled
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          {[
            { value: "light" as const, label: "Světlý", icon: <Sun className="w-4 h-4" /> },
            { value: "dark" as const, label: "Tmavý", icon: <Moon className="w-4 h-4" /> },
            { value: "auto" as const, label: "Podle systému", icon: <MonitorSmartphone className="w-4 h-4" /> },
          ].map((opt) => {
            const active = pref === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPref(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 ${
                  active ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {active && <span className="w-2 h-2 rounded-full bg-blue-600" />}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 px-1">
          {isDark ? "Tmavý režim aktivní." : "Světlý režim aktivní."}
        </div>
      </section>

      {/* Notifikace */}
      <section className="px-4 mt-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 px-1">
          Notifikace
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifPerm === "granted" ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div className="font-semibold text-sm">Push notifikace</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {notifPerm === "granted"
                    ? "Povoleny"
                    : notifPerm === "denied"
                    ? "Zablokovány v prohlížeči"
                    : "Nepovoleny"}
                </div>
              </div>
            </div>
            {notifPerm !== "granted" && (
              <button
                onClick={async () => {
                  if (typeof Notification === "undefined") return;
                  const p = await Notification.requestPermission();
                  setNotifPerm(p);
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                Povolit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* O appce */}
      <section className="px-4 mt-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 px-1">
          O aplikaci
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <a
            href="https://github.com/anthropics/claude-code/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700"
          >
            <span>Hlásit chybu</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="https://sps-dopravni.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700"
          >
            <span>SPŠ Dopravní</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </section>

      {/* Credit */}
      <div className="mt-8 px-4 text-center text-[11px] text-gray-500 dark:text-gray-400">
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

      <BottomNav />
    </div>
  );
};

export default MobileProfile;
