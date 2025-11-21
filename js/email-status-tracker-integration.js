// Email Status Tracker Integration - Hooks into existing email display functions
console.log('🔗 Integrating Email Status Tracker...');

// Wait for DOM and other scripts to load
setTimeout(() => {
    // Hook into COI email loading
    if (window.loadRealCOIEmails) {
        const originalLoadEmails = window.loadRealCOIEmails;
        window.loadRealCOIEmails = async function() {
            const result = await originalLoadEmails.apply(this, arguments);

            // Add status controls after emails load
            setTimeout(() => {
                const coiInbox = document.getElementById('coiInbox');
                if (coiInbox) {
                    const emailItems = coiInbox.querySelectorAll('.email-item');
                    const emails = [];

                    emailItems.forEach(item => {
                        const onclick = item.getAttribute('onclick') || '';
                        const match = onclick.match(/viewEmailDetails\(['"]([^'"]+)['"]\)|expandEmail\(['"]([^'"]+)['"]\)/);
                        if (match) {
                            emails.push({
                                id: match[1] || match[2],
                                element: item
                            });
                        }
                    });

                    if (emails.length > 0) {
                        addStatusControlsToEmailElements(emails);
                    }
                }
            }, 500);

            return result;
        };
    }

    // Function to add controls to email elements
    function addStatusControlsToEmailElements(emails) {
        const statuses = getEmailStatuses();

        emails.forEach(({ id, element }) => {
            // Check if controls already added
            if (element.querySelector('.email-status-controls')) return;

            // Make element relative for positioning
            element.style.position = 'relative';

            // Create controls container
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'email-status-controls';
            controlsDiv.style.cssText = `
                position: absolute;
                right: 100px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 10px;
                z-index: 10;
            `;

            // Handled checkbox (green check)
            const handledBtn = document.createElement('button');
            const isHandled = statuses[id] === 'handled';
            handledBtn.innerHTML = isHandled ?
                '<i class="fas fa-check-circle" style="color: #10b981; font-size: 20px;"></i>' :
                '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 20px;"></i>';
            handledBtn.title = 'Mark as handled';
            handledBtn.style.cssText = `
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                transition: all 0.2s;
            `;
            handledBtn.onclick = function(e) {
                e.stopPropagation();
                const newStatus = !isHandled;
                markEmailHandled(id, newStatus);

                // Update button
                this.innerHTML = newStatus ?
                    '<i class="fas fa-check-circle" style="color: #10b981; font-size: 20px;"></i>' :
                    '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 20px;"></i>';

                // Update element styling
                updateEmailElementStyle(element, newStatus ? 'handled' : null);
            };

            // Unimportant X mark (red X)
            const unimportantBtn = document.createElement('button');
            const isUnimportant = statuses[id] === 'unimportant';
            unimportantBtn.innerHTML = isUnimportant ?
                '<i class="fas fa-times-circle" style="color: #ef4444; font-size: 20px;"></i>' :
                '<i class="far fa-times-circle" style="color: #9ca3af; font-size: 20px;"></i>';
            unimportantBtn.title = 'Mark as unimportant';
            unimportantBtn.style.cssText = `
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                transition: all 0.2s;
            `;
            unimportantBtn.onclick = function(e) {
                e.stopPropagation();
                markEmailUnimportant(id);

                const newStatus = getEmailStatuses()[id];

                // Update button
                this.innerHTML = newStatus === 'unimportant' ?
                    '<i class="fas fa-times-circle" style="color: #ef4444; font-size: 20px;"></i>' :
                    '<i class="far fa-times-circle" style="color: #9ca3af; font-size: 20px;"></i>';

                // Update element styling
                updateEmailElementStyle(element, newStatus);

                // Also update handled button if needed
                if (newStatus === 'unimportant') {
                    handledBtn.innerHTML = '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 20px;"></i>';
                }
            };

            // Add controls
            controlsDiv.appendChild(handledBtn);
            controlsDiv.appendChild(unimportantBtn);
            element.appendChild(controlsDiv);

            // Apply initial status
            if (statuses[id]) {
                updateEmailElementStyle(element, statuses[id]);
            }
        });
    }

    // Update element styling
    function updateEmailElementStyle(element, status) {
        // Remove existing status classes
        element.classList.remove('email-handled', 'email-unimportant');
        element.style.background = '';
        element.style.borderLeft = '';

        if (status === 'handled') {
            element.classList.add('email-handled');
            element.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
            element.style.borderLeft = '4px solid #10b981';
        } else if (status === 'unimportant') {
            element.classList.add('email-unimportant');
            element.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
            element.style.borderLeft = '4px solid #ef4444';
            element.style.opacity = '0.7';
        }
    }

    // Get email statuses
    function getEmailStatuses() {
        const stored = localStorage.getItem('coi_email_status');
        return stored ? JSON.parse(stored) : {};
    }

    // Mark functions (if not already defined)
    if (!window.markEmailHandled) {
        window.markEmailHandled = function(emailId, isHandled) {
            const statuses = getEmailStatuses();

            if (isHandled) {
                statuses[emailId] = 'handled';
            } else if (statuses[emailId] === 'handled') {
                delete statuses[emailId];
            }

            localStorage.setItem('coi_email_status', JSON.stringify(statuses));
        };
    }

    if (!window.markEmailUnimportant) {
        window.markEmailUnimportant = function(emailId) {
            const statuses = getEmailStatuses();

            if (statuses[emailId] === 'unimportant') {
                delete statuses[emailId];
            } else {
                statuses[emailId] = 'unimportant';
                // Clear handled status if set
                if (statuses[emailId] === 'handled') {
                    delete statuses[emailId];
                    statuses[emailId] = 'unimportant';
                }
            }

            localStorage.setItem('coi_email_status', JSON.stringify(statuses));
        };
    }

    // Monitor for new email lists
    const observer = new MutationObserver(() => {
        const emailList = document.querySelector('.email-list');
        if (emailList && !emailList.dataset.statusIntegrated) {
            emailList.dataset.statusIntegrated = 'true';

            setTimeout(() => {
                const emailItems = emailList.querySelectorAll('.email-item');
                const emails = [];

                emailItems.forEach(item => {
                    const onclick = item.getAttribute('onclick') || '';
                    const match = onclick.match(/viewEmailDetails\(['"]([^'"]+)['"]\)|expandEmail\(['"]([^'"]+)['"]\)/);
                    if (match) {
                        emails.push({
                            id: match[1] || match[2],
                            element: item
                        });
                    }
                });

                if (emails.length > 0) {
                    addStatusControlsToEmailElements(emails);
                }
            }, 300);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Email Status Tracker integrated');

}, 1000);