// Fix Policy Data Contamination Script
console.log('=== POLICY DATA FIX SCRIPT ===');

function fixPolicyData() {
    try {
        // Get current data
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        
        console.log('Current policies count:', policies.length);
        console.log('Current clients count:', clients.length);
        
        // Log current state for debugging
        console.log('\n=== CURRENT POLICIES ===');
        policies.forEach(p => {
            console.log(`Policy: ${p.policyNumber || p.id} - Client: ${p.clientName || 'Unknown'} - Type: ${p.policyType || 'Unknown'}`);
        });
        
        console.log('\n=== CURRENT CLIENTS ===');
        clients.forEach(c => {
            console.log(`Client: ${c.name || c.id} - Policies: ${c.policies ? c.policies.length : 0}`);
            if (c.policies) {
                c.policies.forEach(p => {
                    console.log(`  - Policy: ${p.policyNumber || 'Unknown'}`);
                });
            }
        });
        
        // Find Du Road and Adam 1 data
        const duRoadClient = clients.find(c => c.name && c.name.toLowerCase().includes('du road'));
        const adam1Client = clients.find(c => c.name && c.name.toLowerCase().includes('adam'));
        
        console.log('\n=== IDENTIFIED CLIENTS ===');
        console.log('Du Road Client:', duRoadClient ? duRoadClient.name : 'Not found');
        console.log('Adam 1 Client:', adam1Client ? adam1Client.name : 'Not found');
        
        // Find policies that might be mixed up
        const duRoadPolicies = policies.filter(p => 
            (p.clientName && p.clientName.toLowerCase().includes('du road')) ||
            (p.client_name && p.client_name.toLowerCase().includes('du road'))
        );
        
        const adam1Policies = policies.filter(p => 
            (p.clientName && p.clientName.toLowerCase().includes('adam')) ||
            (p.client_name && p.client_name.toLowerCase().includes('adam'))
        );
        
        console.log('\n=== POLICY ASSIGNMENTS ===');
        console.log('Du Road policies found:', duRoadPolicies.length);
        console.log('Adam 1 policies found:', adam1Policies.length);
        
        // Fix the contamination
        let fixed = false;
        
        // Check if Adam 1's policy data is showing under Du Road
        if (duRoadClient && duRoadClient.policies) {
            const contaminatedPolicies = duRoadClient.policies.filter(p => {
                // Check if this policy actually belongs to Adam 1
                const policyDetails = policies.find(pol => 
                    pol.policyNumber === p.policyNumber || 
                    pol.id === p.id || 
                    String(pol.id) === String(p.id)
                );
                
                if (policyDetails) {
                    const clientName = policyDetails.clientName || policyDetails.client_name || '';
                    if (clientName.toLowerCase().includes('adam')) {
                        console.log(`Found Adam 1 policy in Du Road client: ${p.policyNumber}`);
                        return true;
                    }
                }
                return false;
            });
            
            if (contaminatedPolicies.length > 0) {
                // Remove Adam 1 policies from Du Road
                duRoadClient.policies = duRoadClient.policies.filter(p => {
                    const policyDetails = policies.find(pol => 
                        pol.policyNumber === p.policyNumber || 
                        pol.id === p.id || 
                        String(pol.id) === String(p.id)
                    );
                    
                    if (policyDetails) {
                        const clientName = policyDetails.clientName || policyDetails.client_name || '';
                        return !clientName.toLowerCase().includes('adam');
                    }
                    return true;
                });
                
                fixed = true;
                console.log('Removed contaminated policies from Du Road client');
            }
        }
        
        // Ensure Adam 1's policies are properly linked to Adam 1
        if (adam1Client && adam1Policies.length > 0) {
            adam1Client.policies = adam1Policies.map(p => ({
                id: p.id,
                policyNumber: p.policyNumber,
                policyType: p.policyType,
                carrier: p.carrier,
                effectiveDate: p.effectiveDate,
                expirationDate: p.expirationDate,
                premium: p.premium
            }));
            
            fixed = true;
            console.log('Updated Adam 1 client with correct policies');
        }
        
        // Fix policy client names
        policies.forEach(policy => {
            // Check if policy client name doesn't match its actual assignment
            const assignedClient = clients.find(c => 
                c.policies && c.policies.some(p => 
                    p.policyNumber === policy.policyNumber || 
                    p.id === policy.id || 
                    String(p.id) === String(policy.id)
                )
            );
            
            if (assignedClient && policy.clientName !== assignedClient.name) {
                console.log(`Fixing policy ${policy.policyNumber}: ${policy.clientName} -> ${assignedClient.name}`);
                policy.clientName = assignedClient.name;
                policy.client_name = assignedClient.name;
                fixed = true;
            }
        });
        
        if (fixed) {
            // Save the fixed data
            localStorage.setItem('insurance_policies', JSON.stringify(policies));
            localStorage.setItem('insurance_clients', JSON.stringify(clients));
            
            console.log('\n=== DATA FIXED AND SAVED ===');
            console.log('Please refresh the page to see the changes');
            
            return true;
        } else {
            console.log('\n=== NO ISSUES FOUND ===');
            console.log('Data appears to be correctly structured');
            return false;
        }
        
    } catch (error) {
        console.error('Error fixing policy data:', error);
        return false;
    }
}

// Add function to window for manual execution
window.fixPolicyData = fixPolicyData;

// Auto-run the fix
console.log('Running automatic policy data fix...');
const wasFixed = fixPolicyData();

if (wasFixed) {
    console.log('\n📍 ACTION REQUIRED: Please refresh the page now to see the corrected data');
    // Notification removed - fix happens silently in the background
}

console.log('=== SCRIPT COMPLETE ===');
