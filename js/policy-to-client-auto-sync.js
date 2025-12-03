// Policy to Client Auto-Sync System
// Automatically creates and updates client records based on policy Named Insured data
// Similar to how COI management works - pulls from policy data

console.log('Policy-to-Client Auto-Sync System: Loading...');

(function() {
    // API endpoint configuration
    const API_URL = window.VANGUARD_API_URL || `http://${window.location.hostname}:3001`;

    // Function to extract client info from policy Named Insured data
    function extractClientFromPolicy(policyData) {
        if (!policyData) return null;

        // Extract from policy insured section - "Named Insured Information"
        const insuredName = policyData.insured?.['Name/Business Name'] ||
                           policyData.insured?.name ||
                           policyData.insuredName ||
                           policyData.clientName;

        if (!insuredName) {
            console.warn('No Named Insured found in policy:', policyData.id || policyData.policyNumber);
            return null;
        }

        // Extract contact information
        const contactInfo = policyData.contact || {};
        const phoneNumber = contactInfo['Phone Number'] ||
                           contactInfo.phone ||
                           policyData.phone ||
                           '';

        const email = contactInfo['Email Address'] ||
                     contactInfo.email ||
                     policyData.email ||
                     '';

        // Build address from contact section
        const address = [
            contactInfo['Mailing Address'] || contactInfo.address || '',
            contactInfo.City || contactInfo.city || '',
            contactInfo.State || contactInfo.state || '',
            contactInfo['ZIP Code'] || contactInfo.zip || ''
        ].filter(Boolean).join(', ');

        // Extract DOT number from overview or other sections
        const dotNumber = policyData.overview?.['DOT Number'] ||
                         policyData.dotNumber ||
                         '';

        // Generate client ID based on policy
        const clientId = `client_${policyData.id || policyData.policyNumber}_auto`;

        return {
            id: clientId,
            name: insuredName.trim(),
            contactName: insuredName.trim(),
            phone: phoneNumber.replace(/[^\d-()+ ]/g, ''), // Clean phone format
            email: email.trim(),
            address: address.trim(),
            dotNumber: dotNumber,
            type: 'Commercial',
            insuranceCarrier: policyData.carrier || policyData.overview?.Carrier || '',
            policyExpiryDate: policyData.expirationDate || policyData.overview?.['Expiration Date'] || '',
            state: contactInfo.State || contactInfo.state || 'OH',
            createdAt: new Date().toISOString(),
            source: 'Auto-Generated from Policy Named Insured',
            status: 'Active Client',
            quotes: [],
            policies: [policyData.id || policyData.policyNumber],
            totalPremium: parseFloat(policyData.premium?.replace(/[^\d.]/g, '') || 0),
            activities: [{
                type: 'policy_linked',
                description: `Policy ${policyData.id || policyData.policyNumber} automatically linked`,
                date: new Date().toISOString()
            }],
            notes: `Auto-generated from Policy ${policyData.id || policyData.policyNumber} Named Insured: ${insuredName}`
        };
    }

    // Function to create or update client from policy data
    async function syncClientFromPolicy(policyData) {
        console.log('Syncing client from policy Named Insured:', policyData.id || policyData.policyNumber);

        try {
            const clientData = extractClientFromPolicy(policyData);
            if (!clientData) {
                console.warn('Could not extract client data from policy');
                return null;
            }

            // Check if client already exists by phone number (primary identifier)
            let existingClient = null;
            if (clientData.phone) {
                const searchResponse = await fetch(`${API_URL}/api/clients/search?phone=${encodeURIComponent(clientData.phone.replace(/[^\d]/g, ''))}`);
                if (searchResponse.ok) {
                    const searchResult = await searchResponse.json();
                    existingClient = searchResult.client;
                }
            }

            if (existingClient) {
                console.log('Updating existing client:', existingClient.id);

                // Update existing client with policy information
                existingClient.name = clientData.name; // Update name from policy
                existingClient.contactName = clientData.contactName;
                existingClient.email = existingClient.email || clientData.email; // Keep existing email if present
                existingClient.address = clientData.address || existingClient.address;
                existingClient.dotNumber = clientData.dotNumber || existingClient.dotNumber;
                existingClient.insuranceCarrier = clientData.insuranceCarrier || existingClient.insuranceCarrier;
                existingClient.policyExpiryDate = clientData.policyExpiryDate || existingClient.policyExpiryDate;

                // Add policy to policies array if not already present
                if (!existingClient.policies) existingClient.policies = [];
                const policyId = policyData.id || policyData.policyNumber;
                if (!existingClient.policies.includes(policyId)) {
                    existingClient.policies.push(policyId);
                }

                // Update notes
                existingClient.notes = existingClient.notes || '';
                if (!existingClient.notes.includes(policyId)) {
                    existingClient.notes += `\nLinked to Policy ${policyId} - ${clientData.name}`;
                }

                // Save updated client
                const updateResponse = await fetch(`${API_URL}/api/clients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(existingClient)
                });

                if (updateResponse.ok) {
                    console.log('Client updated successfully:', existingClient.id);
                    return existingClient;
                } else {
                    console.error('Failed to update client');
                    return null;
                }
            } else {
                console.log('Creating new client from policy Named Insured');

                // Create new client
                const createResponse = await fetch(`${API_URL}/api/clients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });

                if (createResponse.ok) {
                    console.log('Client created successfully:', clientData.id);
                    return clientData;
                } else {
                    console.error('Failed to create client');
                    return null;
                }
            }
        } catch (error) {
            console.error('Error syncing client from policy:', error);
            return null;
        }
    }

    // Override the policy save functions to automatically sync client data
    const originalSavePolicy = window.savePolicy;
    if (originalSavePolicy) {
        window.savePolicy = async function(policyData) {
            console.log('Auto-sync: Policy save detected, syncing client from Named Insured');

            // If no policyData provided, let the original savePolicy collect it
            let result;

            if (policyData) {
                // We have policy data, pass it along
                result = await originalSavePolicy(policyData);
            } else {
                // No policy data provided - let original function collect from form
                result = await originalSavePolicy();

                // If the result contains policy data, use it for syncing
                if (result && typeof result === 'object' && result.id) {
                    policyData = result;
                }
            }

            // Then sync the client from the policy Named Insured data
            if (result && policyData) {
                await syncClientFromPolicy(policyData);
            }

            return result;
        };
    }

    // Function to manually sync a specific policy
    window.syncClientFromPolicyById = async function(policyId) {
        try {
            // Get the policy data
            const policiesResponse = await fetch(`${API_URL}/api/policies`);
            if (!policiesResponse.ok) {
                console.error('Failed to fetch policies');
                return null;
            }

            const policies = await policiesResponse.json();
            const policy = policies.find(p => p.id === policyId || p.policyNumber === policyId);

            if (!policy) {
                console.error('Policy not found:', policyId);
                return null;
            }

            return await syncClientFromPolicy(policy);
        } catch (error) {
            console.error('Error syncing client from policy ID:', error);
            return null;
        }
    };

    // Function to sync all policies with client records
    window.syncAllPoliciesWithClients = async function() {
        try {
            console.log('Syncing all policies with client records...');

            const policiesResponse = await fetch(`${API_URL}/api/policies`);
            if (!policiesResponse.ok) {
                console.error('Failed to fetch policies');
                return;
            }

            const policies = await policiesResponse.json();
            let synced = 0;

            for (const policy of policies) {
                const result = await syncClientFromPolicy(policy);
                if (result) synced++;
            }

            console.log(`Synced ${synced} out of ${policies.length} policies with client records`);

            if (window.showNotification) {
                showNotification(`Synced ${synced} policies with client records`, 'success');
            }

        } catch (error) {
            console.error('Error syncing all policies:', error);
        }
    };

    // Make functions globally available
    window.syncClientFromPolicy = syncClientFromPolicy;
    window.extractClientFromPolicy = extractClientFromPolicy;

    console.log('Policy-to-Client Auto-Sync System: Ready');
    console.log('Available functions:');
    console.log('- syncClientFromPolicyById(policyId) - Sync specific policy');
    console.log('- syncAllPoliciesWithClients() - Sync all policies');
    console.log('- Policy saves now automatically sync client records');
})();