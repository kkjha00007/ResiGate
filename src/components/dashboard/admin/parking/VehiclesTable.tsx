// VehiclesTable.tsx
'use client';
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-provider';
import { Car, Bike } from 'lucide-react';

export function VehiclesTable() {
  const { allUsers, allParkingSpots, isAdmin, isSocietyAdmin } = useAuth();

  // Build a flat list of all vehicles (cars and bikes) from user profiles and parking spots
  const vehicles = useMemo(() => {
    // Map userId to allocated spot
    const spotByUserId = Object.fromEntries(
      allParkingSpots.filter(s => s.allocatedToUserId).map(s => [s.allocatedToUserId, s])
    );
    // Collect all users with a vehicleNumber (legacy) or vehicles array (future-proof)
    return allUsers.flatMap(user => {
      // If user.vehicles array exists, use it
      // @ts-ignore: vehicles may not be typed on UserProfile
      if (Array.isArray(user.vehicles) && user.vehicles.length > 0) {
        return user.vehicles.map((v: any) => ({
          type: v.type || 'car',
          flatNumber: user.flatNumber || '',
          vehicleNumber: v.number, // fix: use v.number
          registeredDate: v.addedAt || user.registrationDate || '', // fix: use v.addedAt
          ownerName: user.name || '',
          ownerRole: user.role || '',
          notes: v.notes || '',
          allocatedSpot: spotByUserId[user.id]?.spotNumber || '',
        }));
      }
      // Otherwise, use vehicleNumber on user (legacy)
      // @ts-expect-error: vehicleNumber may not be typed on UserProfile
      if (user.vehicleNumber) {
        return [{
          type: 'car',
          flatNumber: user.flatNumber || '',
          // @ts-expect-error: vehicleNumber may not be typed on UserProfile
          vehicleNumber: user.vehicleNumber,
          registeredDate: user.registrationDate || '',
          ownerName: user.name || '',
          ownerRole: user.role || '',
          notes: '',
          allocatedSpot: spotByUserId[user.id]?.spotNumber || '',
        }];
      }
      return [];
    });
  }, [allUsers, allParkingSpots]);

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">All Registered Vehicles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Flat Number</TableHead>
                <TableHead>Vehicle No.</TableHead>
                <TableHead>Registered Date</TableHead>
                <TableHead>Allocated Spot</TableHead>
                <TableHead>Owner/Renter</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Allocation Until</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">No vehicles registered.</TableCell>
                </TableRow>
              ) : (
                vehicles.map((v, i) => {
                  let allocationUntil = 'Not Applicable';
                  if (v.ownerRole === 'owner') {
                    if (v.registeredDate) {
                      const regDate = new Date(v.registeredDate);
                      regDate.setFullYear(regDate.getFullYear() + 1);
                      allocationUntil = regDate.toLocaleDateString();
                    }
                  }
                  return (
                    <TableRow key={i}>
                      <TableCell>{v.type === 'car' ? <Car className="h-4 w-4 inline text-blue-500" /> : <Bike className="h-4 w-4 inline text-green-500" />} {v.type}</TableCell>
                      <TableCell>{v.flatNumber || 'N/A'}</TableCell>
                      <TableCell>{v.vehicleNumber}</TableCell>
                      <TableCell>{v.registeredDate ? new Date(v.registeredDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{v.allocatedSpot || <span className="text-xs text-muted-foreground">Unallocated</span>}</TableCell>
                      <TableCell className="capitalize">{v.ownerRole}</TableCell>
                      <TableCell>{v.ownerName}</TableCell>
                      <TableCell>{v.notes || ''}</TableCell>
                      <TableCell>{allocationUntil}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
