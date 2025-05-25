
'use client';

import React, { useEffect, useState } from 'react';
import type { ParkingSpot, ParkingSpotStatus, ParkingSpotType, UserProfile } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, Car, Bike, CheckCircle, XCircle, ParkingSquareOff, ParkingCircle, User, Home, Hash, Info } from 'lucide-react';
import { PARKING_SPOT_STATUSES, PARKING_SPOT_TYPES } from '@/lib/constants';
import { EditParkingSpotDialog } from './EditParkingSpotDialog'; // To be created
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';


export function ParkingSpotsTable() {
  const { allParkingSpots, fetchAllParkingSpots, deleteParkingSpot, isLoading: authIsLoading, allUsers } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchAllParkingSpots();
  }, [fetchAllParkingSpots]);

  const handleDelete = async (spotId: string) => {
    setIsProcessing(spotId);
    await deleteParkingSpot(spotId);
    setIsProcessing(null);
  };

  const handleEditAssign = (spot: ParkingSpot) => {
    setEditingSpot(spot);
    setIsFormOpen(true);
  };

  const getSpotStatusVariant = (status: ParkingSpotStatus) => {
    return status === 'allocated' ? 'default' : 'secondary';
  };

  const getSpotTypeIcon = (type: ParkingSpotType) => {
    return type === 'car' ? <Car className="h-5 w-5 text-blue-500" /> : <Bike className="h-5 w-5 text-green-500" />;
  };
  
  const findUserName = (userId?: string) => {
    if (!userId) return 'N/A';
    const user = allUsers.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  if (authIsLoading && allParkingSpots.length === 0) {
     return (
      <Card className="shadow-lg mt-8">
        <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Parking Spot Inventory</CardTitle>
            <CardDescription>View, assign, and manage all parking spots.</CardDescription>
        </CardHeader>
        <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border-b">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
                 <Skeleton className="h-8 w-24 ml-auto" />
              </div>
            ))}
        </CardContent>
      </Card>
    );
  }


  return (
    <>
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Parking Spot Inventory</CardTitle>
          <CardDescription>View, assign, and manage all parking spots.</CardDescription>
        </CardHeader>
        <CardContent>
          {allParkingSpots.length === 0 ? (
            <div className="text-center py-10">
              <ParkingCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No parking spots have been defined yet.</p>
              <p className="text-sm mt-1">Use the form above to add new parking spots.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Spot No.</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Allocated To</TableHead>
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allParkingSpots.map((spot) => (
                    <TableRow key={spot.id}>
                      <TableCell className="font-medium">{spot.spotNumber}</TableCell>
                      <TableCell className="text-center">{getSpotTypeIcon(spot.type)}</TableCell>
                      <TableCell>{spot.location}</TableCell>
                      <TableCell>
                        <Badge variant={getSpotStatusVariant(spot.status)} className="capitalize">
                          {spot.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {spot.allocatedToFlatNumber ? (
                            <div className="flex flex-col text-xs">
                                <span className="flex items-center gap-1"><Home className="h-3 w-3"/>{spot.allocatedToFlatNumber}</span>
                                {spot.allocatedToUserId && <span className="flex items-center gap-1"><User className="h-3 w-3"/>{findUserName(spot.allocatedToUserId)}</span>}
                            </div>
                        ) : <Badge variant="outline">Available</Badge>}
                      </TableCell>
                      <TableCell>{spot.vehicleNumber || 'N/A'}</TableCell>
                      <TableCell className="truncate max-w-[150px] text-xs">{spot.notes || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAssign(spot)}
                          disabled={isProcessing === spot.id}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit3 className="mr-1 h-4 w-4" /> Edit/Assign
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isProcessing === spot.id}>
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete parking spot <strong>{spot.spotNumber}</strong>?
                                {spot.status === 'allocated' && " This spot is currently allocated. Deleting it will unassign it."}
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(spot.id)}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={isProcessing === spot.id}
                              >
                                {isProcessing === spot.id ? 'Deleting...' : 'Confirm Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {editingSpot && (
        <EditParkingSpotDialog
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingSpot(null);
          }}
          spot={editingSpot}
        />
      )}
    </>
  );
}
