// Override the makeCall function to ensure proper status updates
(function() {
    console.log('Call Status Fix Loaded');

    // Store the original makeCall if it exists
    const originalMakeCall = window.makeCall;

    // Create a new improved makeCall
    window.makeCallFixed = function() {
        const phoneNumber = document.getElementById('phoneNumber').value;
        if (!phoneNumber) {
            showNotification('Please enter a phone number', 'error');
            return;
        }

        console.log('Making call to:', phoneNumber);

        // Format phone number
        const formattedNumber = phoneNumber.replace(/\D/g, '');
        const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;

        // Get caller ID
        const callerIdSelect = document.getElementById('callerIdSelect');
        const fromNumber = callerIdSelect ? callerIdSelect.value : '+13307652039';

        // Show initial status
        const callStatus = document.getElementById('callStatus');
        const activeCallNumber = document.getElementById('activeCallNumber');

        if (callStatus) {
            callStatus.style.display = 'block';
            if (activeCallNumber) {
                activeCallNumber.innerHTML = `
                    <div>${phoneNumber}</div>
                    <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                        Initiating call...
                    </div>
                `;
            }
        }

        // Make the call through backend
        fetch('/api/telnyx/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: e164Number,
                from: fromNumber,
                webhookUrl: 'https://webhook.site/unique'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('=== CALL INITIATED ===');
            console.log('Full response:', data);

            // Extract call ID - try multiple fields
            const callId = data.data?.call_control_id ||
                          data.data?.call_leg_id ||
                          data.data?.id ||
                          data.call_control_id ||
                          data.call_leg_id ||
                          data.id;

            console.log('Extracted Call ID:', callId);

            if (!callId) {
                console.error('NO CALL ID IN RESPONSE!');
                showNotification('Call failed - no ID returned', 'error');
                return;
            }

            // Store globally
            window.currentCallId = callId;

            // Show call UI
            if (typeof showCallControls === 'function') {
                showCallControls(phoneNumber, callId);
            }

            // Start aggressive polling
            startAggressivePolling(callId);
        })
        .catch(error => {
            console.error('Call failed:', error);
            showNotification('Failed to initiate call', 'error');
        });
    };

    // Aggressive polling that definitely works
    window.startAggressivePolling = function(callId) {
        console.log('=== STARTING AGGRESSIVE POLLING ===');
        console.log('Call ID:', callId);

        let pollCount = 0;
        let connected = false;

        // Clear any existing polling
        if (window.aggressivePoller) {
            clearInterval(window.aggressivePoller);
        }

        // Poll every 1.5 seconds
        window.aggressivePoller = setInterval(() => {
            pollCount++;
            console.log(`=== POLL #${pollCount} ===`);

            // Stop after 60 polls (90 seconds) or if connected
            if (pollCount > 60 || connected) {
                clearInterval(window.aggressivePoller);
                if (!connected) {
                    console.log('Polling stopped - max attempts reached');
                }
                return;
            }

            // Make the status check
            const url = `/api/telnyx/call/${callId}/status`;
            console.log('Checking:', url);

            fetch(url)
                .then(response => {
                    console.log('Response status:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Status data:', data);

                    // Check if connected
                    if (data.status === 'connected' ||
                        data.status === 'answered' ||
                        data.telnyxState === 'active' ||
                        data.telnyxState === 'answered') {

                        console.log('*** CALL CONNECTED! ***');
                        connected = true;

                        // Update UI
                        if (typeof updateCallStatus === 'function') {
                            updateCallStatus('connected');
                        } else {
                            // Fallback UI update
                            const statusText = document.getElementById('callStatusText');
                            if (statusText) {
                                statusText.innerHTML = 'Connected';
                            }
                            const timer = document.getElementById('callTimer');
                            if (timer) {
                                timer.style.display = 'block';
                                // Start timer
                                if (!window.callTimer) {
                                    let seconds = 0;
                                    window.callTimer = setInterval(() => {
                                        seconds++;
                                        const mins = Math.floor(seconds / 60);
                                        const secs = seconds % 60;
                                        timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                                    }, 1000);
                                }
                            }

                            // Stop ringing sound
                            if (typeof stopRingingSound === 'function') {
                                stopRingingSound();
                            }
                        }

                        clearInterval(window.aggressivePoller);
                    }
                })
                .catch(error => {
                    console.error('Poll error:', error);
                });
        }, 1500); // Poll every 1.5 seconds
    };

    // Don't replace the working makeCall function from tool-windows.js
    // Only expose makeCallFixed as an alternative
    console.log('makeCallFixed available as alternative to makeCall');
    console.log('Original makeCall function preserved');

    // Also expose globally for testing
    window.testCallStatus = function(callId) {
        if (!callId) {
            console.log('Please provide a call ID');
            return;
        }
        console.log('Testing status for:', callId);
        startAggressivePolling(callId);
    };

    console.log('Call status fix ready. Use makeCall() or testCallStatus(callId)');
})();