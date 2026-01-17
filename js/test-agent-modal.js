// Test Agent Modal - Simple version to debug the closing issue
console.log('🧪 TEST: Simple agent modal test loaded');

window.testAgentModal = function(agentName = 'Grant') {
    console.log(`🧪 Creating test modal for ${agentName}`);

    // Remove any existing modals
    const existing = document.querySelectorAll('.test-agent-modal');
    existing.forEach(modal => modal.remove());

    // Create simple modal
    const modal = document.createElement('div');
    modal.className = 'test-agent-modal';
    modal.id = 'test-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99999 !important;
        visibility: visible !important;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; max-width: 600px; width: 90%; position: relative;">
            <button onclick="document.getElementById('test-modal').remove()" style="position: absolute; top: 10px; right: 20px; background: none; border: none; font-size: 30px; cursor: pointer;">×</button>
            <h2 style="margin: 0 0 20px 0; color: #1f2937;">🧪 TEST: ${agentName} Report</h2>
            <p>This is a test modal to verify modal functionality.</p>
            <div style="margin: 20px 0; padding: 20px; background: #f0f9ff; border-radius: 8px;">
                <h3 style="color: #0ea5e9; margin: 0 0 10px 0;">Call Statistics Test</h3>
                <p style="margin: 0;">If you can see this modal and it stays open, the modal system is working.</p>
            </div>
            <button onclick="window.viewAgentStats('${agentName}')" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">Try Real Report</button>
            <button onclick="document.getElementById('test-modal').remove()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
    console.log('✅ Test modal created and added to DOM');

    // Check if it stays open
    setTimeout(() => {
        if (document.getElementById('test-modal')) {
            console.log('✅ Test modal still visible after 500ms');
        } else {
            console.error('❌ Test modal was removed unexpectedly!');
        }
    }, 500);
};

// Add a quick check function
window.checkAgentStats = function(agentName = 'Grant') {
    const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const agentLeads = allLeads.filter(lead => {
        const assignedTo = lead.assignedTo || lead.agent || '';
        return assignedTo.toLowerCase() === agentName.toLowerCase();
    });

    let totalCalls = 0;
    agentLeads.forEach(lead => {
        if (lead.reachOut) {
            const connected = lead.reachOut.callsConnected || 0;
            totalCalls += connected;
            console.log(`📞 Lead ${lead.id}: ${lead.name} - Connected: ${connected}`);
        }
    });

    console.log(`📊 ${agentName} Summary: ${agentLeads.length} leads, ${totalCalls} total connected calls`);
    return { leads: agentLeads.length, calls: totalCalls };
};

console.log('🧪 TEST FUNCTIONS AVAILABLE:');
console.log('  - window.testAgentModal("Grant") - Test modal functionality');
console.log('  - window.checkAgentStats("Grant") - Check call statistics');
console.log('  - Then try clicking the actual report button');