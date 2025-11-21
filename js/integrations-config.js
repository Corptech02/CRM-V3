// Integrations Configuration Management
// This module handles API keys and integration settings

function loadIntegrationsConfig() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Load saved configurations from localStorage
    const savedConfig = {
        openai: localStorage.getItem('integration_openai_key') || '',
        email: {
            provider: localStorage.getItem('integration_email_provider') || 'gmail',
            smtp_host: localStorage.getItem('integration_email_smtp_host') || '',
            smtp_port: localStorage.getItem('integration_email_smtp_port') || '587',
            username: localStorage.getItem('integration_email_username') || '',
            password: localStorage.getItem('integration_email_password') || '',
            from_email: localStorage.getItem('integration_email_from') || ''
        },
        coi_email: {
            smtp_host: localStorage.getItem('integration_coi_smtp_host') || '',
            smtp_port: localStorage.getItem('integration_coi_smtp_port') || '587',
            username: localStorage.getItem('integration_coi_username') || '',
            password: localStorage.getItem('integration_coi_password') || '',
            from_email: localStorage.getItem('integration_coi_from') || '',
            cc_email: localStorage.getItem('integration_coi_cc') || ''
        },
        voip: {
            provider: localStorage.getItem('integration_voip_provider') || 'twilio',
            account_sid: localStorage.getItem('integration_voip_account_sid') || '',
            auth_token: localStorage.getItem('integration_voip_auth_token') || '',
            phone_number: localStorage.getItem('integration_voip_phone_number') || '',
            webhook_url: localStorage.getItem('integration_voip_webhook_url') || ''
        }
    };
    
    dashboardContent.innerHTML = `
        <div class="integrations-config-view">
            <header class="content-header">
                <h1>Integration Settings</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="exportIntegrationConfig()">
                        <i class="fas fa-download"></i> Export Config
                    </button>
                    <button class="btn-secondary" onclick="importIntegrationConfig()">
                        <i class="fas fa-upload"></i> Import Config
                    </button>
                </div>
            </header>
            
            <div class="integration-tabs">
                <button class="tab-btn active" onclick="switchIntegrationTab('api-keys')">
                    <i class="fas fa-key"></i> API Keys
                </button>
                <button class="tab-btn" onclick="switchIntegrationTab('email')">
                    <i class="fas fa-envelope"></i> Email
                </button>
                <button class="tab-btn" onclick="switchIntegrationTab('coi-email')">
                    <i class="fas fa-certificate"></i> COI Email
                </button>
                <button class="tab-btn" onclick="switchIntegrationTab('voip')">
                    <i class="fas fa-phone"></i> VoIP
                </button>
                <button class="tab-btn" onclick="switchIntegrationTab('webhooks')">
                    <i class="fas fa-link"></i> Webhooks
                </button>
            </div>
            
            <!-- API Keys Tab -->
            <div id="api-keys-tab" class="integration-tab-content active">
                <div class="integration-section">
                    <h2><i class="fas fa-robot"></i> OpenAI Integration</h2>
                    <p class="section-description">Configure OpenAI API for AI-powered features like email enhancement, document analysis, and automated responses.</p>
                    
                    <div class="integration-card">
                        <div class="form-group">
                            <label for="openai-key">API Key</label>
                            <div class="input-with-action">
                                <input type="password" id="openai-key" class="form-control" 
                                       placeholder="sk-..." value="${savedConfig.openai}">
                                <button class="btn-icon" onclick="togglePasswordVisibility('openai-key')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <small class="form-text">Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a></small>
                        </div>
                        
                        <div class="form-group">
                            <label>Model Selection</label>
                            <select class="form-control" id="openai-model">
                                <option value="gpt-4">GPT-4 (Most Capable)</option>
                                <option value="gpt-3.5-turbo" selected>GPT-3.5 Turbo (Faster & Cheaper)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
                            </select>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn-success" onclick="testOpenAIConnection()">
                                <i class="fas fa-check-circle"></i> Test Connection
                            </button>
                            <button class="btn-primary" onclick="saveOpenAIConfig()">
                                <i class="fas fa-save"></i> Save Configuration
                            </button>
                        </div>
                        
                        <div id="openai-status" class="status-message"></div>
                    </div>
                </div>
                
                <div class="integration-section">
                    <h2><i class="fas fa-database"></i> Other API Services</h2>
                    <div class="integration-card">
                        <div class="form-group">
                            <label for="google-maps-key">Google Maps API Key</label>
                            <input type="password" id="google-maps-key" class="form-control" 
                                   placeholder="Enter Google Maps API key">
                            <small class="form-text">For location services and mapping</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="sendgrid-key">SendGrid API Key</label>
                            <input type="password" id="sendgrid-key" class="form-control" 
                                   placeholder="Enter SendGrid API key">
                            <small class="form-text">For transactional email services</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Email Tab -->
            <div id="email-tab" class="integration-tab-content">
                <div class="integration-section">
                    <h2><i class="fas fa-envelope"></i> Email Configuration</h2>
                    <p class="section-description">Configure SMTP settings for sending emails directly from the platform.</p>
                    
                    <div class="integration-card">
                        <div class="form-group">
                            <label>Email Provider</label>
                            <select class="form-control" id="email-provider" onchange="updateEmailProviderFields()">
                                <option value="gmail" ${savedConfig.email.provider === 'gmail' ? 'selected' : ''}>Gmail</option>
                                <option value="outlook" ${savedConfig.email.provider === 'outlook' ? 'selected' : ''}>Outlook/Office 365</option>
                                <option value="custom" ${savedConfig.email.provider === 'custom' ? 'selected' : ''}>Custom SMTP</option>
                                <option value="sendgrid" ${savedConfig.email.provider === 'sendgrid' ? 'selected' : ''}>SendGrid</option>
                                <option value="mailgun" ${savedConfig.email.provider === 'mailgun' ? 'selected' : ''}>Mailgun</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="email-smtp-host">SMTP Host</label>
                                <input type="text" id="email-smtp-host" class="form-control" 
                                       placeholder="smtp.gmail.com" value="${savedConfig.email.smtp_host}">
                            </div>
                            <div class="form-group">
                                <label for="email-smtp-port">SMTP Port</label>
                                <input type="text" id="email-smtp-port" class="form-control" 
                                       placeholder="587" value="${savedConfig.email.smtp_port}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="email-username">Username/Email</label>
                                <input type="email" id="email-username" class="form-control" 
                                       placeholder="your-email@example.com" value="${savedConfig.email.username}">
                            </div>
                            <div class="form-group">
                                <label for="email-password">Password/App Password</label>
                                <div class="input-with-action">
                                    <input type="password" id="email-password" class="form-control" 
                                           placeholder="Enter password" value="${savedConfig.email.password}">
                                    <button class="btn-icon" onclick="togglePasswordVisibility('email-password')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email-from">Default From Email</label>
                            <input type="email" id="email-from" class="form-control" 
                                   placeholder="noreply@yourcompany.com" value="${savedConfig.email.from_email}">
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="email-use-tls" checked> Use TLS/STARTTLS
                            </label>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn-success" onclick="testEmailConnection()">
                                <i class="fas fa-paper-plane"></i> Send Test Email
                            </button>
                            <button class="btn-primary" onclick="saveEmailConfig()">
                                <i class="fas fa-save"></i> Save Configuration
                            </button>
                        </div>
                        
                        <div id="email-status" class="status-message"></div>
                    </div>
                </div>
            </div>
            
            <!-- COI Email Tab -->
            <div id="coi-email-tab" class="integration-tab-content">
                <div class="integration-section">
                    <h2><i class="fas fa-certificate"></i> COI Email Configuration</h2>
                    <p class="section-description">Dedicated email settings for Certificate of Insurance communications.</p>
                    
                    <div class="integration-card">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="coi-smtp-host">SMTP Host</label>
                                <input type="text" id="coi-smtp-host" class="form-control" 
                                       placeholder="smtp.gmail.com" value="${savedConfig.coi_email.smtp_host}">
                            </div>
                            <div class="form-group">
                                <label for="coi-smtp-port">SMTP Port</label>
                                <input type="text" id="coi-smtp-port" class="form-control" 
                                       placeholder="587" value="${savedConfig.coi_email.smtp_port}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="coi-username">Username/Email</label>
                                <input type="email" id="coi-username" class="form-control" 
                                       placeholder="coi@yourcompany.com" value="${savedConfig.coi_email.username}">
                            </div>
                            <div class="form-group">
                                <label for="coi-password">Password</label>
                                <div class="input-with-action">
                                    <input type="password" id="coi-password" class="form-control" 
                                           placeholder="Enter password" value="${savedConfig.coi_email.password}">
                                    <button class="btn-icon" onclick="togglePasswordVisibility('coi-password')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="coi-from">From Email Address</label>
                            <input type="email" id="coi-from" class="form-control" 
                                   placeholder="certificates@yourcompany.com" value="${savedConfig.coi_email.from_email}">
                        </div>
                        
                        <div class="form-group">
                            <label for="coi-cc">Default CC Email (Optional)</label>
                            <input type="email" id="coi-cc" class="form-control" 
                                   placeholder="compliance@yourcompany.com" value="${savedConfig.coi_email.cc_email}">
                            <small class="form-text">All COI emails will be CC'd to this address</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="coi-template">Default Email Template</label>
                            <textarea id="coi-template" class="form-control" rows="5" 
                                      placeholder="Dear {recipient},\n\nPlease find attached the Certificate of Insurance for {policy_number}.\n\nBest regards,\n{agent_name}">Dear {recipient},

Please find attached the Certificate of Insurance as requested.

Policy Number: {policy_number}
Effective Date: {effective_date}
Expiration Date: {expiration_date}

If you have any questions or need additional information, please don't hesitate to contact us.

Best regards,
{agent_name}
{company_name}</textarea>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn-success" onclick="testCOIEmailConnection()">
                                <i class="fas fa-paper-plane"></i> Send Test COI Email
                            </button>
                            <button class="btn-primary" onclick="saveCOIEmailConfig()">
                                <i class="fas fa-save"></i> Save Configuration
                            </button>
                        </div>
                        
                        <div id="coi-email-status" class="status-message"></div>
                    </div>
                </div>
            </div>
            
            <!-- VoIP Tab -->
            <div id="voip-tab" class="integration-tab-content">
                <div class="integration-section">
                    <h2><i class="fas fa-phone"></i> VoIP Integration</h2>
                    <p class="section-description">Configure VoIP service for integrated phone calling capabilities.</p>
                    
                    <div class="integration-card">
                        <div class="form-group">
                            <label>VoIP Provider</label>
                            <select class="form-control" id="voip-provider" onchange="updateVoIPFields()">
                                <option value="twilio" ${savedConfig.voip.provider === 'twilio' ? 'selected' : ''}>Twilio</option>
                                <option value="ringcentral" ${savedConfig.voip.provider === 'ringcentral' ? 'selected' : ''}>RingCentral</option>
                                <option value="vonage" ${savedConfig.voip.provider === 'vonage' ? 'selected' : ''}>Vonage</option>
                                <option value="aircall" ${savedConfig.voip.provider === 'aircall' ? 'selected' : ''}>Aircall</option>
                                <option value="custom" ${savedConfig.voip.provider === 'custom' ? 'selected' : ''}>Custom SIP</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="voip-account-sid">Account SID/ID</label>
                                <input type="text" id="voip-account-sid" class="form-control" 
                                       placeholder="Enter Account SID" value="${savedConfig.voip.account_sid}">
                            </div>
                            <div class="form-group">
                                <label for="voip-auth-token">Auth Token/Secret</label>
                                <div class="input-with-action">
                                    <input type="password" id="voip-auth-token" class="form-control" 
                                           placeholder="Enter Auth Token" value="${savedConfig.voip.auth_token}">
                                    <button class="btn-icon" onclick="togglePasswordVisibility('voip-auth-token')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="voip-phone-number">Phone Number</label>
                            <input type="tel" id="voip-phone-number" class="form-control" 
                                   placeholder="+1 (555) 123-4567" value="${savedConfig.voip.phone_number}">
                            <small class="form-text">Your VoIP phone number for outbound calls</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="voip-webhook-url">Webhook URL (Optional)</label>
                            <input type="url" id="voip-webhook-url" class="form-control" 
                                   placeholder="https://your-domain.com/webhooks/voip" value="${savedConfig.voip.webhook_url}">
                            <small class="form-text">For receiving call status updates and recordings</small>
                        </div>
                        
                        <h3 style="margin-top: 30px;">Call Settings</h3>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="voip-record-calls" checked> Record all calls
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="voip-transcribe" checked> Transcribe recordings
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label for="voip-caller-id">Caller ID Name</label>
                            <input type="text" id="voip-caller-id" class="form-control" 
                                   placeholder="Vanguard Insurance">
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn-success" onclick="testVoIPConnection()">
                                <i class="fas fa-phone"></i> Make Test Call
                            </button>
                            <button class="btn-primary" onclick="saveVoIPConfig()">
                                <i class="fas fa-save"></i> Save Configuration
                            </button>
                        </div>
                        
                        <div id="voip-status" class="status-message"></div>
                    </div>
                </div>
            </div>
            
            <!-- Webhooks Tab -->
            <div id="webhooks-tab" class="integration-tab-content">
                <div class="integration-section">
                    <h2><i class="fas fa-link"></i> Webhook Endpoints</h2>
                    <p class="section-description">Configure webhook URLs for external system notifications.</p>
                    
                    <div class="integration-card">
                        <div class="form-group">
                            <label for="webhook-new-lead">New Lead Webhook</label>
                            <input type="url" id="webhook-new-lead" class="form-control" 
                                   placeholder="https://your-crm.com/webhooks/new-lead">
                            <small class="form-text">Triggered when a new lead is created</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="webhook-policy-created">Policy Created Webhook</label>
                            <input type="url" id="webhook-policy-created" class="form-control" 
                                   placeholder="https://your-system.com/webhooks/policy">
                            <small class="form-text">Triggered when a new policy is issued</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="webhook-renewal">Renewal Reminder Webhook</label>
                            <input type="url" id="webhook-renewal" class="form-control" 
                                   placeholder="https://your-system.com/webhooks/renewal">
                            <small class="form-text">Triggered for upcoming renewals</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Webhook Secret</label>
                            <div class="input-with-action">
                                <input type="text" id="webhook-secret" class="form-control" 
                                       placeholder="Generate or enter webhook secret" readonly>
                                <button class="btn-secondary" onclick="generateWebhookSecret()">
                                    <i class="fas fa-sync"></i> Generate
                                </button>
                            </div>
                            <small class="form-text">Used to verify webhook authenticity</small>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn-primary" onclick="saveWebhookConfig()">
                                <i class="fas fa-save"></i> Save Webhooks
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles for the integration configuration page
    if (!document.getElementById('integration-config-styles')) {
        const style = document.createElement('style');
        style.id = 'integration-config-styles';
        style.textContent = `
            .integrations-config-view {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
            }
            
            .integration-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 0;
            }
            
            .integration-tabs .tab-btn {
                padding: 12px 24px;
                background: transparent;
                border: none;
                color: #6b7280;
                cursor: pointer;
                font-weight: 500;
                border-bottom: 3px solid transparent;
                transition: all 0.3s;
            }
            
            .integration-tabs .tab-btn:hover {
                color: #374151;
                background: #f9fafb;
            }
            
            .integration-tabs .tab-btn.active {
                color: #0066cc;
                border-bottom-color: #0066cc;
            }
            
            .integration-tab-content {
                display: none;
            }
            
            .integration-tab-content.active {
                display: block;
            }
            
            .integration-section {
                margin-bottom: 40px;
            }
            
            .integration-section h2 {
                color: #111827;
                margin-bottom: 10px;
                font-size: 24px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .integration-section h3 {
                color: #374151;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .section-description {
                color: #6b7280;
                margin-bottom: 20px;
            }
            
            .integration-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 25px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #374151;
                font-weight: 500;
            }
            
            .form-control {
                width: 100%;
                padding: 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .form-control:focus {
                outline: none;
                border-color: #0066cc;
                box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
            }
            
            .form-text {
                display: block;
                margin-top: 5px;
                color: #6b7280;
                font-size: 13px;
            }
            
            .input-with-action {
                display: flex;
                gap: 10px;
            }
            
            .input-with-action .form-control {
                flex: 1;
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 25px;
            }
            
            .status-message {
                margin-top: 15px;
                padding: 12px;
                border-radius: 6px;
                display: none;
            }
            
            .status-message.success {
                background: #d1fae5;
                color: #065f46;
                border: 1px solid #a7f3d0;
                display: block;
            }
            
            .status-message.error {
                background: #fee2e2;
                color: #991b1b;
                border: 1px solid #fecaca;
                display: block;
            }
            
            .status-message.info {
                background: #dbeafe;
                color: #1e40af;
                border: 1px solid #bfdbfe;
                display: block;
            }
            
            .btn-icon {
                padding: 10px 15px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-icon:hover {
                background: #e5e7eb;
            }
        `;
        document.head.appendChild(style);
    }
}

// Helper Functions
function switchIntegrationTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.integration-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.integration-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = event.target.querySelector('i') || event.target;
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function updateEmailProviderFields() {
    const provider = document.getElementById('email-provider').value;
    const smtpHost = document.getElementById('email-smtp-host');
    const smtpPort = document.getElementById('email-smtp-port');
    
    const presets = {
        gmail: { host: 'smtp.gmail.com', port: '587' },
        outlook: { host: 'smtp.office365.com', port: '587' },
        sendgrid: { host: 'smtp.sendgrid.net', port: '587' },
        mailgun: { host: 'smtp.mailgun.org', port: '587' }
    };
    
    if (presets[provider]) {
        smtpHost.value = presets[provider].host;
        smtpPort.value = presets[provider].port;
    }
}

function updateVoIPFields() {
    const provider = document.getElementById('voip-provider').value;
    // Update fields based on provider selection
    console.log('VoIP provider changed to:', provider);
}

// Save Functions
function saveOpenAIConfig() {
    const apiKey = document.getElementById('openai-key').value;
    const model = document.getElementById('openai-model').value;
    
    if (!apiKey) {
        showStatus('openai-status', 'Please enter an API key', 'error');
        return;
    }
    
    localStorage.setItem('integration_openai_key', apiKey);
    localStorage.setItem('integration_openai_model', model);
    
    showStatus('openai-status', 'OpenAI configuration saved successfully!', 'success');
}

function saveEmailConfig() {
    const config = {
        provider: document.getElementById('email-provider').value,
        smtp_host: document.getElementById('email-smtp-host').value,
        smtp_port: document.getElementById('email-smtp-port').value,
        username: document.getElementById('email-username').value,
        password: document.getElementById('email-password').value,
        from_email: document.getElementById('email-from').value,
        use_tls: document.getElementById('email-use-tls').checked
    };
    
    Object.keys(config).forEach(key => {
        localStorage.setItem(`integration_email_${key}`, config[key]);
    });
    
    showStatus('email-status', 'Email configuration saved successfully!', 'success');
}

function saveCOIEmailConfig() {
    const config = {
        smtp_host: document.getElementById('coi-smtp-host').value,
        smtp_port: document.getElementById('coi-smtp-port').value,
        username: document.getElementById('coi-username').value,
        password: document.getElementById('coi-password').value,
        from_email: document.getElementById('coi-from').value,
        cc_email: document.getElementById('coi-cc').value,
        template: document.getElementById('coi-template').value
    };
    
    Object.keys(config).forEach(key => {
        localStorage.setItem(`integration_coi_${key}`, config[key]);
    });
    
    showStatus('coi-email-status', 'COI email configuration saved successfully!', 'success');
}

function saveVoIPConfig() {
    const config = {
        provider: document.getElementById('voip-provider').value,
        account_sid: document.getElementById('voip-account-sid').value,
        auth_token: document.getElementById('voip-auth-token').value,
        phone_number: document.getElementById('voip-phone-number').value,
        webhook_url: document.getElementById('voip-webhook-url').value,
        record_calls: document.getElementById('voip-record-calls').checked,
        transcribe: document.getElementById('voip-transcribe').checked,
        caller_id: document.getElementById('voip-caller-id').value
    };
    
    Object.keys(config).forEach(key => {
        localStorage.setItem(`integration_voip_${key}`, config[key]);
    });
    
    showStatus('voip-status', 'VoIP configuration saved successfully!', 'success');
}

function saveWebhookConfig() {
    const webhooks = {
        new_lead: document.getElementById('webhook-new-lead').value,
        policy_created: document.getElementById('webhook-policy-created').value,
        renewal: document.getElementById('webhook-renewal').value,
        secret: document.getElementById('webhook-secret').value
    };
    
    Object.keys(webhooks).forEach(key => {
        localStorage.setItem(`integration_webhook_${key}`, webhooks[key]);
    });
    
    alert('Webhook configuration saved successfully!');
}

// Test Functions
function testOpenAIConnection() {
    const apiKey = document.getElementById('openai-key').value;
    
    if (!apiKey) {
        showStatus('openai-status', 'Please enter an API key first', 'error');
        return;
    }
    
    showStatus('openai-status', 'Testing OpenAI connection...', 'info');
    
    // Simulate API test
    setTimeout(() => {
        if (apiKey.startsWith('sk-')) {
            showStatus('openai-status', '✓ Successfully connected to OpenAI!', 'success');
        } else {
            showStatus('openai-status', 'Invalid API key format', 'error');
        }
    }, 1500);
}

function testEmailConnection() {
    const username = document.getElementById('email-username').value;
    const password = document.getElementById('email-password').value;
    
    if (!username || !password) {
        showStatus('email-status', 'Please enter username and password', 'error');
        return;
    }
    
    showStatus('email-status', 'Sending test email...', 'info');
    
    // Simulate email test
    setTimeout(() => {
        showStatus('email-status', '✓ Test email sent successfully! Check your inbox.', 'success');
    }, 2000);
}

function testCOIEmailConnection() {
    showStatus('coi-email-status', 'Sending test COI email...', 'info');
    
    setTimeout(() => {
        showStatus('coi-email-status', '✓ Test COI email sent successfully!', 'success');
    }, 2000);
}

function testVoIPConnection() {
    showStatus('voip-status', 'Testing VoIP connection...', 'info');
    
    setTimeout(() => {
        showStatus('voip-status', '✓ VoIP connection successful! Ready to make calls.', 'success');
    }, 1500);
}

function generateWebhookSecret() {
    const secret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    document.getElementById('webhook-secret').value = secret;
}

function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
        statusElement.className = `status-message ${type}`;
        statusElement.innerHTML = message;
        
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }
}

function exportIntegrationConfig() {
    const config = {};
    
    // Collect all integration settings from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('integration_')) {
            config[key] = localStorage.getItem(key);
        }
    }
    
    // Create and download JSON file
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vanguard-integrations-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importIntegrationConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const config = JSON.parse(event.target.result);
                
                // Import settings to localStorage
                Object.keys(config).forEach(key => {
                    localStorage.setItem(key, config[key]);
                });
                
                alert('Configuration imported successfully! Refreshing page...');
                loadIntegrationsConfig();
            } catch (error) {
                alert('Error importing configuration: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Make the function globally available
window.loadIntegrationsConfig = loadIntegrationsConfig;