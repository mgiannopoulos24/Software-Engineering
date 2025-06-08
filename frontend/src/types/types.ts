export type Vessel = {
  id: number;
  name: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  destination: string;
};

export type FilterValue = string | number[];
