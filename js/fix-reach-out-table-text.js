// Fix for missing "Reach Out" text in leads table when highlight duration expires
console.log('🔧 REACH OUT TABLE TEXT FIX: Loading fix for expired highlight reach-out text...');

(function() {
    'use strict';

    // Enhanced function to check if a lead should show "Reach Out" text
    function shouldShowReachOutText(stage, lead) {
        console.log(`🔍 REACH OUT CHECK: Lead ${lead?.id} (${lead?.name}) - stage: ${stage}`);

        // Stages that require reach-out
        const stagesRequiringReachOut = [
            'quoted', 'info_requested', 'quote_sent',
            'quote-sent-unaware', 'quote-sent-aware',
            'interested', 'contact_attempted', 'loss_runs_requested'
        ];

        // Only proceed if stage requires reach-out
        if (!stagesRequiringReachOut.includes(stage)) {
            console.log(`🔍 Stage "${stage}" doesn't require reach-out`);
            return false;
        }

        // If no reach-out data, definitely needs reach-out
        if (!lead?.reachOut) {
            console.log(`🔍 No reach-out data - needs reach-out`);
            return true;
        }

        const reachOut = lead.reachOut;

        // Check if explicitly marked as expired
        if (reachOut.highlightExpired) {
            console.log(`🔴 EXPLICIT EXPIRY: Lead ${lead.id} is marked as expired - showing reach-out text`);
            return true;
        }

        // Check if reach-out was completed but duration has expired
        if ((reachOut.completedAt || reachOut.reachOutCompletedAt) && reachOut.greenHighlightUntil) {
            const highlightExpiry = new Date(reachOut.greenHighlightUntil);
            const now = new Date();

            if (now > highlightExpiry) {
                console.log(`🔴 DURATION EXPIRED: Lead ${lead.id} highlight expired at ${reachOut.greenHighlightUntil} - showing reach-out text`);
                return true;
            } else {
                console.log(`✅ ACTIVE HIGHLIGHT: Lead ${lead.id} highlight active until ${reachOut.greenHighlightUntil} - no reach-out text`);
                return false;
            }
        }

        // Check if reach-out completion indicators are reset (sign of expiry)
        const hasCompletionTimestamp = reachOut.completedAt || reachOut.reachOutCompletedAt;
        const hasZeroCounters = (reachOut.callsConnected || 0) === 0 &&
                               (reachOut.textCount || 0) === 0 &&
                               !reachOut.callMade && !reachOut.textSent;

        if (hasCompletionTimestamp && hasZeroCounters) {
            console.log(`🔴 RESET INDICATORS: Lead ${lead.id} has completion timestamp but zero counters - likely expired, showing reach-out text`);
            return true;
        }

        // Check if reach-out is truly incomplete (no completion at all)
        const callsConnected = Number(reachOut.callsConnected) || 0;
        const textCount = Number(reachOut.textCount) || 0;

        if (callsConnected === 0 && textCount === 0) {
            console.log(`🔍 INCOMPLETE REACH-OUT: Lead ${lead.id} has no completed reach-out actions - showing reach-out text`);
            return true;
        }

        // Default: if we have active completion, don't show reach-out text
        console.log(`✅ COMPLETED REACH-OUT: Lead ${lead.id} has active completion - no reach-out text`);
        return false;
    }

    // Enhanced getNextAction function
    function getNextActionEnhanced(stage, lead) {
        // Special case for app sent stage
        if (stage === 'app sent') {
            return '';
        }

        // Check if should show reach-out text
        if (shouldShowReachOutText(stage, lead)) {
            return '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>';
        }

        // Fallback to standard action mapping
        const actionMap = {
            'new': 'Assign Stage',
            'contact_attempted': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'info_requested': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'info_received': 'Prepare Quote',
            'loss_runs_requested': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'loss_runs_received': 'Prepare app.',
            'app_prepared': 'Send application',
            'app_sent': '',
            'quoted': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'quote_sent': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'quote-sent-unaware': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'quote-sent-aware': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'interested': '<span style="color: #dc2626; font-weight: bold;">Reach Out</span>',
            'not-interested': 'Archive lead',
            'closed': 'Process complete'
        };

        return actionMap[stage] || 'Review lead';
    }

    // Function to force refresh table with correct reach-out text
    function forceTableReachOutRefresh() {
        console.log('🔄 FORCE REFRESH: Checking all table rows for missing reach-out text...');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.log('❌ Table body not found');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');
        let fixedCount = 0;

        rows.forEach(row => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (!lead) return;

            // Get the TODO cell (7th column, index 6)
            const todoCell = row.querySelectorAll('td')[6];
            if (!todoCell) return;

            const stage = lead.stage || 'new';
            const shouldShowReachOut = shouldShowReachOutText(stage, lead);
            const currentContent = todoCell.innerHTML.trim();
            const hasReachOutText = currentContent.toLowerCase().includes('reach out');

            // Fix missing reach-out text
            if (shouldShowReachOut && !hasReachOutText) {
                console.log(`🔧 FIXING: Lead ${lead.id} (${lead.name}) missing reach-out text`);
                todoCell.innerHTML = '<div style="font-weight: bold; color: #dc2626;">Reach Out</div>';
                fixedCount++;
            }
            // Clear reach-out text if not needed
            else if (!shouldShowReachOut && hasReachOutText) {
                console.log(`🧹 CLEARING: Lead ${lead.id} (${lead.name}) unnecessary reach-out text`);
                const correctText = getNextActionEnhanced(stage, lead);
                const color = correctText.includes('span style=') ? 'black' : 'black';
                todoCell.innerHTML = `<div style="font-weight: bold; color: ${color};">${correctText}</div>`;
                fixedCount++;
            }
        });

        console.log(`✅ FORCE REFRESH COMPLETE: Fixed ${fixedCount} rows`);
    }

    // Override the global getNextAction function
    if (window.getNextAction) {
        console.log('🔧 Overriding existing getNextAction function');
        const originalGetNextAction = window.getNextAction;

        window.getNextAction = function(stage, lead) {
            const enhancedResult = getNextActionEnhanced(stage, lead);
            const originalResult = originalGetNextAction(stage, lead);

            // Use enhanced result if it differs and includes reach-out text
            if (enhancedResult !== originalResult && enhancedResult.toLowerCase().includes('reach out')) {
                console.log(`🔧 OVERRIDE: Using enhanced result "${enhancedResult}" instead of "${originalResult}" for lead ${lead?.id}`);
                return enhancedResult;
            }

            return originalResult;
        };
    } else {
        console.log('🔧 Creating new getNextAction function');
        window.getNextAction = getNextActionEnhanced;
    }

    // Make helper function globally available
    window.shouldShowReachOutText = shouldShowReachOutText;
    window.forceTableReachOutRefresh = forceTableReachOutRefresh;

    // Auto-refresh on page load and after short delay
    setTimeout(() => {
        forceTableReachOutRefresh();
    }, 2000);

    // Hook into displayLeads if it exists
    if (window.displayLeads) {
        const originalDisplayLeads = window.displayLeads;
        window.displayLeads = function() {
            const result = originalDisplayLeads.apply(this, arguments);

            // Refresh reach-out text after table is populated
            setTimeout(forceTableReachOutRefresh, 500);

            return result;
        };
        console.log('🔧 Hooked into displayLeads function');
    }

    // Hook into loadLeadsView if it exists
    if (window.loadLeadsView) {
        const originalLoadLeadsView = window.loadLeadsView;
        window.loadLeadsView = function() {
            const result = originalLoadLeadsView.apply(this, arguments);

            // Refresh reach-out text after table is loaded
            setTimeout(forceTableReachOutRefresh, 1000);

            return result;
        };
        console.log('🔧 Hooked into loadLeadsView function');
    }

    console.log('✅ REACH OUT TABLE TEXT FIX: Loaded successfully');

})();