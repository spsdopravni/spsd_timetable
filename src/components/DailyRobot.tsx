import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const DailyRobot = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [robotPhase, setRobotPhase] = useState('hidden'); // 'hidden', 'movingLeft', 'atLeft', 'movingRight', 'atRight', 'movingAway'
  const [showBackground, setShowBackground] = useState(false);
  const [showText, setShowText] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getDayName = () => {
    const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    return days[new Date().getDay()];
  };

  const getRobotTheme = () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    // Halloween téma (20. října - 1. listopadu)
    if ((month === 10 && day >= 20) || (month === 11 && day <= 1)) {
      return {
        image: '/pictures/robot-halloween.png',
        theme: 'halloween'
      };
    }

    // Vánoční téma (1. prosince - 31. prosince)
    if (month === 12) {
      return {
        image: '/pictures/robot-christmas.png',
        theme: 'christmas'
      };
    }

    // Silvestr a Nový rok (31.12 - 2.1)
    if ((month === 12 && day === 31) || (month === 1 && day <= 2)) {
      return {
        image: '/pictures/robot-newyear.png',
        theme: 'newyear'
      };
    }

    // Velikonoce (pohyblivý svátek - přibližně březen/duben)
    // Zjednodušená detekce: kolem velikonoc v dubnu
    if (month === 4 && day >= 10 && day <= 20) {
      return {
        image: '/pictures/robot-easter.png',
        theme: 'easter'
      };
    }

    // Jarní téma (1. března - 31. května)
    if (month >= 3 && month <= 5) {
      return {
        image: '/pictures/robot-spring.png',
        theme: 'spring'
      };
    }

    // Letní téma (1. června - 31. srpna)
    if (month >= 6 && month <= 8) {
      return {
        image: '/pictures/robot-summer.png',
        theme: 'summer'
      };
    }

    // Podzimní téma (1. září - 19. října)
    if (month === 9 || (month === 10 && day < 20)) {
      return {
        image: '/pictures/robot-autumn.png',
        theme: 'autumn'
      };
    }

    // Zimní téma (1. ledna - 28. února)
    if (month === 1 && day > 2 || month === 2) {
      return {
        image: '/pictures/robot-winter.png',
        theme: 'winter'
      };
    }

    // Výchozí klasický robot
    return {
      image: '/pictures/robotz.png',
      theme: 'classic'
    };
  };

  const getNameDayInfo = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Rozšířený český kalendář svátků
    const nameDays: {[key: string]: string} = {
      // Leden
      '1-1': 'Nový rok',
      '1-2': 'Karina',
      '1-3': 'Radmila',
      '1-4': 'Diana',
      '1-5': 'Dalimil',
      '1-6': 'Tři králové',
      '1-7': 'Vilma',
      '1-8': 'Čestmír',
      '1-9': 'Vladan',
      '1-10': 'Brřetislav',
      '1-11': 'Bohdana',
      '1-12': 'Pravoslav',
      '1-13': 'Edita',
      '1-14': 'Radovan',
      '1-15': 'Alice',
      '1-16': 'Ctirad',
      '1-17': 'Drahoslav',
      '1-18': 'Vladislav',
      '1-19': 'Dušan',
      '1-20': 'Ilona',
      '1-21': 'Bohumila',
      '1-22': 'Slavomír',
      '1-23': 'Zdeněk',
      '1-24': 'Milena',
      '1-25': 'Miloš',
      '1-26': 'Zora',
      '1-27': 'Ingřid',
      '1-28': 'Otík',
      '1-29': 'Zdislava',
      '1-30': 'Robin',
      '1-31': 'Marika',
      // Únor
      '2-1': 'Hynek',
      '2-2': 'Nela',
      '2-3': 'Blažej',
      '2-4': 'Jarmila',
      '2-5': 'Dobromila',
      '2-6': 'Vanda',
      '2-7': 'Věra',
      '2-8': 'Milada',
      '2-9': 'Apolena',
      '2-10': 'Mojmír',
      '2-11': 'Božena',
      '2-12': 'Slavěna',
      '2-13': 'Věnceźr',
      '2-14': 'Valentýn',
      '2-15': 'Jiviča',
      '2-16': 'Juliána',
      '2-17': 'Miloslava',
      '2-18': 'Gizela',
      '2-19': 'Patrik',
      '2-20': 'Oldřich',
      '2-21': 'Lenka',
      '2-22': 'Petr',
      '2-23': 'Svatopluk',
      '2-24': 'Matěj',
      '2-25': 'František',
      '2-26': 'Dorota',
      '2-27': 'Alexandr',
      '2-28': 'Lumiška',
      '2-29': 'Zlatislav',
      // Březen
      '3-1': 'Bedřich',
      '3-2': 'Anežka',
      '3-3': 'Kamil',
      '3-4': 'Stela',
      '3-5': 'Kazimír',
      '3-6': 'Miroslav',
      '3-7': 'Tomáš',
      '3-8': 'Gabriela',
      '3-9': 'Františka',
      '3-10': 'Viktorie',
      '3-11': 'Anděla',
      '3-12': 'Řehoř',
      '3-13': 'Růžena',
      '3-14': 'Matyáš',
      '3-15': 'Ida',
      '3-16': 'Elena a Herbert',
      '3-17': 'Vlastimil',
      '3-18': 'Eduard',
      '3-19': 'Josef',
      '3-20': 'Václav',
      '3-21': 'Benedikt',
      '3-22': 'Leona',
      '3-23': 'Ivona',
      '3-24': 'Gabriel',
      '3-25': 'Marián',
      '3-26': 'Emanuel',
      '3-27': 'Dita',
      '3-28': 'Soňa',
      '3-29': 'Tamaras',
      '3-30': 'Arnošt',
      '3-31': 'Kvido',
      // Duben
      '4-1': 'Hugo',
      '4-2': 'Erika',
      '4-3': 'Richard',
      '4-4': 'Ivana',
      '4-5': 'Miroslava',
      '4-6': 'Vendula',
      '4-7': 'Herman a Heřman',
      '4-8': 'Ema',
      '4-9': 'Dušana',
      '4-10': 'Darja',
      '4-11': 'Izabela',
      '4-12': 'Julius',
      '4-13': 'Aleš',
      '4-14': 'Vincenc',
      '4-15': 'Anastázie',
      '4-16': 'Irena',
      '4-17': 'Rudolf',
      '4-18': 'Valerie',
      '4-19': 'Rostislav',
      '4-20': 'Marcela',
      '4-21': 'Alexandra',
      '4-22': 'Evženie',
      '4-23': 'Vojtěch',
      '4-24': 'Jiří',
      '4-25': 'Marek',
      '4-26': 'Oto',
      '4-27': 'Jaroslav',
      '4-28': 'Vlastislav',
      '4-29': 'Robert',
      '4-30': 'Blahoslav',
      // Květen
      '5-1': 'Svátek práce',
      '5-2': 'Zikmund',
      '5-3': 'Alexej',
      '5-4': 'Květoslav',
      '5-5': 'Klaudie',
      '5-6': 'Radoslav',
      '5-7': 'Stanislav',
      '5-8': 'Den vítězství',
      '5-9': 'Ctibor',
      '5-10': 'Blažena',
      '5-11': 'Svatava',
      '5-12': 'Pankrác',
      '5-13': 'Servác',
      '5-14': 'Bonifác',
      '5-15': 'Žofie',
      '5-16': 'Přemysl',
      '5-17': 'Aneta',
      '5-18': 'Nataša',
      '5-19': 'Ivo',
      '5-20': 'Zbyšek',
      '5-21': 'Monika',
      '5-22': 'Emil',
      '5-23': 'Vladimír',
      '5-24': 'Jana',
      '5-25': 'Viola',
      '5-26': 'Filip',
      '5-27': 'Valdemar',
      '5-28': 'Vilém',
      '5-29': 'Maxmilián',
      '5-30': 'Ferdinand',
      '5-31': 'Kamila',
      // Červen
      '6-1': 'Laura',
      '6-2': 'Erasmus',
      '6-3': 'Klotylda',
      '6-4': 'Kryštof',
      '6-5': 'Dobroslav',
      '6-6': 'Norbert',
      '6-7': 'Iveta',
      '6-8': 'Medard',
      '6-9': 'Stanislava',
      '6-10': 'Margita',
      '6-11': 'Barnabáš',
      '6-12': 'Tereza',
      '6-13': 'Antonín',
      '6-14': 'Roland',
      '6-15': 'Vít',
      '6-16': 'Zbyněk',
      '6-17': 'Adolf',
      '6-18': 'Milan',
      '6-19': 'Leoš',
      '6-20': 'Vikto',
      '6-21': 'Alois',
      '6-22': 'Pavla',
      '6-23': 'Zdeňka',
      '6-24': 'Jan',
      '6-25': 'Ivan',
      '6-26': 'Adriana',
      '6-27': 'Ladislav',
      '6-28': 'Lubomír',
      '6-29': 'Petr a Pavel',
      '6-30': 'Šárka',
      // Červenec
      '7-1': 'Jaroslava',
      '7-2': 'Patricie',
      '7-3': 'Radomír',
      '7-4': 'Prokop',
      '7-5': 'Cyril a Metoděj',
      '7-6': 'Jan Hus',
      '7-7': 'Bohuslava',
      '7-8': 'Nora',
      '7-9': 'Drahoslava',
      '7-10': 'Libuše a Amálie',
      '7-11': 'Olga',
      '7-12': 'Bořek',
      '7-13': 'Margita',
      '7-14': 'Karolína',
      '7-15': 'Jindřich',
      '7-16': 'Luboš',
      '7-17': 'Martina',
      '7-18': 'Drahomíra',
      '7-19': 'Čeněk',
      '7-20': 'Ilja',
      '7-21': 'Viktorie',
      '7-22': 'Magdaléna',
      '7-23': 'Libor',
      '7-24': 'Kristýna',
      '7-25': 'Jakub',
      '7-26': 'Anna',
      '7-27': 'Věroslav',
      '7-28': 'Viktor',
      '7-29': 'Marta',
      '7-30': 'Bořivoj',
      '7-31': 'Ignác',
      // Srpen
      '8-1': 'Oskar',
      '8-2': 'Gustav',
      '8-3': 'Miluše',
      '8-4': 'Dominik',
      '8-5': 'Kristián',
      '8-6': 'Oldřiška',
      '8-7': 'Lada',
      '8-8': 'Soběslav',
      '8-9': 'Roman',
      '8-10': 'Vavřinec',
      '8-11': 'Zuzana',
      '8-12': 'Klára',
      '8-13': 'Alena',
      '8-14': 'Alan',
      '8-15': 'Hana',
      '8-16': 'Jáchym',
      '8-17': 'Petra',
      '8-18': 'Helena',
      '8-19': 'Ludvík',
      '8-20': 'Bernard',
      '8-21': 'Johanna',
      '8-22': 'Bohuslav',
      '8-23': 'Sandra',
      '8-24': 'Bartoloměj',
      '8-25': 'Radim',
      '8-26': 'Luděk',
      '8-27': 'Otakar',
      '8-28': 'Augustýn',
      '8-29': 'Evelína',
      '8-30': 'Vladěna',
      '8-31': 'Pavlína',
      // Září
      '9-1': 'Linda a Samuel',
      '9-2': 'Adéla',
      '9-3': 'Bronislava',
      '9-4': 'Jindřiška',
      '9-5': 'Boris',
      '9-6': 'Boleslav',
      '9-7': 'Regína',
      '9-8': 'Marjánka',
      '9-9': 'Daniela',
      '9-10': 'Irma',
      '9-11': 'Denisa',
      '9-12': 'Marie',
      '9-13': 'Lubor',
      '9-14': 'Radka',
      '9-15': 'Jolana',
      '9-16': 'Ludmila',
      '9-17': 'Naděžda',
      '9-18': 'Kryštof',
      '9-19': 'Zita',
      '9-20': 'Oleg',
      '9-21': 'Matouš',
      '9-22': 'Darina',
      '9-23': 'Berta',
      '9-24': 'Jaromír',
      '9-25': 'Zlata',
      '9-26': 'Andrea',
      '9-27': 'Jonáš',
      '9-28': 'Václav',
      '9-29': 'Michal',
      '9-30': 'Jeroným',
      // Říjen
      '10-1': 'Igor',
      '10-2': 'Olivie a Oliver',
      '10-3': 'Bohumil',
      '10-4': 'František',
      '10-5': 'Eliška',
      '10-6': 'Hanuš',
      '10-7': 'Justýna',
      '10-8': 'Věra',
      '10-9': 'Štefan a Sára',
      '10-10': 'Marina',
      '10-11': 'Andrej',
      '10-12': 'Marcel',
      '10-13': 'Renáta',
      '10-14': 'Agáta',
      '10-15': 'Tereza',
      '10-16': 'Havel',
      '10-17': 'Hedvika',
      '10-18': 'Lukáš',
      '10-19': 'Michaela',
      '10-20': 'Vendelín',
      '10-21': 'Brigita',
      '10-22': 'Sabina',
      '10-23': 'Teodor',
      '10-24': 'Nina',
      '10-25': 'Beáta',
      '10-26': 'Erik',
      '10-27': 'Šarlota a Zoe',
      '10-28': 'Den vzniku Československa',
      '10-29': 'Silvie',
      '10-30': 'Tadeáš',
      '10-31': 'Štěpánka',
      // Listopad
      '11-1': 'Felix',
      '11-2': 'Památka zesnulých',
      '11-3': 'Hubert',
      '11-4': 'Karel',
      '11-5': 'Miriam',
      '11-6': 'Liběna',
      '11-7': 'Saskie',
      '11-8': 'Božena',
      '11-9': 'Teodor',
      '11-10': 'Evžen',
      '11-11': 'Martin',
      '11-12': 'Benedikt',
      '11-13': 'Tibor',
      '11-14': 'Sáva',
      '11-15': 'Leopold',
      '11-16': 'Otmar',
      '11-17': 'Den boje za svobodu',
      '11-18': 'Romana',
      '11-19': 'Alžběta',
      '11-20': 'Nikola',
      '11-21': 'Albert',
      '11-22': 'Cecílie',
      '11-23': 'Klement',
      '11-24': 'Emílie',
      '11-25': 'Kateřina',
      '11-26': 'Artur',
      '11-27': 'Xenie',
      '11-28': 'René',
      '11-29': 'Zina',
      '11-30': 'Ondřej',
      // Prosinec
      '12-1': 'Iva',
      '12-2': 'Blanka',
      '12-3': 'Svatoslav',
      '12-4': 'Barbora',
      '12-5': 'Jitka',
      '12-6': 'Mikuláš',
      '12-7': 'Ambrož',
      '12-8': 'Květoslava',
      '12-9': 'Vratislav',
      '12-10': 'Julie',
      '12-11': 'Dana',
      '12-12': 'Simona',
      '12-13': 'Lucie',
      '12-14': 'Lýdie',
      '12-15': 'Radana',
      '12-16': 'Albína',
      '12-17': 'Daniel',
      '12-18': 'Miloslav',
      '12-19': 'Ester',
      '12-20': 'Dagmar',
      '12-21': 'Natálie',
      '12-22': 'Šimon',
      '12-23': 'Vlasta',
      '12-24': 'Štědrý den',
      '12-25': 'Boží hod vánoční',
      '12-26': 'Štěpán',
      '12-27': 'Žaneta',
      '12-28': 'Bohumila',
      '12-29': 'Judita',
      '12-30': 'David',
      '12-31': 'Silvestr'
    };

    const key = `${month}-${day}`;
    return nameDays[key] || null;
  };

  const getFunFacts = () => {
    const facts = [
      "Linka 22 v Praze je nejdelší tramvajová trať - 28 km.",
      "Náměstí Míru je nejhlubší stanice metra v Evropě - 53 m.",
      "V ČR jezdí přes 900 tramvají současně.",
      "Lanovka na Petřín jezdí od roku 1891.",
      "RegioJet byla první soukromá železniční společnost v ČR.",
      "Pražské autobusy najezdí denně 400 000 km.",
      "Tramvaj T3 se vyráběla 40 let.",
      "Pendolino dosahuje rychlosti 200 km/h.",
      "Brno má nejstarší trolejbusy ve střední Evropě.",
      "Železniční síť v ČR má 9 400 km.",
      "Pražská MHD přepraví 1,2 miliardy lidí ročně.",
      "Nejkratší tramvajová trať v Liberci má 8,4 km.",
      "Tunel Březno je dlouhý 4 062 metrů.",
      "Karosa byla slavná česká značka autobusů.",
      "V ČR je přes 55 000 autobusových zastávek.",
      "Tramvaje v Praze jezdí od roku 1891.",
      "První elektřina v tramvaji byla 1901.",
      "Tatra T3 je nejprodávanější tramvaj světa.",
      "Pražské metro vzniklo v roce 1974.",
      "Nejstarší trať je České Budějovice-Linz z 1832.",
      "Autobusy SOR se vyrábějí v Libchavách.",
      "Nejstarší lanovka v Táboře od roku 1902.",
      "Hlavní nádraží se jmenovalo Kaiser Franz Josef.",
      "Škoda Transportation v Plzni od roku 1925.",
      "Leo Express má nejmodernější vlaky Flirt.",
      "Nejdelší most v Děčíně má 331 metrů.",
      "Trolejbusy v Praze jezdily 1936-1972.",
      "Nejstarší tramvaj je z roku 1886.",
      "Linka A vedla z Náměstí Míru do Sokolské.",
      "Nejrychlejší tramvaj jezdí 70 km/h.",
      "Ikarus byly oblíbené v 70.-80. letech.",
      "Česká železnice má 2 950 stanic.",
      "Pražský DP má přes 1 600 vozidel.",
      "Nejkratší autobusová linka má 2,1 km.",
      "Trať na Petřín má sklon 10%.",
      "První drezína jezdila v roce 1903.",
      "Nejdelší tunel je Malostranská-Hradčanská.",
      "ForCity Plus má klimatizaci a WiFi.",
      "Nejstarší nádraží na Florenci od 1960.",
      "Linka 9 v Praze má 33 km.",
      "Pendolino má naklápěcí skříně.",
      "VarioLF má 31 metrů.",
      "České dráhy mají 4 000 vozidel.",
      "Negrelliho viadukt je z roku 1850.",
      "Autobusy převezou 300 milionů lidí ročně.",
      "Brno má nejmodernější nádraží.",
      "Ostravské tramvaje jezdí do Polska.",
      "Japonský maglev jezdí 603 km/h.",
      "Švýcarské vlaky se zpozdí jen 3 minuty ročně.",
      "Tokyo metro převeze 40 milionů lidí denně.",
      "Melbourne má nejdelší tramvajovou síť.",
      "TGV dosáhl 574,8 km/h.",
      "New York má 472 stanic metra.",
      "Londýnské autobusy jezdí od 1956.",
      "Underground je nejstarší metro z 1863.",
      "ICE vlaky jezdí 300 km/h.",
      "Nejdelší autobusová linka má 6 200 km.",
      "Moskevské metro má nejkrásnější stanice.",
      "San Francisco má nejstrmější tramvaje.",
      "Čína má 40 000 km rychlých tratí.",
      "Mnichovské metro je automatické.",
      "Gotthard je nejdelší tunel - 57 km.",
      "Curitiba má rychlé autobusy.",
      "Norské vlaky jezdí za polární kruh.",
      "Dubaj má klimatizované stanice.",
      "Rotterdam má bezdrátové tramvaje.",
      "Singapur má nejmodernější metro.",
      "X2000 má naklápěcí technologii.",
      "Paříž má stanici každých 500 m.",
      "Bogota převeze 2,4 milionu lidí denně.",
      "Indická železnice má 1,3 milionu zaměstnanců.",
      "Barcelona má stanice od architektů.",
      "VIA Rail jezdí přes 4 000 km.",
      "Amsterdam má 200 km tramvají.",
      "Hongkong má 99,9% přesnost.",
      "Stanice Pankrác skrývá podzemní protiatomový kryt.",
"Linka A v metru měla být fialová.",
"Stanice Anděl má reliéf družby s Moskvou.",
"Nejprudší stoupání metra je u Vyšehradu.",
"Existuje nedokončená odbočka metra na Bohnice.",
"Při stavbě metra našli středověký most.",
"Prahou jezdí speciální mazací tramvaj.",
"V Praze jezdila v 90. letech pivní tramvaj.",
"Cinkání pražských tramvají je chráněná známka.",
"Lanovka na Petřín měla vodní pohon.",
"Negrelliho viadukt byl nejdelší most Evropy.",
"V Hlavním nádraží je císařský salonek.",
"Ozubnicová trať Tanvald-Harrachov má sklon 58‰.",
"V Mostě přesunuli kostel i s kolejemi.",
"Nejvyšší železniční most je u Orlíku.",
"Vlaky Railjet nemají klasickou lokomotivu.",
"První semafor v Praze byl v roce 1927.",
"Stanice Waterloo v Londýně je nejrušnější.",
"Moskevská okružní linka metra vznikla náhodou.",
"V metru v Pchjongjangu hraje propaganda.",
"Neapolské metro navrhovali slavní umělci.",
"V Dubaji jsou v metru vagony pro ženy.",
"V kodaňském metru nejsou odpadkové koše.",
"V Montrealu navrhl každou stanici jiný architekt.",
"Nejkratší metro světa je v italské Katánii.",
"Hongkongské metro má přesnost 99,9 %.",
"Na Taiwanu se v metru nesmí žvýkat.",
"Ze zavěšené dráhy v Německu spadl slon.",
"V Helsinkách jezdí v létě saunovací tramvaj.",
"New Orleans má nejstarší tramvajovou linku.",
"Na ostrově Man jezdí jediná koňka.",
"Nejdelší tramvajová linka světa je v Belgii.",
"V Bolívii slouží jako MHD síť lanovek.",
"V Lucembursku je veškerá MHD zdarma.",
"Japonský Maglev dosáhl rychlosti 603 km/h.",
"Šinkansen neměl za 50 let smrtelnou nehodu.",
"Čína má víc rychlotratí než zbytek světa.",
"Uvnitř Gotthardského tunelu je teplota 28°C.",
"Vlaky v Tibetu mají v oknech UV filtry.",
"Ledovcový expres je nejpomalejší rychlík světa.",
"V Indii jezdí speciální nemocniční vlak.",
"Transsibiřská magistrála protíná 8 časových pásem.",
"Norské vlaky jezdí za severní polární kruh.",
"Na Faerských ostrovech je podmořský kruhový objezd.",
"Na Gibraltaru křižuje silnici letištní ranvej.",
"Na ostrově Svatý Martin je pláž u ranveje.",
"Na skotském ostrově Barra přistávají na pláži.",
"Nejvýše položené letiště je v Tibetu.",
"Nejkratší komerční let trvá jen 90 sekund.",
"Letiště v Singapuru má vlastní vodopád.",
"Letiště v Mnichově má vlastní pivovar.",
"V ranveji v Savannah jsou zabudované hroby.",
"Nejdelší non-stop let trvá skoro 19 hodin.",
"Největší výletní loď je delší než Eiffelovka.",
"V Utrechtu je největší parkoviště pro kola.",
"V Zermattu jsou zakázána auta se spalovacím motorem.",
"V Japonsku existují silnice, které hrají.",
"V Malajsii je největší kruhový objezd světa.",
"V britském Swindonu je “magický” kruhový objezd.",
"Na Aljašce sdílí tunel auta a vlaky.",
"V zimě se v Rusku jezdí po řekách.",
"První pokutu za rychlost udělili v roce 1896.",
"V Saúdské Arábii mohou ženy řídit od 2018.",
"Brněnské Technické muzeum provozuje parní tramvaj.",
"V Praze testovali obří trolejbus Tatra T 401.",
"Nejdelší trolejbus Škoda jezdil v Hradci Králové.",
"Nákladní lanovka vede z lomu Mořina do Králova Dvora.",
"První auto v Rakousku-Uhersku byla Tatra Präsident.",
"Na Vltavě si lze půjčit šlapadla-labutě.",
"V ČR je přes 15 000 železničních přejezdů.",
"Česká republika má nejhustší síť turistických značek.",
"První tříbodový pás vynalezlo Volvo v roce 1959.",
"Na ostrově Sark jsou zcela zakázána auta.",
"V Amsterodamu ročně vyloví z kanálů 15 000 kol.",
"Na Filipínách jezdí barevné autobusy “Jeepney”.",
"V Hamburku je největší modelová železnice světa.",
"První auto na světě řídila žena.",
"Nejdelší dopravní zácpa na světě trvala 12 dní.",
"V Dubaji má policie flotilu supersportovních aut.",
"Letadlo Solar Impulse 2 obletělo Zemi bez paliva.",
"V Benátkách existují i policejní motorové čluny.",
"V Kanadě v zimě přistávají na ledových ranvejích.",
"V Thajsku jsou populární lodní taxi.",
"Největší letadlo světa, An-225, bylo zničeno.",
"V Japonsku existují lůžkové vlaky s kapslemi.",
"První semafor na světě (plynový) explodoval.",
"Nejdelší železniční most světa je v Číně.",
"Rusko provozuje flotilu atomových ledoborců.",
"V Peru má vlak vyhlídkový vagon s barem.",
"Ve finských vlacích jsou herny pro děti.",
"V USA jezdí turistické obojživelné autobusy.",
"V Austrálii jezdí extrémně dlouhé silniční vlaky.",
"Nejstrmější pozemní lanovka světa je ve Švýcarsku.",
"Na Madagaskaru se používají rikši “pousse-pousse”.",
"Na Maledivách je hlavním dopravním prostředkem hydroplán.",
"Největší přístav světa je v Šanghaji.",
"V Istanbulu spojuje metro Evropu a Asii.",
"Nejstarší metro v jižní polokouli je v Buenos Aires.",
"V Káhiře mají první a poslední vagon pro ženy.",
"Nejstarší auto na světě stále jezdí.",
"V Dánsku staví speciální dálnice pro cyklisty.",
"Vlak TGV má speciální vozy pro poštu.",
"Vlak Shiki-Shima v Japonsku je ultra luxusní.",
"V Indonésii se používají motocyklové taxi “ojek”.",
"Největší výrobce pneumatik na světě je Lego.",
"Na Islandu nejsou žádné veřejné železnice.",
"Na Kubě stále jezdí stará americká auta.",
"V Keni jsou minibusy “matatu” pestře zdobené.",
"Vlak v Bolívii jezdí po solných pláních.",
"První parkovací automat byl na mince.",
"Ve Stockholmu jezdí lodě jako součást MHD.",
"Nejdelší visutý most pro pěší je v ČR.",
"Nejvyšší most světa je Millau ve Francii.",
"Na Havaji je silnice postavená přes lávové pole.",
"V Japonsku mají vlaky s lázněmi na nohy.",
"V Jižní Koreji jezdí vlaky KTX rychlostí 300 km/h.",
"Ve Švýcarsku mají poštovní autobusy přednost v jízdě.",
"Na Ukrajině je “Tunel lásky” ze stromů.",
"V Bangladéši lidé cestují na střechách vlaků.",
"Vlak Maharajas’ Express je “palác na kolejích”.",
"V Číně staví “patrové” autobusy nad auty.",
"Na Sibiři jezdí auta po zamrzlých řekách.",
"V Norsku mají vyhřívané chodníky a cyklostezky.",
"Vlak v Austrálii je dlouhý přes 1 km.",
"V Chile je nejdelší a nejužší země světa.",
"V Itálii jezdí vysokorychlostní vlaky “Rudá šipka”.",
"Nejstarší most v Římě je stále v provozu.",
"V Kanadě mají speciální mosty pro zvěř.",
"Na Tchaj-wanu je vysokorychlostní železnice v tajfunové oblasti.",
"Vlak Bernina Express je na seznamu UNESCO.",
"Největší automobilové muzeum je ve Francii.",
"V Alžírsku jezdí metro postavené v poušti.",
"Vlak “Pouštní expres” jezdí v Namibii.",
"V Ekvádoru jezdí vlak “Ďáblův nos”.",
"Vlaky v Japonsku mají speciální tichý oddíl.",
"V New Yorku jsou žluté taxíky ikonou.",
"V Dubaji jezdí taxi pouze pro ženy.",
"Nejdelší eskalátor pod širým nebem je v Hongkongu.",
"V Barmě jezdí pomalý okružní vlak v Rangúnu.",
"V San Marinu nemají žádné železnice.",
"V Berlíně jezdí metro i nad zemí.",
"V Římě stavbu metra zdržují archeologické nálezy.",
"Největší letiště světa je v Saúdské Arábii.",
"Letiště v Amsterdamu leží pod hladinou moře.",
"Nejvyšší řídící věž je v Džiddě.",
"Vlak “Ghan” je pojmenován po afghánských velbloudářích.",
"V USA existují speciální silnice pro Amish povozy.",
"Ve Finsku mají v zálivu ledovou silnici.",
"V Kolumbii jezdí do kopců venkovní eskalátory.",
"Na Měsíci jsou zaparkována tři lunární vozítka.",
"V Praze existují nikdy neotevřené stanice metra.",
"Česká pošta kdysi provozovala vlastní aerolinky.",
"Vůz Velorex měl karoserii potaženou koženkou.",
"První airbag byl vynalezen už v 50. letech.",
"Nejrychlejší parní lokomotiva dosáhla 202 km/h.",
"Londýnské taxi se musí otočit na pětníku.",
"Na Madeiře stojí letištní ranvej na sloupech.",
"Ve Finsku se platí pokuty podle výše příjmu.",
"Největší letadlová loď světa nese 90 letadel.",
"Nejstarší auto v ČR je z roku 1898.",
"Vrtulník umí létat i pozpátku a bokem.",
"První elektromobil vznikl v 19. století.",
"Zeppeliny byly plněné vysoce hořlavým vodíkem.",
"V Tokiu jezdí unikátní zavěšený monorail.",
"Ponorky vydrží pod hladinou i několik měsíců.",
"V Paříži jsou v metru opuštěné “stanice duchů”.",
"Nejstarší most v Paříži se jmenuje “Nový most”.",
"Na Manhattanu jezdí lanovka na Roosevelt Island.",
"V Laosu otevřeli první železnici až v roce 2021.",
"Největší křižovatka světa je v americkém Houstonu.",
"V Rusku se nachází nejchladnější dálnice světa.",
"Korintský průplav v Řecku je extrémně úzký.",
"První dopravní značka STOP měla osm stran.",
"Nejdelší trolejbus světa měří přes 32 metrů.",
"Ve Švýcarsku je nejstrmější ozubnicová dráha.",
"Největší letadlo (rozpětím) byl Stratolaunch.",
"Nejmenší komerční letiště je na ostrově Saba.",
"Nejrychlejší letadlo SR-71 letělo přes Mach 3.",
"V Kodani jezdí metro 24 hodin denně.",
"Na Srí Lance je slavný železniční most Devět oblouků.",
"V Jižní Africe jezdí luxusní “Modrý vlak”.",
"V Praze jezdí historická autobusová linka K.",
"Letiště Ruzyně mělo kdysi veřejnou vyhlídkovou terasu.",
"První trolejbus v Praze jezdil na Vyšehrad.",
"Automobilka Jawa vyráběla i malá auta.",
"Největší parník 19. století byl Great Eastern.",
"V Číně je nejdelší systém metra na světě.",
"V Bolívii se až do roku 1995 jezdilo vlevo.",
"V Monaku funguje 7 veřejných výtahů jako MHD.",
"V USA existují speciální tunely pro ryby.",
"Nejstarší funkční auto na světě je parní.",
"Vlak TGV drží rekord i s nejdelší brzdnou dráhou.",
"V Japonsku mají vlaky speciální oddíly pro spaní.",
"V Dubaji mají klimatizované autobusové zastávky.",
"Nejdelší most přes moře je v Číně.",
"V Antarktidě se jezdí speciálními pásovými vozidly.",
"V Kanadě jezdí obojživelné vyhlídkové autobusy.",
"Vlak “Orient Express” byl inspirací pro Agathu Christie.",
"Největší výrobce motorů na světě je Honda.",
"Na Islandu nejsou žádné veřejné železnice.",
"Vlaky v Holandsku jezdí na 100% větrnou energii.",
"První parkovací garáže vznikly na začátku 20. století.",
"Ve Vietnamu je motorka hlavním dopravním prostředkem.",
"V Německu mají některé dálnice vyhřívaný povrch.",
"Vlak Flåmsbana v Norsku je nejstrmější na světě.",
"Vlak “Rocky Mountaineer” má prosklené střechy.",
"V Thajsku jsou trhy přímo na kolejích.",
"Nejdelší silniční síť mají Spojené státy.",
"Vlaky v Japonsku mají zpoždění v řádu sekund.",
"Ve Švédsku testují silnice, které dobíjí elektromobily.",
"Největší trajekt na světě uveze přes 2000 aut.",
"Vlaky v Indii mají speciální vagony pro ženy.",
"V Paříži je nejrušnější nádraží v Evropě.",
"V Káhiře je nejstarší metro v Africe.",
"Největší letiště v Evropě je v Istanbulu.",
"Vlak “California Zephyr” projíždí Skalistými horami.",
"V Japonsku mají speciální vyhlídkové vlaky.",
"Největší metro na světě je v Šanghaji.",
"V USA je nejdelší železniční síť na světě.",
"Vlaky ve Švýcarsku jsou proslulé svou přesností.",
"Největší kontejnerový přístav v Evropě je Rotterdam.",
"Vlak “El Chepe” v Mexiku projíždí kaňony.",
"V Brazílii jezdí vlaky na cukrovou třtinu.",
"Vlaky v Jižní Koreji mají palubní Wi-Fi.",
"Vlak “TranzAlpine” na Novém Zélandu je vyhlídkový.",
"V Číně je nejdelší most na světě.",
"Nejvyšší most na světě je také v Číně.",
"Vlaky v Rusku mají široký rozchod kolejí.",
"Vlak “Rovos Rail” v Africe je luxusní hotel.",
"Vlaky v Kanadě jsou často zpožděné kvůli nákladu.",
"Největší autobusové nádraží je v Indii.",
"Vlaky v Austrálii jsou velmi dlouhé.",
"Vlaky ve Finsku jsou přizpůsobeny zimě.",
"Vlaky ve Španělsku mají vysokorychlostní síť AVE.",
"Vlaky v Itálii jsou známé svým designem.",
"Vlaky v Německu mají jídelní vozy.",
"Vlaky ve Francii mají dvoupodlažní vagony.",
"Vlaky v Belgii mají hustou železniční síť.",
"Vlaky v Rakousku jsou proslulé svou čistotou.",
"Tatra testovala auto s proudovým motorem.",
"Vůz Tatra V570 byl inspirací pro VW Brouk.",
"V Praze jezdily sanitní tramvaje za války.",
"Parní tramvaj jezdila z Brna do Líšně.",
"První auto v Praze jelo rychlostí chůze.",
"Lanovka na Ještěd byla první kabinová v ČR.",
"Negrelliho viadukt přežil všechny povodně.",
"V ČR existují tajné podzemní vojenské dráhy.",
"Vlaky RegioJet mají oddíly s tichem.",
"V Brně je nejstarší trolejbusová křižovatka.",
"Na Petříně byly kdysi dva lyžařské vleky.",
"Škoda Ferat byl vůz pro filmový horor.",
"První letadlo v Čechách sestrojil Jan Kašpar.",
"V ČR je muzeum historických traktorů.",
"Česká firma vyrábí létající motocykly.",
"Nejstarší autobusová linka vedla do Mělníka.",
"Na Vltavě plují solární a hybridní lodě.",
"V ČR se testují autonomní nákladní auta.",
"První dálniční odpočívadlo bylo u Průhonic.",
"Pražský Semmering je trať s velkým stoupáním.",
"Raketa Saturn V byla vysoká jako mrakodrap.",
"Rover na Marsu ujel přes 45 kilometrů.",
"Mezinárodní vesmírná stanice obletí Zemi za 90 minut.",
"Sonda Voyager 1 opustila sluneční soustavu.",
"První umělá družice byl sovětský Sputnik.",
"Římané postavili přes 80 000 km silnic.",
"Vikingové se plavili na lodích bez kompasu.",
"Poštovní holubi byli využíváni během válek.",
"Inkové stavěli v horách visuté mosty.",
"První parní stroj poháněl čerpadlo v dole.",
"Vynález lodního kontejneru změnil světový obchod.",
"Největší vznášedlo uvezlo 400 lidí a 60 aut.",
"V Thajsku je nelegální řídit bez trička.",
"Na Kypru se v autě nesmí jíst ani pít.",
"V Německu vám může dojít palivo na dálnici.",
"V Rusku je povinné mít čisté auto.",
"Ve Španělsku musíte mít v autě náhradní brýle.",
"Na Filipínách mají auta podle značky volno.",
"V Norsku jsou v horách spirálové tunely.",
"Lodní výtah Falkirk Wheel ve Skotsku otáčí lodě.",
"V Číně mají most, který se “rozplete”.",
"V Japonsku je letiště na umělém ostrově.",
"Nejdelší podmořský tunel je v Japonsku.",
"V Norsku mají mosty, které vypadají nedokončeně.",
"Na Floridě je most dlouhý sedm mil.",
"Nejdelší eskalátor na světě je v Hongkongu.",
"V Belgii je lodní výtah vysoký 73 metrů.",
"První auto se řídilo pákou, ne volantem.",
"Stěrače vynalezla žena.",
"Zpětné zrcátko bylo poprvé použito v závodě.",
"Ve Švédsku se v roce 1967 změnila strana řízení.",
"První blinkry byly výklopné šipky.",
"Nejdelší limuzína světa má 30 metrů a bazén.",
"Automobil Rolls-Royce je z 65 % ruční práce.",
"V San Franciscu je muzeum historických tramvají.",
"V Bombaji jezdí dvoupatrové autobusy.",
"V Limě v Peru jezdí metro i nad zemí.",
"Největší flotilu autobusů má město Dillí.",
"V Lisabonu jsou kromě tramvají i lanovky.",
"V Káhiře je metro extrémně přeplněné.",
"V Sydney mají jednokolejku a metro.",
"V Torontu jezdí tramvaje a metro.",
"V Mexico City má metro speciální symboly.",
"Největší síť trolejbusů na světě je v Moskvě.",
"V Budapešti jezdí nejdelší tramvaje světa.",
"V Atlantě jezdí kyvadlová doprava pod letištěm.",
"V Seattlu jezdí autobusy i v podzemních tunelech.",
"V Paříži jezdí automatická linka metra 14.",
"V Londýně mají speciální noční metro.",
"V Berlíně je stanice metra pod kancléřstvím.",
"V Barceloně mají stanice metra umělecká díla.",
"Ve Vídni jezdí historická okružní tramvaj.",
"V Curychu je nejhustší síť MHD na světě.",
"V Oslu jezdí metro, tramvaje i lodě.",
"V Helsinkách mají lodní dopravu na ostrovy.",
"Ve Varšavě mají moderní druhou linku metra.",
"V Praze je nejdelší tramvajová síť v ČR.",
"V Brně mají speciální divadelní tramvaj.",
"V Ostravě jezdí tramvaje do oceláren.",
"V Plzni jezdí trolejbusy s bateriovým pohonem.",
"V Liberci jezdí tramvaje na metrovém rozchodu.",

    ];
    return facts[Math.floor(Math.random() * facts.length)];
  };

  const getSchoolHolidays = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Prázdniny a speciální dny
    const holidays = {
      // Vánoční prázdniny
      'beforeChristmas': (month === 12 && day >= 22) || (month === 1 && day <= 2),
      'afterChristmas': month === 1 && day === 3,

      // Jarní prázdniny (březen)
      'beforeSpring': month === 3 && day >= 25 && day <= 31,
      'afterSpring': month === 4 && day === 1,

      // Velikonoční prázdniny (duben - může se lišit podle roku)
      'beforeEaster': month === 4 && day >= 15 && day <= 18,
      'afterEaster': month === 4 && day === 19,

      // Letní prázdniny
      'beforeSummer': (month === 6 && day >= 29) || month === 7 || (month === 8 && day <= 31),
      'afterSummer': month === 9 && day === 1,

      // Podzimní prázdniny (říjen)
      'beforeAutumn': month === 10 && day >= 26 && day <= 31,
      'afterAutumn': month === 11 && day === 1
    };

    return holidays;
  };

  const generateMessage = () => {
    const day = getDayName();
    const nameDay = getNameDayInfo();
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const dayOfWeek = new Date().getDay(); // 0=neděle, 1=pondělí, ..., 5=pátek, 6=sobota
    const holidays = getSchoolHolidays();

    let greeting = '';
    if (hour < 10) greeting = 'Dobré ráno!';
    else if (hour < 12) greeting = 'Dobré dopoledne!';
    else if (hour < 17) greeting = 'Dobré poledne!';
    else greeting = 'Dobrý večer!';

    // První školní den po prázdninách
    if (holidays.afterChristmas) {
      return `${greeting} Vítejte zpátky po vánočních prázdninách! Přejeme úspěšný školní rok!`;
    }
    if (holidays.afterSpring) {
      return `${greeting} Vítejte zpátky po jarních prázdninách! Doufáme, že jste si odpočinuli!`;
    }
    if (holidays.afterEaster) {
      return `${greeting} Vítejte zpátky po velikonočních prázdninách! Těšíme se na vás!`;
    }
    if (holidays.afterSummer) {
      return `${greeting} Vítejte zpátky po letních prázdninách! Nový školní rok začíná!`;
    }
    if (holidays.afterAutumn) {
      return `${greeting} Vítejte zpátky po podzimních prázdninách! Pokračujeme ve studiu!`;
    }

    // Před prázdninami
    if (holidays.beforeChristmas) {
      return `${greeting} Užijte si vánoční prázdniny! Uvidíme se po Novém roce!`;
    }
    if (holidays.beforeSpring) {
      return `${greeting} Užijte si jarní prázdniny! Odpočiňte si a naberte síly!`;
    }
    if (holidays.beforeEaster) {
      return `${greeting} Užijte si velikonoční prázdniny! Veselé Velikoce!`;
    }
    if (holidays.beforeSummer) {
      return `${greeting} Užijte si letní prázdniny! Krásné léto a uvidíme se v září!`;
    }
    if (holidays.beforeAutumn) {
      return `${greeting} Užijte si podzimní prázdniny! Odpočiňte si a uvidíme se po nich!`;
    }

    // STŘÍDÁNÍ: sudé = pozdravi, liché = fun fakty
    if (messageCounter % 2 === 0) {
      // POZDRAVI - různé podle situace

      // Pondělní vítání po víkendu
      if (dayOfWeek === 1) {
        return `${greeting} Doufáme, že jste si užili víkend! Vítejte zpátky v novém týdnu!`;
      }

      // Zpráva o obědě (11:00-13:00)
      if (hour >= 11 && hour < 13) {
        return `${greeting} Čas na oběd! Užijte si chvilku pohody a dobré jídlo!`;
      }

      // Páteční víkendové přání (celý pátek)
      if (dayOfWeek === 5) {
        return `${greeting} Je pátek! Přejeme vám hezký víkend a odpočinek!`;
      }

      // Večerní zpráva (20:00-23:59)
      if (hour >= 20) {
        return `${greeting} Přejeme vám hezký večer a vidíme se zítra!`;
      }

      // Standardní zpráva se svátkem
      if (nameDay) {
        return `${greeting} Dnes je ${day} a má svátek ${nameDay}!`;
      } else {
        return `${greeting} Dnes je ${day}, přeji příjemný den!`;
      }
    } else {
      // FUN FAKTY
      return getFunFacts();
    }
  };

  const [robotTheme, setRobotTheme] = useState(getRobotTheme());

  useEffect(() => {
    setCurrentMessage(generateMessage());
    // Aktualizovat téma robota při každé změně zprávy
    setRobotTheme(getRobotTheme());
  }, [messageCounter]);

  // Postupná animace - robot jede z prava doleva a zpět
  useEffect(() => {
    const startAnimation = () => {
      // Pokud už animace běží, přeskoč
      if (isAnimating) {
        return;
      }

      setIsAnimating(true);
      setMessageCounter(prev => prev + 1); // Změna textu při každém zobrazení
      setIsVisible(true);
      setRobotPhase('movingLeft');

      // Robot dorazí doleva po 4 sekundách
      setTimeout(() => {
        setRobotPhase('atLeft');
      }, 4000);

      // Robot se začne vracet doprava po 2 sekundách
      setTimeout(() => {
        setRobotPhase('movingRight');
        setShowBackground(true);
      }, 6000);

      // Robot dorazí doprava s pozadím
      setTimeout(() => {
        setRobotPhase('atRight');
        setShowText(true);
      }, 10000);

      // Text a pozadí zmizí po 15 sekundách
      setTimeout(() => {
        setShowText(false);
        setShowBackground(false);
      }, 15000);

      // Robot odjíždí doprava po 16 sekundách (po zmizení textu)
      setTimeout(() => {
        setRobotPhase('movingAway');
      }, 16000);

      // Vše úplně zmizí po 19 sekundách
      setTimeout(() => {
        setRobotPhase('hidden');
        setIsVisible(false);
        setIsAnimating(false); // Animace skončila
      }, 19000);
    };

    // První zobrazení po 2 sekundách
    const initialTimer = setTimeout(startAnimation, 2000);

    // Pak každou minutu
    const showTimer = setInterval(startAnimation, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(showTimer);
    };
  }, [isAnimating]); // Závislost na isAnimating

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Pozadí s textem */}
          <motion.div
            className="robot-animation fixed bottom-0 left-0 right-0 h-24 z-40 bg-gradient-to-l from-blue-900 via-blue-800 to-blue-900/95 shadow-lg"
            style={{
              willChange: 'width, opacity',
              backfaceVisibility: 'hidden'
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: showBackground ? '100%' : 0,
              opacity: showBackground ? 1 : 0
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: 'linear',
              type: 'tween'
            }}
          />

          {/* Text vycentrovaný na celé obrazovce */}
          <motion.div
            className="robot-animation fixed bottom-0 left-0 right-0 w-full h-24 z-50 flex items-center justify-center"
            style={{
              willChange: 'opacity, transform',
              backfaceVisibility: 'hidden'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: showText ? 1 : 0,
              scale: showText ? 1 : 0.8
            }}
            transition={{ duration: 1, delay: 0.5, ease: 'linear', type: 'tween' }}
          >
            <div className="text-white font-bold text-center" style={{
              fontSize: `${Math.max(1.2, 2 * 1.0)}rem`,
              wordBreak: 'keep-all',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              {currentMessage}
            </div>
          </motion.div>

          {/* Robot */}
          <motion.div
            className="robot-animation fixed z-[9999]"
            style={{
              bottom: '0px',
              right: '0px',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}
            animate={{
              x: robotPhase === 'movingLeft' ? 'calc(-100vw + 50px)' :
                 robotPhase === 'atLeft' ? 'calc(-100vw + 50px)' :
                 robotPhase === 'movingRight' ? 'calc(-85vw + 50px)' :
                 robotPhase === 'atRight' ? 'calc(-85vw + 50px)' :
                 robotPhase === 'movingAway' ? 'calc(100vw)' :
                 'calc(100vw + 50px)',
              opacity: robotPhase === 'hidden' ? 0 : 1,
              scale: robotPhase === 'hidden' ? 0.8 : 1
            }}
            transition={{
              duration: robotPhase === 'movingLeft' ? 4 :
                       robotPhase === 'movingRight' ? 4 :
                       robotPhase === 'movingAway' ? 3 : 1,
              ease: 'linear',
              type: 'tween'
            }}
          >
            <motion.img
              src={robotTheme.image}
              alt={`Robot ${robotTheme.theme}`}
              className="w-auto object-contain"
              style={{
                height: `${Math.max(5, 12 * 1.0)}rem`,
                filter: 'drop-shadow(4px 4px 12px rgba(0,0,0,0.4))'
              }}
              onError={(e) => {
                // Fallback na výchozí robot, pokud obrázek neexistuje
                const target = e.target as HTMLImageElement;
                if (target.src !== '/pictures/robotz.png') {
                  target.src = '/pictures/robotz.png';
                }
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};