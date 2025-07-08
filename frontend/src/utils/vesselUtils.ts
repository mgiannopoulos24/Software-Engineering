// src/utils/vesselUtils.ts

export const getVesselStatusDescription = (status?: number): string => {
    switch (status) {
        case 0: return 'Under way using engine';
        case 1: return 'At anchor';
        case 2: return 'Not under command';
        case 3: return 'Restricted manoeuverability';
        case 4: return 'Constrained by her draught';
        case 5: return 'Moored';
        case 6: return 'Aground';
        case 7: return 'Engaged in Fishing';
        case 8: return 'Under way sailing';
        case 9: return 'reserved for future use';
        case 10: return 'reserved for future use';
        case 11: return 'reserved for future use';
        case 12: return 'reserved for future use';
        case 13: return 'reserved for future use';
        case 14: return 'reserved for future use';
        case 15: return 'Not defined';
        default: return `Unknown (${status ?? 'N/A'})`;
    }
};

// export const getVesselStatusDescription = (status?: number): string => {
//     switch (status) {
//         case 0: return 'Under way using engine (0)';
//         case 1: return 'At anchor (1)';
//         case 2: return 'Not under command (2)';
//         case 3: return 'Restricted manoeuvrability (3)';
//         case 4: return 'Constrained by her draught (4)';
//         case 5: return 'Moored (5)';
//         case 6: return 'Aground (6)';
//         case 7: return 'Engaged in Fishing (7)';
//         case 8: return 'Under way sailing (8)';
//         case 9: return 'reserved for future use (9)';
//         case 10: return 'reserved for future use (10)';
//         case 11: return 'reserved for future use (11)';
//         case 12: return 'reserved for future use (12)';
//         case 13: return 'reserved for future use (13)';
//         case 14: return 'reserved for future use (14)';
//         case 15: return 'Not defined (15)';
//         default: return `Unknown (${status ?? 'N/A'})`;
//     }
// };