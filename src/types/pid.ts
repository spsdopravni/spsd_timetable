

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
  arrival_timestamp: number;
  departure_timestamp: number;
  delay?: number;
  route_short_name: string;
  route_type: number;
  headsign: string;
  trip_id?: string;
  trip_number?: string;
  stop_sequence?: number;
  wheelchair_accessible?: boolean;
  last_position_age?: number;
  alert_hash?: string;
  route_id?: string;
  agency_name?: string;
  vehicle_number?: string;
  vehicle_operator?: string;
  vehicle_type?: string;
  air_conditioning?: boolean;
  current_stop?: string;
  platform_code?: string;
  wifi?: boolean;
  low_floor?: boolean;
  bike_rack?: boolean;
  usb_charging?: boolean;
  boarding_wheelchair?: boolean;
  vehicle_age?: number;
  vehicle_model?: string;
  current_latitude?: number;
  current_longitude?: number;
  last_position_update?: string;
  current_speed?: number;
  stop_sequence?: number;
  distance_traveled?: number;
  block_id?: string;
  service_id?: string;
  bikes_allowed?: boolean;
  route_long_name?: string;
  route_color?: string;
  route_text_color?: string;
  agency_name?: string;
  agency_url?: string;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
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
