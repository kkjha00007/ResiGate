
'use client';
import { CreateNoticeForm } from '@/components/dashboard/admin/CreateNoticeForm';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Import NoticesTable and Separator later when implemented
// import { NoticesTable } from '@/components/dashboard/admin/NoticesTable';
// import { Separator } from '@/components/ui/separator';

export default function ManageNoticesPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin())) {
      router.replace('/dashboard'); 
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || !user || !isAdmin()) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreateNoticeForm />
      {/* 
      <Separator />
      <NoticesTable /> 
      */}
      {/* Placeholder for listing/managing existing notices */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Existing Notices</CardTitle>
          <CardDescription>
            Functionality to list, edit, and delete existing notices will be added here in Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
