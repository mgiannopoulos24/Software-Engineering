import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React from 'react';

type ZoneType = 'interest' | 'collision';

interface ZoneControlsProps {
  activeZoneType: ZoneType;
  isCreatingZone: boolean;
  onZoneTypeChange: (value: ZoneType) => void;
  onToggleCreation: () => void;
}

const ZoneControls: React.FC<ZoneControlsProps> = ({
  activeZoneType,
  isCreatingZone,
  onZoneTypeChange,
  onToggleCreation,
}) => {
  return (
    <div className="absolute right-6 top-4 z-[10] flex flex-col items-end space-y-2">
      <div className="rounded-md bg-black/80 px-3 py-2">
        <Label className="text-sm font-medium text-white">Zone Creation</Label>

        <Select value={activeZoneType} onValueChange={onZoneTypeChange}>
          <SelectTrigger className="mt-1 w-[200px] border-gray-600 bg-gray-700 text-white">
            <SelectValue placeholder="Select Zone Type" />
          </SelectTrigger>
          <SelectContent className="z-[999]">
            <SelectItem value="collision">Collision Zone</SelectItem>
            <SelectItem value="interest">Interest Zone</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onToggleCreation}
          className={`mt-2 w-full ${
            isCreatingZone
              ? 'bg-gray-500 hover:bg-gray-600'
              : activeZoneType === 'collision'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isCreatingZone
            ? 'Cancel Creation'
            : `Add ${activeZoneType === 'collision' ? 'Collision Zone' : 'Interest Zone'}`}
        </Button>
      </div>
    </div>
  );
};

export default ZoneControls;
