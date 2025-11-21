// FMCSA Insurance Data Lead Generator
// Uses the insurance-specific API endpoint for generating leads with active insurance data
(function() {
    console.log('🎯 FMCSA Insurance Lead Generator initializing...');
    
    // FMCSA Insurance API endpoint
    const INSURANCE_API_URL = 'https://data.transportation.gov/resource/ypjt-5ydn.json';
    const CARRIER_API_URL = 'https://data.transportation.gov/resource/az4n-8mr2.json';
    
    // Function to fetch insurance data with filters
    async function fetchInsuranceLeads(filters = {}) {
        try {
            let query = INSURANCE_API_URL + '?';
            const params = [];
            
            // Add limit (default to 100)
            params.push(`$limit=${filters.limit || 100}`);
            
            // Add offset for pagination
            if (filters.offset) {
                params.push(`$offset=${filters.offset}`);
            }
            
            // Filter by insurance type if specified
            if (filters.insuranceType) {
                params.push(`ins_type_code=${filters.insuranceType}`);
            }
            
            // Filter by coverage amount if specified
            if (filters.minCoverage) {
                params.push(`$where=max_cov_amount>='${filters.minCoverage}'`);
            }
            
            // Sort by effective date (most recent first)
            params.push('$order=effective_date DESC');
            
            query += params.join('&');
            
            console.log('Fetching insurance leads from:', query);
            const response = await fetch(query);
            
            if (!response.ok) {
                console.error('Failed to fetch insurance data:', response.status);
                return [];
            }
            
            const insuranceData = await response.json();
            
            // Now we need to match these with carrier data to get contact info
            const leadsWithCarrierInfo = [];
            
            for (const insurance of insuranceData) {
                // Extract DOT number from prefix_docket_number if available
                const docketNumber = insurance.prefix_docket_number;
                
                if (docketNumber) {
                    // Try to fetch carrier info
                    const carrierInfo = await fetchCarrierByDocket(docketNumber);
                    
                    if (carrierInfo) {
                        leadsWithCarrierInfo.push({
                            ...insurance,
                            carrier: carrierInfo
                        });
                    }
                }
            }
            
            return leadsWithCarrierInfo;
        } catch (error) {
            console.error('Error fetching insurance leads:', error);
            return [];
        }
    }
    
    // Function to fetch carrier information by docket number
    async function fetchCarrierByDocket(docketNumber) {
        try {
            // Remove prefix letters if present
            const cleanDocket = docketNumber.replace(/^[A-Z]+/, '');
            
            // Try to fetch by DOT number (many docket numbers correspond to DOT numbers)
            const response = await fetch(`${CARRIER_API_URL}?dot_number=${cleanDocket}&$limit=1`);
            
            if (!response.ok) {
                return null;
            }
            
            const data = await response.json();
            return data[0] || null;
        } catch (error) {
            console.error('Error fetching carrier data:', error);
            return null;
        }
    }
    
    // Function to generate leads from insurance data
    async function generateInsuranceLeads(options = {}) {
        console.log('📊 Generating insurance-based leads...');
        
        const filters = {
            limit: options.limit || 50,
            offset: options.offset || 0,
            insuranceType: options.insuranceType || null,
            minCoverage: options.minCoverage || null
        };
        
        const insuranceLeads = await fetchInsuranceLeads(filters);
        
        // Convert to lead format
        const leads = insuranceLeads.map(item => {
            const carrier = item.carrier || {};
            
            return {
                id: `ins_lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                
                // Company information
                name: carrier.legal_name || carrier.dba_name || 'Unknown Carrier',
                dotNumber: carrier.dot_number || item.prefix_docket_number,
                
                // Contact information
                phone: carrier.phone ? formatPhone(carrier.phone) : '',
                email: carrier.email_address || '',
                
                // Address
                address: carrier.phy_street || '',
                city: carrier.phy_city || '',
                state: carrier.phy_state || '',
                zipCode: carrier.phy_zip || '',
                
                // Insurance information
                insuranceInfo: {
                    policyNumber: item.policy_no,
                    insuranceCompany: item.name_company,
                    effectiveDate: item.effective_date,
                    coverageAmount: formatCoverageAmount(item.max_cov_amount),
                    insuranceType: getInsuranceTypeName(item.ins_type_code),
                    insuranceClass: getInsuranceClassName(item.ins_class_code),
                    formCode: item.ins_form_code
                },
                
                // Carrier details
                carrierOperation: carrier.carrier_operation || '',
                powerUnits: carrier.power_units || 0,
                drivers: carrier.total_drivers || 0,
                
                // Lead metadata
                source: 'FMCSA Insurance API',
                stage: 'new',
                type: 'Commercial Auto',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                
                // Additional carrier info if available
                safetyRating: carrier.safety_rating || '',
                operatingStatus: carrier.operating_status || carrier.status_code || '',
                mcs150Date: carrier.mcs150_date || '',
                
                // Notes
                notes: `Insurance Policy: ${item.policy_no} with ${item.name_company}. Coverage: $${formatCoverageAmount(item.max_cov_amount)}. Effective: ${item.effective_date}`
            };
        });
        
        return leads;
    }
    
    // Helper function to format phone numbers
    function formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.substr(0, 3)}) ${cleaned.substr(3, 3)}-${cleaned.substr(6)}`;
        }
        return phone;
    }
    
    // Helper function to format coverage amount
    function formatCoverageAmount(amount) {
        if (!amount) return '0';
        // Amount is typically in thousands
        const numAmount = parseInt(amount) * 1000;
        return numAmount.toLocaleString();
    }
    
    // Helper function to get insurance type name
    function getInsuranceTypeName(code) {
        const types = {
            '1': 'Liability',
            '2': 'Cargo',
            '3': 'Bond',
            '4': 'Trust Fund',
            '5': 'Other'
        };
        return types[code] || `Type ${code}`;
    }
    
    // Helper function to get insurance class name
    function getInsuranceClassName(code) {
        const classes = {
            'P': 'Primary',
            'E': 'Excess',
            'U': 'Umbrella',
            'S': 'Self-Insurance'
        };
        return classes[code] || `Class ${code}`;
    }
    
    // Function to add insurance leads to the system
    async function addInsuranceLeadsToSystem(options = {}) {
        console.log('🚀 Adding insurance leads to the system...');
        
        // Generate leads
        const newLeads = await generateInsuranceLeads(options);
        
        if (newLeads.length === 0) {
            console.log('No insurance leads found with the specified criteria');
            return [];
        }
        
        // Get existing leads
        const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        // Filter out duplicates (by DOT number)
        const existingDOTs = new Set(existingLeads.map(l => l.dotNumber).filter(Boolean));
        const uniqueNewLeads = newLeads.filter(lead => !existingDOTs.has(lead.dotNumber));
        
        // Add new leads
        const updatedLeads = [...existingLeads, ...uniqueNewLeads];
        
        // Save to localStorage
        localStorage.setItem('leads', JSON.stringify(updatedLeads));
        
        console.log(`✅ Added ${uniqueNewLeads.length} new insurance-based leads`);
        console.log(`   (${newLeads.length - uniqueNewLeads.length} duplicates skipped)`);
        
        // Refresh the view if on leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }
        
        return uniqueNewLeads;
    }
    
    // Expose functions globally
    window.generateInsuranceLeads = generateInsuranceLeads;
    window.addInsuranceLeadsToSystem = addInsuranceLeadsToSystem;
    window.fetchInsuranceLeads = fetchInsuranceLeads;
    
    // Add UI button for generating insurance leads
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on the leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            setTimeout(() => {
                const headerActions = document.querySelector('.header-actions');
                if (headerActions && !document.getElementById('generate-insurance-leads-btn')) {
                    const generateButton = document.createElement('button');
                    generateButton.id = 'generate-insurance-leads-btn';
                    generateButton.className = 'btn-primary';
                    generateButton.innerHTML = '<i class="fas fa-shield-alt"></i> Generate Insurance Leads';
                    generateButton.onclick = async function() {
                        this.disabled = true;
                        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
                        
                        try {
                            const leads = await addInsuranceLeadsToSystem({
                                limit: 25,
                                minCoverage: '01000' // $1M minimum coverage
                            });
                            
                            this.innerHTML = `<i class="fas fa-check"></i> Generated ${leads.length} Leads!`;
                            setTimeout(() => {
                                this.disabled = false;
                                this.innerHTML = '<i class="fas fa-shield-alt"></i> Generate Insurance Leads';
                            }, 3000);
                        } catch (error) {
                            console.error('Error generating leads:', error);
                            this.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error!';
                            setTimeout(() => {
                                this.disabled = false;
                                this.innerHTML = '<i class="fas fa-shield-alt"></i> Generate Insurance Leads';
                            }, 3000);
                        }
                    };
                    
                    headerActions.appendChild(generateButton);
                }
            }, 1000);
        }
    });
    
    console.log('✅ FMCSA Insurance Lead Generator initialized');
    console.log('   - Insurance API: https://data.transportation.gov/resource/ypjt-5ydn.json');
    console.log('   - 472,833 insurance records available');
    console.log('   - Use generateInsuranceLeads() to fetch leads');
    console.log('   - Use addInsuranceLeadsToSystem() to add leads to CRM');
})();