// Incoming Call Handler
(function() {
    // Debug: Incoming call handler loading
    console.log('🚨 INCOMING CALL HANDLER LOADING - DEBUG MODE 🚨');

    // FORCE DEBUG NOTIFICATIONS
    if (typeof showNotification === 'function') {
        showNotification('📞 Incoming Call Handler Loaded!', 'info');
    } else {
        console.error('❌ showNotification function not found!');
    }

    // Listen for incoming calls via SSE
    function setupIncomingCallListener() {
        if (!window.EventSource) {
            console.log('❌ SSE not supported');
            return;
        }

        // Prevent multiple connections
        if (window.incomingCallSSE) {
            console.log('🔌 SSE connection already exists, closing old one...');
            window.incomingCallSSE.close();
        }

        console.log('🔌 Connecting to SSE endpoint /api/twilio/events...');

        // FORCE DEBUG NOTIFICATION
        if (typeof showNotification === 'function') {
            showNotification('🔌 Connecting to SSE for incoming calls...', 'info');
        }

        // Connect to SSE endpoint
        const eventSource = new EventSource('/api/twilio/events');

        eventSource.onopen = () => {
            console.log('✅ SSE connection established');

            // FORCE DEBUG NOTIFICATION
            if (typeof showNotification === 'function') {
                showNotification('✅ SSE Connected - Ready for calls!', 'success');
            }
        };

        eventSource.onmessage = (event) => {
            try {
                console.log('📨 SSE message received:', event.data);
                const data = JSON.parse(event.data);

                // FORCE DEBUG NOTIFICATION FOR ANY MESSAGE
                if (typeof showNotification === 'function') {
                    showNotification(`📨 SSE Message: ${data.type}`, 'info');
                }

                if (data.type === 'incoming_call') {
                    console.log('🚨🚨🚨 INCOMING CALL DETECTED! 🚨🚨🚨');
                    console.log('📞 Call data:', data);

                    // FORCE DEBUG NOTIFICATION
                    if (typeof showNotification === 'function') {
                        showNotification(`🚨 INCOMING CALL! From: ${data.from}`, 'warning');
                    }

                    window.showIncomingCallPopup(data);
                } else if (data.type === 'call_ended') {
                    console.log('📞 Call ended detected:', data);
                    window.handleCallEnded(data);
                } else if (data.type === 'connected') {
                    console.log('✅ SSE connection confirmed by server');
                }
            } catch (error) {
                console.error('❌ SSE message error:', error, 'Raw data:', event.data);
            }
        };

        eventSource.onerror = (error) => {
            console.error('❌ SSE connection error:', error);
            console.log('🛑 Auto-reconnect disabled to prevent infinite loop');
            // DISABLED: Auto-reconnect to prevent infinite loop
            // setTimeout(setupIncomingCallListener, 5000);

            // Close the connection to prevent further attempts
            eventSource.close();
            window.incomingCallSSE = null;
        };

        window.incomingCallSSE = eventSource;
    }

    // Show incoming call popup
    window.showIncomingCallPopup = async function(callData) {
        console.log('🚨 showIncomingCallPopup called with:', callData);

        // Store call data globally so answerIncomingCall can access it
        window.lastIncomingCallData = callData;

        // Remove any existing popup
        const existingPopup = document.getElementById('incomingCallPopup');
        if (existingPopup) {
            console.log('🗑️ Removing existing popup');
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
                <div style="background: linear-gradient(135deg, ${callData.lineType === 'Main Line' ? '#f59e0b 0%, #d97706 100%' : '#10b981 0%, #059669 100%'}); padding: 20px; color: white;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 11px; opacity: 0.95; margin-bottom: 4px; text-transform: uppercase;">
                                ${callData.lineType === 'Main Line' ? '🏢' : '📞'} ${callData.lineType || 'Incoming Call'} • ⭐ EXISTING CLIENT
                            </div>
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
                <div style="background: linear-gradient(135deg, ${callData.lineType === 'Main Line' ? '#f59e0b 0%, #d97706 100%' : '#667eea 0%, #764ba2 100%'}); padding: 20px; color: white;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">
                                ${callData.lineType === 'Main Line' ? '🏢' : '📞'} ${callData.lineType || 'Incoming Call'}
                            </div>
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

        // Auto-remove after 2 minutes (120 seconds) if not answered
        setTimeout(() => {
            const popup = document.getElementById('incomingCallPopup');
            if (popup) {
                popup.remove();
                window.stopIncomingRingtone();
            }
        }, 120000);
    };

    // Answer incoming call
    window.answerIncomingCall = function(callControlId) {
        console.log('Answering call:', callControlId);

        // Get the current incoming call data from the global store
        let callData = null;
        let callerNumber = 'Unknown';
        let callerName = 'Unknown';
        let callerInfo = null;

        // Try to get call data from the SSE message that triggered this popup
        if (window.lastIncomingCallData) {
            callData = window.lastIncomingCallData;
            callerNumber = callData.from?.replace('+1', '') || 'Unknown';
        }

        // Store caller info from popup before removing it
        const popup = document.getElementById('incomingCallPopup');
        if (popup) {
            // Extract the client name if available
            const nameDiv = popup.querySelector('div[style*="font-size: 24px"]');
            if (nameDiv) {
                callerName = nameDiv.textContent.trim();
            }

            // Use original phone number if we couldn't get it from call data
            if (callerNumber === 'Unknown') {
                const numberDiv = popup.querySelector('div[style*="font-size: 16px"]');
                if (numberDiv) {
                    callerNumber = numberDiv.textContent.trim();
                }
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
            // Use the working pickup method
            console.log('📞 Using simple pickup for call:', callControlId);

            if (typeof window.pickupCall === 'function') {
                window.pickupCall(callControlId);
            } else {
                console.error('pickupCall function not available');
                showNotification('Error: Call pickup function not available', 'error');
            }

            // Update call status immediately for UI
            updateCallStatus(callControlId, 'connected');
            showCallControls(callData.from);

            // Wait a moment then show call controls
            setTimeout(() => {
                // Show call controls in the phone window with client info
                if (typeof window.showCallControls === 'function') {
                    // Use the phone number for display, and set status as connected
                    const displayInfo = callerNumber !== 'Unknown' ? callerNumber : 'Unknown';
                    window.showCallControls(displayInfo, callControlId, 'Connected');
                    console.log('Call controls shown for:', displayInfo);
                } else {
                    console.error('showCallControls function not found - make sure tool-windows.js is loaded');
                }
            }, 2000); // Wait 2 seconds for connection

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
        fetch(`/api/twilio/reject/${callControlId}`, {
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

    // Play incoming ringtone with audio
    window.playIncomingRingtone = function() {
        console.log('🔔 Playing ringtone with audio...');

        // Always show visual notification (audio may be blocked)
        showNotification('🔔 INCOMING CALL RINGING! ☎️ Answer or Decline', 'warning');

        // Try simple audio ringtone
        try {
            // Create audio element with embedded ringtone sound
            const audio = new Audio();
            audio.volume = 0.5;
            audio.loop = true;

            // Use a simple embedded ringtone sound (beep pattern)
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBy+Y3vLEayYI';

            // Play the audio
            audio.play().then(() => {
                console.log('✅ Audio ringtone started');
                window.ringtoneAudio = audio;
            }).catch(error => {
                console.log('Audio play blocked by browser - visual only');
            });

        } catch (error) {
            console.log('Audio creation failed - visual notification only');
        }

        // Try simple browser notification for system sound
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📞 Incoming Call', {
                body: 'Someone is calling your business line!',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="green"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">📞</text></svg>',
                tag: 'incoming-call',
                requireInteraction: true
            });
        } else if ('Notification' in window && Notification.permission === 'default') {
            // Request permission for future calls
            Notification.requestPermission();
        }

        // Flash the browser tab title
        flashTabTitle();

        console.log('✅ Visual ringtone activated');
    }

    // Flash browser tab title to get attention
    function flashTabTitle() {
        const originalTitle = document.title;
        let flashCount = 0;
        const maxFlashes = 20;

        const flashInterval = setInterval(() => {
            document.title = flashCount % 2 === 0 ? '📞 INCOMING CALL!' : originalTitle;
            flashCount++;

            if (flashCount >= maxFlashes) {
                document.title = originalTitle;
                clearInterval(flashInterval);
            }
        }, 500);

        // Store interval so we can stop it when call is answered
        window.titleFlashInterval = flashInterval;
    }

    // Fallback Web Audio ringtone - FIXED to avoid spam
    function tryWebAudioRingtone() {
        // Don't create multiple intervals
        if (window.ringtoneInterval) {
            console.log('⚠️ Ringtone interval already running');
            return;
        }

        console.log('🔔 Trying WebAudio fallback (silent - need user click first)');

        // Just show visual notification since audio is blocked
        showNotification('🔔 PHONE RINGING! Click anywhere to enable audio for future calls', 'warning');

        // Don't try to play blocked audio, just give up gracefully
        console.log('ℹ️ Audio blocked - visual notification shown instead');
    }

    // Stop incoming ringtone
    window.stopIncomingRingtone = function() {
        console.log('🔕 Stopping ringtone...');

        // Stop any ringtone audio
        if (window.ringtoneAudio) {
            window.ringtoneAudio.pause();
            window.ringtoneAudio.currentTime = 0;
            window.ringtoneAudio = null;
            console.log('✅ Audio ringtone stopped');
        }

        // Stop title flashing
        if (window.titleFlashInterval) {
            clearInterval(window.titleFlashInterval);
            window.titleFlashInterval = null;
            // Restore original title
            document.title = document.title.replace('📞 INCOMING CALL!', '').trim() || 'Vanguard Insurance Software';
            console.log('✅ Title flashing stopped');
        }

        // Stop HTML5 audio
        if (window.incomingRingtoneAudio) {
            window.incomingRingtoneAudio.pause();
            window.incomingRingtoneAudio.currentTime = 0;
            console.log('✅ HTML5 audio ringtone stopped');
        }

        // Stop WebAudio ringtone
        if (window.incomingRingtone) {
            try {
                window.incomingRingtone.stop();
            } catch(e) {}
            window.incomingRingtone = null;
        }

        // Clear ringtone interval
        if (window.ringtoneInterval) {
            clearInterval(window.ringtoneInterval);
            window.ringtoneInterval = null;
            console.log('✅ Ringtone interval cleared');
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
    // TEMPORARILY DISABLED: setupIncomingCallListener();

    // Test function
    window.testIncomingCall = function() {
        window.showIncomingCallPopup({
            callControlId: 'test-' + Date.now(),
            from: '+13305551234',
            to: '+13307652039'
        });
    };

    // Handle call ended event
    window.handleCallEnded = function(callData) {
        console.log('📞 Call ended:', callData);

        // Remove any existing incoming call popup
        const popup = document.getElementById('incomingCallPopup');
        if (popup) {
            popup.remove();
            console.log('✅ Removed incoming call popup');
        }

        // Stop ringtone if playing
        window.stopIncomingRingtone();

        // End any active call in the phone tool and restore original content
        if (typeof window.endCallCleanup === 'function') {
            window.endCallCleanup();
            console.log('✅ Ended call in phone tool and restored original content');
        } else if (typeof window.endCall === 'function') {
            window.endCall();
            console.log('✅ Ended call in phone tool');
        }

        // Clear call timers
        if (window.callTimer) {
            clearInterval(window.callTimer);
            window.callTimer = null;
            console.log('✅ Cleared call timer');
        }

        if (window.simpleCallTimer) {
            clearInterval(window.simpleCallTimer);
            window.simpleCallTimer = null;
            console.log('✅ Cleared simple call timer');
        }

        // Update call status display
        const statusText = document.getElementById('callStatusText');
        if (statusText) {
            statusText.innerHTML = 'Call ended';
        }

        // Hide call controls
        const callControls = document.querySelector('.call-controls');
        if (callControls) {
            callControls.style.display = 'none';
            console.log('✅ Hid call controls');
        }

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Call ended - ${callData.status}`, 'info');
        }

        // Auto-close phone tool window after 3 seconds
        setTimeout(() => {
            const phoneWindows = Array.from(document.querySelectorAll('.tool-window')).filter(w => {
                const title = w.querySelector('.tool-window-title span');
                return title && title.textContent.includes('Phone');
            });

            phoneWindows.forEach(phoneWindow => {
                if (typeof closeWindow === 'function') {
                    closeWindow(phoneWindow.id);
                    console.log('✅ Auto-closed phone tool window');
                }
            });
        }, 3000);

        console.log('✅ Call cleanup completed');
    };

    // Add debug test function
    window.testSSE = function() {
        console.log('🧪 Testing SSE connection...');
        if (window.incomingCallSSE) {
            console.log('📊 Current SSE state:', window.incomingCallSSE.readyState);
            console.log('📊 SSE states: 0=CONNECTING, 1=OPEN, 2=CLOSED');
        } else {
            console.log('❌ No SSE connection found');
        }
    };

    // Test popup directly
    window.testPopup = function() {
        console.log('🧪 Testing popup directly...');
        window.showIncomingCallPopup({
            type: 'incoming_call',
            callControlId: 'TEST-POPUP',
            from: '+15551234567',
            to: '+13306369079',
            lineType: "Grant's Direct Line",
            isPersonalLine: true,
            status: 'ringing'
        });
    };

    // Function to add a conference join button to the phone interface
    window.addConferenceJoinButton = function(conferenceName) {
        console.log('🔧 Adding conference join button for:', conferenceName);

        // Find the phone tool window
        const phoneWindows = document.querySelectorAll('.tool-window');
        console.log('🔧 Found', phoneWindows.length, 'tool windows');

        let phoneWindow = null;
        phoneWindows.forEach((w, index) => {
            const title = w.querySelector('.tool-window-title span');
            const titleText = title ? title.textContent : 'No title';
            console.log(`🔧 Window ${index}: "${titleText}"`);
            if (title && title.textContent.includes('Phone')) {
                phoneWindow = w;
                console.log('🔧 Found phone window!');
            }
        });

        if (!phoneWindow) {
            console.error('❌ Phone window not found');
            console.log('🔧 Trying alternative selector...');

            // Try to find any window with phone-related content
            const allWindows = document.querySelectorAll('.tool-window');
            for (let win of allWindows) {
                if (win.innerHTML.includes('Call') || win.innerHTML.includes('phone') || win.innerHTML.includes('Phone')) {
                    phoneWindow = win;
                    console.log('🔧 Found phone window via content search');
                    break;
                }
            }
        }

        if (!phoneWindow) {
            console.error('❌ Still no phone window found');
            return;
        }

        // Find the call controls area
        const callControls = phoneWindow.querySelector('.call-controls') ||
                           phoneWindow.querySelector('[style*="background: rgba(0,0,0,0.3)"]') ||
                           phoneWindow.querySelector('[id$="-content"]');

        console.log('🔧 Call controls element:', callControls ? 'Found' : 'Not found');

        if (callControls) {
            console.log('🔧 Adding button to call controls...');

            // Add join conference button
            const joinButton = document.createElement('button');
            joinButton.innerHTML = `
                <i class="fas fa-phone"></i>
                <div style="font-size: 12px; margin-top: 5px;">Join Conference</div>
            `;
            joinButton.style.cssText = `
                background: #ff0000 !important;
                color: white !important;
                border: 3px solid #ffff00 !important;
                border-radius: 8px !important;
                padding: 20px !important;
                cursor: pointer !important;
                margin: 10px auto !important;
                display: block !important;
                width: 250px !important;
                font-size: 16px !important;
                font-weight: 600 !important;
                z-index: 99999 !important;
                position: relative !important;
                box-shadow: 0 0 20px rgba(255,0,0,0.8) !important;
            `;
            joinButton.onclick = () => {
                // Extract call SID from conference name (format: call-CALLSID)
                const callSid = conferenceName.replace('call-', '');
                window.connectCallDirectly(callSid);
            };

            // Add instructions
            const instructions = document.createElement('div');
            instructions.innerHTML = `
                <div style="text-align: center; color: #000000 !important; font-size: 14px !important; margin: 10px !important; padding: 15px !important; background: #ffff00 !important; border-radius: 5px !important; border: 2px solid #ff0000 !important; z-index: 99998 !important; position: relative !important;">
                    <strong>🚨 CLIENT WAITING IN CONFERENCE 🚨</strong><br>
                    <strong>Conference:</strong> ${conferenceName}<br>
                    <strong>CLICK THE RED BUTTON BELOW TO JOIN!</strong>
                </div>
            `;

            callControls.appendChild(instructions);
            callControls.appendChild(joinButton);

            console.log('✅ Join button added successfully!');
        } else {
            console.error('❌ No call controls found to add button to');

            // As a fallback, try to add it anywhere in the phone window
            if (phoneWindow) {
                console.log('🔧 Adding button directly to phone window as fallback...');
                const fallbackContainer = document.createElement('div');
                fallbackContainer.style.cssText = 'padding: 10px; background: rgba(255,0,0,0.2); margin: 5px;';
                fallbackContainer.innerHTML = `
                    <div style="color: white; text-align: center;">
                        <strong>⚠️ CONFERENCE WAITING</strong><br>
                        <button onclick="window.connectCallDirectly('${conferenceName.replace('call-', '')}')" style="
                            background: #10b981; color: white; border: none; border-radius: 8px;
                            padding: 15px; cursor: pointer; margin: 10px; font-size: 14px; font-weight: 600;
                        ">
                            🎧 Join Conference Now
                        </button>
                    </div>
                `;
                phoneWindow.appendChild(fallbackContainer);
                console.log('✅ Fallback button added to phone window');
            }
        }
    };

    // Function to join conference manually
    window.joinConference = function(conferenceName) {
        console.log('Attempting to join conference:', conferenceName);

        // Use Twilio Voice API to create a call that joins the conference
        fetch('/api/twilio/join-conference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conferenceName: conferenceName,
                agentPhone: '+13306369079' // You'll need to answer this call
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Conference join response:', data);
            if (data.success) {
                showNotification('Conference call being placed to your phone - please answer!', 'info');
            } else {
                showNotification('Failed to join conference: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Failed to join conference:', error);
            showNotification('Failed to join conference', 'error');
        });
    };

    // Test function to manually create join button
    window.testJoinButton = function() {
        const testConference = 'test-conference-' + Date.now();
        console.log('🧪 Testing join button creation with:', testConference);
        window.addConferenceJoinButton(testConference);
    };

    // Test function to manually try joining conference
    window.testJoinConference = function() {
        const testConference = 'test-conference-123';
        console.log('🧪 Testing conference join with:', testConference);
        if (typeof window.joinConferenceBrowserAudio === 'function') {
            console.log('✅ joinConferenceBrowserAudio function available');
            window.joinConferenceBrowserAudio(testConference);
        } else {
            console.error('❌ joinConferenceBrowserAudio function NOT available');
        }
    };

    console.log('Incoming calls ready. Test with: testIncomingCall(), testSSE(), testJoinButton(), or testJoinConference()');

    // Test audio permissions on first user interaction
    window.enableAudioForIncomingCalls = function() {
        console.log('🔊 Testing audio permissions...');

        try {
            // Create a short test beep to enable audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);

            showNotification('🔊 Audio enabled for incoming calls!', 'success');
            console.log('✅ Audio permissions enabled');

            // Store permission state
            window.audioPermissionGranted = true;

        } catch (error) {
            console.error('❌ Audio permission failed:', error);
            showNotification('❌ Audio permission denied', 'error');
        }
    };

    // Auto-prompt for audio permission after page loads
    setTimeout(() => {
        if (typeof showNotification === 'function') {
            showNotification('🔊 Click here to enable ringtone audio ↗', 'info');

            // Add click listener to any element to enable audio
            document.addEventListener('click', function enableAudioOnFirstClick() {
                if (!window.audioPermissionGranted) {
                    enableAudioForIncomingCalls();
                    document.removeEventListener('click', enableAudioOnFirstClick);
                }
            }, { once: true });
        }
    }, 3000);

    // Initialize the incoming call listener
    // TEMPORARILY DISABLED: setupIncomingCallListener();
})();