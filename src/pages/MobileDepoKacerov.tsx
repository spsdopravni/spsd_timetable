import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Den otevřených dveří — Depo Kačerov",
  enableLiveWalkTime: true,
  stations: [
    { key: "depoKacerovMetroOut", name: "Depo Kačerov", direction: "🚇 Metro C → Nádraží Holešovice", simpleName: "Metro C (z depa)", walkMinutes: 1 },
    { key: "depoKacerovBusA", name: "Depo Kačerov", direction: "Nástupiště A — 118, 138, 170", simpleName: "Depo Kačerov", walkMinutes: 1 },
    { key: "depoKacerovBusB", name: "Depo Kačerov", direction: "Nástupiště B — 118, 138, 170", simpleName: "Depo Kačerov", walkMinutes: 1 },
  ],
  theme: {
    headerBg: "#1a1a1a",
    headerOverlay: "bg-transparent",
    accentColor: "#E20613",
    tabBorder: "border-[#E20613]",
    tabActive: "text-white",
    dotActive: "bg-[#E20613]",
    logoSrc: "/pictures/dpp-logo.svg",
    dateColor: "text-[#E20613]",
  },
};

const MobileDepoKacerov = () => <MobileDepartures building={BUILDING} />;
export default MobileDepoKacerov;
