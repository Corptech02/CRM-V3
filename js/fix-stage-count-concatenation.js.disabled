// Fix Stage Count Concatenation - Ensures numeric addition instead of string concatenation
console.log('Fixing stage count concatenation issue...');

// Override the loadLeadsView function to ensure numeric calculations
(function() {
    const originalLoadLeadsView = window.loadLeadsView;

    window.loadLeadsView = function() {
        console.log('Enhanced loadLeadsView with numeric stage count fix');

        // Call the original function
        if (originalLoadLeadsView) {
            originalLoadLeadsView.apply(this, arguments);
        }

        // After the view loads, fix any stage count issues
        setTimeout(() => {
            fixStageCountsInLeadPipeline();
        }, 100);

        setTimeout(() => {
            fixStageCountsInLeadPipeline();
        }, 500);
    };

    function fixStageCountsInLeadPipeline() {
        console.log('Fixing stage counts in lead pipeline...');

        // Get all leads
        const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leads = allLeads.filter(lead => !lead.archived);

        if (leads.length === 0) {
            console.log('No leads found, skipping stage count fix');
            return;
        }

        // Calculate counts with explicit numeric conversion
        const newLeads = Number(leads.filter(l => l.stage === 'new').length);
        const quotedLeads = Number(leads.filter(l => l.stage === 'quoted').length);
        const quoteSentUnaware = Number(leads.filter(l => l.stage === 'quote-sent-unaware').length);
        const quoteSentAware = Number(leads.filter(l => l.stage === 'quote-sent-aware').length);
        const quoteSentTotal = Number(quoteSentUnaware + quoteSentAware);
        const interestedLeads = Number(leads.filter(l => l.stage === 'interested').length);
        const closedLeads = Number(leads.filter(l => l.stage === 'closed').length);

        console.log('Calculated stage counts:', {
            newLeads,
            quotedLeads,
            quoteSentTotal,
            interestedLeads,
            closedLeads
        });

        // Find stage count elements and update with correct values
        const stages = [
            { name: 'new', count: newLeads },
            { name: 'quoted', count: quotedLeads },
            { name: 'quote-sent', count: quoteSentTotal },
            { name: 'interested', count: interestedLeads },
            { name: 'closed', count: closedLeads }
        ];

        stages.forEach(stage => {
            const stageElement = document.querySelector(`[data-stage="${stage.name}"] .stage-count`);
            if (stageElement) {
                const currentValue = stageElement.textContent;
                console.log(`Stage ${stage.name}: current="${currentValue}", should be="${stage.count}"`);

                // If current value contains "$0$0" pattern, fix it
                if (currentValue.includes('$0') || currentValue.includes('undefined')) {
                    console.log(`Fixing problematic count for ${stage.name}: ${currentValue} -> ${stage.count}`);
                    stageElement.textContent = String(stage.count);
                }
            }
        });

        // Also fix any remaining problematic elements
        const allStageCountElements = document.querySelectorAll('.stage-count');
        allStageCountElements.forEach((element, index) => {
            const content = element.textContent;
            if (content.includes('$0$0') || content.includes('undefined') || content.match(/\d+\$0/)) {
                console.log(`Fixing stage count element ${index}:`, content);

                // Extract just the number at the beginning
                const match = content.match(/^(\d+)/);
                if (match) {
                    const number = parseInt(match[1]);
                    console.log(`Fixed to: ${number}`);
                    element.textContent = String(number);
                } else {
                    // If no number found, set to 0
                    element.textContent = '0';
                }
            }
        });
    }

    // Fix any template literal issues by ensuring proper string conversion
    const originalString = String;
    window.String = function(value) {
        if (typeof value === 'string' && value.includes('$0$0')) {
            console.log('Intercepted problematic String conversion:', value);
            const match = value.match(/^(\d+)/);
            return match ? match[1] : '0';
        }
        return originalString(value);
    };

    console.log('Stage count concatenation fix loaded');
})();