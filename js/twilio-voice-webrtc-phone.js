/*
 * Twilio Voice WebRTC Softphone - Uses Twilio Voice SDK instead of direct SIP
 * This is the proper way to do WebRTC calling with Twilio
 */

class TwilioVoiceWebRTCPhone {
    constructor() {
        this.device = null;
        this.connection = null;
        this.isReady = false;
        this.identity = 'vanguard-agent';

        this.init();
    }

    init() {
        console.log('📞 Initializing Twilio Voice WebRTC Phone...');
        this.createUI();
        // Skip WebRTC SDK entirely - go straight to Voice API mode
        setTimeout(() => {
            this.setupTwilioDevice();
        }, 100);
    }

    createUI() {
        // Create floating softphone widget
        const widget = document.createElement('div');
        widget.id = 'twilio-voice-widget';
        widget.innerHTML = `
            <div class="softphone-header">
                <span class="softphone-title">📞 Twilio Voice</span>
                <span id="twilio-status" class="status-indicator">●</span>
            </div>
            <div class="softphone-body">
                <div class="phone-display">
                    <input type="text" id="twilio-phone-number" placeholder="Enter phone number" maxlength="15" />
                </div>
                <div class="phone-keypad">
                    <div class="keypad-row">
                        <button class="key" onclick="twilioVoicePhone.addDigit('1')">1</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('2')">2</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('3')">3</button>
                    </div>
                    <div class="keypad-row">
                        <button class="key" onclick="twilioVoicePhone.addDigit('4')">4</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('5')">5</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('6')">6</button>
                    </div>
                    <div class="keypad-row">
                        <button class="key" onclick="twilioVoicePhone.addDigit('7')">7</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('8')">8</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('9')">9</button>
                    </div>
                    <div class="keypad-row">
                        <button class="key" onclick="twilioVoicePhone.addDigit('*')">*</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('0')">0</button>
                        <button class="key" onclick="twilioVoicePhone.addDigit('#')">#</button>
                    </div>
                </div>
                <div class="phone-controls">
                    <button id="twilio-call-btn" class="control-btn call" onclick="twilioVoicePhone.makeCall()">📞 Call</button>
                    <button id="twilio-hangup-btn" class="control-btn hangup" onclick="twilioVoicePhone.hangup()" disabled>🔴 Hangup</button>
                </div>
                <div class="phone-status">
                    <div id="twilio-call-status">Initializing...</div>
                    <div id="twilio-call-timer" style="display: none;">00:00</div>
                </div>
            </div>
        `;

        // Add CSS (reuse the same styles as the WebRTC version)
        const style = document.createElement('style');
        style.textContent = `
            #twilio-voice-widget {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 280px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }

            #twilio-voice-widget .softphone-header {
                background: #1f2937;
                color: white;
                padding: 12px 15px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
            }

            #twilio-voice-widget .status-indicator {
                font-size: 12px;
                color: #fbbf24;
            }

            #twilio-voice-widget .status-indicator.connected {
                color: #10b981;
            }

            #twilio-voice-widget .status-indicator.error {
                color: #ef4444;
            }

            #twilio-voice-widget .softphone-body {
                padding: 15px;
            }

            #twilio-voice-widget .phone-display input {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 16px;
                text-align: center;
                margin-bottom: 15px;
            }

            #twilio-voice-widget .phone-keypad {
                margin-bottom: 15px;
            }

            #twilio-voice-widget .keypad-row {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
            }

            #twilio-voice-widget .key {
                flex: 1;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: #f9fafb;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
            }

            #twilio-voice-widget .key:hover {
                background: #e5e7eb;
            }

            #twilio-voice-widget .key:active {
                background: #d1d5db;
            }

            #twilio-voice-widget .phone-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            #twilio-voice-widget .control-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }

            #twilio-voice-widget .control-btn.call {
                background: #1f2937;
                color: white;
            }

            #twilio-voice-widget .control-btn.hangup {
                background: #ef4444;
                color: white;
            }

            #twilio-voice-widget .control-btn:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }

            #twilio-voice-widget .phone-status {
                text-align: center;
                font-size: 14px;
                color: #6b7280;
            }

            #twilio-voice-widget #twilio-call-timer {
                font-weight: 600;
                color: #1f2937;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);
    }

    async setupTwilioDevice() {
        try {
            // Skip SDK setup entirely and go directly to fallback mode
            // since we know API keys aren't configured
            console.log('🔄 Skipping WebRTC SDK setup - using Voice API directly');
            this.setupFallbackCalling();
            return;

        } catch (error) {
            console.error('❌ Twilio setup error:', error);
            this.updateStatus('Setup failed', 'error');
            this.updateCallStatus('Setup failed');
        }
    }

    async loadTwilioSDK() {
        return new Promise((resolve, reject) => {
            console.log('📥 Loading Twilio Voice SDK...');

            // Check if Device is already available (try both global Device and Twilio.Device)
            if (typeof Device !== 'undefined' || (typeof Twilio !== 'undefined' && typeof Twilio.Device !== 'undefined')) {
                console.log('✅ Twilio Device already available');
                resolve();
                return;
            }

            // Array of SDK URLs to try (fallbacks)
            const sdkUrls = [
                // Working v1.14.0 URL (confirmed working)
                'https://sdk.twilio.com/js/client/releases/1.14.0/twilio.min.js',
                // Other working v1.x URLs (redirects to v1.14.0)
                'https://sdk.twilio.com/js/client/v1.14/twilio.min.js',
                'https://media.twiliocdn.com/sdk/js/client/v1.14/twilio.min.js',
                // Local fallback if we download the SDK
                '/js/twilio-voice-sdk/twilio.min.js'
            ];

            let currentUrlIndex = 0;

            const tryLoadSDK = () => {
                if (currentUrlIndex >= sdkUrls.length) {
                    reject(new Error('All Twilio SDK URLs failed to load'));
                    return;
                }

                const script = document.createElement('script');
                const currentUrl = sdkUrls[currentUrlIndex];

                console.log(`📥 Trying SDK URL ${currentUrlIndex + 1}/${sdkUrls.length}: ${currentUrl}`);
                script.src = currentUrl;

                script.onload = () => {
                    // Give it a moment to initialize
                    setTimeout(() => {
                        // Check both global Device and Twilio.Device
                        if (typeof Device !== 'undefined') {
                            console.log('✅ Twilio Voice SDK loaded successfully from:', currentUrl);
                            console.log('✅ Device constructor available:', typeof Device);
                            resolve();
                        } else if (typeof Twilio !== 'undefined' && typeof Twilio.Device !== 'undefined') {
                            console.log('✅ Twilio Voice SDK loaded successfully from:', currentUrl);
                            console.log('✅ Twilio.Device constructor available:', typeof Twilio.Device);
                            // Make Device globally available for compatibility
                            window.Device = Twilio.Device;
                            resolve();
                        } else {
                            console.warn('⚠️ SDK loaded but Device not available, trying next URL...');
                            console.warn('⚠️ Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('twilio')));
                            if (typeof Twilio !== 'undefined') {
                                console.warn('⚠️ Twilio object keys:', Object.keys(Twilio));
                            }
                            currentUrlIndex++;
                            tryLoadSDK();
                        }
                    }, 1000);
                };

                script.onerror = (error) => {
                    console.warn(`⚠️ Failed to load from ${currentUrl}, trying next...`);
                    currentUrlIndex++;
                    tryLoadSDK();
                };

                document.head.appendChild(script);
            };

            tryLoadSDK();

            // Global timeout after 15 seconds
            setTimeout(() => {
                if (typeof Device === 'undefined' && !(typeof Twilio !== 'undefined' && typeof Twilio.Device !== 'undefined')) {
                    reject(new Error('Twilio SDK loading timeout - no working URLs found'));
                }
            }, 15000);
        });
    }

    updateStatus(text, type = '') {
        const statusEl = document.getElementById('twilio-status');
        if (statusEl) {
            statusEl.className = `status-indicator ${type}`;
            statusEl.title = text;
            console.log('🔄 Status updated:', text, type);
        } else {
            console.warn('⚠️ twilio-status element not found');
        }
    }

    updateCallStatus(text) {
        const statusEl = document.getElementById('twilio-call-status');
        if (statusEl) {
            statusEl.textContent = text;
            console.log('📱 Call status updated:', text);
        } else {
            console.warn('⚠️ twilio-call-status element not found');
        }
    }

    addDigit(digit) {
        const input = document.getElementById('twilio-phone-number');
        if (input) {
            input.value += digit;
        }
    }

    async makeCall() {
        const phoneNumber = document.getElementById('twilio-phone-number')?.value;
        if (!phoneNumber) {
            alert('Please enter a phone number');
            return;
        }

        if (!this.isReady) {
            alert('Twilio Device not ready. Please wait.');
            return;
        }

        // Use fallback calling if in fallback mode
        if (this.isFallbackMode) {
            return this.makeCallFallback();
        }

        try {
            console.log('📞 Making call to:', phoneNumber);

            // Connect using Twilio Device
            this.connection = this.device.connect({
                To: phoneNumber
            });

            this.connection.on('accept', () => {
                console.log('✅ Call connected');
                this.updateCallStatus('Connected');
                this.startCallTimer();
                document.getElementById('twilio-call-btn').disabled = true;
                document.getElementById('twilio-hangup-btn').disabled = false;
            });

            this.connection.on('disconnect', () => {
                console.log('📞 Call disconnected');
                this.endCall();
            });

            this.connection.on('error', (error) => {
                console.error('❌ Call error:', error);
                this.updateCallStatus('Call failed');
                this.endCall();
            });

            this.updateCallStatus('Calling...');

        } catch (error) {
            console.error('❌ Call error:', error);
            this.updateCallStatus('Call error');
        }
    }

    hangup() {
        if (this.connection) {
            this.connection.disconnect();
        }
        this.endCall();
    }

    endCall() {
        this.connection = null;
        this.updateCallStatus('Ready');
        this.stopCallTimer();
        document.getElementById('twilio-call-btn').disabled = false;
        document.getElementById('twilio-hangup-btn').disabled = true;
    }

    startCallTimer() {
        this.callStartTime = Date.now();
        this.callTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');

            const timerEl = document.getElementById('twilio-call-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes}:${seconds}`;
                timerEl.style.display = 'block';
            }
        }, 1000);
    }

    stopCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
        const timerEl = document.getElementById('twilio-call-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
        }
    }

    handleIncomingCall(connection) {
        const shouldAnswer = confirm(`Incoming call from ${connection.parameters.From}. Answer?`);

        if (shouldAnswer) {
            this.connection = connection;
            this.connection.accept();

            this.updateCallStatus('Incoming call connected');
            this.startCallTimer();
            document.getElementById('twilio-call-btn').disabled = true;
            document.getElementById('twilio-hangup-btn').disabled = false;

            this.connection.on('disconnect', () => {
                this.endCall();
            });
        } else {
            connection.reject();
        }
    }

    // Fallback calling method using Voice API instead of SDK
    setupFallbackCalling() {
        this.isFallbackMode = true;
        this.isReady = true;

        // Ensure UI updates happen after DOM elements exist
        setTimeout(() => {
            this.updateStatus('Ready (API)', 'connected');
            this.updateCallStatus('Ready for calls (Voice API)');
            console.log('🎯 UI updated: Ready for Voice API calls');
        }, 100);

        console.log('📞 Fallback calling mode enabled - using Voice API');
    }

    // Override makeCall for fallback mode
    async makeCallFallback() {
        const phoneNumber = document.getElementById('twilio-phone-number')?.value;
        if (!phoneNumber) {
            alert('Please enter a phone number');
            return;
        }

        try {
            console.log('📞 Making call via Voice API to:', phoneNumber);
            this.updateCallStatus('Calling via API...');

            // Use existing makeTwilioVoiceCall function if available
            if (typeof window.makeTwilioVoiceCall === 'function') {
                await window.makeTwilioVoiceCall(phoneNumber);
                this.updateCallStatus('Call initiated via API');
                this.startCallTimer();
                document.getElementById('twilio-call-btn').disabled = true;
                document.getElementById('twilio-hangup-btn').disabled = false;
            } else {
                // Direct API call
                const response = await fetch('/api/twilio/call', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        to: phoneNumber,
                        from: '+13306369079' // Use configured phone number
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Failed to make call`);
                }

                const result = await response.json();
                console.log('✅ Call initiated:', result);
                this.updateCallStatus('Call initiated via API');
                this.startCallTimer();
                document.getElementById('twilio-call-btn').disabled = true;
                document.getElementById('twilio-hangup-btn').disabled = false;

                // Auto-hangup after 30 seconds for API calls
                setTimeout(() => {
                    if (this.callTimerInterval) {
                        this.endCall();
                    }
                }, 30000);
            }

        } catch (error) {
            console.error('❌ Fallback call error:', error);
            this.updateCallStatus('Call failed');
        }
    }
}

// Initialize when DOM is ready
function initTwilioVoicePhone() {
    window.twilioVoicePhone = new TwilioVoiceWebRTCPhone();
    console.log('📞 Twilio Voice WebRTC Phone initialized');
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📞 DOM loaded, initializing Twilio Voice Phone...');
    setTimeout(initTwilioVoicePhone, 1000);
});

// Manual initialization function
window.initTwilioVoicePhone = initTwilioVoicePhone;

// Function to show/hide the widget
window.toggleTwilioVoicePhone = function() {
    const widget = document.getElementById('twilio-voice-widget');
    if (widget) {
        widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
        console.log('📞 Twilio Voice phone toggled');
    } else {
        console.log('📞 Creating Twilio Voice phone...');
        initTwilioVoicePhone();
    }
};

console.log('✅ Twilio Voice WebRTC Phone script loaded');