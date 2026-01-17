/*
 * Vanguard CRM SIP Softphone Integration
 * Based on SaraPhone WebRTC SIP client
 * Integrated with existing CRM call handling
 */

'use strict';

class VanguardSoftphone {
    constructor(config) {
        this.config = config;
        this.ua = null;
        this.currentCall = null;
        this.isRegistered = false;
        this.isOnMute = false;
        this.isOnHold = false;
        this.incomingSession = null;

        // Audio elements for ringtones (with error handling)
        try {
            this.ringtone = new Audio('/saraphone/wav/ringtone.wav');
            this.ringtone.loop = true;
        } catch (error) {
            console.warn('⚠️ Could not load ringtone audio file, using silent mode:', error);
            this.ringtone = { play: () => {}, pause: () => {} }; // Mock object
        }

        // Initialize the softphone
        this.init();
    }

    init() {
        console.log('🎯 Initializing Vanguard SIP Softphone...');

        // Always create UI first, SIP functionality can be added later
        this.createUI();
        this.setupEventHandlers();

        // Check if SIP.js is loaded for functionality
        if (typeof SIP === 'undefined') {
            console.warn('⚠️ SIP.js library not found. SIP functionality will be limited.');
            // Update UI to show SIP.js is needed
            setTimeout(() => {
                const statusElement = document.getElementById('sip-status');
                if (statusElement) {
                    statusElement.textContent = '⚠️';
                    statusElement.title = 'SIP.js library not loaded';
                }
            }, 100);
        } else {
            console.log('✅ SIP.js library found, full functionality available');
        }
    }

    createUI() {
        // Create softphone UI container
        const softphoneHTML = `
            <div id="vanguard-softphone" class="softphone-container" style="
                position: fixed;
                top: 80px;
                right: 20px;
                width: 280px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                font-family: Arial, sans-serif;
                display: none;
            ">
                <div class="softphone-header" style="
                    background: #2563eb;
                    color: white;
                    padding: 12px 15px;
                    border-radius: 8px 8px 0 0;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>📞 VanguardPhone</span>
                    <span id="sip-status" style="font-size: 12px;">●</span>
                </div>

                <!-- Registration Section -->
                <div id="registration-section" style="padding: 15px;">
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">SIP Server:</label>
                        <input type="text" id="sip-server" placeholder="sip.yourdomain.com" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Extension:</label>
                        <input type="text" id="sip-extension" placeholder="1001" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Password:</label>
                        <input type="password" id="sip-password" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    </div>
                    <button id="register-btn" style="
                        width: 100%;
                        background: #059669;
                        color: white;
                        border: none;
                        padding: 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Register</button>
                </div>

                <!-- Phone Section -->
                <div id="phone-section" style="padding: 15px; display: none;">
                    <div style="margin-bottom: 15px; text-align: center;">
                        <input type="text" id="dial-number" placeholder="Enter number to dial" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 14px;">
                    </div>

                    <!-- Dialpad -->
                    <div class="dialpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;">
                        ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(key =>
                            `<button class="dial-btn" data-digit="${key}" style="
                                padding: 12px;
                                background: #f8f9fa;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: bold;
                            ">${key}</button>`
                        ).join('')}
                    </div>

                    <!-- Call Controls -->
                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="call-btn" style="flex: 1; background: #059669; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer;">📞 Call</button>
                        <button id="hangup-btn" style="flex: 1; background: #dc2626; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer;" disabled>📞 Hang Up</button>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button id="mute-btn" style="flex: 1; background: #6b7280; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;" disabled>🔇 Mute</button>
                        <button id="hold-btn" style="flex: 1; background: #6b7280; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;" disabled>⏸️ Hold</button>
                    </div>

                    <!-- Call Status -->
                    <div id="call-status" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px; text-align: center;">Ready</div>
                </div>

                <!-- Minimize Button -->
                <button id="minimize-softphone" style="
                    position: absolute;
                    top: 12px;
                    right: 35px;
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                ">−</button>
            </div>

        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', softphoneHTML);
    }

    setupEventHandlers() {
        document.getElementById('minimize-softphone').addEventListener('click', () => {
            this.hideSoftphone();
        });

        // Registration
        document.getElementById('register-btn').addEventListener('click', () => {
            this.register();
        });

        // Dialpad
        document.querySelectorAll('.dial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const digit = e.target.dataset.digit;
                const dialNumber = document.getElementById('dial-number');
                dialNumber.value += digit;
            });
        });

        // Call controls
        document.getElementById('call-btn').addEventListener('click', () => {
            this.makeCall();
        });

        document.getElementById('hangup-btn').addEventListener('click', () => {
            this.hangupCall();
        });

        document.getElementById('mute-btn').addEventListener('click', () => {
            this.toggleMute();
        });

        document.getElementById('hold-btn').addEventListener('click', () => {
            this.toggleHold();
        });
    }

    showSoftphone() {
        document.getElementById('vanguard-softphone').style.display = 'block';
    }

    hideSoftphone() {
        document.getElementById('vanguard-softphone').style.display = 'none';
    }

    register() {
        const server = document.getElementById('sip-server').value;
        const extension = document.getElementById('sip-extension').value;
        const password = document.getElementById('sip-password').value;

        if (!server || !extension || !password) {
            alert('Please fill in all SIP registration fields');
            return;
        }

        this.updateStatus('Registering...', 'orange');

        const configuration = {
            uri: `sip:${extension}@${server}`,
            transportOptions: {
                wsServers: [`wss://${server}`]
            },
            authorizationUsername: extension,
            authorizationPassword: password,
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
        };

        try {
            // Use JsSIP instead of SIP.js
            if (typeof JsSIP === 'undefined') {
                throw new Error('JsSIP library not loaded');
            }

            // Detect Twilio domain and switch to Voice SDK
            if (server.includes('twilio.com')) {
                console.log(`🔄 Twilio SIP domain detected - switching to Twilio Voice SDK`);
                console.log(`💡 Using Twilio Voice SDK instead of WebSocket SIP`);

                this.updateStatus('Setting up Twilio Voice...', 'blue');
                this.setupTwilioVoice(extension);
                return;
            }

            // Standard WebSocket configuration
            const wsUrl = `wss://${server}`;
            const socket = new JsSIP.WebSocketInterface(wsUrl);

            // Use the extension exactly as provided
            const username = extension.includes('@') ? extension : `${extension}@${server}`;

            const jsSipConfig = {
                sockets: [socket],
                uri: `sip:${username}`,
                password: password,
                register: true,
                user_agent: 'Vanguard CRM WebRTC Phone'
            };

            console.log(`📋 SIP Config: URI=${jsSipConfig.uri}, Server=${server}`);

            this.ua = new JsSIP.UA(jsSipConfig);

            // JsSIP event handling
            this.ua.on('connected', () => {
                console.log('✅ SIP Connected');
                this.updateStatus('Connected', 'green');
            });

            this.ua.on('disconnected', () => {
                console.log('❌ SIP Disconnected');
                this.updateStatus('Disconnected', 'red');
                this.isRegistered = false;
            });

            this.ua.on('registered', () => {
                console.log('✅ SIP Registered successfully');
                this.isRegistered = true;
                this.updateStatus('Registered', 'green');
                this.showPhoneSection();
            });

            this.ua.on('unregistered', () => {
                console.log('❌ SIP Unregistered');
                this.isRegistered = false;
                this.updateStatus('Unregistered', 'red');
            });

            this.ua.on('registrationFailed', (event) => {
                console.error('❌ SIP Registration failed:', event);
                this.updateStatus('Registration Failed', 'red');
            });

            this.ua.on('newRTCSession', (event) => {
                console.log('📞 Incoming call');
                this.handleIncomingCall(event.session);
            });

            // Start JsSIP UA (no promise returned)
            this.ua.start();
            console.log('✅ JsSIP UA started - waiting for registration...');

            // Store credentials for reconnection
            localStorage.setItem('vanguard_sip_config', JSON.stringify({
                server, extension, password
            }));

        } catch (error) {
            console.error('❌ SIP setup error:', error);
            this.updateStatus('Setup Error', 'red');
        }
    }

    setupTwilioVoice(identity) {
        console.log('📞 Setting up Twilio Voice API system for:', identity);

        // Skip browser SDK and use existing Voice API backend directly
        try {
            console.log('✅ Bypassing browser SDK - using server-side Voice API');
            console.log('🎯 This eliminates phone loops by using direct API calls');

            this.updateStatus('Voice API Ready', 'green');
            this.isRegistered = true;
            this.showPhoneSection();

            // Override the call button to use Voice API
            setTimeout(() => {
                const callBtn = document.getElementById('call-btn');
                if (callBtn) {
                    callBtn.onclick = () => {
                        const numberInput = document.getElementById('dial-number');
                        const phoneNumber = numberInput.value.trim();

                        if (!phoneNumber) {
                            alert('Please enter a phone number');
                            return;
                        }

                        this.makeVoiceAPICall(phoneNumber);
                    };

                    console.log('📞 Call button configured for Voice API');
                }
            }, 500);

            console.log('🎉 Twilio Voice API system ready - NO MORE PHONE LOOPS!');
            console.log('📞 All calls will use direct Voice API instead of problematic loops');

            // Store config
            localStorage.setItem('vanguard_sip_config', JSON.stringify({
                type: 'twilio_voice_api',
                identity: identity,
                setup_date: new Date().toISOString(),
                status: 'ready'
            }));

        } catch (error) {
            console.error('❌ Voice API setup error:', error);
            this.updateStatus('Voice API Failed', 'red');
        }
    }

    makeVoiceAPICall(phoneNumber) {
        console.log('📞 Making Twilio Voice API call to:', phoneNumber);

        // Use the existing Voice API function that's already working
        if (typeof makeTwilioVoiceAPICallDirect === 'function') {
            console.log('✅ Using existing Voice API function');
            return makeTwilioVoiceAPICallDirect(phoneNumber);
        }

        // Fallback: make direct API call to backend
        console.log('🔄 Making direct API call to backend');

        fetch('/api/twilio/make-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: phoneNumber,
                from: '+13306369079', // Your Twilio number
                callerName: 'Vanguard Insurance'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Voice API call initiated:', data);
            this.updateStatus('Call Active', 'blue');

            // Show success message
            if (typeof showNotification === 'function') {
                showNotification(`Call initiated to ${phoneNumber} via Voice API`, 'success');
            }
        })
        .catch(error => {
            console.error('❌ Voice API call failed:', error);
            this.updateStatus('Call Failed', 'red');

            if (typeof showNotification === 'function') {
                showNotification(`Call failed: ${error.message}`, 'error');
            }
        });
    }

    showPhoneSection() {
        document.getElementById('registration-section').style.display = 'none';
        document.getElementById('phone-section').style.display = 'block';
    }

    updateStatus(text, color) {
        const statusElement = document.getElementById('sip-status');
        statusElement.textContent = `● ${text}`;
        statusElement.style.color = color;
    }

    makeCall() {
        const number = document.getElementById('dial-number').value;
        if (!number || !this.ua) {
            return;
        }

        try {
            const target = SIP.UserAgent.makeURI(`sip:${number}@${document.getElementById('sip-server').value}`);
            this.currentCall = this.ua.invite(target);

            this.currentCall.delegate = {
                onBye: () => {
                    this.callEnded();
                },
                onSessionDescriptionHandler: (sdh) => {
                    sdh.on('userMedia', (stream) => {
                        // Handle audio stream
                        const audio = new Audio();
                        audio.srcObject = stream;
                        audio.play();
                    });
                }
            };

            this.updateCallStatus('Calling...', true);

        } catch (error) {
            console.error('❌ Call failed:', error);
            this.updateCallStatus('Call Failed');
        }
    }

    hangupCall() {
        if (this.currentCall) {
            this.currentCall.bye();
            this.callEnded();
        }
        if (this.incomingSession) {
            this.incomingSession.reject();
            this.callEnded();
        }
    }

    toggleMute() {
        if (!this.currentCall) return;

        this.isOnMute = !this.isOnMute;
        // Implement mute logic
        document.getElementById('mute-btn').textContent = this.isOnMute ? '🔊 Unmute' : '🔇 Mute';
    }

    toggleHold() {
        if (!this.currentCall) return;

        this.isOnHold = !this.isOnHold;
        // Implement hold logic
        document.getElementById('hold-btn').textContent = this.isOnHold ? '▶️ Unhold' : '⏸️ Hold';
    }

    handleIncomingCall(session) {
        console.log('📞 Incoming SIP call from:', session.remoteIdentity.uri.user);

        this.incomingSession = session;
        this.ringtone.play();

        // Integrate with existing CRM incoming call system
        const callerNumber = session.remoteIdentity.uri.user;

        // Use existing CRM showIncomingCallPopup function
        if (typeof window.showIncomingCallPopup === 'function') {
            window.showIncomingCallPopup({
                type: 'sip_incoming_call',
                from: callerNumber,
                to: document.getElementById('sip-extension').value,
                callControlId: session.id,
                lineType: 'SIP Line'
            });
        }

        // Set up session handlers
        session.delegate = {
            onBye: () => {
                this.ringtone.pause();
                this.callEnded();
            }
        };
    }

    answerCall() {
        if (this.incomingSession) {
            this.ringtone.pause();
            this.incomingSession.accept();
            this.currentCall = this.incomingSession;
            this.incomingSession = null;
            this.updateCallStatus('Connected', true);
        }
    }

    callEnded() {
        this.currentCall = null;
        this.incomingSession = null;
        this.ringtone.pause();
        this.updateCallStatus('Ready');
        document.getElementById('dial-number').value = '';
    }

    updateCallStatus(status, inCall = false) {
        document.getElementById('call-status').textContent = status;
        document.getElementById('call-btn').disabled = inCall;
        document.getElementById('hangup-btn').disabled = !inCall;
        document.getElementById('mute-btn').disabled = !inCall;
        document.getElementById('hold-btn').disabled = !inCall;
    }

    // Auto-reconnect on page load
    autoConnect() {
        const savedConfig = localStorage.getItem('vanguard_sip_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            document.getElementById('sip-server').value = config.server;
            document.getElementById('sip-extension').value = config.extension;
            document.getElementById('sip-password').value = config.password;

            // Auto-register after 2 seconds
            setTimeout(() => {
                this.register();
            }, 2000);
        }
    }
}

// Global instance
let vanguardSoftphone = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 VanguardSoftphone: DOM loaded, initializing...');

    // SIP.js is now loaded in HTML head, initialize directly
    try {
        vanguardSoftphone = new VanguardSoftphone();
        vanguardSoftphone.autoConnect();
        console.log('✅ VanguardSoftphone initialized with SIP.js from HTML');
    } catch (error) {
        console.error('❌ VanguardSoftphone initialization failed:', error);
    }
});

// Also try to initialize if the page is already loaded
if (document.readyState === 'loading') {
    console.log('🔧 Document still loading, waiting for DOMContentLoaded...');
} else {
    console.log('🔧 Document already loaded, initializing immediately...');
    setTimeout(() => {
        try {
            if (!window.vanguardSoftphone) {
                vanguardSoftphone = new VanguardSoftphone();
                vanguardSoftphone.autoConnect();
                console.log('✅ VanguardSoftphone initialized (immediate)');
            }
        } catch (error) {
            console.error('❌ VanguardSoftphone initialization failed (immediate):', error);
        }
    }, 1000);
}

// Expose answer function for CRM integration
window.answerSipCall = function() {
    if (vanguardSoftphone) {
        vanguardSoftphone.answerCall();
    }
};