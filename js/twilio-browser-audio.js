// Twilio Browser Audio Handler
(function() {
    console.log('Twilio Browser Audio Handler initializing...');

    let twilioDevice = null;
    let currentCall = null;

    // Initialize Twilio Device
    window.initializeTwilioDevice = async function() {
        try {
            console.log('🎧 Initializing Twilio Voice SDK for browser audio...');

            // Get access token from backend
            const response = await fetch('/api/twilio/token');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get token');
            }

            console.log('✅ Token received:', data.token ? 'Token present' : 'No token');

            // Check if Twilio Voice SDK is available
            if (typeof Twilio === 'undefined' || !Twilio.Device) {
                throw new Error('Twilio Voice SDK not loaded');
            }

            // Initialize Twilio Device with Voice SDK
            twilioDevice = new Twilio.Device(data.token, {
                logLevel: 'debug',
                codecPreferences: ['opus', 'pcmu'],
                fakeLocalDTMF: true,
                enableRingingState: true
            });

            console.log('📞 Twilio Device created, registering event handlers...');

            // Set up device event handlers
            twilioDevice.on('registered', function() {
                console.log('✅ Twilio Device registered for browser audio');
                showNotification('🎧 Browser audio ready - microphone permission will be requested when joining calls', 'success');
            });

            twilioDevice.on('error', function(error) {
                console.error('❌ Twilio Device error:', error);
                showNotification('Browser audio error: ' + (error.message || 'Unknown error'), 'error');
            });

            twilioDevice.on('incoming', function(call) {
                console.log('📞 Incoming browser call');
                currentCall = call;

                // Set up call event handlers
                call.on('accept', function() {
                    console.log('🎧 Browser call accepted');
                    showNotification('Audio connected through browser', 'success');
                });

                call.on('disconnect', function() {
                    console.log('🎧 Browser call disconnected');
                    currentCall = null;
                });

                // Auto-accept incoming calls
                call.accept();
            });

            console.log('📞 Registering Twilio Device...');

        } catch (error) {
            console.error('❌ Failed to initialize Twilio Device:', error);
            showNotification('Failed to initialize browser audio: ' + error.message, 'error');
        }
    };

    // Join conference using browser audio
    window.joinConferenceBrowserAudio = async function(conferenceName) {
        try {
            console.log('🎧 Joining conference via browser audio:', conferenceName);

            if (!twilioDevice) {
                console.log('📞 Device not initialized, initializing now...');
                await initializeTwilioDevice();
                // Wait for device to be ready
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            if (!twilioDevice) {
                throw new Error('Failed to initialize Twilio Device');
            }

            console.log('📞 Device state:', twilioDevice.state);

            // Request microphone permission explicitly
            console.log('🎤 Requesting microphone permission...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Microphone permission granted');
                showNotification('🎤 Microphone permission granted - making conference call...', 'success');
                stream.getTracks().forEach(track => track.stop()); // Stop the test stream
            } catch (permError) {
                console.error('❌ Microphone permission denied:', permError);
                showNotification('❌ Microphone permission required for browser audio', 'error');
                return;
            }

            // Make outbound call to join conference
            console.log('📞 Making call to join conference...');
            const call = await twilioDevice.connect({
                params: {
                    conference: conferenceName
                }
            });

            currentCall = call;

            // Set up call event handlers
            call.on('accept', function() {
                console.log('✅ Connected to conference via browser audio');
                showNotification('🎧 You are now connected to the call via browser audio', 'success');
            });

            call.on('disconnect', function() {
                console.log('🎧 Conference call disconnected');
                currentCall = null;
                showNotification('Conference call ended', 'info');
            });

            call.on('error', function(error) {
                console.error('❌ Call error:', error);
                showNotification('Call error: ' + error.message, 'error');
            });

            console.log('📞 Conference call initiated');

        } catch (error) {
            console.error('❌ Failed to join conference via browser:', error);
            showNotification('Failed to join conference: ' + error.message, 'error');
        }
    };

    // Hang up browser call
    window.hangupBrowserCall = function() {
        if (currentCall) {
            currentCall.disconnect();
            currentCall = null;
            console.log('✅ Browser call hung up');
        }
    };

    // Initialize device when page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize with a small delay to ensure everything is loaded
        setTimeout(initializeTwilioDevice, 2000);
    });

    // Also try to initialize immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTwilioDevice);
    } else {
        setTimeout(initializeTwilioDevice, 1000);
    }

    console.log('Twilio Browser Audio Handler loaded');
})();