
// src/components/dashboard/admin/facilities/FacilitiesTable.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Facility } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Edit3, Trash2, ToggleLeft, ToggleRight, ListOrdered, AlertTriangle, Building, Info } from 'lucide-react';
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
import { EditFacilityDialog } from './EditFacilityDialog'; // To be created

export function FacilitiesTable() {
  const { facilities, fetchFacilities, updateFacility, deleteFacility, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleToggleActive = async (facility: Facility) => {
    setIsProcessing(facility.id);
    await updateFacility(facility.id, { isActive: !facility.isActive });
    setIsProcessing(null);
  };

  const handleDelete = async (facilityId: string) => {
    setIsProcessing(facilityId);
    await deleteFacility(facilityId);
    setIsProcessing(null);
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setIsFormOpen(true);
  };

  if (authLoading && facilities.length === 0) {
    return (
      <div className="flex h-[calc(50vh)] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading facilities...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ListOrdered className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Manage Facilities</CardTitle>
              <CardDescription>View, edit, activate/deactivate, and delete society facilities.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <div className="text-center py-10">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No facilities have been defined yet.</p>
              <p className="text-sm mt-1">Use the form above to add new facilities.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell className="truncate max-w-xs text-sm text-muted-foreground">{facility.description || 'N/A'}</TableCell>
                      <TableCell className="text-center">{facility.capacity || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={facility.isActive ? 'default' : 'outline'} className={facility.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}>
                          {facility.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(facility)} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700" disabled={isProcessing === facility.id}>
                          <Edit3 className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(facility)}
                          disabled={isProcessing === facility.id}
                          className={facility.isActive ? "text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700" : "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"}
                        >
                          {isProcessing === facility.id && facility.id === isProcessing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-current"></div>
                          ) : (
                            facility.isActive ? <ToggleLeft className="mr-1 h-4 w-4" /> : <ToggleRight className="mr-1 h-4 w-4" />
                          )}
                          {facility.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isProcessing === facility.id}>
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete the facility "<strong>{facility.name}</strong>"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(facility.id)}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={isProcessing === facility.id}
                              >
                               {isProcessing === facility.id ? 'Deleting...' : 'Confirm Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {editingFacility && (
        <EditFacilityDialog
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingFacility(null);
          }}
          facility={editingFacility}
        />
      )}
    </>
  );
}
