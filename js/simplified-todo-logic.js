// Simplified TO DO Logic - Callback-Only System
// This overrides the complex highlight duration tracking system
// RULE: Red "Reach out: CALL" ONLY shows when there's an OVERDUE scheduled callback

console.log('🎯 LOADED: Simplified TO DO Logic - Callback-Only System');

// Override the complex applyReachOutStyling function with simplified version
window.applyReachOutStyling = function(leadId, hasReachOutTodo) {
    console.log(`🎨 SIMPLIFIED STYLING: Lead ${leadId} - hasReachOutTodo: ${hasReachOutTodo}`);

    // Update the TO DO message in the header
    const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
    const separator = document.getElementById(`reach-out-separator-${leadId}`);
    const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);

    if (todoDiv) {
        const lead = JSON.parse(localStorage.getItem('insurance_leads') || '[]').find(l => String(l.id) === String(leadId));
        if (lead) {
            // SIMPLIFIED: Only check for overdue callbacks to show red TO DO
            const isCallbackOverdue = checkSimpleOverdueCallback(leadId);
            console.log(`📞 SIMPLE CHECK: Lead ${leadId} - hasOverdueCallback: ${isCallbackOverdue}`);

            if (isCallbackOverdue) {
                // Show red TO DO for overdue callbacks only
                todoDiv.style.display = 'block';
                todoDiv.innerHTML = `<span style="color: #dc2626; font-weight: bold; font-size: 18px;">TO DO: OVERDUE CALLBACK</span>`;

                // Change header to red
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #dc2626;">Reach Out</span>';
                }

                // Change separator line to red
                if (separator) {
                    separator.style.borderBottom = '2px solid #dc2626';
                }

                // Hide completion timestamp
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }

                console.log(`🔴 SIMPLE RED: Lead ${leadId} shows red due to overdue callback`);
            } else {
                // No overdue callbacks = GREEN/COMPLETE (or hidden)
                todoDiv.style.display = 'none'; // Hide TO DO section entirely

                // Show as completed/green (or just hide the section entirely)
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
                }

                if (separator) {
                    separator.style.borderBottom = '2px solid #10b981';
                }

                // Hide completion timestamp for now (simplified)
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }

                console.log(`🟢 SIMPLE GREEN: Lead ${leadId} is green (no overdue callbacks)`);
            }
        }
    }
};

// Simple helper function to check overdue callbacks
function checkSimpleOverdueCallback(leadId) {
    try {
        const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
        const leadCallbacks = callbacks[leadId] || [];
        const now = new Date();

        // Check if any callback is overdue
        const overdueCallback = leadCallbacks.find(callback => {
            if (callback.completed) return false; // Skip completed callbacks

            const callbackDateTime = new Date(`${callback.date}T${callback.time}`);
            return callbackDateTime < now; // Overdue if callback time has passed
        });

        return !!overdueCallback;
    } catch (error) {
        console.error('❌ Error checking simple overdue callbacks:', error);
        return false;
    }
}

console.log('✅ SIMPLIFIED TO DO SYSTEM LOADED: Only overdue callbacks trigger red "Reach out: CALL"');