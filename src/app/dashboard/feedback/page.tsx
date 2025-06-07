"use client";

import React, { useEffect, useState, useCallback } from "react";
import FeedbackForm from "@/components/dashboard/admin/feedback/FeedbackForm";
import FeedbackList from "@/components/dashboard/admin/feedback/FeedbackList";
import FeedbackDetails from "@/components/dashboard/admin/feedback/FeedbackDetails";
import type { FeedbackTicket } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ListOrdered, ScrollText } from "lucide-react";
import { useAuth } from '@/lib/auth-provider';

export default function FeedbackUserPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch only user's own tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback?mine=1");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || "Error fetching tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmit = () => {
    fetchTickets();
  };
  const handleSelect = (id: string) => {
    const ticket = tickets.find(t => t.id === id) || null;
    setSelectedTicket(ticket);
  };
  const handleAddComment = async (comment: string) => {
    if (!selectedTicket) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTicket.id, comment }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Error adding comment");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!selectedTicket) return;
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/feedback/${selectedTicket.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete ticket");
      setSelectedTicket(null);
      setSuccess("Ticket deleted successfully.");
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Error deleting ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ListOrdered className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">My Submitted Feedback & Bug Reports</CardTitle>
            <CardDescription>A log of all feedback and bug reports you have submitted.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Card className="mb-6 shadow-xl">
          <CardHeader className="flex items-center gap-3 pb-2">
            <ListOrdered className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl font-semibold text-primary">Submit Feedback / Bug Report</CardTitle>
              <CardDescription>Help us improve! Report bugs, request features, or share feedback.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FeedbackForm onSubmit={handleSubmit} hideHeader />
          </CardContent>
        </Card>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Loading your feedback...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-10">
            <ScrollText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't submitted any feedback yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-blue-900">Submitted On</th>
                  <th className="px-4 py-2 text-left font-semibold text-blue-900">Type</th>
                  <th className="px-4 py-2 text-left font-semibold text-blue-900">Subject</th>
                  <th className="px-4 py-2 text-left font-semibold text-blue-900">Flat</th>
                  <th className="px-4 py-2 text-left font-semibold text-blue-900">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <td className="px-4 py-2">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ''}</td>
                    <td className="px-4 py-2 capitalize">{ticket.type}</td>
                    <td className="px-4 py-2">{ticket.subject}</td>
                    <td className="px-4 py-2">{ticket.flatNumber || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded font-medium ${ticket.status === 'open' ? 'bg-blue-100 text-blue-900' : ticket.status === 'resolved' ? 'bg-green-100 text-green-900' : ticket.status === 'under_review' ? 'bg-yellow-100 text-yellow-900' : ticket.status === 'rejected' ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-700'}`}>{ticket.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedTicket && (
          <FeedbackDetails
            ticket={selectedTicket}
            onStatusChange={() => {}}
            onAddComment={handleAddComment}
            currentUser={user}
          />
        )}
        {success && <div className="text-green-600 mt-2">{success}</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </CardContent>
    </Card>
  );
}
