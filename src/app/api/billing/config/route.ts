// src/app/api/billing/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSocietySettingsContainer } from '@/lib/cosmosdb';
import { SocietyBillingConfig, AuditTrailEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { sendNotificationToAdmins } from '@/lib/notifications';

// Helper to create an audit entry
function makeAuditEntry({ changeType, changedBy, changedByName, changedByRole, before, after, field, notes }: Partial<AuditTrailEntry>): AuditTrailEntry {
  return {
    id: uuidv4(),
    changedBy: changedBy || 'system',
    changedByName,
    changedByRole,
    changedAt: new Date().toISOString(),
    changeType: changeType || 'updated',
    before,
    after,
    field,
    notes,
  };
}

// GET: Get billing config for a society (optionally for a given period)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const societyId = url.searchParams.get('societyId') || request.headers.get('x-society-id');
  const period = url.searchParams.get('period'); // e.g. '2025-06'
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const container = getSocietySettingsContainer();
    // Support versioned configs: fetch all configs for this society
    const { resources: configs } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.societyId = @societyId AND IS_DEFINED(c.billingConfigs)',
        parameters: [{ name: '@societyId', value: societyId }]
      })
      .fetchAll();
    let billingConfig = null;
    if (configs && configs.length > 0) {
      // Flatten all configs
      const allConfigs = configs.flatMap((doc: any) => doc.billingConfigs || []);
      if (period) {
        // Find config effective for this period
        const periodDate = new Date(period + '-01');
        billingConfig = allConfigs
          .filter((cfg: any) => new Date(cfg.effectiveFrom) <= periodDate)
          .sort((a: any, b: any) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0] || null;
      } else {
        // Return latest config
        billingConfig = allConfigs.sort((a: any, b: any) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0] || null;
      }
    }
    return NextResponse.json({ billingConfig });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch billing config', error: error.message }, { status: 500 });
  }
}

// POST: Save/update billing config for a society (versioned, with overlap check)
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { societyId, ...billingConfig } = body;
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const container = getSocietySettingsContainer();
    let { resource: existing } = await container.item(societyId, societyId).read<any>();
    if (!existing) {
      existing = { id: societyId, societyId, billingConfigs: [] };
    }
    if (!existing.billingConfigs) existing.billingConfigs = [];
    // Prevent overlap: no config with same effectiveFrom
    if (existing.billingConfigs.some((cfg: any) => cfg.effectiveFrom === billingConfig.effectiveFrom)) {
      return NextResponse.json({ message: 'A config with this effective date already exists.' }, { status: 400 });
    }
    // Add audit trail entry to config
    const auditEntry = makeAuditEntry({
      changeType: 'created',
      changedBy: billingConfig.updatedByUserId || 'system',
      changedByName: billingConfig.updatedByName,
      changedByRole: billingConfig.updatedByRole,
      after: billingConfig,
      notes: 'Billing config created.'
    });
    billingConfig.auditTrail = [auditEntry];
    existing.billingConfigs.push({ ...billingConfig, societyId });
    existing.updatedAt = new Date().toISOString();
    await container.items.upsert(existing);
    await sendNotificationToAdmins({
      societyId,
      type: 'billing',
      title: 'Billing Configuration Changed',
      message: `The billing configuration has been updated.`,
      link: '/dashboard/admin/billing-config',
    });
    return NextResponse.json({ message: 'Billing config saved', billingConfig: billingConfig });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to save billing config', error: error.message }, { status: 500 });
  }
}
