/**
 * Mock Lead Generator - Creates realistic insurance leads locally
 * Replaces API calls with local generation
 */

(function() {
    // Sample data pools
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const companies = ['Tech Solutions Inc', 'Global Services LLC', 'Premier Industries', 'Advanced Systems Corp', 'Digital Innovations', 'Strategic Partners', 'Enterprise Group', 'Professional Services', 'Business Solutions', 'Corporate Systems'];
    const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
    const products = ['Auto Insurance', 'Home Insurance', 'Life Insurance', 'Commercial Auto', 'Business Insurance', 'Health Insurance', 'Renters Insurance', 'Umbrella Policy'];
    const sources = ['Website', 'Social Media', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show', 'Partner', 'Direct Mail'];
    
    // Generate random phone
    function generatePhone() {
        const area = Math.floor(Math.random() * 900) + 100;
        const prefix = Math.floor(Math.random() * 900) + 100;
        const line = Math.floor(Math.random() * 9000) + 1000;
        return `(${area}) ${prefix}-${line}`;
    }
    
    // Generate random email
    function generateEmail(firstName, lastName) {
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.net'];
        const formats = [
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}`
        ];
        const format = formats[Math.floor(Math.random() * formats.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${format}@${domain}`;
    }
    
    // Generate a single lead
    function generateLead() {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const hasCompany = Math.random() > 0.5;
        const product = products[Math.floor(Math.random() * products.length)];
        const isCommercial = product.includes('Commercial') || product.includes('Business');
        
        // Calculate premium based on product type
        let premiumMin, premiumMax;
        if (product.includes('Life')) {
            premiumMin = 50;
            premiumMax = 500;
        } else if (isCommercial) {
            premiumMin = 500;
            premiumMax = 5000;
        } else if (product.includes('Home')) {
            premiumMin = 100;
            premiumMax = 400;
        } else if (product.includes('Auto')) {
            premiumMin = 100;
            premiumMax = 300;
        } else {
            premiumMin = 50;
            premiumMax = 250;
        }
        
        const premium = Math.floor(Math.random() * (premiumMax - premiumMin) + premiumMin);
        
        // Generate renewal date (random date in next 12 months)
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + Math.floor(Math.random() * 365));
        
        // Determine stage based on criteria
        const stages = ['new', 'contacted', 'quoted', 'negotiating'];
        const stage = stages[Math.floor(Math.random() * stages.length)];
        
        // Determine priority
        const priorities = ['low', 'medium', 'high'];
        let priority = 'medium';
        if (premium > 1000) priority = 'high';
        else if (premium < 200) priority = 'low';
        
        return {
            id: `LEAD_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: `${firstName} ${lastName}`,
            contact: `${firstName} ${lastName}`,
            company: hasCompany || isCommercial ? companies[Math.floor(Math.random() * companies.length)] : '',
            email: generateEmail(firstName, lastName),
            phone: generatePhone(),
            product: product,
            premium: premium,
            stage: stage,
            priority: priority,
            renewalDate: renewalDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
            assignedTo: 'Unassigned',
            source: sources[Math.floor(Math.random() * sources.length)],
            state: states[Math.floor(Math.random() * states.length)],
            createdAt: new Date().toISOString(),
            created: new Date().toLocaleDateString(),
            notes: [],
            activities: [],
            lastContact: null
        };
    }
    
    // Override the API service generateLeads function
    window.mockGenerateLeads = function(criteria) {
        console.log('Mock generating leads with criteria:', criteria);
        
        const count = criteria.count || 10;
        const leads = [];
        
        for (let i = 0; i < count; i++) {
            const lead = generateLead();
            
            // Apply filters if specified
            if (criteria.state && criteria.state !== 'all') {
                lead.state = criteria.state;
            }
            
            if (criteria.product && criteria.product !== 'all') {
                lead.product = criteria.product;
            }
            
            if (criteria.minPremium) {
                lead.premium = Math.max(lead.premium, parseInt(criteria.minPremium));
            }
            
            if (criteria.source && criteria.source !== 'all') {
                lead.source = criteria.source;
            }
            
            leads.push(lead);
        }
        
        // Save to localStorage
        const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const allLeads = [...existingLeads, ...leads];
        localStorage.setItem('leads', JSON.stringify(allLeads));
        
        console.log(`Generated ${leads.length} mock leads`);
        
        return {
            success: true,
            total: leads.length,
            leads: leads
        };
    };
    
    // Override the API service method
    if (window.apiService) {
        const originalGenerateLeads = window.apiService.generateLeads;
        
        window.apiService.generateLeads = async function(criteria) {
            try {
                // Try the API first
                return await originalGenerateLeads.call(this, criteria);
            } catch (error) {
                console.log('API failed, using mock generator:', error.message);
                // Fall back to mock generator
                return window.mockGenerateLeads(criteria);
            }
        };
    }
    
    console.log('✅ Mock lead generator loaded - will activate if API fails');
})();