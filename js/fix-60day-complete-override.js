// COMPLETE OVERRIDE - Fix 60-Day View Display and Filtering
console.log('🔨 COMPLETE OVERRIDE: Fixing 60-Day view display and filtering...');

(function() {
    // Main override function
    function completeOverride() {
        if (!window.renewalsManager) {
            setTimeout(completeOverride, 100);
            return;
        }

        console.log('✅ Applying complete 60-day override');

        // 1. Override the main loadRenewalsView function
        const originalLoad = window.renewalsManager.loadRenewalsView;
        window.renewalsManager.loadRenewalsView = function() {
            const dashboardContent = document.querySelector('.dashboard-content');
            if (!dashboardContent) return;

            // Get policies from localStorage
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

            // Add expiration dates to policies if not present
            policies.forEach(policy => {
                if (!policy.expirationDate) {
                    const effectiveDate = policy.effectiveDate ? new Date(policy.effectiveDate) : new Date();
                    const expirationDate = new Date(effectiveDate);
                    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
                    policy.expirationDate = expirationDate.toISOString().split('T')[0];
                }
            });

            // Sort policies by expiration date
            policies.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

            // Filter policies based on view
            let filteredPolicies;
            const now = new Date();

            if (this.currentView === 'month') {
                // FORCE 60-day filtering
                const sixtyDaysFromNow = new Date(now);
                sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

                filteredPolicies = policies.filter(policy => {
                    const expDate = new Date(policy.expirationDate);
                    return expDate >= now && expDate <= sixtyDaysFromNow;
                });

                console.log(`📅 Showing ${filteredPolicies.length} policies expiring in next 60 days`);
            } else {
                // Year view
                filteredPolicies = policies;
            }

            // Generate the HTML with corrected text
            const viewHTML = `
                <div class="renewals-view">
                    <header class="content-header">
                        <h1>Renewals Management</h1>
                        <div class="header-actions">
                            <div class="view-toggle">
                                <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" onclick="renewalsManager.switchView('month')">
                                    <i class="fas fa-calendar-days"></i> 60-Day View
                                </button>
                                <button class="view-btn ${this.currentView === 'year' ? 'active' : ''}" onclick="renewalsManager.switchView('year')">
                                    <i class="fas fa-calendar-alt"></i> Year View
                                </button>
                            </div>
                            <button class="btn-secondary" onclick="renewalsManager.exportRenewals()">
                                <i class="fas fa-download"></i> Export
                            </button>
                            <button class="btn-primary" onclick="renewalsManager.createRenewalCampaign()">
                                <i class="fas fa-paper-plane"></i> Create Campaign
                            </button>
                        </div>
                    </header>

                    ${this.currentView === 'month' ? `
                        <!-- Month/60-Day View Content -->
                        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; margin: 20px 0;">
                            <h2 style="margin: 0; font-size: 24px;">
                                <i class="fas fa-calendar-check"></i> Renewals Due Within 60 Days
                            </h2>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">
                                Showing all policies expiring between ${now.toLocaleDateString()} and ${new Date(now.getTime() + 60*24*60*60*1000).toLocaleDateString()}
                            </p>
                        </div>

                        <div class="renewals-grid">
                            ${filteredPolicies.length === 0 ?
                                '<div style="text-align: center; padding: 40px; color: #666;">No policies expiring in the next 60 days</div>' :
                                filteredPolicies.map(policy => {
                                    const daysUntil = Math.ceil((new Date(policy.expirationDate) - now) / (1000 * 60 * 60 * 24));
                                    const urgencyClass = daysUntil <= 30 ? 'urgent' : daysUntil <= 45 ? 'warning' : 'normal';

                                    return `
                                        <div class="renewal-item" onclick="renewalsManager.selectRenewal(${JSON.stringify(policy).replace(/"/g, '&quot;')})">
                                            <div class="renewal-item-header">
                                                <h4>${policy.clientName || 'Unknown Client'}</h4>
                                                <span class="expiration-badge ${urgencyClass}">
                                                    ${daysUntil} days
                                                </span>
                                            </div>
                                            <div class="renewal-item-info">
                                                <div class="policy-number">Policy #${policy.policyNumber || 'N/A'}</div>
                                                <div>Expires: ${new Date(policy.expirationDate).toLocaleDateString()}</div>
                                                <div>Premium: $${(policy.premium || 0).toLocaleString()}/yr</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                    ` : `
                        <!-- Year View Content (unchanged) -->
                        ${this.generateYearViewContent ? this.generateYearViewContent(filteredPolicies) :
                          originalLoad ? '<div>Loading year view...</div>' : ''}
                    `}
                </div>

                <style>
                    .renewals-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                        padding: 20px;
                    }

                    .renewal-item {
                        background: white;
                        border-radius: 10px;
                        padding: 20px;
                        border-left: 5px solid #2196F3;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }

                    .renewal-item:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    .renewal-item-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }

                    .renewal-item-header h4 {
                        margin: 0;
                        color: #333;
                    }

                    .expiration-badge {
                        padding: 5px 12px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                    }

                    .expiration-badge.urgent {
                        background: #ffebee;
                        color: #c62828;
                    }

                    .expiration-badge.warning {
                        background: #fff3e0;
                        color: #f57c00;
                    }

                    .expiration-badge.normal {
                        background: #e8f5e9;
                        color: #2e7d32;
                    }

                    .renewal-item-info {
                        font-size: 14px;
                        color: #666;
                        line-height: 1.6;
                    }

                    .policy-number {
                        font-weight: 600;
                        color: #444;
                    }
                </style>
            `;

            dashboardContent.innerHTML = viewHTML;

            // If year view, call the original function's year view generation
            if (this.currentView === 'year' && originalLoad) {
                // Let the original handle year view
                originalLoad.call(this);
            }
        };

        // 2. Override filterPoliciesByView to ensure 60-day filtering
        window.renewalsManager.filterPoliciesByView = function(policies) {
            const now = new Date();

            if (this.currentView === 'month') {
                const sixtyDaysFromNow = new Date(now);
                sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

                return policies.filter(policy => {
                    const expDate = new Date(policy.expirationDate);
                    return expDate >= now && expDate <= sixtyDaysFromNow;
                });
            } else {
                // Year view - return all
                return policies;
            }
        };

        // 3. Override switchView to maintain proper display
        const originalSwitch = window.renewalsManager.switchView;
        window.renewalsManager.switchView = function(view) {
            this.currentView = view;
            this.loadRenewalsView();
        };
    }

    // Start the override
    completeOverride();

    console.log('✅ Complete 60-day override active');
})();