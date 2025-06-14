'use client';
import { CreateParkingSpotForm } from '@/components/dashboard/admin/parking/CreateParkingSpotForm';
import { ParkingSpotsTable } from '@/components/dashboard/admin/parking/ParkingSpotsTable';
import { ParkingRequestsAdminTable } from '@/components/dashboard/admin/parking/ParkingRequestsAdminTable';
import { VehiclesTable } from '@/components/dashboard/admin/parking/VehiclesTable';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, User, Home, Hash, CheckCircle, XCircle } from 'lucide-react';

export default function ManageParkingPage() {
  const { user, isLoading, isAdmin, isSocietyAdmin } = useAuth();
  const router = useRouter();
  const [rotationHistory, setRotationHistory] = useState<any[]>([]);
  const [rotating, setRotating] = useState(false);
  const [rotationError, setRotationError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rotationPreview, setRotationPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin() && !isSocietyAdmin()))) {
      router.replace('/no-access');
    }
  }, [user, isLoading, isAdmin, isSocietyAdmin, router]);

  // Fetch rotation history
  useEffect(() => {
    if (user?.societyId) {
      fetch(`/api/parking/rotation?societyId=${user.societyId}`)
        .then(res => res.json())
        .then(setRotationHistory)
        .catch(() => setRotationHistory([]));
    }
  }, [user?.societyId, rotating]);

  const triggerRotation = async () => {
    if (!user?.societyId) return;
    setRotating(true);
    setRotationError(null);
    try {
      const res = await fetch('/api/parking/rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId: user.societyId }),
      });
      if (!res.ok) throw new Error('Rotation failed');
      await res.json();
    } catch (e: any) {
      setRotationError(e.message || 'Rotation failed');
    } finally {
      setRotating(false);
    }
  };

  const handlePreviewRotation = async () => {
    if (!user?.societyId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setRotationPreview(null);
    try {
      const res = await fetch('/api/parking/rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId: user.societyId, confirm: false }),
      });
      if (!res.ok) throw new Error('Failed to fetch preview');
      const data = await res.json();
      setRotationPreview(data.preview);
      setPreviewOpen(true);
    } catch (e: any) {
      setPreviewError(e.message || 'Failed to fetch preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmRotation = async () => {
    if (!user?.societyId) return;
    setConfirming(true);
    setRotationError(null);
    try {
      const res = await fetch('/api/parking/rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId: user.societyId, confirm: true }),
      });
      if (!res.ok) throw new Error('Rotation failed');
      await res.json();
      setPreviewOpen(false);
      setRotationPreview(null);
      setTimeout(() => setRotating(false), 500); // ensure spinner stops
      // Refetch rotation history
      fetch(`/api/parking/rotation?societyId=${user.societyId}`)
        .then(res => res.json())
        .then(setRotationHistory)
        .catch(() => setRotationHistory([]));
    } catch (e: any) {
      setRotationError(e.message || 'Rotation failed');
    } finally {
      setConfirming(false);
    }
  };

  if (isLoading || !user || (!isAdmin() && !isSocietyAdmin())) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreateParkingSpotForm />
      <Separator />
      <ParkingSpotsTable />
      <VehiclesTable />
      <ParkingRequestsAdminTable />
      {/* Rotational Parking Section - moved to end */}
      <div className="bg-blue-50 border p-4 rounded-md mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-blue-900">Rotational Parking Allocation</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreviewRotation}
              disabled={previewLoading || rotating}
            >
              {previewLoading ? 'Loading Preview...' : 'Preview Rotation'}
            </Button>
            <Button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={triggerRotation}
              disabled={rotating}
            >
              {rotating ? 'Rotating...' : 'Trigger Rotation'}
            </Button>
          </div>
        </div>
        {rotationError && <div className="text-red-600 mb-2">{rotationError}</div>}
        <div className="max-h-48 overflow-y-auto mt-2">
          <h3 className="font-medium mb-1">Rotation History</h3>
          {rotationHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rotation history yet.</div>
          ) : (
            <ul className="text-xs space-y-2">
              {rotationHistory.map((h, i) => (
                <li key={h.id || i} className="border-b pb-1">
                  <span className="font-semibold">{new Date(h.date).toLocaleString()}</span> -
                  Deallocated: {h.deallocatedUserIds?.join(', ') || 'None'} | Allocated: {h.allocatedUserIds?.join(', ') || 'None'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Rotation Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotational Parking Preview</DialogTitle>
            <DialogDescription>
              The following allocations and deallocations will occur if you confirm this rotation. Please review carefully.
            </DialogDescription>
          </DialogHeader>
          {previewError && <div className="text-red-600 mb-2">{previewError}</div>}
          {!rotationPreview ? (
            <div className="text-center text-muted-foreground">No preview data available.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">To Deallocate</h4>
                {rotationPreview.toDeallocate.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No spots will be deallocated.</div>
                ) : (
                  <ul className="text-xs space-y-1">
                    {rotationPreview.toDeallocate.map((d: any, idx: number) => (
                      <li key={d.spotId} className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span>Spot <b>{d.spotNumber}</b> ({d.spotId}) - User: <b>{d.allocatedToFlatNumber}</b> ({d.allocatedToUserId})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-1">To Allocate</h4>
                {rotationPreview.queuedRequests.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No queued requests older than 1 year.</div>
                ) : (
                  <ul className="text-xs space-y-1">
                    {rotationPreview.queuedRequests.map((q: any, idx: number) => (
                      <li key={q.id} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Request by <b>{q.userName}</b> (Flat {q.flatNumber}, User: {q.userId}) for vehicle <b>{q.vehicleNumber}</b></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleConfirmRotation}
              disabled={confirming || !rotationPreview || rotationPreview.toDeallocate.length === 0}
              className="bg-blue-600 text-white"
            >
              {confirming ? 'Applying...' : 'Confirm & Apply Rotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
