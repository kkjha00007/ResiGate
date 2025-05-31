// src/components/dashboard/admin/parking/ParkingRequestsAdminTable.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { ParkingRequest } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function ParkingRequestsAdminTable() {
  const { user, fetchAllParkingSpots } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ParkingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState<{[id: string]: string}>({});

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      const res = await fetch(`/api/parking/requests?societyId=${user.societyId}`);
      const data = await res.json();
      // Only show queued and rejected requests (approved are now assigned and should not show)
      setRequests(Array.isArray(data) ? data.filter((r: ParkingRequest) => r.status === 'queued' || r.status === 'rejected' || r.status === 'pending') : []);
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  const handleUpdate = async (id: string, status: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setUpdatingId(id);
    let result: any = null;
    try {
      const response = await fetch(`/api/parking/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminComment: adminComment[id], societyId: req.societyId }),
      });
      result = await response.json();
      // Show toast based on result
      if (status === 'approved') {
        if (result && result.queued) {
          toast({ title: 'No Spot Available', description: 'No available spot found. Request has been queued.', variant: 'destructive' });
        } else {
          toast({ title: 'Parking Spot Assigned', description: 'Spot successfully assigned to user.', variant: 'default' });
        }
      } else if (status === 'queued') {
        toast({ title: 'Request Queued', description: 'Request has been queued.', variant: 'default' });
      } else if (status === 'rejected') {
        toast({ title: 'Request Rejected', description: 'Request has been rejected.', variant: 'destructive' });
      }
      // Refresh spot inventory if spot was assigned
      if (status === 'approved' && fetchAllParkingSpots) {
        fetchAllParkingSpots();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update request.', variant: 'destructive' });
    }
    setUpdatingId(null);
    // Refetch
    if (!user) return;
    const res = await fetch(`/api/parking/requests?societyId=${user.societyId}`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data.filter((r: ParkingRequest) => r.status === 'queued' || r.status === 'rejected' || r.status === 'pending') : []);
  };

  if (loading) return <div>Loading parking requests...</div>;

  return (
    <Card className="mt-8 shadow-lg border border-border">
      <CardHeader className="bg-blue-50 border-b">
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl font-semibold text-primary">Parking Allocation Requests</CardTitle>
          <CardDescription className="ml-2 text-muted-foreground">Review, approve, queue, or comment on parking requests.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border bg-white">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-blue-100">
                <TableHead className="font-semibold text-blue-900">User</TableHead>
                <TableHead className="font-semibold text-blue-900">Flat</TableHead>
                <TableHead className="font-semibold text-blue-900">Type</TableHead>
                <TableHead className="font-semibold text-blue-900">Vehicle</TableHead>
                <TableHead className="font-semibold text-blue-900">Status</TableHead>
                <TableHead className="font-semibold text-blue-900">Admin Comment</TableHead>
                <TableHead className="font-semibold text-blue-900">Requested On</TableHead>
                <TableHead className="font-semibold text-blue-900 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id} className="hover:bg-blue-50/50 transition-colors">
                  <TableCell className="font-medium">{r.userName}</TableCell>
                  <TableCell>{r.flatNumber}</TableCell>
                  <TableCell className="capitalize">{r.type}</TableCell>
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
                  <TableCell>
                    <input
                      className="border rounded px-2 py-1 text-xs w-32 bg-slate-50 focus:bg-white focus:border-primary"
                      value={adminComment[r.id] ?? r.adminComment ?? ''}
                      onChange={e => setAdminComment({ ...adminComment, [r.id]: e.target.value })}
                      placeholder="Add comment"
                    />
                  </TableCell>
                  <TableCell>{format(parseISO(r.createdAt), 'PPpp')}</TableCell>
                  <TableCell className="space-x-1 text-center">
                    {['approved', 'queued', 'rejected'].map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={r.status === status ? 'default' : 'outline'}
                        disabled={updatingId === r.id || r.status === status}
                        onClick={() => handleUpdate(r.id, status)}
                        className="text-xs px-2 py-1"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
