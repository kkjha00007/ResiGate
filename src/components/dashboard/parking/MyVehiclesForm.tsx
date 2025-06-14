// src/components/dashboard/parking/MyVehiclesForm.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function MyVehiclesForm() {
  const { user } = useAuth();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState<'car' | 'bike' | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicles: [
            ...(user.vehicles || []),
            { number: vehicleNumber, type, notes, addedAt: new Date().toISOString() },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to add vehicle');
      setSuccess(true);
      setVehicleNumber('');
      setType('');
      setNotes('');
    } catch (err) {
      setError('Failed to add vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <div className="text-green-600 mb-2">Vehicle added!</div>}
      <div>
        <label className="block mb-1 font-medium">Vehicle Number</label>
        <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} required />
      </div>
      <div>
        <label className="block mb-1 font-medium">Type</label>
        <Select value={type} onValueChange={v => setType(v as any)} required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car">Car</SelectItem>
            <SelectItem value="bike">Bike</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Notes (optional)</label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button type="submit" disabled={submitting || !type || !vehicleNumber} className="w-full">
        {submitting ? 'Adding...' : 'Add Vehicle'}
      </Button>
    </form>
  );
}
