

export interface Station {
  id: string;
  name: string;
  location_type?: number;
  parent_station?: string;
  municipality?: string;
  modes?: string[];
  lat: number;
  lon: number;
  zone_id?: string;
  wheelchair_accessible?: boolean;
}

export interface Departure {
  // Základní údaje o odjezdu
  arrival_timestamp: number;
  departure_timestamp: number;
  delay?: number;

  // Informace o trase
  route_short_name: string;
  route_type: number;
  route_id?: string;
  route_long_name?: string;
  route_color?: string;
  route_text_color?: string;
  headsign: string;

  // Trip informace
  trip_id?: string;
  trip_number?: string;

  // Zastávka
  stop_sequence?: number;
  platform_code?: string;
  current_stop?: string;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;

  // Vozidlo - základní
  vehicle_number?: string;
  vehicle_operator?: string;
  vehicle_type?: string;
  vehicle_model?: string;
  vehicle_age?: number;
  vehicle_registration_number?: string;

  // Vozidlo - features
  wheelchair_accessible?: boolean;
  air_conditioning?: boolean;
  wifi?: boolean;
  low_floor?: boolean;
  bike_rack?: boolean;
  usb_charging?: boolean;
  boarding_wheelchair?: boolean;
  is_wheelchair_accessible?: boolean;
  is_air_conditioned?: boolean;
  has_usb_chargers?: boolean;

  // Pozice a navigace
  current_latitude?: number;
  current_longitude?: number;
  bearing?: number;
  state_position?: string;
  shape_id?: string;
  distance_traveled?: number;
  last_stop_sequence?: number;

  // Real-time údaje
  last_position_age?: number;
  last_position_update?: string;
  current_speed?: number;
  real_time_delay?: number;

  // GTFS údaje
  block_id?: string;
  service_id?: string;
  bikes_allowed?: boolean;

  // Dopravce
  agency_name?: string;
  agency_url?: string;

  // Výstrahy
  alert_hash?: string;
}

export interface StopTime {
  arrival_timestamp: number;
  departure_timestamp: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
  shape_dist_traveled?: number;
  timepoint?: number;
}
