import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Bikefest — Výstaviště",
  stations: [
    { key: "vystavisteA", name: "Výstaviště", direction: "Nástupiště A", simpleName: "Výstaviště", walkMinutes: 2 },
    { key: "vystavisteB", name: "Výstaviště", direction: "Nástupiště B", simpleName: "Výstaviště", walkMinutes: 2 },
    { key: "vystavisteVlak", name: "Praha-Výstaviště", direction: "Vlak", simpleName: "Praha-Výstaviště", walkMinutes: 3 },
    { key: "prahaBubny", name: "Praha-Bubny", direction: "Vlak", simpleName: "Praha-Bubny", walkMinutes: 5 },
  ],
  metro: [
    { stationKey: "vltavskaMetro", name: "Vltavská", line: "C" },
    { stationKey: "holesoviceMetro", name: "Nádraží Holešovice", line: "C" },
  ],
  theme: {
    headerBg: "#1a1a1a",
    headerOverlay: "bg-transparent",
    accentColor: "#FDD835",
    tabBorder: "border-[#FDD835]",
    tabActive: "text-gray-900",
    dotActive: "bg-[#FDD835]",
    logoSrc: "/pictures/bikefest-logo.svg",
    dateColor: "text-[#FDD835]",
  },
};

const MobileBikefest = () => <MobileDepartures building={BUILDING} />;
export default MobileBikefest;
