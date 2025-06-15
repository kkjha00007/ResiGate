// src/app/dashboard/my-bills/page.tsx
'use client';
import React from 'react';
import { MyBillsTable } from '@/components/dashboard/MyBillsTable';

export default function MyBillsPage() {
  return (
    <div className="container mx-auto py-8">
      <MyBillsTable />
    </div>
  );
}
