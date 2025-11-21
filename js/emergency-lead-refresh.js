/**
 * Emergency Lead Refresh
 * Quick function to manually fetch and display synced leads
 */

console.log('🚨 Emergency Lead Refresh loaded');
console.log('Run: emergencyRefresh() to fetch and show all leads');

window.emergencyRefresh = async function() {
    console.log('🔄 Emergency refresh starting...');

    try {
        // 1. Fetch from API
        const response = await fetch('http://localhost:3001/api/leads');
        if (!response.ok) throw new Error('API fetch failed');

        const leads = await response.json();
        console.log(`📥 Fetched ${leads.length} leads from API`);

        // 2. Update localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log('💾 Updated localStorage');

        // 3. Count Vicidial leads
        const vicidialLeads = leads.filter(l => l.id && l.id.includes('vicidial'));
        const withTranscripts = vicidialLeads.filter(l => l.callTranscript && l.callTranscript.length > 100);

        console.log(`🎯 Vicidial leads: ${vicidialLeads.length}`);
        console.log(`🎵 With transcripts: ${withTranscripts.length}`);

        // 4. Show in table if we're on leads page
        const leadsTable = document.querySelector('.leads-table tbody');
        if (leadsTable) {
            console.log('📋 Updating leads table...');

            // Clear table
            leadsTable.innerHTML = '';

            // Add all leads
            leads.forEach(lead => {
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
                        ${lead.callTranscript && lead.callTranscript.length > 100 ? '<span title="Has Transcript" style="color: green;">🎵</span>' : ''}
                        ${lead.id && lead.id.includes('vicidial') ? '<span title="Vicidial Lead" style="color: blue;">📞</span>' : ''}
                    </td>
                `;
                leadsTable.appendChild(row);
            });

            console.log(`✅ Added ${leads.length} leads to table`);
        } else {
            console.log('⚠️ Not on leads page - table not found');
            console.log('   Go to Lead Management page first');
        }

        // 5. Update stats if available
        const statsElements = {
            total: document.querySelector('.stat-card:nth-child(1) .stat-number'),
            new: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        };

        if (statsElements.total) {
            statsElements.total.textContent = leads.length;
            console.log('📊 Updated total leads stat');
        }

        // 6. Show success message
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 5px;">✅ Emergency Refresh Complete!</div>
            <div style="font-size: 14px;">
                📊 Total: ${leads.length} leads<br>
                📞 Vicidial: ${vicidialLeads.length} leads<br>
                🎵 Transcripts: ${withTranscripts.length} leads
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);

        console.log('🎉 Emergency refresh completed successfully!');

        return {
            total: leads.length,
            vicidial: vicidialLeads.length,
            withTranscripts: withTranscripts.length,
            sampleLead: vicidialLeads[0] || leads[0]
        };

    } catch (error) {
        console.error('❌ Emergency refresh failed:', error);

        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
        `;
        errorNotification.innerHTML = `❌ Refresh failed: ${error.message}`;
        document.body.appendChild(errorNotification);

        setTimeout(() => errorNotification.remove(), 5000);
        return null;
    }
};

// Also add a quick check function
window.quickCheck = function() {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const vicidial = leads.filter(l => l.id && l.id.includes('vicidial'));
    const withTranscripts = vicidial.filter(l => l.callTranscript && l.callTranscript.length > 100);

    console.log('📊 Quick Check Results:');
    console.log(`   Total leads in localStorage: ${leads.length}`);
    console.log(`   Vicidial leads: ${vicidial.length}`);
    console.log(`   With transcripts: ${withTranscripts.length}`);

    if (withTranscripts.length > 0) {
        console.log('\\n🎵 Sample transcript (first 200 chars):');
        console.log(withTranscripts[0].callTranscript.substring(0, 200) + '...');
    }

    return { total: leads.length, vicidial: vicidial.length, withTranscripts: withTranscripts.length };
};