'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { VisitorEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isValid, parseISO } from 'date-fns'; // Added parseISO
import { Search, FileText } from 'lucide-react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '../ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export function PersonalLogsTable() {
  const { user, visitorEntries, fetchVisitorEntries, isLoading } = useAuth(); // Use visitorEntries from context
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [personalEntries, setPersonalEntries] = useState<VisitorEntry[]>([]);

  useEffect(() => {
    fetchVisitorEntries(); // Initial fetch
  }, [fetchVisitorEntries]);

  useEffect(() => {
    if (user && user.flatNumber && visitorEntries.length > 0) {
      const entries = visitorEntries.filter(entry => entry.flatNumber === user.flatNumber);
      setPersonalEntries(entries);
    } else {
      setPersonalEntries([]); // Clear if no user or no entries
    }
  }, [user, visitorEntries]);

  const filteredEntries = useMemo(() => {
    return personalEntries // Filter from personalEntries
      .filter(entry => 
        entry.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Mobile number search removed for personal logs for privacy, unless specifically required.
        // entry.mobileNumber.includes(searchTerm) || 
        (entry.vehicleNumber && entry.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime());
  }, [personalEntries, searchTerm]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);
  
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    if (totalPages <= 1) return null;
    
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={currentPage === i} onClick={(e) => {e.preventDefault(); handlePageChange(i)}}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
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

  if (isLoading && !personalEntries.length) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !user.flatNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You must be logged in as a resident with a flat number to view personal logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">My Visitor Logs (Flat {user.flatNumber})</CardTitle>
        </div>
        <CardDescription>View all visitors who have come to your flat.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search visitors by name, vehicle..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-10 w-full max-w-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor Name</TableHead>
                {/* <TableHead>Mobile</TableHead> Mobile number usually not shown in personal logs for privacy */}
                <TableHead>Purpose</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Vehicle No.</TableHead>
                <TableHead className="text-center">Photo</TableHead>
                <TableHead>Token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length > 0 ? (
                <List
                  height={400}
                  itemCount={paginatedEntries.length}
                  itemSize={56}
                  width="100%"
                  style={{ minWidth: 800 }}
                >
                  {({ index, style }) => {
                    const entry = paginatedEntries[index];
                    return (
                      <TableRow key={entry.id} style={style}>
                        <TableCell className="font-medium">{entry.visitorName}</TableCell>
                        <TableCell>{entry.purposeOfVisit}</TableCell>
                        <TableCell>{isValid(parseISO(entry.entryTimestamp)) ? format(parseISO(entry.entryTimestamp), "PPpp") : 'Invalid Date'}</TableCell>
                        <TableCell>{entry.vehicleNumber || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          {entry.visitorPhotoUrl ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm">View</Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                 <Image src={entry.visitorPhotoUrl} alt={entry.visitorName} width={200} height={200} className="rounded-md object-cover" data-ai-hint="visitor photo" />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{entry.tokenCode || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  }}
                </List>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {isLoading ? 'Loading your visitor logs...' : 'No visitor entries found for your flat.'}
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
