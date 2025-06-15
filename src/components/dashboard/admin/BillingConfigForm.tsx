// src/components/dashboard/admin/BillingConfigForm.tsx
'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { SocietyBillingConfig } from '@/lib/types';

interface Props {
  config?: SocietyBillingConfig;
  onSave: (config: SocietyBillingConfig) => void;
}

export function BillingConfigForm({ config, onSave }: Props) {
  const [categories, setCategories] = useState(config?.categories || [
    { key: '', label: '', perFlatType: {}, isMandatory: true, description: '' }
  ]);
  const [flatTypes, setFlatTypes] = useState(config?.flatTypes || ['1BHK', '2BHK']);
  const [effectiveFrom, setEffectiveFrom] = useState(config?.effectiveFrom || new Date().toISOString().slice(0, 10));

  // Prevent deleting a flat type or category if it is referenced in any existing bill
  const [inUseFlatTypes, setInUseFlatTypes] = useState<string[]>([]);
  const [inUseCategories, setInUseCategories] = useState<string[]>([]);

  React.useEffect(() => {
    // Fetch in-use flatTypes and categories for this society
    async function fetchInUse() {
      if (!config?.societyId) return;
      const res = await fetch(`/api/billing/bills?societyId=${config.societyId}`);
      const data = await res.json();
      const bills = data.bills || [];
      const usedFlatTypes = new Set<string>();
      const usedCategories = new Set<string>();
      bills.forEach((bill: any) => {
        if (bill.breakdown) {
          Object.keys(bill.breakdown).forEach((cat: string) => usedCategories.add(cat));
        }
        if (bill.flatType) usedFlatTypes.add(bill.flatType);
      });
      setInUseFlatTypes(Array.from(usedFlatTypes));
      setInUseCategories(Array.from(usedCategories));
    }
    fetchInUse();
  }, [config?.societyId]);

  const handleCategoryChange = (idx: number, field: string, value: any) => {
    setCategories(cats => cats.map((cat, i) => i === idx ? { ...cat, [field]: value } : cat));
  };
  const handleFlatTypeChange = (idx: number, value: string) => {
    setFlatTypes(types => types.map((t, i) => i === idx ? value : t));
  };
  const handlePerFlatTypeChange = (catIdx: number, flatType: string, value: number) => {
    setCategories(cats => cats.map((cat, i) => i === catIdx ? {
      ...cat,
      perFlatType: { ...cat.perFlatType, [flatType]: value }
    } : cat));
  };
  const addCategory = () => setCategories([...categories, { key: '', label: '', perFlatType: {}, isMandatory: true, description: '' }]);
  const removeCategory = (idx: number) => {
    const catKey = categories[idx].key;
    if (inUseCategories.includes(catKey)) {
      alert(`Cannot remove category '${catKey}' as it is used in existing bills.`);
      return;
    }
    setCategories(categories.filter((_, i) => i !== idx));
  };
  const addFlatType = () => setFlatTypes([...flatTypes, '']);
  const removeFlatType = (idx: number) => {
    const ft = flatTypes[idx];
    if (inUseFlatTypes.includes(ft)) {
      alert(`Cannot remove flat type '${ft}' as it is used in existing bills.`);
      return;
    }
    setFlatTypes(flatTypes.filter((_, i) => i !== idx));
  };

  // Interest config state
  const [interestEnabled, setInterestEnabled] = useState(config?.interestRules?.enabled || false);
  const [interestDaysAfterDue, setInterestDaysAfterDue] = useState(config?.interestRules?.daysAfterDue ?? 0);
  const [interestRateType, setInterestRateType] = useState(config?.interestRules?.rateType || 'percent');
  const [interestAmount, setInterestAmount] = useState(config?.interestRules?.amount ?? 0);
  const [interestCompounding, setInterestCompounding] = useState(config?.interestRules?.compounding || 'monthly');
  const [interestMaxAmount, setInterestMaxAmount] = useState(config?.interestRules?.maxAmount ?? '');
  const [interestPerCategory, setInterestPerCategory] = useState(config?.interestRules?.perCategory || false);
  const [interestDescription, setInterestDescription] = useState(config?.interestRules?.description || '');

  const handleSave = () => {
    // Validation
    const errors: string[] = [];
    if (!flatTypes.length || flatTypes.some(ft => !ft.trim())) errors.push('All flat types are required.');
    categories.forEach((cat, i) => {
      if (!cat.key.trim()) errors.push(`Category key required (row ${i + 1})`);
      if (!cat.label.trim()) errors.push(`Category label required (row ${i + 1})`);
      flatTypes.forEach(ft => {
        if (cat.perFlatType[ft] === undefined || isNaN(Number(cat.perFlatType[ft]))) {
          errors.push(`Amount for ${cat.label} (${ft}) required (row ${i + 1})`);
        }
      });
    });
    if (errors.length) {
      alert('Validation errors:\n' + errors.join('\n'));
      return;
    }
    const newConfig: SocietyBillingConfig = {
      id: config?.id || '',
      societyId: config?.societyId || '',
      categories,
      flatTypes,
      effectiveFrom,
      updatedAt: new Date().toISOString(),
      interestRules: interestEnabled ? {
        enabled: interestEnabled,
        daysAfterDue: Number(interestDaysAfterDue),
        rateType: interestRateType as 'fixed' | 'percent',
        amount: Number(interestAmount),
        compounding: interestCompounding as 'monthly' | 'daily' | 'none',
        maxAmount: interestMaxAmount ? Number(interestMaxAmount) : undefined,
        perCategory: interestPerCategory,
        description: interestDescription,
      } : undefined,
    };
    onSave(newConfig);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Billing Template/Config</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="font-semibold">Flat Types:</label>
          {flatTypes.map((ft, i) => (
            <span key={i} className="flex items-center gap-2 mb-1">
              <Input value={ft} onChange={e => handleFlatTypeChange(i, e.target.value)} className="w-32" />
              <Button size="sm" variant="outline" onClick={() => removeFlatType(i)} disabled={flatTypes.length <= 1}>Remove</Button>
            </span>
          ))}
          <Button size="sm" onClick={addFlatType}>Add Flat Type</Button>
        </div>
        <div className="mb-4">
          <label className="font-semibold">Categories/Sections:</label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                {flatTypes.map(ft => <TableHead key={ft}>{ft} Amount</TableHead>)}
                <TableHead>Type</TableHead>
                <TableHead>Mandatory?</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat, i) => (
                <TableRow key={i}>
                  <TableCell><Input value={cat.key} onChange={e => handleCategoryChange(i, 'key', e.target.value)} /></TableCell>
                  <TableCell><Input value={cat.label} onChange={e => handleCategoryChange(i, 'label', e.target.value)} /></TableCell>
                  {flatTypes.map(ft => (
                    <TableCell key={ft}>
                      <Input type="number" value={cat.perFlatType[ft] || ''} onChange={e => handlePerFlatTypeChange(i, ft, Number(e.target.value))} />
                    </TableCell>
                  ))}
                  <TableCell>
                    <select value={cat.chargeType || 'recurring'} onChange={e => handleCategoryChange(i, 'chargeType', e.target.value)} className="input input-bordered">
                      <option value="recurring">Recurring</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" checked={cat.isMandatory ?? true} onChange={e => handleCategoryChange(i, 'isMandatory', e.target.checked)} />
                  </TableCell>
                  <TableCell><Input value={cat.description || ''} onChange={e => handleCategoryChange(i, 'description', e.target.value)} /></TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => removeCategory(i)} disabled={categories.length <= 1}>Remove</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button size="sm" onClick={addCategory}>Add Category</Button>
        </div>
        <div className="mb-4">
          <label className="font-semibold">Effective From:</label>
          <Input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} className="w-48" />
        </div>
        <div className="mb-4">
          <label className="font-semibold">Overdue Interest Rules:</label>
          <div className="flex items-center gap-4 mb-2">
            <label><input type="checkbox" checked={interestEnabled} onChange={e => setInterestEnabled(e.target.checked)} /> Enable Interest on Overdue</label>
          </div>
          {interestEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label>Grace Period (days after due):
                <Input type="number" min={0} value={interestDaysAfterDue} onChange={e => setInterestDaysAfterDue(Number(e.target.value))} className="w-32" />
              </label>
              <label>Rate Type:
                <select value={interestRateType} onChange={e => setInterestRateType(e.target.value as 'percent' | 'fixed')} className="input input-bordered">
                  <option value="percent">Percent per period</option>
                  <option value="fixed">Fixed per period</option>
                </select>
              </label>
              <label>Amount:
                <Input type="number" value={interestAmount} onChange={e => setInterestAmount(Number(e.target.value))} className="w-32" />
              </label>
              <label>Compounding:
                <select value={interestCompounding} onChange={e => setInterestCompounding(e.target.value as 'monthly' | 'daily' | 'none')} className="input input-bordered">
                  <option value="monthly">Monthly</option>
                  <option value="daily">Daily</option>
                  <option value="none">None (simple)</option>
                </select>
              </label>
              <label>Max Interest Amount (optional):
                <Input type="number" value={interestMaxAmount} onChange={e => setInterestMaxAmount(e.target.value)} className="w-32" />
              </label>
              <label><input type="checkbox" checked={interestPerCategory} onChange={e => setInterestPerCategory(e.target.checked)} /> Interest per Category</label>
              <label>Description:
                <Input value={interestDescription} onChange={e => setInterestDescription(e.target.value)} className="w-64" />
              </label>
            </div>
          )}
        </div>
        <Button onClick={handleSave}>Save Template</Button>
        {/* --- Audit Trail Section --- */}
        {config?.auditTrail && config.auditTrail.length > 0 && (
          <div className="mt-6">
            <b>Audit Trail:</b>
            <ul className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
              {config.auditTrail.map((entry, i) => (
                <li key={entry.id || i} className="mb-1">
                  <span className="font-semibold">{entry.changeType.toUpperCase()}</span> by {entry.changedByName || entry.changedBy} ({entry.changedByRole || 'user'}) at {new Date(entry.changedAt).toLocaleString()} {entry.notes && <span>- {entry.notes}</span>}
                  {entry.field && <span> [Field: {entry.field}]</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BillingConfigForm;
