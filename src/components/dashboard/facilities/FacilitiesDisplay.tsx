
// src/components/dashboard/facilities/FacilitiesDisplay.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import type { Facility } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Info, CalendarClock, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FacilitiesDisplay() {
  const { facilities, fetchFacilities, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    // Facilities are fetched in AuthProvider's initialDataFetch
    // If they might not be loaded yet, or if you want to re-fetch on this page visit:
    // fetchFacilities(); 
  }, [fetchFacilities]);

  const activeFacilities = useMemo(() => {
    return facilities.filter(facility => facility.isActive);
  }, [facilities]);

  if (authIsLoading && facilities.length === 0) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/5 mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-1" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Society Facilities</CardTitle>
              <CardDescription>Explore the facilities available in our society. Booking options coming soon!</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {activeFacilities.length === 0 ? (
        <div className="text-center py-10">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No active facilities are available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeFacilities.map((facility) => (
            <Card key={facility.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary">{facility.name}</CardTitle>
                {facility.capacity && (
                  <Badge variant="outline" className="mt-1 w-fit">
                    <Users className="h-3.5 w-3.5 mr-1.5" /> Capacity: {facility.capacity}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                {facility.description && (
                  <p className="text-muted-foreground line-clamp-3">{facility.description}</p>
                )}
                {facility.bookingRules && (
                  <div className="p-3 bg-secondary/30 rounded-md border border-secondary">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 mr-2 mt-0.5 text-primary/80 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground/90 mb-0.5">Booking Notes/Rules:</h4>
                        <p className="text-muted-foreground text-xs whitespace-pre-line">{facility.bookingRules}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              {/* Placeholder for booking button in future */}
              {/* <CardFooter className="pt-3 border-t">
                <Button size="sm" className="w-full" disabled>
                  <CalendarClock className="mr-2 h-4 w-4" /> View Availability / Book (Coming Soon)
                </Button>
              </CardFooter> */}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
