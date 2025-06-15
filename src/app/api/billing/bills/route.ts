// src/app/api/billing/bills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceBillsContainer, getSocietySettingsContainer, getUsersContainer } from '@/lib/cosmosdb';
import { MaintenanceBill, AuditTrailEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createNotification, sendNotificationToAdmins } from '@/lib/notifications';

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

// GET: List bills (with optional filters for user/admin)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const societyId = url.searchParams.get('societyId') || request.headers.get('x-society-id');
  const userId = url.searchParams.get('userId');
  const flatNumber = url.searchParams.get('flatNumber');
  const period = url.searchParams.get('period');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let query = 'SELECT * FROM c WHERE c.societyId = @societyId';
  const parameters: any[] = [{ name: '@societyId', value: societyId }];
  if (userId) {
    query += ' AND c.userId = @userId';
    parameters.push({ name: '@userId', value: userId });
  }
  if (flatNumber) {
    query += ' AND c.flatNumber = @flatNumber';
    parameters.push({ name: '@flatNumber', value: flatNumber });
  }
  if (period) {
    query += ' AND c.period = @period';
    parameters.push({ name: '@period', value: period });
  }
  query += ' ORDER BY c.generatedAt DESC';
  try {
    const container = getMaintenanceBillsContainer();
    const { resources } = await container.items.query({ query, parameters }).fetchAll();
    return NextResponse.json({ bills: resources });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch bills', error: error.message }, { status: 500 });
  }
}

// POST: Create a new bill or generate bills for a period or multiple periods
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const action = body.action;
  const container = getMaintenanceBillsContainer();
  if (action === 'generate') {
    // Support multi-period: period can be a string or array
    let periods: string[] = [];
    if (Array.isArray(body.periods)) {
      periods = body.periods;
    } else if (body.period) {
      periods = [body.period];
    } else if (body.frequency && body.count && body.startPeriod) {
      // frequency: 'monthly'|'quarterly'|'yearly', count: number, startPeriod: 'YYYY-MM'
      const start = new Date(body.startPeriod + '-01');
      for (let i = 0; i < body.count; i++) {
        let d = new Date(start);
        if (body.frequency === 'monthly') d.setMonth(d.getMonth() + i);
        else if (body.frequency === 'quarterly') d.setMonth(d.getMonth() + i * 3);
        else if (body.frequency === 'yearly') d.setFullYear(d.getFullYear() + i);
        periods.push(d.toISOString().slice(0, 7));
      }
    } else {
      return NextResponse.json({ message: 'period(s) or frequency/count/startPeriod required' }, { status: 400 });
    }
    const { societyId, dueDate, notes, flats } = body;
    if (!societyId || !dueDate || !Array.isArray(flats)) {
      return NextResponse.json({ message: 'societyId, dueDate, flats[] required' }, { status: 400 });
    }
    // Fetch billing config effective for each period
    const settingsContainer = getSocietySettingsContainer();
    const { resources: configs } = await settingsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.societyId = @societyId AND IS_DEFINED(c.billingConfigs)',
        parameters: [{ name: '@societyId', value: societyId }]
      })
      .fetchAll();
    const allConfigs = configs.flatMap((doc: any) => doc.billingConfigs || []);
    // Fetch user flat types for all flats
    const usersContainer = getUsersContainer();
    const flatNumbers = flats.map((f: any) => f.flatNumber);
    const userQuery = {
      query: `SELECT c.flatNumber, c.id as userId, c.flatType FROM c WHERE c.societyId = @societyId AND ARRAY_CONTAINS(@flatNumbers, c.flatNumber)` ,
      parameters: [
        { name: '@societyId', value: societyId },
        { name: '@flatNumbers', value: flatNumbers }
      ]
    };
    const { resources: userFlats } = await usersContainer.items.query(userQuery).fetchAll();
    const flatTypeMap: Record<string, { userId: string, flatType: string }> = {};
    userFlats.forEach((u: any) => {
      flatTypeMap[u.flatNumber] = { userId: u.userId, flatType: u.flatType };
    });
    const now = new Date().toISOString();
    // Generate bills for each period
    let bills: MaintenanceBill[] = [];
    for (const period of periods) {
      // Find config for this period
      const periodDate = new Date(period + '-01');
      const billingConfig = allConfigs
        .filter((cfg: any) => new Date(cfg.effectiveFrom) <= periodDate)
        .sort((a: any, b: any) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0] || null;
      if (!billingConfig) {
        return NextResponse.json({ message: `No billing config found for period ${period}` }, { status: 400 });
      }
      // Validation: ensure all flats have flatType and all categories have rates for that flatType
      for (const flat of flats as any[]) {
        const flatNumber: string = flat.flatNumber;
        const flatType: string = flatTypeMap[flatNumber]?.flatType || flat.flatType;
        if (!flatType) {
          return NextResponse.json({ message: `Missing flatType for flat ${flatNumber}` }, { status: 400 });
        }
        for (const cat of billingConfig.categories) {
          if (cat.perFlatType?.[flatType] === undefined) {
            return NextResponse.json({ message: `No rate for category '${cat.label}' and flat type '${flatType}'` }, { status: 400 });
          }
        }
      }
      // Generate bills for this period
      const periodBills: MaintenanceBill[] = flats.map((flat: any) => {
        const flatNumber = flat.flatNumber;
        const userId = flatTypeMap[flatNumber]?.userId || flat.userId;
        const flatType = flatTypeMap[flatNumber]?.flatType || flat.flatType;
        // Calculate breakdown
        let total = 0;
        const breakdown: Record<string, number> = {};
        billingConfig.categories.forEach((cat: any) => {
          const rate = cat.perFlatType?.[flatType] ?? 0;
          breakdown[cat.key] = rate;
          total += rate;
        });
        // --- Discounts, waivers, penalties, ad-hoc charges (same as before) ---
        let discountAmount = 0;
        let discountReason = '';
        if (billingConfig.discountRules) {
          for (const rule of billingConfig.discountRules) {
            if (rule.type === 'auto' && rule.key === 'earlyPayment') {
              if (rule.criteria?.beforeDays && dueDate) {
                const due = new Date(dueDate);
                const nowDate = new Date(now);
                const diffDays = Math.ceil((due.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= rule.criteria.beforeDays) {
                  discountAmount += rule.rateType === 'percent' ? (total * rule.amount) / 100 : rule.amount;
                  discountReason += `${rule.label}; `;
                }
              }
            }
          }
        }
        if (flat.discountAmount) {
          discountAmount += flat.discountAmount;
          discountReason += flat.discountReason ? flat.discountReason + '; ' : '';
        }
        let waiverAmount = 0;
        let waiverReason = '';
        if (flat.waiverAmount) {
          waiverAmount += flat.waiverAmount;
          waiverReason += flat.waiverReason ? flat.waiverReason + '; ' : '';
        }
        let penaltyAmount = 0;
        let penaltyReason = '';
        if (billingConfig.penaltyRules?.latePayment?.enabled) {
          const due = new Date(dueDate);
          const nowDate = new Date(now);
          const grace = billingConfig.penaltyRules.latePayment.daysAfterDue || 0;
          const penaltyStart = new Date(due);
          penaltyStart.setDate(penaltyStart.getDate() + grace);
          if (nowDate > penaltyStart) {
            if (billingConfig.penaltyRules.latePayment.rateType === 'percent') {
              penaltyAmount = (total * billingConfig.penaltyRules.latePayment.amount) / 100;
            } else {
              penaltyAmount = billingConfig.penaltyRules.latePayment.amount;
            }
            if (billingConfig.penaltyRules.latePayment.maxAmount) {
              penaltyAmount = Math.min(penaltyAmount, billingConfig.penaltyRules.latePayment.maxAmount);
            }
            penaltyReason = billingConfig.penaltyRules.latePayment.description || 'Late payment';
          }
        }
        if (flat.penaltyAmount) {
          penaltyAmount += flat.penaltyAmount;
          penaltyReason += flat.penaltyReason ? flat.penaltyReason + '; ' : '';
        }
        // --- Ad-hoc charges ---
        const adHocCharges = flat.adHocCharges ? [...flat.adHocCharges] : [];
        let adHocTotal = 0;
        adHocCharges.forEach((c: any) => { adHocTotal += Number(c.amount) || 0; });
        // --- Interest Calculation (NEW) ---
        let interestAmount = 0;
        let interestReason = '';
        if (billingConfig.interestRules?.enabled) {
          const due = new Date(dueDate);
          const nowDate = new Date(now);
          const grace = billingConfig.interestRules.daysAfterDue || 0;
          const interestStart = new Date(due);
          interestStart.setDate(interestStart.getDate() + grace);
          if (nowDate > interestStart) {
            // Calculate months/days overdue
            let periodsOverdue = 0;
            if (billingConfig.interestRules.compounding === 'daily') {
              const msPerDay = 1000 * 60 * 60 * 24;
              periodsOverdue = Math.floor((nowDate.getTime() - interestStart.getTime()) / msPerDay);
            } else {
              // Default: monthly
              const y1 = interestStart.getFullYear(), m1 = interestStart.getMonth();
              const y2 = nowDate.getFullYear(), m2 = nowDate.getMonth();
              periodsOverdue = (y2 - y1) * 12 + (m2 - m1);
              if (nowDate.getDate() > interestStart.getDate()) periodsOverdue += 1;
            }
            if (periodsOverdue > 0) {
              // Principal for interest: after discounts/waivers, before penalty/interest
              const principal = Math.max(0, total - discountAmount - waiverAmount);
              if (billingConfig.interestRules.rateType === 'percent') {
                let base = principal;
                let totalInterest = 0;
                for (let i = 0; i < periodsOverdue; i++) {
                  const interest = (base * billingConfig.interestRules.amount) / 100;
                  totalInterest += interest;
                  if (billingConfig.interestRules.compounding && billingConfig.interestRules.compounding !== 'none') {
                    base += interest;
                  }
                }
                interestAmount = totalInterest;
              } else {
                // Fixed per period
                interestAmount = periodsOverdue * billingConfig.interestRules.amount;
              }
              if (billingConfig.interestRules.maxAmount) {
                interestAmount = Math.min(interestAmount, billingConfig.interestRules.maxAmount);
              }
              interestReason = billingConfig.interestRules.description || 'Overdue interest';
            }
          }
        }
        return {
          id: uuidv4(),
          societyId,
          flatNumber,
          userId,
          period,
          amount: total - discountAmount - waiverAmount + penaltyAmount + adHocTotal + interestAmount,
          dueDate,
          status: 'unpaid',
          generatedAt: now,
          notes,
          breakdown,
          discountAmount: discountAmount || undefined,
          discountReason: discountReason.trim() || undefined,
          penaltyAmount: penaltyAmount || undefined,
          penaltyReason: penaltyReason.trim() || undefined,
          waiverAmount: waiverAmount || undefined,
          waiverReason: waiverReason.trim() || undefined,
          adHocCharges: adHocCharges.length ? adHocCharges : undefined,
          interestAmount: interestAmount || undefined,
          interestReason: interestReason || undefined,
          approvalStatus: 'draft',
          approvalHistory: [{
            status: 'draft',
            changedBy: body.generatedByUserId || 'system',
            changedAt: now,
            notes: 'Bill generated as draft.'
          }],
          auditTrail: [makeAuditEntry({
            changeType: 'created',
            changedBy: body.generatedByUserId || 'system',
            changedByName: body.generatedByName,
            changedByRole: body.generatedByRole,
            after: undefined,
            notes: 'Bill generated.'
          })],
        };
      });
      bills = bills.concat(periodBills);
    }
    try {
      await Promise.all(bills.map(bill => container.items.create(bill)));
      // Send notifications to residents
      await Promise.all(bills.map(bill =>
        createNotification({
          userId: bill.userId,
          type: 'billing',
          title: 'New Maintenance Bill',
          message: `A new maintenance bill for period ${bill.period} has been generated.`,
          link: '/dashboard/my-bills',
        })
      ));
      // Notify admins
      await sendNotificationToAdmins({
        societyId,
        type: 'billing',
        title: 'Bills Generated',
        message: `Maintenance bills for period(s) ${periods.join(', ')} have been generated.`,
        link: '/dashboard/admin/manage-billing',
      });
      return NextResponse.json({ message: 'Bills generated', bills });
    } catch (error: any) {
      return NextResponse.json({ message: 'Failed to generate bills', error: error.message }, { status: 500 });
    }
  } else {
    // Create a single bill
    const { societyId, flatNumber, userId, period, amount, dueDate, notes } = body;
    if (!societyId || !flatNumber || !userId || !period || !amount || !dueDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const bill: MaintenanceBill = {
      id: uuidv4(),
      societyId,
      flatNumber,
      userId,
      period,
      amount,
      dueDate,
      status: 'unpaid',
      generatedAt: new Date().toISOString(),
      notes,
      auditTrail: [makeAuditEntry({
        changeType: 'created',
        changedBy: body.createdByUserId || 'system',
        changedByName: body.createdByName,
        changedByRole: body.createdByRole,
        after: undefined, // full bill object is 'after', but avoid duplicating
        notes: 'Bill created.'
      })],
    };
    try {
      await container.items.create(bill);
      // Notify resident
      await createNotification({
        userId: bill.userId,
        type: 'billing',
        title: 'New Maintenance Bill',
        message: `A new maintenance bill for period ${bill.period} has been generated.`,
        link: '/dashboard/my-bills',
      });
      // Notify admins
      await sendNotificationToAdmins({
        societyId,
        type: 'billing',
        title: 'Bill Created',
        message: `A maintenance bill for flat ${bill.flatNumber} (${bill.period}) has been created.`,
        link: '/dashboard/admin/manage-billing',
      });
      return NextResponse.json({ message: 'Bill created', bill });
    } catch (error: any) {
      return NextResponse.json({ message: 'Failed to create bill', error: error.message }, { status: 500 });
    }
  }
}

// PUT: Update a bill
export async function PUT(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ message: 'id is required' }, { status: 400 });
  }
  const container = getMaintenanceBillsContainer();
  try {
    const { resource: existing } = await container.item(id, updates.societyId).read<MaintenanceBill>();
    if (!existing) {
      return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
    }
    // In PUT: allow updating approvalStatus and approvalHistory
    const before = { ...existing };
    const updated = { ...existing, ...updates };
    if (updates.approvalStatus && updates.approvalStatus !== existing.approvalStatus) {
      updated.approvalHistory = [
        ...(existing.approvalHistory || []),
        {
          status: updates.approvalStatus,
          changedBy: updates.changedBy || 'system',
          changedByName: updates.changedByName,
          changedAt: new Date().toISOString(),
          notes: updates.approvalNotes,
        }
      ];
    }
    if (updates.adHocCharges) updated.adHocCharges = updates.adHocCharges;
    // Add audit trail entry
    updated.auditTrail = [
      ...(existing.auditTrail || []),
      makeAuditEntry({
        changeType: 'updated',
        changedBy: updates.changedBy || 'system',
        changedByName: updates.changedByName,
        changedByRole: updates.changedByRole,
        before,
        after: updated,
        notes: updates.auditNotes || 'Bill updated.'
      })
    ];
    await container.items.upsert(updated);
    return NextResponse.json({ message: 'Bill updated', bill: updated });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to update bill', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a bill
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const societyId = url.searchParams.get('societyId');
  if (!id || !societyId) {
    return NextResponse.json({ message: 'id and societyId are required' }, { status: 400 });
  }
  const container = getMaintenanceBillsContainer();
  try {
    // Read bill before delete for audit
    const { resource: billToDelete } = await container.item(id, societyId).read<MaintenanceBill>();
    await container.item(id, societyId).delete();
    // Optionally: store audit log elsewhere if needed
    // (Not implemented here)
    return NextResponse.json({ message: 'Bill deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to delete bill', error: error.message }, { status: 500 });
  }
}
