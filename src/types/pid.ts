

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
  stop_sequence?: number;
  wheelchair_accessible?: boolean;
  last_position_age?: number;
  alert_hash?: string;
  route_id?: string;
  agency_name?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  air_conditioning?: boolean;
  current_stop?: string;
  platform_code?: string;
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
