// src/app/dashboard/admin/manage-billing/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { BillManagementTable } from '@/components/dashboard/admin/BillManagementTable';
import { ExpenseEntryTable } from '@/components/dashboard/admin/ExpenseEntryTable';
import { FinancialReports } from '@/components/dashboard/admin/FinancialReports';
import { BillEmailLogTable } from '@/components/dashboard/admin/BillEmailLogTable';
import BillingConfigForm from '@/components/dashboard/admin/BillingConfigForm';
import { useAuth } from '@/lib/auth-provider';
import type { SocietyBillingConfig } from '@/lib/types';

export default function ManageBillingPage() {
  const { user } = useAuth();
  const [billingConfig, setBillingConfig] = useState<SocietyBillingConfig | undefined>();

  useEffect(() => {
    if (!user) return;
    fetch(`/api/billing/config?societyId=${user.societyId}`)
      .then(res => res.json())
      .then(data => setBillingConfig(data.billingConfig || undefined));
  }, [user]);

  const handleSaveConfig = async (config: SocietyBillingConfig) => {
    if (!user) return;
    await fetch('/api/billing/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, societyId: user.societyId })
    });
    setBillingConfig(config);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <BillingConfigForm config={billingConfig} onSave={handleSaveConfig} />
      <BillManagementTable />
      <ExpenseEntryTable />
      <FinancialReports societyId={user?.societyId || ''} />
      <BillEmailLogTable />
    </div>
  );
}
