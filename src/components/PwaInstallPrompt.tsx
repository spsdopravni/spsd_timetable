import { useEffect, useState } from "react";
import { Share, Plus, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 14; // Po dismissu se 2 týdny neptáme znovu.

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function shouldShowAgain(): boolean {
  try {
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (!dismissedAt) return true;
    const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / 86400000;
    return daysSince > DISMISS_DAYS;
  } catch {
    return true;
  }
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    if (isStandalone()) return;
    if (!shouldShowAgain()) return;
    if (p === "desktop") return; // Banner jen na mobilu.

    // Android Chrome → beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS — žádný event, ale ukážeme manuální instrukce po 5s.
    let iosTimer: number | undefined;
    if (p === "ios") {
      iosTimer = window.setTimeout(() => setVisible(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, Date.now().toString()); } catch {}
  };

  const triggerInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") setVisible(false);
    else dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[300] p-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
      <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl border border-blue-400/40 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="rounded-xl bg-white/15 backdrop-blur p-2 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight">Přidej si appku na plochu</div>
            {platform === "ios" ? (
              <div className="mt-1.5 text-xs leading-relaxed text-blue-100">
                Klepni na <Share className="w-3.5 h-3.5 inline -mt-0.5" /> Sdílet, pak <Plus className="w-3.5 h-3.5 inline -mt-0.5" /> "Přidat na plochu". Notifikace pak dorazí i bez otevřené appky.
              </div>
            ) : (
              <div className="mt-1.5 text-xs leading-relaxed text-blue-100">
                Rychlejší přístup z plochy a notifikace o příjezdech i když je app zavřená.
              </div>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-blue-200 active:text-white p-1 -mt-1 -mr-1 flex-shrink-0"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {platform === "android" && installEvent && (
          <button
            onClick={triggerInstall}
            className="w-full bg-white/15 backdrop-blur active:bg-white/25 py-2.5 text-sm font-bold border-t border-white/15"
          >
            Nainstalovat
          </button>
        )}
      </div>
    </div>
  );
}
