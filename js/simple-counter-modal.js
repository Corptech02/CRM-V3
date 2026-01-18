// Simple Counter Modal - No complex features, just shows the counter
(function() {
    'use strict';

    console.log('🎯 Loading Simple Counter Modal...');

    function showTrueCounterModal(agentName) {
        console.log(`🎯 Creating simple counter modal for ${agentName}`);

        // Remove any existing modals
        const existing = document.querySelector('.simple-counter-modal');
        if (existing) {
            existing.remove();
        }

        // Get counter data
        const counters = window.getAgentCounters ? window.getAgentCounters(agentName) : {
            leadCount: 0, callCount: 0, saleCount: 0, resetTimestamp: null
        };

        console.log(`📊 Counter data for ${agentName}:`, counters);

        // Create simple modal
        const modal = document.createElement('div');
        modal.className = 'simple-counter-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 999999;
            width: 400px;
            max-width: 90vw;
        `;

        modal.innerHTML = `
            <div style="text-align: center;">
                <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    ${agentName} Counter
                </h2>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div style="background: #dbeafe; padding: 16px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #1d4ed8;">${counters.leadCount}</div>
                        <div style="color: #374151;">Leads Added</div>
                    </div>

                    <div style="background: #dcfce7; padding: 16px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #16a34a;">${counters.callCount}</div>
                        <div style="color: #374151;">Calls Made</div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="background: #fef3c7; padding: 16px; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #92400e;">${counters.saleCount}</div>
                        <div style="color: #374151;">Sales Made</div>
                    </div>
                </div>

                ${counters.resetTimestamp ? `
                <div style="margin-bottom: 20px; font-size: 12px; color: #6b7280;">
                    Counter reset on: ${new Date(counters.resetTimestamp).toLocaleString()}
                </div>
                ` : ''}

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="manuallyAddLead('${agentName}', 1); showTrueCounterModal('${agentName}')" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">+1 Lead</button>

                    <button onclick="incrementCallCounter('${agentName}'); showTrueCounterModal('${agentName}')" style="
                        background: #16a34a;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">+1 Call</button>

                    <button onclick="resetAgentStats('${agentName}')" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Reset</button>

                    <button onclick="document.querySelector('.simple-counter-modal').remove()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Close</button>
                </div>
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999998;
        `;

        // Click backdrop to close (with delay to prevent immediate closure)
        setTimeout(() => {
            backdrop.addEventListener('click', () => {
                console.log('📦 Backdrop clicked, closing simple modal');
                backdrop.remove();
                modal.remove();
            });
        }, 500); // Add 500ms delay before enabling backdrop click

        // Add to page
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        // Debug
        console.log('✅ Simple counter modal created and added to DOM');

        // Check if it's still there after a delay
        setTimeout(() => {
            const stillThere = document.querySelector('.simple-counter-modal');
            console.log('🔍 Simple modal still in DOM after 200ms:', stillThere ? 'YES' : 'NO');
        }, 200);
    }

    // Make it globally available
    window.showTrueCounterModal = showTrueCounterModal;

    // Override viewAgentStats to use simple counter modal
    setTimeout(() => {
        // Multiple aggressive overrides
        window.viewAgentStats = function(agentName) {
            console.log('🎯 [SIMPLE OVERRIDE] Using simple counter modal for:', agentName);
            return showTrueCounterModal(agentName);
        };

        window.enhancedViewAgentStats = function(agentName) {
            console.log('🎯 [SIMPLE OVERRIDE] Enhanced function blocked, using simple modal');
            return showTrueCounterModal(agentName);
        };

        // Block the independent modal too since it has the closing issue
        window.showIndependentAgentModal = function(agentName) {
            console.log('🎯 [SIMPLE OVERRIDE] Independent modal blocked, using simple modal');
            return showTrueCounterModal(agentName);
        };

        console.log('🎯 Simple counter modal has overridden ALL agent stats functions');
    }, 8000); // Load last to ensure it wins

    // Even more aggressive override
    setTimeout(() => {
        window.viewAgentStats = function(agentName) {
            console.log('🎯 [FINAL SIMPLE OVERRIDE] Using simple counter modal for:', agentName);
            return showTrueCounterModal(agentName);
        };
    }, 10000);

})();