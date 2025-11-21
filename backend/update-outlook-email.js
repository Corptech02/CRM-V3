#!/usr/bin/env node

/**
 * Update Outlook Email Account
 * Changes from grant@vigagency.com to contact@vigagency.com
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('\n📧 Updating Outlook Email Configuration\n');
console.log('=' .repeat(50));

const newEmail = 'contact@vigagency.com';

// Update database
const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

db.get("SELECT value FROM settings WHERE key = 'email_config'", (err, row) => {
    if (err || !row) {
        console.error('❌ No email configuration found');
        process.exit(1);
    }

    const config = JSON.parse(row.value);
    const oldEmail = config.email;

    // Update email
    config.email = newEmail;
    config.imap.auth.user = newEmail;
    config.smtp.auth.user = newEmail;
    config.updated_at = new Date().toISOString();

    // Save updated config
    db.run(
        "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'email_config'",
        [JSON.stringify(config)],
        function(err) {
            if (err) {
                console.error('❌ Error updating email:', err);
                process.exit(1);
            }

            console.log('✅ Email Updated Successfully!');
            console.log('\nChanges:');
            console.log('  Old email:', oldEmail);
            console.log('  New email:', newEmail);

            // Also update Azure config
            db.get("SELECT value FROM settings WHERE key = 'outlook_azure_app'", (err, row) => {
                if (row) {
                    const azureConfig = JSON.parse(row.value);
                    azureConfig.email = newEmail;

                    db.run(
                        "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'outlook_azure_app'",
                        [JSON.stringify(azureConfig)],
                        function(err) {
                            if (!err) {
                                console.log('✅ Azure config updated');
                            }

                            console.log('\n🔄 Next Steps:');
                            console.log('1. Restart backend: pm2 restart vanguard-backend');
                            console.log('2. Re-authorize with the new email');
                            console.log('3. The COI inbox will use:', newEmail);

                            db.close();
                            process.exit(0);
                        }
                    );
                } else {
                    db.close();
                    process.exit(0);
                }
            });
        }
    );
});