// SSE Debug Tool - Test incoming call notifications
(function() {
    console.log('🔧 SSE Debug Tool loading...');

    let testEventSource = null;

    // Test SSE connection
    window.testSSEConnection = function() {
        console.log('🔧 Testing SSE connection...');

        if (testEventSource) {
            console.log('Closing existing SSE connection');
            testEventSource.close();
        }

        // Connect to SSE endpoint
        testEventSource = new EventSource('/api/twilio/events');

        testEventSource.onopen = function() {
            console.log('✅ SSE connection opened successfully');
            showNotification('✅ SSE connection opened', 'success');
        };

        testEventSource.onmessage = function(event) {
            console.log('📡 SSE message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('📡 Parsed SSE data:', data);

                if (data.type === 'incoming_call') {
                    console.log('📞 INCOMING CALL DETECTED!', data);
                    showNotification(`📞 INCOMING CALL: ${data.from} → ${data.to} (${data.lineType})`, 'info');
                } else if (data.type === 'connected') {
                    console.log('🔗 SSE connected confirmation');
                    showNotification('🔗 SSE connected', 'success');
                }
            } catch (error) {
                console.error('❌ Error parsing SSE data:', error);
                showNotification('❌ Error parsing SSE data', 'error');
            }
        };

        testEventSource.onerror = function(error) {
            console.error('❌ SSE error:', error);
            showNotification('❌ SSE connection error', 'error');
        };

        // Test for 30 seconds
        setTimeout(() => {
            if (testEventSource) {
                console.log('🔧 Closing test SSE connection');
                testEventSource.close();
                testEventSource = null;
            }
        }, 30000);
    };

    // Simulate incoming call
    window.simulateIncomingCall = function() {
        console.log('🔧 Simulating incoming call...');

        fetch('/api/twilio/incoming-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                CallSid: 'DEBUG' + Date.now(),
                From: '+15551234567',
                To: '+13304600872',
                CallStatus: 'ringing'
            })
        })
        .then(response => response.text())
        .then(data => {
            console.log('✅ Simulate call response:', data);
            showNotification('✅ Call simulation sent', 'info');
        })
        .catch(error => {
            console.error('❌ Simulate call error:', error);
            showNotification('❌ Call simulation failed', 'error');
        });
    };

    // Check if normal SSE is running
    window.checkNormalSSE = function() {
        console.log('🔧 Checking if normal SSE is running...');

        // Look for existing EventSource connections
        const scripts = document.querySelectorAll('script');
        let incomingCallsLoaded = false;

        scripts.forEach(script => {
            if (script.src && script.src.includes('incoming-calls.js')) {
                incomingCallsLoaded = true;
            }
        });

        console.log('📜 Incoming calls script loaded:', incomingCallsLoaded);
        console.log('🌐 Current protocol:', location.protocol);
        console.log('🌐 Current host:', location.host);

        showNotification(`📜 Scripts loaded: ${incomingCallsLoaded}, Protocol: ${location.protocol}`, 'info');
    };

    // Auto-run diagnostics
    console.log('🔧 SSE Debug Tool ready');
    console.log('🔧 Available functions:');
    console.log('   - testSSEConnection()');
    console.log('   - simulateIncomingCall()');
    console.log('   - checkNormalSSE()');

    // Auto-check on load
    setTimeout(() => {
        checkNormalSSE();
    }, 2000);

})();