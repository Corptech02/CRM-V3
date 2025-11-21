// Incoming Call Handler
(function() {
    console.log('Incoming call handler initialized');

    // Listen for incoming calls via SSE
    function setupIncomingCallListener() {
        if (!window.EventSource) {
            console.log('SSE not supported');
            return;
        }

        // Connect to SSE endpoint
        const eventSource = new EventSource('/api/twilio/events');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'incoming_call') {
                    console.log('Incoming call detected:', data);
                    window.showIncomingCallPopup(data);
                }
            } catch (error) {
                console.error('SSE message error:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            // Reconnect after 5 seconds
            setTimeout(setupIncomingCallListener, 5000);
        };

        window.incomingCallSSE = eventSource;
    }

    // Show incoming call popup
    window.showIncomingCallPopup = async function(callData) {
        // Remove any existing popup
        const existingPopup = document.getElementById('incomingCallPopup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Format phone number
        const fromNumber = callData.from?.replace('+1', '') || 'Unknown';
        const toNumber = callData.to?.replace('+1', '') || '';

        // FIND CLIENT IN DATABASE
        let client = null;
        const searchPhone = fromNumber.replace(/\D/g, ''); // Remove all non-digits

        // Search in database via API
        let policies = [];
        try {
            const response = await fetch(`/api/clients/search?phone=${searchPhone}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.client) {
                    client = data.client;
                    policies = data.policies || [];
                    console.log('Found client in database:', client.name, 'Phone:', client.phone, 'Policies:', policies.length);

                    // Store client info globally for answer function to use
                    window.currentIncomingCallClient = {
                        ...client,
                        policies: policies
                    };
                }
            }
        } catch (error) {
            console.error('Error searching for client:', error);
        }

        // Fallback to localStorage if API fails or client not found
        if (!client) {
            const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const allLeads = [...insurance_leads, ...regular_leads];

            for (const lead of allLeads) {
                if (lead.phone) {
                    const leadPhone = lead.phone.replace(/\D/g, '');
                    // Match last 10 digits or last 7 digits
                    if (leadPhone.slice(-10) === searchPhone.slice(-10) ||
                        leadPhone.slice(-7) === searchPhone.slice(-7) ||
                        leadPhone === searchPhone) {
                        client = lead;
                        console.log('Found client in localStorage:', lead.name, 'Phone:', lead.phone);
                        break;
                    }
                }
            }
        }

        // Create popup HTML
        const popup = document.createElement('div');
        popup.id = 'incomingCallPopup';
        popup.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: ${client ? (policies && policies.length > 0 ? '480px' : '420px') : '350px'};
            max-height: 80vh;
            overflow-y: auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInUp 0.3s ease;
        `;

        if (client) {
            // CLIENT FOUND - Show enhanced popup

            // Don't show detailed policies section anymore since we show key info at the top
            let policiesHTML = '';

            popup.innerHTML = `
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; color: white;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 11px; opacity: 0.95; margin-bottom: 4px; text-transform: uppercase;">⭐ EXISTING CLIENT</div>
                            <div style="font-size: 24px; font-weight: bold;">${client.name || client.company || 'Client'}</div>
                            <div style="font-size: 16px; opacity: 0.95; margin-top: 5px;">${formatPhoneNumber(fromNumber)}</div>
                            ${client.contact ? `<div style="font-size: 14px; opacity: 0.9;">Contact: ${client.contact}</div>` : ''}
                        </div>
                        <div style="animation: pulse 1s infinite;">
                            <i class="fas fa-phone fa-2x" style="transform: rotate(135deg);"></i>
                        </div>
                    </div>
                </div>

                <div style="padding: 15px; background: #f0f9ff;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${policies && policies.length > 0 ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Insurance Carrier</div>
                                <div style="font-size: 14px; font-weight: 600; color: #1f2937;">
                                    <i class="fas fa-building" style="color: #3b82f6;"></i> ${policies[0].carrier || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Policy Number</div>
                                <div style="font-size: 14px; font-weight: 600; color: #1f2937;">
                                    <i class="fas fa-file-alt" style="color: #10b981;"></i> ${policies[0].policyNumber || 'N/A'}
                                </div>
                            </div>
                        ` : client.insuranceCompany ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Insurance</div>
                                <div style="font-size: 14px; font-weight: 600;">${client.insuranceCompany}</div>
                            </div>
                        ` : ''}
                        ${client.stage ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Stage</div>
                                <div style="font-size: 14px; font-weight: 600;">${client.stage}</div>
                            </div>
                        ` : ''}
                        ${policies && policies.length > 0 && policies[0].expirationDate ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Policy Expires</div>
                                <div style="font-size: 14px; font-weight: 600; color: #dc2626;">
                                    <i class="fas fa-calendar-times"></i> ${new Date(policies[0].expirationDate).toLocaleDateString()}
                                </div>
                            </div>
                        ` : ''}
                        ${policies && policies.length > 0 && (policies[0].premium || policies[0].annualPremium) ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Premium</div>
                                <div style="font-size: 14px; color: #059669; font-weight: 600;">
                                    <i class="fas fa-dollar-sign"></i> ${((policies[0].premium || policies[0].annualPremium || '0').toString().replace(/[^0-9.]/g, '') * 1).toLocaleString()}
                                </div>
                            </div>
                        ` : client.totalPremium ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Total Premium</div>
                                <div style="font-size: 14px; color: #059669; font-weight: 600;">$${(client.totalPremium || 0).toLocaleString()}</div>
                            </div>
                        ` : ''}
                        ${client.assignedTo ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Assigned To</div>
                                <div style="font-size: 14px; font-weight: 600;">${client.assignedTo}</div>
                            </div>
                        ` : ''}
                        ${policies && policies.length > 1 ? `
                            <div>
                                <div style="font-size: 11px; color: #6b7280;">Total Policies</div>
                                <div style="font-size: 14px; font-weight: 600; color: #6366f1;">
                                    <i class="fas fa-layer-group"></i> ${policies.length} Active
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${policiesHTML}

                <div style="padding: 20px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                            flex: 1;
                            padding: 12px;
                            background: #10b981;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-phone"></i>
                            Answer
                        </button>
                        <button onclick="rejectIncomingCall('${callData.callControlId}')" style="
                            flex: 1;
                            padding: 12px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-phone-slash"></i>
                            Decline
                        </button>
                    </div>
                    <button onclick="window.location.hash='#clients'; setTimeout(() => viewClient('${client.id}'), 500);" style="
                        width: 100%;
                        padding: 10px;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        <i class="fas fa-user"></i> View Client Profile
                    </button>
                </div>
            `;
        } else {
            // UNKNOWN NUMBER - Show standard popup
            popup.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Incoming Call</div>
                            <div style="font-size: 20px; font-weight: bold;">${formatPhoneNumber(fromNumber)}</div>
                            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">To: ${formatPhoneNumber(toNumber)}</div>
                        </div>
                        <div style="animation: pulse 1s infinite;">
                            <i class="fas fa-phone fa-2x" style="transform: rotate(135deg);"></i>
                        </div>
                    </div>
                </div>
                <div style="padding: 15px; background: #fef3c7;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #92400e;">
                        <i class="fas fa-info-circle"></i>
                        <span style="font-size: 14px;">Unknown number - not in client database</span>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <div style="display: flex; gap: 10px;">
                        <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                            flex: 1;
                            padding: 15px;
                            background: #10b981;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-phone"></i>
                            Answer
                        </button>
                        <button onclick="rejectIncomingCall('${callData.callControlId}')" style="
                            flex: 1;
                            padding: 15px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-phone-slash"></i>
                            Decline
                        </button>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(popup);

        // Play ringtone
        window.playIncomingRingtone();

        // Auto-remove after 30 seconds if not answered
        setTimeout(() => {
            const popup = document.getElementById('incomingCallPopup');
            if (popup) {
                popup.remove();
                window.stopIncomingRingtone();
            }
        }, 30000);
    };

    // Answer incoming call
    window.answerIncomingCall = function(callControlId) {
        console.log('Answering call:', callControlId);

        // Store caller info from popup before removing it
        const popup = document.getElementById('incomingCallPopup');
        let callerNumber = 'Unknown';
        let callerName = 'Unknown';
        let callerInfo = null;

        if (popup) {
            // Extract the client name
            const nameDiv = popup.querySelector('div[style*="font-size: 24px"]');
            if (nameDiv) {
                callerName = nameDiv.textContent.trim();
            }

            // Extract the phone number
            const numberDiv = popup.querySelector('div[style*="font-size: 16px"]');
            if (numberDiv) {
                callerNumber = numberDiv.textContent.trim();
            }

            // Store all client info if available
            if (window.currentIncomingCallClient) {
                callerInfo = window.currentIncomingCallClient;
            }

            popup.remove();
        }

        // Stop ringtone
        window.stopIncomingRingtone();

        // First, ensure the phone tool window is open
        let phoneWindow = document.querySelector('.tool-window');
        let phoneWindowFound = false;

        // Check if phone window already exists
        const existingWindows = document.querySelectorAll('.tool-window');
        for (let win of existingWindows) {
            const title = win.querySelector('.window-title');
            if (title && title.textContent.includes('Phone')) {
                phoneWindow = win;
                phoneWindowFound = true;
                console.log('Phone window already open');
                break;
            }
        }

        if (!phoneWindowFound) {
            // Try to open the phone window
            const phoneButton = document.querySelector('.toolbar-btn[title="Phone"]') ||
                              document.querySelector('[onclick*="Phone"]') ||
                              Array.from(document.querySelectorAll('.toolbar-btn')).find(btn =>
                                  btn.textContent.includes('Phone') ||
                                  btn.innerHTML.includes('fa-phone'));

            if (phoneButton) {
                phoneButton.click();
                console.log('Opening phone window...');
            } else {
                console.error('Could not find phone button');
                // Try to create the window directly if we have the function
                if (typeof window.createToolWindow === 'function') {
                    window.createToolWindow('phone', 'Phone', 'fa-phone');
                    console.log('Created phone window directly');
                }
            }
        }

        // Wait for the phone window to be ready
        setTimeout(() => {
            // Send answer request to backend
            fetch(`/api/telnyx/answer/${callControlId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('Call answered:', data);

                // Show call controls in the phone window with client info
                if (typeof window.showCallControls === 'function') {
                    // Pass both name and number, plus full client info
                    const displayInfo = callerName !== 'Unknown' ? callerName : callerNumber;
                    window.showCallControls(displayInfo, callControlId, callerInfo);
                    console.log('Call controls shown for:', displayInfo);
                } else {
                    console.error('showCallControls function not found - make sure tool-windows.js is loaded');
                }

                // Mark as connected IMMEDIATELY (no delay) to start timer right away
                // Always try updateCallStatus first as it's the primary method
                if (typeof window.updateCallStatus === 'function') {
                    window.updateCallStatus('connected');
                    console.log('Call status updated to connected');
                } else if (typeof window.markCallConnected === 'function') {
                    window.markCallConnected();
                    console.log('Call marked as connected');
                } else {
                    // Fallback - manually update the UI
                    console.log('Using fallback to update call status');
                    const statusText = document.getElementById('callStatusText');
                    if (statusText) {
                        statusText.innerHTML = 'Connected';
                    }
                    const timer = document.getElementById('callTimer');
                    if (timer) {
                        timer.style.display = 'inline-block';
                        // Start timer if not running
                        if (!window.callTimer && !window.simpleCallTimer) {
                            let seconds = 0;
                            window.callTimer = setInterval(() => {
                                seconds++;
                                const mins = Math.floor(seconds / 60);
                                const secs = seconds % 60;
                                timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                            }, 1000);
                        }
                    }
                }

                // Stop any ringing sounds
                if (typeof window.stopRingingSound === 'function') {
                    window.stopRingingSound();
                    console.log('Ringing sound stopped');
                }

                showNotification('Call connected', 'success');
            })
            .catch(error => {
                console.error('Failed to answer call:', error);
                showNotification('Failed to answer call', 'error');
            });
        }, 1000); // Wait 1 second for phone window to open and load
    };

    // Reject incoming call
    window.rejectIncomingCall = function(callControlId) {
        console.log('Rejecting call:', callControlId);

        // Remove popup
        const popup = document.getElementById('incomingCallPopup');
        if (popup) {
            popup.remove();
        }

        // Stop ringtone
        window.stopIncomingRingtone();

        // Send reject request to backend
        fetch(`/api/telnyx/reject/${callControlId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Call rejected:', data);
            showNotification('Call declined', 'info');
        })
        .catch(error => {
            console.error('Failed to reject call:', error);
            showNotification('Failed to decline call', 'error');
        });
    };

    // Play incoming ringtone
    window.playIncomingRingtone = function() {
        if (!window.incomingRingtone) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Create ringtone pattern
            oscillator.frequency.value = 523.25; // C5
            gainNode.gain.value = 0.1;

            // Create ringing pattern
            window.ringtoneInterval = setInterval(() => {
                gainNode.gain.value = 0.1;
                setTimeout(() => {
                    gainNode.gain.value = 0;
                }, 400);
                setTimeout(() => {
                    gainNode.gain.value = 0.1;
                }, 600);
                setTimeout(() => {
                    gainNode.gain.value = 0;
                }, 1000);
            }, 2000);

            oscillator.start();
            window.incomingRingtone = oscillator;
            window.ringtoneGain = gainNode;
        }
    }

    // Stop incoming ringtone
    window.stopIncomingRingtone = function() {
        if (window.incomingRingtone) {
            try {
                window.incomingRingtone.stop();
            } catch(e) {}
            window.incomingRingtone = null;
        }
        if (window.ringtoneInterval) {
            clearInterval(window.ringtoneInterval);
            window.ringtoneInterval = null;
        }
    }

    // Format phone number for display
    function formatPhoneNumber(number) {
        const cleaned = number.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.substr(0,3)}) ${cleaned.substr(3,3)}-${cleaned.substr(6,4)}`;
        }
        return number;
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        @keyframes pulse {
            0%, 100% { transform: rotate(135deg) scale(1); }
            50% { transform: rotate(135deg) scale(1.1); }
        }
    `;
    document.head.appendChild(style);

    // Initialize SSE listener
    setupIncomingCallListener();

    // Test function
    window.testIncomingCall = function() {
        window.showIncomingCallPopup({
            callControlId: 'test-' + Date.now(),
            from: '+13305551234',
            to: '+13307652039'
        });
    };

    console.log('Incoming calls ready. Test with: testIncomingCall()');
})();