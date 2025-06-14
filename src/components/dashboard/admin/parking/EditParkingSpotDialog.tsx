'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import React, { useEffect, useState } from 'react';
import type { ParkingSpot, ParkingSpotStatus, ParkingSpotType, UserProfile } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { PARKING_SPOT_STATUSES, PARKING_SPOT_TYPES, USER_ROLES } from '@/lib/constants';
import { Edit3, Save, Car, Bike, MapPin, Home, User, Hash, Info } from 'lucide-react';

const editParkingSpotSchema = z.object({
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }).max(100, "Max 100 chars"),
  status: z.enum(["available", "allocated"], { required_error: "Status is required." }),
  allocatedToFlatNumber: z.string().optional(),
  allocatedToUserId: z.string().optional(),
  vehicleNumber: z.string().optional(),
  notes: z.string().max(200, "Max 200 chars").optional(),
});

type EditParkingSpotFormValues = z.infer<typeof editParkingSpotSchema>;

interface EditParkingSpotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  spot: ParkingSpot;
}

export function EditParkingSpotDialog({
  isOpen,
  onOpenChange,
  spot,
}: EditParkingSpotDialogProps) {
  const { updateParkingSpot, allUsers, fetchAllUsers } = useAuth(); // Fetch allUsers for resident dropdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [availableResidents, setAvailableResidents] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Fetch all users if not already available, specifically owners and renters
    if (allUsers.length === 0) {
      fetchAllUsers(); // Assuming fetchAllUsers gets all roles, we filter client-side
    }
  }, [allUsers, fetchAllUsers]);

  useEffect(() => {
    // Only Owners are eligible for parking allocation
    setAvailableResidents(
      allUsers.filter(u => u.role === USER_ROLES.OWNER)
              .sort((a, b) => (a.flatNumber ?? "").localeCompare(b.flatNumber ?? "") || a.name.localeCompare(b.name))
    );
  }, [allUsers]);


  const form = useForm<EditParkingSpotFormValues>({
    resolver: zodResolver(editParkingSpotSchema),
    defaultValues: {
      location: spot.location || '',
      status: spot.status,
      allocatedToFlatNumber: spot.allocatedToFlatNumber || '',
      allocatedToUserId: spot.allocatedToUserId || '',
      vehicleNumber: spot.vehicleNumber || '',
      notes: spot.notes || '',
    },
  });
  
  // Reset form when spot changes
  useEffect(() => {
    form.reset({
      location: spot.location || '',
      status: spot.status,
      allocatedToFlatNumber: spot.allocatedToFlatNumber || '',
      allocatedToUserId: spot.allocatedToUserId || '',
      vehicleNumber: spot.vehicleNumber || '',
      notes: spot.notes || '',
    });
  }, [spot, form, isOpen]); // Added isOpen to dependencies

  const currentStatus = form.watch('status');

  // When allocating, auto-populate vehicle number and set allocationUntil (freezeUntil) to today + 1 year
  useEffect(() => {
    if (form.watch('status') === 'allocated' && form.watch('allocatedToUserId')) {
      const selectedUser = allUsers.find(u => u.id === form.watch('allocatedToUserId'));
      if (selectedUser && Array.isArray(selectedUser.vehicles) && selectedUser.vehicles.length > 0) {
        // Prefer vehicle of matching type, else first
        const match = selectedUser.vehicles.find(v => v.type === spot.type) || selectedUser.vehicles[0];
        if (match) {
          form.setValue('vehicleNumber', match.number);
        }
      }
      // Set allocationUntil (freezeUntil) to today + 1 year
      // If you need to use freezeUntil, handle it outside the form state as it's not part of the schema.
      // const allocationUntil = new Date();
      // allocationUntil.setFullYear(allocationUntil.getFullYear() + 1);
      // form.setValue('freezeUntil', allocationUntil.toISOString());
    }
  }, [form.watch('status'), form.watch('allocatedToUserId'), allUsers, spot.type, form]);

  const handleSubmit = async (data: EditParkingSpotFormValues) => {
    setIsSubmitting(true);
    let submissionData: Partial<ParkingSpot> = { ...data };

    if (data.status === 'available') {
      submissionData = {
        ...submissionData,
        allocatedToFlatNumber: undefined,
        allocatedToUserId: undefined,
        vehicleNumber: undefined, // Also clear vehicle number if spot becomes available
      };
    } else if (data.status === 'allocated' && data.allocatedToUserId) {
        const selectedUser = allUsers.find(u => u.id === data.allocatedToUserId);
        if (selectedUser) {
            submissionData.allocatedToFlatNumber = selectedUser.flatNumber;
        } else {
            // Handle case where user might not be found, though unlikely if dropdown is populated correctly
            form.setError("allocatedToUserId", { type: "manual", message: "Selected resident not found." });
            setIsSubmitting(false);
            return;
        }
    } else if (data.status === 'allocated' && !data.allocatedToUserId) {
        form.setError("allocatedToUserId", { type: "manual", message: "Please select a resident to allocate the spot." });
        setIsSubmitting(false);
        return;
    }


    const result = await updateParkingSpot(spot.id, submissionData);
    if (result) {
      onOpenChange(false); // Close dialog on success
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Edit3 className="h-5 w-5"/> Edit Parking Spot: {spot.spotNumber} ({spot.type})
          </DialogTitle>
          <DialogDescription>Update details or assign this parking spot.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            {spot.freezeUntil && (
              <div className="text-xs text-muted-foreground mb-2">
                <strong>Allocation Until:</strong> {new Date(spot.freezeUntil).toLocaleDateString()}
              </div>
            )}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Wing</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Basement 1, Tower A" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value as ParkingSpotStatus);
                      if (value === 'available') {
                          form.setValue('allocatedToFlatNumber', '');
                          form.setValue('allocatedToUserId', '');
                          form.setValue('vehicleNumber', '');
                      }
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PARKING_SPOT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                           {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentStatus === 'allocated' && (
              <>
                <FormField
                  control={form.control}
                  name="allocatedToUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocate to Resident</FormLabel>
                       <Select 
                            onValueChange={(userId) => {
                                field.onChange(userId);
                                const selectedUser = availableResidents.find(r => r.id === userId);
                                if (selectedUser) {
                                    form.setValue('allocatedToFlatNumber', selectedUser.flatNumber || '');
                                } else {
                                    form.setValue('allocatedToFlatNumber', '');
                                }
                            }} 
                            value={field.value}
                        >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Resident (Flat - Name)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Only Owners are shown in this dropdown (Renters are excluded) */}
                          {availableResidents.map((res) => (
                            <SelectItem key={res.id} value={res.id}>
                              {res.flatNumber} - {res.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="allocatedToFlatNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Flat Number (Auto-filled)</FormLabel>
                        <FormControl>
                            <div className="relative">
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input readOnly {...field} className="pl-10 bg-muted/50" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="vehicleNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Vehicle Number (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="e.g., MH01AB1234" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="e.g., Temporary allocation, Awaiting sticker" {...field} className="pl-10" rows={2} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                ) : (
                   <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
