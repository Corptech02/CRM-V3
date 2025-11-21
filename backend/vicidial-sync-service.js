#!/usr/bin/env node
/**
 * ViciDial Sync Service
 * Runs the Python sync script every 5 minutes
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🔄 ViciDial Sync Service Started');

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Use the web extractor that actually works
const PYTHON_SCRIPT = '/var/www/vanguard/vicidial-web-extractor.py';

function runSync() {
    console.log(`[${new Date().toISOString()}] Running ViciDial sync...`);

    exec(`python3 ${PYTHON_SCRIPT}`, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Sync error:', error.message);
            return;
        }

        if (stderr) {
            console.error('⚠️ Sync warnings:', stderr);
        }

        if (stdout) {
            console.log('✅ Sync output:', stdout);
        }

        console.log(`[${new Date().toISOString()}] Sync complete`);
    });
}

// Run initial sync
runSync();

// Schedule recurring syncs
setInterval(runSync, SYNC_INTERVAL);

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 ViciDial Sync Service shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 ViciDial Sync Service interrupted...');
    process.exit(0);
});

console.log(`⏰ Sync scheduled every ${SYNC_INTERVAL / 1000} seconds`);