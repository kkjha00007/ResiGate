'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { Vendor, VendorCategory } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { VENDOR_CATEGORIES }
from '@/lib/constants'; // Corrected import path
import { Store, Search, Filter, Phone, User, MapPin, ListChecks, Info, PhoneForwarded } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ALL_CATEGORIES_SENTINEL_VALUE = "__ALL_CATEGORIES__"; // Sentinel value for "All Categories"

export function VendorDirectoryDisplay() {
  const { approvedVendors, fetchApprovedVendors, isLoading: authLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | ''>(''); // '' means all categories

  useEffect(() => {
    if (user?.societyId) {
      fetchApprovedVendors();
    }
  }, [fetchApprovedVendors, user?.societyId]);

  const filteredVendors = useMemo(() => {
    return approvedVendors
      .filter(vendor => {
        const nameMatch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
        const servicesMatch = vendor.servicesOffered.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = categoryFilter ? vendor.category === categoryFilter : true; // categoryFilter === '' means no filter
        return (nameMatch || servicesMatch) && categoryMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [approvedVendors, searchTerm, categoryFilter]);

  if (authLoading && approvedVendors.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading vendor directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
                <Store className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-semibold text-primary">Vendor Directory</CardTitle>
                    <CardDescription>Find approved vendors and services for the society.</CardDescription>
                </div>
            </div>
            <Button asChild>
                <Link href="/dashboard/vendors/add">Add New Vendor</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select
              value={categoryFilter === '' ? ALL_CATEGORIES_SENTINEL_VALUE : categoryFilter}
              onValueChange={(value) => {
                if (value === ALL_CATEGORIES_SENTINEL_VALUE) {
                  setCategoryFilter('');
                } else {
                  setCategoryFilter(value as VendorCategory);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_SENTINEL_VALUE}>All Categories</SelectItem>
                {VENDOR_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="text-center py-10">
              <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No vendors found matching your criteria.
                {approvedVendors.length === 0 && " The directory is currently empty."}
              </p>
              {approvedVendors.length > 0 && (searchTerm || categoryFilter) && (
                <Button variant="link" onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-primary">{vendor.name}</CardTitle>
                        <Badge variant="secondary">{vendor.category}</Badge>
                    </div>
                    {vendor.contactPerson && (
                        <CardDescription className="flex items-center text-xs pt-1">
                            <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {vendor.contactPerson}
                        </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${vendor.phoneNumber}`} className="text-foreground hover:text-primary hover:underline">{vendor.phoneNumber}</a>
                    </div>
                    {vendor.alternatePhoneNumber && (
                       <div className="flex items-center">
                         <PhoneForwarded className="h-4 w-4 mr-2 text-muted-foreground" />
                         <a href={`tel:${vendor.alternatePhoneNumber}`} className="text-foreground hover:text-primary hover:underline">{vendor.alternatePhoneNumber}</a>
                       </div>
                    )}
                    {vendor.address && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-muted-foreground">{vendor.address}</p>
                      </div>
                    )}
                     <div className="flex items-start">
                        <ListChecks className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-muted-foreground"><strong className="font-medium text-foreground/90">Services:</strong> {vendor.servicesOffered}</p>
                    </div>
                    {vendor.notes && (
                      <div className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                         <p className="text-muted-foreground italic"><strong className="font-medium text-foreground/90 not-italic">Notes:</strong> {vendor.notes}</p>
                      </div>
                    )}
                  </CardContent>
                   <CardFooter className="text-xs text-muted-foreground pt-3 border-t">
                      Added by {vendor.submittedByName} on {new Date(vendor.submittedAt).toLocaleDateString()}
                   </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
