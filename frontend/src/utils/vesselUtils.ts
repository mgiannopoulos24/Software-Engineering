// src/utils/vesselUtils.ts

export const getVesselStatusDescription = (status?: number): string => {
    const statuses: { [key: number]: string } = {
        0: 'Under way using engine',
        1: 'At anchor',
        2: 'Not under command',
        3: 'Restricted manoeuverability',
        4: 'Constrained by draught',
        5: 'Moored',
        6: 'Aground',
        7: 'Engaged in Fishing',
        8: 'Under way sailing',
        9: 'reserved for future use',
        10: 'reserved for future use',
        11: 'reserved for future use',
        12: 'reserved for future use',
        13: 'reserved for future use',
        14: 'reserved for future use',
        15: 'Not defined'
    };
    return statuses[status ?? -1] || `Unknown (${status ?? 'N/A'})`;
};

/**
 * export const getVesselStatusDescription = (status?: number): string => {
 *     switch (status) {
 *         case 0: return 'Under way using engine';
 *         case 1: return 'At anchor';
 *         case 2: return 'Not under command';
 *         case 3: return 'Restricted manoeuverability';
 *         case 4: return 'Constrained by her draught';
 *         case 5: return 'Moored';
 *         case 6: return 'Aground';
 *         case 7: return 'Engaged in Fishing';
 *         case 8: return 'Under way sailing';
 *         case 9: return 'reserved for future use';
 *         case 10: return 'reserved for future use';
 *         case 11: return 'reserved for future use';
 *         case 12: return 'reserved for future use';
 *         case 13: return 'reserved for future use';
 *         case 14: return 'reserved for future use';
 *         case 15: return 'Not defined';
 *         default: return `Unknown (${status ?? 'N/A'})`;
 *     }
 *    };
 */

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

// Λίστα με όλους τους τύπους πλοίων για το φίλτρο
export const ALL_SHIP_TYPES = [
    'anti-pollution', 'cargo', 'cargo-hazarda(major)', 'cargo-hazardb',
    'cargo-hazardc(minor)', 'cargo-hazardd(recognizable)', 'divevessel',
    'dredger', 'fishing', 'high-speedcraft', 'lawenforce', 'localvessel',
    'militaryops', 'other', 'passenger', 'pilotvessel', 'pleasurecraft',
    'sailingvessel', 'sar', 'specialcraft', 'tanker', 'tanker-hazarda(major)',
    'tanker-hazardb', 'tanker-hazardc(minor)', 'tanker-hazardd(recognizable)',
    'tug', 'unknown', 'wingingrnd'
].sort(); // Ταξινόμηση για ευκολότερη εύρεση στο UI

// Λίστα με όλες τις καταστάσεις πλοήγησης για το φίλτρο
export const ALL_NAV_STATUSES: { code: number; description: string }[] = [
    { code: 0, description: 'Under way using engine' },
    { code: 1, description: 'At anchor' },
    { code: 2, description: 'Not under command' },
    { code: 3, description: 'Restricted manoeuverability' },
    { code: 4, description: 'Constrained by her draught' },
    { code: 5, description: 'Moored' },
    { code: 6, description: 'Aground' },
    { code: 7, description: 'Engaged in Fishing' },
    { code: 8, description: 'Under way sailing' },
    { code: 9, description: 'reserved for future use' },
    { code: 10, description: 'reserved for future use' },
    { code: 11, description: 'reserved for future use' },
    { code: 12, description: 'reserved for future use' },
    { code: 13, description: 'reserved for future use' },
    { code: 14, description: 'reserved for future use' },
    { code: 15, description: 'Not defined' }
]