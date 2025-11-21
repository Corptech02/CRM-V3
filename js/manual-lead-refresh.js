/**
 * Manual Lead Refresh Functions
 * Use these from the console to refresh leads after sync
 */

(function() {
    console.log('🔄 Loading Manual Lead Refresh Functions...');

    // Function to manually fetch and display leads from the backend
    window.manualRefreshLeads = async function() {
        console.log('🔄 Manually refreshing leads from backend...');

        try {
            const baseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = await fetch(`${baseUrl}/api/leads`);
            if (!response.ok) {
                throw new Error('Failed to fetch leads');
            }

            const leads = await response.json();
            console.log(`📥 Fetched ${leads.length} leads from backend`);

            // Update localStorage
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));
            console.log('💾 Updated localStorage with new leads');

            // Count Vicidial leads
            const vicidialLeads = leads.filter(l => l.id && l.id.includes('vicidial'));
            console.log(`🎯 Found ${vicidialLeads.length} Vicidial leads`);

            // Count leads with transcripts
            const leadsWithTranscripts = leads.filter(l => l.callTranscript && l.callTranscript.length > 0);
            console.log(`🎵 ${leadsWithTranscripts.length} leads have transcripts`);

            // Force refresh the view
            if (typeof loadLeadsView === 'function') {
                console.log('Refreshing leads view...');
                loadLeadsView();
            }

            // Return summary
            return {
                totalLeads: leads.length,
                vicidialLeads: vicidialLeads.length,
                leadsWithTranscripts: leadsWithTranscripts.length,
                leads: leads.slice(0, 5) // Return first 5 for inspection
            };

        } catch (error) {
            console.error('❌ Error refreshing leads:', error);
            return null;
        }
    };

    // Function to check what's in localStorage
    window.checkLocalLeads = function() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const vicidialLeads = leads.filter(l => l.id && l.id.includes('vicidial'));
        const leadsWithTranscripts = leads.filter(l => l.callTranscript && l.callTranscript.length > 0);

        console.log(`📊 Local Storage Summary:`);
        console.log(`   Total leads: ${leads.length}`);
        console.log(`   Vicidial leads: ${vicidialLeads.length}`);
        console.log(`   Leads with transcripts: ${leadsWithTranscripts.length}`);

        if (vicidialLeads.length > 0) {
            console.log('\n🎯 Vicidial Leads:');
            vicidialLeads.forEach(l => {
                console.log(`   - ${l.name}: ${l.phone} (Transcript: ${l.callTranscript ? l.callTranscript.length + ' chars' : 'No'})`);
            });
        }

        return {
            total: leads.length,
            vicidial: vicidialLeads.length,
            withTranscripts: leadsWithTranscripts.length
        };
    };

    // Function to force show Vicidial leads in the UI
    window.forceShowVicidialLeads = function() {
        console.log('🔍 Force showing Vicidial leads...');

        // Get the leads table
        const leadsTable = document.querySelector('.leads-table tbody');
        if (!leadsTable) {
            console.error('❌ Leads table not found. Make sure you\'re on the Lead Management page.');
            return;
        }

        // Get leads from localStorage
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const vicidialLeads = leads.filter(l => l.id && l.id.includes('vicidial'));

        if (vicidialLeads.length === 0) {
            console.log('⚠️ No Vicidial leads in localStorage. Run manualRefreshLeads() first.');
            return;
        }

        // Clear existing rows
        leadsTable.innerHTML = '';

        // Add Vicidial leads to the table
        vicidialLeads.forEach(lead => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="lead-checkbox" data-id="${lead.id}"></td>
                <td>
                    <div class="lead-name">${lead.name || lead.company || 'Unknown'}</div>
                    <div class="lead-company">${lead.company || ''}</div>
                </td>
                <td>${lead.phone || 'N/A'}</td>
                <td>${lead.email || 'N/A'}</td>
                <td>
                    <span class="badge badge-${lead.stage === 'new' ? 'info' : lead.stage === 'contacted' ? 'warning' : 'success'}">
                        ${lead.stage || 'new'}
                    </span>
                </td>
                <td>${lead.assignedTo || 'Unassigned'}</td>
                <td>
                    <button class="btn-icon" onclick="showLeadProfile('${lead.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${lead.callTranscript ? '<span title="Has Transcript">🎵</span>' : ''}
                </td>
            `;
            leadsTable.appendChild(row);
        });

        console.log(`✅ Added ${vicidialLeads.length} Vicidial leads to the table`);
    };

    // Add console instructions
    console.log('✅ Manual Lead Refresh Functions loaded');
    console.log('   Commands available:');
    console.log('   - manualRefreshLeads() : Fetch leads from backend and refresh view');
    console.log('   - checkLocalLeads() : Check what leads are in localStorage');
    console.log('   - forceShowVicidialLeads() : Force display Vicidial leads in the table');

    // Auto-expose to window
    window.LeadRefresh = {
        refresh: window.manualRefreshLeads,
        check: window.checkLocalLeads,
        show: window.forceShowVicidialLeads
    };
})();