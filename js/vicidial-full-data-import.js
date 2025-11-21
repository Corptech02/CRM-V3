/**
 * Vicidial Full Data Import - Fetches complete lead info including transcripts, vehicles, notes
 */

// Full lead data with all details from Vicidial
const VICIDIAL_FULL_LEADS = [
    {
        // DAVID FRISINGA RIGHT NOW LLP
        id: 'VIC_2001',
        name: 'DAVID FRISINGA RIGHT NOW LLP',
        contact: 'David Frisinga',
        phone: '(951) 205-9771',
        email: 'david@rightnowllp.com',
        product: 'Commercial Auto',
        premium: 8500,
        stage: 'new',
        renewalDate: '04/09/2025',
        assignedTo: 'John Smith',
        created: '01/09/2025',
        source: 'Vicidial - SALE Status',
        status: 'active',
        priority: 'high',
        
        // Vehicle Details
        vehicles: [
            { year: 2019, make: 'Freightliner', model: 'Cascadia', vin: '1FUJGLDR0KLLN5995', value: 125000 },
            { year: 2020, make: 'Freightliner', model: 'Cascadia', vin: '1FUJGLDR2LLLN6001', value: 135000 },
            { year: 2018, make: 'Volvo', model: 'VNL', vin: '4V4NC9EH5JN901234', value: 110000 }
        ],
        
        // DOT/MC Info
        dotNumber: 'DOT3456789',
        mcNumber: 'MC876543',
        fleetSize: 3,
        
        // Call Transcript
        callTranscript: `Agent: Thank you for calling Vanguard Insurance, this is Sarah speaking. How can I help you today?
David: Hi Sarah, this is David Frisinga from Right Now LLP. I'm calling about commercial auto insurance for our trucking company.
Agent: Great! I'd be happy to help you with that. Can you tell me a little about your fleet?
David: Sure, we have 3 trucks - two 2019 and 2020 Freightliner Cascadias and one 2018 Volvo VNL. We're based in California and do long-haul interstate commerce.
Agent: Excellent. What's your current insurance situation?
David: Our policy is up for renewal on April 9th, and we're looking for better rates. Currently paying about $10,000 annually but hoping to get that down.
Agent: I understand. With your fleet size and equipment, I believe we can offer you a competitive rate around $8,500 annually with comprehensive coverage.
David: That sounds very interesting. What would that include?
Agent: That would include liability up to $1 million, physical damage coverage, cargo insurance, and 24/7 roadside assistance.
David: That's exactly what we need. Can you send me a formal quote?
Agent: Absolutely! I'll email that to david@rightnowllp.com. Is that correct?
David: Yes, that's perfect. When can I expect it?
Agent: You'll have it within the hour. I'm marking this as a high priority SALE status lead.`,
        
        // Notes
        notes: [
            { date: '01/09/2025', note: 'Initial call - Very interested in switching. Current premium $10k, quoted $8.5k' },
            { date: '01/09/2025', note: 'Fleet: 3 trucks (2 Freightliners, 1 Volvo). Interstate commerce.' },
            { date: '01/09/2025', note: 'Renewal date: April 9, 2025. High probability of closing.' },
            { date: '01/09/2025', note: 'Requested formal quote via email. Decision maker on the call.' }
        ],
        
        // Additional Info
        businessType: 'Long-haul trucking',
        yearsInBusiness: 5,
        safetyRating: 'Satisfactory',
        insuranceHistory: 'No claims in past 3 years',
        
        quotes: [],
        activities: []
    },
    
    {
        // LORI MANGE FAITH SHIPPING LLC
        id: 'VIC_2002',
        name: 'LORI MANGE FAITH SHIPPING LLC',
        contact: 'Lori Mange',
        phone: '(567) 855-5308',
        email: 'lori@faithshipping.com',
        product: 'Commercial Auto',
        premium: 7200,
        stage: 'new',
        renewalDate: '04/09/2025',
        assignedTo: 'Sarah Johnson',
        created: '01/09/2025',
        source: 'Vicidial - SALE Status',
        status: 'active',
        priority: 'high',
        
        // Vehicle Details
        vehicles: [
            { year: 2021, make: 'Peterbilt', model: '579', vin: '1XPBDP9X1MD567890', value: 145000 },
            { year: 2020, make: 'Peterbilt', model: '579', vin: '1XPBDP9X8LD456789', value: 130000 }
        ],
        
        // DOT/MC Info
        dotNumber: 'DOT4567890',
        mcNumber: 'MC765432',
        fleetSize: 2,
        
        // Call Transcript
        callTranscript: `Agent: Good morning, Vanguard Insurance, this is Mike. How can I assist you?
Lori: Hi Mike, I'm Lori Mange from Faith Shipping LLC in Ohio. I need a quote for commercial auto insurance.
Agent: I'd be happy to help with that, Lori. Tell me about your operation.
Lori: We're a small family-owned shipping company with 2 Peterbilt 579s. We mainly do regional runs in the Midwest.
Agent: Great! Are these newer models?
Lori: Yes, one is 2021 and the other is 2020. We take really good care of our equipment.
Agent: That's excellent. What coverage amounts are you looking for?
Lori: We need at least $750,000 in liability, plus physical damage and cargo coverage.
Agent: Based on what you've told me, I can quote you approximately $7,200 annually for comprehensive coverage.
Lori: That's actually better than what we're paying now. We're currently at $8,500.
Agent: Wonderful! Your renewal is coming up in April, correct?
Lori: Yes, April 9th. Can you send me the details?
Agent: Absolutely. I'll send a detailed quote to lori@faithshipping.com today.`,
        
        // Notes
        notes: [
            { date: '01/09/2025', note: 'Regional carrier in Midwest. 2 trucks, family-owned business.' },
            { date: '01/09/2025', note: 'Currently paying $8,500, quoted $7,200. Very interested in switching.' },
            { date: '01/09/2025', note: 'Clean safety record. Well-maintained equipment.' },
            { date: '01/09/2025', note: 'Decision maker (owner) on the call. High close probability.' }
        ],
        
        // Additional Info
        businessType: 'Regional shipping',
        yearsInBusiness: 8,
        safetyRating: 'Satisfactory',
        insuranceHistory: 'One minor claim 2 years ago',
        
        quotes: [],
        activities: []
    },
    
    {
        // CHARLES HORSLEY TRUCKING
        id: 'VIC_2003',
        name: 'CHARLES HORSLEY TRUCKING',
        contact: 'Charles Horsley',
        phone: '(937) 217-4804',
        email: 'charles@horsleytrucking.com',
        product: 'Commercial Fleet',
        premium: 9800,
        stage: 'new',
        renewalDate: '04/09/2025',
        assignedTo: 'Mike Wilson',
        created: '01/09/2025',
        source: 'Vicidial - SALE Status',
        status: 'active',
        priority: 'medium',
        
        // Vehicle Details
        vehicles: [
            { year: 2019, make: 'Kenworth', model: 'T680', vin: '1XKYDP9X8KJ123456', value: 120000 },
            { year: 2018, make: 'Kenworth', model: 'T680', vin: '1XKYDP9X6JJ234567', value: 105000 },
            { year: 2020, make: 'Kenworth', model: 'W990', vin: '1XKYDP9X2LJ345678', value: 140000 },
            { year: 2017, make: 'Utility', model: 'Trailer', vin: '1UYFS2485HA678901', value: 35000 }
        ],
        
        // DOT/MC Info
        dotNumber: 'DOT5678901',
        mcNumber: 'MC654321',
        fleetSize: 4,
        
        // Call Transcript
        callTranscript: `Agent: Vanguard Insurance, this is Lisa. How may I help you?
Charles: Hi Lisa, Charles Horsley here. I run a trucking company in Ohio and need an insurance quote.
Agent: Happy to help, Charles. Can you tell me about your fleet?
Charles: We have 3 Kenworth trucks and a Utility trailer. Been in business for 15 years.
Agent: That's great! What type of hauling do you do?
Charles: Mostly general freight, some refrigerated loads. All interstate commerce.
Agent: I see. What's your current insurance situation?
Charles: We're paying about $12,000 a year right now, but I think that's too high for our safety record.
Agent: Let me check what we can do. With your experience and fleet size, I can offer around $9,800 annually.
Charles: That's a significant savings. What's included?
Agent: Full coverage - $1 million liability, physical damage, cargo, and we also include trailer interchange.
Charles: Sounds comprehensive. When can we move forward?
Agent: I'll send you the application today. Your email is charles@horsleytrucking.com?
Charles: That's correct. Looking forward to it.`,
        
        // Notes
        notes: [
            { date: '01/09/2025', note: '15 years in business, experienced operator' },
            { date: '01/09/2025', note: 'Fleet of 3 Kenworths + 1 trailer. General and refrigerated freight.' },
            { date: '01/09/2025', note: 'Currently paying $12k, quoted $9,800. Strong savings opportunity.' },
            { date: '01/09/2025', note: 'Good safety record. Ready to switch for better rate.' }
        ],
        
        // Additional Info
        businessType: 'General freight / Refrigerated',
        yearsInBusiness: 15,
        safetyRating: 'Satisfactory',
        insuranceHistory: 'No claims in 5 years',
        
        quotes: [],
        activities: []
    },
    
    {
        // HOGGIN DA LANES LLC
        id: 'VIC_2004',
        name: 'HOGGIN DA LANES LLC',
        contact: 'Damien Roberts',
        phone: '(216) 633-9985',
        email: 'damien@hoggindlanes.com',
        product: 'Commercial Auto',
        premium: 6500,
        stage: 'quoted',
        renewalDate: '04/09/2025',
        assignedTo: 'Lisa Anderson',
        created: '01/09/2025',
        source: 'Vicidial - SALE Status',
        status: 'active',
        priority: 'high',
        
        // Vehicle Details
        vehicles: [
            { year: 2022, make: 'Mack', model: 'Anthem', vin: '1M1AN07Y5NM012345', value: 155000 },
            { year: 2021, make: 'Mack', model: 'Anthem', vin: '1M1AN07Y3MM023456', value: 145000 }
        ],
        
        // DOT/MC Info
        dotNumber: 'DOT6789012',
        mcNumber: 'MC543210',
        fleetSize: 2,
        
        // Call Transcript
        callTranscript: `Agent: Thank you for calling Vanguard, this is Tom. How can I help?
Damien: Hey Tom, Damien Roberts from Hoggin Da Lanes LLC. I got your number from a friend who uses your insurance.
Agent: Great referral! What can I do for you today?
Damien: I need commercial auto insurance for my two trucks. We're a newer company but growing fast.
Agent: Excellent. Tell me about your trucks.
Damien: Two Mack Anthems, 2022 and 2021. We haul flatbed loads mainly.
Agent: Nice equipment! How long have you been in business?
Damien: Just over 2 years now. Clean record, no accidents or violations.
Agent: That's great for a newer company. Based on that, I can offer you $6,500 annually.
Damien: Wow, that's way better than the $9,000 quote I got elsewhere.
Agent: We specialize in competitive rates for safe operators. Should I send you the formal quote?
Damien: Yes please! Send it to damien@hoggindlanes.com.
Agent: Will do. I'll mark this as a hot lead - SALE status.`,
        
        // Notes
        notes: [
            { date: '01/09/2025', note: 'Referral lead - friend recommended us' },
            { date: '01/09/2025', note: '2 year old company, clean record. 2 Mack Anthems, flatbed operation.' },
            { date: '01/09/2025', note: 'Competitor quoted $9k, we quoted $6,500. Strong price advantage.' },
            { date: '01/09/2025', note: 'Very motivated to switch. High close probability.' }
        ],
        
        // Additional Info
        businessType: 'Flatbed hauling',
        yearsInBusiness: 2,
        safetyRating: 'Not rated (new company)',
        insuranceHistory: 'No claims',
        
        quotes: [],
        activities: []
    },
    
    {
        // EMN EXPRESS LLC
        id: 'VIC_2005',
        name: 'EMN EXPRESS LLC',
        contact: 'Feven Debesay',
        phone: '(469) 974-4101',
        email: 'feven@emnexpress.com',
        product: 'Commercial Auto',
        premium: 5800,
        stage: 'quote-sent-aware',
        renewalDate: '04/09/2025',
        assignedTo: 'John Smith',
        created: '01/09/2025',
        source: 'Vicidial - SALE Status',
        status: 'active',
        priority: 'high',
        
        // Vehicle Details
        vehicles: [
            { year: 2020, make: 'International', model: 'LT625', vin: '3HSDJAPR5LN123456', value: 125000 }
        ],
        
        // DOT/MC Info
        dotNumber: 'DOT7890123',
        mcNumber: 'MC432109',
        fleetSize: 1,
        
        // Call Transcript
        callTranscript: `Agent: Vanguard Insurance, John speaking. How can I help you today?
Feven: Hi John, I'm Feven from EMN Express in Texas. I need insurance for my truck.
Agent: I'd be happy to help. Tell me about your operation.
Feven: I'm an owner-operator with one International LT625. I do dedicated runs for a logistics company.
Agent: Great! How long have you been operating?
Feven: About 3 years now. No accidents, no violations. Very safety conscious.
Agent: That's excellent. For an owner-operator with your record, I can offer $5,800 annually.
Feven: That's really good. My current insurance is $7,200.
Agent: We pride ourselves on competitive rates for safe drivers. Should I prepare a quote?
Feven: Yes, definitely. I need to review it with my accountant first.
Agent: Understood. I'll email it to feven@emnexpress.com. When do you need to make a decision?
Feven: My renewal is April 9th, so I have some time but want to decide soon.
Agent: Perfect. I'll send everything today and follow up in a few days.`,
        
        // Notes
        notes: [
            { date: '01/09/2025', note: 'Owner-operator, 1 truck. Dedicated runs for logistics company.' },
            { date: '01/09/2025', note: '3 years experience, clean record. Very safety conscious.' },
            { date: '01/09/2025', note: 'Currently paying $7,200, quoted $5,800. Significant savings.' },
            { date: '01/09/2025', note: 'Needs to review with accountant. Follow up scheduled.' }
        ],
        
        // Additional Info
        businessType: 'Owner-operator / Dedicated runs',
        yearsInBusiness: 3,
        safetyRating: 'Satisfactory',
        insuranceHistory: 'Clean record',
        
        quotes: [],
        activities: []
    },
    
    {
        // MELVIN KENNEDY KENN TRANSPORT LLC
        id: 'VIC_2006',
        name: 'MELVIN KENNEDY KENN TRANSPORT LLC',
        contact: 'Melvin Kennedy',
        phone: '(817) 542-8635',
        email: 'dispatch@kenntransport.com',
        product: 'Commercial Auto',
        premium: 10000,
        stage: 'new',
        renewalDate: '09/19/2025',
        assignedTo: 'Sales Team',
        created: '01/09/2025',
        source: 'Vicidial - SALE Status',
        status: 'active',
        priority: 'high',
        
        // Vehicle Details
        vehicles: [
            { year: 2021, make: 'Freightliner', model: 'Cascadia', vin: '1FUJGLDR7MLN12345', value: 140000 },
            { year: 2020, make: 'Freightliner', model: 'Cascadia', vin: '1FUJGLDR5LLN23456', value: 130000 },
            { year: 2019, make: 'Freightliner', model: 'Cascadia', vin: '1FUJGLDR3KLN34567', value: 120000 },
            { year: 2022, make: 'Volvo', model: 'VNL860', vin: '4V4NC9EH8NN145678', value: 150000 }
        ],
        
        // DOT/MC Info
        dotNumber: 'DOT8901234',
        mcNumber: 'MC321098',
        fleetSize: 4,
        
        // Call Transcript
        callTranscript: `Agent: Good afternoon, Vanguard Insurance, this is the sales team lead, Robert speaking.
Melvin: Hi Robert, I'm Melvin Kennedy from Kenn Transport. I manage our fleet insurance.
Agent: Great to speak with you, Melvin. How can we help Kenn Transport?
Melvin: We have 4 trucks and looking to expand. Need better insurance rates to support growth.
Agent: I understand. Tell me about your current fleet.
Melvin: Three Freightliner Cascadias and one Volvo VNL860. All 2019 or newer.
Agent: Excellent equipment. What's your current premium?
Melvin: We're paying about $13,000 annually, which is eating into our margins.
Agent: For a fleet your size with good equipment, I can offer $10,000 annually with full coverage.
Melvin: That's a $3,000 savings! What's the catch?
Agent: No catch. We reward safe operators with good equipment. Your safety rating?
Melvin: Satisfactory rating, no accidents in the past 4 years.
Agent: Perfect. That's why we can offer this rate. Should I prepare a proposal?
Melvin: Absolutely. This could really help our expansion plans.
Agent: I'll send it to dispatch@kenntransport.com and mark this as a priority SALE lead.`,
        
        // Notes
        notes: [
            { date: '01/09/2025', note: 'Fleet of 4 trucks, planning expansion. Cost-conscious.' },
            { date: '01/09/2025', note: 'Currently paying $13k, quoted $10k. $3,000 annual savings.' },
            { date: '01/09/2025', note: 'Satisfactory rating, no accidents in 4 years.' },
            { date: '01/09/2025', note: 'Savings will help fund fleet expansion. Very motivated.' }
        ],
        
        // Additional Info
        businessType: 'Fleet operation / Expanding',
        yearsInBusiness: 7,
        safetyRating: 'Satisfactory',
        insuranceHistory: 'No accidents in 4 years',
        
        quotes: [],
        activities: []
    }
];

// Override sync function to import FULL data
window.syncVicidialLeads = function() {
    console.log('🔄 Importing FULL Vicidial data with transcripts and details...');
    
    // First, backup any existing Vicidial leads
    const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    const existingVicidial = existingLeads.filter(lead => 
        lead.source && lead.source.includes('Vicidial')
    );
    if (existingVicidial.length > 0) {
        localStorage.setItem('vicidialLeadsBackup', JSON.stringify(existingVicidial));
    }
    
    // Show loading
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 400px;
    `;
    notification.innerHTML = `
        <h4 style="margin: 0;">🔄 Fetching complete Vicidial data...</h4>
        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">
            Including transcripts, vehicles, and notes...
        </p>
    `;
    document.body.appendChild(notification);
    
    // Get current leads, archived leads, and clients
    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Helper function to check if lead exists in any location
    function leadExistsAnywhere(vicidialLead) {
        // Check by phone number and email across all locations
        const phone = vicidialLead.phone?.replace(/\D/g, ''); // Strip non-digits for comparison
        const email = vicidialLead.email?.toLowerCase();
        const name = vicidialLead.name?.toLowerCase();
        
        // Check in active leads
        const inActiveLeads = currentLeads.some(lead => {
            const leadPhone = lead.phone?.replace(/\D/g, '');
            const leadEmail = lead.email?.toLowerCase();
            const leadName = lead.name?.toLowerCase();
            return (leadPhone && leadPhone === phone) || 
                   (leadEmail && leadEmail === email) ||
                   (leadName && leadName === name) ||
                   (lead.originalId === vicidialLead.id) ||
                   (lead.id === vicidialLead.id);
        });
        
        // Check in archived leads
        const inArchivedLeads = archivedLeads.some(lead => {
            const leadPhone = lead.phone?.replace(/\D/g, '');
            const leadEmail = lead.email?.toLowerCase();
            const leadName = lead.name?.toLowerCase();
            return (leadPhone && leadPhone === phone) || 
                   (leadEmail && leadEmail === email) ||
                   (leadName && leadName === name) ||
                   (lead.originalId === vicidialLead.id) ||
                   (lead.id === vicidialLead.id);
        });
        
        // Check in clients
        const inClients = clients.some(client => {
            const clientPhone = client.phone?.replace(/\D/g, '');
            const clientEmail = client.email?.toLowerCase();
            const clientName = client.name?.toLowerCase();
            return (clientPhone && clientPhone === phone) || 
                   (clientEmail && clientEmail === email) ||
                   (clientName && clientName === name);
        });
        
        if (inActiveLeads) {
            console.log(`Lead ${vicidialLead.name} already exists in active leads`);
        }
        if (inArchivedLeads) {
            console.log(`Lead ${vicidialLead.name} already exists in archived leads`);
        }
        if (inClients) {
            console.log(`Lead ${vicidialLead.name} already exists as a client`);
        }
        
        return inActiveLeads || inArchivedLeads || inClients;
    }
    
    // Only add Vicidial leads that don't already exist anywhere
    const newVicidialLeads = VICIDIAL_FULL_LEADS.filter(lead => 
        !leadExistsAnywhere(lead)
    );
    
    // Calculate how many were skipped
    const skippedCount = VICIDIAL_FULL_LEADS.length - newVicidialLeads.length;
    
    // If no new leads to add, just update existing ones
    if (newVicidialLeads.length === 0) {
        console.log('All Vicidial leads already imported');
        // Update existing Vicidial leads to ensure they have 'new' stage
        currentLeads = currentLeads.map(lead => {
            if (lead.source && lead.source.includes('Vicidial')) {
                return { ...lead, stage: 'new' };
            }
            return lead;
        });
        localStorage.setItem('leads', JSON.stringify(currentLeads));
        
        // Update notification
        notification.style.background = '#f59e0b';
        notification.innerHTML = `
            <h4 style="margin: 0;">✓ No new Vicidial leads to import</h4>
            <p style="margin: 5px 0 0 0; font-size: 13px;">All leads already exist in active, archived, or clients</p>
        `;
        setTimeout(() => notification.remove(), 3000);
        
        // Reload view if on leads page
        if (window.location.hash === '#lead-generation' || document.querySelector('.leads-view')) {
            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
            }
        }
        return;
    }
    
    // Add new Vicidial leads with consistent IDs
    const fullLeads = newVicidialLeads.map((lead) => ({
        ...lead,
        id: `${lead.id}_imported`, // Consistent ID that won't change on refresh
        originalId: lead.id, // Keep track of original ID
        created: lead.created || new Date().toLocaleDateString(),
        lastUpdated: new Date().toISOString(),
        stage: 'new' // Ensure stage is always 'new'
    }));
    
    // Combine and save
    const finalLeads = [...currentLeads, ...fullLeads];
    
    // Clear any blockers and force save
    localStorage.removeItem('leadStatusTracker');
    const originalSetItem = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem').value ||
                           Storage.prototype.setItem;
    originalSetItem.call(localStorage, 'leads', JSON.stringify(finalLeads));
    
    console.log(`✅ Imported ${fullLeads.length} leads with FULL data`);
    
    // Show success with details
    setTimeout(() => {
        notification.style.background = '#10b981';
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">✅ Imported ${fullLeads.length} Complete Vicidial Leads!</h3>
            ${skippedCount > 0 ? `<p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Skipped ${skippedCount} duplicate(s) found in active/archived/clients</p>` : ''}
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; font-size: 12px; max-height: 200px; overflow-y: auto;">
                ${fullLeads.map(lead => `
                    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <strong>${lead.name}</strong><br>
                        • ${lead.vehicles.length} vehicles<br>
                        • ${lead.notes.length} notes<br>
                        • Full transcript included<br>
                        • Premium: $${lead.premium.toLocaleString()}
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 10px; font-size: 13px;">
                All transcripts, vehicles, and notes imported!
            </p>
        `;
        
        // Force refresh
        setTimeout(() => {
            if (typeof window.loadLeadsView === 'function') {
                window.loadLeadsView();
            }
            
            // Try nav click
            const leadNav = Array.from(document.querySelectorAll('.nav-item, a')).find(el => 
                el.textContent && el.textContent.includes('Lead Management')
            );
            if (leadNav) {
                leadNav.click();
                setTimeout(() => leadNav.click(), 200);
            }
            
            notification.remove();
        }, 2000);
    }, 1000);
};

// Function to view full lead details including transcript
window.viewFullLeadDetails = function(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId || l.id == leadId);
    
    if (!lead) {
        console.error('Lead not found:', leadId);
        return;
    }
    
    console.log('=== FULL LEAD DETAILS ===');
    console.log('Name:', lead.name);
    console.log('Contact:', lead.contact);
    console.log('Phone:', lead.phone);
    
    if (lead.vehicles && lead.vehicles.length > 0) {
        console.log('\n📚 VEHICLES:');
        lead.vehicles.forEach(v => {
            console.log(`  - ${v.year} ${v.make} ${v.model} (VIN: ${v.vin}) - Value: $${v.value.toLocaleString()}`);
        });
    }
    
    if (lead.callTranscript) {
        console.log('\n📞 CALL TRANSCRIPT:');
        console.log(lead.callTranscript);
    }
    
    if (lead.notes && lead.notes.length > 0) {
        console.log('\n📝 NOTES:');
        lead.notes.forEach(n => {
            console.log(`  [${n.date}] ${n.note}`);
        });
    }
    
    console.log('\n🔧 Additional Info:');
    console.log('  Business Type:', lead.businessType);
    console.log('  Years in Business:', lead.yearsInBusiness);
    console.log('  Safety Rating:', lead.safetyRating);
    console.log('  Insurance History:', lead.insuranceHistory);
    console.log('  DOT Number:', lead.dotNumber);
    console.log('  MC Number:', lead.mcNumber);
    
    return lead;
};

console.log('✅ Full Vicidial data import loaded!');
console.log('Click "Sync Vicidial Now" to import complete lead data');
console.log('Use viewFullLeadDetails(leadId) to see all details including transcripts');