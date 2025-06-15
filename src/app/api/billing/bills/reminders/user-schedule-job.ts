// src/app/api/billing/bills/reminders/user-schedule-job.ts
// Node.js script to be run by a system scheduler (e.g., Windows Task Scheduler, cron)
// This script checks all user reminder schedules and triggers reminders as needed.

import { getSocietySettingsContainer } from '@/lib/cosmosdb';
import fetch from 'node-fetch';

async function runUserReminderSchedules() {
  const settingsContainer = getSocietySettingsContainer();
  const { resources: societies } = await settingsContainer.items.query({ query: 'SELECT * FROM c' }).fetchAll();
  const now = new Date();
  for (const society of societies) {
    const schedules = society.billReminderSchedules || [];
    for (const sched of schedules) {
      if (!sched.enabled) continue;
      if (sched.dayOfMonth !== now.getDate() || sched.hour !== now.getHours() || sched.minute !== now.getMinutes()) continue;
      // Trigger reminder for this user
      await fetch(`${process.env.REMINDER_API_BASE_URL || 'http://localhost:3000'}/api/billing/bills/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId: sched.societyId, dryRun: false }),
      });
      // Optionally: update lastTriggered in DB
    }
  }
}

runUserReminderSchedules().then(() => {
  console.log('User reminder schedules processed.');
  process.exit(0);
});
