import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function DisputeManagementTable({ societyId }: { societyId: string }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchDisputes = () => {
    setLoading(true);
    fetch(`/api/billing/bills/disputes?societyId=${societyId}`)
      .then(res => res.json())
      .then(data => setDisputes(data.disputes || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
  }, [societyId]);

  const handleAddComment = async (id: string) => {
    if (!commentText.trim()) return;
    setCommentingId(id);
    await fetch(`/api/helpdesk/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });
    setCommentText('');
    setCommentingId(null);
    fetchDisputes();
  };

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    await fetch(`/api/helpdesk/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    setResolvingId(null);
    fetchDisputes();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Bill Disputes/Queries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flat</TableHead>
              <TableHead>Bill ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            ) : disputes.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No disputes found.</TableCell></TableRow>
            ) : disputes.map((d) => [
              <TableRow key={d.id}>
                <TableCell>{d.flatNumber}</TableCell>
                <TableCell>{d.billId}</TableCell>
                <TableCell>{d.description}</TableCell>
                <TableCell>{d.status}</TableCell>
                <TableCell>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                    {expanded === d.id ? 'Hide' : 'Details'}
                  </Button>
                  {d.status !== 'resolved' && (
                    <Button size="sm" className="ml-2" onClick={() => handleResolve(d.id)} disabled={resolvingId === d.id}>
                      {resolvingId === d.id ? 'Resolving...' : 'Mark Resolved'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>,
              expanded === d.id && (
                <TableRow key={d.id + '-details'}>
                  <TableCell colSpan={6}>
                    <div className="p-2 bg-gray-50 rounded">
                      <b>User:</b> {d.userName || d.userId}<br />
                      <b>Urgent:</b> {d.urgent ? 'Yes' : 'No'}<br />
                      <b>Comments:</b>
                      <ul className="ml-4">
                        {d.comments && d.comments.length > 0 ? d.comments.map((c: any, i: number) => (
                          <li key={i}>{c.text} - <i>{c.authorName || c.authorId}</i> ({new Date(c.createdAt).toLocaleString()})</li>
                        )) : <li>None</li>}
                      </ul>
                      <div className="mt-2 flex gap-2 items-end">
                        <Textarea rows={2} value={commentingId === d.id ? commentText : ''} onChange={e => { setCommentingId(d.id); setCommentText(e.target.value); }} placeholder="Add comment..." />
                        <Button size="sm" onClick={() => handleAddComment(d.id)} disabled={commentingId === d.id && !commentText.trim()}>
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ])}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
