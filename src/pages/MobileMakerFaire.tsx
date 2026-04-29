import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Maker Faire Prague — Výstaviště",
  enableLiveWalkTime: true,
  stations: [
    { key: "vystavisteA", name: "Výstaviště", direction: "Nástupiště A", simpleName: "Výstaviště", walkMinutes: 2 },
    { key: "vystavisteB", name: "Výstaviště", direction: "Nástupiště B", simpleName: "Výstaviště", walkMinutes: 2 },
    { key: "vystavisteVlak", name: "Praha-Výstaviště", direction: "Praha-Výstaviště", simpleName: "Praha-Výstaviště", walkMinutes: 3 },
    { key: "prahaBubny", name: "Praha-Bubny", direction: "Praha-Bubny", simpleName: "Praha-Bubny", walkMinutes: 5 },
  ],
  metro: [
    { stationKey: "vltavskaMetro", name: "Vltavská", line: "C" },
    { stationKey: "holesoviceMetro", name: "Nádraží Holešovice", line: "C" },
  ],
  theme: {
    headerBg: "#1a1a1a",
    headerOverlay: "bg-transparent",
    accentColor: "#F03553",
    tabBorder: "border-[#F03553]",
    tabActive: "text-gray-900",
    dotActive: "bg-[#F03553]",
    logoSrc: "/pictures/makerfaire-logo.svg",
    dateColor: "text-[#F03553]",
  },
};

const MobileMakerFaire = () => <MobileDepartures building={BUILDING} />;
export default MobileMakerFaire;
