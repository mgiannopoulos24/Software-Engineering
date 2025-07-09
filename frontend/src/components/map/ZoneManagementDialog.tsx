import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ZoneConstraintDTO, ZoneConstraintType, ZoneDataWithType, ZoneOfInterestDTO } from '@/types/types';
import { ALL_NAV_STATUSES_FOR_MAP, ALL_SHIP_TYPES_FOR_MAP } from '@/utils/mapUtils';
import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  zone: ZoneDataWithType | null;
  onSave: (data: ZoneDataWithType) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const ZoneManagementDialog: React.FC<Props> = ({ isOpen, onClose, zone, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(10000);
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [constraints, setConstraints] = useState<ZoneConstraintDTO[]>([]);

  useEffect(() => {
    if (zone && isOpen) {
      setName(zone.name || '');
      setRadius(zone.radiusInMeters || 10000);
      setLatitude(zone.centerLatitude || 0);
      setLongitude(zone.centerLongitude || 0);
      if (zone.type === 'interest' && 'constraints' in zone) {
        setConstraints(zone.constraints || []);
      } else {
        setConstraints([]);
      }
    }
  }, [zone, isOpen]);

  const hasConstraint = (type: ZoneConstraintType) => constraints.some(c => c.constraintType === type);
  const getConstraintValue = (type: ZoneConstraintType) => constraints.find(c => c.constraintType === type)?.constraintValue || '';

  const toggleConstraint = (type: ZoneConstraintType, checked: boolean) => {
    setConstraints(prev => {
      if (checked) {
        if (!prev.some(c => c.constraintType === type)) {
          const defaultValues: Record<string, string> = {
            [ZoneConstraintType.SPEED_LIMIT_ABOVE]: '15',
            [ZoneConstraintType.SPEED_LIMIT_BELOW]: '2',
            [ZoneConstraintType.FORBIDDEN_SHIP_TYPE]: 'tanker',
            [ZoneConstraintType.UNWANTED_NAV_STATUS]: '1',
          };
          return [...prev, { constraintType: type, constraintValue: defaultValues[type] || '' }];
        }
        return prev;
      } else {
        return prev.filter(c => c.constraintType !== type);
      }
    });
  };

  const updateConstraintValue = (type: ZoneConstraintType, value: string) => {
    setConstraints(prev =>
        prev.map(c => c.constraintType === type ? { ...c, constraintValue: value } : c)
    );
  };

  const handleSave = async () => {
    if (!zone) return;

    // Δημιουργούμε το αντικείμενο για αποθήκευση, διατηρώντας τον τύπο του.
    const saveData: ZoneDataWithType = {
      ...zone,
      name,
      radiusInMeters: radius,
      centerLatitude: latitude, // Χρήση του state
      centerLongitude: longitude, // Χρήση του state
      ...(zone.type === 'interest' && { constraints }),
    };

    await onSave(saveData);
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${zone?.name}"?`)) {
      await onDelete();
      onClose();
    }
  };

  if (!zone) return null;

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Manage {zone.type === 'interest' ? 'Zone of Interest' : 'Collision Zone'}</DialogTitle>
            <DialogDescription>
              Edit the details for "{zone.name}". Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="latitude" className="text-right">Latitude</Label>
              <Input id="latitude" type="number" value={latitude} onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longitude" className="text-right">Longitude</Label>
              <Input id="longitude" type="number" value={longitude} onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="radius" className="text-right">Radius</Label>
              <div className='col-span-3 flex items-center gap-2'>
                <Slider id="radius" value={[radius]} onValueChange={(val) => setRadius(val[0])} min={500} max={50000} step={100} />
                <span className='w-24 text-sm text-center'>{(radius / 1000).toFixed(1)} km</span>
              </div>
            </div>

            {/* Constraints Editor (Μόνο για Interest Zones) */}
            {zone.type === 'interest' && (
                <div className="space-y-4 rounded-md border bg-slate-50 p-4">
                  <h4 className="font-medium leading-none">Constraints</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cb-ZONE_ENTRY" checked={hasConstraint(ZoneConstraintType.ZONE_ENTRY)} onCheckedChange={(checked) => toggleConstraint(ZoneConstraintType.ZONE_ENTRY, !!checked)}/>
                    <Label htmlFor="cb-ZONE_ENTRY" className="font-normal">Notify on vessel entry</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cb-ZONE_EXIT" checked={hasConstraint(ZoneConstraintType.ZONE_EXIT)} onCheckedChange={(checked) => toggleConstraint(ZoneConstraintType.ZONE_EXIT, !!checked)}/>
                    <Label htmlFor="cb-ZONE_EXIT" className="font-normal">Notify on vessel exit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cb-SPEED_LIMIT_ABOVE" checked={hasConstraint(ZoneConstraintType.SPEED_LIMIT_ABOVE)} onCheckedChange={(checked) => toggleConstraint(ZoneConstraintType.SPEED_LIMIT_ABOVE, !!checked)}/>
                    <Label htmlFor="cb-SPEED_LIMIT_ABOVE" className="font-normal">Speed over</Label>
                    <Input type="number" className="h-8 w-20" disabled={!hasConstraint(ZoneConstraintType.SPEED_LIMIT_ABOVE)} value={getConstraintValue(ZoneConstraintType.SPEED_LIMIT_ABOVE)} onChange={(e) => updateConstraintValue(ZoneConstraintType.SPEED_LIMIT_ABOVE, e.target.value)} />
                    <span>kn</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cb-SPEED_LIMIT_BELOW" checked={hasConstraint(ZoneConstraintType.SPEED_LIMIT_BELOW)} onCheckedChange={(checked) => toggleConstraint(ZoneConstraintType.SPEED_LIMIT_BELOW, !!checked)}/>
                    <Label htmlFor="cb-SPEED_LIMIT_BELOW" className="font-normal">Speed under</Label>
                    <Input type="number" className="h-8 w-20" disabled={!hasConstraint(ZoneConstraintType.SPEED_LIMIT_BELOW)} value={getConstraintValue(ZoneConstraintType.SPEED_LIMIT_BELOW)} onChange={(e) => updateConstraintValue(ZoneConstraintType.SPEED_LIMIT_BELOW, e.target.value)} />
                    <span>kn</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cb-FORBIDDEN_SHIP_TYPE" checked={hasConstraint(ZoneConstraintType.FORBIDDEN_SHIP_TYPE)} onCheckedChange={(checked) => toggleConstraint(ZoneConstraintType.FORBIDDEN_SHIP_TYPE, !!checked)}/>
                    <Label htmlFor="cb-FORBIDDEN_SHIP_TYPE" className="font-normal">Forbidden Type</Label>
                    <Select disabled={!hasConstraint(ZoneConstraintType.FORBIDDEN_SHIP_TYPE)} value={getConstraintValue(ZoneConstraintType.FORBIDDEN_SHIP_TYPE)} onValueChange={(val) => updateConstraintValue(ZoneConstraintType.FORBIDDEN_SHIP_TYPE, val)}>
                      <SelectTrigger className="h-8 w-[250px]"><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        {ALL_SHIP_TYPES_FOR_MAP.map(t => <SelectItem key={t} value={t}>{t.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cb-UNWANTED_NAV_STATUS" checked={hasConstraint(ZoneConstraintType.UNWANTED_NAV_STATUS)} onCheckedChange={(checked) => toggleConstraint(ZoneConstraintType.UNWANTED_NAV_STATUS, !!checked)}/>
                    <Label htmlFor="cb-UNWANTED_NAV_STATUS" className="font-normal">Unwanted Status</Label>
                    <Select disabled={!hasConstraint(ZoneConstraintType.UNWANTED_NAV_STATUS)} value={getConstraintValue(ZoneConstraintType.UNWANTED_NAV_STATUS)} onValueChange={(val) => updateConstraintValue(ZoneConstraintType.UNWANTED_NAV_STATUS, val)}>
                      <SelectTrigger className="h-8 w-[250px]"><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        {ALL_NAV_STATUSES_FOR_MAP.map(s => <SelectItem key={s.code} value={s.code}>{s.description}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete}>Delete Zone</Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="button" onClick={handleSave}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};