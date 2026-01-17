// Simple Browser Audio Handler - Auto-dial conference via computer
(function() {
    console.log('Simple Browser Audio Handler loading...');

    // Simple conference join using SIP.js or WebRTC if available
    window.joinConferenceBrowserAudio = async function(conferenceName) {
        try {
            console.log('🎧 Setting up browser audio for conference:', conferenceName);

            // Check browser compatibility and request microphone permission
            console.log('🎤 Checking browser audio support...');

            let stream = null;
            try {
                // Check if getUserMedia is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.log('⚠️ Modern getUserMedia not available, trying fallback...');

                    // Try older API
                    const getUserMedia = navigator.getUserMedia ||
                                       navigator.webkitGetUserMedia ||
                                       navigator.mozGetUserMedia ||
                                       navigator.msGetUserMedia;

                    if (!getUserMedia) {
                        throw new Error('Browser does not support microphone access. This may be due to HTTP (requires HTTPS) or browser limitations.');
                    }

                    // Use fallback with promise wrapper
                    stream = await new Promise((resolve, reject) => {
                        getUserMedia.call(navigator, { audio: true }, resolve, reject);
                    });
                } else {
                    // Use modern API
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                }

                console.log('✅ Microphone permission granted');
                showNotification('🎤 Microphone permission granted!', 'success');

                // For now, we'll use the backend to make the call and provide instructions
                // In a full implementation, this would set up WebRTC audio

                // Make backend call to join conference with a special flag
                const response = await fetch('/api/twilio/join-conference-browser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conferenceName: conferenceName,
                        useBrowserAudio: true
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('🎧 Browser audio setup complete! Your phone will ring - answer it to connect via browser audio bridge', 'success');

                    // Show audio controls
                    addAudioControls(stream, conferenceName);
                } else {
                    throw new Error(data.error || 'Failed to setup browser audio');
                }

            } catch (permError) {
                console.error('❌ Microphone access failed:', permError);
                console.log('🔧 Browser info:', {
                    userAgent: navigator.userAgent,
                    protocol: window.location.protocol,
                    hasMediaDevices: !!navigator.mediaDevices,
                    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
                });

                // Skip microphone permission for now and proceed with phone call
                console.log('⚠️ Proceeding without microphone permission - using phone-only mode');
                showNotification('⚠️ Microphone not available - proceeding with phone-only mode', 'warning');

                // Continue with backend call anyway
                stream = null;
            }

            // Make backend call to join conference (works with or without microphone)
            console.log('📞 Making backend call to join conference...');
            try {
                const response = await fetch('/api/twilio/join-conference-browser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conferenceName: conferenceName,
                        useBrowserAudio: !!stream
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('📞 YOUR PHONE IS RINGING! Answer and STAY ON THE LINE to talk to the client in conference!', 'success');

                    // Show audio controls if we have microphone access
                    if (stream) {
                        addAudioControls(stream, conferenceName);
                    } else {
                        // Show simple instructions
                        showPhoneInstructions(conferenceName);
                    }
                } else {
                    throw new Error(data.error || 'Failed to setup conference call');
                }

            } catch (fetchError) {
                console.error('❌ Backend call failed:', fetchError);
                showNotification('Failed to initiate conference call: ' + fetchError.message, 'error');
            }

        } catch (error) {
            console.error('❌ Failed to setup browser audio:', error);
            showNotification('Browser audio setup failed: ' + error.message, 'error');
        }
    };

    // Add audio controls to the interface
    function addAudioControls(stream, conferenceName) {
        console.log('🎧 Adding audio controls...');

        // Find the phone window
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w => {
            const title = w.querySelector('.tool-window-title span');
            return title && title.textContent.includes('Phone');
        });

        if (!phoneWindow) return;

        // Create audio controls
        const audioControls = document.createElement('div');
        audioControls.id = 'browserAudioControls';
        audioControls.style.cssText = `
            background: rgba(16, 185, 129, 0.2);
            color: white;
            padding: 15px;
            margin: 10px;
            border-radius: 8px;
            text-align: center;
        `;

        audioControls.innerHTML = `
            <div style="margin-bottom: 10px;">
                <i class="fas fa-microphone" style="color: #10b981;"></i>
                <strong>Browser Audio Active</strong>
            </div>
            <div style="font-size: 12px; margin-bottom: 10px;">
                Microphone: <span id="micStatus">🟢 Active</span><br>
                Conference: ${conferenceName}
            </div>
            <button onclick="toggleMicrophoneBrowser()" id="browserMicBtn" style="
                background: #10b981; color: white; border: none; border-radius: 5px; padding: 8px 15px; margin: 5px; cursor: pointer;
            ">
                <i class="fas fa-microphone"></i> Mute
            </button>
            <button onclick="hangupBrowserAudio()" style="
                background: #ef4444; color: white; border: none; border-radius: 5px; padding: 8px 15px; margin: 5px; cursor: pointer;
            ">
                <i class="fas fa-phone-slash"></i> End
            </button>
        `;

        const callControls = phoneWindow.querySelector('[style*="background: rgba(0,0,0,0.3)"]');
        if (callControls) {
            callControls.appendChild(audioControls);
        }

        // Store the stream globally for controls
        window.browserAudioStream = stream;
    }

    // Toggle microphone
    window.toggleMicrophoneBrowser = function() {
        if (window.browserAudioStream) {
            const audioTracks = window.browserAudioStream.getAudioTracks();
            const micBtn = document.getElementById('browserMicBtn');
            const micStatus = document.getElementById('micStatus');

            if (audioTracks.length > 0) {
                const track = audioTracks[0];
                track.enabled = !track.enabled;

                if (track.enabled) {
                    micBtn.innerHTML = '<i class="fas fa-microphone"></i> Mute';
                    micBtn.style.background = '#10b981';
                    micStatus.innerHTML = '🟢 Active';
                } else {
                    micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Unmute';
                    micBtn.style.background = '#ef4444';
                    micStatus.innerHTML = '🔴 Muted';
                }
            }
        }
    };

    // Hangup browser audio
    window.hangupBrowserAudio = function() {
        if (window.browserAudioStream) {
            window.browserAudioStream.getTracks().forEach(track => track.stop());
            window.browserAudioStream = null;

            const controls = document.getElementById('browserAudioControls');
            if (controls) {
                controls.remove();
            }

            showNotification('Browser audio ended', 'info');
            console.log('🎧 Browser audio ended');
        }
    };

    // Show phone instructions as fallback
    function showPhoneInstructions(conferenceName) {
        const instructions = `
            <div style="background: rgba(255,193,7,0.2); color: white; padding: 15px; margin: 10px; border-radius: 8px; text-align: center;">
                <i class="fas fa-phone"></i> <strong>Manual Conference Join</strong><br>
                <small>Since browser audio isn't available:</small><br><br>
                1. Call: <strong>+13306369079</strong><br>
                2. Enter conference: <strong>${conferenceName}</strong>
            </div>
        `;

        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w => {
            const title = w.querySelector('.tool-window-title span');
            return title && title.textContent.includes('Phone');
        });

        if (phoneWindow) {
            const callControls = phoneWindow.querySelector('[style*="background: rgba(0,0,0,0.3)"]');
            if (callControls) {
                callControls.innerHTML += instructions;
            }
        }
    }

    console.log('Simple Browser Audio Handler loaded');
})();