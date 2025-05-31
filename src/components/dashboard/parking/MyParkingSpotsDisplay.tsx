// src/components/dashboard/parking/MyParkingSpotsDisplay.tsx
'use client';

import React, { useEffect } from 'react';
import type { ParkingSpot } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Bike, MapPin, Hash, ParkingCircleOff, ParkingSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkingRequestForm } from './ParkingRequestForm';
import { MyParkingRequestsList } from './MyParkingRequestsList';

export function MyParkingSpotsDisplay() {
  const { myParkingSpots, fetchMyParkingSpots, isLoading: authIsLoading, user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMyParkingSpots();
    }
  }, [user, fetchMyParkingSpots]);

  const getSpotTypeIcon = (type: ParkingSpot['type']) => {
    return type === 'car' ? <Car className="h-5 w-5 text-blue-500" /> : <Bike className="h-5 w-5 text-green-500" />;
  };

  if (authIsLoading && myParkingSpots.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(1)].map((_, i) => (
          <Card key={i} className="bg-muted/30 p-4">
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (myParkingSpots.length === 0) {
    return (
      <div>
        <div className="text-center py-10 text-muted-foreground">
          <ParkingCircleOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No parking spot has been assigned to you at the moment.</p>
          <p className="text-sm mt-1">If you need a parking spot, you can request allocation below.</p>
        </div>
        <div className="max-w-xl mx-auto">
          <ParkingRequestForm />
        </div>
        <MyParkingRequestsList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myParkingSpots.map((spot) => (
        <Card key={spot.id} className="overflow-hidden shadow-md border border-border hover:shadow-lg transition-shadow">
          <CardHeader className="bg-secondary/50 p-4 border-b">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ParkingSquare className="h-7 w-7 text-primary" />
                    <CardTitle className="text-xl text-primary">{spot.spotNumber}</CardTitle>
                </div>
              {getSpotTypeIcon(spot.type)}
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Location:</p>
              <p className="font-medium flex items-center gap-1"><MapPin className="h-4 w-4 text-primary/70"/> {spot.location}</p>
            </div>
            {spot.vehicleNumber && (
              <div>
                <p className="text-muted-foreground">Registered Vehicle:</p>
                <p className="font-medium flex items-center gap-1"><Hash className="h-4 w-4 text-primary/70"/> {spot.vehicleNumber}</p>
              </div>
            )}
            {spot.notes && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Admin Notes:</p>
                <p className="font-medium italic text-xs">{spot.notes}</p>
              </div>
            )}
             <div className="sm:col-span-2 mt-2">
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Allocated</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
