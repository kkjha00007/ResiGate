'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { VisitorEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { USER_ROLES } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid, parseISO } from 'date-fns';
import { CalendarIcon, Search, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
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

export function RecentEntriesTable() {
  const { visitorEntries, fetchVisitorEntries, user, isAdmin, isGuard, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlat, setFilterFlat] = useState('');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVisitorEntries(); 
  }, [fetchVisitorEntries]);
  
  const uniqueFlatNumbers = useMemo(() => {
    const flats = new Set(visitorEntries.map(entry => entry.flatNumber));
    return Array.from(flats).sort();
  }, [visitorEntries]);

  const filteredEntries = useMemo(() => {
    return visitorEntries
      .filter(entry => {
        const searchMatch =
          entry.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (isAdmin() && entry.mobileNumber?.includes(searchTerm)) || // Search mobile only if admin
          (entry.vehicleNumber && entry.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        const flatMatch = filterFlat ? entry.flatNumber === filterFlat : true;
        const dateMatch = filterDate ? format(parseISO(entry.entryTimestamp), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd') : true;
        return searchMatch && flatMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime());
  }, [visitorEntries, searchTerm, filterFlat, filterDate, isAdmin]);

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

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        items.push(
          <PaginationItem key={1}>
            <PaginationLink href="#" onClick={(e) => {e.preventDefault(); handlePageChange(1)}}>1</PaginationLink>
          </PaginationItem>
        );
        if (startPage > 2) {
          items.push(<PaginationEllipsis key="start-ellipsis" />);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={currentPage === i} onClick={(e) => {e.preventDefault(); handlePageChange(i)}}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          items.push(<PaginationEllipsis key="end-ellipsis" />);
        }
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink href="#" onClick={(e) => {e.preventDefault(); handlePageChange(totalPages)}}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  const maskMobileNumber = (mobile: string | undefined) => {
    if (mobile && mobile.length >= 10) { 
      return `******${mobile.substring(mobile.length - 4)}`;
    }
    return 'N/A'; // Or some other placeholder if mobile is undefined
  };
  
  if (isLoading && !visitorEntries.length) {
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
            <ClipboardList className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">Visitor Entry Log</CardTitle>
        </div>
        <CardDescription>Browse and manage recent visitor entries. Mobile numbers are fully visible only to administrators.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={isAdmin() ? "Search by name, mobile, vehicle..." : "Search by name, vehicle..."}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full"
            />
          </div>
          <Select value={filterFlat} onValueChange={(value) => { setFilterFlat(value === 'all' ? '' : value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Flat Number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flats</SelectItem>
              {uniqueFlatNumbers.map(flat => (
                <SelectItem key={flat} value={flat}>{flat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!filterDate && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : <span>Filter by Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={(date) => {setFilterDate(date); setCurrentPage(1);}}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Flat No.</TableHead>
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
                        <TableCell>{isAdmin() ? entry.mobileNumber || 'N/A' : maskMobileNumber(entry.mobileNumber)}</TableCell>
                        <TableCell>{entry.flatNumber}</TableCell>
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
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {isLoading ? 'Loading visitor entries...' : 'No visitor entries found.'}
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
