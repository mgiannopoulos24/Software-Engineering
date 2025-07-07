import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FilterValue, RealTimeShipUpdateDTO } from '@/types/types';
import React from 'react';

interface FiltersPanelProps {
    isOpen: boolean;
    filters: { vesselType: string; capacity: number[]; vesselStatus: string };
    selectedVessel: RealTimeShipUpdateDTO | null;
    onFilterChange: (key: string, value: FilterValue) => void;
    onReset: () => void;
    onApply: () => void;
    onClose: () => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({ isOpen, filters, selectedVessel, onFilterChange, onReset, onApply, onClose }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="absolute bottom-16 left-4 z-[999] w-80 rounded-lg border bg-card p-6 shadow-xl">
                <h5 className="mb-4 text-lg font-semibold">Map Filters</h5>

                {/* Vessel Type Filter */}
                <div className="mb-4 space-y-2">
                    <Label htmlFor="vesselType">Type</Label>
                    {/* ... JSX για το select του τύπου πλοίου ... */}
                </div>

                {/* Capacity Filter */}
                <div className="mb-4 space-y-3">
                    <Label>Capacity</Label>
                    {/* ... JSX για το slider ... */}
                </div>

                {/* Vessel Status Filter */}
                <div className="mb-4 space-y-2">
                    <Label htmlFor="vesselStatus">Current Status</Label>
                    {/* ... JSX για το select της κατάστασης ... */}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between space-x-3">
                    <Button variant="outline" onClick={onReset} className="flex-1">Reset</Button>
                    <Button onClick={onApply} className="flex-1">Apply</Button>
                </div>
            </div>
            {/* Click outside to close */}
            <div className="fixed inset-0 z-[998]" onClick={onClose} />
        </>
    );
};

export default FiltersPanel;