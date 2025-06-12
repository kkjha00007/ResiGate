'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { GatePass } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO, isValid } from 'date-fns';
import { Ticket, Trash2, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GATE_PASS_STATUSES } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GATE_PASS_STATUSES_ARRAY, DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


export function MyGatePassesTable() {
  const { user, gatePasses, fetchGatePasses, cancelGatePass, isLoading: authLoading } = useAuth();
  const [isCancelling, setIsCancelling] = useState<string | null>(null); // Store passId being cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchGatePasses();
    }
  }, [user, fetchGatePasses]);

  const handleCancelPass = async (passId: string) => {
    setIsCancelling(passId);
    await cancelGatePass(passId);
    setIsCancelling(null);
  };

  const filteredAndSortedPasses = useMemo(() => {
    return gatePasses
      .filter(pass => {
        const searchMatch = 
          pass.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pass.tokenCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pass.vehicleNumber && pass.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        const statusMatch = statusFilter ? pass.status === statusFilter : true;
        return searchMatch && statusMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by creation date, newest first
  }, [gatePasses, searchTerm, statusFilter]);

  const paginatedPasses = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE;
    return filteredAndSortedPasses.slice(startIndex, startIndex + DEFAULT_ITEMS_PER_PAGE);
  }, [filteredAndSortedPasses, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedPasses.length / DEFAULT_ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    if (totalPages <= 1) return null;
    
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) items.push(<PaginationItem key={i}><PaginationLink href="#" isActive={currentPage === i} onClick={(e) => {e.preventDefault(); handlePageChange(i)}}>{i}</PaginationLink></PaginationItem>);
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
      
      if (startPage > 1) {
        items.push(<PaginationItem key={1}><PaginationLink href="#" onClick={(e) => {e.preventDefault(); handlePageChange(1)}}>1</PaginationLink></PaginationItem>);
        if (startPage > 2) items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
      for (let i = startPage; i <= endPage; i++) items.push(<PaginationItem key={i}><PaginationLink href="#" isActive={currentPage === i} onClick={(e) => {e.preventDefault(); handlePageChange(i)}}>{i}</PaginationLink></PaginationItem>);
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) items.push(<PaginationEllipsis key="end-ellipsis" />);
        items.push(<PaginationItem key={totalPages}><PaginationLink href="#" onClick={(e) => {e.preventDefault(); handlePageChange(totalPages)}}>{totalPages}</PaginationLink></PaginationItem>);
      }
    }
    return items;
  };


  if (authLoading && gatePasses.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Ticket className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">My Visitor Gate Passes</CardTitle>
        </div>
        <CardDescription>View and manage your generated gate passes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Search by visitor, token, vehicle..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="pl-10 w-full"
                />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value === 'all' ? '' : value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {GATE_PASS_STATUSES_ARRAY.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Visit Details/Time</TableHead>
                <TableHead>Token Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPasses.length > 0 ? (
                paginatedPasses.map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell className="font-medium">{pass.visitorName}</TableCell>
                    <TableCell>{isValid(parseISO(pass.expectedVisitDate)) ? format(parseISO(pass.expectedVisitDate), "PP") : 'Invalid Date'}</TableCell>
                    <TableCell>{pass.visitDetailsOrTime}</TableCell>
                    <TableCell><Badge variant="outline">{pass.tokenCode}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={
                        pass.status === GATE_PASS_STATUSES.PENDING ? "secondary" :
                        pass.status === GATE_PASS_STATUSES.USED ? "default" :
                        pass.status === GATE_PASS_STATUSES.CANCELLED ? "destructive" :
                        "outline"
                      }>
                        {pass.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pass.status === GATE_PASS_STATUSES.PENDING && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive-foreground bg-destructive hover:bg-destructive/90 border-destructive hover:border-destructive/90"
                              disabled={isCancelling === pass.id}
                            >
                              {isCancelling === pass.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground"></div>
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel the gate pass for {pass.visitorName} (Token: {pass.tokenCode})? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Pass</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelPass(pass.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Confirm Cancel
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {gatePasses.length === 0 && !authLoading ? 'No gate passes found.' : 'Filtering returned no results or loading...'}
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
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {e.preventDefault(); if(currentPage > 1) handlePageChange(currentPage - 1)}} 
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} 
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {e.preventDefault(); if(currentPage < totalPages) handlePageChange(currentPage + 1)}} 
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
