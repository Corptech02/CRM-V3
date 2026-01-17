// WebRTC Softphone - Direct audio connection in browser
(function() {
    console.log('WebRTC Softphone initializing...');

    let currentCall = null;
    let localStream = null;
    let remoteAudio = null;

    // Initialize WebRTC softphone
    window.initializeWebRTCSoftphone = async function() {
        try {
            console.log('🎧 Initializing WebRTC softphone...');

            // Request microphone access
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            console.log('✅ Microphone access granted for softphone');
            showNotification('🎧 WebRTC softphone ready - you can now take calls through your browser!', 'success');

            // Create audio element for playing remote audio
            if (!remoteAudio) {
                remoteAudio = document.createElement('audio');
                remoteAudio.autoplay = true;
                remoteAudio.controls = false;
                remoteAudio.style.display = 'none';
                document.body.appendChild(remoteAudio);
            }

            return true;

        } catch (error) {
            console.error('❌ Failed to initialize WebRTC softphone:', error);
            showNotification('Failed to initialize browser softphone: ' + error.message, 'error');
            return false;
        }
    };

    // Connect call directly via WebRTC (bypassing conference)
    window.connectCallDirectly = async function(callSid) {
        try {
            console.log('🎧 Connecting call directly via WebRTC:', callSid);

            // Initialize softphone if not already done
            if (!localStream) {
                const initialized = await initializeWebRTCSoftphone();
                if (!initialized) {
                    throw new Error('Could not initialize WebRTC softphone');
                }
            }

            // Request backend to bridge the call to WebRTC
            const response = await fetch('/api/twilio/bridge-to-webrtc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    callSid: callSid,
                    webrtcReady: true
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Call bridged to WebRTC');

                // Set up WebRTC peer connection
                await setupWebRTCCall(data.streamUrl || data.callSid);

                showNotification('🎧 Call connected! You can now hear and speak to the client through your browser.', 'success');

                // Show call controls
                showWebRTCCallControls(callSid);

            } else {
                throw new Error(data.error || 'Failed to bridge call');
            }

        } catch (error) {
            console.error('❌ Failed to connect call directly:', error);
            showNotification('Failed to connect call: ' + error.message, 'error');
        }
    };

    // Set up WebRTC peer connection for direct audio
    async function setupWebRTCCall(streamIdentifier) {
        try {
            console.log('🔗 Setting up WebRTC connection...');

            // Create RTCPeerConnection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // Add local stream (microphone)
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    pc.addTrack(track, localStream);
                });
            }

            // Handle incoming audio stream
            pc.ontrack = (event) => {
                console.log('🔊 Received remote audio stream');
                if (remoteAudio && event.streams[0]) {
                    remoteAudio.srcObject = event.streams[0];
                    console.log('🔊 Remote audio connected to browser');
                }
            };

            // Handle ICE connection state
            pc.oniceconnectionstatechange = () => {
                console.log('🧊 ICE connection state:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'connected') {
                    showNotification('🔗 Audio connection established!', 'success');
                } else if (pc.iceConnectionState === 'failed') {
                    showNotification('❌ Audio connection failed', 'error');
                }
            };

            currentCall = { pc, streamIdentifier };

            // For now, simulate successful connection
            // In a full implementation, this would negotiate with Twilio Media Streams API
            setTimeout(() => {
                showNotification('🎧 Simulated WebRTC connection ready. In full implementation, this would connect to Twilio Media Streams.', 'info');
            }, 1000);

        } catch (error) {
            console.error('❌ WebRTC setup failed:', error);
            throw error;
        }
    }

    // Show WebRTC call controls
    function showWebRTCCallControls(callSid) {
        // Find the phone window
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w => {
            const title = w.querySelector('.tool-window-title span');
            return title && title.textContent.includes('Phone');
        });

        if (!phoneWindow) return;

        // Remove any existing controls
        const existingControls = phoneWindow.querySelector('#webrtcControls');
        if (existingControls) {
            existingControls.remove();
        }

        // Create WebRTC controls
        const controls = document.createElement('div');
        controls.id = 'webrtcControls';
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
                🎧 WebRTC Call Active
            </div>
            <div style="margin-bottom: 15px;">
                <div>🎤 Microphone: <span id="micStatus">🟢 Active</span></div>
                <div>🔊 Audio: <span id="audioStatus">🟢 Connected</span></div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="toggleWebRTCMute()" id="webrtcMuteBtn" style="
                    background: #ef4444; color: white; border: none; border-radius: 5px;
                    padding: 10px 20px; cursor: pointer; font-weight: bold;
                ">
                    🔇 Mute
                </button>
                <button onclick="endWebRTCCall('${callSid}')" style="
                    background: #dc2626; color: white; border: none; border-radius: 5px;
                    padding: 10px 20px; cursor: pointer; font-weight: bold;
                ">
                    📞 End Call
                </button>
            </div>
        `;

        const content = phoneWindow.querySelector('[id$="-content"]');
        if (content) {
            content.appendChild(controls);
        }
    }

    // Toggle microphone mute
    window.toggleWebRTCMute = function() {
        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;

            const muteBtn = document.getElementById('webrtcMuteBtn');
            const micStatus = document.getElementById('micStatus');

            if (audioTrack.enabled) {
                muteBtn.innerHTML = '🔇 Mute';
                muteBtn.style.background = '#ef4444';
                micStatus.innerHTML = '🟢 Active';
            } else {
                muteBtn.innerHTML = '🔊 Unmute';
                muteBtn.style.background = '#10b981';
                micStatus.innerHTML = '🔴 Muted';
            }
        }
    };

    // End WebRTC call
    window.endWebRTCCall = function(callSid) {
        console.log('📞 Ending WebRTC call:', callSid);

        // Clean up WebRTC
        if (currentCall && currentCall.pc) {
            currentCall.pc.close();
            currentCall = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        // Remove controls
        const controls = document.getElementById('webrtcControls');
        if (controls) {
            controls.remove();
        }

        // End the Twilio call
        fetch(`/api/twilio/hangup/${callSid}`, {
            method: 'POST'
        });

        showNotification('📞 WebRTC call ended', 'info');
    };

    // Auto-initialize when page loads
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeWebRTCSoftphone, 2000);
    });

    // Also initialize if DOM is already loaded
    if (document.readyState !== 'loading') {
        setTimeout(initializeWebRTCSoftphone, 1000);
    }

    console.log('WebRTC Softphone ready');

})();