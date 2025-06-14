// src/components/dashboard/parking/ParkingRequestForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-provider';

export function ParkingRequestForm({ onRequestSubmitted }: { onRequestSubmitted?: () => void }) {
  const { user } = useAuth();
  const [type, setType] = useState<'car' | 'bike' | 'both' | ''>('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoized filtered vehicles by type
  const userVehicles = useMemo(() => Array.isArray(user?.vehicles) ? user.vehicles : [], [user]);
  const filteredVehicles = useMemo(() => {
    if (!type || type === 'both') return userVehicles;
    return userVehicles.filter(v => v.type === type);
  }, [userVehicles, type]);

  // Auto-populate vehicle number when type changes
  React.useEffect(() => {
    if (!type) {
      setVehicleNumber('');
      return;
    }
    if (filteredVehicles.length === 1 && !vehicleNumber) {
      setVehicleNumber(filteredVehicles[0].number);
    } else if (filteredVehicles.length !== 1) {
      setVehicleNumber('');
    }
  }, [type, filteredVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      if (!user) throw new Error('User not logged in');
      const res = await fetch('/api/parking/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          flatNumber: user.flatNumber,
          societyId: user.societyId,
          type,
          vehicleNumber,
          notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit request');
      setSuccess(true);
      setType('');
      setVehicleNumber('');
      setNotes('');
      setRefreshKey(k => k + 1); // trigger refresh of requests
      if (onRequestSubmitted) onRequestSubmitted();
    } catch (err) {
      setError('Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    success ? (
      <div className="text-green-600 font-medium mb-2">Request submitted! The admin will review your request.</div>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Parking Type</label>
          <Select value={type} onValueChange={v => setType(v as any)} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="bike">Bike</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Vehicle Number(s)</label>
          {filteredVehicles.length > 1 ? (
            <Select value={vehicleNumber} onValueChange={setVehicleNumber} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your vehicle" />
              </SelectTrigger>
              <SelectContent>
                {filteredVehicles.map((v, idx) => (
                  <SelectItem key={v.number + idx} value={v.number}>{v.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder={userVehicles.length === 0 ? "Enter vehicle number(s) (comma separated if both)" : "Vehicle number"}
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value)}
              required={type !== ''}
            />
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">Notes (optional)</label>
          <Textarea
            placeholder="Any additional info (e.g. preferred location, timing, etc.)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" disabled={submitting || !type || !vehicleNumber} className="w-full">
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    )
  );
}
