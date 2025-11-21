// Guaranteed Save - Direct to Database
(function() {
    'use strict';

    console.log('Guaranteed Save loading...');

    // Create a floating save button that ALWAYS works
    function createGuaranteedSaveButton() {
        // Remove any existing button
        const existing = document.getElementById('guaranteed-save-btn');
        if (existing) {
            existing.remove();
        }

        const btn = document.createElement('button');
        btn.id = 'guaranteed-save-btn';
        btn.innerHTML = '💾 GUARANTEED SAVE';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        btn.onclick = guaranteedSave;
        document.body.appendChild(btn);
    }

    async function guaranteedSave() {
        console.log('GUARANTEED SAVE TRIGGERED');

        // Find lead ID
        let leadId = window.currentLeadId;

        if (!leadId) {
            // Try to find from any input with updateLeadField
            const inputs = document.querySelectorAll('[onchange*="updateLeadField"]');
            for (let input of inputs) {
                const onchange = input.getAttribute('onchange');
                const match = onchange.match(/updateLeadField\(["']?(\d+)["']?/);
                if (match) {
                    leadId = match[1];
                    break;
                }
            }
        }

        if (!leadId) {
            // Try URL
            const urlMatch = window.location.hash.match(/lead[/-]?(\d+)/i);
            if (urlMatch) {
                leadId = urlMatch[1];
            }
        }

        if (!leadId) {
            leadId = prompt('Enter Lead ID:', '88571');
        }

        if (!leadId) {
            alert('Cannot determine lead ID');
            return;
        }

        console.log('Using lead ID:', leadId);

        // Collect ALL input values
        const data = {};

        // Get all inputs, selects, and textareas
        document.querySelectorAll('input, select, textarea').forEach(el => {
            // Skip buttons
            if (el.type === 'button' || el.type === 'submit') return;

            // Try to determine field name
            let fieldName = null;

            // Method 1: Check onchange attribute
            const onchange = el.getAttribute('onchange');
            if (onchange && onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*["']([^"']+)["']/);
                if (match) {
                    fieldName = match[1];
                }
            }

            // Method 2: Check placeholder
            if (!fieldName && el.placeholder) {
                const placeholder = el.placeholder.toLowerCase();
                if (placeholder.includes('company')) fieldName = 'company_name';
                else if (placeholder.includes('phone')) fieldName = 'phone';
                else if (placeholder.includes('contact')) fieldName = 'contact_name';
                else if (placeholder.includes('email')) fieldName = 'email';
                else if (placeholder.includes('dot')) fieldName = 'dot_number';
                else if (placeholder.includes('mc')) fieldName = 'mc_number';
            }

            // Method 3: Check label
            if (!fieldName) {
                const label = el.closest('div')?.querySelector('label');
                if (label) {
                    const text = label.textContent.toLowerCase();
                    if (text.includes('company')) fieldName = 'company_name';
                    else if (text.includes('phone')) fieldName = 'phone';
                    else if (text.includes('contact')) fieldName = 'contact_name';
                    else if (text.includes('email')) fieldName = 'email';
                    else if (text.includes('dot')) fieldName = 'dot_number';
                    else if (text.includes('mc')) fieldName = 'mc_number';
                    else if (text.includes('years')) fieldName = 'years_in_business';
                    else if (text.includes('fleet')) fieldName = 'fleet_size';
                    else if (text.includes('radius')) fieldName = 'radius_of_operation';
                    else if (text.includes('commodity')) fieldName = 'commodity_hauled';
                    else if (text.includes('state')) fieldName = 'state';
                    else if (text.includes('city')) fieldName = 'city';
                    else if (text.includes('address')) fieldName = 'address';
                    else if (text.includes('notes')) fieldName = 'notes';
                }
            }

            // Store value if we have a field name
            if (fieldName && el.value) {
                data[fieldName] = el.value;
                console.log(`Found field: ${fieldName} = ${el.value}`);
            }
        });

        // Add timestamp
        data.notes = (data.notes || '') + `\n[Saved at ${new Date().toLocaleString()}]`;

        console.log('Collected data:', data);

        if (Object.keys(data).length === 0) {
            alert('No data found to save');
            return;
        }

        // Determine API URL
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        const btn = document.getElementById('guaranteed-save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ SAVING...';
        btn.disabled = true;

        try {
            console.log(`Saving to ${apiUrl}/api/leads/${leadId}`);
            console.log('Payload:', JSON.stringify(data));

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('API Response:', result);

            if (response.ok) {
                btn.innerHTML = '✅ SAVED!';
                btn.style.background = '#00ff00';

                // Also update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
                if (leadIndex !== -1) {
                    Object.assign(leads[leadIndex], data);
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                    console.log('LocalStorage also updated');
                }

                alert('Save successful! Data has been saved to the database.');

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '#ff0000';
                    btn.disabled = false;
                }, 3000);
            } else {
                throw new Error(result.error || result.message || 'Save failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            btn.innerHTML = '❌ ERROR';
            btn.style.background = '#ff0000';
            alert(`Save failed: ${error.message}`);

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 3000);
        }
    }

    // Create button when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createGuaranteedSaveButton);
    } else {
        createGuaranteedSaveButton();
    }

    // Re-create button when modal opens
    const observer = new MutationObserver(() => {
        if (document.querySelector('.lead-profile-modal, .modal-content') && !document.getElementById('guaranteed-save-btn')) {
            createGuaranteedSaveButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Make function global
    window.guaranteedSave = guaranteedSave;

    console.log('Guaranteed Save loaded - Look for red button in bottom right');
})();