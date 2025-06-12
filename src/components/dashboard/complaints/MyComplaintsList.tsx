'use client';

import React, { useEffect, useState } from 'react';
import type { HelpDeskRequest } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ListOrdered, ScrollText, PlusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Camera, AlertTriangle, Pencil, Trash2, CheckCircle, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { USER_ROLES } from '@/lib/constants';
import dynamic from 'next/dynamic';

// Dynamically import the form to avoid SSR issues if needed
const HelpDeskForm = dynamic(() => import('./ComplaintForm').then(m => m.default), { ssr: false });

export function MyHelpDeskList({ requests = [], isLoading = false, fetchMyRequests = () => {} }: { requests?: HelpDeskRequest[]; isLoading?: boolean; fetchMyRequests?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<HelpDeskRequest|null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user, fetchMyRequests]);

  const getStatusVariant = (status: HelpDeskRequest['status']) => {
    switch (status) {
      case 'open': return 'secondary';
      case 'resolved': return 'outline';
      default: return 'outline';
    }
  };

  // Filtering logic
  const filtered = requests.filter(r =>
    (filterStatus === 'all' || r.status === filterStatus) &&
    (filterCategory === 'all' || r.category === filterCategory)
  );

  // Export to CSV
  const handleExport = () => {
    const csvRows = [
      ['Submitted On', 'Description', 'Category', 'Status', 'Urgent', 'Document', 'Photo'],
      ...filtered.map(r => [
        r.createdAt ? format(parseISO(r.createdAt), 'PPpp') : '-',
        '"' + (r.description || '').replace(/"/g, '""') + '"',
        r.category || '-',
        r.status || '-',
        r.urgent ? 'Yes' : 'No',
        r.documentUrl || '',
        r.photoUrl || ''
      ])
    ];
    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'helpdesk-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Unique categories for filter dropdown
  const categories = Array.from(new Set(requests.map(r => r.category))).filter(Boolean);

  if (isLoading && requests.length === 0) {
    return (
      <Card className="shadow-xl rounded-2xl bg-gradient-to-br from-blue-50 to-white border-0">
        <CardHeader className="pb-2 border-b-0">
          <div className="flex items-center gap-3">
            <ListOrdered className="h-9 w-9 text-blue-500 drop-shadow" />
            <div>
              <CardTitle className="text-3xl font-bold text-blue-900 tracking-tight">HelpDesk Requests</CardTitle>
              <CardDescription className="text-base text-blue-700/80">Raise, track, and manage your society requests.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white/60 rounded-xl border border-dashed border-blue-200 mt-6">
            <ScrollText className="h-14 w-14 text-blue-300 mb-2" />
            <p className="text-lg text-blue-700/80 font-medium">No open requests found.</p>
            <button
              className="mt-4 flex flex-col items-center justify-center bg-gradient-to-tr from-blue-400 via-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform w-20 h-20 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Add New Request"
              onClick={() => setShowFormDialog(true)}
            >
              <PlusCircle className="w-12 h-12" />
            </button>
            <span className="text-blue-500 font-semibold mt-2">New HelpDesk Request</span>
            <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit a New HelpDesk Request</DialogTitle>
                  <DialogDescription>Fill out the form below to raise a new request.</DialogDescription>
                </DialogHeader>
                <HelpDeskForm onSuccess={() => { setShowFormDialog(false); setShowForm(false); fetchMyRequests(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline action handlers (real API)
  const handleEdit = async (req: HelpDeskRequest) => {
    toast({ title: 'Edit', description: 'Edit action (to be implemented)' });
    // TODO: Open edit modal or navigate to edit page
  };

  const handleDelete = (req: HelpDeskRequest) => {
    setSelected(req);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/helpdesk/${selected.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Request deleted.' });
      setSelected(null);
      fetchMyRequests();
    } catch (e) {
      toast({ title: 'Error', description: 'Could not delete request', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleResolve = (req: HelpDeskRequest) => {
    setSelected(req);
    setShowResolveConfirm(true);
  };

  const confirmResolve = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/helpdesk/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (!res.ok) throw new Error('Failed to resolve');
      toast({ title: 'Resolved', description: 'Request marked as resolved.' });
      setSelected(null);
      fetchMyRequests();
    } catch (e) {
      toast({ title: 'Error', description: 'Could not resolve request', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setShowResolveConfirm(false);
    }
  };

  const handleComment = () => {
    setIsCommenting(true);
  };

  const submitComment = async () => {
    if (!selected || !commentText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/helpdesk/${selected.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText })
      });
      if (!res.ok) throw new Error('Failed to comment');
      toast({ title: 'Commented', description: 'Comment added.' });
      setCommentText('');
      setIsCommenting(false);
      fetchMyRequests();
    } catch (e) {
      toast({ title: 'Error', description: 'Could not add comment', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-xl rounded-2xl bg-gradient-to-br from-blue-50 to-white border-0">
      <CardHeader className="pb-2 border-b-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ListOrdered className="h-9 w-9 text-blue-500 drop-shadow" />
            <div>
              <CardTitle className="text-3xl font-bold text-blue-900 tracking-tight">HelpDesk Requests</CardTitle>
              <CardDescription className="text-base text-blue-700/80">Raise, track, and manage your society requests.</CardDescription>
            </div>
          </div>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md px-6 py-2 rounded-lg transition-all" onClick={() => setShowFormDialog(true)}>
            + New Request
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 mt-6 items-center justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant={filterStatus === 'open' ? 'default' : 'outline'} className={filterStatus === 'open' ? 'bg-blue-500 text-white' : ''} onClick={()=>setFilterStatus('open')}>Open</Button>
            <Button size="sm" variant={filterStatus === 'resolved' ? 'default' : 'outline'} className={filterStatus === 'resolved' ? 'bg-green-500 text-white' : ''} onClick={()=>setFilterStatus('resolved')}>Resolved</Button>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-blue-900">Category:</label>
            <select className="border rounded px-2 py-1 bg-white text-blue-900 focus:ring-2 focus:ring-blue-400" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
              <option value="all">All</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Button size="sm" variant="outline" className="ml-auto border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleExport}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white/60 rounded-xl border border-dashed border-blue-200 mt-6">
            <ScrollText className="h-14 w-14 text-blue-300 mb-2" />
            <p className="text-lg text-blue-700/80 font-medium">No {filterStatus} requests found.</p>
            <button
              className="mt-4 flex flex-col items-center justify-center bg-gradient-to-tr from-blue-400 via-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform w-20 h-20 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Add New Request"
              onClick={() => setShowFormDialog(true)}
            >
              <PlusCircle className="w-12 h-12" />
            </button>
            <span className="text-blue-500 font-semibold mt-2">New HelpDesk Request</span>
            <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit a New HelpDesk Request</DialogTitle>
                  <DialogDescription>Fill out the form below to raise a new request.</DialogDescription>
                </DialogHeader>
                <HelpDeskForm onSuccess={() => { setShowFormDialog(false); setShowForm(false); fetchMyRequests(); }} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Urgent</TableHead>
                  <TableHead className="text-center">Files</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filtered as HelpDeskRequest[]).map((req) => {
                  const isOwner = user && req.userId === user.id;
                  const isAdmin = user && (user.role === USER_ROLES.SUPERADMIN || user.role === USER_ROLES.SOCIETY_ADMIN);
                  return (
                    <TableRow key={req.id} className="hover:bg-muted/40 transition-colors group cursor-pointer" onClick={e => {
                      // Prevent row click if action button is clicked
                      if ((e.target as HTMLElement).closest('.action-btn')) return;
                      setSelected(req);
                    }}>
                      <TableCell className="whitespace-nowrap">{req.createdAt ? format(parseISO(req.createdAt), 'PPpp') : '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{req.description && req.description.length > 60 ? req.description.slice(0, 60) + '…' : req.description}</span>
                          </TooltipTrigger>
                          <TooltipContent>{req.description}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{req.category || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(req.status)}>{req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {req.urgent ? <AlertTriangle className="inline h-5 w-5 text-destructive" /> : null}
                      </TableCell>
                      <TableCell className="text-center flex gap-2 justify-center">
                        {req.documentUrl ? <FileText className="h-5 w-5 text-blue-500" /> : null}
                        {req.photoUrl ? <Camera className="h-5 w-5 text-green-500" /> : null}
                      </TableCell>
                      <TableCell className="text-center min-w-[120px]">
                        <div className="flex gap-1 justify-center">
                          {isOwner && req.status === 'open' && (
                            <Button size="icon" variant="ghost" className="action-btn" title="Edit" onClick={e => { e.stopPropagation(); handleEdit(req); }}><Pencil className="h-4 w-4" /></Button>
                          )}
                          {isOwner && req.status === 'open' && (
                            <Button size="icon" variant="ghost" className="action-btn" title="Delete" onClick={e => { e.stopPropagation(); handleDelete(req); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          )}
                          {isOwner && req.status === 'open' && (
                            <Button size="icon" variant="ghost" className="action-btn" title="Mark as Resolved" onClick={e => { e.stopPropagation(); handleResolve(req); }}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                          )}
                          {isAdmin && req.status === 'open' && (
                            <Button size="icon" variant="ghost" className="action-btn" title="Resolve as Admin" onClick={e => { e.stopPropagation(); handleResolve(req); }}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                          )}
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="action-btn" title="Comment" onClick={e => { e.stopPropagation(); setSelected(req); handleComment(); }}><MessageCircle className="h-4 w-4 text-blue-600" /></Button>
                          )}
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="action-btn" title="Delete as Admin" onClick={e => { e.stopPropagation(); handleDelete(req); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {/* Details Modal */}
        <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
          <DialogContent className="max-w-lg">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>Request Details</DialogTitle>
                  <DialogDescription>Full information for your HelpDesk request.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-2">
                  <div><b>Submitted:</b> {selected.createdAt ? format(parseISO(selected.createdAt), 'PPpp') : '-'}</div>
                  <div><b>Status:</b> <Badge variant={getStatusVariant(selected.status)}>{selected.status}</Badge></div>
                  <div><b>Category:</b> {selected.category}</div>
                  <div><b>Urgent:</b> {selected.urgent ? <span className="text-destructive font-semibold">Yes</span> : 'No'}</div>
                  <div><b>Description:</b><br /><span className="whitespace-pre-line">{selected.description}</span></div>
                  {selected.documentUrl && <div><b>Document:</b> <a href={selected.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1"><FileText className="h-4 w-4" />View</a></div>}
                  {selected.photoUrl && <div><b>Photo:</b> <a href={selected.photoUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline inline-flex items-center gap-1"><Camera className="h-4 w-4" />View</a></div>}
                  {selected.comments && selected.comments.length > 0 && (
                    <div>
                      <b>Comments:</b>
                      <ul className="list-disc ml-5 mt-1 space-y-1">
                        {selected.comments.map((c, i) => (
                          <li key={i}><span className="font-semibold">{c.by} ({c.byRole}):</span> {c.comment} <span className="text-xs text-muted-foreground">{format(parseISO(c.createdAt), 'PPpp')}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Admin comment box */}
                  {user && (user.role === USER_ROLES.SUPERADMIN || user.role === USER_ROLES.SOCIETY_ADMIN) && isCommenting && (
                    <div className="mt-4">
                      <textarea className="w-full border rounded p-2 mb-2" rows={3} placeholder="Add a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={()=>setIsCommenting(false)}>Cancel</Button>
                        <Button size="sm" onClick={submitComment} disabled={isProcessing || !commentText.trim()}>Post Comment</Button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Admin controls in modal */}
                {user && (user.role === USER_ROLES.SUPERADMIN || user.role === USER_ROLES.SOCIETY_ADMIN) && (
                  <div className="mt-4 border-t pt-3 space-y-2">
                    <div className="font-semibold">Admin Controls:</div>
                    <div className="flex gap-2">
                      {selected.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => handleResolve(selected)}>Mark as Resolved</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={handleComment}>Add Comment</Button>
                      <Button size="sm" variant="destructive" onClick={()=>setShowDeleteConfirm(true)}>Delete</Button>
                    </div>
                    {isCommenting && (
                      <div className="mt-2 flex gap-2">
                        <input type="text" className="border rounded px-2 py-1 flex-1" placeholder="Enter comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} />
                        <Button size="sm" onClick={submitComment} disabled={!commentText.trim()}>Submit</Button>
                        <Button size="sm" variant="ghost" onClick={()=>setIsCommenting(false)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={()=>setSelected(null)}>Close</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={open => !open && setShowDeleteConfirm(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>Are you sure you want to delete this request? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={()=>setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Resolve Confirmation Dialog */}
        <Dialog open={showResolveConfirm} onOpenChange={open => !open && setShowResolveConfirm(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Mark as Resolved</DialogTitle>
              <DialogDescription>Are you sure you want to mark this request as resolved?</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={()=>setShowResolveConfirm(false)}>Cancel</Button>
              <Button variant="default" onClick={confirmResolve}>Mark as Resolved</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
