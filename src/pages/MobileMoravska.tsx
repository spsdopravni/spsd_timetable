import { MobileDepartures, type MobileBuildingDef } from "@/components/MobileDepartures";

const BUILDING: MobileBuildingDef = {
  title: "Budova Moravská",
  stations: [
    { key: "janaMasarykaA", name: "Jana Masaryka", direction: "Karlovo nám. (metro B)", simpleName: "Jana Masaryka", walkMinutes: 2 },
    { key: "janaMasarykaB", name: "Jana Masaryka", direction: "Kubánské nám.", simpleName: "Jana Masaryka", walkMinutes: 2 },
    { key: "sumavskaA", name: "Šumavská", direction: "I. P. Pavlova (metro C)", simpleName: "Šumavská", walkMinutes: 4 },
    { key: "sumavskaB", name: "Šumavská", direction: "Želivského (metro A)", simpleName: "Šumavská", walkMinutes: 4 },
  ],
};

const MobileMoravska = () => <MobileDepartures building={BUILDING} />;
export default MobileMoravska;
