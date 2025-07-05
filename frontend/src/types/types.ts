export interface RealTimeShipUpdateDTO {
  mmsi: string;
  speedOverGround: number;
  courseOverGround: number;
  longitude: number;
  latitude: number;
  timestampEpoch: number;
  navigationalStatus?: number;
  trueHeading: number;
  shiptype: string;
}

export type FilterValue = string | number[];

export interface ShipDetailsDTO {
  mmsi: number; // Note: number (Long in Java), not string
  shiptype?: string;
  navigationalStatus?: number;
  rateOfTurn?: number;
  speedOverGround?: number;
  courseOverGround?: number;
  trueHeading?: number;
  longitude?: number;
  latitude?: number;
  lastUpdateTimestampEpoch?: number;
}