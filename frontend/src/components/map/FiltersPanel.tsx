// src/components/map/FiltersPanel.tsx

import { Button } from '@/components/ui/button';
import { ListFilter } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ALL_NAV_STATUSES, ALL_SHIP_TYPES } from '@/utils/vesselUtils';
import React from 'react';

// Ορίζουμε έναν πιο συγκεκριμένο τύπο για τα φίλτρα
export interface FilterState {
    vesselType: string[];
    vesselStatus: string[];
}

interface FiltersPanelProps {
    isOpen: boolean;
    filters: FilterState; // Χρήση του νέου τύπου
    onMultiSelectChange: (key: keyof FilterState, value: string) => void;
    onReset: () => void;
    onClose: () => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
                                                       isOpen,
                                                       filters,
                                                       onMultiSelectChange,
                                                       onReset,
                                                       onClose,
                                                   }) => {
    if (!isOpen) return null;

    // Βοηθητική συνάρτηση για να δείχνει πόσα φίλτρα είναι ενεργά
    const getTriggerText = (selectedItems: string[], placeholder: string) => {
        if (selectedItems.length === 0) return `All ${placeholder}`;
        if (selectedItems.length === 1) return `1 ${placeholder} selected`;
        return `${selectedItems.length} ${placeholder}s selected`;
    };

    return (
        <div className="absolute bottom-16 left-4 z-[999] w-80 rounded-lg border bg-card p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">Map Filters</h5>
                <Button variant="ghost" size="sm" onClick={onReset}>
                    Reset All
                </Button>
            </div>
            <div className="mt-4 space-y-4">
                {/* Vessel Type Multi-Select Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>{getTriggerText(filters.vesselType, 'Type')}</span>
                            <ListFilter className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 z-[1000]" align="start">
                        <DropdownMenuLabel>Filter by Vessel Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_SHIP_TYPES.map((type) => (
                            <DropdownMenuCheckboxItem
                                key={type}
                                checked={filters.vesselType.includes(type)}
                                onSelect={(e) => {
                                    e.preventDefault(); // Αποτρέπει το αυτόματο κλείσιμο του μενού
                                    onMultiSelectChange('vesselType', type);
                                }}
                                className="capitalize"
                            >
                                {type.replace(/-/g, ' ')}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Vessel Status Multi-Select Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>{getTriggerText(filters.vesselStatus, 'Status')}</span>
                            <ListFilter className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 z-[1000]" align="start">
                        <DropdownMenuLabel>Filter by Navigational Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_NAV_STATUSES.map((status) => (
                            <DropdownMenuCheckboxItem
                                key={status.code}
                                checked={filters.vesselStatus.includes(status.code.toString())}
                                onSelect={(e) => {
                                    e.preventDefault(); // Αποτρέπει το αυτόματο κλείσιμο του μενού
                                    onMultiSelectChange('vesselStatus', status.code.toString());
                                }}
                            >
                                {status.description}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Button onClick={onClose} className="w-full mt-6">
                Close
            </Button>
        </div>
    );
};

export default FiltersPanel;