// Mock data pro DEV prostředí - nevolá API
import type { Departure } from "@/types/pid";

export const getMockDepartures = (): { departures: Departure[], alerts: any[] } => {
  const now = Math.floor(Date.now() / 1000);

  const mockDepartures: Departure[] = [
    {
      arrival_timestamp: now + 120, // za 2 minuty
      departure_timestamp: now + 120,
      delay: 0,
      route_short_name: "9",
      route_type: 0,
      headsign: "Spojovací",
      is_night: false,
      trip_id: "9_12345_240101",
      trip_number: "12",
      wheelchair_accessible: true,
      air_conditioning: true,
      wifi: true,
      low_floor: true,
      vehicle_number: "9418",
      last_position_age: 0,
    },
    {
      arrival_timestamp: now + 300, // za 5 minut
      departure_timestamp: now + 300,
      delay: 60, // 1 minuta zpoždění
      route_short_name: "10",
      route_type: 0,
      headsign: "Sídliště Barrandov",
      is_night: false,
      trip_id: "10_12346_240101",
      trip_number: "15",
      wheelchair_accessible: false,
      air_conditioning: false,
      wifi: false,
      low_floor: true,
      usb_charging: true,
      vehicle_number: "8467",
      last_position_age: 0,
    },
    {
      arrival_timestamp: now + 480, // za 8 minut
      departure_timestamp: now + 480,
      delay: -30, // 30 sekund napřed
      route_short_name: "16",
      route_type: 0,
      headsign: "Nové Strašnice",
      is_night: false,
      trip_id: "16_12347_240101",
      trip_number: "18",
      wheelchair_accessible: true,
      air_conditioning: true,
      wifi: false,
      low_floor: true,
      bike_rack: true,
      vehicle_number: "9234",
      last_position_age: 0,
    },
    {
      arrival_timestamp: now + 600, // za 10 minut
      departure_timestamp: now + 600,
      delay: 120, // 2 minuty zpoždění
      route_short_name: "22",
      route_type: 0,
      headsign: "Bílá Hora",
      is_night: false,
      trip_id: "22_12348_240101",
      trip_number: "22",
      wheelchair_accessible: true,
      air_conditioning: false,
      wifi: true,
      low_floor: true,
      vehicle_number: "8512",
      current_stop: "Náměstí Kinských",
      last_position_age: 0,
    },
    {
      arrival_timestamp: now + 780, // za 13 minut
      departure_timestamp: now + 780,
      delay: 0,
      route_short_name: "91",
      route_type: 0,
      headsign: "Vozovna Kobylisy",
      is_night: true, // Noční linka!
      trip_id: "91_12349_240101",
      trip_number: "05",
      wheelchair_accessible: true,
      air_conditioning: true,
      wifi: false,
      low_floor: true,
      vehicle_number: "9145",
      last_position_age: 0,
    },
    {
      arrival_timestamp: now + 900, // za 15 minut
      departure_timestamp: now + 900,
      delay: 0,
      route_short_name: "174",
      route_type: 3, // Autobus
      headsign: "Luka",
      is_night: false,
      trip_id: "174_12350_240101",
      trip_number: "08",
      wheelchair_accessible: true,
      air_conditioning: true,
      wifi: false,
      low_floor: true,
      vehicle_number: "3456",
      last_position_age: 0,
    },
    {
      arrival_timestamp: now + 1020, // za 17 minut
      departure_timestamp: now + 1020,
      delay: 0,
      route_short_name: "9",
      route_type: 0,
      headsign: "Spojovací",
      is_night: false,
      trip_id: "9_12351_240101",
      trip_number: "25",
      wheelchair_accessible: true,
      air_conditioning: false,
      wifi: false,
      low_floor: true,
      vehicle_number: "8466", // Školní tramvaj!
      last_position_age: 0,
    }
  ];

  return {
    departures: mockDepartures,
    alerts: []
  };
};
