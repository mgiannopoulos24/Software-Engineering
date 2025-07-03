export interface Vessel {
  mmsi: string;
  speedOverGround: number;
  courseOverGround: number;
  longitude: number;
  latitude: number;
  timestampEpoch: number;
  trueHeading: number;
  shiptype: string;
  navigationalStatus?: number; // Add this if you need it for status determination
}

export type FilterValue = string | number[];
