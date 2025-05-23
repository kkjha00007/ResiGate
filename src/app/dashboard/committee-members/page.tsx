
'use client';
import { CommitteeMembersDisplay } from '@/components/dashboard/CommitteeMembersDisplay';
import { CommitteeMemberFormDialog } from '@/components/dashboard/admin/CommitteeMemberFormDialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import React, { useState, useEffect } from 'react';
import type { CommitteeMember } from '@/lib/types';

export default function CommitteeMembersPage() {
  const { 
    user, 
    isAdmin, 
    committeeMembers, 
    fetchCommitteeMembers, 
    addCommitteeMember, 
    updateCommitteeMember, 
    deleteCommitteeMember,
    isLoading: authIsLoading, // AuthProvider's general loading state
  } = useAuth();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true); // Specific loading for this page's data

  useEffect(() => {
    setIsDataLoading(true);
    fetchCommitteeMembers().finally(() => setIsDataLoading(false));
  }, [fetchCommitteeMembers]);

  const handleAddMember = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleEditMember = (member: CommitteeMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    // Confirmation is handled by AlertDialog in CommitteeMembersDisplay
    await deleteCommitteeMember(memberId);
    // AuthProvider will update committeeMembers state and trigger re-render
  };

  const handleFormSubmit = async (data: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>, memberId?: string) => {
    if (memberId) { // Editing existing member
      await updateCommitteeMember(memberId, data);
    } else { // Adding new member
      await addCommitteeMember(data);
    }
    setIsFormOpen(false);
    setEditingMember(null);
    // AuthProvider's functions will handle toast and refetching
  };
  
  const combinedLoading = authIsLoading || isDataLoading;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-semibold text-primary">Society Committee Members</CardTitle>
                <CardDescription>Meet the members managing our society. Admins can add, edit, or remove members.</CardDescription>
              </div>
            </div>
            {isAdmin() && (
              <Button onClick={handleAddMember}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Member
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      <CommitteeMembersDisplay 
        members={committeeMembers} 
        isAdmin={isAdmin()}
        onEdit={handleEditMember}
        onDelete={handleDeleteMember}
        isLoading={combinedLoading && committeeMembers.length === 0} // Show skeleton only if no data and still loading
      />

      {isAdmin() && (
        <CommitteeMemberFormDialog
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingMember}
        />
      )}
    </div>
  );
}
