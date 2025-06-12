import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
  'pending',
  'under_review',
  'in_discussion',
  'rejected',
  'added',
  'pending_approval',
];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  in_discussion: 'In Discussion',
  rejected: 'Rejected',
  added: 'Added',
  pending_approval: 'Pending Approval',
};

export default function SocietyInvitesTable() {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'superadmin') return;
    setLoading(true);
    fetch('/api/society-invites')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(setInvites)
      .catch(() => setError('Failed to load society invites'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleStatusChange = async (inviteId: string, newStatus: string, commentText?: string) => {
    try {
      const res = await fetch(`/api/society-invites/${inviteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, comment: commentText }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setInvites((prev: any) => prev.map((i: any) => i.id === inviteId ? { ...i, status: newStatus, comment: commentText || i.comment } : i));
      toast({ title: 'Status updated', description: `Invite status changed to ${STATUS_LABELS[newStatus] || newStatus}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="p-8 text-center text-destructive flex flex-col items-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <div>Access denied. Only SuperAdmin can view society invites.</div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Society Invite Requests</CardTitle>
        <CardDescription>All societies invited by users (pending addition to the system).</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : error ? (
          <div className="text-center text-destructive py-10">{error}</div>
        ) : invites.length === 0 ? (
          <div className="text-center py-10">No society invites found.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Society Name</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Invited At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite: any) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.societyName}</TableCell>
                    <TableCell>{invite.contactName}</TableCell>
                    <TableCell>{invite.contactEmail}</TableCell>
                    <TableCell>{invite.contactPhone || '-'}</TableCell>
                    <TableCell>{invite.ip || '-'}</TableCell>
                    <TableCell>
                      <Select value={invite.status || 'pending'} onValueChange={val => handleStatusChange(invite.id, val, invite.comment)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue>{STATUS_LABELS[invite.status] || 'Pending'}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt} value={opt}>{STATUS_LABELS[opt]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {commentingId === invite.id ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => { handleStatusChange(invite.id, invite.status, comment); setCommentingId(null); }}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCommentingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[180px]">{invite.comment || <span className="text-muted-foreground">No comment</span>}</span>
                          <Button size="sm" variant="ghost" onClick={() => { setComment(invite.comment || ''); setCommentingId(invite.id); }}>
                            {invite.comment ? 'Edit' : 'Add'}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{invite.createdAt ? new Date(invite.createdAt).toLocaleString() : '-'}</TableCell>
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
