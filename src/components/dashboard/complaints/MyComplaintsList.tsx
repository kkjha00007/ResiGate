
'use client';

import React, { useEffect } from 'react';
import type { Complaint } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ListOrdered, ScrollText } from 'lucide-react';

export function MyComplaintsList() {
  const { user, myComplaints, fetchMyComplaints, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMyComplaints();
    }
  }, [user, fetchMyComplaints]);

  const getStatusVariant = (status: Complaint['status']) => {
    switch (status) {
      case 'Open': return 'secondary';
      case 'In Progress': return 'default'; // Or 'info' if you add such a variant
      case 'Resolved': return 'outline'; // or a success-like variant
      case 'Closed': return 'destructive'; // Or a muted variant
      default: return 'outline';
    }
  };
  
  if (isLoading && myComplaints.length === 0) {
    return (
      <Card>
        <CardHeader>
             <div className="flex items-center gap-3">
                <ListOrdered className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-semibold text-primary">My Submitted Complaints</CardTitle>
                    <CardDescription>A log of all complaints you have submitted.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Loading your complaints...</p>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
         <div className="flex items-center gap-3">
            <ListOrdered className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl font-semibold text-primary">My Submitted Complaints</CardTitle>
                <CardDescription>A log of all complaints you have submitted.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {myComplaints.length === 0 ? (
          <div className="text-center py-10">
            <ScrollText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't submitted any complaints yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{format(parseISO(complaint.submittedAt), 'PPpp')}</TableCell>
                    <TableCell className="font-medium">{complaint.subject}</TableCell>
                    <TableCell>{complaint.category}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </TableCell>
                    {/* <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled>View</Button>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
