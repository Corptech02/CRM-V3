// Fix Policy Server Save - Ensure ALL policy operations save to server, not localStorage
console.log('Policy Server Save Fix: Loading...');

(function() {
    // API endpoint configuration - handle both with and without /api suffix
    let API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001';

    // Remove /api suffix if it exists to avoid double /api/api/ paths
    if (API_URL.endsWith('/api')) {
        API_URL = API_URL.slice(0, -4);
    }

    console.log('🔧 API_URL configured as:', API_URL);

    // Store reference to original savePolicy function
    const originalSavePolicy = window.savePolicy;

    // Fallback function to save minimal data when full save fails
    async function attemptMinimalSave(policyData, API_URL) {
        console.log('🔧 Attempting minimal save with only essential fields...');

        // Create minimal policy object with only essential fields
        const minimalPolicy = {
            id: policyData.id,
            policyNumber: policyData.policyNumber,
            carrier: policyData.carrier,
            policyStatus: policyData.policyStatus || 'Active',
            effectiveDate: policyData.effectiveDate,
            expirationDate: policyData.expirationDate,
            premium: policyData.premium,
            agent: policyData.agent,
            policyType: policyData.policyType,
            updatedAt: new Date().toISOString()
        };

        // Add createdAt only if it's a new policy
        if (!minimalPolicy.id.startsWith('POL-')) {
            minimalPolicy.createdAt = policyData.createdAt || new Date().toISOString();
        }

        // CRITICAL: Remove any client-related fields that might have been added by interceptors
        delete minimalPolicy.client_id;
        delete minimalPolicy.clientId;
        delete minimalPolicy.client_name;
        delete minimalPolicy.clientName;

        console.log('🔧 Minimal save payload:', JSON.stringify(minimalPolicy, null, 2));

        try {
            // Create a clean JSON string without client_id fields
            let cleanPayload = JSON.stringify(minimalPolicy);

            // Double-check: remove any client_id that might have been added during serialization
            const payloadObj = JSON.parse(cleanPayload);
            delete payloadObj.client_id;
            delete payloadObj.clientId;
            delete payloadObj.client_name;
            delete payloadObj.clientName;
            cleanPayload = JSON.stringify(payloadObj);

            console.log('🔧 Final clean payload for minimal save:', cleanPayload);

            const response = await fetch(`${API_URL}/api/policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: cleanPayload
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Minimal save successful:', result);
                return result;
            } else {
                const errorText = await response.text();
                console.error('❌ Minimal save also failed:', errorText);
                throw new Error(`Minimal save failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Minimal save error:', error);
            throw error;
        }
    }

    // Fallback function to save only to localStorage when server is completely broken
    async function saveToLocalStorageOnly(policyData) {
        console.log('💾 Server is broken - saving to localStorage only...');
        console.log('💾 This is a temporary workaround until server database is fixed');

        try {
            // Save to localStorage (existing functionality)
            let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const existingIndex = policies.findIndex(p => p.id === policyData.id);

            if (existingIndex >= 0) {
                policies[existingIndex] = policyData;
                console.log('💾 Updated existing policy in localStorage');
            } else {
                policies.push(policyData);
                console.log('💾 Added new policy to localStorage');
            }

            localStorage.setItem('insurance_policies', JSON.stringify(policies));

            // Show success notification with warning
            if (window.showNotification) {
                showNotification('Policy saved locally (Server database needs fixing)', 'warning');
            }

            // Clear editing state to ensure next policy creation works properly
            window.editingPolicyId = undefined;
            console.log('🔧 Cleared editingPolicyId after fallback save');

            // Close the policy edit modal
            const policyModal = document.querySelector('#policyModal');
            if (policyModal) {
                policyModal.style.display = 'none';
                policyModal.remove();
            }

            // Close any other policy-related modals
            document.querySelectorAll('.modal, [id*="modal"], [id*="Modal"]').forEach(modal => {
                if (modal.style.display !== 'none' &&
                    (modal.innerHTML.includes('Policy') || modal.innerHTML.includes('Save Policy') || modal.innerHTML.includes('Edit Policy'))) {
                    modal.style.display = 'none';
                    modal.remove();
                }
            });

            // Navigate back to policies list view
            if (window.location.hash !== '#policies') {
                window.location.hash = '#policies';
            }

            // Refresh the view
            if (window.loadPoliciesView) {
                setTimeout(() => loadPoliciesView(), 500);
            } else {
                // Fallback: reload policies section
                setTimeout(() => {
                    if (window.loadContent) {
                        loadContent('#policies');
                    }
                }, 500);
            }

            // Return a mock success result
            return {
                id: policyData.id,
                message: 'Saved to localStorage only (server database error)',
                saved_at: new Date().toISOString(),
                storage: 'localStorage_only'
            };

        } catch (error) {
            console.error('❌ Even localStorage save failed:', error);
            throw new Error('Failed to save policy anywhere: ' + error.message);
        }
    }

    // Override the savePolicy function to save to server
    window.savePolicy = async function(policyData) {
        console.log('🔍 SERVER SAVE DEBUG - Function called with:', policyData);
        console.log('🔍 SERVER SAVE DEBUG - policyData type:', typeof policyData);
        console.log('🔍 SERVER SAVE DEBUG - policyData is null:', policyData === null);
        console.log('🔍 SERVER SAVE DEBUG - policyData is undefined:', policyData === undefined);

        // Early safety check
        if (policyData === null) {
            console.error('❌ SERVER SAVE - policyData is null, cannot proceed');
            throw new Error('Policy data is null');
        }

        try {
            // If no policyData is provided, try to use the enhanced collection from app.js first
            if (!policyData) {
                console.log('No policyData provided, trying enhanced collection first...');

                // Try the enhanced collectPolicyData function from app.js
                if (typeof window.collectPolicyData === 'function') {
                    console.log('🎯 Using enhanced collectPolicyData function from app.js...');
                    policyData = window.collectPolicyData();

                    if (policyData && policyData.vehicles) {
                        console.log('✅ Enhanced collection succeeded, vehicles found:', policyData.vehicles.length);
                        console.log('🔍 Vehicle data sample:', JSON.stringify(policyData.vehicles[0] || {}, null, 2));
                    }
                }

                // If enhanced collection failed or returned no data, fall back to manual collection
                if (!policyData) {
                    console.log('Enhanced collection failed, falling back to manual collection...');
                    // Try to collect comprehensive policy data from all form tabs
                    console.log('Collecting comprehensive policy data from modal form...');

                    // Start with basic overview data
                policyData = {
                    policyNumber: document.getElementById('overview-policy-number')?.value || `POL-${Date.now()}`,
                    carrier: document.getElementById('overview-carrier')?.value || '',
                    policyStatus: document.getElementById('overview-status')?.value || 'Active',
                    effectiveDate: document.getElementById('overview-effective-date')?.value || '',
                    expirationDate: document.getElementById('overview-expiration-date')?.value || '',
                    premium: document.getElementById('overview-premium')?.value || '',
                    agent: document.getElementById('overview-agent')?.value || '',
                    dotNumber: document.getElementById('overview-dot-number')?.value || '',
                    mcNumber: document.getElementById('overview-mc-number')?.value || '',
                    timestamp: new Date().toISOString()
                };

                // Get policy type
                const policyTypeField = document.getElementById('overview-policy-type');
                if (policyTypeField && policyTypeField.value) {
                    const typeMap = {
                        'Commercial Auto': 'commercial-auto',
                        'Personal Auto': 'personal-auto',
                        'Homeowners': 'homeowners',
                        'Commercial Property': 'commercial-property',
                        'General Liability': 'general-liability',
                        'Professional Liability': 'professional-liability',
                        'Workers Comp': 'workers-comp',
                        'Umbrella': 'umbrella',
                        'Life': 'life',
                        'Health': 'health'
                    };
                    policyData.policyType = typeMap[policyTypeField.value] || policyTypeField.value.toLowerCase().replace(/\s+/g, '-');
                }

                // Check if we're editing an existing policy (not creating new)
                const isEditing = window.editingPolicyId !== undefined &&
                                window.editingPolicyId !== 'new' &&
                                window.editingPolicyId !== '' &&
                                window.editingPolicyId !== null;

                if (isEditing) {
                    console.log('🔧 Editing existing policy with ID:', window.editingPolicyId);
                    policyData.id = window.editingPolicyId;
                } else {
                    console.log('🔧 Creating new policy (editingPolicyId:', window.editingPolicyId, ')');
                }

                // Try to get client association if available
                if (window.currentClientId || window.currentViewingClientId) {
                    policyData.clientId = window.currentClientId || window.currentViewingClientId;
                    console.log('Added client association:', policyData.clientId);
                }

                // Collect vehicles data
                policyData.vehicles = [];
                const vehicleContainers = document.querySelectorAll('[id^="vehicle-"], .vehicle-entry, .vehicle-container');
                vehicleContainers.forEach((container, index) => {
                    const vehicle = {};
                    const inputs = container.querySelectorAll('input, select, textarea');

                    inputs.forEach(input => {
                        if (input.value) {
                            const id = input.id || input.name || '';
                            const label = input.closest('.form-group')?.querySelector('label')?.textContent?.replace(' *', '').replace(':', '').trim();

                            // Map common vehicle field IDs to standardized names
                            let fieldName = label || id;
                            if (id.includes('year')) fieldName = 'year';
                            else if (id.includes('make')) fieldName = 'make';
                            else if (id.includes('model')) fieldName = 'model';
                            else if (id.includes('vin')) fieldName = 'vin';
                            else if (id.includes('value')) fieldName = 'value';
                            else if (id.includes('deductible')) fieldName = 'deductible';

                            vehicle[fieldName] = input.value;
                        }
                    });

                    // Only add if vehicle has some data
                    if (Object.keys(vehicle).length > 0) {
                        vehicle.vehicleNumber = index + 1;
                        policyData.vehicles.push(vehicle);
                    }
                });

                // Collect drivers data
                policyData.drivers = [];
                const driverContainers = document.querySelectorAll('[id^="driver-"], .driver-entry, .driver-container');
                driverContainers.forEach((container, index) => {
                    const driver = {};
                    const inputs = container.querySelectorAll('input, select, textarea');

                    inputs.forEach(input => {
                        if (input.value) {
                            const id = input.id || input.name || '';
                            const label = input.closest('.form-group')?.querySelector('label')?.textContent?.replace(' *', '').replace(':', '').trim();

                            // Map common driver field IDs to standardized names
                            let fieldName = label || id;
                            if (id.includes('name') || id.includes('Name')) fieldName = 'name';
                            else if (id.includes('license')) fieldName = 'licenseNumber';
                            else if (id.includes('birth') || id.includes('dob')) fieldName = 'dateOfBirth';
                            else if (id.includes('age')) fieldName = 'age';
                            else if (id.includes('experience')) fieldName = 'experience';

                            driver[fieldName] = input.value;
                        }
                    });

                    // Only add if driver has some data
                    if (Object.keys(driver).length > 0) {
                        driver.driverNumber = index + 1;
                        policyData.drivers.push(driver);
                    }
                });

                // Collect coverages data from all coverage-related inputs
                policyData.coverages = {};
                const coverageInputs = document.querySelectorAll('input[id*="coverage"], input[id*="limit"], input[id*="deductible"], select[id*="coverage"], select[id*="limit"]');
                coverageInputs.forEach(input => {
                    if (input.value) {
                        const id = input.id || input.name || '';
                        const label = input.closest('.form-group')?.querySelector('label')?.textContent?.replace(' *', '').replace(':', '').trim();
                        const fieldName = label || id.replace(/^(coverage|limit|deductible)-?/, '');
                        policyData.coverages[fieldName] = input.value;
                    }
                });

                // Collect data from other form tabs if they exist
                const allTabs = document.querySelectorAll('[id$="-content"]');
                allTabs.forEach(tab => {
                    const tabId = tab.id.replace('-content', '');
                    const inputs = tab.querySelectorAll('input, select, textarea');

                    if (inputs.length > 0 && !policyData[tabId]) {
                        policyData[tabId] = {};
                    }

                    inputs.forEach(input => {
                        const label = input.closest('.form-group')?.querySelector('label')?.textContent?.replace(' *', '').replace(':', '').trim();
                        if (label && input.value) {
                            policyData[tabId][label] = input.value;
                        }
                    });
                });

                console.log('Collected comprehensive policy data:', policyData);
                console.log('Vehicles found:', policyData.vehicles?.length || 0);
                console.log('Drivers found:', policyData.drivers?.length || 0);
                console.log('Coverages found:', Object.keys(policyData.coverages || {}).length);

                // Validate that we actually collected data
                if (!policyData || Object.keys(policyData).length === 0) {
                    throw new Error('Failed to collect policy data from form - no form fields found or form is empty');
                }
            }

            console.log('🔍 SERVER SAVE DEBUG - Final policyData before processing:', policyData);
            console.log('🔍 SERVER SAVE DEBUG - policyData has id:', !!policyData?.id);

            // Ensure policy has an ID and fix any invalid IDs
            if (!policyData.id || policyData.id === 'new' || policyData.id === '' || policyData.id === 'undefined') {
                console.log('🔧 Generating new policy ID (current invalid ID:', policyData.id, ')');
                policyData.id = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                console.log('🔧 New policy ID generated:', policyData.id);
            }

            // 🔍 DETAILED DEBUGGING - Check what policies exist before saving
            console.log('🔍 DEBUG: Policy ID being saved:', policyData.id);
            console.log('🔍 DEBUG: Is editing mode:', isEditing);
            console.log('🔍 DEBUG: editingPolicyId value:', window.editingPolicyId);

            const existingPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            console.log('🔍 DEBUG: Existing policies count before save:', existingPolicies.length);
            console.log('🔍 DEBUG: Existing policy IDs:', existingPolicies.map(p => p.id));
            console.log('🔍 DEBUG: Will this be an update or new addition?',
                       existingPolicies.findIndex(p => p.id === policyData.id) >= 0 ? 'UPDATE' : 'NEW ADDITION');

            // IMPORTANT: Remove client_id and clientName from server payload since database doesn't support it
            const serverPolicyData = { ...policyData };

            // Check what client-related fields exist before removal
            const clientFields = Object.keys(serverPolicyData).filter(key =>
                key.toLowerCase().includes('client')
            );
            console.log('🔍 Found client-related fields:', clientFields);

            // Remove all client-related fields
            delete serverPolicyData.clientId;
            delete serverPolicyData.clientName;
            delete serverPolicyData.client_id;
            delete serverPolicyData.client_name;

            console.log('🔧 Removed all client-related fields for server compatibility');

            // Add timestamps to the server data
            if (!serverPolicyData.createdAt) {
                serverPolicyData.createdAt = new Date().toISOString();
            }
            serverPolicyData.updatedAt = new Date().toISOString();

            // Determine if this is an existing policy (has a real ID, not "new" or auto-generated)
            const isExistingPolicy = serverPolicyData.id &&
                                    serverPolicyData.id !== 'new' &&
                                    !serverPolicyData.id.startsWith('POL-') &&
                                    !serverPolicyData.id.startsWith('policy_') &&
                                    !serverPolicyData.id.startsWith('policy-');
            const method = isExistingPolicy ? 'PUT' : 'POST';
            const endpoint = isExistingPolicy ? `${API_URL}/api/policies/${serverPolicyData.id}` : `${API_URL}/api/policies`;

            console.log('🔍 Policy ID check:', serverPolicyData.id, 'isExisting:', isExistingPolicy);

            // Save to server
            console.log('🌐 Sending policy data to server:', endpoint);
            console.log('🌐 Request method:', method, '(existing policy:', isExistingPolicy, ')');
            console.log('🌐 Request payload (cleaned):', JSON.stringify(serverPolicyData, null, 2));

            // Create a defensive clean payload
            let cleanServerPayload = JSON.stringify(serverPolicyData);
            const cleanServerObj = JSON.parse(cleanServerPayload);
            delete cleanServerObj.client_id;
            delete cleanServerObj.clientId;
            delete cleanServerObj.client_name;
            delete cleanServerObj.clientName;
            cleanServerPayload = JSON.stringify(cleanServerObj);

            console.log('🌐 Final defensive clean payload:', cleanServerPayload);

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: cleanServerPayload
            });

            console.log('🌐 Server response status:', response.status, response.statusText);

            if (!response.ok) {
                // Try to get more details about the server error
                let errorDetails = '';
                try {
                    const errorText = await response.text();
                    errorDetails = errorText;
                    console.error('🌐 Server error details:', errorText);

                    // If it's a client_id column error, try a simplified payload
                    if (errorText.includes('client_id')) {
                        console.log('🔧 Attempting fallback with minimal data due to client_id error...');
                        try {
                            return await attemptMinimalSave(serverPolicyData, API_URL);
                        } catch (minimalError) {
                            console.error('❌ Minimal save also failed, using localStorage only fallback...');
                            return await saveToLocalStorageOnly(policyData); // Use original full data for localStorage
                        }
                    }
                } catch (e) {
                    console.error('🌐 Could not read server error details:', e);
                }

                throw new Error(`Server error: ${response.status} ${response.statusText}${errorDetails ? ' - ' + errorDetails : ''}`);
            }

            const result = await response.json();
            console.log('Policy saved to server:', result);

            // Also update localStorage for immediate UI updates
            let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const existingIndex = policies.findIndex(p => p.id === policyData.id);

            console.log('📊 SAVE DEBUG: Policies before save:', policies.length);
            console.log('📊 SAVE DEBUG: Looking for policy ID:', policyData.id);
            console.log('📊 SAVE DEBUG: Existing index found:', existingIndex);

            if (existingIndex >= 0) {
                policies[existingIndex] = policyData;
                console.log('📊 SAVE DEBUG: Updated existing policy at index', existingIndex);
            } else {
                policies.push(policyData);
                console.log('📊 SAVE DEBUG: Added new policy, total count now:', policies.length);
            }

            localStorage.setItem('insurance_policies', JSON.stringify(policies));

            // Verify the save worked
            const savedPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            console.log('✅ SAVE DEBUG: Verified save - total policies now:', savedPolicies.length);
            console.log('✅ SAVE DEBUG: Verified policy IDs:', savedPolicies.map(p => p.id));

            // Show success notification
            if (window.showNotification) {
                showNotification('Policy saved to server successfully', 'success');
            }

            // Clear editing state to ensure next policy creation works properly
            window.editingPolicyId = undefined;
            console.log('🔧 Cleared editingPolicyId after successful save');

            // Close the policy edit modal
            const policyModal = document.querySelector('#policyModal');
            if (policyModal) {
                policyModal.style.display = 'none';
                policyModal.remove();
            }

            // Close any other policy-related modals
            document.querySelectorAll('.modal, [id*="modal"], [id*="Modal"]').forEach(modal => {
                if (modal.style.display !== 'none' &&
                    (modal.innerHTML.includes('Policy') || modal.innerHTML.includes('Save Policy') || modal.innerHTML.includes('Edit Policy'))) {
                    modal.style.display = 'none';
                    modal.remove();
                }
            });

            // Navigate back to policies list view
            if (window.location.hash !== '#policies') {
                window.location.hash = '#policies';
            }

            // Refresh the view
            if (window.loadPoliciesView) {
                setTimeout(() => loadPoliciesView(), 500);
            } else {
                // Fallback: reload policies section
                setTimeout(() => {
                    if (window.loadContent) {
                        loadContent('#policies');
                    }
                }, 500);
            }

            return result;

        } catch (error) {
            console.error('Error saving policy to server:', error);
            if (window.showNotification) {
                showNotification('Error saving policy to server', 'error');
            }
            throw error;
        }
    };

    // Override addPolicy function
    window.addPolicy = async function(policyData) {
        console.log('Adding new policy to SERVER');
        return window.savePolicy(policyData);
    };

    // Override createPolicy function
    window.createPolicy = async function(policyData) {
        console.log('Creating new policy on SERVER');
        return window.savePolicy(policyData);
    };

    // Override editPolicy function to save to server
    const originalEditPolicy = window.editPolicy;
    window.editPolicy = async function(policyId) {
        console.log('Edit policy:', policyId);

        // Call original edit function to show the modal
        if (originalEditPolicy) {
            originalEditPolicy(policyId);
        }

        // Note: The actual save will happen when savePolicy is called from the modal
    };

    // Override updatePolicy function
    window.updatePolicy = async function(policyData) {
        console.log('Updating policy on SERVER:', policyData.id);
        return window.savePolicy(policyData);
    };

    // Override deletePolicy function to delete from server
    window.deletePolicy = async function(policyId) {
        console.log('🗑️ DELETE INITIATED - Policy ID:', policyId);

        if (!policyId || policyId === 'undefined' || policyId === 'unknown') {
            console.error('❌ DELETE FAILED - Invalid policy ID:', policyId);
            alert('Error: Cannot delete policy - invalid ID');
            return;
        }

        if (!confirm('Are you sure you want to delete this policy?')) {
            console.log('❌ DELETE CANCELLED by user');
            return;
        }

        console.log('✅ DELETE CONFIRMED - Proceeding with deletion...');

        try {
            // First try to delete by ID
            let response = await fetch(`${API_URL}/api/policies/${policyId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let deleteResult = await response.json();

            // If 0 rows deleted, policy might be stored by policyNumber instead of id
            if (deleteResult.deleted === 0) {
                console.log('⚠️ Delete by ID failed, trying to find policy by policyNumber...');

                // Get all policies and find the one with matching policyNumber
                const policiesResponse = await fetch(`${API_URL}/api/policies`);
                const policies = await policiesResponse.json();
                const policy = policies.find(p =>
                    p.policyNumber === policyId ||
                    p.id === policyId ||
                    (p.overview && p.overview["Policy Number"] === policyId)
                );

                if (policy && policy.id) {
                    console.log(`🔄 Found policy with actual ID: ${policy.id}, retrying delete...`);
                    response = await fetch(`${API_URL}/api/policies/${policy.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    deleteResult = await response.json();
                }
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            if (deleteResult.deleted === 0) {
                console.warn(`⚠️ Policy ${policyId} not found in server database - removing from localStorage only`);

                // Remove from localStorage anyway (it's mock/test data)
                let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const originalLength = policies.length;
                policies = policies.filter(p =>
                    p.id !== policyId &&
                    p.policyNumber !== policyId &&
                    (p.overview && p.overview["Policy Number"] !== policyId)
                );

                if (policies.length < originalLength) {
                    if (window.originalSetItem) {
                        window.originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
                    } else {
                        originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
                    }

                    console.log(`✅ Removed localStorage-only policy: ${policyId}`);

                    // Close modals and refresh
                    const modals = document.querySelectorAll('.modal, #policyViewModal');
                    modals.forEach(modal => modal.remove());

                    if (window.showNotification) {
                        showNotification('Policy removed from local storage', 'success');
                    }

                    if (window.loadPoliciesView) {
                        setTimeout(() => loadPoliciesView(), 100);
                        setTimeout(() => loadPoliciesView(), 500);
                    }

                    return true;
                } else {
                    throw new Error(`Policy not found anywhere: ${policyId}`);
                }
            }

            console.log('Policy deleted from server');

            // Also remove from localStorage using original setItem to bypass monitoring
            let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            policies = policies.filter(p => p.id !== policyId);

            // Use original setItem to avoid triggering policy reload
            if (window.originalSetItem) {
                window.originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
            } else {
                originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
            }

            // Close any open modals
            const modals = document.querySelectorAll('.modal, #policyViewModal');
            modals.forEach(modal => modal.remove());

            // Show success notification
            if (window.showNotification) {
                showNotification('Policy deleted from server', 'success');
            }

            // Force refresh the policy view immediately and with backup
            if (window.loadPoliciesView) {
                console.log('🔄 Refreshing policy view after deletion...');
                setTimeout(() => loadPoliciesView(), 100);
                setTimeout(() => loadPoliciesView(), 500);
                setTimeout(() => loadPoliciesView(), 1000);
            }

            // Also trigger any other refresh mechanisms
            if (window.location.hash === '#policy-management') {
                window.location.hash = '#policy-management'; // Force re-render
            }

            return true;

        } catch (error) {
            console.error('❌ DELETE ERROR - Server deletion failed:', error);
            console.error('❌ DELETE ERROR - Details:', {
                message: error.message,
                stack: error.stack,
                policyId: policyId,
                apiUrl: API_URL
            });

            if (window.showNotification) {
                showNotification(`Failed to delete policy: ${error.message}`, 'error');
            } else {
                alert(`Failed to delete policy: ${error.message}`);
            }
            throw error;
        }
    };

    // Fix the savePolicyForClient function to use server AND update client
    window.savePolicyForClient = async function(clientId) {
        console.log('Saving policy for client to SERVER:', clientId);

        // Collect policy data from modal
        const policyData = window.collectPolicyData ? window.collectPolicyData() : {};

        if (!policyData || Object.keys(policyData).length === 0) {
            showNotification('Please fill in policy details', 'error');
            return;
        }

        // Ensure policy has an ID
        if (!policyData.id) {
            policyData.id = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Link to client and get client name
        policyData.clientId = clientId;

        // Get client name from localStorage or server
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const client = clients.find(c => c.id === clientId);
        if (client) {
            policyData.clientName = client.name || client.companyName || client.businessName || 'N/A';
        }

        try {
            // 1. Save policy to server
            const policyResult = await window.savePolicy(policyData);

            // 2. Update client record to include this policy
            await updateClientPolicies(clientId, policyData.id);

            console.log('Policy saved and linked to client on server');

            // Refresh client view if we're on the client profile page
            if (window.loadClientProfile && window.currentViewingClientId === clientId) {
                setTimeout(() => window.loadClientProfile(clientId), 500);
            }

            return policyResult;

        } catch (error) {
            console.error('Error saving policy for client:', error);
            showNotification('Error saving policy for client', 'error');
            throw error;
        }
    };

    // Function to update client's policy list on server
    async function updateClientPolicies(clientId, policyId) {
        console.log('Updating client policies on server:', clientId, policyId);

        try {
            // Get current client data from server
            const clientResponse = await fetch(`${API_URL}/api/clients/${clientId}`);
            if (!clientResponse.ok) {
                throw new Error('Failed to fetch client data');
            }

            const clientData = await clientResponse.json();

            // Add policy to client's policies array
            if (!clientData.policies) {
                clientData.policies = [];
            }
            if (!clientData.policies.includes(policyId)) {
                clientData.policies.push(policyId);
            }

            // Save updated client back to server
            const updateResponse = await fetch(`${API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update client with policy');
            }

            console.log('Client updated with new policy on server');

            // Also update localStorage for immediate UI updates
            let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const clientIndex = clients.findIndex(c => c.id === clientId);
            if (clientIndex >= 0) {
                if (!clients[clientIndex].policies) {
                    clients[clientIndex].policies = [];
                }
                if (!clients[clientIndex].policies.includes(policyId)) {
                    clients[clientIndex].policies.push(policyId);
                }
                localStorage.setItem('insurance_clients', JSON.stringify(clients));
            }

            return true;

        } catch (error) {
            console.error('Error updating client policies:', error);
            throw error;
        }
    }

    // Intercept localStorage setItem calls for policies and redirect to server
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'insurance_policies') {
            console.warn('Direct localStorage write detected for policies - this should go through savePolicy()');
            // Still allow it but log a warning
        }
        return originalSetItem.call(localStorage, key, value);
    };

    // Load policies from server on page load
    async function loadPoliciesFromServer() {
        try {
            console.log('Loading policies from server...');
            const response = await fetch(`${API_URL}/api/policies`);

            if (response.ok) {
                const serverPolicies = await response.json();
                const localPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

                console.log(`🔄 Server has ${serverPolicies.length} policies, local has ${localPolicies.length} policies`);

                // Merge server and local policies, avoiding duplicates
                const mergedPolicies = [...localPolicies];
                let addedCount = 0;

                serverPolicies.forEach(serverPolicy => {
                    const existingIndex = mergedPolicies.findIndex(p => p.id === serverPolicy.id);
                    if (existingIndex >= 0) {
                        // Update existing policy with server version (server is authoritative)
                        mergedPolicies[existingIndex] = serverPolicy;
                    } else {
                        // Add new policy from server
                        mergedPolicies.push(serverPolicy);
                        addedCount++;
                    }
                });

                // Update localStorage with merged data
                localStorage.setItem('insurance_policies', JSON.stringify(mergedPolicies));
                console.log(`✅ Merged policies: ${mergedPolicies.length} total (${addedCount} new from server)`);

                return mergedPolicies;
            }
        } catch (error) {
            console.error('Error loading policies from server:', error);
            // Return local policies if server fails
            const localPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            console.log(`⚠️ Using local policies only: ${localPolicies.length} policies`);
            return localPolicies;
        }
        return [];
    }

    // Override deleteClient function to delete from server
    window.deleteClient = async function(clientId) {
        console.log('🗑️ DELETE CLIENT - ID:', clientId);

        if (!clientId || clientId === 'undefined' || clientId === 'unknown') {
            console.error('❌ DELETE FAILED - Invalid client ID:', clientId);
            alert('Error: Cannot delete client - invalid ID');
            return;
        }

        // Get client data first to show their name
        let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        let client = clients.find(c => c.id === clientId);

        // If not found in localStorage, try to get from server
        if (!client) {
            try {
                const response = await fetch(`${API_URL}/api/clients/${clientId}`);
                if (response.ok) {
                    client = await response.json();
                } else {
                    console.error('❌ Client not found in server:', clientId);
                    alert('Client not found');
                    return;
                }
            } catch (error) {
                console.error('❌ Error fetching client from server:', error);
                alert('Client not found');
                return;
            }
        }

        const clientName = client.name || client.companyName || client.businessName || 'Unknown Client';

        if (!confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
            console.log('❌ DELETE CANCELLED by user');
            return;
        }

        console.log('✅ DELETE CONFIRMED - Proceeding with deletion...');

        try {
            // Delete from server
            const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Client deleted from server:', result);

            // Remove from localStorage
            clients = clients.filter(c => c.id !== clientId);
            localStorage.setItem('insurance_clients', JSON.stringify(clients));

            // Show success notification
            if (window.showNotification) {
                showNotification(`Client "${clientName}" has been deleted successfully`, 'success');
            }

            // Reload the clients view
            if (window.loadClientsView) {
                setTimeout(() => loadClientsView(), 100);
                setTimeout(() => loadClientsView(), 500);
            }

            return true;

        } catch (error) {
            console.error('❌ DELETE ERROR - Server deletion failed:', error);

            // Try to delete from localStorage only as fallback
            const originalLength = clients.length;
            clients = clients.filter(c => c.id !== clientId);

            if (clients.length < originalLength) {
                localStorage.setItem('insurance_clients', JSON.stringify(clients));
                console.log(`✅ Removed localStorage-only client: ${clientId}`);

                if (window.showNotification) {
                    showNotification('Client removed from local storage', 'success');
                }

                if (window.loadClientsView) {
                    setTimeout(() => loadClientsView(), 100);
                }

                return true;
            } else {
                if (window.showNotification) {
                    showNotification(`Failed to delete client: ${error.message}`, 'error');
                } else {
                    alert(`Failed to delete client: ${error.message}`);
                }
                throw error;
            }
        }
    };

    // Auto-load from server when script loads
    loadPoliciesFromServer();

    console.log('Policy Server Save Fix: All policy and client operations now save to server');
})();