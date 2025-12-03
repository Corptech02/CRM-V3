// MAKE FIELDS EDITABLE - Ensures all lead profile fields can be edited
(function() {
    'use strict';

    console.log('MAKE FIELDS EDITABLE loading...');

    // Function to make fields editable
    function makeFieldsEditable() {
        console.log('Checking for non-editable fields...');

        // Find Company Information section
        const sections = Array.from(document.querySelectorAll('div, section'));

        sections.forEach(section => {
            if (section.textContent.includes('Company Information') ||
                section.textContent.includes('Operation Details')) {

                console.log('Found information section');

                // Look for field patterns like "Label: Value"
                const walker = document.createTreeWalker(
                    section,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text && text !== ':') {
                        textNodes.push({
                            node: node,
                            text: text,
                            parent: node.parentElement
                        });
                    }
                }

                // Process each potential field
                for (let i = 0; i < textNodes.length; i++) {
                    const current = textNodes[i];
                    const text = current.text;

                    // Check if this is a label
                    if (text.endsWith(':')) {
                        const label = text;
                        const nextNode = textNodes[i + 1];

                        if (nextNode && !nextNode.text.endsWith(':')) {
                            const value = nextNode.text;
                            const parent = nextNode.parent;

                            // Check if there's already an input
                            const existingInput = parent?.querySelector('input, textarea');
                            if (existingInput) {
                                console.log(`Field ${label} already has input`);
                                continue;
                            }

                            // Determine field name
                            let fieldName = '';
                            if (label.includes('Company Name')) fieldName = 'company_name';
                            else if (label.includes('Contact')) fieldName = 'contact_name';
                            else if (label.includes('Phone')) fieldName = 'phone';
                            else if (label.includes('Email')) fieldName = 'email';
                            else if (label.includes('DOT Number')) fieldName = 'dot_number';
                            else if (label.includes('MC Number')) fieldName = 'mc_number';
                            else if (label.includes('Years in Business')) fieldName = 'years_in_business';
                            else if (label.includes('Fleet Size')) fieldName = 'fleet_size';
                            else if (label.includes('Radius of Operation')) fieldName = 'radius_of_operation';
                            else if (label.includes('Commodity Hauled')) fieldName = 'commodity_hauled';
                            else if (label.includes('Operating States')) fieldName = 'operating_states';

                            if (fieldName && parent) {
                                console.log(`Making ${label} editable with value: ${value}`);

                                // Create an input field
                                const input = document.createElement('input');
                                input.type = 'text';
                                input.value = value;
                                input.style.cssText = `
                                    border: 1px solid #ddd;
                                    padding: 5px 10px;
                                    border-radius: 4px;
                                    width: 200px;
                                    margin-left: 5px;
                                `;

                                // Add onchange handler
                                const leadId = window.currentLeadId || '88571';
                                input.setAttribute('onchange', `updateLeadField('${leadId}', '${fieldName}', this.value)`);
                                input.setAttribute('data-field', fieldName);

                                // Replace the text with input
                                if (nextNode.node.parentNode) {
                                    nextNode.node.parentNode.replaceChild(input, nextNode.node);
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // Run when profile opens
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        if (originalShow) {
            originalShow.apply(this, arguments);
        }
        setTimeout(makeFieldsEditable, 500);
        setTimeout(makeFieldsEditable, 1000);
    };

    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        if (originalView) {
            originalView.apply(this, arguments);
        }
        setTimeout(makeFieldsEditable, 500);
        setTimeout(makeFieldsEditable, 1000);
    };

    // Also run periodically - DISABLED to prevent DOM manipulation flickering
    // setInterval(() => {
    //     if (document.querySelector('h2')?.textContent?.includes('Commercial Auto Lead Profile')) {
    //         makeFieldsEditable();
    //     }
    // }, 2000);

    console.log('MAKE FIELDS EDITABLE loaded');
})();