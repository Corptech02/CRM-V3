// User-specific COI Customization
(function() {
    'use strict';

    // Define user-specific agency information
    const USER_AGENCY_INFO = {
        'Maureen': {
            producerName: 'MAUREEN CORP',
            agencyName: 'MAUREEN CORP',
            address: '123 Insurance Blvd',
            city: 'Cleveland',
            state: 'OH',
            zip: '44101',
            phone: '330-241-7570',
            fax: '330-259-7439',
            email: 'maureen.corp@uigagency.com'
        },
        'Grant': {
            producerName: 'GRANT CORP',
            agencyName: 'GRANT CORP',
            address: '456 Coverage Lane',
            city: 'Cleveland',
            state: 'OH',
            zip: '44102',
            phone: '330-241-7570',
            fax: '330-259-7439',
            email: 'grant.corp@uigagency.com'
        },
        'Hunter': {
            producerName: 'HUNTER BROOKS',
            agencyName: 'HUNTER BROOKS AGENCY',
            address: '789 Policy Drive',
            city: 'Cleveland',
            state: 'OH',
            zip: '44103',
            phone: '330-241-7570',
            fax: '330-259-7439',
            email: 'hunter.brooks@uigagency.com'
        }
    };

    // Get current logged-in user
    function getCurrentUser() {
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            const user = JSON.parse(userData);
            return user.username;
        }
        return 'Grant'; // Default fallback
    }

    // Get agency info for current user
    function getUserAgencyInfo() {
        const username = getCurrentUser();
        return USER_AGENCY_INFO[username] || USER_AGENCY_INFO['Grant'];
    }

    // Update COI producer fields
    function updateCOIProducer() {
        // Check if Maureen Corp signature was selected - if so, use United Insurance Group
        if (window.tempSelectedSignature === 'Maureen Corp' ||
            (window.currentProducerName && window.currentProducerName.includes('UNITED'))) {
            console.log('Maureen Corp mode - using UNITED INSURANCE GROUP');

            const producerNameFields = document.querySelectorAll(
                'input[id*="producer"], input[name*="producer"], ' +
                'input[placeholder*="Producer"], input[value*="GRANT"], input[value*="VANGUARD"], ' +
                '#producerName, #agency, #agencyName, .producer-name'
            );

            producerNameFields.forEach(field => {
                if (field && field.value) {
                    field.value = 'UNITED INSURANCE GROUP';
                }
            });
            return; // Exit early, don't change to GRANT CORP
        }

        const agencyInfo = getUserAgencyInfo();

        // Update producer name fields
        const producerNameFields = document.querySelectorAll(
            'input[id*="producer"], input[name*="producer"], ' +
            'input[placeholder*="Producer"], input[value="GRANT CORP"], ' +
            '#producerName, #agency, #agencyName, .producer-name'
        );

        producerNameFields.forEach(field => {
            if (field && (field.value === 'GRANT CORP' || field.value === '' || field.placeholder.includes('Producer'))) {
                field.value = agencyInfo.producerName;
            }
        });

        // Update producer info in any text areas
        const producerInfoFields = document.querySelectorAll(
            'textarea[id*="producer"], #producerInfo, .producer-info'
        );

        producerInfoFields.forEach(field => {
            if (field) {
                field.value = `${agencyInfo.producerName}\n${agencyInfo.address}\n${agencyInfo.city}, ${agencyInfo.state} ${agencyInfo.zip}\nPhone: ${agencyInfo.phone}\nEmail: ${agencyInfo.email}`;
            }
        });

        // Update any displayed producer text
        const producerDisplays = document.querySelectorAll(
            '.producer-display, .agency-display, span'
        );

        producerDisplays.forEach(element => {
            if (element && element.textContent.includes('GRANT CORP')) {
                element.textContent = element.textContent.replace(/GRANT CORP/g, agencyInfo.producerName);
            }
        });
    }

    // Update email signatures
    function updateEmailSignature() {
        const agencyInfo = getUserAgencyInfo();
        const username = getCurrentUser();

        // Update email body templates
        const emailBodyFields = document.querySelectorAll(
            '#emailBody, #coiEmailBody, textarea[name*="email"]'
        );

        emailBodyFields.forEach(field => {
            if (field && field.value) {
                // Replace agency name in signature
                field.value = field.value.replace(/GRANT CORP/g, agencyInfo.producerName);
                field.value = field.value.replace(/grant\.corp@uigagency\.com/g, agencyInfo.email);

                // Update the "Best regards" signature
                if (field.value.includes('Best regards,')) {
                    field.value = field.value.replace(
                        /Best regards,[\s\S]*?(?=\n--)/,
                        `Best regards,\n${username}\n${agencyInfo.agencyName}`
                    );
                }
            }
        });
    }

    // Monitor for COI forms being opened
    function setupCOIMonitoring() {
        // Watch for COI modal/form appearances
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check if it's a COI-related element
                            if (node.id && (
                                node.id.includes('coi') ||
                                node.id.includes('COI') ||
                                node.id.includes('acord') ||
                                node.id.includes('certificate')
                            )) {
                                setTimeout(() => {
                                    updateCOIProducer();
                                    updateEmailSignature();
                                }, 100);
                            }

                            // Also check children
                            const coiElements = node.querySelectorAll('[id*="coi"], [id*="COI"], [id*="producer"], [id*="agency"]');
                            if (coiElements.length > 0) {
                                setTimeout(() => {
                                    updateCOIProducer();
                                    updateEmailSignature();
                                }, 100);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Override any functions that set producer name
    function overrideProducerFunctions() {
        // Override populateCOIFields if it exists
        if (typeof window.populateCOIFields === 'function') {
            const originalPopulateCOI = window.populateCOIFields;
            window.populateCOIFields = function(...args) {
                const result = originalPopulateCOI.apply(this, args);
                updateCOIProducer();
                return result;
            };
        }

        // Override showCOICompose if it exists
        if (typeof window.showCOICompose === 'function') {
            const originalShowCOI = window.showCOICompose;
            window.showCOICompose = function(...args) {
                const result = originalShowCOI.apply(this, args);
                setTimeout(() => {
                    updateCOIProducer();
                    updateEmailSignature();
                }, 200);
                return result;
            };
        }

        // Override generateCOI if it exists
        if (typeof window.generateCOI === 'function') {
            const originalGenerateCOI = window.generateCOI;
            window.generateCOI = function(...args) {
                updateCOIProducer();
                const result = originalGenerateCOI.apply(this, args);
                return result;
            };
        }
    }

    // Update default assigned agent based on logged-in user
    function updateDefaultAssignedAgent() {
        const username = getCurrentUser();

        // Update agent dropdowns when they appear
        const updateAgentSelects = () => {
            const agentSelects = document.querySelectorAll(
                'select[name="assignedTo"], select#filterAssigned, ' +
                'select#leadAssignedTo, select#clientAssignedTo'
            );

            agentSelects.forEach(select => {
                // Set default value if empty
                if (!select.value || select.value === '') {
                    // Check if the user's name is an option
                    const hasUserOption = Array.from(select.options).some(
                        opt => opt.value === username
                    );

                    if (hasUserOption) {
                        select.value = username;
                    }
                }
            });
        };

        // Initial update
        updateAgentSelects();

        // Monitor for new dropdowns
        const observer = new MutationObserver(() => {
            updateAgentSelects();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Make agency info globally available
    window.getUserAgencyInfo = getUserAgencyInfo;
    window.updateCOIProducer = updateCOIProducer;

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        setupCOIMonitoring();
        overrideProducerFunctions();
        updateDefaultAssignedAgent();

        // Update immediately if COI elements exist
        setTimeout(() => {
            updateCOIProducer();
            updateEmailSignature();
        }, 500);
    });

    // Also initialize immediately in case DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setupCOIMonitoring();
        overrideProducerFunctions();
        updateDefaultAssignedAgent();

        setTimeout(() => {
            updateCOIProducer();
            updateEmailSignature();
        }, 500);
    }

    console.log('👤 User COI Customization loaded for:', getCurrentUser());
})();