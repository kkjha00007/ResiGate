// src/app/dashboard/admin/manage-societies/page.tsx
'use client';
import { CreateSocietyForm } from '@/components/dashboard/admin/societies/CreateSocietyForm';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import SocietyInvitesTable from '@/components/dashboard/admin/SocietyInvitesTable';

export default function ManageSocietiesPage() {
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
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Manage Societies</CardTitle>
              <CardDescription>Create and manage societies within the ResiGate platform.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CreateSocietyForm />
        </CardContent>
      </Card>
      {/* Placeholder for a table to list and manage existing societies in a future batch */}
      {/* <Separator /> */}
      {/* <SocietiesTable /> */}
      <SocietyInvitesTable />
    </div>
  );
}
