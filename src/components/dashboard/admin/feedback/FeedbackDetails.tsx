import React, { useState, useEffect } from "react";

const FEEDBACK_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const FeedbackDetails = ({ ticket, onStatusChange, onAddComment, currentUser }: { ticket: any; onStatusChange: (status: string) => void; onAddComment: (comment: string) => void; currentUser?: any }) => {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSuperAdmin = currentUser && currentUser.role === 'superadmin';
  const isOwner = currentUser && ticket.userId === currentUser.id;
  const canEditOrDelete = isOwner && !isSuperAdmin && ticket.status === 'open';

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket.status]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setLoading(true);
    setError("");
    try {
      await onStatusChange(newStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onAddComment(comment);
      setComment("");
    } catch (err: any) {
      setError(err.message || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/feedback/${ticket.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete ticket');
      }
      // Optionally: refresh the list or redirect
    } catch (err) {
      // Show error to user
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-semibold mb-2">Ticket Details</h2>
      <div className="mb-2">
        <div><b>Subject:</b> {ticket.subject}</div>
        <div><b>Type:</b> {ticket.type}</div>
        {ticket.flatNumber && <div><b>Flat:</b> {ticket.flatNumber}</div>}
        <div><b>Status:</b> {isSuperAdmin ? (
          <select value={status} onChange={handleStatusChange} disabled={loading} className="border rounded p-1">
            {FEEDBACK_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <span className="capitalize">{FEEDBACK_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status}</span>
        )}</div>
      </div>
      <div className="mb-2"><b>Description:</b> {ticket.description}</div>
      <div className="mb-2">
        <b>Comments:</b>
        <ul className="ml-4 list-disc">
          {ticket.comments && ticket.comments.length > 0 ? ticket.comments.map((c: any, i: number) => (
            <li key={i}><span className="text-xs text-gray-500">{c.authorName}:</span> {c.comment}</li>
          )) : <li className="text-gray-400">No comments yet.</li>}
        </ul>
      </div>
      <form onSubmit={handleAddComment} className="mb-2">
        <input value={comment} onChange={e => setComment(e.target.value)} className="border rounded p-1 w-2/3" placeholder="Add a comment..." />
        <button type="submit" className="ml-2 px-2 py-1 bg-blue-500 text-white rounded" disabled={loading || !comment}>Add</button>
      </form>
      {canEditOrDelete && (
        <>
          <button onClick={handleDelete} className="text-red-600 underline text-xs mr-4">Delete Ticket</button>
          <button className="text-blue-600 underline text-xs mr-4">Edit Ticket</button>
        </>
      )}
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
};

export default FeedbackDetails;
