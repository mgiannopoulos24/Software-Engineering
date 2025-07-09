import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllShips, updateShipType } from '@/services/adminService';
import { ShipDetailsDTO } from '@/types/types';
import { ALL_SHIP_TYPES, getVesselStatusDescription } from '@/utils/vesselUtils';
import {
  Anchor,
  Compass,
  Edit,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Ship as ShipIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const EditShipTypeDialog: React.FC<{
  ship: ShipDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mmsi: number, newType: string) => Promise<void>;
}> = ({ ship, isOpen, onClose, onSave }) => {
  const [selectedType, setSelectedType] = useState(ship.shiptype || 'unknown');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(ship.shiptype || 'unknown');
    }
  }, [isOpen, ship]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(ship.mmsi, selectedType);
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ship Type for MMSI: {ship.mmsi}</DialogTitle>
          <DialogDescription>
            Select a new type for this vessel. This change will be permanent.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {ALL_SHIP_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminVesselCard: React.FC<{
  vessel: ShipDetailsDTO;
  onEdit: (vessel: ShipDetailsDTO) => void;
}> = ({ vessel, onEdit }) => {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <ShipIcon className="mr-3 h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{vessel.mmsi}</h3>
            <p className="text-xs capitalize text-gray-500">
              Type: {vessel.shiptype?.replace(/-/g, ' ') || 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow space-y-3">
        <div className="flex items-center text-sm">
          <MapPin className="mr-3 h-5 w-5 text-gray-400" />
          <span>
            Lat: {vessel.latitude?.toFixed(4) ?? 'N/A'}, Lon:{' '}
            {vessel.longitude?.toFixed(4) ?? 'N/A'}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <Gauge className="mr-3 h-5 w-5 text-gray-400" />
          <span>Speed: {vessel.speedOverGround?.toFixed(1) ?? 'N/A'} kn</span>
        </div>
        <div className="flex items-center text-sm">
          <Compass className="mr-3 h-5 w-5 text-gray-400" />
          <span>Course: {vessel.courseOverGround?.toFixed(1) ?? 'N/A'}°</span>
        </div>
        <div className="flex items-center text-sm">
          <Anchor className="mr-3 h-5 w-5 text-gray-400" />
          <span>Status: {getVesselStatusDescription(vessel.navigationalStatus)}</span>
        </div>
      </div>

      <div className="mt-6">
        <Button className="w-full" onClick={() => onEdit(vessel)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Type
        </Button>
      </div>
    </div>
  );
};

const ManageShips: React.FC = () => {
  const [ships, setShips] = useState<ShipDetailsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShip, setSelectedShip] = useState<ShipDetailsDTO | null>(null);

  const fetchShips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllShips();
      setShips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ships.');
      toast.error('Loading Failed', { description: error || 'Could not fetch ship data.' });
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchShips();
  }, [fetchShips]);

  const handleOpenEditDialog = (ship: ShipDetailsDTO) => {
    setSelectedShip(ship);
    setIsEditDialogOpen(true);
  };

  const handleSaveShipType = async (mmsi: number, newType: string) => {
    try {
      const updatedShip = await updateShipType(mmsi, newType);
      setShips((prevShips) => prevShips.map((ship) => (ship.mmsi === mmsi ? updatedShip : ship)));
      toast.success(`Ship ${mmsi} type updated to ${newType}.`);
      setIsEditDialogOpen(false);
    } catch (err) {
      toast.error('Update Failed', {
        description: err instanceof Error ? err.message : 'Could not update ship type.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[89vh] w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600">Loading all system vessels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-auto min-h-[89vh] w-full flex-col bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage All Ships</h1>
            <p className="mt-2 text-gray-600">
              View and manage all registered vessels in the system ({ships.length} total).
            </p>
          </div>
          <Button variant="outline" onClick={fetchShips} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-700">
            <p>{error}</p>
          </div>
        )}

        {ships.length === 0 && !loading && !error ? (
          <div className="mt-16 text-center">
            <ShipIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-xl font-medium text-gray-900">No Ships Found</h3>
            <p className="mt-2 text-base text-gray-500">
              There are no vessels registered in the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ships.map((vessel) => (
              <AdminVesselCard key={vessel.mmsi} vessel={vessel} onEdit={handleOpenEditDialog} />
            ))}
          </div>
        )}
      </div>

      {selectedShip && (
        <EditShipTypeDialog
          ship={selectedShip}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveShipType}
        />
      )}
    </div>
  );
};

export default ManageShips;
