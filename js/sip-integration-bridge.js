/*
 * SIP Integration Bridge
 * Connects Vanguard SIP Softphone with existing CRM call handling
 */

// Override the existing answer call function to handle SIP calls
(function() {
    // Store the original answer function
    const originalAnswerCall = window.answerIncomingCall;

    // Enhanced answer function that handles both Twilio and SIP
    window.answerIncomingCall = function(callSid) {
        console.log('📞 Answer call requested for:', callSid);

        // Check if this is a SIP call
        const lastCallData = window.lastIncomingCallData;
        if (lastCallData && lastCallData.type === 'sip_incoming_call') {
            console.log('📞 Answering SIP call...');

            // Answer the SIP call
            if (window.answerSipCall) {
                window.answerSipCall();
            }

            // Update the popup to show answered state
            updateCallPopupForSip(callSid, 'answered');

            // Hide the incoming call popup after 2 seconds
            setTimeout(() => {
                const popup = document.getElementById('incomingCallPopup');
                if (popup) {
                    popup.remove();
                }
            }, 2000);

            return;
        }

        // For Twilio calls, use the original function
        if (originalAnswerCall) {
            originalAnswerCall(callSid);
        }
    };

    // Function to update call popup for SIP calls
    function updateCallPopupForSip(callSid, status) {
        const popup = document.getElementById('incomingCallPopup');
        if (!popup) return;

        const statusDiv = popup.querySelector('.call-status, #call-status');
        const actionButtons = popup.querySelector('.popup-actions, .call-actions');

        if (status === 'answered') {
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="color: #059669; font-weight: bold;">
                        ✅ SIP Call Answered
                    </div>
                    <div style="font-size: 12px; margin-top: 5px;">
                        Audio connected through SIP softphone
                    </div>
                `;
            }

            if (actionButtons) {
                actionButtons.innerHTML = `
                    <button onclick="hangupSipCall('${callSid}')" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        margin-right: 10px;
                    ">📞 Hang Up</button>
                    <button onclick="document.getElementById('incomingCallPopup').remove()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Hide</button>
                `;
            }
        }
    }

    // Add SIP hangup function
    window.hangupSipCall = function(callSid) {
        console.log('📞 Hanging up SIP call:', callSid);

        if (window.vanguardSoftphone) {
            window.vanguardSoftphone.hangupCall();
        }

        // Remove the popup
        const popup = document.getElementById('incomingCallPopup');
        if (popup) {
            popup.remove();
        }
    };

    // Enhanced call popup for SIP calls
    function createSipCallPopup(callData) {
        const callerNumber = callData.from || 'Unknown';
        const lineType = callData.lineType || 'SIP Line';

        return `
            <div class="popup-content">
                <div class="popup-header">
                    <h3 style="margin: 0; color: #1f2937;">📞 Incoming SIP Call</h3>
                </div>
                <div class="call-info">
                    <div class="caller-info">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                            ${callerNumber}
                        </div>
                        <div style="color: #6b7280; font-size: 14px;">
                            ${lineType}
                        </div>
                    </div>
                </div>
                <div class="call-status" id="call-status">
                    <div style="color: #059669; font-weight: bold;">
                        🔔 Ringing - Click Answer to accept
                    </div>
                </div>
                <div class="popup-actions call-actions">
                    <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                        background: #059669;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        margin-right: 15px;
                    ">📞 Answer</button>
                    <button onclick="declineSipCall('${callData.callControlId}')" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">📞 Decline</button>
                </div>
            </div>
        `;
    }

    // Decline SIP call function
    window.declineSipCall = function(callSid) {
        console.log('📞 Declining SIP call:', callSid);

        if (window.vanguardSoftphone) {
            window.vanguardSoftphone.hangupCall(); // This will reject the incoming call
        }

        // Remove the popup
        const popup = document.getElementById('incomingCallPopup');
        if (popup) {
            popup.remove();
        }
    };

    // Store the original popup function
    const originalShowIncomingCallPopup = window.showIncomingCallPopup;

    // Enhanced popup function that handles both Twilio and SIP
    window.showIncomingCallPopup = async function(callData) {
        console.log('🚨 Enhanced showIncomingCallPopup called with:', callData);

        // Store call data globally
        window.lastIncomingCallData = callData;

        // Remove any existing popup
        const existingPopup = document.getElementById('incomingCallPopup');
        if (existingPopup) {
            console.log('🗑️ Removing existing popup');
            existingPopup.remove();
        }

        // Check if this is a SIP call
        if (callData.type === 'sip_incoming_call') {
            console.log('📞 Creating SIP call popup');

            // Create SIP-specific popup
            const popup = document.createElement('div');
            popup.id = 'incomingCallPopup';
            popup.className = 'incoming-call-popup';
            popup.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 2px solid #059669;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                padding: 20px;
                z-index: 10000;
                min-width: 320px;
                font-family: Arial, sans-serif;
            `;

            popup.innerHTML = createSipCallPopup(callData);
            document.body.appendChild(popup);

            // Play ringtone (different from SIP softphone internal ringtone)
            window.playIncomingRingtone && window.playIncomingRingtone();

            return;
        }

        // For Twilio calls, use the original function
        if (originalShowIncomingCallPopup) {
            return originalShowIncomingCallPopup(callData);
        }
    };

    console.log('✅ SIP Integration Bridge initialized');
})();