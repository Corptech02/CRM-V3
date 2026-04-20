#!/usr/bin/env node
/**
 * Weekly Report Scheduler
 * Runs as a persistent pm2 process.
 * Fires the weekly agent report every Friday at 5:00 PM EST/EDT.
 */

'use strict';

const cron = require('node-cron');
const { runWeeklyReport } = require('./weekly-agent-report');

// "0 17 * * 5" = every Friday at 17:00 local time
// We run this process with TZ=America/New_York so 17:00 = 5pm Eastern
const CRON_EXPR = '0 17 * * 5';

console.log('[Scheduler] Weekly report scheduler started.');
console.log(`[Scheduler] Schedule: ${CRON_EXPR} (America/New_York)`);
console.log(`[Scheduler] Next fire: every Friday at 5:00 PM ET`);

cron.schedule(CRON_EXPR, () => {
    console.log('[Scheduler] Triggering weekly agent report...');
    runWeeklyReport().catch(err => {
        console.error('[Scheduler] Report failed:', err.message);
    });
}, {
    timezone: 'America/New_York',
});

// Keep process alive
process.on('SIGTERM', () => {
    console.log('[Scheduler] Shutting down.');
    process.exit(0);
});
