// Integrations Management System

// Available integrations marketplace
const integrationMarketplace = [
    // Dialer & Communication
    {
        id: 'vicidial',
        name: 'ViciBox/Vicidial',
        category: 'Dialer & Communication',
        description: 'Open-source contact center suite with predictive dialing, IVR, and call recording',
        features: ['Predictive Dialing', 'Call Recording', 'Real-time Reporting', 'CRM Integration'],
        icon: '📞',
        setupTime: '30 minutes',
        apiType: 'REST API'
    },
    
    // Forms & Documents
    {
        id: 'acord',
        name: 'ACORD Forms',
        category: 'Forms & Documents',
        description: 'Industry-standard insurance forms with auto-fill capabilities',
        features: ['125+ ACORD Forms', 'Auto-fill from CRM', 'E-signature Ready', 'PDF Generation'],
        icon: '📋',
        setupTime: '10 minutes',
        apiType: 'XML/PDF API'
    },
    
    // Carriers
    {
        id: 'progressive',
        name: 'Progressive',
        category: 'Carriers',
        description: 'Direct carrier integration for quotes and policy management',
        features: ['Real-time Quotes', 'Policy Issuance', 'Claims Status', 'Commission Tracking'],
        icon: '🏢',
        setupTime: '15 minutes',
        apiType: 'REST API'
    },
    {
        id: 'statefarm',
        name: 'State Farm',
        category: 'Carriers',
        description: 'State Farm agent portal integration',
        features: ['Quote Comparison', 'Policy Management', 'Claims Processing', 'Agent Resources'],
        icon: '🏢',
        setupTime: '15 minutes',
        apiType: 'SOAP API'
    },
    {
        id: 'geico',
        name: 'GEICO',
        category: 'Carriers',
        description: 'GEICO partnership integration for referrals and quotes',
        features: ['Quote Engine', 'Referral Tracking', 'Commission Reports', 'Marketing Materials'],
        icon: '🦎',
        setupTime: '20 minutes',
        apiType: 'REST API'
    },
    
    // CRM & Sales
    {
        id: 'salesforce',
        name: 'Salesforce CRM',
        category: 'CRM & Sales',
        description: 'Complete customer relationship management integration',
        features: ['Contact Sync', 'Opportunity Tracking', 'Task Management', 'Custom Fields'],
        icon: '☁️',
        setupTime: '45 minutes',
        apiType: 'REST API'
    },
    {
        id: 'hubspot',
        name: 'HubSpot',
        category: 'CRM & Sales',
        description: 'Marketing, sales, and service hub integration',
        features: ['Lead Scoring', 'Email Tracking', 'Pipeline Management', 'Marketing Automation'],
        icon: '🧲',
        setupTime: '30 minutes',
        apiType: 'REST API'
    },
    
    // Accounting
    {
        id: 'quickbooks',
        name: 'QuickBooks',
        category: 'Accounting',
        description: 'Automated bookkeeping and commission tracking',
        features: ['Invoice Generation', 'Commission Tracking', 'P&L Reports', 'Tax Preparation'],
        icon: '💰',
        setupTime: '30 minutes',
        apiType: 'REST API'
    },
    {
        id: 'xero',
        name: 'Xero',
        category: 'Accounting',
        description: 'Cloud-based accounting software integration',
        features: ['Bank Reconciliation', 'Expense Tracking', 'Financial Reports', 'Multi-currency'],
        icon: '📊',
        setupTime: '25 minutes',
        apiType: 'OAuth 2.0'
    },
    
    // E-Signature
    {
        id: 'docusign',
        name: 'DocuSign',
        category: 'E-Signature',
        description: 'Electronic signature and document workflow',
        features: ['E-signatures', 'Document Templates', 'Workflow Automation', 'Audit Trail'],
        icon: '✍️',
        setupTime: '15 minutes',
        apiType: 'REST API'
    },
    {
        id: 'hellosign',
        name: 'HelloSign (Dropbox Sign)',
        category: 'E-Signature',
        description: 'Simple e-signature solution with Dropbox integration',
        features: ['Unlimited Signatures', 'Template Library', 'Team Management', 'API Access'],
        icon: '📝',
        setupTime: '10 minutes',
        apiType: 'REST API'
    },
    
    // Marketing
    {
        id: 'mailchimp',
        name: 'Mailchimp',
        category: 'Marketing',
        description: 'Email marketing and automation platform',
        features: ['Email Campaigns', 'Automation', 'Segmentation', 'Analytics'],
        icon: '📧',
        setupTime: '20 minutes',
        apiType: 'REST API'
    },
    {
        id: 'constantcontact',
        name: 'Constant Contact',
        category: 'Marketing',
        description: 'Email marketing for insurance agencies',
        features: ['Newsletter Templates', 'Event Management', 'Social Campaigns', 'Surveys'],
        icon: '📮',
        setupTime: '15 minutes',
        apiType: 'REST API'
    },
    
    // Comparative Rating
    {
        id: 'ezlynx',
        name: 'EZLynx',
        category: 'Comparative Rating',
        description: 'Multi-carrier comparative rating platform',
        features: ['150+ Carriers', 'Real-time Rates', 'Application Submission', 'Download Integration'],
        icon: '⚡',
        setupTime: '1 hour',
        apiType: 'REST API'
    },
    {
        id: 'turborater',
        name: 'TurboRater',
        category: 'Comparative Rating',
        description: 'Comparative rating engine from ITC',
        features: ['Multi-line Rating', 'Carrier Forms', 'Quote Proposals', 'Mobile Access'],
        icon: '🚀',
        setupTime: '45 minutes',
        apiType: 'Web Services'
    },
    
    // Agency Management
    {
        id: 'ams360',
        name: 'AMS360',
        category: 'Agency Management',
        description: 'Vertafore agency management system integration',
        features: ['Policy Management', 'Claims Processing', 'Accounting', 'Document Management'],
        icon: '🏛️',
        setupTime: '2 hours',
        apiType: 'SOAP API'
    },
    {
        id: 'applied_epic',
        name: 'Applied Epic',
        category: 'Agency Management',
        description: 'Applied Systems agency management platform',
        features: ['Workflow Automation', 'E-signature', 'Mobile Access', 'Analytics'],
        icon: '💼',
        setupTime: '2 hours',
        apiType: 'REST API'
    },
    
    // Communication
    {
        id: 'twilio',
        name: 'Twilio',
        category: 'Communication',
        description: 'SMS and voice communication platform',
        features: ['SMS Messaging', 'Voice Calls', 'Auto-reminders', 'Two-way Messaging'],
        icon: '💬',
        setupTime: '30 minutes',
        apiType: 'REST API'
    },
    {
        id: 'ringcentral',
        name: 'RingCentral',
        category: 'Communication',
        description: 'Cloud-based phone system and video conferencing',
        features: ['VoIP Calling', 'Video Meetings', 'Team Messaging', 'Call Analytics'],
        icon: '☎️',
        setupTime: '45 minutes',
        apiType: 'REST API'
    },
    
    // Data & Analytics
    {
        id: 'google_analytics',
        name: 'Google Analytics',
        category: 'Data & Analytics',
        description: 'Website and marketing analytics',
        features: ['Traffic Analysis', 'Conversion Tracking', 'Custom Reports', 'Goal Tracking'],
        icon: '📈',
        setupTime: '15 minutes',
        apiType: 'REST API'
    },
    {
        id: 'microsoft_bi',
        name: 'Power BI',
        category: 'Data & Analytics',
        description: 'Business intelligence and data visualization',
        features: ['Custom Dashboards', 'Real-time Data', 'Predictive Analytics', 'Mobile Reports'],
        icon: '📊',
        setupTime: '1 hour',
        apiType: 'REST API'
    }
];

// Load integrations view
function loadIntegrationsViewNew() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Get active integrations from localStorage
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    
    dashboardContent.innerHTML = `
        <div class="integrations-view">
            <header class="content-header">
                <h1>Integrations</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="openIntegrationMarketplace()">
                        <i class="fas fa-plus"></i> Add Integration
                    </button>
                </div>
            </header>
            
            ${activeIntegrations.length === 0 ? `
                <div style="text-align: center; padding: 3rem; background: #f9f9f9; border-radius: 8px; margin: 2rem 0;">
                    <i class="fas fa-plug" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No Active Integrations</h3>
                    <p style="color: #666; margin: 1rem 0;">Connect your favorite tools to streamline your workflow</p>
                    <button class="btn-primary" onclick="openIntegrationMarketplace()">
                        <i class="fas fa-plus"></i> Browse Integrations
                    </button>
                </div>
            ` : `
                <div class="integrations-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
                    ${activeIntegrations.map(integration => {
                        const details = integrationMarketplace.find(i => i.id === integration.id) || {};
                        return `
                        <div class="integration-card" data-integration-id="${integration.id}">
                            <div class="integration-header">
                                <div style="font-size: 2rem;">${details.icon || '🔌'}</div>
                                <div style="flex: 1; margin-left: 1rem;">
                                    <h3>${details.name}</h3>
                                    <span class="status-badge ${integration.status === 'connected' ? 'active' : 'inactive'}">
                                        ${integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                <button class="btn-icon" onclick="removeIntegration('${integration.id}')" title="Remove Integration" style="color: #ff4444;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="integration-info">
                                <p>${details.description}</p>
                                <div class="info-row">
                                    <span>Connected:</span>
                                    <strong>${integration.connectedDate || 'Today'}</strong>
                                </div>
                                <div class="info-row">
                                    <span>Last Sync:</span>
                                    <strong>${integration.lastSync || 'Just now'}</strong>
                                </div>
                                ${integration.stats ? `
                                <div class="info-row">
                                    <span>${integration.stats.label}:</span>
                                    <strong>${integration.stats.value}</strong>
                                </div>
                                ` : ''}
                            </div>
                            <div class="integration-actions">
                                <button class="btn-secondary" onclick="testIntegration('${integration.id}')">
                                    <i class="fas fa-plug"></i> Test
                                </button>
                                <button class="btn-secondary" onclick="configureIntegration('${integration.id}')">
                                    <i class="fas fa-cog"></i> Configure
                                </button>
                                ${integration.status === 'connected' ? `
                                    <button class="btn-secondary" onclick="disconnectIntegration('${integration.id}')">
                                        <i class="fas fa-unlink"></i> Disconnect
                                    </button>
                                ` : `
                                    <button class="btn-primary" onclick="reconnectIntegration('${integration.id}')">
                                        <i class="fas fa-link"></i> Connect
                                    </button>
                                `}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;
}

// Export the marketplace data and new view function
window.integrationMarketplace = integrationMarketplace;
window.loadIntegrationsViewNew = loadIntegrationsViewNew;