// src/components/dashboard/admin/BillEmailLogTable.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { BillEmailLog } from '@/lib/types';

export function BillEmailLogTable({ billId }: { billId?: string }) {
  const [logs, setLogs] = useState<BillEmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const url = billId
        ? `/api/billing/bills/email-log?billId=${billId}`
        : '/api/billing/bills/email-log';
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
      setLoading(false);
    }
    fetchLogs();
  }, [billId]);

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle>Bill Email Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flat</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.flatNumber}</TableCell>
                    <TableCell>{log.email || <span className="text-xs text-muted-foreground">Not set</span>}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>{new Date(log.sentAt).toLocaleString()}</TableCell>
                    <TableCell>{log.errorMessage || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default BillEmailLogTable;
