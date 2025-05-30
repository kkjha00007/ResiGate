// src/app/dashboard/admin/manage-personas/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import type { Persona, UserRole } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import './manage-personas.css'; // Ensure this matches the actual filename

const ALL_FEATURES = [
  { key: 'manageUsers', label: 'Manage Users' },
  { key: 'manageNotices', label: 'Manage Notices' },
  { key: 'manageMeetings', label: 'Manage Meetings' },
  { key: 'manageFacilities', label: 'Manage Facilities' },
  { key: 'manageVendors', label: 'Manage Vendors' },
  { key: 'manageParking', label: 'Manage Parking' },
  { key: 'manageSocietySettings', label: 'Society Settings' },
  { key: 'managePersonas', label: 'Manage Personas' },
  { key: 'viewAuditLogs', label: 'View Audit Logs' },
];

function PersonaForm({ initial, onSave, onCancel }: { initial?: Partial<Persona>, onSave: (p: Partial<Persona>) => void, onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [roleKeys, setRoleKeys] = useState<string[]>(initial?.roleKeys || []);
  const [featureAccess, setFeatureAccess] = useState<{ [k: string]: boolean }>(initial?.featureAccess || {});

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...initial, name, description, roleKeys: roleKeys as UserRole[], featureAccess }); }} className="space-y-6 text-base">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-semibold mb-2 text-lg">Name</label>
          <input className="border px-4 py-3 w-full rounded-lg text-lg focus:ring-2 focus:ring-blue-400" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-lg">Description</label>
          <input className="border px-4 py-3 w-full rounded-lg text-lg focus:ring-2 focus:ring-blue-400" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-2 text-lg">Roles (comma separated)</label>
        <input className="border px-4 py-3 w-full rounded-lg text-lg focus:ring-2 focus:ring-blue-400" value={roleKeys.join(', ')} onChange={e => setRoleKeys(e.target.value.split(',').map(s => s.trim()))} required />
      </div>
      <div>
        <label className="block font-semibold mb-2 text-lg">Feature Access</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ALL_FEATURES.map(f => (
            <div key={f.key} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
              <span className="flex-1 text-base font-medium">{f.label}</span>
              <Switch
                checked={!!featureAccess[f.key]}
                onCheckedChange={v => setFeatureAccess(fa => ({ ...fa, [f.key]: v }))}
                className={featureAccess[f.key] ? 'bg-green-500' : 'bg-red-500'}
              />
              <span className={featureAccess[f.key] ? 'text-green-600 font-bold ml-2' : 'text-red-600 font-bold ml-2'}>
                {featureAccess[f.key] ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-6 justify-end">
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg shadow text-lg font-semibold">Save</button>
        <button type="button" className="bg-gray-200 px-8 py-3 rounded-lg text-lg font-semibold" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function PersonaCard({ persona, onEdit, onDelete }: { persona: Persona, onEdit: () => void, onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="persona-flip-card group cursor-pointer">
      <div className={`persona-flip-inner ${flipped ? 'flipped' : ''}`}> 
        {/* Front */}
        <div className="persona-flip-front bg-white rounded-2xl shadow-xl p-6 flex flex-col justify-between h-full">
          <div>
            <div className="text-2xl font-bold text-slate-800 mb-2">{persona.name}</div>
            <div className="text-base text-slate-500 mb-3">{persona.description}</div>
            <div className="text-base font-semibold text-blue-700 mb-2">{persona.roleKeys.join(', ')}</div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex gap-3">
              <button className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-blue-500 hover:to-blue-700 transition text-sm" onClick={e => { e.stopPropagation(); onEdit(); }}>Edit</button>
              <button className="bg-gradient-to-r from-red-400 to-red-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-red-500 hover:to-red-700 transition text-sm" onClick={e => { e.stopPropagation(); onDelete(); }}>Delete</button>
            </div>
            <button
              className="mt-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-white px-8 py-2 rounded-full font-semibold shadow hover:from-cyan-500 hover:to-blue-500 transition text-base"
              onClick={e => { e.stopPropagation(); setFlipped(true); }}
              title="Features"
            >
              Features
            </button>
          </div>
        </div>
        {/* Back */}
        <div className="persona-flip-back bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center h-full">
          <div className="text-xl font-bold text-blue-700 mb-4 tracking-wide">Features</div>
          <div className="flex flex-col gap-2 w-full max-h-36 overflow-y-auto px-2 custom-scrollbar">
            {Object.keys(persona.featureAccess).filter(f => persona.featureAccess[f]).length === 0 ? (
              <span className="text-slate-400 italic">No features enabled</span>
            ) : (
              Object.keys(persona.featureAccess).filter(f => persona.featureAccess[f]).map(f =>
                <span key={f} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-full px-4 py-2 text-base font-semibold shadow feature-badge animate-fadeIn">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {ALL_FEATURES.find(feat => feat.key === f)?.label || f}
                </span>
              )
            )}
          </div>
          <button
            className="mt-6 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold shadow hover:from-gray-400 hover:to-gray-500 transition"
            onClick={e => { e.stopPropagation(); setFlipped(false); }}
            title="Back"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagePersonasPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPersona, setEditPersona] = useState<Persona | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin())) {
      router.replace('/no-access');
    }
  }, [user, isLoading, isAdmin, router]);

  const fetchPersonas = () => {
    if (user && user.societyId) {
      setLoading(true);
      fetch(`/api/personas?societyId=${user.societyId}`)
        .then(res => res.json())
        .then(setPersonas)
        .catch(() => setError('Failed to load personas'))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchPersonas(); }, [user]);

  const handleSave = async (data: Partial<Persona>) => {
    setShowForm(false);
    setEditPersona(null);
    setLoading(true);
    const method = data.id ? 'PATCH' : 'POST';
    await fetch('/api/personas', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, societyId: user?.societyId }),
    });
    fetchPersonas();
  };

  const handleDelete = async (id: string) => {
    if (!user?.societyId) return;
    if (!confirm('Delete this persona?')) return;
    setLoading(true);
    await fetch('/api/personas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, societyId: user.societyId }),
    });
    fetchPersonas();
  };

  if (isLoading || loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-blue-50 py-8 px-2 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Manage Personas</h1>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded shadow transition" onClick={() => { setEditPersona(null); setShowForm(true); }}>Create Persona</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
          {personas.map(p => (
            <PersonaCard key={p.id} persona={p} onEdit={() => { setEditPersona(p); setShowForm(true); }} onDelete={() => handleDelete(p.id)} />
          ))}
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-0 rounded-3xl shadow-2xl min-w-[480px] max-w-2xl w-full relative animate-fadeIn overflow-hidden">
            <button className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-3xl font-bold z-10" onClick={() => { setShowForm(false); setEditPersona(null); }}>&times;</button>
            <div className="p-10">
              <PersonaForm initial={editPersona || {}} onSave={handleSave} onCancel={() => { setShowForm(false); setEditPersona(null); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
