// Agent Configuration - Central place to manage agent list
(function() {
    'use strict';

    // Define the official agent list
    window.VANGUARD_AGENTS = [
        'Grant',
        'Maureen',
        'Hunter'
    ];

    // Function to get agent options HTML
    window.getAgentOptionsHTML = function(selectedAgent) {
        let html = '<option value="">Unassigned</option>';

        window.VANGUARD_AGENTS.forEach(agent => {
            const selected = selectedAgent === agent ? 'selected' : '';
            html += `<option value="${agent}" ${selected}>${agent}</option>`;
        });

        return html;
    };

    // Function to create agent select element
    window.createAgentSelect = function(selectedAgent, onChangeCallback, elementId) {
        const select = document.createElement('select');
        if (elementId) select.id = elementId;
        select.style.width = '100%';
        select.style.padding = '8px';
        select.style.border = '1px solid #d1d5db';
        select.style.borderRadius = '6px';
        select.style.background = 'white';

        select.innerHTML = window.getAgentOptionsHTML(selectedAgent);

        if (onChangeCallback) {
            select.onchange = onChangeCallback;
        }

        return select;
    };

    // Override any hardcoded agent lists when document loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ Agent configuration loaded. Available agents:', window.VANGUARD_AGENTS);

        // Update any existing agent dropdowns
        updateExistingAgentDropdowns();
    });

    // Function to update existing dropdowns with the correct agent list
    function updateExistingAgentDropdowns() {
        // Find all agent-related select elements
        const selects = document.querySelectorAll('select[name="assignedTo"], select#filterAssigned, select#leadAssignedTo');

        selects.forEach(select => {
            const currentValue = select.value;

            // Clear and rebuild options
            select.innerHTML = '';

            // Add unassigned option
            const unassignedOption = document.createElement('option');
            unassignedOption.value = '';
            unassignedOption.textContent = select.id === 'filterAssigned' ? 'All Agents' : 'Unassigned';
            select.appendChild(unassignedOption);

            // Add agent options
            window.VANGUARD_AGENTS.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent;
                option.textContent = agent;
                select.appendChild(option);
            });

            // Restore previous selection if it's valid
            if (currentValue && (currentValue === '' || window.VANGUARD_AGENTS.includes(currentValue))) {
                select.value = currentValue;
            }
        });
    }

    // Also update dropdowns when modal is shown
    const originalShowModal = window.showModal;
    window.showModal = function(modalId) {
        if (originalShowModal) {
            originalShowModal(modalId);
        }

        // Update agent dropdowns in the modal
        setTimeout(updateExistingAgentDropdowns, 100);
    };

    // Monitor for dynamically added agent dropdowns
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's an agent select or contains one
                    if (node.matches && node.matches('select[name="assignedTo"], select#filterAssigned, select#leadAssignedTo')) {
                        updateExistingAgentDropdowns();
                    } else if (node.querySelector) {
                        const selects = node.querySelectorAll('select[name="assignedTo"], select#filterAssigned, select#leadAssignedTo');
                        if (selects.length > 0) {
                            updateExistingAgentDropdowns();
                        }
                    }
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('🎯 Agent configuration system initialized');
})();