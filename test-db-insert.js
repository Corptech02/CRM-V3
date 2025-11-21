const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/var/www/vanguard/backend/vanguard.db');

const testData = {
    policyKey: 'NODE_TEST_' + Date.now(),
    policyNumber: 'NODE123',
    expirationDate: '2025-12-31',
    completed: 1,
    tasks: null
};

console.log('Inserting:', testData);

db.run(`INSERT OR REPLACE INTO renewal_completions (policy_key, policy_number, expiration_date, completed, tasks, completed_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [testData.policyKey, testData.policyNumber, testData.expirationDate, testData.completed, testData.tasks],
    function(err) {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Success! Inserted with ID:', this.lastID, 'Changes:', this.changes);
        }

        // Verify
        db.get('SELECT * FROM renewal_completions WHERE policy_key = ?', [testData.policyKey], (err, row) => {
            if (err) {
                console.error('Select error:', err);
            } else {
                console.log('Verification - Found:', row);
            }
            db.close();
        });
    }
);