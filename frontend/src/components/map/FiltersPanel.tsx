import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ALL_NAV_STATUSES, ALL_SHIP_TYPES } from '@/utils/vesselUtils';
import { ListFilter } from 'lucide-react';
import React from 'react';

export interface FilterState {
  vesselType: string[];
  vesselStatus: string[];
  speedRange: [number, number];
  myFleetOnly: boolean;
  mmsiSearch: string;
}

interface FiltersPanelProps {
  isOpen: boolean;
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  onClose: () => void;
  isAuthenticated: boolean;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isOpen,
  filters,
  onFilterChange,
  onReset,
  onClose,
  isAuthenticated,
}) => {
  if (!isOpen) return null;

  const getTriggerText = (selectedItems: string[], placeholder: string) => {
    if (selectedItems.length === 0) return `All ${placeholder}`;
    if (selectedItems.length === 1) return `1 ${placeholder} selected`;
    return `${selectedItems.length} ${placeholder}s selected`;
  };

  const handleMultiSelectChange = (key: 'vesselType' | 'vesselStatus', value: string) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFilterChange(key, newValues);
  };

  return (
    <div className="absolute bottom-16 left-4 z-[999] w-80 rounded-lg border bg-card p-4 shadow-xl duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-semibold">Map Filters</h5>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset All
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="mmsi-search">Search by MMSI</Label>
          <Input
            id="mmsi-search"
            placeholder="e.g., 227338000"
            value={filters.mmsiSearch}
            onChange={(e) => onFilterChange('mmsiSearch', e.target.value)}
            className="mt-1"
          />
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <Checkbox
              id="my-fleet"
              checked={filters.myFleetOnly}
              onCheckedChange={(checked) => onFilterChange('myFleetOnly', !!checked)}
            />
            <Label htmlFor="my-fleet" className="font-semibold text-blue-700">
              Show My Fleet Only
            </Label>
          </div>
        )}

        <div>
          <Label>Speed (knots)</Label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium">{filters.speedRange[0]}</span>
            <Slider
              value={filters.speedRange}
              onValueChange={(value) => onFilterChange('speedRange', [value[0], value[1]])}
              min={0}
              max={50}
              step={1}
              minStepsBetweenThumbs={1}
            />
            <span className="text-xs font-medium">{filters.speedRange[1]}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{getTriggerText(filters.vesselType, 'Type')}</span>
              <ListFilter className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-[1000] w-72" align="start">
            <DropdownMenuLabel>Filter by Vessel Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_SHIP_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.vesselType.includes(type)}
                onSelect={(e) => {
                  e.preventDefault();
                  handleMultiSelectChange('vesselType', type);
                }}
                className="capitalize"
              >
                {type.replace(/-/g, ' ')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{getTriggerText(filters.vesselStatus, 'Status')}</span>
              <ListFilter className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-[1000] w-72" align="start">
            <DropdownMenuLabel>Filter by Navigational Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_NAV_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.code}
                checked={filters.vesselStatus.includes(status.code.toString())}
                onSelect={(e) => {
                  e.preventDefault();
                  handleMultiSelectChange('vesselStatus', status.code.toString());
                }}
              >
                {status.description}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button onClick={onClose} className="mt-6 w-full">
        Apply & Close
      </Button>
    </div>
  );
};

export default FiltersPanel;
