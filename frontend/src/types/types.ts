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
