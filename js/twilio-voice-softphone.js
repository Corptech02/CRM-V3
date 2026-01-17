// Twilio Voice SDK Softphone - Real browser-based phone
(function() {
    console.log('🎧 Twilio Voice Softphone initializing...');

    let device = null;
    let currentCall = null;
    let accessToken = null;

    // Initialize Twilio Voice Device
    window.initializeTwilioVoice = async function() {
        try {
            console.log('🎧 Getting Twilio access token...');

            // Get access token from backend
            const response = await fetch('/api/twilio/voice-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (!data.token) {
                throw new Error('Failed to get access token: ' + (data.error || 'No token provided'));
            }

            accessToken = data.token;
            console.log('✅ Got access token');

            // Load Twilio Voice SDK
            if (typeof Twilio === 'undefined') {
                console.log('📦 Loading Twilio Voice SDK...');
                await loadTwilioSDK();
            }

            // Initialize Device
            device = new Twilio.Device(accessToken, {
                codecPreferences: ['opus', 'pcmu'],
                fakeLocalDTMF: true,
                enableRingingState: true
            });

            // Device event handlers
            device.on('ready', function() {
                console.log('🎧 Twilio Voice device ready');
                showNotification('🎧 Browser softphone ready! You can now take calls through your browser.', 'success');
            });

            device.on('error', function(error) {
                console.error('❌ Twilio Voice device error:', error);
                showNotification('Voice device error: ' + error.message, 'error');
            });

            device.on('incoming', function(call) {
                console.log('📞 Incoming call via Twilio Voice:', call);
                handleIncomingVoiceCall(call);
            });

            device.on('disconnect', function(call) {
                console.log('📞 Call disconnected via Twilio Voice:', call);
                handleVoiceCallDisconnect(call);
            });

            // Register the device
            device.register();

            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Twilio Voice:', error);
            showNotification('Failed to initialize browser phone: ' + error.message, 'error');
            return false;
        }
    };

    // Load Twilio Voice SDK dynamically
    function loadTwilioSDK() {
        return new Promise((resolve, reject) => {
            if (typeof Twilio !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.twilio.com/js/voice/releases/2.1.1/twilio.min.js';
            script.onload = () => {
                console.log('✅ Twilio Voice SDK loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Twilio Voice SDK'));
            };
            document.head.appendChild(script);
        });
    }

    // Connect to incoming call via browser
    window.connectCallViaVoice = function(callSid) {
        console.log('🎧 Connecting call via Twilio Voice:', callSid);

        if (!device) {
            console.error('Device not initialized');
            showNotification('Voice device not ready', 'error');
            return;
        }

        // This would be used for outgoing calls
        // For incoming calls, we use the device.on('incoming') handler
        showNotification('🎧 Voice connection initiated...', 'info');
    };

    // Handle incoming call through Voice SDK
    function handleIncomingVoiceCall(call) {
        console.log('📞 Handling incoming Voice call:', call);

        currentCall = call;

        // Show call controls immediately
        showVoiceCallControls(call);

        // Auto-accept the call for our use case
        call.accept();

        showNotification('📞 Call connected through browser!', 'success');

        // Call event handlers
        call.on('disconnect', function() {
            handleVoiceCallDisconnect(call);
        });

        call.on('cancel', function() {
            console.log('📞 Call was cancelled');
            handleVoiceCallDisconnect(call);
        });
    }

    // Show voice call controls
    function showVoiceCallControls(call) {
        // Find phone window
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w => {
            const title = w.querySelector('.tool-window-title span');
            return title && title.textContent.includes('Phone');
        });

        if (!phoneWindow) return;

        // Remove existing controls
        const existingControls = phoneWindow.querySelector('#voiceCallControls');
        if (existingControls) {
            existingControls.remove();
        }

        // Create voice call controls
        const controls = document.createElement('div');
        controls.id = 'voiceCallControls';
        controls.style.cssText = `
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 20px;
            margin: 10px;
            border-radius: 10px;
            text-align: center;
        `;

        controls.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                🎧 Browser Voice Call Active
            </div>
            <div style="margin-bottom: 15px;">
                <div>🎤 Microphone: <span id="voiceMicStatus">🟢 Active</span></div>
                <div>🔊 Audio: <span id="voiceAudioStatus">🟢 Connected</span></div>
                <div style="font-size: 14px; margin-top: 10px;">
                    Speaking through browser microphone & speakers
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="toggleVoiceMute()" id="voiceMuteBtn" style="
                    background: #ef4444; color: white; border: none; border-radius: 5px;
                    padding: 10px 20px; cursor: pointer; font-weight: bold;
                ">
                    🔇 Mute
                </button>
                <button onclick="endVoiceCall()" style="
                    background: #dc2626; color: white; border: none; border-radius: 5px;
                    padding: 10px 20px; cursor: pointer; font-weight: bold;
                ">
                    📞 End Call
                </button>
                <button onclick="sendDTMF('*')" style="
                    background: #6b7280; color: white; border: none; border-radius: 5px;
                    padding: 10px 20px; cursor: pointer; font-weight: bold;
                ">
                    🔢 DTMF
                </button>
            </div>
        `;

        const content = phoneWindow.querySelector('[id$="-content"]');
        if (content) {
            content.appendChild(controls);
        }
    }

    // Toggle microphone mute
    window.toggleVoiceMute = function() {
        if (!currentCall) return;

        const isMuted = currentCall.isMuted();

        if (isMuted) {
            currentCall.mute(false);
        } else {
            currentCall.mute(true);
        }

        // Update UI
        const muteBtn = document.getElementById('voiceMuteBtn');
        const micStatus = document.getElementById('voiceMicStatus');

        if (!isMuted) { // Now muted
            muteBtn.innerHTML = '🔊 Unmute';
            muteBtn.style.background = '#10b981';
            micStatus.innerHTML = '🔴 Muted';
        } else { // Now unmuted
            muteBtn.innerHTML = '🔇 Mute';
            muteBtn.style.background = '#ef4444';
            micStatus.innerHTML = '🟢 Active';
        }
    };

    // End voice call
    window.endVoiceCall = function() {
        console.log('📞 Ending Voice call');

        if (currentCall) {
            currentCall.disconnect();
        }

        handleVoiceCallDisconnect(currentCall);
    };

    // Send DTMF tone
    window.sendDTMF = function(tone) {
        if (!currentCall) return;

        currentCall.sendDigits(tone);
        showNotification(`🔢 Sent DTMF: ${tone}`, 'info');
    };

    // Handle call disconnect
    function handleVoiceCallDisconnect(call) {
        console.log('📞 Voice call ended');

        currentCall = null;

        // Remove controls
        const controls = document.getElementById('voiceCallControls');
        if (controls) {
            controls.remove();
        }

        showNotification('📞 Voice call ended', 'info');
    }

    // Auto-initialize when page loads (on HTTPS)
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on HTTPS
        if (location.protocol === 'https:') {
            setTimeout(initializeTwilioVoice, 2000);
        } else {
            console.log('🚫 Voice SDK requires HTTPS - skipping initialization');
        }
    });

    // Also initialize if DOM is already loaded
    if (document.readyState !== 'loading' && location.protocol === 'https:') {
        setTimeout(initializeTwilioVoice, 1000);
    }

    console.log('🎧 Twilio Voice Softphone ready');

})();