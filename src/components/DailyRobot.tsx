import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyRobotProps {
  textSize?: number;
}

export const DailyRobot = ({ textSize = 1.0 }: DailyRobotProps) => {
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
      "Víte že nejdelší tramvajová trať v ČR je linka 22 v Praze s délkou 28 km?",
      "Víte že pražské metro je nejhlubší v Evropě? Stanice Náměstí Míru je 53 metrů pod zemí!",
      "Víte že v České republice jezdí přes 900 tramvají současně?",
      "Víte že nejstarší funiklulář v ČR jezdí na Petřín od roku 1891?",
      "Víte že RegioJet byl první soukromou železniční společností v ČR?",
      "Víte že pražské autobusy najezdí denně více než 400 000 kilometrů?",
      "Víte že tramvaj T3 Coupé byla vyráběna 40 let a je ikonou českého designu?",
      "Víte že nejrychlejší vlak v ČR Pendolino dosahuje rychlosti 200 km/h?",
      "Víte že Brno má nejstarší trolejbusovou síť ve střední Evropě?",
      "Víte že železniční síť v ČR má délku přes 9 400 kilometrů?",
      "Víte že pražská MHD přepraví ročně více než 1,2 miliardy cestujících?",
      "Víte že nejkratší tramvajová trať je v Liberci a měří pouze 8,4 km?",
      "Víte že český železniční tunel Březno je dlouhý 4 062 metrů?",
      "Víte že autobus Karosa byla slavná česká značka vyvážená do celého světa?",
      "Víte že v ČR existuje přes 55 000 autobusových zastávek?",
      "Víte že tramvaje v Praze jezdí už od roku 1891? První byla koňka!",
      "Víte že první elektrická tramvaj v Praze vyjela 1. července 1901?",
      "Víte že tramvaj Tatra T3 je nejhojněji vyráběná tramvaj světa? Vzniklo jich přes 14 000!",
      "Víte že pražské metro vzniklo až v roce 1974 a bylo třetí v bývalém Československu?",
      "Víte že nejstarší železniční trať v ČR je České Budějovice-Linz z roku 1832?",
      "Víte že autobusy SOR jsou vyráběny v Libchavách a vozí cestující po celé Evropě?",
      "Víte že nejstarší fungující lanová dráha je v Táboře a jezdí od roku 1902?",
      "Víte že Hlavní nádraží se dříve jmenovalo Kaiser Franz Josef-Bahnhof?",
      "Víte že Škoda Transportation má továrnu tramvají v Plzni už od roku 1925?",
      "Víte že česká firma Leo Express má nejmodernější vlaky Flirt v ČR?",
      "Víte že nejdelší železniční most v ČR je v Děčíně a měří 331 metrů?",
      "Víte že trolejbusy v Praze jezdily od roku 1936 do 1972?",
      "Víte že nejstarší tramvaj v ČR je z roku 1886?",
      "Víte že pražská linka A metra byla první a vedla z Náměstí Míru do Sokolské?",
      "Víte že nejrychlejší tramvaj v ČR dosahuje rychlosti až 70 km/h?",
      "Víte že autobusy Ikarus byly velmi oblíbené v Československu v 70.-80. letech?",
      "Víte že česká železnice má 2 950 nádraží a zastávek?",
      "Víte že pražský Dopravní podnik má přes 1 600 vozidel?",
      "Víte že nejkratší autobusová linka v ČR měří jen 2,1 km?",
      "Víte že tramvajová trať na Petřín má sklon až 10 %?",
      "Víte že první motorová drezína v ČR jezdila už v roce 1903?",
      "Víte že nejdelší tunel v pražském metru je mezi Malostranskou a Hradčanskou?",
      "Víte že tramvaje 14T ForCity Plus mají klimatizaci a WiFi?",
      "Víte že nejstarší autobusové nádraží v ČR je na pražském Florenci z roku 1960?",
      "Víte že linka 9 je nejdelší autobusová linka v Praze s délkou 33 km?",
      "Víte že český Pendolino SC má naklápěcí skříně pro jízdu v zatáčkách?",
      "Víte že tramvaj VarioLF je nejdelší tramvaj v Praze s délkou 31 metrů?",
      "Víte že České dráhy mají vozový park s více než 4 000 vozidly?",
      "Víte že nejstarší železniční viadukt v ČR je Negrelliho viadukt v Praze z roku 1850?",
      "Víte že autobusová doprava v ČR přepraví ročně přes 300 milionů cestujících?",
      "Víte že nejmodernější vlakové nádraží v ČR je Brno hlavní nádraží po rekonstrukci?",
      "Víte že tramvaje v Ostravě jezdí i do Polska, konkrétně do Hlučína?",
      "Víte že nejrychlejší vlak na světě je japonský maglev s rychlostí 603 km/h?",
      "Víte že švýcarské vlaky mají průměrné zpoždění jen 3 minuty ročně?",
      "Víte že metro v Tokiu přepraví denně 40 milionů cestujících?",
      "Víte že nejdelší tramvajová síť má Melbourne s délkou 250 kilometrů?",
      "Víte že francouzský TGV dosáhl rekordní rychlosti 574,8 km/h?",
      "Víte že metro v New Yorku má 472 stanic a je největší na světě?",
      "Víte že v Londýně jezdí slavné červené dvoupatrové autobusy už od roku 1956?",
      "Víte že nejstarší metro na světě je londýnské Underground z roku 1863?",
      "Víte že německé ICE vlaky dosahují pravidelně rychlosti 300 km/h?",
      "Víte že nejdelší autobusová linka na světě měří 6 200 km a vede z Limy do Rio?",
      "Víte že metro v Moskvě má nejkrásnější stanice, některé vypadají jako paláce?",
      "Víte že tramvaje v San Franciscu jezdí po nejstrmějších kopcích světa?",
      "Víte že čínská vysokorychlostní síť má délku přes 40 000 kilometrů?",
      "Víte že metro v Mnichově je plně automatické a jezdí bez řidiče?",
      "Víte že nejdelší železniční tunel na světě je Gotthard v Alpách s délkou 57 km?",
      "Víte že autobusy v Curitibě v Brazílii mají vlastní rychlé pruhy jako metro?",
      "Víte že norské vlaky jezdí nejseverněji na světě, až za polární kruh?",
      "Víte že metro v Dubaji má plně klimatizované stanice kvůli pouštnímu horku?",
      "Víte že tramvaje v Rotterdamu jsou bezdrátové a nabíjejí se na zastávkách?",
      "Víte že metro v Singapuru je nejmodernější na světě s plnou automatizací?",
      "Víte že švédské vlaky X2000 mají naklápěcí technologii pro rychlou jízdu?",
      "Víte že metro v Paříži má stanici každých 500 metrů po celém městě?",
      "Víte že autobusy BRT v Bogotě přepraví 2,4 milionu cestujících denně?",
      "Víte že železnice v Indii zaměstnává přes 1,3 milionu lidí?",
      "Víte že metro v Barceloně má některé stanice navržené slavnými architekty?",
      "Víte že kanadské vlaky VIA Rail překonávají vzdálenosti přes 4 000 km?",
      "Víte že tramvaje v Amsterodamu jezdí po 200 km tratí a mají 15 linek?",
      "Víte že metro v Hongkongu má přesnost 99,9 % a jezdí co 2 minuty?"
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

    // Rotace zpráv podle počítadla
    const messageType = messageCounter % 5;

    if (messageType === 0 || messageType === 4) {
      // Každé 1. a 5. minutu (pozice 0,4) - standardní zpráva se svátkem
      if (nameDay) {
        return `${greeting} Dnes je ${day} a má svátek ${nameDay}!`;
      } else {
        return `${greeting} Dnes je ${day}, přeji příjemný den!`;
      }
    } else {
      // Každé 2., 3., 4. minutu (pozice 1,2,3) - zábavný fakt
      return getFunFacts();
    }
  };

  useEffect(() => {
    setCurrentMessage(generateMessage());

    // Aktualizace každou minutu pro rotaci zpráv
    const interval = setInterval(() => {
      setMessageCounter(prev => prev + 1);
      setCurrentMessage(generateMessage());
    }, 60000); // 1 minuta

    return () => clearInterval(interval);
  }, [messageCounter]);

  // Postupná animace - robot jede z prava doleva a zpět
  useEffect(() => {
    const startAnimation = () => {
      // Pokud už animace běží, přeskoč
      if (isAnimating) {
        console.log('⏸️ Animation already running, skipping');
        return;
      }

      console.log('🤖 Robot starts from right');
      setIsAnimating(true);
      setCurrentMessage(generateMessage());
      setIsVisible(true);
      setRobotPhase('movingLeft');

      // Robot dorazí doleva po 4 sekundách
      setTimeout(() => {
        console.log('🐈 Robot at left edge');
        setRobotPhase('atLeft');
      }, 4000);

      // Robot se začne vracet doprava po 2 sekundách
      setTimeout(() => {
        console.log('👉 Robot moving back right');
        setRobotPhase('movingRight');
        setShowBackground(true);
      }, 6000);

      // Robot dorazí doprava s pozadím
      setTimeout(() => {
        console.log('📝 Robot arrived with background');
        setRobotPhase('atRight');
        setShowText(true);
      }, 10000);

      // Text a pozadí zmizí po 15 sekundách
      setTimeout(() => {
        console.log('👋 Hiding text and background');
        setShowText(false);
        setShowBackground(false);
      }, 15000);

      // Robot odjíždí doprava po 16 sekundách (po zmizení textu)
      setTimeout(() => {
        console.log('🚗 Robot moving away right');
        setRobotPhase('movingAway');
      }, 16000);

      // Vše úplně zmizí po 19 sekundách
      setTimeout(() => {
        console.log('👋 Hiding robot');
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
            className="fixed bottom-0 right-0 h-24 z-40 bg-gradient-to-l from-blue-900 via-blue-800 to-blue-900/95 shadow-lg"
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: showBackground ? '100%' : 0,
              opacity: showBackground ? 1 : 0
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          />

          {/* Text vycentrovaný na celé obrazovce */}
          <motion.div
            className="fixed bottom-0 w-full h-24 z-50 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: showText ? 1 : 0,
              scale: showText ? 1 : 0.8
            }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="text-white font-bold text-center" style={{
              fontSize: `${Math.max(1.2, 2 * textSize)}rem`,
              wordBreak: 'keep-all',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              {currentMessage}
            </div>
          </motion.div>

          {/* Robot */}
          <motion.div
            className="fixed z-50"
            animate={{
              x: robotPhase === 'movingLeft' ? 'calc(-75vw + 100px)' :
                 robotPhase === 'atLeft' ? 'calc(-75vw + 100px)' :
                 robotPhase === 'movingRight' ? 'calc(-40vw + 100px)' :
                 robotPhase === 'atRight' ? 'calc(-40vw + 100px)' :
                 robotPhase === 'movingAway' ? 'calc(20vw)' :
                 '50px',
              opacity: robotPhase === 'hidden' ? 0 : 1,
              scale: robotPhase === 'hidden' ? 0.8 : 1,
              rotate: robotPhase === 'movingLeft' ? -2 :
                     robotPhase === 'movingRight' ? 2 :
                     robotPhase === 'movingAway' ? 5 : 0
            }}
            transition={{
              duration: robotPhase === 'movingLeft' ? 4 :
                       robotPhase === 'movingRight' ? 4 :
                       robotPhase === 'movingAway' ? 3 : 1,
              ease: [0.15, 0.25, 0.35, 0.85]
            }}
            style={{
              bottom: '20px',
              right: '0px'
            }}
          >
            <motion.img
              src="/pictures/robotz.png"
              alt="Robot"
              className="w-auto object-contain"
              style={{
                height: `${Math.max(5, 12 * textSize)}rem`,
                filter: 'drop-shadow(4px 4px 12px rgba(0,0,0,0.4))'
              }}
              animate={{
                y: robotPhase === 'atRight' ? [0, -15, 0] : 0
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};