'use client';
import ResidentApprovalTable from '../../../components/dashboard/ResidentApprovalTable';
import { useAuth } from '@/lib/auth-provider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyApprovalsPage() {
  const { user, isLoading, isOwnerOrRenter } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isOwnerOrRenter())) {
      router.replace('/no-access');
    }
  }, [user, isLoading, isOwnerOrRenter, router]);

  if (isLoading || !user || !isOwnerOrRenter()) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResidentApprovalTable />
    </div>
  );
}
