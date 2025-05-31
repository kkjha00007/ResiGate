"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Search, Megaphone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Complaint, ComplaintReply } from '@/lib/types';

const ITEMS_PER_PAGE = 10;

export default function AdminComplaintsPage() {
  const { user, isAdmin, isSocietyAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to update complaint status
  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      // Find the complaint to get its societyId
      const complaint = complaints.find((c) => c.id === id);
      if (!complaint) return;
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, societyId: complaint.societyId }),
      });
      if (res.ok) {
        // Refetch complaints to ensure up-to-date data and avoid pagination bugs
        await fetchComplaints();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper to reply to a complaint
  const sendReply = async (id: string) => {
    setUpdatingId(id);
    try {
      // Find the complaint to get its societyId
      const complaint = complaints.find((c) => c.id === id);
      if (!complaint) return;
      const res = await fetch(`/api/complaints/${id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': user?.name || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ reply: replyText, societyId: complaint.societyId }),
      });
      if (res.ok) {
        setReplyingId(null);
        setReplyText('');
        // Refetch complaints to show new reply and keep pagination correct
        await fetchComplaints();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Fetch complaints
  const fetchComplaints = async () => {
    if (!user || (!isAdmin() && !isSocietyAdmin())) {
      setComplaints([]);
      setLoading(false);
      return;
    }
    try {
      let url = '/api/complaints';
      const headers: Record<string, string> = {};
      if (isSocietyAdmin() && user.societyId) {
        url += `?societyId=${user.societyId}`;
        headers['x-user-role'] = 'societyAdmin';
      } else if (isAdmin()) {
        headers['x-user-role'] = 'superadmin';
      }
      const res = await fetch(url, { headers });
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line
  }, [user, isAdmin, isSocietyAdmin]);

  // Filtering and pagination logic
  const filteredComplaints = complaints.filter((c) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      c.subject.toLowerCase().includes(search) ||
      c.userName.toLowerCase().includes(search) ||
      c.userFlatNumber.toLowerCase().includes(search);
    const matchesStatus = filterStatus === 'all' ? true : c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE);
  const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    if (totalPages <= 1) return null;
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={currentPage === i} onClick={e => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      if (startPage > 1) {
        items.push(
          <PaginationItem key={1}>
            <PaginationLink href="#" onClick={e => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink>
          </PaginationItem>
        );
        if (startPage > 2) items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={currentPage === i} onClick={e => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) items.push(<PaginationEllipsis key="end-ellipsis" />);
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink href="#" onClick={e => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg w-full max-w-none mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl font-semibold text-primary">Complaints Log</CardTitle>
        </div>
        <CardDescription>Browse and manage recent complaints. Use the actions to update status and reply to residents.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by subject, user, or flat..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full"
            />
          </div>
          <Select value={filterStatus} onValueChange={value => { setFilterStatus(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Flat</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedComplaints.length > 0 ? (
                paginatedComplaints.map((c) => (
                  <>
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.userName}</TableCell>
                    <TableCell>{c.userFlatNumber}</TableCell>
                    <TableCell className="max-w-[180px] truncate" title={c.subject}>{c.subject}</TableCell>
                    <TableCell>{c.category}</TableCell>
                    <TableCell className="max-w-[260px] truncate" title={c.description}>{c.description}</TableCell>
                    <TableCell>{c.submittedAt ? format(parseISO(c.submittedAt), 'PPpp') : ''}</TableCell>
                    <TableCell>
                      <Badge variant={
                        c.status === 'Open' ? 'secondary' :
                        c.status === 'In Progress' ? 'default' :
                        c.status === 'Resolved' ? 'outline' :
                        c.status === 'Closed' ? 'destructive' : 'outline'
                      }>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-center">
                      {['Open', 'In Progress', 'Resolved', 'Closed'].filter(s => s !== c.status).map(status => (
                        <Button key={status} size="sm" variant="outline" className="text-xs px-2 py-1"
                          disabled={updatingId === c.id}
                          onClick={() => updateStatus(c.id, status)}>
                          Mark {status}
                        </Button>
                      ))}
                      <Button size="sm" variant="secondary" className="text-xs px-2 py-1" onClick={() => setReplyingId(c.id)}>
                        Reply
                      </Button>
                      {replyingId === c.id && (
                        <div className="mt-2 flex flex-col gap-2">
                          <textarea
                            className="border rounded p-2 text-sm w-48"
                            rows={2}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => sendReply(c.id)} disabled={updatingId === c.id || !replyText.trim()}>
                              Send
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReplyText(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {c.replies && c.replies.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-slate-50 text-xs text-slate-700">
                        <div className="pl-2">
                          <div className="font-semibold mb-1">Replies:</div>
                          <ul className="space-y-1">
                            {c.replies.map((r, idx) => (
                              <li key={idx} className="flex gap-2 items-center">
                                <span className="inline-block px-2 py-1 bg-blue-100 rounded text-blue-900 font-medium">{format(parseISO(r.repliedAt), 'PPpp')}</span>
                                <span className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-800">{r.reply}</span>
                                {r.repliedBy && (
                                  <span className="ml-2 text-xs text-muted-foreground">— {r.repliedBy}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No complaints found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                {currentPage === 1 ? (
                  <span className="pointer-events-none opacity-50">
                    <PaginationPrevious href="#" tabIndex={-1} aria-disabled="true" />
                  </span>
                ) : (
                  <PaginationPrevious href="#" onClick={e => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
                )}
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                {currentPage === totalPages ? (
                  <span className="pointer-events-none opacity-50">
                    <PaginationNext href="#" tabIndex={-1} aria-disabled="true" />
                  </span>
                ) : (
                  <PaginationNext href="#" onClick={e => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
