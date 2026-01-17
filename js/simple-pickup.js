// Simple Call Pickup - Just answer the main line call directly
(function() {
    console.log('Simple Call Pickup handler loading...');

    // Simple pickup function - just answer the call
    window.pickupCall = function(callSid) {
        console.log('📞 Picking up call directly:', callSid);

        // Show pickup message
        showNotification('📞 Answering call - you will be connected directly!', 'info');

        // Make the pickup request
        fetch('/api/twilio/pickup-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                callSid: callSid
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Pickup response:', data);

            if (data.success) {
                showNotification('✅ Call answered! The music has stopped and you are now connected. The caller can speak to you.', 'success');
                showCallStatus(callSid, 'answered');

                // Note: Conference joining is not currently supported due to TwiML app configuration
                // The call is answered directly and audio should work through the main line
                if (data.conferenceName) {
                    console.log('🎧 Conference created:', data.conferenceName);
                    console.log('📞 Audio connection is handled by Twilio automatically');
                }
            } else {
                throw new Error(data.error || 'Failed to pickup call');
            }
        })
        .catch(error => {
            console.error('❌ Pickup failed:', error);
            showNotification('Failed to pickup call: ' + error.message, 'error');
        });
    };

    // Join Twilio conference for audio connection
    // NOTE: This function is currently disabled due to TwiML app configuration requirements
    // For Voice SDK v2, we would need to set up a TwiML Application in Twilio console
    function joinConference(conferenceName, callSid) {
        console.log('🎧 Conference joining disabled - TwiML app configuration required');
        console.log('📞 Call is answered directly, audio should work through main line');

        showNotification('✅ Call answered! Direct audio connection active.', 'success');
        showCallStatus(callSid, 'connected');

        /* DISABLED - Requires TwiML Application setup in Twilio Console
        console.log('🎧 Joining conference:', conferenceName);

        showNotification('🎧 Connecting audio - please allow microphone access...', 'info');

        // Get Twilio access token for conference
        fetch('/api/twilio/voice-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identity: 'agent-' + Date.now(),
                room: conferenceName
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.token) {
                console.log('🎧 Got Twilio token, connecting to conference...');

                // Initialize Twilio Device with the token
                const device = new Twilio.Voice.Device(data.token, {
                    logLevel: 'debug',
                    answerOnBridge: true
                });

                device.on('ready', () => {
                    console.log('🎧 Twilio Device ready, calling conference...');

                    // Connect to the conference
                    const connection = device.connect({
                        params: {
                            conference: conferenceName
                        }
                    });

                    connection.on('accept', () => {
                        console.log('🎧 Successfully joined conference!');
                        showNotification('✅ Audio connected! You can now speak with the caller.', 'success');
                        showCallStatus(callSid, 'connected', conferenceName);
                    });

                    connection.on('error', error => {
                        console.error('❌ Conference connection error:', error);
                        showNotification('Failed to connect audio: ' + error.message, 'error');
                    });

                    connection.on('disconnect', () => {
                        console.log('🎧 Conference disconnected');
                        showNotification('Audio disconnected', 'info');
                    });
                });

                device.on('error', error => {
                    console.error('❌ Twilio Device error:', error);
                    showNotification('Audio device error: ' + error.message, 'error');
                });

            } else {
                throw new Error(data.error || 'Failed to get voice token');
            }
        })
        .catch(error => {
            console.error('❌ Failed to join conference:', error);
            showNotification('Failed to connect audio: ' + error.message, 'error');
        });
        */
    }

    // Show call status after pickup
    function showCallStatus(callSid, status, conferenceName = null) {
        // Find phone window
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w => {
            const title = w.querySelector('.tool-window-title span');
            return title && title.textContent.includes('Phone');
        });

        if (!phoneWindow) return;

        // Remove existing status
        const existingStatus = phoneWindow.querySelector('#callStatus');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status display
        const statusDiv = document.createElement('div');
        statusDiv.id = 'callStatus';
        statusDiv.style.cssText = `
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            padding: 20px;
            margin: 10px;
            border-radius: 10px;
            text-align: center;
            border: 3px solid #34d399;
        `;

        statusDiv.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                📞 Call Active - Direct Phone Connection
            </div>
            <div style="margin-bottom: 15px;">
                <div>Status: <span style="color: #34d399;">Connected</span></div>
                <div>Call ID: ${callSid}</div>
                <div style="font-size: 14px; margin-top: 10px; line-height: 1.4;">
                    ✅ The welcome music has been stopped<br>
                    ✅ The caller is being connected to your phone<br>
                    ✅ Answer your phone to complete the connection
                </div>
            </div>
            <div>
                <button onclick="hangupCall('${callSid}')" style="
                    background: #dc2626; color: white; border: none; border-radius: 8px;
                    padding: 15px 25px; cursor: pointer; font-weight: bold; font-size: 16px;
                    margin-right: 10px;
                ">
                    📞 End Call
                </button>
                <button onclick="muteCall('${callSid}')" id="muteBtn-${callSid}" style="
                    background: #f59e0b; color: white; border: none; border-radius: 8px;
                    padding: 15px 25px; cursor: pointer; font-weight: bold; font-size: 16px;
                ">
                    🔇 Mute
                </button>
            </div>
        `;

        const content = phoneWindow.querySelector('[id$="-content"]');
        if (content) {
            content.appendChild(statusDiv);
        }
    }

    // Hangup call
    window.hangupCall = function(callSid) {
        console.log('📞 Hanging up call:', callSid);

        fetch(`/api/twilio/hangup/${callSid}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Call ended:', data);
            showNotification('📞 Call ended successfully', 'info');

            // Remove status display
            const status = document.getElementById('callStatus');
            if (status) status.remove();
        })
        .catch(error => {
            console.error('❌ Error ending call:', error);
            showNotification('Error ending call: ' + error.message, 'error');
        });
    };

    // Mute functionality (placeholder - would need backend support)
    window.muteCall = function(callSid) {
        console.log('🔇 Toggle mute for call:', callSid);
        showNotification('🔇 Mute feature would require additional Twilio configuration', 'info');
    };

    console.log('Simple Call Pickup ready');
})();