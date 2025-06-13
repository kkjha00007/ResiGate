"use client";
import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { HelpDeskRequest } from "@/lib/types";

export default function AdminHelpDeskUI({ user, initialRequests }: { user: any, initialRequests: HelpDeskRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filterStatus, setFilterStatus] = useState<'all'|'open'|'resolved'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const categories = Array.from(new Set(requests.map(r => r.category))).filter(Boolean);

  const filtered = requests.filter(r =>
    (filterStatus === 'all' || r.status === filterStatus) &&
    (filterCategory === 'all' || r.category === filterCategory)
  );

  // Refetch single ticket after admin action
  const refreshTicket = async (id: string) => {
    const res = await fetch(`/api/helpdesk/${id}`);
    if (res.ok) {
      const updated = await res.json();
      setRequests(reqs => reqs.map(r => r.id === id ? updated : r));
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto py-8 px-2 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-tr from-blue-400 to-blue-700 p-3 shadow">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-800 leading-tight">Manage HelpDesk</h1>
            <div className="text-xs text-muted-foreground mt-1">Logged in as: <b>{user.name}</b> ({user.role})</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center bg-blue-50 dark:bg-slate-800 rounded-lg px-4 py-2 shadow-sm">
          <label className="text-sm font-medium text-blue-900">Status:</label>
          <select className="border rounded px-2 py-1 bg-white text-blue-900 focus:ring-2 focus:ring-blue-400" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <label className="text-sm font-medium text-blue-900 ml-2">Category:</label>
          <select className="border rounded px-2 py-1 bg-white text-blue-900 focus:ring-2 focus:ring-blue-400" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-0 sm:p-6 border border-blue-100 dark:border-slate-800">
        <h2 className="text-lg font-semibold mb-4 text-blue-600">All HelpDesk Tickets</h2>
        {filtered.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">No HelpDesk tickets found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(req => (
              <div key={req.id} className="border border-blue-200 dark:border-blue-900 rounded-xl p-5 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/40 dark:to-slate-900 shadow hover:shadow-lg transition-shadow">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 mb-2">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-lg truncate max-w-[180px] sm:max-w-[200px]">{req.userName}</span>
                  <span className="text-xs text-muted-foreground">Flat {req.flatNumber}</span>
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{format(new Date(req.createdAt), 'PPpp')}</span>
                </div>
                <div className="mb-1 max-w-full overflow-x-auto">
                  <b>Category:</b> <span className="text-blue-900 dark:text-blue-200">{req.category}</span>
                </div>
                <div className="mb-1 max-w-full overflow-x-auto">
                  <b>Description:</b>
                  <span className="block text-slate-800 dark:text-slate-100 break-words whitespace-pre-line max-h-32 overflow-y-auto pr-2">
                    {req.description}
                  </span>
                </div>
                <div className="mb-1"><b>Status:</b> <Badge className={req.status === 'open' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}>{req.status}</Badge></div>
                <div className="mb-1"><b>Urgent:</b> {req.urgent ? <span className="text-destructive font-semibold">Yes</span> : 'No'}</div>
                <AdminHelpDeskActions req={req} onAction={() => refreshTicket(req.id)} />
                {req.comments && req.comments.length > 0 && (
                  <div className="mt-2 bg-white/80 dark:bg-slate-800 rounded p-2 text-xs max-h-32 overflow-y-auto">
                    <div className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Comments:</div>
                    <ul className="space-y-1">
                      {req.comments.map((c, idx) => (
                        <li key={idx} className="border-l-2 pl-2 border-blue-400 break-words">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{c.by}</span> <span className="text-slate-500">({c.byRole})</span>: {c.comment} <span className="text-slate-400">[{format(new Date(c.createdAt), 'PPpp')}]</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AdminHelpDeskActions({ req, onAction }: { req: HelpDeskRequest, onAction: () => void }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState(req.status === 'resolved');
  const [showComment, setShowComment] = useState(false);

  const handleResolve = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/helpdesk/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (!res.ok) throw new Error('Failed to resolve');
      setResolved(true);
      setSuccess('Marked as resolved');
      onAction();
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/helpdesk/${req.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      });
      if (!res.ok) throw new Error('Failed to comment');
      setSuccess('Comment added');
      setComment('');
      setShowComment(false);
      onAction();
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2">
      {!resolved && (
        <button className="text-xs text-green-700 underline" onClick={handleResolve} disabled={loading}>Mark as Resolved</button>
      )}
      <button className="text-xs text-blue-700 underline" onClick={()=>setShowComment(v=>!v)} disabled={loading}>Add Comment</button>
      {showComment && (
        <div className="flex gap-2 mt-1">
          <input type="text" className="border rounded px-2 py-1 text-xs flex-1" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Enter comment..." disabled={loading} />
          <button className="text-xs bg-blue-600 text-white rounded px-2 py-1" onClick={handleComment} disabled={loading || !comment.trim()}>Submit</button>
        </div>
      )}
      {success && <div className="text-green-600 text-xs">{success}</div>}
      {error && <div className="text-red-600 text-xs">{error}</div>}
    </div>
  );
}
