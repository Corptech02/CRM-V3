#!/usr/bin/env node
/**
 * Weekly Report Scheduler
 * Runs as a persistent pm2 process.
 * Fires the weekly agent report every Friday at 5:00 PM EST/EDT.
 */

'use strict';

const cron = require('node-cron');
const { runWeeklyReport, runMonthlyReport } = require('./weekly-agent-report');

console.log('[Scheduler] Agent report scheduler started.');

// Weekly: every Friday at 5:00 PM ET
cron.schedule('0 17 * * 5', () => {
    console.log('[Scheduler] Triggering weekly report...');
    runWeeklyReport().catch(err => console.error('[Scheduler] Weekly report failed:', err.message));
}, { timezone: 'America/New_York' });

// Monthly: 1st of each month at 9:00 AM ET (covers previous full month)
cron.schedule('0 9 1 * *', () => {
    console.log('[Scheduler] Triggering monthly report...');
    runMonthlyReport().catch(err => console.error('[Scheduler] Monthly report failed:', err.message));
}, { timezone: 'America/New_York' });

console.log('[Scheduler] Weekly  → every Friday at 5:00 PM ET');
console.log('[Scheduler] Monthly → 1st of each month at 9:00 AM ET');

// Keep process alive
process.on('SIGTERM', () => {
    console.log('[Scheduler] Shutting down.');
    process.exit(0);
});
