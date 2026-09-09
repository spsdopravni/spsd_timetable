import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Autobusový den PID — Letenská pláň",
  enableLiveWalkTime: true,
  stations: [
    { key: "pid3Letna", name: "PID3", direction: "Letenská pláň → Motol (okruh)", simpleName: "Linka PID3", walkMinutes: 1 },
  ],
  theme: {
    headerBg: "#1a1a1a",
    headerOverlay: "bg-transparent",
    accentColor: "#dc301b",
    tabBorder: "border-[#dc301b]",
    tabActive: "text-gray-900",
    dotActive: "bg-[#dc301b]",
    logoSrc: "/pictures/pid-logo.png",
    dateColor: "text-[#dc301b]",
  },
};

const MobileLetna = () => <MobileDepartures building={BUILDING} />;
export default MobileLetna;
