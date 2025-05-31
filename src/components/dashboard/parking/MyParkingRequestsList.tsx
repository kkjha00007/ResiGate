// src/components/dashboard/parking/MyParkingRequestsList.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { ParkingRequest } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export function MyParkingRequestsList() {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<ParkingRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      const res = await fetch(`/api/parking/requests?societyId=${user.societyId}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data.filter((r: ParkingRequest) => r.userId === user.id && (r.status === 'pending' || r.status === 'queued' || r.status === 'rejected')) : []);
      setLoading(false);
    };
    fetchRequests();
  }, [user, refreshKey]);

  if (loading) return <div>Loading your parking requests...</div>;

  if (!requests.length) return null;

  return (
    <Card className="mt-8 shadow-lg border border-border">
      <CardHeader className="bg-blue-50 border-b">
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl font-semibold text-primary">My Parking Requests</CardTitle>
          <CardDescription className="ml-2 text-muted-foreground">Track the status of your parking allocation requests and admin replies.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border bg-white">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-blue-100">
                <TableHead className="font-semibold text-blue-900">Type</TableHead>
                <TableHead className="font-semibold text-blue-900">Vehicle</TableHead>
                <TableHead className="font-semibold text-blue-900">Status</TableHead>
                <TableHead className="font-semibold text-blue-900">Admin Comment</TableHead>
                <TableHead className="font-semibold text-blue-900">Requested On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id} className="hover:bg-blue-50/50 transition-colors">
                  <TableCell className="capitalize font-medium">{r.type}</TableCell>
                  <TableCell>{r.vehicleNumber}</TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === 'pending' ? 'secondary' :
                      r.status === 'approved' ? 'default' :
                      r.status === 'queued' ? 'outline' :
                      r.status === 'rejected' ? 'destructive' : 'outline'
                    } className="capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.adminComment || '-'}</TableCell>
                  <TableCell>{format(parseISO(r.createdAt), 'PPpp')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
