"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid } from 'lucide-react';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { VisitorEntry } from '@/lib/types';

export default function ResidentApprovalTable() {
  const { user, visitorEntries, fetchVisitorEntries } = useAuth();
  const [pendingEntries, setPendingEntries] = useState<VisitorEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');

  useEffect(() => {
    fetchVisitorEntries();
  }, [fetchVisitorEntries]);

  useEffect(() => {
    if (user && visitorEntries) {
      setPendingEntries(
        visitorEntries.filter(
          (entry) =>
            entry.flatNumber === user.flatNumber &&
            (entry.status === 'pending' || entry.status === 'denied')
        )
      );
    }
  }, [visitorEntries, user]);

  const filteredEntries = pendingEntries.filter(entry => {
    const matchesSearch = entry.visitorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPurpose = filterPurpose === 'all' ? true : entry.purposeOfVisit === filterPurpose;
    // Only show entries with status 'pending' or 'denied'
    const isPendingOrDenied = entry.status === 'pending' || entry.status === 'denied';
    return matchesSearch && matchesPurpose && isPendingOrDenied;
  });

  const uniquePurposes = Array.from(new Set(pendingEntries.map(e => e.purposeOfVisit)));

  const handleApprove = async (entryId: string) => {
    await fetch(`/api/visitors/${entryId}/approve`, { method: 'POST' });
    fetchVisitorEntries();
  };
  const handleDeny = async (entryId: string) => {
    await fetch(`/api/visitors/${entryId}/deny`, { method: 'POST' });
    fetchVisitorEntries();
  };

  if (!user) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Grid className="h-7 w-7 text-green-600" />
          <CardTitle className="text-2xl font-semibold text-green-700">My Visitor Approvals</CardTitle>
        </div>
        <CardDescription>Approve or deny visitors for your flat. Use the search and filter options to quickly find entries.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="relative">
            <Input
              placeholder="Search by visitor name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-4 w-full"
            />
          </div>
          <Select value={filterPurpose} onValueChange={setFilterPurpose}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              {uniquePurposes.map(purpose => (
                <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No pending approvals.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.visitorName}</TableCell>
                    <TableCell>{entry.purposeOfVisit}</TableCell>
                    <TableCell>{format(new Date(entry.entryTimestamp), 'PPpp')}</TableCell>
                    <TableCell>
                      <Button size="sm" className="mr-2" onClick={() => handleApprove(entry.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeny(entry.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Deny
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
