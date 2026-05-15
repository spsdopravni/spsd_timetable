import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Autobusový den PID — Vozovna Motol",
  enableLiveWalkTime: true,
  stations: [
    { key: "pid3VozovnaMotol", name: "PID3", direction: "Vozovna Motol → Letenská", simpleName: "Linka PID3", walkMinutes: 1 },
    { key: "vozovnaCentrum", name: "Vozovna Motol", direction: "Centrum", simpleName: "Vozovna Motol", walkMinutes: 1 },
    { key: "vozovnaRepy", name: "Vozovna Motol", direction: "Řepy", simpleName: "Vozovna Motol", walkMinutes: 1 },
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

const MobileVozovnaMotolPidDay = () => <MobileDepartures building={BUILDING} />;
export default MobileVozovnaMotolPidDay;
