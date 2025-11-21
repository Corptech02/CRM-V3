// Enhanced Incoming Call Notification with Client Details
(function() {
    'use strict';

    console.log('📞 Enhanced incoming call handler loading...');

    // Function to find client by phone number
    function findClientByPhone(phoneNumber) {
        console.log('🔍 Looking for client with phone:', phoneNumber);

        // Clean the phone number - remove all non-digits
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        // Get just the last 10 digits (US phone number without country code)
        const last10 = cleanNumber.slice(-10);
        const last7 = cleanNumber.slice(-7);

        console.log('Searching for:', last10, 'or', last7);

        // Search in insurance_leads
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log('Checking', leads.length, 'insurance leads');

        for (const lead of leads) {
            if (!lead.phone) continue;

            // Clean the lead's phone number
            const leadPhone = lead.phone.replace(/\D/g, '');
            const leadLast10 = leadPhone.slice(-10);
            const leadLast7 = leadPhone.slice(-7);

            // Check if the last 10 or 7 digits match
            if (leadLast10 === last10 || leadLast7 === last7 ||
                leadPhone === cleanNumber || leadPhone === last10) {
                console.log('✅ Found matching client:', lead.name, 'Phone:', lead.phone);
                return lead;
            }
        }

        // Also check regular leads
        const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        console.log('Checking', regularLeads.length, 'regular leads');

        for (const lead of regularLeads) {
            if (!lead.phone) continue;

            const leadPhone = lead.phone.replace(/\D/g, '');
            const leadLast10 = leadPhone.slice(-10);
            const leadLast7 = leadPhone.slice(-7);

            if (leadLast10 === last10 || leadLast7 === last7 ||
                leadPhone === cleanNumber || leadPhone === last10) {
                console.log('✅ Found matching client in regular leads:', lead.name, 'Phone:', lead.phone);
                return lead;
            }
        }

        console.log('❌ No client found for number:', phoneNumber);
        console.log('Searched formats:', cleanNumber, last10, last7);
        return null;
    }

    // Format phone number helper
    function formatPhoneNumber(number) {
        const cleaned = number.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.substr(0,3)}) ${cleaned.substr(3,3)}-${cleaned.substr(6,4)}`;
        }
        return number;
    }

    // Function to view client profile from incoming call
    window.viewClientFromCall = function(clientId) {
        console.log('Opening client profile:', clientId);

        // Close the popup
        const popup = document.getElementById('incomingCallPopup');
        if (popup) {
            popup.remove();
        }

        // Stop ringtone
        if (typeof window.stopIncomingRingtone === 'function') {
            window.stopIncomingRingtone();
        }

        // Open the client profile
        if (window.viewLead) {
            window.viewLead(clientId);
        } else if (window.createEnhancedProfile) {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead = leads.find(l => String(l.id) === String(clientId));
            if (lead) {
                window.createEnhancedProfile(lead);
            }
        } else {
            alert('Client profile viewer not available');
        }
    };

    // Wait for the original function to be defined
    function overrideShowIncomingCallPopup() {
        console.log('🔧 Overriding showIncomingCallPopup...');

        // Store the original
        const originalShowIncomingCallPopup = window.showIncomingCallPopup;

        if (!originalShowIncomingCallPopup) {
            console.error('❌ Original showIncomingCallPopup not found!');
            // Try again in 100ms
            setTimeout(overrideShowIncomingCallPopup, 100);
            return;
        }

        // Override with our enhanced version
        window.showIncomingCallPopup = function(callData) {
            console.log('📞 Enhanced popup triggered for:', callData);

            // Remove any existing popup
            const existingPopup = document.getElementById('incomingCallPopup');
            if (existingPopup) {
                existingPopup.remove();
            }

            // Format phone numbers
            const fromNumber = callData.from?.replace('+1', '') || 'Unknown';
            const toNumber = callData.to?.replace('+1', '') || '';

            // Find client details
            const client = findClientByPhone(fromNumber);

            // Create enhanced popup HTML
            const popup = document.createElement('div');
            popup.id = 'incomingCallPopup';
            popup.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 400px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                overflow: hidden;
                animation: slideInUp 0.3s ease;
            `;

            if (client) {
                // Enhanced popup with client details
                popup.innerHTML = `
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Incoming Call - CLIENT</div>
                                <div style="font-size: 22px; font-weight: bold;">${client.name || client.company || 'Unknown Company'}</div>
                                <div style="font-size: 16px; opacity: 0.95; margin-top: 5px;">${formatPhoneNumber(fromNumber)}</div>
                                <div style="font-size: 12px; opacity: 0.8; margin-top: 3px;">To: ${formatPhoneNumber(toNumber)}</div>
                            </div>
                            <div style="animation: pulse 1s infinite;">
                                <i class="fas fa-phone fa-2x" style="transform: rotate(135deg);"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Client Details Section -->
                    <div style="padding: 15px; background: #f8f9fa; border-bottom: 1px solid #e5e7eb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            ${client.contact ? `
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Contact</div>
                                    <div style="font-size: 14px; color: #111827; font-weight: 500;">${client.contact}</div>
                                </div>
                            ` : ''}

                            ${client.insuranceCompany ? `
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Insurance Company</div>
                                    <div style="font-size: 14px; color: #111827; font-weight: 500;">${client.insuranceCompany}</div>
                                </div>
                            ` : ''}

                            ${client.stage ? `
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Stage</div>
                                    <div style="font-size: 14px;">${window.getStageHtml ? window.getStageHtml(client.stage) : client.stage}</div>
                                </div>
                            ` : ''}

                            ${client.premium ? `
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Premium</div>
                                    <div style="font-size: 14px; color: #059669; font-weight: 600;">$${(client.premium || 0).toLocaleString()}</div>
                                </div>
                            ` : ''}

                            ${client.dotNumber ? `
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">DOT #</div>
                                    <div style="font-size: 14px; color: #111827;">${client.dotNumber}</div>
                                </div>
                            ` : ''}

                            ${client.assignedTo ? `
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Assigned To</div>
                                    <div style="font-size: 14px; color: #111827;">${client.assignedTo}</div>
                                </div>
                            ` : ''}
                        </div>

                        ${client.notes ? `
                            <div style="margin-top: 10px;">
                                <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Last Note</div>
                                <div style="font-size: 13px; color: #4b5563; line-height: 1.4; max-height: 40px; overflow: hidden; text-overflow: ellipsis;">
                                    ${client.notes.substring(0, 100)}${client.notes.length > 100 ? '...' : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Action Buttons -->
                    <div style="padding: 15px;">
                        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                                flex: 1;
                                padding: 12px;
                                background: #10b981;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 15px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                font-weight: 500;
                            ">
                                <i class="fas fa-phone"></i>
                                Answer
                            </button>
                            <button onclick="rejectIncomingCall('${callData.callControlId}')" style="
                                flex: 1;
                                padding: 12px;
                                background: #ef4444;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 15px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                font-weight: 500;
                            ">
                                <i class="fas fa-phone-slash"></i>
                                Decline
                            </button>
                        </div>

                        <!-- View Profile Button -->
                        <button onclick="viewClientFromCall('${client.id}')" style="
                            width: 100%;
                            padding: 10px;
                            background: #6366f1;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 14px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            font-weight: 500;
                        ">
                            <i class="fas fa-user"></i>
                            View Client Profile
                        </button>
                    </div>
                `;
            } else {
                // Standard popup for unknown numbers
                popup.innerHTML = `
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Incoming Call</div>
                                <div style="font-size: 20px; font-weight: bold;">${formatPhoneNumber(fromNumber)}</div>
                                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">To: ${formatPhoneNumber(toNumber)}</div>
                            </div>
                            <div style="animation: pulse 1s infinite;">
                                <i class="fas fa-phone fa-2x" style="transform: rotate(135deg);"></i>
                            </div>
                        </div>
                    </div>
                    <div style="padding: 15px; background: #fef3c7;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #92400e;">
                            <i class="fas fa-info-circle"></i>
                            <span style="font-size: 14px;">Unknown number - not in client database</span>
                        </div>
                    </div>
                    <div style="padding: 20px;">
                        <div style="display: flex; gap: 10px;">
                            <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                                flex: 1;
                                padding: 15px;
                                background: #10b981;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-phone"></i>
                                Answer
                            </button>
                            <button onclick="rejectIncomingCall('${callData.callControlId}')" style="
                                flex: 1;
                                padding: 15px;
                                background: #ef4444;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-phone-slash"></i>
                                Decline
                            </button>
                        </div>
                    </div>
                `;
            }

            document.body.appendChild(popup);

            // Play ringtone
            if (typeof window.playIncomingRingtone === 'function') {
                window.playIncomingRingtone();
            }

            // Auto-remove after 30 seconds if not answered
            setTimeout(() => {
                const popup = document.getElementById('incomingCallPopup');
                if (popup) {
                    popup.remove();
                    if (typeof window.stopIncomingRingtone === 'function') {
                        window.stopIncomingRingtone();
                    }
                }
            }, 30000);
        };

        console.log('✅ showIncomingCallPopup successfully overridden!');
    }

    // Start the override process
    setTimeout(overrideShowIncomingCallPopup, 100);

    // Test with actual client number
    window.testClientCall = function(phoneNumber) {
        if (!phoneNumber) {
            // Try to use the first client's phone number
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            if (leads.length > 0 && leads[0].phone) {
                phoneNumber = leads[0].phone;
                console.log('Using first client phone:', phoneNumber);
            } else {
                phoneNumber = '+13305551234';
            }
        }

        window.showIncomingCallPopup({
            callControlId: 'test-' + Date.now(),
            from: phoneNumber,
            to: '+13307652039'
        });
    };

    // Debug function to check if override is active
    window.checkCallOverride = function() {
        const funcString = window.showIncomingCallPopup.toString();
        if (funcString.includes('CLIENT')) {
            console.log('✅ Enhanced call popup is active');
            return true;
        } else {
            console.log('❌ Original call popup is still active');
            return false;
        }
    };

    console.log('✅ Enhanced incoming call handler loaded!');
    console.log('Test with: testClientCall() or testClientCall("+13305551234")');
    console.log('Check status with: checkCallOverride()');
})();