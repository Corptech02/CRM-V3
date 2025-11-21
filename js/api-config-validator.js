// API Configuration Validator
// Ensures all API endpoints and configurations are properly set up

console.log('Loading API Configuration Validator...');

class APIConfigValidator {
    constructor() {
        this.validationResults = [];
        this.expectedEndpoints = [
            '/api/search',
            '/api/leads',
            '/api/policies',
            '/api/users/register',
            '/api/users/login',
            '/api/reminders',
            '/api/stats/summary',
            '/api/stats/dashboard'
        ];
    }

    async validateConfiguration() {
        console.log('🔍 Validating API Configuration...');

        this.validateAPIService();
        this.validateEndpointConfiguration();
        this.validateAuthConfiguration();
        this.validateIntegrationScripts();
        await this.validateAPIConnectivity();

        this.displayValidationResults();
    }

    validateAPIService() {
        if (window.apiService) {
            this.addValidation('✅ API Service', 'apiService is available globally', 'success');

            // Check required methods
            const requiredMethods = [
                'searchCarriers',
                'getLeads', 'createLead', 'updateLead', 'deleteLead',
                'getPolicies', 'createPolicy', 'updatePolicy',
                'getReminders', 'createReminder',
                'login', 'register',
                'getDashboardStats'
            ];

            const missingMethods = requiredMethods.filter(method => !window.apiService[method]);

            if (missingMethods.length === 0) {
                this.addValidation('✅ API Methods', 'All required methods present', 'success');
            } else {
                this.addValidation('⚠️ API Methods', `Missing: ${missingMethods.join(', ')}`, 'warning');
            }
        } else {
            this.addValidation('❌ API Service', 'apiService not found', 'error');
        }
    }

    validateEndpointConfiguration() {
        // Use the same logic as api-service.js to get the API URL
        const getAPIBaseURL = () => {
            const customAPI = localStorage.getItem('VANGUARD_API_URL');
            if (customAPI) {
                return customAPI;
            }
            if (window.location.hostname === 'vanguard.vigagency.com') {
                return 'https://api.vigagency.com';
            }
            if (window.location.hostname === 'localhost') {
                return 'http://localhost:8897';
            }
            if (window.location.hostname.includes('github.io')) {
                return 'https://api.vigagency.com';
            }
            return 'http://162.220.14.239:8897';
        };

        const apiBaseUrl = getAPIBaseURL();

        this.addValidation('✅ API Base URL', apiBaseUrl, 'info');

        // Validate endpoint configuration
        if (apiBaseUrl.includes('api.vigagency.com')) {
            this.addValidation('✅ Cloudflare Configuration', 'Using secure HTTPS API via Cloudflare', 'success');
        } else if (apiBaseUrl.includes('192.168')) {
            this.addValidation('✅ Direct IP Configuration', 'Using direct server IP (no tunnel auth required)', 'success');
        } else if (apiBaseUrl.includes('localhost')) {
            this.addValidation('✅ Local Configuration', 'Using localhost for development', 'success');
        } else {
            this.addValidation('✅ Custom Configuration', 'Using custom server configuration', 'success');
        }
    }

    validateAuthConfiguration() {
        if (window.authService) {
            this.addValidation('✅ Auth Service', 'authService is available', 'success');

            // Check auth state
            const token = localStorage.getItem('authToken');
            const userInfo = localStorage.getItem('userInfo');

            if (token && userInfo) {
                this.addValidation('✅ Authentication', 'User session active', 'success');
            } else {
                this.addValidation('ℹ️ Authentication', 'No active session', 'info');
            }
        } else {
            this.addValidation('❌ Auth Service', 'authService not found', 'error');
        }
    }

    validateIntegrationScripts() {
        const integrationScripts = [
            { name: 'API Integration', check: () => window.updateDashboardStats },
            { name: 'Policy Integration', check: () => window.collectPolicyDataFromForm },
            { name: 'Reminders Integration', check: () => window.displayTodosFromData },
            { name: 'Test Suite', check: () => window.apiTester }
        ];

        integrationScripts.forEach(script => {
            if (script.check()) {
                this.addValidation(`✅ ${script.name}`, 'Script loaded successfully', 'success');
            } else {
                this.addValidation(`❌ ${script.name}`, 'Script not loaded', 'error');
            }
        });
    }

    async validateAPIConnectivity() {
        // Use the same logic as api-service.js to get the API URL
        const getAPIBaseURL = () => {
            const customAPI = localStorage.getItem('VANGUARD_API_URL');
            if (customAPI) {
                return customAPI;
            }
            if (window.location.hostname === 'vanguard.vigagency.com') {
                return 'https://api.vigagency.com';
            }
            if (window.location.hostname === 'localhost') {
                return 'http://localhost:8897';
            }
            if (window.location.hostname.includes('github.io')) {
                return 'https://api.vigagency.com';
            }
            return 'http://162.220.14.239:8897';
        };

        const apiBaseUrl = getAPIBaseURL();

        for (const endpoint of this.expectedEndpoints) {
            try {
                const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                    method: endpoint.includes('register') || endpoint.includes('login') ? 'POST' : 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: endpoint.includes('register') || endpoint.includes('login') ?
                        JSON.stringify({ test: 'validation' }) : undefined
                });

                if (response.status < 500) {
                    this.addValidation(`✅ ${endpoint}`, `Endpoint accessible (${response.status})`, 'success');
                } else {
                    this.addValidation(`⚠️ ${endpoint}`, `Server error (${response.status})`, 'warning');
                }
            } catch (error) {
                this.addValidation(`❌ ${endpoint}`, `Connection failed: ${error.message}`, 'error');
            }
        }
    }

    addValidation(title, message, status) {
        this.validationResults.push({ title, message, status });
        console.log(`${title}: ${message}`);
    }

    displayValidationResults() {
        // Create validation panel
        const validationPanel = document.createElement('div');
        validationPanel.id = 'validationPanel';
        validationPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 450px;
            max-height: 600px;
            background: white;
            border: 2px solid #10b981;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 10000;
            overflow-y: auto;
        `;

        const summary = this.validationResults.reduce((acc, result) => {
            acc[result.status] = (acc[result.status] || 0) + 1;
            return acc;
        }, {});

        validationPanel.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="margin: 0; color: #1f2937;">🔍 API Configuration Status</h3>
                <button onclick="this.closest('#validationPanel').remove()" style="float: right; margin-top: -25px; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
            </div>
            <div style="padding: 15px;">
                <div style="margin-bottom: 15px; padding: 10px; background: #f0fdf4; border-radius: 5px; border: 1px solid #10b981;">
                    <strong>Configuration Summary:</strong><br>
                    ✅ Valid: ${summary.success || 0}<br>
                    ℹ️ Info: ${summary.info || 0}<br>
                    ⚠️ Warnings: ${summary.warning || 0}<br>
                    ❌ Errors: ${summary.error || 0}
                </div>

                ${this.validationResults.map(result => `
                    <div style="margin-bottom: 8px; padding: 8px; border-left: 3px solid ${
                        result.status === 'success' ? '#10b981' :
                        result.status === 'info' ? '#3b82f6' :
                        result.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }; background: ${
                        result.status === 'success' ? '#ecfdf5' :
                        result.status === 'info' ? '#eff6ff' :
                        result.status === 'warning' ? '#fffbeb' : '#fef2f2'
                    }; border-radius: 3px;">
                        <strong style="font-size: 12px;">${result.title}</strong><br>
                        <small style="color: #6b7280;">${result.message}</small>
                    </div>
                `).join('')}

                <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 5px;">
                    <strong>Next Steps:</strong><br>
                    <small style="color: #6b7280;">
                        ${summary.error > 0 ?
                            '❌ Fix errors before testing API functionality' :
                            summary.warning > 0 ?
                            '⚠️ Review warnings and test API functionality' :
                            '✅ Configuration looks good! API is ready to use'
                        }
                    </small>
                </div>

                <button onclick="window.location.reload()" style="width: 100%; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Refresh & Re-validate
                </button>
            </div>
        `;

        document.body.appendChild(validationPanel);

        // Auto-hide after 30 seconds unless there are errors
        if (summary.error === 0) {
            setTimeout(() => {
                if (validationPanel.parentNode) {
                    validationPanel.style.opacity = '0.5';
                    setTimeout(() => {
                        if (validationPanel.parentNode) {
                            validationPanel.parentNode.removeChild(validationPanel);
                        }
                    }, 5000);
                }
            }, 25000);
        }
    }
}

// Auto-validate configuration on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const validator = new APIConfigValidator();
        validator.validateConfiguration();
        window.configValidator = validator;
    }, 2000);
});

console.log('✅ API Configuration Validator loaded');