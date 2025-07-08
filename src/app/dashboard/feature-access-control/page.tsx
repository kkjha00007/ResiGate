// src/app/dashboard/feature-access-control/page.tsx
// --- Modern Feature Flag Management Page ---
'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FEATURES, PRICING_TIERS, ENVIRONMENTS } from '@/lib/constants';
import type { FeatureFlag } from '@/lib/types';

// --- Sidebar: Society Selector & Feature Search ---
function SocietySelector({ societies, selectedSociety, onChange }: any) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Select Society</label>
      <Select value={selectedSociety} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select society" /></SelectTrigger>
        <SelectContent>
          {societies.map((soc: any) => (
            <SelectItem key={soc.id} value={soc.id}>{soc.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FeatureSearch({ search, setSearch }: any) {
  return (
    <div className="mb-4">
      <Input
        placeholder="Search features..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full"
      />
    </div>
  );
}

// --- Feature List Table ---
function FeatureListTable({ features, onSelect, selectedKey }: any) {
  // Show all features in alphabetical order, scrollable list (search and scroll work for all)
  const sorted = [...features].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="border rounded bg-white">
      <div className="font-semibold px-4 py-2 border-b bg-gray-50">Features</div>
      <ul style={{ maxHeight: 360, overflowY: 'auto' }}>
        {sorted.map((f: FeatureFlag) => (
          <li
            key={f.key}
            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${selectedKey === f.key ? 'bg-gray-100 font-bold' : ''}`}
            onClick={() => onSelect(f)}
          >
            <span>{f.name}</span>
            <span className={`ml-2 text-xs px-2 py-1 rounded ${f.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.enabled ? 'Enabled' : 'Disabled'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Permissions Matrix (Stub for now) ---
function PermissionsMatrix({ feature }: any) {

  // CRUD actions
  const CRUD = ['Create', 'Read', 'Update', 'Delete'];

  // Backend-integrated permissions state
  const [permissions, setPermissions] = useState<any>(feature?.permissions || {});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleGroups, setRoleGroups] = useState<{ key: string, label: string }[]>([]);

  // Load role groups from backend
  useEffect(() => {
    async function fetchRoleGroups() {
      try {
        const res = await fetch('/api/rbac/roles');
        if (res.ok) {
          const data = await res.json();
          // data.roleGroups is an object: { PLATFORM_ADMIN: [...], ... }
          // data.roleGroupNames is an object: { PLATFORM_ADMIN: 'Platform Admin', ... }
          // If roleGroupNames is not present, fallback to key
          const groupNames = data.roleGroupNames || {};
          setRoleGroups(Object.keys(data.roleGroups).map(key => ({ key, label: groupNames[key] || key })));
        }
      } catch {}
    }
    fetchRoleGroups();
  }, []);

  // Load permissions from backend when feature changes
  useEffect(() => {
    async function fetchPermissions() {
      if (!feature?.key) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/feature-flags/${feature.key}/permissions`);
        if (res.ok) {
          const data = await res.json();
          setPermissions(data?.permissions || {});
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPermissions();
  }, [feature?.key]);

  const handleToggle = (role: string, action: string) => {
    setPermissions((prev: any) => {
      const current = prev[role] || [];
      const exists = current.includes(action);
      const updated = exists ? current.filter((a: string) => a !== action) : [...current, action];
      return { ...prev, [role]: updated };
    });
  };

  // Save permissions to backend
  const savePermissions = async () => {
    if (!feature?.key) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/feature-flags/${feature.key}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });
      if (!res.ok) throw new Error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="font-semibold mb-2">Role Permissions</div>
      {loading ? (
        <div className="text-gray-500">Loading permissions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-50">Role Group</th>
                {CRUD.map(action => (
                  <th key={action} className="border px-2 py-1 bg-gray-50">{action}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roleGroups.map(role => (
                <tr key={role.key}>
                  <td className="border px-2 py-1 font-medium">{role.label}</td>
                  {CRUD.map(action => (
                    <td key={action} className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.key]?.includes(action) || false}
                        onChange={() => handleToggle(role.key, action)}
                        disabled={saving}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 flex gap-2 justify-end">
        <Button size="sm" onClick={savePermissions} disabled={saving || loading}>{saving ? 'Saving...' : 'Save Permissions'}</Button>
      </div>
    </div>
  );
}

// --- Feature Details Panel ---
function FeatureDetailsPanel({ feature, onEdit }: any) {
  if (!feature) return <div className="p-8 text-gray-400">Select a feature to view details.</div>;

  // --- Audit log state ---
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  // Tab state for audit log filtering
  const [tab, setTab] = useState<'details' | 'audit'>('details');
  const [auditTab, setAuditTab] = useState<'all' | 'permissions' | 'pricing' | 'abtest'>('all');

  useEffect(() => {
    if (!feature?.key) return;
    setAuditLoading(true);
    fetch(`/api/audit-logs?targetType=FeatureFlag&targetId=${feature.key}`)
      .then(res => res.ok ? res.json() : [])
      .then(setAuditLogs)
      .finally(() => setAuditLoading(false));
  }, [feature?.key]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xl font-bold">{feature.name}</div>
        <Button size="sm" variant="outline" onClick={() => onEdit(feature)}>Edit</Button>
      </div>
      <div className="mb-4 flex gap-4 border-b pb-2">
        <button className={`px-2 py-1 font-medium ${tab === 'details' ? 'border-b-2 border-blue-600' : ''}`} onClick={() => setTab('details')}>Details</button>
        <button className={`px-2 py-1 font-medium ${tab === 'audit' ? 'border-b-2 border-blue-600' : ''}`} onClick={() => setTab('audit')}>Audit / History</button>
      </div>
      {tab === 'details' && <>
        <div className="mb-2 text-gray-600">{feature.description}</div>
        <div>Status: <span className={`font-semibold ${feature.enabled ? 'text-green-600' : 'text-red-600'}`}>{feature.enabled ? 'Enabled' : 'Disabled'}</span></div>
        <div className="mt-2">
          <span className="font-semibold">Pricing Tiers: </span>
          {['free', 'premium', 'enterprise'].map(tier => (
            <span key={tier} className={`inline-block ml-2 px-2 py-1 rounded text-xs ${feature.tiers?.[tier] ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
          ))}
        </div>
        {/* A/B Test Config */}
        {feature.abTestConfig && (
          <div className="mt-4">
            <div className="font-semibold mb-1">A/B Testing</div>
            <div>Status: <span className={`font-semibold ${feature.abTestConfig.enabled ? 'text-green-600' : 'text-gray-400'}`}>{feature.abTestConfig.enabled ? 'Enabled' : 'Disabled'}</span></div>
            {feature.abTestConfig.enabled && feature.abTestConfig.groups && (
              <div className="mt-2">
                <div className="font-medium text-sm mb-1">Groups:</div>
                <ul>
                  {Object.entries(feature.abTestConfig.groups).map(([group, cfg]: any) => (
                    <li key={group} className="mb-1">
                      <span className="inline-block min-w-[80px] font-semibold">{group}</span>
                      <span className="inline-block ml-2">{cfg.percentage}%</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${cfg.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{cfg.enabled ? 'Enabled' : 'Disabled'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <PermissionsMatrix feature={feature} />
      </>}
      {tab === 'audit' && (
        <div className="mt-2">
          <div className="mb-2 flex gap-2">
            <button
              className={`px-2 py-1 rounded font-medium ${auditTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setAuditTab('all')}
            >All</button>
            <button
              className={`px-2 py-1 rounded font-medium ${auditTab === 'permissions' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setAuditTab('permissions')}
            >Permissions</button>
            <button
              className={`px-2 py-1 rounded font-medium ${auditTab === 'pricing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setAuditTab('pricing')}
            >Pricing</button>
            <button
              className={`px-2 py-1 rounded font-medium ${auditTab === 'abtest' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setAuditTab('abtest')}
            >A/B Tests</button>
          </div>
          {auditLoading ? (
            <div>Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-gray-400">No audit logs found for this feature.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-gray-50">When</th>
                    <th className="border px-2 py-1 bg-gray-50">Who</th>
                    <th className="border px-2 py-1 bg-gray-50">Action</th>
                    <th className="border px-2 py-1 bg-gray-50">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter((log: any) => {
                      if (auditTab === 'all') return true;
                      if (auditTab === 'permissions') return /permission/i.test(log.action) || /permission/i.test(log.details?.type || '');
                      if (auditTab === 'pricing') return /tier|pricing/i.test(log.action) || /tier|pricing/i.test(log.details?.type || '');
                      if (auditTab === 'abtest') return /ab.?test|abtest|a\/b/i.test(log.action) || /ab.?test|abtest|a\/b/i.test(log.details?.type || '');
                      return true;
                    })
                    .map((log: any) => (
                      <tr key={log.id}>
                        <td className="border px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="border px-2 py-1">{log.userName} <span className="text-gray-400">({log.userRole})</span></td>
                        <td className="border px-2 py-1">{log.action}</td>
                        <td className="border px-2 py-1 max-w-[200px] truncate" title={JSON.stringify(log.details)}>{log.details ? JSON.stringify(log.details) : '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Feature Flag Form ---
function FeatureFlagForm({ feature, onSave, onCancel }: any) {
  const [name, setName] = useState(feature?.name || '');
  const [key, setKey] = useState(feature?.key || '');
  const [description, setDescription] = useState(feature?.description || '');
  const [enabled, setEnabled] = useState(feature?.enabled || false);
  // Pricing tier state
  const [tiers, setTiers] = useState<{ [tier: string]: boolean }>(feature?.tiers || { free: true, premium: true, enterprise: true });

  // A/B test config state
  const [abTestEnabled, setAbTestEnabled] = useState(feature?.abTestConfig?.enabled || false);
  const [abGroups, setAbGroups] = useState<{ [group: string]: { percentage: number; enabled: boolean } }>(feature?.abTestConfig?.groups || { groupA: { percentage: 50, enabled: true }, groupB: { percentage: 50, enabled: true } });

  // Helper to update group
  const updateGroup = (group: string, field: 'percentage' | 'enabled', value: any) => {
    setAbGroups(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: value }
    }));
  };

  // Helper to add/remove group
  const addGroup = () => {
    let idx = 1;
    let name = '';
    do {
      name = `group${String.fromCharCode(65 + idx)}`;
      idx++;
    } while (abGroups[name]);
    setAbGroups(prev => ({ ...prev, [name]: { percentage: 0, enabled: true } }));
  };
  const removeGroup = (group: string) => {
    if (Object.keys(abGroups).length <= 1) return;
    setAbGroups(prev => {
      const copy = { ...prev };
      delete copy[group];
      return copy;
    });
  };

  // Calculate total percentage
  const totalPercent = Object.values(abGroups).reduce((sum, g) => sum + Number(g.percentage), 0);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const abTestConfig = abTestEnabled ? { enabled: true, groups: abGroups } : { enabled: false, groups: {} };
        onSave({ ...feature, name, key, description, enabled, tiers, abTestConfig });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Feature Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Key</label>
        <Input value={key} onChange={e => setKey(e.target.value)} required disabled={!!feature?.key} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} id="enabled" />
        <label htmlFor="enabled">Enabled</label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Pricing Tiers</label>
        <div className="flex gap-4">
          {['free', 'premium', 'enterprise'].map(tier => (
            <label key={tier} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tiers[tier] ?? false}
                onChange={e => setTiers(t => ({ ...t, [tier]: e.target.checked }))}
              />
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </label>
          ))}
        </div>
      </div>
      {/* A/B Test Config */}
      <div>
        <label className="block text-sm font-medium mb-1">A/B Testing</label>
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={abTestEnabled} onChange={e => setAbTestEnabled(e.target.checked)} id="abTestEnabled" />
          <label htmlFor="abTestEnabled">Enable A/B Testing</label>
        </div>
        {abTestEnabled && (
          <div className="space-y-2">
            {Object.entries(abGroups).map(([group, cfg]) => (
              <div key={group} className="flex items-center gap-2">
                <input
                  className="border px-1 py-0.5 rounded w-24"
                  value={group}
                  onChange={e => {
                    const newName = e.target.value;
                    if (!newName || abGroups[newName]) return;
                    setAbGroups(prev => {
                      const copy = { ...prev };
                      copy[newName] = copy[group];
                      delete copy[group];
                      return copy;
                    });
                  }}
                  disabled={Object.keys(abGroups).length <= 1}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cfg.percentage}
                  onChange={e => updateGroup(group, 'percentage', Number(e.target.value))}
                  className="border px-1 py-0.5 rounded w-16"
                />
                <span>%</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={cfg.enabled}
                    onChange={e => updateGroup(group, 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
                {Object.keys(abGroups).length > 1 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeGroup(group)}>-</Button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <Button type="button" size="sm" variant="outline" onClick={addGroup}>+ Add Group</Button>
              <span className={totalPercent !== 100 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Total: {totalPercent}%</span>
            </div>
            {totalPercent !== 100 && (
              <div className="text-xs text-red-600">Total percentage must be 100%</div>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={abTestEnabled && totalPercent !== 100}>Save</Button>
      </div>
    </form>
  );
}

// --- Backend Integration for Feature Flags ---
// Replace demo features with backend data
export default function FeatureFlagManagementPage() {
  // Societies state (load from backend)
  const [societies, setSocieties] = useState<any[]>([]);
  const [selectedSociety, setSelectedSociety] = useState('');
  const [search, setSearch] = useState('');
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editFeature, setEditFeature] = useState<FeatureFlag | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Load societies from backend
  useEffect(() => {
    async function fetchSocieties() {
      try {
        const res = await fetch('/api/societies');
        if (res.ok) {
          const data = await res.json();
          setSocieties(Array.isArray(data) ? data : (data?.societies || []));
          if ((Array.isArray(data) ? data : (data?.societies || [])).length > 0) {
            setSelectedSociety((Array.isArray(data) ? data : (data?.societies || []))[0].id);
          }
        }
      } catch {}
    }
    fetchSocieties();
  }, []);

  // Load features from backend
  useEffect(() => {
    async function fetchFeatures() {
      setLoading(true);
      try {
        const res = await fetch('/api/feature-flags');
        if (res.ok) {
          const data = await res.json();
          const flags = Array.isArray(data) ? data : (data?.flags || []);
          setFeatures(flags);
          // Debug: log all feature names
          console.log('Loaded features:', flags.map((f: any) => f.name));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchFeatures();
  }, []);

  // Filter features by search
  const filteredFeatures = features.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  // Dialog state: create or edit
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  // Handle create/edit
  const handleSaveFeature = async (flag: FeatureFlag) => {
    const isEdit = !!flag.key && features.some(f => f.key === flag.key);
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/feature-flags/${flag.key}` : '/api/feature-flags';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flag)
    });
    if (res.ok) {
      setShowDialog(false);
      setEditFeature(null);
      // Refresh features
      const updated = await fetch('/api/feature-flags');
      const data = await updated.json();
      setFeatures(Array.isArray(data) ? data : (data?.flags || []));
    }
  };

  return (
    <div className="flex h-full min-h-[80vh]">
      {/* Sidebar */}
      <div className="w-1/4 p-6 border-r bg-gray-50">
        <SocietySelector societies={societies} selectedSociety={selectedSociety} onChange={setSelectedSociety} />
        <FeatureSearch search={search} setSearch={setSearch} />
        <FeatureListTable features={filteredFeatures} onSelect={(f: FeatureFlag) => { setEditFeature(f); setDialogMode('edit'); /* Only select, do not open dialog */ }} selectedKey={editFeature?.key} />
        <div className="mt-6">
          <Dialog open={showDialog} onOpenChange={open => {
            setShowDialog(open);
            // Only clear selected feature if dialog was for creating a new feature
            if (!open && dialogMode === 'create') setEditFeature(null);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={() => { setEditFeature(null); setDialogMode('create'); setShowDialog(true); }}>+ New Feature Flag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogMode === 'edit' ? 'Edit Feature Flag' : 'New Feature Flag'}</DialogTitle>
              </DialogHeader>
              <FeatureFlagForm
                feature={dialogMode === 'edit' ? editFeature : null}
                onSave={handleSaveFeature}
                onCancel={() => { setShowDialog(false); /* do not clear selected feature on cancel */ }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1">
        <FeatureDetailsPanel feature={editFeature} onEdit={(f: FeatureFlag) => { setEditFeature(f); setDialogMode('edit'); setShowDialog(true); }} />
      </div>
    </div>
  );
}
