// Fix Call Disconnect Detection - Ensure proper call termination when hung up remotely
console.log('🔧 Call Disconnect Detection Fix loaded');

(function() {
    // Store original functions
    const originalShowCallControls = window.showCallControls;
    const originalHangupCall = window.hangupCall;

    // Enhanced call monitoring
    let callMonitorInterval = null;
    let currentCallControlId = null;
    let callStartTime = null;
    let consecutiveFailures = 0;
    let lastKnownStatus = null;

    // Override showCallControls to add enhanced monitoring
    window.showCallControls = function(phoneNumber, callControlId, clientInfo) {
        console.log('🔧 Enhanced showCallControls called for:', phoneNumber, callControlId);

        // Call original function first
        if (originalShowCallControls) {
            originalShowCallControls(phoneNumber, callControlId, clientInfo);
        }

        // Wait a bit for the original function to complete, then start monitoring
        setTimeout(() => {
            startEnhancedCallMonitoring(callControlId);
        }, 1000);
    };

    // Enhanced call monitoring function
    function startEnhancedCallMonitoring(callControlId) {
        console.log('🔧 Starting enhanced call monitoring for:', callControlId);

        currentCallControlId = callControlId;
        callStartTime = Date.now();
        consecutiveFailures = 0;
        lastKnownStatus = 'connecting';

        // Clear any existing monitoring
        if (callMonitorInterval) {
            clearInterval(callMonitorInterval);
        }

        // Monitor every 2 seconds
        callMonitorInterval = setInterval(() => {
            checkCallStatus(callControlId);
        }, 2000);

        // Also add backup monitoring every 5 seconds
        const backupMonitor = setInterval(() => {
            if (currentCallControlId === callControlId) {
                console.log('🔧 Backup call status check');
                checkCallStatusBackup(callControlId);
            } else {
                clearInterval(backupMonitor);
            }
        }, 5000);
    }

    // Main call status check
    async function checkCallStatus(callControlId) {
        // Don't check if call controls are gone (already ended)
        if (!document.getElementById('activeCallControls')) {
            console.log('🔧 Call controls gone, stopping monitoring');
            stopCallMonitoring();
            return;
        }

        try {
            console.log('🔧 Checking call status for:', callControlId);

            const response = await fetch(`/api/telnyx/call/${callControlId}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.log('🔧 Status check failed:', response.status);
                consecutiveFailures++;

                // If we get 3 consecutive failures, assume call ended
                if (consecutiveFailures >= 3) {
                    console.log('🔧 Too many consecutive failures, assuming call ended');
                    handleCallDisconnected(callControlId, 'network_failure');
                }
                return;
            }

            const data = await response.json();
            console.log('🔧 Call status data:', data);

            // Reset failure counter on successful response
            consecutiveFailures = 0;

            // Check for various end states
            const status = data.status || data.telnyxState || '';
            const isEnded = status.toLowerCase().includes('ended') ||
                           status.toLowerCase().includes('completed') ||
                           status.toLowerCase().includes('cancelled') ||
                           status.toLowerCase().includes('failed') ||
                           status.toLowerCase().includes('busy') ||
                           status.toLowerCase().includes('no-answer') ||
                           status === 'disconnected';

            if (isEnded) {
                console.log('🔧 Call detected as ended:', status);
                handleCallDisconnected(callControlId, status);
                return;
            }

            // Track status changes
            if (lastKnownStatus !== status) {
                console.log('🔧 Call status changed:', lastKnownStatus, '->', status);
                lastKnownStatus = status;

                // Update UI if connected
                if (status === 'connected' || status === 'answered') {
                    if (typeof window.updateCallStatus === 'function') {
                        window.updateCallStatus('connected');
                    }
                }
            }

        } catch (error) {
            console.error('🔧 Error checking call status:', error);
            consecutiveFailures++;

            // If we can't reach the server for 5 attempts, assume call ended
            if (consecutiveFailures >= 5) {
                console.log('🔧 Too many errors, assuming call ended');
                handleCallDisconnected(callControlId, 'connection_error');
            }
        }
    }

    // Backup call status check using different method
    async function checkCallStatusBackup(callControlId) {
        try {
            // Alternative status check endpoint
            const response = await fetch(`/api/telnyx/calls/active`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const activeCalls = await response.json();
                console.log('🔧 Active calls check:', activeCalls);

                // Check if our call is still in the active list
                const isActive = activeCalls.some(call =>
                    call.call_control_id === callControlId ||
                    call.id === callControlId
                );

                if (!isActive) {
                    console.log('🔧 Call not found in active calls list');
                    handleCallDisconnected(callControlId, 'not_active');
                }
            }
        } catch (error) {
            console.log('🔧 Backup status check failed:', error);
        }
    }

    // Handle call disconnection
    function handleCallDisconnected(callControlId, reason) {
        console.log('🔧 Handling call disconnection:', callControlId, reason);

        // Stop monitoring
        stopCallMonitoring();

        // Only proceed if we still have call controls (avoid double cleanup)
        if (!document.getElementById('activeCallControls')) {
            console.log('🔧 Call already cleaned up');
            return;
        }

        // Show notification
        showNotification('Call ended', 'info');

        // Stop timer immediately
        if (window.callTimer) {
            clearInterval(window.callTimer);
            window.callTimer = null;
            console.log('🔧 Call timer stopped');
        }

        // Update status display
        const statusText = document.getElementById('callStatusText');
        if (statusText) {
            statusText.innerHTML = 'Call Ended';
            console.log('🔧 Status updated to Call Ended');
        }

        // Hide timer
        const timer = document.getElementById('callTimer');
        if (timer) {
            timer.style.display = 'none';
            console.log('🔧 Timer hidden');
        }

        // Stop any ringing sounds
        if (typeof window.stopRingingSound === 'function') {
            window.stopRingingSound();
        }

        // Clean up call UI after a short delay
        setTimeout(() => {
            console.log('🔧 Cleaning up call UI');

            // Remove call controls
            const callControls = document.getElementById('activeCallControls');
            if (callControls) {
                callControls.remove();
                console.log('🔧 Call controls removed');
            }

            // Restore original phone content
            const phoneTabContent = document.querySelector('[id$="-content"]');
            if (phoneTabContent && window.originalPhoneContent) {
                phoneTabContent.innerHTML = window.originalPhoneContent;
                window.originalPhoneContent = null;
                console.log('🔧 Phone content restored');
            }

        }, 2000); // 2 second delay to show "Call Ended" status
    }

    // Stop call monitoring
    function stopCallMonitoring() {
        if (callMonitorInterval) {
            clearInterval(callMonitorInterval);
            callMonitorInterval = null;
            console.log('🔧 Call monitoring stopped');
        }

        currentCallControlId = null;
        callStartTime = null;
        consecutiveFailures = 0;
        lastKnownStatus = null;
    }

    // Override hangupCall to use our monitoring cleanup
    window.hangupCall = function(callControlId) {
        console.log('🔧 Enhanced hangupCall called for:', callControlId);

        // Stop our monitoring first
        stopCallMonitoring();

        // Call original hangup function if it exists
        if (originalHangupCall) {
            originalHangupCall(callControlId);
        } else {
            // Fallback hangup implementation
            fetch('/api/telnyx/hangup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    callControlId: callControlId
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('🔧 Call hangup successful:', data);
                handleCallDisconnected(callControlId, 'manual_hangup');
            })
            .catch(error => {
                console.error('🔧 Hangup failed:', error);
                // Still clean up UI even if hangup fails
                handleCallDisconnected(callControlId, 'hangup_error');
            });
        }
    };

    // Make hangupCall global (it might not be global in original)
    window.hangupCall = window.hangupCall;

    // Add manual call end function for testing
    window.forceEndCall = function(callControlId) {
        console.log('🔧 Force ending call:', callControlId || currentCallControlId);
        handleCallDisconnected(callControlId || currentCallControlId, 'force_end');
    };

    // Monitor for page visibility changes (user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentCallControlId) {
            console.log('🔧 Page became visible, checking call status');
            checkCallStatus(currentCallControlId);
        }
    });

    console.log('🔧 Call disconnect detection ready. Use forceEndCall() to test cleanup.');

})();