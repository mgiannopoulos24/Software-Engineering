export type Vessel = {
  id: number;
  mmsi: string;
  navigationalStatus: number;
  rateOfTurn: number;
  speedOverGround: number;
  courseOverGround: number;
  trueHeading: number;
  longitude: number;
  latitude: number;
  timestampEpoch: number;
};

export type FilterValue = string | number[];
