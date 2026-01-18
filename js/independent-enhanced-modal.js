// Independent Enhanced Agent Modal
// Uses only independent tracking data for accurate post-reset statistics

(function() {
    'use strict';

    console.log('🔧 Loading Independent Enhanced Modal System...');

    // Override the viewAgentStats function to use independent tracking
    // Multiple overrides to ensure it takes precedence
    setTimeout(() => {
        if (window.getIndependentAgentPerformance) {
            window.viewAgentStats = function(agentName) {
                console.log('🎯 Running independent enhanced modal for:', agentName);
                return showIndependentAgentModal(agentName);
            };

            // Also override the enhanced version
            window.enhancedViewAgentStats = function(agentName) {
                console.log('🎯 Overriding enhanced viewAgentStats with independent version');
                return showIndependentAgentModal(agentName);
            };

            console.log('✅ Independent tracking system has overridden viewAgentStats functions');
        }
    }, 3000);

    // Additional override with longer delay to ensure it wins
    setTimeout(() => {
        if (window.getIndependentAgentPerformance) {
            window.viewAgentStats = function(agentName) {
                console.log('🎯 [FINAL OVERRIDE] Running independent enhanced modal for:', agentName);
                return showIndependentAgentModal(agentName);
            };

            window.enhancedViewAgentStats = function(agentName) {
                console.log('🎯 [FINAL OVERRIDE] Overriding enhanced viewAgentStats with independent version');
                return showIndependentAgentModal(agentName);
            };
        }
    }, 5000);

    function showIndependentAgentModal(agentName) {
        console.log(`🎯 Creating independent modal for ${agentName}`);

        // Close any existing modal first
        closeAgentModal();

        // Prevent recursive calls
        if (window._creatingIndependentModal) {
            console.log('⚠️ Already creating independent modal, preventing recursion');
            return;
        }
        window._creatingIndependentModal = true;

        // Get independent tracking data
        const agentStats = window.getIndependentAgentPerformance(agentName, 'since_reset');
        console.log(`📊 Independent stats for ${agentName}:`, agentStats);

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;

        // Build the modal content with independent tracking data
        modalOverlay.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 900px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                position: relative;
            ">
                <!-- Modal Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
                                <i class="fas fa-user-circle" style="margin-right: 12px;"></i>${agentName} Performance
                            </h2>
                            <p style="margin: 8px 0 0 0; opacity: 0.9;">Independent tracking - accurate since reset</p>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <!-- Reset Button -->
                            <button onclick="resetIndependentAgent('${agentName}'); closeAgentModal(); setTimeout(() => viewAgentStats('${agentName}'), 500);" style="
                                padding: 8px 16px;
                                background: rgba(220, 38, 38, 0.9);
                                border: 1px solid rgba(255, 255, 255, 0.3);
                                border-radius: 8px;
                                color: white;
                                font-size: 14px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            " onmouseover="this.style.background='rgba(220, 38, 38, 1)'" onmouseout="this.style.background='rgba(220, 38, 38, 0.9)'">
                                <i class="fas fa-redo"></i>
                                Reset Stats
                            </button>

                            <!-- Close Button -->
                            <button onclick="closeAgentModal()" style="
                                width: 40px;
                                height: 40px;
                                border: 2px solid rgba(255, 255, 255, 0.3);
                                border-radius: 50%;
                                background: rgba(255, 255, 255, 0.1);
                                color: white;
                                font-size: 18px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">×</button>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Content -->
                <div style="padding: 24px;">
                    <!-- Current Period Display -->
                    <div style="text-align: center; margin-bottom: 20px; padding: 12px; background: #eff6ff; border-radius: 8px;">
                        <strong style="color: #1d4ed8;">📊 Viewing: Performance Since Last Reset</strong>
                        ${agentStats.resetTimestamp ? `<br><small style="color: #6b7280;">Reset on: ${new Date(agentStats.resetTimestamp).toLocaleString()}</small>` : ''}
                    </div>

                    <!-- Stats Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">

                        <!-- Lead Distribution -->
                        <div style="background: linear-gradient(135deg, #10b981 0%, #065f46 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📈 Lead Distribution</h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 32px; font-weight: 700;">${agentStats.totalLeads}</span>
                                    <span style="color: #86efac;">↗️</span>
                                </div>
                                <div style="font-size: 14px; opacity: 0.9;">Total Leads Since Reset</div>

                                <div style="margin-top: 12px; font-size: 14px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span>${agentStats.highValueLeads}</span>
                                        <span>${agentStats.totalLeads > 0 ? ((agentStats.highValueLeads / agentStats.totalLeads) * 100).toFixed(1) : '0.0'}% of total ↗️</span>
                                    </div>
                                    <div style="font-weight: 600;">High Value Leads</div>
                                </div>

                                <div style="font-size: 14px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span>${agentStats.lowValueLeads}</span>
                                        <span>${agentStats.totalLeads > 0 ? ((agentStats.lowValueLeads / agentStats.totalLeads) * 100).toFixed(1) : '0.0'}% of total</span>
                                    </div>
                                    <div style="font-weight: 600;">Low Value Leads</div>
                                </div>
                            </div>
                        </div>

                        <!-- Call Activity -->
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📞 Call Activity</h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 32px; font-weight: 700;">${agentStats.totalCalls}</span>
                                    <span style="color: #93c5fd;">↗️</span>
                                </div>
                                <div style="font-size: 14px; opacity: 0.9;">Total Calls Since Reset</div>

                                <div style="margin-top: 12px; font-size: 14px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span>${agentStats.callTime}</span>
                                        <span>Avg: ${agentStats.totalCalls > 0 ? (agentStats.callTime / agentStats.totalCalls).toFixed(1) : '0'} min/call</span>
                                    </div>
                                    <div style="font-weight: 600;">Total Call Duration (min)</div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Metrics -->
                        <div style="background: linear-gradient(135deg, #f59e0b 0%, #92400e 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">⚡ Performance Metrics</h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 32px; font-weight: 700;">${agentStats.contactRate}%</span>
                                    <span style="color: #fcd34d;">➡️</span>
                                </div>
                                <div style="font-size: 14px; opacity: 0.9;">Contact Rate Since Reset</div>

                                <div style="margin-top: 12px; font-size: 14px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span>${agentStats.totalSales}</span>
                                        <span>${agentStats.conversionRate}% of total</span>
                                    </div>
                                    <div style="font-weight: 600;">Sales Conversions</div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Summary -->
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📊 Performance Summary</h3>
                            <div style="font-size: 14px; line-height: 1.6;">
                                ${agentName} has managed <strong>${agentStats.totalLeads} leads since reset</strong> with ${agentStats.highValueLeads} high-value leads (${agentStats.totalLeads > 0 ? ((agentStats.highValueLeads / agentStats.totalLeads) * 100).toFixed(1) : '0'}%) and ${agentStats.lowValueLeads} low-value leads (${agentStats.totalLeads > 0 ? ((agentStats.lowValueLeads / agentStats.totalLeads) * 100).toFixed(1) : '0'}%).
                                <br><br>
                                Call activity shows <strong>${agentStats.totalCalls} calls</strong> with ${agentStats.callTime} minutes total talk time. Contact rate stands at <strong>${agentStats.contactRate}%</strong> with ${agentStats.totalSales} successful conversions.
                                <br><br>
                                <em style="opacity: 0.8;">📅 Data tracked since: ${agentStats.resetTimestamp ? new Date(agentStats.resetTimestamp).toLocaleDateString() : 'System start'}</em>
                            </div>
                        </div>
                    </div>

                    <!-- Time Period Filters -->
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h3 style="margin: 0 0 16px 0; color: #1f2937;">📅 Time Period View</h3>
                        <div style="display: inline-flex; background: #f3f4f6; padding: 4px; border-radius: 12px; gap: 4px;">
                            <button onclick="showIndependentPeriodStats('${agentName}', 'today')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">Today</button>
                            <button onclick="showIndependentPeriodStats('${agentName}', 'week')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">7 Days</button>
                            <button onclick="showIndependentPeriodStats('${agentName}', 'month')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">Month</button>
                            <button onclick="showIndependentPeriodStats('${agentName}', 'since_reset')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #3b82f6; color: white; font-weight: 600; cursor: pointer;">Since Reset</button>
                            <button onclick="showIndependentPeriodStats('${agentName}', 'all')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">All Time</button>
                        </div>
                    </div>

                    <!-- Debug Info (if enabled) -->
                    ${window.DEV_MODE ? `
                    <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <h4 style="margin: 0 0 12px 0; color: #1f2937;">🔧 Debug Information</h4>
                        <pre style="font-size: 12px; color: #6b7280; margin: 0; white-space: pre-wrap;">${JSON.stringify(agentStats, null, 2)}</pre>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add modal to page
        document.body.appendChild(modalOverlay);

        // Debug: Log modal state
        console.log('📦 Modal added to DOM, checking state...');
        setTimeout(() => {
            const modalCheck = document.querySelector('.modal-overlay');
            console.log('🔍 Modal still in DOM after 100ms:', modalCheck ? 'YES' : 'NO');
        }, 100);

        setTimeout(() => {
            const modalCheck = document.querySelector('.modal-overlay');
            console.log('🔍 Modal still in DOM after 500ms:', modalCheck ? 'YES' : 'NO');
        }, 500);

        // Add click outside to close (with debugging)
        modalOverlay.addEventListener('click', function(e) {
            console.log('👆 Click detected on modal overlay, target:', e.target.className);
            if (e.target === modalOverlay) {
                console.log('👆 Closing modal due to outside click');
                closeAgentModal();
            }
        });

        console.log('✅ Independent enhanced modal created successfully');

        // Clear the creation flag
        window._creatingIndependentModal = false;
    }

    // Function to show different time periods
    window.showIndependentPeriodStats = function(agentName, period) {
        console.log(`📅 Showing ${period} stats for ${agentName}`);
        closeAgentModal();
        setTimeout(() => {
            const agentStats = window.getIndependentAgentPerformance(agentName, period);
            console.log(`Period ${period} stats:`, agentStats);
            showIndependentAgentModal(agentName, period);
        }, 100);
    };

    // Make showIndependentAgentModal globally available
    window.showIndependentAgentModal = showIndependentAgentModal;

    // Enhanced close function
    window.closeAgentModal = function() {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
    };

    // Add keyboard support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAgentModal();
        }
    });

    console.log('✅ Independent Enhanced Modal System loaded');

})();