// COMPREHENSIVE FIX for incoming call client matching
(function() {
    'use strict';

    console.log('🔧 FIXING incoming call client matching...');

    // More aggressive phone number matching
    window.findClientByPhoneNumber = function(phoneNumber) {
        console.log('📞 Searching for client with phone:', phoneNumber);

        // Strip everything except digits
        const incomingDigits = phoneNumber.toString().replace(/\D/g, '');

        // Try multiple lengths
        const searchPatterns = [
            incomingDigits,                    // Full number
            incomingDigits.slice(-10),         // Last 10 digits
            incomingDigits.slice(-7),          // Last 7 digits
            incomingDigits.slice(1),           // Remove country code
            incomingDigits.slice(2)            // Remove +1 or 1
        ];

        console.log('Search patterns:', searchPatterns);

        // Get all leads
        const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const allLeads = [...insuranceLeads, ...regularLeads];

        console.log(`Searching through ${allLeads.length} total leads...`);

        // Search for matching client
        for (const lead of allLeads) {
            if (!lead.phone) continue;

            // Get just the digits from the stored phone
            const leadDigits = lead.phone.toString().replace(/\D/g, '');

            // Check if ANY part matches
            for (const pattern of searchPatterns) {
                if (pattern && leadDigits && (
                    pattern.includes(leadDigits) ||
                    leadDigits.includes(pattern) ||
                    pattern.slice(-7) === leadDigits.slice(-7) ||  // Last 7 digits match
                    pattern.slice(-10) === leadDigits.slice(-10)   // Last 10 digits match
                )) {
                    console.log('✅ FOUND CLIENT MATCH!');
                    console.log('Client Name:', lead.name || lead.company);
                    console.log('Client Phone:', lead.phone);
                    console.log('Matched with pattern:', pattern);
                    return lead;
                }
            }
        }

        console.log('❌ No client found for:', phoneNumber);

        // Show some examples of what we have
        console.log('Example clients with phones:');
        let count = 0;
        for (const lead of allLeads) {
            if (lead.phone && count < 3) {
                console.log(`- ${lead.name || lead.company}: ${lead.phone}`);
                count++;
            }
        }

        return null;
    };

    // COMPLETELY REPLACE the incoming call popup function
    window.showEnhancedClientPopup = function(callData) {
        console.log('🎯 Enhanced client popup triggered!', callData);

        // Remove existing popup
        const existingPopup = document.getElementById('incomingCallPopup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Get phone numbers
        const fromNumber = (callData.from || '').replace('+1', '').replace('+', '');
        const toNumber = (callData.to || '').replace('+1', '').replace('+', '');

        // Find client
        const client = window.findClientByPhoneNumber(fromNumber);

        // Format phone for display
        const formatPhone = (num) => {
            const clean = num.replace(/\D/g, '');
            if (clean.length === 10) {
                return `(${clean.slice(0,3)}) ${clean.slice(3,6)}-${clean.slice(6)}`;
            }
            return num;
        };

        // Create popup
        const popup = document.createElement('div');
        popup.id = 'incomingCallPopup';
        popup.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 420px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 999999;
            overflow: hidden;
            animation: slideInUp 0.3s ease;
        `;

        if (client) {
            // CLIENT FOUND - Show detailed info
            popup.innerHTML = `
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; color: white;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="flex: 1;">
                            <div style="font-size: 11px; opacity: 0.95; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
                                ⭐ EXISTING CLIENT
                            </div>
                            <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
                                ${client.name || client.company || 'Client'}
                            </div>
                            <div style="font-size: 16px; opacity: 0.95;">
                                📞 ${formatPhone(fromNumber)}
                            </div>
                            ${client.contact ? `
                                <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
                                    Contact: ${client.contact}
                                </div>
                            ` : ''}
                        </div>
                        <div style="animation: pulse 1.5s infinite;">
                            <i class="fas fa-phone-volume fa-2x"></i>
                        </div>
                    </div>
                </div>

                <!-- Client Info Grid -->
                <div style="padding: 15px; background: #f0f9ff; border-bottom: 1px solid #e0f2fe;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${client.insuranceCompany || client.insurance_company ? `
                            <div style="background: white; padding: 8px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                                <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">INSURANCE</div>
                                <div style="font-size: 14px; color: #1e293b; font-weight: 600;">
                                    ${client.insuranceCompany || client.insurance_company || 'Not Set'}
                                </div>
                            </div>
                        ` : ''}

                        ${client.stage ? `
                            <div style="background: white; padding: 8px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                                <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">STAGE</div>
                                <div style="font-size: 14px; color: #1e293b; font-weight: 600;">
                                    ${client.stage.charAt(0).toUpperCase() + client.stage.slice(1)}
                                </div>
                            </div>
                        ` : ''}

                        ${client.premium ? `
                            <div style="background: white; padding: 8px; border-radius: 6px; border-left: 3px solid #10b981;">
                                <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">PREMIUM</div>
                                <div style="font-size: 14px; color: #059669; font-weight: 600;">
                                    $${(client.premium || 0).toLocaleString()}
                                </div>
                            </div>
                        ` : ''}

                        ${client.assignedTo ? `
                            <div style="background: white; padding: 8px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                                <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">ASSIGNED TO</div>
                                <div style="font-size: 14px; color: #1e293b; font-weight: 600;">
                                    ${client.assignedTo}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    ${client.notes ? `
                        <div style="margin-top: 12px; background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #06b6d4;">
                            <div style="font-size: 10px; color: #64748b; margin-bottom: 4px;">LAST NOTE</div>
                            <div style="font-size: 13px; color: #475569; line-height: 1.4;">
                                ${client.notes.substring(0, 150)}${client.notes.length > 150 ? '...' : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Action Buttons -->
                <div style="padding: 15px; background: white;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                            padding: 14px;
                            background: #10b981;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                            <i class="fas fa-phone"></i>
                            Answer Call
                        </button>
                        <button onclick="rejectIncomingCall('${callData.callControlId}')" style="
                            padding: 14px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                            <i class="fas fa-phone-slash"></i>
                            Decline
                        </button>
                    </div>

                    <button onclick="viewClientFromCall('${client.id}')" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-user-circle"></i>
                        Open Full Client Profile
                    </button>
                </div>
            `;
        } else {
            // UNKNOWN NUMBER
            popup.innerHTML = `
                <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 20px; color: white;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">
                                Incoming Call
                            </div>
                            <div style="font-size: 22px; font-weight: bold;">
                                ${formatPhone(fromNumber)}
                            </div>
                            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                                To: ${formatPhone(toNumber)}
                            </div>
                        </div>
                        <div style="animation: pulse 1.5s infinite;">
                            <i class="fas fa-phone fa-2x" style="transform: rotate(135deg);"></i>
                        </div>
                    </div>
                </div>

                <div style="padding: 15px; background: #fef3c7; border-bottom: 1px solid #fde68a;">
                    <div style="display: flex; align-items: center; gap: 10px; color: #92400e;">
                        <i class="fas fa-question-circle"></i>
                        <div>
                            <div style="font-weight: 600;">New Caller</div>
                            <div style="font-size: 13px; opacity: 0.9;">Not found in client database</div>
                        </div>
                    </div>
                </div>

                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button onclick="answerIncomingCall('${callData.callControlId}')" style="
                            padding: 14px;
                            background: #10b981;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
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
                            padding: 14px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
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

        // Play ringtone if available
        if (window.playIncomingRingtone) {
            window.playIncomingRingtone();
        }

        // Auto remove after 30 seconds
        setTimeout(() => {
            const p = document.getElementById('incomingCallPopup');
            if (p) {
                p.remove();
                if (window.stopIncomingRingtone) {
                    window.stopIncomingRingtone();
                }
            }
        }, 30000);
    };

    // FORCE OVERRIDE the original function
    let overrideAttempts = 0;
    const forceOverride = setInterval(() => {
        overrideAttempts++;

        if (window.showIncomingCallPopup) {
            // Save original
            window.originalIncomingCallPopup = window.showIncomingCallPopup;

            // REPLACE with enhanced version
            window.showIncomingCallPopup = function(callData) {
                console.log('🚀 Intercepted incoming call!');
                window.showEnhancedClientPopup(callData);
            };

            console.log('✅ Successfully replaced incoming call popup!');
            clearInterval(forceOverride);
        }

        if (overrideAttempts > 50) {
            console.error('Failed to override after 5 seconds');
            clearInterval(forceOverride);
        }
    }, 100);

    // Test functions
    window.testWithClient = function() {
        // Get first client with a phone
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const clientWithPhone = leads.find(l => l.phone);

        if (clientWithPhone) {
            console.log('Testing with client:', clientWithPhone.name, 'Phone:', clientWithPhone.phone);
            window.showIncomingCallPopup({
                callControlId: 'test-' + Date.now(),
                from: clientWithPhone.phone,
                to: '+13307652039'
            });
        } else {
            console.log('No clients with phone numbers found');
        }
    };

    window.testWithNumber = function(phone) {
        window.showIncomingCallPopup({
            callControlId: 'test-' + Date.now(),
            from: phone || '3302417570',
            to: '+13307652039'
        });
    };

    console.log('✅ Incoming call matching FIXED!');
    console.log('Test with: testWithClient() or testWithNumber("3302417570")');
})();