const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

module.exports = function(app, db) {
    // Enhanced Excel export endpoint - Now uses FMCSA database like Vicidial
    app.get('/api/export-all-leads', async (req, res) => {
        try {
            const today = new Date();
            const formatDate = (date) => {
                return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
            };

            const allLeads = [];
            let leadIndex = 1000;

            // Connect to FMCSA database (same as Vicidial uses)
            const fmcsaDb = new sqlite3.Database(path.join(__dirname, '../fmcsa_complete.db'));

            // Query the FMCSA database - PRIORITIZE companies with representative names
            const query = `
                SELECT
                    dot_number, legal_name, dba_name,
                    representative_1_name, representative_2_name, principal_name,
                    phone, email_address, street, city, state, zip_code,
                    insurance_carrier, policy_renewal_date, power_units,
                    operating_status, entity_type, officers_data
                FROM carriers
                WHERE state = 'OH'
                AND operating_status = 'Active'
                AND (
                    representative_1_name IS NOT NULL
                    OR representative_2_name IS NOT NULL
                    OR principal_name IS NOT NULL
                )
                ORDER BY
                    CASE WHEN representative_1_name IS NOT NULL THEN 1 ELSE 2 END,
                    CASE WHEN email_address IS NOT NULL AND email_address LIKE '%@%' THEN 1 ELSE 2 END,
                    CASE WHEN insurance_carrier IS NOT NULL THEN 1 ELSE 2 END,
                    legal_name
                LIMIT 2000
            `;

            // Execute the query
            const rows = await new Promise((resolve, reject) => {
                fmcsaDb.all(query, [], (err, rows) => {
                    if (err) {
                        console.error('Database query error:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            console.log(`Found ${rows.length} leads from FMCSA database`);

            // Process each row from the database
            rows.forEach((row, index) => {
                // Extract representative name - SAME LOGIC AS VICIDIAL
                const representativeName = row.representative_1_name || row.representative_2_name || row.principal_name || '';

                // Parse policy renewal date
                let expirationDate = 'N/A';
                let daysUntilExpiry = 'N/A';
                if (row.policy_renewal_date) {
                    try {
                        const expDate = new Date(row.policy_renewal_date);
                        expirationDate = formatDate(expDate);
                        daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                    } catch (e) {
                        console.log('Error parsing date:', row.policy_renewal_date);
                    }
                }

                // Extract first and last name for separate columns
                let firstName = '';
                let lastName = '';
                if (representativeName) {
                    const nameParts = representativeName.trim().split(/\s+/);
                    firstName = nameParts[0] || '';
                    lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                }

                // Try to extract from officers_data if no direct rep
                if (!representativeName && row.officers_data) {
                    try {
                        const officers = JSON.parse(row.officers_data);
                        if (officers.representatives && officers.representatives.length > 0) {
                            const rep = officers.representatives[0];
                            if (rep.name) {
                                const nameParts = rep.name.trim().split(/\s+/);
                                firstName = nameParts[0] || '';
                                lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                            }
                        }
                    } catch (e) {
                        // Ignore JSON parse errors
                    }
                }

                allLeads.push({
                    'Lead ID': row.dot_number || `VG-${leadIndex++}`,
                    'DOT Number': row.dot_number || '',
                    'MC Number': '',  // No MC number in database
                    'Company Name': row.legal_name || row.dba_name || '',
                    'DBA Name': row.dba_name || '',
                    'Representative Name': representativeName,
                    'First Name': firstName,
                    'Last Name': lastName,
                    'Phone': row.phone || '',
                    'Email': row.email_address || '',
                    'Address': row.street || '',
                    'City': row.city || '',
                    'State': row.state || '',
                    'ZIP': row.zip_code || '',
                    'Operating Status': row.operating_status || '',
                    'Entity Type': row.entity_type || '',
                    'Insurance Carrier': row.insurance_carrier || '',
                    'Policy Expiration': expirationDate,
                    'Days Until Expiry': daysUntilExpiry,
                    'Fleet Size': row.power_units || '',
                    'Representative 1': row.representative_1_name || '',
                    'Representative 2': row.representative_2_name || '',
                    'Principal': row.principal_name || '',
                    'Data Source': 'FMCSA Database'
                });
            });

            // Also add leads from the local vanguard database
            const dbQuery = `SELECT data FROM leads UNION ALL SELECT data FROM clients`;
            const localRows = await new Promise((resolve, reject) => {
                db.all(dbQuery, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            localRows.forEach((row, index) => {
                try {
                    const lead = JSON.parse(row.data);

                    // Get representative name from the lead data
                    const representativeName = lead.representative_name || lead.contact || lead.representativeName || '';

                    // SKIP leads without representative names - we want ZERO N/A values
                    if (!representativeName || representativeName.trim() === '') {
                        return; // Skip this lead
                    }

                    // Extract first and last name
                    let firstName = '';
                    let lastName = '';
                    if (representativeName) {
                        const nameParts = representativeName.trim().split(/\s+/);
                        firstName = nameParts[0] || '';
                        lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                    }

                    allLeads.push({
                        'Lead ID': lead.id || `VG-LOCAL-${index}`,
                        'DOT Number': lead.dotNumber || lead.dot_number || lead.usdot_number || '',
                        'MC Number': lead.mcNumber || lead.mc_number || '',
                        'Company Name': lead.name || lead.legal_name || '',
                        'DBA Name': lead.dba_name || '',
                        'Representative Name': representativeName,
                        'First Name': firstName,
                        'Last Name': lastName,
                        'Phone': lead.phone || '',
                        'Email': lead.email || '',
                        'Address': lead.address || '',
                        'City': lead.city || '',
                        'State': lead.state || '',
                        'ZIP': lead.zip || '',
                        'Operating Status': 'Active',
                        'Entity Type': '',
                        'Insurance Carrier': lead.insurance_carrier || lead.currentCarrier || '',
                        'Policy Expiration': lead.insurance_expiry || lead.renewalDate || '',
                        'Days Until Expiry': lead.days_until_expiry || '',
                        'Fleet Size': lead.fleetSize || lead.fleet_size || '',
                        'Representative 1': '',
                        'Representative 2': '',
                        'Principal': '',
                        'Data Source': 'Local Database'
                    });
                } catch (e) {
                    console.error('Error processing local lead:', e);
                }
            });

            // Close FMCSA database
            fmcsaDb.close();

            console.log(`Total leads for export: ${allLeads.length}`);

            // Create Excel workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(allLeads);

            // Auto-size columns
            const colWidths = [
                { wch: 12 }, // Lead ID
                { wch: 12 }, // DOT Number
                { wch: 12 }, // MC Number
                { wch: 35 }, // Company Name
                { wch: 25 }, // DBA Name
                { wch: 25 }, // Representative Name
                { wch: 15 }, // First Name
                { wch: 15 }, // Last Name
                { wch: 15 }, // Phone
                { wch: 30 }, // Email
                { wch: 30 }, // Address
                { wch: 20 }, // City
                { wch: 5 },  // State
                { wch: 10 }, // ZIP
                { wch: 15 }, // Operating Status
                { wch: 15 }, // Entity Type
                { wch: 25 }, // Insurance Carrier
                { wch: 15 }, // Policy Expiration
                { wch: 12 }, // Days Until Expiry
                { wch: 10 }, // Fleet Size
                { wch: 25 }, // Representative 1
                { wch: 25 }, // Representative 2
                { wch: 25 }, // Principal
                { wch: 20 }  // Data Source
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Lead Export');

            // Generate buffer
            const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

            // Send file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=lead_export_${formatDate(today).replace(/\//g, '-')}.xlsx`);
            res.send(buffer);

        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: 'Failed to export leads', details: error.message });
        }
    });
};