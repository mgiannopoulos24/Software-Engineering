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
  mmsi: number;
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

export interface TrackPointDTO {
  latitude: number;
  longitude: number;
  timestampEpoch: number;
}

export enum ZoneConstraintType {
  SPEED_LIMIT_ABOVE = 'SPEED_LIMIT_ABOVE',
  SPEED_LIMIT_BELOW = 'SPEED_LIMIT_BELOW',
  ZONE_ENTRY = 'ZONE_ENTRY',
  ZONE_EXIT = 'ZONE_EXIT',
  FORBIDDEN_SHIP_TYPE = 'FORBIDDEN_SHIP_TYPE',
  UNWANTED_NAV_STATUS = 'UNWANTED_NAV_STATUS',
}

export interface ZoneConstraintDTO {
  id?: number;
  constraintType: ZoneConstraintType;
  constraintValue: string;
}

export interface ZoneOfInterestDTO {
  id?: number;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusInMeters: number;
  constraints: ZoneConstraintDTO[];
}

export interface CollisionZoneDTO {
  id?: number;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusInMeters: number;
}

export type ZoneDataWithType = (ZoneOfInterestDTO | CollisionZoneDTO) & {
  type: 'interest' | 'collision';
};

export interface AppNotification {
  id: string;
  type: 'violation' | 'collision' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}

// --- ΝΕΟΙ ΤΥΠΟΙ ΓΙΑ ΤΗΝ ΕΙΔΟΠΟΙΗΣΗ ΣΥΓΚΡΟΥΣΗΣ ---

/**
 * Αντιστοιχεί στο nested DTO `ShipInfo` της Java.
 */
export interface CollisionShipInfo {
  mmsi: string;
  latitude: number;
  longitude: number;
}

/**
 * Αντιστοιχεί στο κυρίως DTO `CollisionNotificationDTO` της Java.
 * Το πεδίο `timestamp` της Java (Instant) έρχεται ως string στο JSON.
 */
export interface CollisionNotificationDTO {
  timestamp: string;
  message: string;
  zoneId: number;
  zoneName: string;
  shipA: CollisionShipInfo;
  shipB: CollisionShipInfo;
}

/**
 * Αντιστοιχεί στο DTO `NotificationDTO` της Java για παραβιάσεις
 * των ζωνών ενδιαφέροντος (Zone of Interest).
 */
export interface ZoneViolationNotificationDTO {
  timestamp: string; // Το Instant της Java γίνεται string
  message: string;
  zoneId: number;
  zoneName: string;
  violationType: ZoneConstraintType;
  mmsi: string;
  latitude: number;
  longitude: number;
}
