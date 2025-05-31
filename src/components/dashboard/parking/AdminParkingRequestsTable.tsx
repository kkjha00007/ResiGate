// src/components/dashboard/parking/AdminParkingRequestsTable.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { ParkingRequest } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminParkingRequestsTable({ societyId }: { societyId: string }) {
  const [requests, setRequests] = useState<ParkingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch(`/api/parking/requests?societyId=${societyId}`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [societyId]);

  const updateRequest = async (id: string, status: string) => {
    setEditingId(id);
    const req = requests.find(r => r.id === id);
    if (!req) return;
    await fetch(`/api/parking/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminComment, societyId }),
    });
    setAdminComment('');
    setEditingId(null);
    await fetchRequests();
  };

  if (loading) return <div>Loading parking requests...</div>;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Parking Allocation Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Flat</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Admin Comment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.userName}</TableCell>
                <TableCell>{r.flatNumber}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.vehicleNumber}</TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell>{r.notes}</TableCell>
                <TableCell>
                  {editingId === r.id ? (
                    <Input value={adminComment} onChange={e => setAdminComment(e.target.value)} placeholder="Add comment" />
                  ) : (
                    r.adminComment || '-'
                  )}
                </TableCell>
                <TableCell>
                  {editingId === r.id ? (
                    <>
                      <Button size="sm" onClick={() => updateRequest(r.id, 'approved')}>Approve</Button>
                      <Button size="sm" onClick={() => updateRequest(r.id, 'queued')}>Queue</Button>
                      <Button size="sm" onClick={() => updateRequest(r.id, 'rejected')}>Reject</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => { setEditingId(r.id); setAdminComment(r.adminComment || ''); }}>Manage</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
