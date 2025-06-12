'use client';

import React, { useEffect, useState } from 'react';
import { MyHelpDeskList } from '@/components/dashboard/complaints/MyComplaintsList';
import { useAuth } from '@/lib/auth-provider';

export default function HelpDeskPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    const res = await fetch('/api/helpdesk');
    const data = await res.json();
    setRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) fetchMyRequests();
  }, [user]);

  return (
    <MyHelpDeskList requests={requests} isLoading={isLoading} fetchMyRequests={fetchMyRequests} />
  );
}
