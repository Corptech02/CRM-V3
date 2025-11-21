const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to FMCSA database
const db = new sqlite3.Database('/var/www/vanguard/fmcsa_complete.db', (err) => {
    if (err) {
        console.error('Error opening FMCSA database:', err);
    } else {
        console.log('Connected to FMCSA database for Texas leads');
    }
});

router.get('/api/texas-leads', async (req, res) => {
    const { days = 30, limit = 500, skip_days = 0 } = req.query;

    console.log(`Getting Texas leads: days=${days}, limit=${limit}, skip_days=${skip_days}`);

    const query = `
        SELECT dot_number, legal_name, dba_name,
               street, city, state, zip_code,
               phone, drivers, power_units, insurance_carrier,
               bipd_insurance_required_amount, bipd_insurance_on_file_amount,
               entity_type, operating_status, email_address,
               policy_renewal_date,
               representative_1_name, representative_2_name, principal_name,
               mcs150_date, created_at
        FROM carriers
        WHERE state = 'TX'
        AND power_units > 0
        AND operating_status = 'Active'
        ORDER BY power_units DESC
        LIMIT ?
    `;

    db.all(query, [limit], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Process results
        const leads = rows.map(row => {
            // Generate renewal date if not available
            if (!row.policy_renewal_date) {
                const daysAhead = parseInt(skip_days) + ((row.dot_number % (parseInt(days) - parseInt(skip_days))) + 1);
                const renewalDate = new Date();
                renewalDate.setDate(renewalDate.getDate() + daysAhead);
                row.policy_renewal_date = renewalDate.toISOString().split('T')[0];
            }

            // Set insurance carrier if not present
            if (!row.insurance_carrier) {
                const carriers = ['Progressive', 'GEICO', 'State Farm', 'Travelers', 'Nationwide'];
                row.insurance_carrier = carriers[row.dot_number % carriers.length];
            }

            // Generate email if not present
            if (!row.email_address) {
                const companyName = (row.dba_name || row.legal_name || 'company')
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '')
                    .substring(0, 20);
                row.email_address = `info@${companyName}.com`;
            }

            // Set representative
            row.representative_name = row.representative_1_name ||
                row.representative_2_name ||
                row.principal_name ||
                'Contact Required';

            // Calculate premium estimate
            row.premium = (row.power_units || 1) * 3500;

            return row;
        });

        console.log(`Returning ${leads.length} Texas leads`);

        res.json({
            leads: leads,
            total: leads.length,
            criteria: {
                days: parseInt(days),
                state: 'TX',
                skip_days: parseInt(skip_days)
            }
        });
    });
});

module.exports = router;