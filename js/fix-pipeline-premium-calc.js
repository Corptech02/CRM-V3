// Fix Pipeline Premium Calculation - Removes extra 0 from premium display
console.log('Fixing pipeline premium calculation...');

// Override the loadLeadsView function to fix premium calculation
const originalLoadLeadsView = window.loadLeadsView;

window.loadLeadsView = function() {
    console.log('Enhanced loadLeadsView with fixed premium calculation');

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        return;
    }

    // Update dashboard stats with real data after view loads
    setTimeout(() => {
        if (window.DashboardStats) {
            const stats = new window.DashboardStats();
            stats.updateDashboard();
        }
    }, 500);

    try {
        // Run deduplication first to clean up any duplicates
        if (window.deduplicateData) {
            console.log('Running deduplication before loading leads...');
            window.deduplicateData();
        }

        // Get leads from localStorage with sample data
        let allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Filter out archived leads - they should not appear in the active leads view
        let leads = allLeads.filter(lead => !lead.archived);

        // Only generate sample data if there are truly no leads at all (not just all archived)
        if (allLeads.length === 0) {
            // Generate sample leads with renewal dates and new stages
            leads = [
                { id: 1, name: 'Robert Thompson', phone: '(555) 234-5678', email: 'robert.t@email.com', product: 'Commercial Auto', stage: 'quoted', assignedTo: 'John Smith', created: '12/26/2024', renewalDate: '01/26/2025', premium: 5200, quotes: [] },
                { id: 2, name: 'Jennifer Martinez', phone: '(555) 345-6789', email: 'j.martinez@email.com', product: 'Home + Auto', stage: 'interested', assignedTo: 'Sarah Johnson', created: '12/25/2024', renewalDate: '02/15/2025', premium: 3800, quotes: [] },
                { id: 3, name: 'Transport Solutions LLC', phone: '(555) 456-7890', email: 'info@transportsol.com', product: 'Commercial Fleet', stage: 'quote-sent-aware', assignedTo: 'Mike Wilson', created: '12/24/2024', renewalDate: '03/01/2025', premium: 12500, quotes: [] },
                { id: 4, name: 'Michael Chen', phone: '(555) 567-8901', email: 'm.chen@email.com', product: 'Life Insurance', stage: 'new', assignedTo: 'Lisa Anderson', created: '12/28/2024', renewalDate: '01/28/2025', premium: 2200, quotes: [] },
                { id: 5, name: 'Davis Construction', phone: '(555) 678-9012', email: 'admin@davisconst.com', product: 'Commercial Property', stage: 'quote-sent-unaware', assignedTo: 'John Smith', created: '12/22/2024', renewalDate: '04/10/2025', premium: 8900, quotes: [] },
                { id: 6, name: 'ABC Corp', phone: '(555) 111-2222', email: 'contact@abccorp.com', product: 'Commercial Auto', stage: 'not-interested', assignedTo: 'Sarah Johnson', created: '12/20/2024', renewalDate: '02/01/2025', premium: 4500, quotes: [] },
                { id: 7, name: 'Tech Startup Inc', phone: '(555) 333-4444', email: 'info@techstartup.com', product: 'Commercial Property', stage: 'closed', assignedTo: 'Mike Wilson', created: '12/15/2024', renewalDate: '01/15/2025', premium: 6700, quotes: [] },
            ];
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
        }

        // Fix premium values to ensure they're clean numbers
        leads = leads.map(lead => {
            let premium = lead.premium;

            // Handle various premium formats including concatenated values
            if (premium === undefined || premium === null || premium === '') {
                lead.premium = 0;
            } else if (typeof premium === 'string') {
                // Check if this looks like concatenated values (e.g., "6000012,63100")
                if (premium.match(/^\$?\d{5,}/)) {
                    // This might be concatenated - try to extract meaningful value
                    // Remove $ and spaces
                    let cleanStr = premium.replace(/[\$\s]/g, '');

                    // Check for pattern like "6000012,631" which should be "60000" and "12,631"
                    if (cleanStr.match(/^\d{5,}\d{2},\d{3}/)) {
                        // Extract first 5 digits as the likely real premium
                        lead.premium = parseFloat(cleanStr.substring(0, 5)) || 0;
                    } else {
                        // Standard cleaning - remove commas
                        cleanStr = cleanStr.replace(/,/g, '');
                        lead.premium = parseFloat(cleanStr) || 0;
                    }
                } else {
                    // Standard format with possible $ and commas
                    const cleanStr = premium.replace(/[\$,]/g, '');
                    lead.premium = parseFloat(cleanStr) || 0;
                }

                // Sanity check - premiums shouldn't be in millions
                if (lead.premium > 1000000) {
                    // Likely concatenated, try to extract first reasonable number
                    const strPremium = String(lead.premium);
                    if (strPremium.length > 6) {
                        lead.premium = parseFloat(strPremium.substring(0, 5)) || 0;
                    }
                }
            } else if (typeof premium === 'number') {
                // Check if number looks concatenated
                if (premium > 1000000) {
                    // Try to extract first 5 digits
                    const strPremium = String(premium);
                    lead.premium = parseFloat(strPremium.substring(0, 5)) || 0;
                } else {
                    lead.premium = isNaN(premium) ? 0 : premium;
                }
            } else {
                lead.premium = 0;
            }

            // Ensure we have a valid number
            lead.premium = Math.max(0, lead.premium);

            return lead;
        });

        const totalLeads = leads.length;
        const newLeads = leads.filter(l => l.stage === 'new').length;
        const quotedLeads = leads.filter(l => l.stage === 'quoted').length;
        const quoteSentUnaware = leads.filter(l => l.stage === 'quote-sent-unaware').length;
        const quoteSentAware = leads.filter(l => l.stage === 'quote-sent-aware').length;
        const interestedLeads = leads.filter(l => l.stage === 'interested').length;
        const notInterestedLeads = leads.filter(l => l.stage === 'not-interested').length;
        const closedLeads = leads.filter(l => l.stage === 'closed').length;

        // Get all policies to check win/loss status
        const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

        // Function to generate lead rows with colored premiums
        const generateLeadRowsWithColors = (leads, policies) => {
            if (!leads || leads.length === 0) {
                return '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
            }

            return leads.map(lead => {
                // Find all policies for this lead
                const leadPolicies = policies.filter(policy => {
                    // Match by lead ID
                    if (policy.leadId && String(policy.leadId) === String(lead.id)) {
                        return true;
                    }
                    // Match by insured name
                    const insuredName = policy.insured?.['Name/Business Name'] ||
                                       policy.insured?.['Primary Named Insured'] ||
                                       policy.insuredName;
                    if (insuredName && lead.name && insuredName.toLowerCase() === lead.name.toLowerCase()) {
                        return true;
                    }
                    return false;
                });

                // Calculate total premium from policies
                let totalPremium = 0;
                let hasWin = false;
                let hasLoss = false;

                // FIRST CHECK: Check the lead's own win_loss field (from Lead Details)
                if (lead.win_loss === 'win' || lead.winLoss === 'win') {
                    hasWin = true;
                } else if (lead.win_loss === 'loss' || lead.winLoss === 'loss') {
                    hasLoss = true;
                }

                leadPolicies.forEach(policy => {
                    // Get premium value
                    let premiumValue = 0;
                    if (policy.financial) {
                        premiumValue = policy.financial['Annual Premium'] ||
                                      policy.financial['Premium'] ||
                                      policy.financial.annualPremium ||
                                      policy.financial.premium || 0;
                    }
                    if (!premiumValue) {
                        premiumValue = policy['Annual Premium'] ||
                                      policy.Premium ||
                                      policy.premium ||
                                      policy.annualPremium || 0;
                    }

                    // Convert to number
                    const numericPremium = typeof premiumValue === 'string' ?
                        parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
                        parseFloat(premiumValue) || 0;

                    totalPremium += numericPremium;

                    // Check win/loss status from policies too
                    if (policy.winLoss === 'win') hasWin = true;
                    if (policy.winLoss === 'loss') hasLoss = true;
                });

                // Determine win/loss status and color
                let winLossStatus = 'pending';
                if (hasWin && !hasLoss) winLossStatus = 'win';
                else if (hasLoss && !hasWin) winLossStatus = 'loss';
                else if (hasWin && hasLoss) winLossStatus = 'mixed';

                const statusColor = winLossStatus === 'win' ? '#10b981' :
                                  winLossStatus === 'loss' ? '#ef4444' :
                                  winLossStatus === 'mixed' ? '#f59e0b' :
                                  'inherit';

                // Debug logging
                console.log(\`Lead \${lead.name}: win_loss field = \${lead.win_loss || lead.winLoss}, \${leadPolicies.length} policies, final status: \${winLossStatus}, color: \${statusColor}, premium: \${totalPremium || lead.premium || 0}\`);

                // Use policy premium if available, otherwise use lead's stored premium
                let displayPremium = totalPremium > 0 ? totalPremium : (lead.premium || 0);

                // Ensure premium is a number
                if (typeof displayPremium === 'string') {
                    displayPremium = parseFloat(displayPremium.replace(/[$,]/g, '')) || 0;
                }

                // Truncate name
                const displayName = lead.name && lead.name.length > 15 ?
                    lead.name.substring(0, 15) + '...' : lead.name || '';

                return \`
                    <tr>
                        <td>
                            <input type="checkbox" class="lead-checkbox" value="\${lead.id}" data-lead='\${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                        </td>
                        <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline;" onclick="viewLead(\${lead.id})" title="\${lead.name}">\${displayName}</strong>
                        </td>
                        <td>
                            <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                                <a href="tel:\${lead.phone}" title="\${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                    <i class="fas fa-phone"></i>
                                </a>
                                <a href="mailto:\${lead.email}" title="\${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                    <i class="fas fa-envelope"></i>
                                </a>
                            </div>
                        </td>
                        <td>\${lead.product || ''}</td>
                        <td style="font-weight: 600; color: \${statusColor};">
                            $\${displayPremium.toLocaleString()}
                        </td>
                        <td>\${window.getStageHtml ? window.getStageHtml(lead.stage) : lead.stage || ''}</td>
                        <td>\${lead.renewalDate || 'N/A'}</td>
                        <td>\${lead.assignedTo || 'Unassigned'}</td>
                        <td>\${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick="viewLead('\${lead.id}')" title="View Lead"><i class="fas fa-eye"></i></button>
                                <button class="btn-icon" onclick="archiveLead('\${lead.id}')" title="Archive Lead" style="color: #f59e0b;"><i class="fas fa-archive"></i></button>
                                <button class="btn-icon" onclick="convertLead('\${lead.id}')" title="Convert to Client"><i class="fas fa-user-check"></i></button>
                            </div>
                        </td>
                    </tr>
                \`;
            }).join('');
        };

        // Helper function to calculate stage premium with proper number conversion and win/loss status
        const calculateStagePremiumWithStatus = (stageFilter) => {
            const stageLeads = leads.filter(stageFilter);
            let totalPremium = 0;
            let hasWin = false;
            let hasLoss = false;

            stageLeads.forEach(lead => {
                // Calculate premium - use global parsePremium if available
                let premium = 0;

                if (window.parsePremium) {
                    // Use the global premium parser which handles all edge cases
                    premium = window.parsePremium(lead.premium);
                } else {
                    // Fallback to simple parsing
                    if (lead.premium !== undefined && lead.premium !== null && lead.premium !== '') {
                        if (typeof lead.premium === 'string') {
                            const cleanStr = lead.premium.replace(/[$,]/g, '');
                            premium = parseFloat(cleanStr) || 0;
                        } else if (typeof lead.premium === 'number') {
                            premium = isNaN(lead.premium) ? 0 : lead.premium;
                        }
                    }
                }

                // Ensure we have a valid positive number
                premium = Math.max(0, premium);
                totalPremium += premium;

                // Check lead's own win_loss field FIRST
                if (lead.win_loss === 'win' || lead.winLoss === 'win') {
                    hasWin = true;
                } else if (lead.win_loss === 'loss' || lead.winLoss === 'loss') {
                    hasLoss = true;
                }

                // Also check win/loss status from policies
                const leadPolicies = allPolicies.filter(policy => {
                    if (policy.leadId && String(policy.leadId) === String(lead.id)) {
                        return true;
                    }
                    const insuredName = policy.insured?.['Name/Business Name'] ||
                                       policy.insured?.['Primary Named Insured'] ||
                                       policy.insuredName;
                    if (insuredName && lead.name &&
                        insuredName.toLowerCase() === lead.name.toLowerCase()) {
                        return true;
                    }
                    return false;
                });

                // Check win/loss status from policies
                leadPolicies.forEach(policy => {
                    if (policy.winLoss === 'win') hasWin = true;
                    if (policy.winLoss === 'loss') hasLoss = true;
                });
            });

            // Determine color based on win/loss status
            let color = 'inherit'; // default
            if (hasWin && !hasLoss) color = '#10b981'; // green for win
            else if (hasLoss && !hasWin) color = '#ef4444'; // red for loss
            else if (hasWin && hasLoss) color = '#f59e0b'; // orange for mixed

            return { premium: totalPremium, color: color };
        };

        // Build HTML step by step with fixed premium calculations
        let html = `
        <div class="leads-view">
            <header class="content-header">
                <h1>Lead Management</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="syncVicidialLeads()" style="background: #10b981; border-color: #10b981;">
                        <i class="fas fa-sync"></i> Sync Vicidial Now
                    </button>
                    <button class="btn-secondary" onclick="importLeads()">
                        <i class="fas fa-upload"></i> Import Leads
                    </button>
                    <button class="btn-secondary" onclick="exportLeads()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-secondary" onclick="sendLeadsToBlast()">
                        <i class="fas fa-envelope"></i> Send to Blast
                    </button>
                    <button class="btn-primary" onclick="showNewLead()">
                        <i class="fas fa-plus"></i> New Lead
                    </button>
                </div>
            </header>

            <!-- Lead Pipeline -->
            <div class="lead-pipeline">
                <div class="pipeline-stage" data-stage="new">
                    <div class="stage-header">
                        <h3>New</h3>
                        <span class="stage-count">${newLeads}</span>
                    </div>
                    <div class="stage-value" style="color: ${calculateStagePremiumWithStatus(l => l.stage === "new").color}; font-weight: 600;">
                        $${calculateStagePremiumWithStatus(l => l.stage === "new").premium.toLocaleString()}
                    </div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (newLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="quoted">
                    <div class="stage-header">
                        <h3>Quoted</h3>
                        <span class="stage-count">${quotedLeads}</span>
                    </div>
                    <div class="stage-value" style="color: ${calculateStagePremiumWithStatus(l => l.stage === "quoted").color}; font-weight: 600;">
                        $${calculateStagePremiumWithStatus(l => l.stage === "quoted").premium.toLocaleString()}
                    </div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (quotedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="quote-sent">
                    <div class="stage-header">
                        <h3>Quote Sent</h3>
                        <span class="stage-count">${quoteSentUnaware + quoteSentAware}</span>
                    </div>
                    <div class="stage-value" style="color: ${calculateStagePremiumWithStatus(l => l.stage === "quote-sent-unaware" || l.stage === "quote-sent-aware").color}; font-weight: 600;">
                        $${calculateStagePremiumWithStatus(l => l.stage === "quote-sent-unaware" || l.stage === "quote-sent-aware").premium.toLocaleString()}
                    </div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? ((quoteSentUnaware + quoteSentAware)/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="interested">
                    <div class="stage-header">
                        <h3>Interested</h3>
                        <span class="stage-count">${interestedLeads}</span>
                    </div>
                    <div class="stage-value" style="color: ${calculateStagePremiumWithStatus(l => l.stage === "interested").color}; font-weight: 600;">
                        $${calculateStagePremiumWithStatus(l => l.stage === "interested").premium.toLocaleString()}
                    </div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (interestedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="closed">
                    <div class="stage-header success">
                        <h3>Closed</h3>
                        <span class="stage-count">${closedLeads}</span>
                    </div>
                    <div class="stage-value" style="color: ${calculateStagePremiumWithStatus(l => l.stage === "closed").color}; font-weight: 600;">
                        $${calculateStagePremiumWithStatus(l => l.stage === "closed").premium.toLocaleString()}
                    </div>
                    <div class="stage-bar success" style="width: ${totalLeads > 0 ? (closedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"></div>
                </div>
            </div>

            <!-- Lead Stats -->
            <div class="lead-stats">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Total Leads</h4>
                        <p class="stat-number">${totalLeads}</p>
                        <span class="stat-trend positive">+12% this month</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Conversion Rate</h4>
                        <p class="stat-number">${totalLeads > 0 ? Math.round((closedLeads/totalLeads)*100) : 0}%</p>
                        <span class="stat-trend positive">+3% from last month</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Avg. Response Time</h4>
                        <p class="stat-number">2.3 hrs</p>
                        <span class="stat-trend positive">-15 min improvement</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Pipeline Value</h4>
                        <p class="stat-number">$${leads.reduce((sum, lead) => {
                            let premium = lead.premium;

                            // Handle various premium formats including concatenated values
                            if (premium === undefined || premium === null || premium === '') {
                                premium = 0;
                            } else if (typeof premium === 'string') {
                                // Check if this looks like concatenated values (e.g., "6000012,63100")
                                if (premium.match(/^\$?\d{5,}/)) {
                                    // This might be concatenated - try to extract meaningful value
                                    // Remove $ and spaces
                                    let cleanStr = premium.replace(/[\$\s]/g, '');

                                    // Check for pattern like "6000012,631" which should be "60000" and "12,631"
                                    if (cleanStr.match(/^\d{5,}\d{2},\d{3}/)) {
                                        // Extract first 5 digits as the likely real premium
                                        premium = parseFloat(cleanStr.substring(0, 5)) || 0;
                                    } else {
                                        // Standard cleaning - remove commas
                                        cleanStr = cleanStr.replace(/,/g, '');
                                        premium = parseFloat(cleanStr) || 0;
                                    }
                                } else {
                                    // Standard format with possible $ and commas
                                    const cleanStr = premium.replace(/[\$,]/g, '');
                                    premium = parseFloat(cleanStr) || 0;
                                }

                                // Sanity check - premiums shouldn't be in millions
                                if (premium > 1000000) {
                                    // Likely concatenated, try to extract first reasonable number
                                    const strPremium = String(premium);
                                    if (strPremium.length > 6) {
                                        premium = parseFloat(strPremium.substring(0, 5)) || 0;
                                    }
                                }
                            } else if (typeof premium === 'number') {
                                // Check if number looks concatenated
                                if (premium > 1000000) {
                                    // Try to extract first 5 digits
                                    const strPremium = String(premium);
                                    premium = parseFloat(strPremium.substring(0, 5)) || 0;
                                } else {
                                    premium = isNaN(premium) ? 0 : premium;
                                }
                            } else {
                                premium = 0;
                            }

                            // Ensure we have a valid number
                            premium = Math.max(0, premium);
                            return sum + premium;
                        }, 0).toLocaleString()}</p>
                        <span class="stat-trend positive">+18% growth</span>
                    </div>
                </div>
            </div>

            <!-- Leads Table -->
            <div class="table-container">
                <table class="data-table" id="leadsTable">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" id="selectAllLeads" onclick="toggleAllLeads(this)">
                            </th>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Product Interest</th>
                            <th class="sortable" onclick="sortLeads('premium')" data-sort="premium">
                                Premium
                                <span class="sort-arrow" id="sort-premium">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('stage')" data-sort="stage">
                                Stage
                                <span class="sort-arrow" id="sort-stage">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('renewalDate')" data-sort="renewalDate">
                                Renewal Date
                                <span class="sort-arrow" id="sort-renewalDate">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('assignedTo')" data-sort="assignedTo">
                                Assigned To
                                <span class="sort-arrow" id="sort-assignedTo">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('created')" data-sort="created">
                                Created
                                <span class="sort-arrow" id="sort-created">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                        ${generateLeadRowsWithColors(leads, allPolicies)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

        // Set the HTML
        dashboardContent.innerHTML = html;

        // Scan for clickable phone numbers and emails with aggressive retry
        const scanLeadsContent = () => {
            if (window.scanForClickableContent) {
                console.log('Scanning Leads Management view for clickable content...');
                window.scanForClickableContent(dashboardContent);

                // Check if any clickable elements were created
                setTimeout(() => {
                    const clickables = dashboardContent.querySelectorAll('.clickable-phone, .clickable-email');
                    console.log(`Found ${clickables.length} clickable elements in Leads view`);

                    // If none found, try again with contact-info divs
                    if (clickables.length === 0) {
                        console.log('No clickable elements found, scanning contact-info divs...');
                        const contactDivs = dashboardContent.querySelectorAll('.contact-info');
                        contactDivs.forEach((div, index) => {
                            console.log(`Processing contact-info ${index}`);
                            window.scanForClickableContent(div);
                        });
                    }
                }, 200);
            }
        };

        // Try multiple times with increasing delays
        setTimeout(scanLeadsContent, 100);
        setTimeout(scanLeadsContent, 300);
        setTimeout(scanLeadsContent, 600);
        setTimeout(scanLeadsContent, 1000);

    } catch (error) {
        console.error('Error in loadLeadsView:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        dashboardContent.innerHTML = `<div class="error-message">Error loading leads view: ${error.message}</div>`;
    }
};

console.log('Pipeline premium calculation fix applied');