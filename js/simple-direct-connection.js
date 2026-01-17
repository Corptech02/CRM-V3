// Simple Direct Connection - Works on HTTP without WebRTC
(function() {
    console.log('Simple Direct Connection handler loading...');

    // Connect call directly without WebRTC complications
    window.connectCallDirectly = function(callSid) {
        console.log('📞 Connecting call directly (simple mode):', callSid);

        // Show connecting message
        showNotification('🔗 Connecting call directly - this will bridge the call to your current setup', 'info');

        // Make the backend call to bridge directly
        fetch('/api/twilio/bridge-direct', {
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
            console.log('✅ Direct bridge response:', data);

            if (data.success) {
                showNotification('✅ Call connected directly! You should now be able to hear the client.', 'success');

                // Show simple call controls
                showSimpleCallControls(callSid);
            } else {
                throw new Error(data.error || 'Failed to bridge call');
            }
        })
        .catch(error => {
            console.error('❌ Direct bridge failed:', error);
            showNotification('Failed to connect call: ' + error.message, 'error');
        });
    };

    // Show simple call controls without WebRTC
    function showSimpleCallControls(callSid) {
        // Find phone window
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w => {
            const title = w.querySelector('.tool-window-title span');
            return title && title.textContent.includes('Phone');
        });

        if (!phoneWindow) return;

        // Remove existing controls
        const existingControls = phoneWindow.querySelector('#simpleCallControls');
        if (existingControls) {
            existingControls.remove();
        }

        // Create simple controls
        const controls = document.createElement('div');
        controls.id = 'simpleCallControls';
        controls.style.cssText = `
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            padding: 20px;
            margin: 10px;
            border-radius: 10px;
            text-align: center;
            border: 3px solid #34d399;
        `;

        controls.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                📞 Call Connected Directly
            </div>
            <div style="margin-bottom: 15px;">
                <div>🔗 Status: <span style="color: #34d399;">Connected</span></div>
                <div>📱 Call ID: ${callSid}</div>
                <div style="font-size: 14px; margin-top: 10px;">
                    Audio should now be working through your existing phone/audio setup
                </div>
            </div>
            <div>
                <button onclick="endDirectCall('${callSid}')" style="
                    background: #dc2626; color: white; border: none; border-radius: 8px;
                    padding: 15px 25px; cursor: pointer; font-weight: bold; font-size: 16px;
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

    // End direct call
    window.endDirectCall = function(callSid) {
        console.log('📞 Ending direct call:', callSid);

        // Remove controls
        const controls = document.getElementById('simpleCallControls');
        if (controls) {
            controls.remove();
        }

        // End the call via API
        fetch(`/api/twilio/hangup/${callSid}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Call ended:', data);
            showNotification('📞 Call ended successfully', 'info');
        })
        .catch(error => {
            console.error('❌ Error ending call:', error);
            showNotification('Error ending call: ' + error.message, 'error');
        });
    };

    console.log('Simple Direct Connection ready');
})();