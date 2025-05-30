// src/app/dashboard/admin/society-settings/page.tsx
'use client';
import { SocietyInfoForm } from '@/components/dashboard/admin/SocietyInfoForm';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function SocietySettingsPage() {
  const { user, isLoading, isAdmin, isSocietyAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin() && !isSocietyAdmin()))) {
      router.replace('/dashboard'); 
    }
  }, [user, isLoading, isAdmin, isSocietyAdmin, router]);

  if (isLoading || !user || (!isAdmin() && !isSocietyAdmin())) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Society General Settings</CardTitle>
              <CardDescription>Manage basic information about the society.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SocietyInfoForm />
        </CardContent>
      </Card>
    </div>
  );
}
