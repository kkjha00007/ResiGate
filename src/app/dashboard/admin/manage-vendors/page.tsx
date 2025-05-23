
// src/app/dashboard/admin/manage-vendors/page.tsx
'use client';
import { PendingVendorsTable } from '@/components/dashboard/admin/PendingVendorsTable';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';
// Placeholder for ApprovedVendorsTable for future phases
// import { ApprovedVendorsTable } from '@/components/dashboard/admin/ApprovedVendorsTable';

export default function ManageVendorsPage() {
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
      <PendingVendorsTable />
      {/* <Separator /> */}
      {/* <Card>
        <CardHeader>
            <CardTitle>Manage Approved Vendors</CardTitle>
            <CardDescription>Edit or remove vendors from the directory.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Management of approved vendors will be available in a future update.</p>
            {/* <ApprovedVendorsTable /> Placeholder for later phase *V/}
        </CardContent>
      </Card> */}
    </div>
  );
}
