import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Budova Motol",
  stations: [
    { key: "vozovnaCentrum", name: "Vozovna Motol", direction: "Centrum", simpleName: "Vozovna Motol", walkMinutes: 1 },
    { key: "vozovnaRepy", name: "Vozovna Motol", direction: "Řepy", simpleName: "Vozovna Motol", walkMinutes: 1 },
    { key: "motolZlicin", name: "Motol", direction: "Zličín (metro B)", simpleName: "Motol", walkMinutes: 4 },
    { key: "motolNemocnice", name: "Motol", direction: "Nem. Motol (metro A)", simpleName: "Motol", walkMinutes: 4 },
  ],
};

const MobileMotol = () => <MobileDepartures building={BUILDING} />;
export default MobileMotol;
