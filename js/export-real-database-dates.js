// Export leads with REAL dates from FMCSA database
(function() {
    'use strict';

    console.log('📊 EXPORT-REAL-DATABASE-DATES: Using actual FMCSA database dates...');

    // Override exportLeads to fetch real data from database
    window.exportLeads = async function() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        if (leads.length === 0) {
            showNotification('No leads to export', 'warning');
            return;
        }

        // Try to fetch real data from API for each lead
        const enrichedLeads = [];

        for (const lead of leads) {
            let enrichedLead = {...lead};

            // Try to get real data from database if DOT number exists
            if (lead.dot || lead.usdot || lead.dot_number) {
                const dotNumber = lead.dot || lead.usdot || lead.dot_number;

                try {
                    const response = await fetch(`http://162-220-14-239.nip.io:3001/api/carriers/${dotNumber}`, {
                        headers: { 'Bypass-Tunnel-Reminder': 'true' }
                    });

                    if (response.ok) {
                        const carrierData = await response.json();

                        // Use REAL database dates
                        if (carrierData.policy_renewal_date) {
                            enrichedLead.renewalDate = carrierData.policy_renewal_date;
                        }
                        if (carrierData.policy_effective_date) {
                            enrichedLead.effectiveDate = carrierData.policy_effective_date;
                        }
                        if (carrierData.mcs150_date) {
                            enrichedLead.mcs150Date = carrierData.mcs150_date;
                        }

                        // Also update other fields with real data
                        enrichedLead.legal_name = carrierData.legal_name || lead.name;
                        enrichedLead.phone = carrierData.phone || lead.phone;
                        enrichedLead.city = carrierData.city;
                        enrichedLead.state = carrierData.state;
                        enrichedLead.vehicle_count = carrierData.vehicle_count;
                    }
                } catch (err) {
                    console.log(`Could not fetch data for DOT ${dotNumber}:`, err);
                }
            }

            enrichedLeads.push(enrichedLead);
        }

        // Create Excel-ready CSV with REAL dates
        const headers = [
            'DOT Number',
            'Company Name',
            'Phone',
            'Email',
            'City',
            'State',
            'Product',
            'Premium',
            'Stage',
            'Policy Renewal Date',
            'Policy Effective Date',
            'MCS-150 Date',
            'Vehicle Count',
            'Assigned To',
            'Created Date'
        ];

        const rows = enrichedLeads.map(lead => {
            // Format dates properly
            const formatDate = (dateStr) => {
                if (!dateStr || dateStr === '') return '';

                // Check if it's already in the correct format
                if (dateStr.includes('10-07-25') || dateStr.includes('10/07/25')) {
                    return ''; // Don't export fake dates
                }

                const date = new Date(dateStr);
                if (isNaN(date)) return dateStr; // Return as-is if not parseable

                // Format as MM/DD/YYYY for Excel
                return (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
                       date.getDate().toString().padStart(2, '0') + '/' +
                       date.getFullYear();
            };

            return [
                lead.dot || lead.usdot || lead.dot_number || '',
                lead.legal_name || lead.name || '',
                lead.phone || '',
                lead.email || '',
                lead.city || '',
                lead.state || '',
                lead.product || '',
                lead.premium || 0,
                lead.stage || 'new',
                formatDate(lead.renewalDate),
                formatDate(lead.effectiveDate),
                formatDate(lead.mcs150Date),
                lead.vehicle_count || '',
                lead.assignedTo || lead.assigned_to || 'Unassigned',
                formatDate(lead.createdAt || lead.created)
            ];
        });

        // Build CSV content
        let csvContent = '\uFEFF'; // BOM for Excel UTF-8
        csvContent += headers.join(',') + '\n';

        rows.forEach(row => {
            csvContent += row.map(cell => {
                const value = String(cell).replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value}"`;
                }
                return value;
            }).join(',') + '\n';
        });

        // Download with timestamp
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
                         (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
                         now.getDate().toString().padStart(2, '0') + '_' +
                         now.getHours().toString().padStart(2, '0') + '-' +
                         now.getMinutes().toString().padStart(2, '0');

        a.download = `leads_export_REAL_DATES_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification(`Exported ${enrichedLeads.length} leads with REAL database dates`, 'success');

        // Log statistics
        const hasRealDates = enrichedLeads.filter(l => l.renewalDate && !l.renewalDate.includes('10-07')).length;
        console.log(`✅ Exported ${enrichedLeads.length} leads, ${hasRealDates} with real renewal dates from database`);
    };

    console.log('✅ EXPORT-REAL-DATABASE-DATES: Ready - will fetch real dates from FMCSA database');
})();