// Comprehensive API Integration Test Suite
console.log('Loading API Integration Test Suite...');

class APIIntegrationTester {
    constructor() {
        this.testResults = [];
        this.apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : window.location.hostname.includes('github.io')
            ? 'https://vanguard-insurance-api.loca.lt'
            : 'http://162.220.14.239:8897';
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive API Integration Tests...');

        this.createTestUI();

        await this.testAPIConnectivity();
        await this.testCarrierSearch();
        await this.testDashboardStats();
        await this.testLeadManagement();
        await this.testPolicyManagement();
        await this.testRemindersManagement();
        await this.testAuthentication();

        this.displayResults();

        console.log('🧪 All API Integration Tests Completed');
    }

    createTestUI() {
        // Create test results panel
        const testPanel = document.createElement('div');
        testPanel.id = 'apiTestPanel';
        testPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 400px;
            max-height: 600px;
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 10000;
            overflow-y: auto;
        `;

        testPanel.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="margin: 0; color: #1f2937;">🧪 API Integration Tests</h3>
                <button onclick="this.closest('#apiTestPanel').remove()" style="float: right; margin-top: -25px; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
            </div>
            <div id="testResults" style="padding: 15px;">
                <div id="testProgress">Initializing tests...</div>
            </div>
        `;

        document.body.appendChild(testPanel);
    }

    async testAPIConnectivity() {
        this.updateProgress('Testing API Connectivity...');

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/stats/summary`, {
                method: 'GET',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                this.addResult('✅ API Connectivity', 'API server is accessible', 'success');
            } else {
                this.addResult('❌ API Connectivity', `HTTP ${response.status}`, 'error');
            }
        } catch (error) {
            this.addResult('❌ API Connectivity', error.message, 'error');
        }
    }

    async testCarrierSearch() {
        this.updateProgress('Testing Carrier Search...');

        try {
            if (window.apiService && window.apiService.searchCarriers) {
                const result = await window.apiService.searchCarriers({
                    state: 'OH',
                    limit: 5
                });

                if (result && result.carriers && result.carriers.length > 0) {
                    this.addResult('✅ Carrier Search', `Found ${result.carriers.length} carriers`, 'success');
                } else {
                    this.addResult('⚠️ Carrier Search', 'No carriers returned', 'warning');
                }
            } else {
                this.addResult('❌ Carrier Search', 'API service not available', 'error');
            }
        } catch (error) {
            this.addResult('❌ Carrier Search', error.message, 'error');
        }
    }

    async testDashboardStats() {
        this.updateProgress('Testing Dashboard Statistics...');

        try {
            if (window.apiService && window.apiService.getDashboardStats) {
                const stats = await window.apiService.getDashboardStats();

                if (stats && typeof stats === 'object') {
                    this.addResult('✅ Dashboard Stats', 'Statistics retrieved successfully', 'success');
                } else {
                    this.addResult('⚠️ Dashboard Stats', 'Empty or invalid response', 'warning');
                }
            } else {
                this.addResult('❌ Dashboard Stats', 'API service not available', 'error');
            }
        } catch (error) {
            this.addResult('❌ Dashboard Stats', error.message, 'error');
        }
    }

    async testLeadManagement() {
        this.updateProgress('Testing Lead Management...');

        try {
            if (!window.apiService) {
                this.addResult('❌ Lead Management', 'API service not available', 'error');
                return;
            }

            // Test getting leads
            if (window.apiService.getLeads) {
                const leads = await window.apiService.getLeads();
                this.addResult('✅ Get Leads', `Retrieved ${Array.isArray(leads) ? leads.length : 0} leads`, 'success');
            }

            // Test creating a lead
            if (window.apiService.createLead) {
                const testLead = {
                    name: 'API Test Lead',
                    email: 'test@example.com',
                    phone: '555-0123',
                    company: 'Test Company',
                    source: 'API Test'
                };

                const newLead = await window.apiService.createLead(testLead);
                if (newLead && newLead.id) {
                    this.addResult('✅ Create Lead', 'Lead created successfully', 'success');

                    // Test updating the lead
                    if (window.apiService.updateLead) {
                        await window.apiService.updateLead(newLead.id, { stage: 'contacted' });
                        this.addResult('✅ Update Lead', 'Lead updated successfully', 'success');
                    }

                    // Test deleting the lead
                    if (window.apiService.deleteLead) {
                        await window.apiService.deleteLead(newLead.id);
                        this.addResult('✅ Delete Lead', 'Lead deleted successfully', 'success');
                    }
                } else {
                    this.addResult('⚠️ Create Lead', 'Lead created but no ID returned', 'warning');
                }
            }
        } catch (error) {
            this.addResult('❌ Lead Management', error.message, 'error');
        }
    }

    async testPolicyManagement() {
        this.updateProgress('Testing Policy Management...');

        try {
            if (!window.apiService) {
                this.addResult('❌ Policy Management', 'API service not available', 'error');
                return;
            }

            // Test getting policies
            if (window.apiService.getPolicies) {
                const policies = await window.apiService.getPolicies();
                this.addResult('✅ Get Policies', `Retrieved ${Array.isArray(policies) ? policies.length : 0} policies`, 'success');
            }

            // Test creating a policy
            if (window.apiService.createPolicy) {
                const testPolicy = {
                    policy_type: 'Commercial Auto',
                    carrier: 'Test Carrier',
                    policy_number: 'TEST-001',
                    premium: 1200,
                    coverage_amount: 1000000
                };

                const newPolicy = await window.apiService.createPolicy(testPolicy);
                if (newPolicy && newPolicy.id) {
                    this.addResult('✅ Create Policy', 'Policy created successfully', 'success');

                    // Test updating the policy
                    if (window.apiService.updatePolicy) {
                        await window.apiService.updatePolicy(newPolicy.id, { premium: 1300 });
                        this.addResult('✅ Update Policy', 'Policy updated successfully', 'success');
                    }
                } else {
                    this.addResult('⚠️ Create Policy', 'Policy created but no ID returned', 'warning');
                }
            }
        } catch (error) {
            this.addResult('❌ Policy Management', error.message, 'error');
        }
    }

    async testRemindersManagement() {
        this.updateProgress('Testing Reminders Management...');

        try {
            if (!window.apiService) {
                this.addResult('❌ Reminders Management', 'API service not available', 'error');
                return;
            }

            // Test getting reminders
            if (window.apiService.getReminders) {
                const reminders = await window.apiService.getReminders();
                this.addResult('✅ Get Reminders', `Retrieved ${Array.isArray(reminders) ? reminders.length : 0} reminders`, 'success');
            }

            // Test creating a reminder
            if (window.apiService.createReminder) {
                const testReminder = {
                    title: 'API Test Reminder',
                    type: 'personal',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                };

                const newReminder = await window.apiService.createReminder(testReminder);
                if (newReminder && newReminder.id) {
                    this.addResult('✅ Create Reminder', 'Reminder created successfully', 'success');
                } else {
                    this.addResult('⚠️ Create Reminder', 'Reminder created but no ID returned', 'warning');
                }
            }
        } catch (error) {
            this.addResult('❌ Reminders Management', error.message, 'error');
        }
    }

    async testAuthentication() {
        this.updateProgress('Testing Authentication...');

        try {
            // Check if user is authenticated
            const token = localStorage.getItem('authToken');
            const userInfo = localStorage.getItem('userInfo');

            if (token && userInfo) {
                this.addResult('✅ Authentication', 'User session active', 'success');
            } else {
                this.addResult('⚠️ Authentication', 'No active session (expected)', 'warning');
            }

            // Test API endpoints accessibility
            if (window.apiService && window.apiService.login) {
                this.addResult('✅ Auth Endpoints', 'Login/Register endpoints available', 'success');
            } else {
                this.addResult('❌ Auth Endpoints', 'Auth methods not available', 'error');
            }
        } catch (error) {
            this.addResult('❌ Authentication', error.message, 'error');
        }
    }

    updateProgress(message) {
        const progressEl = document.getElementById('testProgress');
        if (progressEl) {
            progressEl.textContent = message;
        }
    }

    addResult(test, message, status) {
        this.testResults.push({ test, message, status });
        console.log(`${test}: ${message}`);
    }

    displayResults() {
        const resultsEl = document.getElementById('testResults');
        if (!resultsEl) return;

        const summary = this.testResults.reduce((acc, result) => {
            acc[result.status] = (acc[result.status] || 0) + 1;
            return acc;
        }, {});

        resultsEl.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f9fafb; border-radius: 5px;">
                <strong>Test Summary:</strong><br>
                ✅ Passed: ${summary.success || 0}<br>
                ⚠️ Warnings: ${summary.warning || 0}<br>
                ❌ Failed: ${summary.error || 0}
            </div>

            ${this.testResults.map(result => `
                <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid ${
                    result.status === 'success' ? '#10b981' :
                    result.status === 'warning' ? '#f59e0b' : '#ef4444'
                }; background: ${
                    result.status === 'success' ? '#ecfdf5' :
                    result.status === 'warning' ? '#fffbeb' : '#fef2f2'
                };">
                    <strong>${result.test}</strong><br>
                    <small>${result.message}</small>
                </div>
            `).join('')}

            <button onclick="window.apiTester.exportResults()" style="width: 100%; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                Export Test Results
            </button>
        `;
    }

    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            apiBaseUrl: this.apiBaseUrl,
            userAgent: navigator.userAgent,
            testResults: this.testResults
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vanguard-api-test-results-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the tester
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to load
    setTimeout(() => {
        window.apiTester = new APIIntegrationTester();

        // Add test button to page if in development mode
        if (window.location.hostname === 'localhost' || window.location.search.includes('test=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = '🧪 Run API Tests';
            testButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                cursor: pointer;
                z-index: 10000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            testButton.onclick = () => window.apiTester.runAllTests();
            document.body.appendChild(testButton);
        }
    }, 3000);
});

console.log('✅ API Integration Test Suite loaded');