// Renewals Management Module
class RenewalsManager {
    constructor() {
        this.currentView = 'month'; // 'month' or 'year'
        this.selectedRenewal = null;
        this.renewalTasks = {};
    }

    // Load renewals view
    loadRenewalsView() {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        // Get policies from localStorage
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        
        // Add expiration dates to policies if not present
        policies.forEach(policy => {
            if (!policy.expirationDate) {
                // Generate expiration date based on effective date or random
                const effectiveDate = policy.effectiveDate ? new Date(policy.effectiveDate) : new Date();
                const expirationDate = new Date(effectiveDate);
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
                policy.expirationDate = expirationDate.toISOString().split('T')[0];
            }
        });

        // Sort policies by expiration date
        policies.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        // Filter policies based on view
        const filteredPolicies = this.filterPoliciesByView(policies);

        dashboardContent.innerHTML = `
            <div class="renewals-view">
                <header class="content-header">
                    <h1>Renewals Management</h1>
                    <div class="header-actions">
                        <div class="view-toggle">
                            <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" onclick="renewalsManager.switchView('month')">
                                <i class="fas fa-calendar-day"></i> Month View
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

                <!-- Renewal Stats -->
                <div class="renewal-stats">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8C8C 100%);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <h4>Expiring This Month</h4>
                            <p class="stat-number">${this.getExpiringThisMonth(policies)}</p>
                            <span class="stat-trend">Premium: $${this.getExpiringPremium(policies, 30).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FFA500 0%, #FFB84D 100%);">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h4>Next 60 Days</h4>
                            <p class="stat-number">${this.getExpiringInDays(policies, 60)}</p>
                            <span class="stat-trend">Premium: $${this.getExpiringPremium(policies, 60).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h4>Renewed YTD</h4>
                            <p class="stat-number">${this.getRenewedYTD()}</p>
                            <span class="stat-trend positive">95% retention rate</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-content">
                            <h4>Renewal Revenue</h4>
                            <p class="stat-number">$${this.getRenewalRevenue().toLocaleString()}</p>
                            <span class="stat-trend positive">+12% from last year</span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="renewal-content">
                    <!-- Left: Renewals List -->
                    <div class="renewals-list">
                        <div class="list-header">
                            <h3>${this.currentView === 'month' ? 'Monthly' : 'Annual'} Renewals</h3>
                            <input type="text" class="search-input" placeholder="Search renewals..." onkeyup="renewalsManager.searchRenewals(this.value)">
                        </div>
                        <div class="renewals-items" id="renewalsItems">
                            ${this.generateRenewalsList(filteredPolicies)}
                        </div>
                    </div>

                    <!-- Right: Renewal Details -->
                    <div class="renewal-details" id="renewalDetails">
                        ${this.selectedRenewal ? this.generateRenewalDetails(this.selectedRenewal) : this.getEmptyState()}
                    </div>
                </div>
            </div>

            <style>
                .renewals-view {
                    padding: 20px;
                }

                .view-toggle {
                    display: flex;
                    gap: 10px;
                    margin-right: 15px;
                }

                .view-btn {
                    padding: 8px 16px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .view-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
                }

                .renewal-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .renewal-content {
                    display: grid;
                    grid-template-columns: 450px 1fr;
                    gap: 20px;
                    height: calc(100vh - 350px);
                }

                .renewals-list {
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                }

                .list-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                }

                .list-header h3 {
                    margin-bottom: 15px;
                }

                .search-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }

                .renewals-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                }

                .renewal-item {
                    padding: 15px;
                    margin-bottom: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 2px solid transparent;
                }

                .renewal-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }

                .renewal-item.selected {
                    background: white;
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
                }

                .renewal-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 10px;
                }

                .renewal-item-info h4 {
                    margin: 0 0 5px 0;
                    color: #333;
                }

                .renewal-item-info .policy-number {
                    color: #666;
                    font-size: 0.9em;
                }

                .expiration-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.85em;
                    font-weight: 600;
                }

                .expiration-urgent {
                    background: #FFE5E5;
                    color: #D32F2F;
                }

                .expiration-warning {
                    background: #FFF3E0;
                    color: #F57C00;
                }

                .expiration-normal {
                    background: #E8F5E9;
                    color: #388E3C;
                }

                .renewal-item-details {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    font-size: 0.9em;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: #666;
                }

                .detail-item i {
                    width: 16px;
                    color: #999;
                }

                .renewal-details {
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    overflow-y: auto;
                }

                .renewal-profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 20px;
                }

                .profile-info h2 {
                    margin: 0 0 10px 0;
                    color: #333;
                }

                .profile-meta {
                    display: flex;
                    gap: 20px;
                    color: #666;
                    font-size: 0.9em;
                }

                .renewal-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #eee;
                }

                .tab-btn {
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    font-size: 1em;
                    position: relative;
                    transition: all 0.3s;
                }

                .tab-btn.active {
                    color: #667eea;
                }

                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #667eea;
                }

                .tab-content {
                    padding: 20px 0;
                }

                .tasks-list {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                }

                .task-item {
                    display: grid;
                    grid-template-columns: 30px 2fr 1fr 1.5fr 2fr;
                    gap: 15px;
                    padding: 12px;
                    background: white;
                    margin-bottom: 10px;
                    border-radius: 6px;
                    align-items: center;
                    font-size: 0.9em;
                }

                .task-item:hover {
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .task-checkbox {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                .task-name {
                    font-weight: 500;
                    color: #333;
                }

                .task-status {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .status-done {
                    color: #4CAF50;
                }

                .status-pending {
                    color: #FF9800;
                }

                .task-date {
                    color: #666;
                    font-size: 0.9em;
                }

                .task-notes {
                    color: #666;
                    font-style: italic;
                }

                .submissions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 15px;
                }

                .submission-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    border: 1px solid #e0e0e0;
                }

                .submission-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .carrier-name {
                    font-weight: 600;
                    color: #333;
                }

                .premium-amount {
                    font-size: 1.2em;
                    color: #667eea;
                    font-weight: 600;
                }

                .submission-details {
                    font-size: 0.85em;
                    color: #666;
                    margin-top: 10px;
                }

                .submission-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                }

                .empty-state i {
                    font-size: 4em;
                    margin-bottom: 20px;
                    color: #ddd;
                }

                .policy-summary {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }

                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }

                .summary-label {
                    color: #666;
                }

                .summary-value {
                    font-weight: 600;
                    color: #333;
                }
            </style>
        `;

        // Add click handler if there are policies
        if (filteredPolicies.length > 0) {
            setTimeout(() => {
                // Select first renewal by default
                this.selectRenewal(filteredPolicies[0]);
            }, 100);
        }
    }

    // Filter policies based on current view
    filterPoliciesByView(policies) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        if (this.currentView === 'month') {
            // Show policies expiring in the next 30 days
            const thirtyDaysFromNow = new Date(now);
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            return policies.filter(policy => {
                const expDate = new Date(policy.expirationDate);
                return expDate >= now && expDate <= thirtyDaysFromNow;
            });
        } else {
            // Show all policies for the current year
            return policies.filter(policy => {
                const expDate = new Date(policy.expirationDate);
                return expDate.getFullYear() === currentYear;
            });
        }
    }

    // Generate renewals list HTML
    generateRenewalsList(policies) {
        if (policies.length === 0) {
            return '<div class="empty-state"><i class="fas fa-inbox"></i><p>No renewals found for this period</p></div>';
        }

        return policies.map(policy => {
            const daysUntilExpiration = this.getDaysUntilExpiration(policy.expirationDate);
            const urgencyClass = this.getUrgencyClass(daysUntilExpiration);
            
            return `
                <div class="renewal-item" onclick="renewalsManager.selectRenewal(${JSON.stringify(policy).replace(/"/g, '&quot;')})">
                    <div class="renewal-item-header">
                        <div class="renewal-item-info">
                            <h4>${policy.clientName || 'Unknown Client'}</h4>
                            <div class="policy-number">Policy #${policy.policyNumber || 'N/A'}</div>
                        </div>
                        <span class="expiration-badge ${urgencyClass}">
                            ${daysUntilExpiration <= 0 ? 'EXPIRED' : `${daysUntilExpiration} days`}
                        </span>
                    </div>
                    <div class="renewal-item-details">
                        <div class="detail-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>${this.getPolicyTypeDisplay(policy.policyType)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>$${(policy.premium || 0).toLocaleString()}/yr</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-building"></i>
                            <span>${policy.carrier || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(policy.expirationDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Generate renewal details/profile
    generateRenewalDetails(policy) {
        const tasks = this.getRenewalTasks(policy.id);
        
        return `
            <div class="renewal-profile">
                <div class="renewal-profile-header">
                    <div class="profile-info">
                        <h2>${policy.clientName || 'Unknown Client'}</h2>
                        <div class="profile-meta">
                            <span><i class="fas fa-file-contract"></i> ${policy.policyNumber}</span>
                            <span><i class="fas fa-shield-alt"></i> ${this.getPolicyTypeDisplay(policy.policyType)}</span>
                            <span><i class="fas fa-building"></i> ${policy.carrier || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn-secondary" onclick="renewalsManager.editRenewal()">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-primary" onclick="renewalsManager.startRenewal()">
                            <i class="fas fa-play"></i> Start Renewal
                        </button>
                    </div>
                </div>

                <div class="renewal-tabs">
                    <button class="tab-btn active" onclick="renewalsManager.switchTab('tasks', this)">
                        <i class="fas fa-tasks"></i> Tasks
                    </button>
                    <button class="tab-btn" onclick="renewalsManager.switchTab('submissions', this)">
                        <i class="fas fa-paper-plane"></i> Submissions
                    </button>
                    <button class="tab-btn" onclick="renewalsManager.switchTab('policy', this)">
                        <i class="fas fa-info-circle"></i> Policy Info
                    </button>
                </div>

                <div class="tab-content" id="tabContent">
                    ${this.generateTasksTab(tasks)}
                </div>
            </div>
        `;
    }

    // Generate tasks tab content
    generateTasksTab(tasks) {
        const defaultTasks = [
            { id: 1, name: 'Request Updates from Client', status: 'done', date: '1/24 at 10:37PM', notes: '', daysOut: 0 },
            { id: 2, name: 'Updates Received', status: 'done', date: '1/24 at 10:37PM', notes: '', daysOut: 0 },
            { id: 3, name: 'Request Loss Runs', status: 'pending', date: '11/26', daysOut: 80, notes: '' },
            { id: 4, name: 'Loss Runs Received', status: 'pending', date: '', daysOut: 85, notes: '' },
            { id: 5, name: 'Create Applications', status: 'pending', date: '', daysOut: 120, notes: 'Make sure he fills out a supplemental' },
            { id: 6, name: 'Create Proposal', status: 'pending', date: '2/4', daysOut: 150, notes: '' },
            { id: 7, name: 'Send Proposal', status: 'pending', date: '2/10', daysOut: 156, notes: '' },
            { id: 8, name: 'Signed Docs Received', status: 'pending', date: '', daysOut: 165, notes: '' },
            { id: 9, name: 'Bind Order', status: 'pending', date: '2/23', daysOut: 169, notes: '' },
            { id: 10, name: 'Finalize Renewal', status: 'pending', date: '3/6', daysOut: 180, notes: 'Accounting / Send Thank You Card / Finance' }
        ];

        const tasksList = tasks || defaultTasks;

        return `
            <div class="tasks-list">
                <div class="task-item" style="font-weight: 600; background: #e9ecef;">
                    <div></div>
                    <div>Task</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Notes</div>
                </div>
                ${tasksList.map(task => `
                    <div class="task-item">
                        <input type="checkbox" 
                            class="task-checkbox" 
                            ${task.status === 'done' ? 'checked' : ''}
                            onchange="renewalsManager.updateTaskStatus(${task.id}, this.checked)">
                        <div class="task-name">${task.name}</div>
                        <div class="task-status ${task.status === 'done' ? 'status-done' : 'status-pending'}">
                            ${task.status === 'done' ? '<i class="fas fa-check-circle"></i> Done' : '<i class="fas fa-clock"></i> Pending'}
                        </div>
                        <div class="task-date">
                            ${task.date || ''}
                            ${task.daysOut > 0 && task.status !== 'done' ? ` (In ${task.daysOut} Days)` : ''}
                        </div>
                        <div class="task-notes">${task.notes || ''}</div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 20px;">
                <button class="btn-secondary" onclick="renewalsManager.addTask()">
                    <i class="fas fa-plus"></i> Add Task
                </button>
                <button class="btn-primary" onclick="renewalsManager.saveTaskProgress()">
                    <i class="fas fa-save"></i> Save Progress
                </button>
            </div>
        `;
    }

    // Generate submissions tab content
    generateSubmissionsTab() {
        const submissions = [
            { carrier: 'Progressive', premium: 5200, status: 'Quoted', date: '1/20/2025' },
            { carrier: 'State Farm', premium: 4800, status: 'Pending', date: '1/18/2025' },
            { carrier: 'Geico', premium: 5500, status: 'Quoted', date: '1/22/2025' }
        ];

        return `
            <div class="submissions-section">
                <div style="margin-bottom: 20px;">
                    <button class="btn-primary" onclick="renewalsManager.addSubmission()">
                        <i class="fas fa-plus"></i> Add Submission
                    </button>
                </div>
                <div class="submissions-grid">
                    ${submissions.map(sub => `
                        <div class="submission-card">
                            <div class="submission-header">
                                <div class="carrier-name">${sub.carrier}</div>
                                <div class="premium-amount">$${sub.premium.toLocaleString()}</div>
                            </div>
                            <div class="submission-details">
                                <div>Status: <strong>${sub.status}</strong></div>
                                <div>Date: ${sub.date}</div>
                            </div>
                            <div class="submission-actions">
                                <button class="btn-secondary" onclick="renewalsManager.viewQuote('${sub.carrier}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn-primary" onclick="renewalsManager.selectQuote('${sub.carrier}')">
                                    <i class="fas fa-check"></i> Select
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Generate policy info tab
    generatePolicyTab(policy) {
        return `
            <div class="policy-summary">
                <h3>Policy Information</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">Policy Number:</span>
                        <span class="summary-value">${policy.policyNumber || 'N/A'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Type:</span>
                        <span class="summary-value">${this.getPolicyTypeDisplay(policy.policyType)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Carrier:</span>
                        <span class="summary-value">${policy.carrier || 'N/A'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Current Premium:</span>
                        <span class="summary-value">$${(policy.premium || 0).toLocaleString()}/yr</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Effective Date:</span>
                        <span class="summary-value">${policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Expiration Date:</span>
                        <span class="summary-value">${new Date(policy.expirationDate).toLocaleDateString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Days Until Renewal:</span>
                        <span class="summary-value">${this.getDaysUntilExpiration(policy.expirationDate)} days</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Client:</span>
                        <span class="summary-value">${policy.clientName || 'Unknown'}</span>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn-secondary" onclick="renewalsManager.viewFullPolicy()">
                        <i class="fas fa-file-alt"></i> View Full Policy
                    </button>
                    <button class="btn-primary" onclick="renewalsManager.contactClient()">
                        <i class="fas fa-envelope"></i> Contact Client
                    </button>
                </div>
            </div>
        `;
    }

    // Switch between month and year view
    switchView(view) {
        this.currentView = view;
        this.loadRenewalsView();
    }

    // Switch tabs in renewal details
    switchTab(tab, btnElement) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');

        // Update tab content
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) return;

        switch(tab) {
            case 'tasks':
                tabContent.innerHTML = this.generateTasksTab(this.getRenewalTasks(this.selectedRenewal?.id));
                break;
            case 'submissions':
                tabContent.innerHTML = this.generateSubmissionsTab();
                break;
            case 'policy':
                tabContent.innerHTML = this.generatePolicyTab(this.selectedRenewal);
                break;
        }
    }

    // Select a renewal
    selectRenewal(policy) {
        this.selectedRenewal = policy;
        
        // Update UI
        document.querySelectorAll('.renewal-item').forEach(item => item.classList.remove('selected'));
        event?.currentTarget?.classList.add('selected');
        
        // Update details panel
        const detailsPanel = document.getElementById('renewalDetails');
        if (detailsPanel) {
            detailsPanel.innerHTML = this.generateRenewalDetails(policy);
        }
    }

    // Helper methods
    getDaysUntilExpiration(expirationDate) {
        const exp = new Date(expirationDate);
        const now = new Date();
        const diffTime = exp - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getUrgencyClass(days) {
        if (days <= 30) return 'expiration-urgent';
        if (days <= 60) return 'expiration-warning';
        return 'expiration-normal';
    }

    getPolicyTypeDisplay(type) {
        const typeMap = {
            'commercial-auto': 'Commercial Auto',
            'personal-auto': 'Personal Auto',
            'homeowners': 'Homeowners',
            'commercial-property': 'Commercial Property',
            'general-liability': 'General Liability',
            'professional-liability': 'Professional Liability',
            'workers-comp': 'Workers Comp',
            'umbrella': 'Umbrella',
            'life': 'Life',
            'health': 'Health'
        };
        return typeMap[type] || type || 'Unknown';
    }

    getExpiringThisMonth(policies) {
        const now = new Date();
        const thirtyDays = new Date(now);
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        
        return policies.filter(p => {
            const exp = new Date(p.expirationDate);
            return exp >= now && exp <= thirtyDays;
        }).length;
    }

    getExpiringInDays(policies, days) {
        const now = new Date();
        const future = new Date(now);
        future.setDate(future.getDate() + days);
        
        return policies.filter(p => {
            const exp = new Date(p.expirationDate);
            return exp >= now && exp <= future;
        }).length;
    }

    getExpiringPremium(policies, days) {
        const now = new Date();
        const future = new Date(now);
        future.setDate(future.getDate() + days);
        
        return policies.filter(p => {
            const exp = new Date(p.expirationDate);
            return exp >= now && exp <= future;
        }).reduce((sum, p) => sum + (p.premium || 0), 0);
    }

    getRenewedYTD() {
        // This would track actual renewals - returning demo value
        return 234;
    }

    getRenewalRevenue() {
        // This would calculate actual renewal revenue - returning demo value
        return 1250000;
    }

    getRenewalTasks(policyId) {
        // Get tasks from localStorage or return defaults
        if (!this.renewalTasks[policyId]) {
            return null; // Will use default tasks
        }
        return this.renewalTasks[policyId];
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-sync-alt"></i>
                <h3>Select a Renewal</h3>
                <p>Choose a policy from the list to view renewal details</p>
            </div>
        `;
    }

    // Action methods
    updateTaskStatus(taskId, checked) {
        console.log(`Task ${taskId} status updated to ${checked ? 'done' : 'pending'}`);
        // Update task status in storage
    }

    addTask() {
        console.log('Adding new task');
        // Show task creation modal
    }

    saveTaskProgress() {
        console.log('Saving task progress');
        // Save all task updates
    }

    addSubmission() {
        console.log('Adding new submission');
        // Show submission creation modal
    }

    viewQuote(carrier) {
        console.log(`Viewing quote from ${carrier}`);
        // Show quote details
    }

    selectQuote(carrier) {
        console.log(`Selecting quote from ${carrier}`);
        // Mark quote as selected
    }

    editRenewal() {
        console.log('Editing renewal');
        // Show edit modal
    }

    startRenewal() {
        console.log('Starting renewal process');
        // Initialize renewal workflow
    }

    viewFullPolicy() {
        console.log('Viewing full policy');
        // Navigate to policy view
    }

    contactClient() {
        console.log('Contacting client');
        // Open communication modal
    }

    exportRenewals() {
        console.log('Exporting renewals');
        // Export to CSV/PDF
    }

    createRenewalCampaign() {
        console.log('Creating renewal campaign');
        // Open campaign creation modal
    }

    searchRenewals(query) {
        console.log(`Searching for: ${query}`);
        // Filter renewals list
    }
}

// Initialize renewals manager
const renewalsManager = new RenewalsManager();

// Export for use in other modules
window.renewalsManager = renewalsManager;