// Proper archive endpoint that moves leads between tables

module.exports = function(app, db) {
    // Archive a lead - move from leads to archived_leads
    app.post('/api/archive-lead/:leadId', (req, res) => {
        const leadId = req.params.leadId;

        console.log(`Archiving lead ${leadId}`);

        // First, get the lead from the leads table
        db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, lead) => {
            if (err) {
                console.error('Error finding lead:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            if (!lead) {
                console.log(`Lead ${leadId} not found in leads table`);
                res.status(404).json({ error: 'Lead not found' });
                return;
            }

            // Parse the lead data and mark as archived
            let leadData;
            try {
                leadData = JSON.parse(lead.data);
                leadData.archived = true;
            } catch (e) {
                console.error('Error parsing lead data:', e);
                res.status(500).json({ error: 'Invalid lead data' });
                return;
            }

            // Begin transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Insert into archived_leads
                db.run(
                    'INSERT OR REPLACE INTO archived_leads (id, data) VALUES (?, ?)',
                    [leadId, JSON.stringify(leadData)],
                    function(err) {
                        if (err) {
                            console.error('Error inserting into archived_leads:', err);
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        // Delete from leads table
                        db.run('DELETE FROM leads WHERE id = ?', [leadId], function(err) {
                            if (err) {
                                console.error('Error deleting from leads:', err);
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                            }

                            db.run('COMMIT');
                            console.log(`Successfully archived lead ${leadId}`);
                            res.json({ success: true, message: `Lead ${leadId} archived` });
                        });
                    }
                );
            });
        });
    });

    // Unarchive a lead - move from archived_leads back to leads
    app.post('/api/unarchive-lead/:leadId', (req, res) => {
        const leadId = req.params.leadId;

        console.log(`Unarchiving lead ${leadId}`);

        // First, get the lead from archived_leads table
        db.get('SELECT * FROM archived_leads WHERE id = ?', [leadId], (err, lead) => {
            if (err) {
                console.error('Error finding archived lead:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            if (!lead) {
                console.log(`Lead ${leadId} not found in archived_leads table`);
                res.status(404).json({ error: 'Archived lead not found' });
                return;
            }

            // Parse the lead data and remove archived flag
            let leadData;
            try {
                leadData = JSON.parse(lead.data);
                delete leadData.archived;
            } catch (e) {
                console.error('Error parsing lead data:', e);
                res.status(500).json({ error: 'Invalid lead data' });
                return;
            }

            // Begin transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Insert back into leads table
                db.run(
                    'INSERT OR REPLACE INTO leads (id, data) VALUES (?, ?)',
                    [leadId, JSON.stringify(leadData)],
                    function(err) {
                        if (err) {
                            console.error('Error inserting into leads:', err);
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        // Delete from archived_leads table
                        db.run('DELETE FROM archived_leads WHERE id = ?', [leadId], function(err) {
                            if (err) {
                                console.error('Error deleting from archived_leads:', err);
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                            }

                            db.run('COMMIT');
                            console.log(`Successfully unarchived lead ${leadId}`);
                            res.json({ success: true, message: `Lead ${leadId} unarchived` });
                        });
                    }
                );
            });
        });
    });
};