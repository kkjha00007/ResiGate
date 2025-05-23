
// src/components/dashboard/CommitteeMembersDisplay.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Home, Mail, PhoneIcon, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import type { CommitteeMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
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

interface CommitteeMembersDisplayProps {
  members: CommitteeMember[];
  isAdmin: boolean;
  onEdit: (member: CommitteeMember) => void;
  onDelete: (memberId: string) => void;
  isLoading?: boolean;
}

export function CommitteeMembersDisplay({ members, isAdmin, onEdit, onDelete, isLoading }: CommitteeMembersDisplayProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="shadow-md flex flex-col">
            <CardHeader className="items-center text-center p-4">
              <div className="relative h-32 w-32 mb-3 bg-muted rounded-full animate-pulse"></div>
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 p-4 pt-0">
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  if (!members || members.length === 0) {
    return (
      <div className="text-center py-10">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No committee member information is available at this time.</p>
        {isAdmin && <p className="text-sm mt-2">Click "Add New Member" to get started.</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {members.map((member) => (
        <Card key={member.id} className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <CardHeader className="items-center text-center p-4">
            <div className="relative h-32 w-32 mb-3">
              <Image
                src={member.imageUrl || `https://placehold.co/200x200.png?text=${member.name.substring(0,2).toUpperCase()}`}
                alt={member.name}
                width={128}
                height={128}
                className="rounded-full object-cover"
                data-ai-hint="member photo"
              />
            </div>
            <CardTitle className="text-lg font-semibold text-primary">{member.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">{member.roleInCommittee}</Badge>
          </CardHeader>
          <CardContent className="flex-grow space-y-2 text-sm p-4 pt-0">
            <div className="flex items-center text-muted-foreground">
              <Home className="h-4 w-4 mr-2 text-primary/80" />
              <span>Flat: {member.flatNumber}</span>
            </div>
            {member.email && (
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2 text-primary/80" />
                <a href={`mailto:${member.email}`} className="hover:underline hover:text-primary truncate">
                  {member.email}
                </a>
              </div>
            )}
            {member.phone && (
               <div className="flex items-center text-muted-foreground">
                <PhoneIcon className="h-4 w-4 mr-2 text-primary/80" />
                <a href={`tel:${member.phone}`} className="hover:underline hover:text-primary">
                  {member.phone}
                </a>
              </div>
            )}
          </CardContent>
          {isAdmin && (
            <CardFooter className="p-2 border-t flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(member)} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700">
                <Edit3 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete committee member "<strong>{member.name}</strong>"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(member.id)} className="bg-destructive hover:bg-destructive/90">
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
