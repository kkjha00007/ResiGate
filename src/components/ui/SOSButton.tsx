import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

export default function SOSButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user || !user.societyId) return null;

  const handleSOS = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });
      if (res.ok) {
        toast({ title: 'SOS Sent', description: 'Society admins have been alerted.' });
      } else {
        toast({ title: 'Failed', description: 'Could not send SOS. Try again.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Network error. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 text-lg font-bold animate-pulse"
        onClick={() => setShowConfirm(true)}
        aria-label="Send SOS Alert"
        disabled={loading}
      >
        <AlertTriangle className="w-6 h-6 mr-1" /> SOS
      </button>
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Send SOS Alert?</h2>
            <p className="mb-4">Are you sure you want to alert all society admins? This should only be used in emergencies.</p>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowConfirm(false)} disabled={loading}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-bold" onClick={handleSOS} disabled={loading}>
                {loading ? 'Sending...' : 'Send SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
