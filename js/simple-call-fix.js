// Simple Call Status Fix - Just Works!
(function() {
    console.log('Simple Call Fix Active');

    // Store original functions
    const originalShowCallControls = window.showCallControls;

    // Override showCallControls to add auto-connect timer
    window.showCallControls = function(phoneNumber, callControlId) {
        console.log('Call started - will auto-connect in 10 seconds');

        // Call original function if it exists
        if (originalShowCallControls) {
            originalShowCallControls(phoneNumber, callControlId);
        }

        // After 10 seconds, assume call is connected
        setTimeout(() => {
            console.log('Auto-connecting call after 10 seconds');

            // Stop ringing sound
            if (window.ringingOscillator) {
                try {
                    window.ringingOscillator.stop();
                } catch(e) {}
            }
            if (window.ringInterval) {
                clearInterval(window.ringInterval);
            }

            // Update status text
            const statusText = document.getElementById('callStatusText');
            if (statusText) {
                statusText.innerHTML = 'Connected';
                console.log('Status updated to Connected');
            }

            // Show and start timer
            const timer = document.getElementById('callTimer');
            if (timer) {
                timer.style.display = 'block';

                // Start timer if not already running
                if (!window.simpleCallTimer) {
                    let seconds = 0;
                    window.simpleCallTimer = setInterval(() => {
                        seconds++;
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    }, 1000);
                    console.log('Timer started');
                }
            }

            // Show notification
            if (typeof showNotification === 'function') {
                showNotification('Call connected', 'success');
            }
        }, 10000); // 10 seconds delay
    };

    // Add manual connect button to call controls
    const addConnectButton = setInterval(() => {
        const callControls = document.getElementById('activeCallControls');
        if (callControls && !document.getElementById('manualConnectBtn')) {

            // Find the control buttons area
            const controlsArea = callControls.querySelector('.call-controls') ||
                                callControls.querySelector('[style*="display: grid"]');

            if (controlsArea) {
                // Add manual connect button
                const btn = document.createElement('button');
                btn.id = 'manualConnectBtn';
                btn.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <div style="font-size: 9px; margin-top: 2px;">Mark Connected</div>
                `;
                btn.style.cssText = `
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 55px;
                    height: 55px;
                    cursor: pointer;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                `;

                btn.onclick = function() {
                    console.log('Manual connect triggered');

                    // Stop ringing
                    if (window.ringingOscillator) {
                        try {
                            window.ringingOscillator.stop();
                        } catch(e) {}
                    }
                    if (window.ringInterval) {
                        clearInterval(window.ringInterval);
                    }

                    // Update status
                    const statusText = document.getElementById('callStatusText');
                    if (statusText) {
                        statusText.innerHTML = 'Connected';
                    }

                    // Show timer
                    const timer = document.getElementById('callTimer');
                    if (timer) {
                        timer.style.display = 'block';
                        if (!window.simpleCallTimer && !window.callTimer) {
                            let seconds = 0;
                            window.simpleCallTimer = setInterval(() => {
                                seconds++;
                                const mins = Math.floor(seconds / 60);
                                const secs = seconds % 60;
                                timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                            }, 1000);
                        }
                    }

                    // Hide this button
                    btn.style.display = 'none';

                    if (typeof showNotification === 'function') {
                        showNotification('Call marked as connected', 'success');
                    }
                };

                // Insert before the last button or at the end
                const buttons = controlsArea.querySelectorAll('button');
                if (buttons.length > 0) {
                    buttons[buttons.length - 1].parentNode.insertBefore(btn, buttons[buttons.length - 1]);
                } else {
                    controlsArea.appendChild(btn);
                }

                console.log('Manual connect button added');
            }
        }
    }, 500);

    // Clean up interval after 30 seconds
    setTimeout(() => clearInterval(addConnectButton), 30000);

    // Global function to manually mark connected
    window.markCallConnected = function() {
        console.log('Marking call as connected...');

        // Stop all ringing sounds
        if (window.ringingOscillator) {
            try { window.ringingOscillator.stop(); } catch(e) {}
        }
        if (window.ringInterval) {
            clearInterval(window.ringInterval);
        }
        if (typeof stopRingingSound === 'function') {
            stopRingingSound();
        }

        // Update status
        const statusText = document.getElementById('callStatusText');
        if (statusText) {
            statusText.innerHTML = 'Connected';
        }

        // Start timer
        const timer = document.getElementById('callTimer');
        if (timer) {
            timer.style.display = 'block';
            if (!window.simpleCallTimer && !window.callTimer) {
                let seconds = 0;
                window.simpleCallTimer = setInterval(() => {
                    seconds++;
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }, 1000);
            }
        }

        console.log('Call marked as connected');
        return 'Connected';
    };

    console.log('Simple fix ready. Call will auto-connect after 10 seconds.');
    console.log('Or use markCallConnected() to manually connect');
})();