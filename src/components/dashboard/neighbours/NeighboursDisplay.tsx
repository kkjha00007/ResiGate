'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { NeighbourProfile } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Home, Search, Users2, UserCircle } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

// Add DiceBear avatar base URL for micah (modern, memoji-style)
const getDiceBearMicahAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=ffb703,219ebc,8ecae6,ffbe0b,fb8500,e63946&radius=50`;

export function NeighboursDisplay() {
  const { approvedResidents, fetchApprovedResidents, isLoading: authIsLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    setIsLoadingData(true);
    fetchApprovedResidents().finally(() => setIsLoadingData(false));
  }, [fetchApprovedResidents]);

  const filteredResidents = useMemo(() => {
    return approvedResidents.filter(resident =>
      resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resident.flatNumber && resident.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [approvedResidents, searchTerm]);

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';
  };

  const combinedLoading = authIsLoading || isLoadingData;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Users2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-semibold text-primary">Our Neighbours</CardTitle>
                <CardDescription>Directory of approved residents in the society.</CardDescription>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {combinedLoading && filteredResidents.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="shadow-md flex flex-col animate-pulse">
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                <Skeleton className="h-24 w-24 rounded-full bg-muted" />
                <Skeleton className="h-5 w-3/4 bg-muted rounded" />
                <Skeleton className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredResidents.length === 0 ? (
        <div className="text-center py-10">
          <UserCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {approvedResidents.length === 0 ? "No resident information is available at this time." : "No residents found matching your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredResidents.map((resident) => (
            <Card key={resident.id} className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-2 text-center">
                <div className="relative h-24 w-24 mb-3">
                  <img
                    src={getDiceBearMicahAvatar(resident.id || resident.name)}
                    alt={resident.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-2 border-primary/20 bg-white h-24 w-24"
                    data-ai-hint="person avatar"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg font-semibold text-primary">{resident.name}</h3>
                {resident.flatNumber && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Home className="h-4 w-4 mr-1.5 text-primary/70" />
                    <span>Flat: {resident.flatNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
