"use client";

import React, { useEffect, useState, useCallback } from "react";
import FeedbackForm from "@/components/dashboard/admin/feedback/FeedbackForm";
import FeedbackList from "@/components/dashboard/admin/feedback/FeedbackList";
import FeedbackDetails from "@/components/dashboard/admin/feedback/FeedbackDetails";
import type { FeedbackTicket } from "@/lib/types";
import { useAuth } from '@/lib/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardEdit, Search, Megaphone } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

const FeedbackPage = () => {
  const { user, isAdmin, isSocietyAdmin } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback");
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

  // Submit new ticket
  const handleSubmit = () => {
    fetchTickets();
  };

  // Select ticket by id
  const handleSelect = (id: string) => {
    const ticket = tickets.find(t => t.id === id) || null;
    setSelectedTicket(ticket);
  };

  // Update status
  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTicket.id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  // Add comment
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

  // Delete ticket
  const handleDelete = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTicket.id }),
      });
      if (!res.ok) throw new Error("Failed to delete ticket");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Error deleting ticket");
    } finally {
      setLoading(false);
    }
  };

  // Filtering and pagination logic
  const filteredTickets = tickets.filter((t) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      t.subject.toLowerCase().includes(search) ||
      t.userName?.toLowerCase().includes(search) ||
      t.flatNumber?.toLowerCase().includes(search);
    const matchesStatus = filterStatus === 'all' ? true : t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!user || (!isAdmin() && !isSocietyAdmin() && user.primaryRole !== 'superadmin')) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-700">Access Denied</CardTitle>
            <CardDescription>Only SuperAdmin or Society Admin can view all feedback tickets.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <Card className="shadow-lg w-full max-w-none mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl font-semibold text-primary">Feedback & Bug Reports Log</CardTitle>
        </div>
        <CardDescription>Browse and manage all feedback and bug reports. Use the actions to update status and reply to users.</CardDescription>
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-blue-900">User</th>
                <th className="px-4 py-2 text-left font-semibold text-blue-900">Flat</th>
                <th className="px-4 py-2 text-left font-semibold text-blue-900">Type</th>
                <th className="px-4 py-2 text-left font-semibold text-blue-900">Subject</th>
                <th className="px-4 py-2 text-left font-semibold text-blue-900">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-blue-900">Submitted At</th>
                <th className="px-4 py-2 text-center font-semibold text-blue-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <td className="px-4 py-2">{ticket.userName}</td>
                    <td className="px-4 py-2">{ticket.flatNumber || '-'}</td>
                    <td className="px-4 py-2 capitalize">{ticket.type}</td>
                    <td className="px-4 py-2">{ticket.subject}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded font-medium ${ticket.status === 'open' ? 'bg-blue-100 text-blue-900' : ticket.status === 'resolved' ? 'bg-green-100 text-green-900' : ticket.status === 'under_review' ? 'bg-yellow-100 text-yellow-900' : ticket.status === 'rejected' ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-700'}`}>{ticket.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </td>
                    <td className="px-4 py-2">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ''}</td>
                    <td className="px-4 py-2 text-center">
                      <button className="text-xs text-blue-600 hover:underline mr-2" onClick={e => { e.stopPropagation(); setSelectedTicket(ticket); }}>View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="h-24 text-center text-muted-foreground">
                    No feedback tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  <PaginationPrevious href="#" onClick={e => { e.preventDefault(); setCurrentPage(currentPage - 1); }} />
                )}
              </PaginationItem>
              {/* Render pagination items */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink href="#" isActive={currentPage === page} onClick={e => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                {currentPage === totalPages ? (
                  <span className="pointer-events-none opacity-50">
                    <PaginationNext href="#" tabIndex={-1} aria-disabled="true" />
                  </span>
                ) : (
                  <PaginationNext href="#" onClick={e => { e.preventDefault(); setCurrentPage(currentPage + 1); }} />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        {selectedTicket && (
          <FeedbackDetails
            ticket={selectedTicket}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            currentUser={user}
          />
        )}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </CardContent>
    </Card>
  );
};

export default FeedbackPage;
