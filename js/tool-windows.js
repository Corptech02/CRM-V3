// Tool Windows Management System
let windowCounter = 0;
const openWindows = {};
const minimizedWindows = {};

// Create taskbar container
function initTaskbar() {
    if (!document.getElementById('minimized-taskbar')) {
        const taskbar = document.createElement('div');
        taskbar.id = 'minimized-taskbar';
        taskbar.className = 'minimized-taskbar';
        document.body.appendChild(taskbar);
    }
}

// Create a draggable window
function createToolWindow(title, icon, content, width = 500, height = 400) {
    initTaskbar();
    
    const windowId = `tool-window-${windowCounter++}`;
    const window = document.createElement('div');
    window.id = windowId;
    window.className = 'tool-window';
    window.style.width = width + 'px';
    window.style.height = height + 'px';
    
    // Center the window (fix: use document.documentElement instead of window object conflict)
    const viewportWidth = document.documentElement.clientWidth || document.body.clientWidth;
    const viewportHeight = document.documentElement.clientHeight || document.body.clientHeight;
    window.style.left = `${Math.max(50, (viewportWidth - width) / 2 + Math.random() * 100)}px`;
    window.style.top = `${Math.max(50, (viewportHeight - height) / 2 + Math.random() * 50)}px`;
    
    window.innerHTML = `
        <div class="tool-window-header">
            <div class="tool-window-title">
                <i class="fas ${icon}"></i>
                <span>${title}</span>
            </div>
            <div class="tool-window-controls">
                <button class="tool-window-btn" onclick="minimizeWindow('${windowId}')" title="Minimize">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="tool-window-btn" onclick="closeWindow('${windowId}')" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="tool-window-content">
            ${content}
        </div>
    `;
    
    document.body.appendChild(window);
    openWindows[windowId] = { title, icon };
    
    // Make the window draggable
    makeDraggable(window);
    
    // Bring to front on click
    window.addEventListener('mousedown', () => bringToFront(window));
    
    // Bring to front initially
    bringToFront(window);
    
    return windowId;
}

// Make element draggable
function makeDraggable(element) {
    const header = element.querySelector('.tool-window-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    header.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        // Keep window within viewport
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        element.style.top = Math.min(Math.max(0, newTop), maxY) + "px";
        element.style.left = Math.min(Math.max(0, newLeft), maxX) + "px";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Bring window to front
function bringToFront(element) {
    const windows = document.querySelectorAll('.tool-window');
    windows.forEach(w => w.style.zIndex = 1000);
    element.style.zIndex = 1001;
}

// Minimize window
function minimizeWindow(windowId) {
    const window = document.getElementById(windowId);
    const windowData = openWindows[windowId];
    
    if (window && windowData) {
        window.classList.add('minimized');
        minimizedWindows[windowId] = windowData;
        
        // Create taskbar item
        const taskbar = document.getElementById('minimized-taskbar');
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.id = `taskbar-${windowId}`;
        taskbarItem.innerHTML = `
            <i class="fas ${windowData.icon}"></i>
            <span>${windowData.title}</span>
        `;
        taskbarItem.onclick = () => restoreWindow(windowId);
        taskbar.appendChild(taskbarItem);
    }
}

// Restore minimized window
function restoreWindow(windowId) {
    const window = document.getElementById(windowId);
    const taskbarItem = document.getElementById(`taskbar-${windowId}`);
    
    if (window) {
        window.classList.remove('minimized');
        delete minimizedWindows[windowId];
        bringToFront(window);
    }
    
    if (taskbarItem) {
        taskbarItem.remove();
    }
}

// Close window
function closeWindow(windowId) {
    const window = document.getElementById(windowId);
    const taskbarItem = document.getElementById(`taskbar-${windowId}`);
    
    if (window) {
        window.remove();
        delete openWindows[windowId];
        delete minimizedWindows[windowId];
    }
    
    if (taskbarItem) {
        taskbarItem.remove();
    }
}

// Tool window creation functions
function openPhoneTool() {
    const phoneId = 'phone-' + Date.now();
    const content = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <!-- Phone Tabs -->
            <div style="display: flex; border-bottom: 2px solid #e5e7eb; background: #f9fafb;">
                <button onclick="showPhoneTab('${phoneId}', 'dialer')" class="phone-tab active" style="flex: 1; padding: 12px; background: transparent; border: none; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-th"></i> Dialer
                </button>
                <button onclick="showPhoneTab('${phoneId}', 'calls')" class="phone-tab" style="flex: 1; padding: 12px; background: transparent; border: none; cursor: pointer; position: relative;">
                    <i class="fas fa-phone-alt"></i> Calls
                    <span style="position: absolute; top: 8px; right: 35%; background: #ef4444; color: white; border-radius: 10px; padding: 2px 5px; font-size: 10px;">2</span>
                </button>
                <button onclick="showPhoneTab('${phoneId}', 'sms')" class="phone-tab" style="flex: 1; padding: 12px; background: transparent; border: none; cursor: pointer;">
                    <i class="fas fa-sms"></i> SMS
                </button>
                <button onclick="showPhoneTab('${phoneId}', 'voicemail')" class="phone-tab" style="flex: 1; padding: 12px; background: transparent; border: none; cursor: pointer; position: relative;">
                    <i class="fas fa-voicemail"></i> Voicemail
                    <span style="position: absolute; top: 8px; right: 20%; background: #ef4444; color: white; border-radius: 10px; padding: 2px 5px; font-size: 10px;">3</span>
                </button>
                <button onclick="showPhoneTab('${phoneId}', 'contacts')" class="phone-tab" style="flex: 1; padding: 12px; background: transparent; border: none; cursor: pointer;">
                    <i class="fas fa-address-book"></i> Contacts
                </button>
                <button onclick="showPhoneTab('${phoneId}', 'sip')" class="phone-tab" style="flex: 1; padding: 12px; background: transparent; border: none; cursor: pointer;">
                    <i class="fas fa-cog"></i> SIP
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="${phoneId}-content" style="flex: 1; overflow-y: auto;">
                ${generateDialerTab(phoneId)}
            </div>
        </div>
    `;
    
    createToolWindow('Phone - (330) 636-9079', 'fa-phone', content, 450, 600);
    
    // Add phone styles
    const style = document.createElement('style');
    style.textContent = `
        .phone-tab { transition: all 0.2s; color: #6b7280; }
        .phone-tab:hover { background: #e5e7eb !important; }
        .phone-tab.active { color: #0066cc; border-bottom: 2px solid #0066cc; font-weight: 600; }
        .dial-btn { transition: all 0.1s; }
        .dial-btn:hover { background: #e5e7eb !important; transform: scale(1.05); }
        .dial-btn:active { transform: scale(0.95); }
        .call-item { padding: 12px; border-bottom: 1px solid #e5e7eb; cursor: pointer; }
        .call-item:hover { background: #f9fafb; }
        .contact-item { padding: 10px; border-bottom: 1px solid #e5e7eb; cursor: pointer; display: flex; align-items: center; }
        .contact-item:hover { background: #f9fafb; }
        .voicemail-item { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .voicemail-item:hover { background: #f9fafb; }
    `;
    if (!document.getElementById('phone-styles')) {
        style.id = 'phone-styles';
        document.head.appendChild(style);
    }
}

// Generate dialer tab content - optimized to fit without scrolling
function generateDialerTab(phoneId) {
    // Check SIP configuration status
    const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
    const hasSipConfig = sipConfig.username && sipConfig.password && sipConfig.domain;
    const hasJsSIP = typeof JsSIP !== 'undefined';

    let sipStatus = '';
    if (hasSipConfig && hasJsSIP) {
        sipStatus = `
            <div style="margin-bottom: 10px; padding: 8px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; font-size: 12px; color: #1e40af;">
                <i class="fas fa-phone"></i> Voice Calling Ready - SIP configured, Voice API available as fallback
            </div>
        `;
    } else if (hasSipConfig) {
        sipStatus = `
            <div style="margin-bottom: 10px; padding: 8px; background: #d1fae5; border: 1px solid #10b981; border-radius: 4px; font-size: 12px; color: #065f46;">
                <i class="fas fa-phone"></i> Twilio Voice API Calling - ${sipConfig.callerId || 'Default Caller ID'}
            </div>
        `;
    } else {
        sipStatus = `
            <div style="margin-bottom: 10px; padding: 8px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; font-size: 12px; color: #92400e;">
                <i class="fas fa-cog"></i> Configure calling settings in the SIP tab
            </div>
        `;
    }

    return `
        <div style="padding: 10px; height: 100%; display: flex; flex-direction: column;">
            ${sipStatus}
            <!-- Phone Number Input -->
            <input id="${phoneId}-number" type="tel" placeholder="Enter phone number..."
                   style="width: 100%; padding: 10px; font-size: 18px; border: 2px solid #e5e7eb; border-radius: 6px; margin-bottom: 15px; text-align: center;">

            <!-- Dial Pad Grid -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 auto; flex: 1; width: 100%;">
                ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(num => `
                    <button onclick="dialNumber('${phoneId}', '${num}')" class="dial-btn" style="padding: 15px; font-size: 20px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; height: 55px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        ${num}
                        ${num !== '*' && num !== '#' && num !== 0 ? `<div style="font-size: 9px; color: #6b7280; margin-top: 1px; line-height: 1;">${getLetters(num)}</div>` : ''}
                    </button>
                `).join('')}
            </div>
            
            <!-- Call/Clear Buttons -->
            <div style="display: flex; gap: 8px; margin-top: 15px;">
                <button onclick="makeCall('${phoneId}')" style="flex: 1; padding: 12px; background: #0066cc; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer; height: 45px;">
                    <i class="fas fa-phone"></i> Call
                </button>
                <button onclick="clearNumber('${phoneId}')" style="padding: 12px 20px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; height: 45px;">
                    <i class="fas fa-backspace"></i>
                </button>
            </div>
        </div>
    `;
}

// Generate calls tab content
function generateCallsTab(phoneId) {
    // Get real call history from localStorage
    const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
    
    return `
        <div>
            <div style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <input type="text" placeholder="Search call history..." style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">
            </div>
            ${calls.length === 0 ? `
                <div style="padding: 40px; text-align: center; color: #6b7280;">
                    <i class="fas fa-phone-slash" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                    <div style="font-size: 16px; margin-bottom: 5px;">No call history</div>
                    <div style="font-size: 14px;">Your call history will appear here</div>
                </div>
            ` : calls.map(call => `
                <div class="call-item">
                    <div style="display: flex; align-items: center;">
                        <div style="margin-right: 12px;">
                            ${call.type === 'missed' ? '<i class="fas fa-phone-slash" style="color: #ef4444;"></i>' :
                              call.type === 'incoming' ? '<i class="fas fa-phone-alt" style="color: #10b981; transform: rotate(135deg);"></i>' :
                              '<i class="fas fa-phone-alt" style="color: #3b82f6; transform: rotate(-45deg);"></i>'}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: ${call.type === 'missed' ? '600' : '500'}; color: ${call.type === 'missed' ? '#ef4444' : '#111827'};">
                                ${call.name}
                            </div>
                            <div style="font-size: 13px; color: #6b7280;">${call.number}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: #6b7280;">${call.formattedTime || call.time}</div>
                            ${call.duration ? `<div style="font-size: 12px; color: #6b7280;">${call.duration}</div>` : ''}
                        </div>
                        <div style="margin-left: 15px; display: flex; gap: 8px;">
                            <button onclick="makeCall('${phoneId}', '${call.number}', '${call.name}')" style="padding: 6px 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-phone"></i>
                            </button>
                            ${call.duration ? `
                                <button onclick="playRecording('${call.name}', '${call.duration}')" style="padding: 6px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-play"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate SMS tab content
function generateSMSTab(phoneId) {
    // Get real SMS conversations from localStorage
    const conversations = getSMSConversations();
    
    // Debug: Check if we have messages
    const allMessages = JSON.parse(localStorage.getItem('smsMessages') || '[]');
    if (allMessages.length > 0 && conversations.length === 0) {
        console.warn('Have messages but no conversations generated!', allMessages);
    }
    
    return `
        <div style="height: 100%; display: flex;">
            <!-- Conversations List -->
            <div id="${phoneId}-conversations-list" style="width: 200px; border-right: 1px solid #e5e7eb; overflow-y: auto;">
                ${conversations.length === 0 ? `
                    <div style="padding: 20px; text-align: center; color: #6b7280;">
                        <i class="fas fa-sms" style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;"></i>
                        <div style="font-size: 14px;">No conversations</div>
                        <div style="font-size: 12px; margin-top: 5px;">Send a message to start</div>
                    </div>
                ` : conversations.map(conv => `
                    <div class="contact-item" onclick="openSMSConversation('${conv.phoneNumber}', '${conv.name}', '${phoneId}')">
                        <div style="flex: 1;">
                            <div style="font-weight: ${conv.unread > 0 ? '600' : '400'};">${conv.name}</div>
                            <div style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${conv.lastMessage}
                            </div>
                        </div>
                        ${conv.unread > 0 ? `
                            <span style="background: #3b82f6; color: white; border-radius: 10px; padding: 2px 6px; font-size: 11px;">
                                ${conv.unread}
                            </span>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <!-- SMS Conversation -->
            <div id="${phoneId}-sms-view" style="flex: 1; display: flex; flex-direction: column;">
                <div id="${phoneId}-sms-header" style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: none;">
                    <div style="font-weight: 600;">New Message</div>
                </div>
                <div id="${phoneId}-sms-messages" style="flex: 1; padding: 20px; overflow-y: auto;">
                    <div style="text-align: center; color: #6b7280; padding: 50px;">
                        Select a conversation or start a new message
                    </div>
                </div>
                <div id="${phoneId}-sms-input" style="padding: 10px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px;">
                    <input id="${phoneId}-phone-input" type="tel" placeholder="Enter phone number..." style="width: 150px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;" onkeyup="enableSMSInput('${phoneId}')">
                    <input id="${phoneId}-message-input" type="text" placeholder="Type a message..." style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;" disabled onkeypress="if(event.key==='Enter')sendSMS('${phoneId}')">
                    <button onclick="sendSMS('${phoneId}')" id="${phoneId}-send-btn" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Generate voicemail tab content
function generateVoicemailTab(phoneId) {
    const voicemails = [
        { name: 'Mike Wilson', number: '(555) 111-2222', time: '10 min ago', duration: '0:45', new: true },
        { name: 'Unknown', number: '(555) 333-4444', time: '2 hours ago', duration: '1:23', new: true },
        { name: 'Lisa Anderson', number: '(555) 555-6666', time: 'Yesterday', duration: '2:15', new: true },
        { name: 'Tom Brown', number: '(555) 777-8888', time: 'Dec 3', duration: '0:32', new: false }
    ];
    
    return `
        <div>
            <div style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <div style="font-weight: 600; color: #374151;">Voicemail Messages (${voicemails.filter(v => v.new).length} new)</div>
            </div>
            ${voicemails.map((vm, index) => `
                <div class="voicemail-item">
                    <div style="display: flex; align-items: center;">
                        <div style="margin-right: 12px;">
                            <i class="fas fa-voicemail" style="color: ${vm.new ? '#ef4444' : '#6b7280'}; font-size: 20px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: ${vm.new ? '600' : '400'};">
                                ${vm.name}
                                ${vm.new ? '<span style="margin-left: 8px; background: #ef4444; color: white; border-radius: 3px; padding: 2px 6px; font-size: 11px;">NEW</span>' : ''}
                            </div>
                            <div style="font-size: 13px; color: #6b7280;">${vm.number} • ${vm.time}</div>
                            <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
                                <button onclick="playVoicemail(${index})" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-play"></i> Play (${vm.duration})
                                </button>
                                <button onclick="makeCall('${phoneId}', '${vm.number}', '${vm.name}')" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-phone"></i> Call Back
                                </button>
                                <button style="padding: 6px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate contacts tab content
function generateContactsTab(phoneId) {
    const contacts = [
        { name: 'Anderson, Lisa', number: '(555) 111-2222', email: 'lisa@example.com', company: 'ABC Insurance' },
        { name: 'Brown, Tom', number: '(555) 333-4444', email: 'tom@example.com', company: 'XYZ Corp' },
        { name: 'Davis, Mike', number: '(555) 555-6666', email: 'mike@example.com', company: 'Progressive' },
        { name: 'Johnson, Sarah', number: '(555) 777-8888', email: 'sarah@example.com', company: 'State Farm' },
        { name: 'Smith, John', number: '(555) 999-0000', email: 'john@example.com', company: 'Nationwide' }
    ];
    
    return `
        <div>
            <div style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <input type="text" placeholder="Search contacts..." onkeyup="searchContacts(this)" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">
            </div>
            <div style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <button style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-user-plus"></i> Add Contact
                </button>
            </div>
            ${contacts.map(contact => `
                <div class="contact-item">
                    <div style="width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="fas fa-user" style="color: #6b7280;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${contact.name}</div>
                        <div style="font-size: 13px; color: #6b7280;">${contact.company}</div>
                        <div style="font-size: 12px; color: #6b7280;">${contact.number} • ${contact.email}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="makeCall('${phoneId}', '${contact.number}', '${contact.name}')" style="padding: 6px 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button onclick="openSMSFromContact('${contact.name}', '${phoneId}')" style="padding: 6px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-sms"></i>
                        </button>
                        <button style="padding: 6px 10px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate SIP configuration tab content
function generateSIPTab(phoneId) {
    // Get existing SIP config from localStorage
    const savedConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    return `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #374151;">SIP Configuration</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Configure your SIP settings for VoIP calling</p>
            </div>

            <div id="${phoneId}-sip-status" style="margin-bottom: 20px; padding: 12px; border-radius: 6px; display: none;">
                <!-- Status will be shown here -->
            </div>

            <form id="${phoneId}-sip-form" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Username</label>
                    <input type="text" id="${phoneId}-sip-username" value="${savedConfig.username || 'Grant'}"
                           style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Password</label>
                    <input type="password" id="${phoneId}-sip-password" value="${savedConfig.password || 'GrantCorp2006@'}"
                           style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Domain / Host</label>
                    <input type="text" id="${phoneId}-sip-domain" value="${savedConfig.domain || 'vanguard1.sip.twilio.com'}"
                           style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Outbound Proxy <span style="color: #6b7280; font-weight: normal;">(optional)</span></label>
                    <input type="text" id="${phoneId}-sip-proxy" value="${savedConfig.proxy || 'sip.twilio.com'}"
                           style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Caller ID <span style="color: #6b7280; font-weight: normal;">(optional)</span></label>
                    <input type="tel" id="${phoneId}-sip-callerid" value="${savedConfig.callerId || '+13306369079'}"
                           style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="button" onclick="saveSIPConfig('${phoneId}')"
                            style="flex: 1; padding: 12px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-save"></i> Save Configuration
                    </button>
                    <button type="button" onclick="testSIPConnection('${phoneId}')" id="${phoneId}-test-btn"
                            style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-plug"></i> Test Connection
                    </button>
                </div>
            </form>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 15px 0; color: #374151;">Connection Status</h4>
                <div id="${phoneId}-connection-status" style="padding: 15px; background: #f9fafb; border-radius: 6px; color: #6b7280;">
                    <i class="fas fa-info-circle"></i> Not connected. Configure and test your SIP settings above.
                </div>
            </div>
        </div>
    `;
}

// Phone helper functions
function showPhoneTab(phoneId, tab) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.phone-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.closest('.phone-tab').classList.add('active');
    
    // Update content
    const content = document.getElementById(phoneId + '-content');
    switch(tab) {
        case 'dialer':
            content.innerHTML = generateDialerTab(phoneId);
            break;
        case 'calls':
            content.innerHTML = generateCallsTab(phoneId);
            break;
        case 'sms':
            content.innerHTML = generateSMSTab(phoneId);
            break;
        case 'voicemail':
            content.innerHTML = generateVoicemailTab(phoneId);
            break;
        case 'contacts':
            content.innerHTML = generateContactsTab(phoneId);
            break;
        case 'sip':
            content.innerHTML = generateSIPTab(phoneId);
            break;
    }
}

function dialNumber(phoneId, num) {
    const input = document.getElementById(phoneId + '-number');
    if (input) {
        input.value += num;
    }
}

function clearNumber(phoneId) {
    const input = document.getElementById(phoneId + '-number');
    if (input) {
        input.value = input.value.slice(0, -1);
    }
}

function makeCall(phoneId, number, name) {
    const input = document.getElementById(phoneId + '-number');
    const phoneNumber = number || (input ? input.value : '');
    const callerName = name || 'Unknown';

    if (phoneNumber) {
        // Check if SIP is configured and available
        const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
        const hasSipConfig = sipConfig.username && sipConfig.password && sipConfig.domain;

        if (hasSipConfig && typeof JsSIP !== 'undefined') {
            console.log('🔊 Attempting SIP calling for:', phoneNumber);
            makeSIPCall(phoneNumber, callerName);
        } else if (typeof window.twilioSipPhone !== 'undefined' && window.twilioSipPhone.isRegistered) {
            console.log('🔊 Using Twilio SIP phone for:', phoneNumber);
            window.twilioSipPhone.makeCall(phoneNumber);
        } else {
            console.log('📞 Using Twilio Voice API calling');
            makeTwilioVoiceCall(phoneNumber, callerName);
        }
    }
}

async function makeTelnyxCallFromToolWindow(toNumber, fromNumber) {
    try {
        // Request microphone permission first
        const hasMicPermission = await requestMicrophoneAccess();
        
        if (hasMicPermission) {
            showNotification('Microphone ready - Initiating call with audio support', 'success');
        }
        
        // Format phone number for Telnyx (E.164 format)
        const formattedNumber = toNumber.replace(/\D/g, '');
        const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
        
        const TELNYX_API_KEY = 'YOUR_API_KEY_HERE';
        const TELNYX_API_URL = 'https://api.telnyx.com/v2';
        
        // Make the API call using Call Control
        fetch(`${TELNYX_API_URL}/calls`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TELNYX_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connection_id: '2780188277137737142', // Call Control Application ID
                to: e164Number,
                from: '+12164282605', // Use your actual Telnyx number
                webhook_url: 'https://a3eaf804f020.ngrok-free.app/webhook/telnyx',
                webhook_url_method: 'POST'
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('Telnyx error response:', err);
                    throw new Error(err.errors?.[0]?.detail || err.message || 'Call failed');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Call initiated:', data);
            
            // Store call control ID for later use
            window.currentCallControlId = data.data.call_control_id;
            window.currentCallSessionId = data.data.call_session_id;
            
            // Show call controls
            showCallControls(toNumber, data.data.call_control_id);
            
            // Save to call history
            saveCallToHistory({
                number: toNumber,
                name: getContactName(toNumber),
                type: 'outgoing',
                time: new Date().toISOString(),
                duration: '',
                callId: data.data.call_session_id
            });
            
            if (hasMicPermission) {
                showNotification(`Call initiated to ${toNumber}`, 'success');
                // Show audio indicator
                showAudioIndicator();
            } else {
                showNotification(`Call initiated to ${toNumber}`, 'info');
            }
        })
        .catch(error => {
            console.error('Error making call:', error);
            showNotification('Failed to initiate call: ' + (error.message || 'Unknown error'), 'error');
        });
    } catch (error) {
        console.error('Call error:', error);
        showNotification('Failed to initiate call', 'error');
    }
}

// Request microphone access
async function requestMicrophoneAccess() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Successfully got microphone access
        stream.getTracks().forEach(track => track.stop()); // Stop the stream for now
        
        console.log('Microphone access granted');
        return true;
    } catch (error) {
        console.error('Microphone access denied:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            showMicrophonePermissionInfo();
        } else if (error.name === 'NotFoundError') {
            showNotification('No microphone found. Please connect a microphone.', 'error');
        }
        
        return false;
    }
}

// Show microphone permission info
function showMicrophonePermissionInfo() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'micInfoModal';
    
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 500px;">
            <div class="modal-header">
                <h2><i class="fas fa-microphone-slash" style="color: #ef4444;"></i> Microphone Access Required</h2>
                <button class="close-btn" onclick="document.getElementById('micInfoModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <p>To enable voice calling with audio:</p>
                <ol>
                    <li>Click the lock/camera icon in your browser's address bar</li>
                    <li>Set Microphone to "Allow"</li>
                    <li>Refresh the page and try again</li>
                </ol>
                <p style="margin-top: 15px; color: #6b7280;">
                    Note: Calls will still connect through Telnyx, but without browser audio, 
                    the call will ring on the actual phone number associated with your Telnyx account.
                </p>
                <button onclick="document.getElementById('micInfoModal').remove()" class="btn-primary" style="width: 100%; margin-top: 15px;">
                    OK, I understand
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show call controls
function showCallControls(phoneNumber, callControlId, initialStatus = 'Calling') {
    // Find the phone tab content - look for any phone content div
    let phoneTabContent = document.querySelector('[id$="-content"]');

    // If not found, try to find the tool window with Phone title
    if (!phoneTabContent) {
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w =>
            w.querySelector('.window-title')?.textContent?.includes('Phone')
        );
        if (phoneWindow) {
            phoneTabContent = phoneWindow.querySelector('[id$="-content"]');
        }
    }

    if (!phoneTabContent) {
        console.error('Phone tab not found');
        return;
    }

    // Store the original content
    window.originalPhoneContent = phoneTabContent.innerHTML;

    // Replace with active call interface - optimized for phone window size
    phoneTabContent.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); overflow: hidden;">
            <!-- Call Status Bar -->
            <div style="background: rgba(0,0,0,0.2); padding: 10px; text-align: center; color: white;">
                <div id="callStatus" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">${initialStatus}</div>
                <div id="callTimer" style="font-size: 20px; font-weight: 300; margin-top: 2px;">00:00</div>
            </div>
            
            <!-- Contact Info -->
            <div style="flex: 0.5; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; padding: 15px;">
                <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                    <i class="fas fa-user" style="font-size: 30px;"></i>
                </div>
                <div style="font-size: 18px; margin-bottom: 2px;">${phoneNumber}</div>
                <div style="font-size: 12px; opacity: 0.9;">Mobile</div>
            </div>
            
            <!-- Call Controls -->
            <div style="background: rgba(0,0,0,0.3); padding: 15px;">
                <!-- Control Buttons Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 240px; margin: 0 auto 15px;">
                    <button onclick="toggleMuteCall('${callControlId}')" id="muteBtn" class="call-control-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 55px; height: 55px; cursor: pointer; margin: 0 auto;">
                        <i class="fas fa-microphone" style="font-size: 18px;"></i>
                        <div style="font-size: 9px; margin-top: 2px;">Mute</div>
                    </button>
                    <button onclick="toggleDialpad()" class="call-control-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 55px; height: 55px; cursor: pointer; margin: 0 auto;">
                        <i class="fas fa-th" style="font-size: 18px;"></i>
                        <div style="font-size: 9px; margin-top: 2px;">Keypad</div>
                    </button>
                    <button onclick="toggleSpeaker('${callControlId}')" id="speakerBtn" class="call-control-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 55px; height: 55px; cursor: pointer; margin: 0 auto;">
                        <i class="fas fa-volume-up" style="font-size: 18px;"></i>
                        <div style="font-size: 9px; margin-top: 2px;">Speaker</div>
                    </button>
                    <button onclick="addToCall()" class="call-control-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 55px; height: 55px; cursor: pointer; margin: 0 auto;">
                        <i class="fas fa-user-plus" style="font-size: 18px;"></i>
                        <div style="font-size: 9px; margin-top: 2px;">Add</div>
                    </button>
                    <button onclick="toggleHold('${callControlId}')" id="holdBtn" class="call-control-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 55px; height: 55px; cursor: pointer; margin: 0 auto;">
                        <i class="fas fa-pause" style="font-size: 18px;"></i>
                        <div style="font-size: 9px; margin-top: 2px;">Hold</div>
                    </button>
                    <button onclick="toggleRecord('${callControlId}')" id="recordBtn" class="call-control-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 55px; height: 55px; cursor: pointer; margin: 0 auto;">
                        <i class="fas fa-circle" style="font-size: 18px; color: #ef4444;"></i>
                        <div style="font-size: 9px; margin-top: 2px;">Record</div>
                    </button>
                </div>
                
                <!-- End Call Button -->
                <div style="text-align: center;">
                    <button onclick="hangupCall('${callControlId}')" style="background: #ef4444; color: white; border: none; border-radius: 50%; width: 65px; height: 65px; cursor: pointer; box-shadow: 0 4px 15px rgba(239,68,68,0.4);">
                        <i class="fas fa-phone" style="font-size: 22px; transform: rotate(135deg);"></i>
                    </button>
                </div>
            </div>
            
            <!-- Hidden Dialpad -->
            <div id="callDialpad" style="display: none; position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; padding: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 100;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
                    ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(num => `
                        <button onclick="sendDTMF('${callControlId}', '${num}')" style="padding: 10px; font-size: 16px; background: #f3f4f6; border: none; border-radius: 4px; cursor: pointer; width: 40px; height: 40px;">
                            ${num}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Start timer
    let seconds = 0;
    window.callDuration = 0;
    window.callTimer = setInterval(() => {
        seconds++;
        window.callDuration = seconds;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timer = document.getElementById('callTimer');
        if (timer) {
            timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
    
    // Add styles for hover effects and animations
    const style = document.createElement('style');
    style.textContent = `
        .call-control-btn:hover {
            background: rgba(255,255,255,0.3) !important;
            transform: scale(1.1);
        }
        .call-control-btn:active {
            transform: scale(0.95);
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Hang up call
function hangupCall(callControlId) {
    console.log('🔚 Hangup requested for:', callControlId);

    // Check if this is a Twilio Voice API call (starts with CA)
    if (window.currentTwilioCallSid && callControlId.includes(window.currentTwilioCallSid)) {
        console.log('📞 Hanging up Twilio Voice API call:', window.currentTwilioCallSid);
        hangupTwilioVoiceCall(window.currentTwilioCallSid);
        return;
    }

    // Check if this is an active SIP call
    if (window.currentSIPSession) {
        console.log('📞 Hanging up SIP call');
        try {
            window.currentSIPSession.terminate();
            window.currentSIPSession = null;
            console.log('✅ SIP call terminated');
        } catch (error) {
            console.error('❌ Error terminating SIP call:', error);
        }
        endCallCleanup();
        return;
    }

    // Fallback to original Telnyx hangup
    console.log('📞 Attempting Telnyx hangup for:', callControlId);
    const TELNYX_API_KEY = 'YOUR_API_KEY_HERE';

    fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/hangup`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Call ended:', data);
        showNotification('Call ended', 'info');
        endCallCleanup();
    })
    .catch(error => {
        console.error('❌ Telnyx hangup failed:', error);
        showNotification('Failed to end call', 'error');
        // Still cleanup the UI
        endCallCleanup();
    });
}

// Twilio Voice API Hangup Function
async function hangupTwilioVoiceCall(callSid) {
    try {
        console.log('📞 Sending hangup request to Twilio Voice API for:', callSid);

        const response = await fetch('http://162-220-14-239.nip.io:3001/api/twilio/hangup-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({
                callSid: callSid
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Twilio Voice call hung up successfully');
            showNotification('Call ended successfully', 'success');
        } else {
            console.error('❌ Twilio hangup failed:', result.error);
            showNotification(`Hangup failed: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('❌ Error hanging up Twilio Voice call:', error);
        showNotification('Failed to end call', 'error');
    }

    // Always cleanup regardless of API response
    endCallCleanup();
}

// Update call status display
function updateCallStatus(status) {
    const callStatusElement = document.getElementById('callStatus');
    if (callStatusElement) {
        callStatusElement.textContent = status;
        console.log('📞 Call status updated:', status);
    }
}

// Start call status monitoring for Twilio Voice API
function startCallStatusMonitoring(callSid) {
    if (window.callStatusInterval) {
        clearInterval(window.callStatusInterval);
    }

    console.log('📊 Starting call status monitoring for:', callSid);

    window.callStatusInterval = setInterval(async () => {
        try {
            const response = await fetch(`http://162-220-14-239.nip.io:3001/api/twilio/call-status/${callSid}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('📊 Call status:', result.status);

                // Update status display based on Twilio call status
                switch (result.status) {
                    case 'queued':
                        updateCallStatus('Calling');
                        break;
                    case 'ringing':
                        updateCallStatus('Ringing');
                        break;
                    case 'in-progress':
                        updateCallStatus('Connected');
                        startCallTimer(); // Start timer when call connects
                        break;
                    case 'completed':
                    case 'busy':
                    case 'no-answer':
                    case 'canceled':
                    case 'failed':
                        updateCallStatus('Call Ended');
                        clearInterval(window.callStatusInterval);
                        setTimeout(() => endCallCleanup(), 2000); // Auto cleanup after 2 seconds
                        break;
                }
            }
        } catch (error) {
            console.error('❌ Error checking call status:', error);
        }
    }, 2000); // Check every 2 seconds
}

// Start call timer when connected
function startCallTimer() {
    if (window.callTimer) return; // Timer already started

    window.callDuration = 0;
    window.callTimer = setInterval(() => {
        window.callDuration++;
        const minutes = Math.floor(window.callDuration / 60);
        const seconds = window.callDuration % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const timerElement = document.getElementById('callTimer');
        if (timerElement) {
            timerElement.textContent = timeString;
        }
    }, 1000);
}

// Centralized call cleanup function
function endCallCleanup() {
    // Clear timer and save call duration
    if (window.callTimer) {
        clearInterval(window.callTimer);

        // Update call history with duration
        if (window.currentCallSessionId) {
            updateCallDuration(window.currentCallSessionId, window.callDuration || 0);
        }

        window.callTimer = null;
        window.callDuration = null;
        window.currentCallSessionId = null;
    }

    // Clear call status monitoring
    if (window.callStatusInterval) {
        clearInterval(window.callStatusInterval);
        window.callStatusInterval = null;
    }

    // Clear call tracking variables
    window.currentTwilioCallSid = null;
    window.currentSIPSession = null;

    // Restore original phone tab content
    let phoneTabContent = document.querySelector('[id$="-content"]');

    // If not found, try to find the tool window with Phone title
    if (!phoneTabContent) {
        const phoneWindow = Array.from(document.querySelectorAll('.tool-window')).find(w =>
            w.querySelector('.window-title')?.textContent?.includes('Phone')
        );
        if (phoneWindow) {
            phoneTabContent = phoneWindow.querySelector('[id$="-content"]');
        }
    }

    if (phoneTabContent && window.originalPhoneContent) {
        phoneTabContent.innerHTML = window.originalPhoneContent;
        window.originalPhoneContent = null;
    }
}

// Toggle mute
function toggleMuteCall(callControlId) {
    const muteBtn = document.getElementById('muteBtn');
    const icon = muteBtn.querySelector('i');
    const isMuted = icon.classList.contains('fa-microphone-slash');
    
    if (isMuted) {
        icon.className = 'fas fa-microphone';
        muteBtn.style.background = 'rgba(255,255,255,0.2)';
        showNotification('Unmuted', 'info');
    } else {
        icon.className = 'fas fa-microphone-slash';
        muteBtn.style.background = 'rgba(239,68,68,0.3)';
        showNotification('Muted', 'info');
    }
}

// Toggle speaker
function toggleSpeaker(callControlId) {
    const speakerBtn = document.getElementById('speakerBtn');
    const isOn = speakerBtn.style.background.includes('34,197,94');
    
    if (isOn) {
        speakerBtn.style.background = 'rgba(255,255,255,0.2)';
        showNotification('Speaker off', 'info');
    } else {
        speakerBtn.style.background = 'rgba(34,197,94,0.3)';
        showNotification('Speaker on', 'info');
    }
}

// Toggle hold
function toggleHold(callControlId) {
    const holdBtn = document.getElementById('holdBtn');
    const icon = holdBtn.querySelector('i');
    const isOnHold = icon.classList.contains('fa-play');
    
    if (isOnHold) {
        icon.className = 'fas fa-pause';
        holdBtn.style.background = 'rgba(255,255,255,0.2)';
        showNotification('Call resumed', 'info');
    } else {
        icon.className = 'fas fa-play';
        holdBtn.style.background = 'rgba(251,191,36,0.3)';
        showNotification('Call on hold', 'info');
    }
}

// Toggle record
function toggleRecord(callControlId) {
    const recordBtn = document.getElementById('recordBtn');
    const icon = recordBtn.querySelector('i');
    const isRecording = recordBtn.style.background.includes('239,68,68');
    
    if (isRecording) {
        recordBtn.style.background = 'rgba(255,255,255,0.2)';
        icon.style.animation = '';
        showNotification('Recording stopped', 'info');
    } else {
        recordBtn.style.background = 'rgba(239,68,68,0.3)';
        icon.style.animation = 'pulse 1.5s infinite';
        showNotification('Recording started', 'info');
    }
}

// Toggle dialpad
function toggleDialpad() {
    const dialpad = document.getElementById('callDialpad');
    if (dialpad.style.display === 'none') {
        dialpad.style.display = 'block';
    } else {
        dialpad.style.display = 'none';
    }
}

// Send DTMF tone
function sendDTMF(callControlId, digit) {
    console.log('Sending DTMF:', digit);
    showNotification(`Pressed ${digit}`, 'info');
}

// Add participant to call
function addToCall() {
    showNotification('Add participant feature coming soon', 'info');
}

// Get SMS conversations from localStorage
function getSMSConversations() {
    const messages = JSON.parse(localStorage.getItem('smsMessages') || '[]');
    const conversations = {};
    
    // Group messages by phone number
    messages.forEach(msg => {
        const key = msg.phoneNumber;
        if (!conversations[key]) {
            conversations[key] = {
                phoneNumber: msg.phoneNumber,
                name: msg.name || msg.phoneNumber,
                messages: [],
                lastMessage: '',
                lastTime: null,
                unread: 0
            };
        }
        conversations[key].messages.push(msg);
        if (msg.direction === 'inbound' && !msg.read) {
            conversations[key].unread++;
        }
    });
    
    // Get last message for each conversation
    Object.values(conversations).forEach(conv => {
        if (conv.messages.length > 0) {
            const lastMsg = conv.messages[conv.messages.length - 1];
            conv.lastMessage = lastMsg.body;
            conv.lastTime = lastMsg.timestamp;
        }
    });
    
    // Sort by last message time
    const sortedConversations = Object.values(conversations).sort((a, b) => 
        new Date(b.lastTime || 0) - new Date(a.lastTime || 0)
    );
    return sortedConversations;
}

// Edit contact name for SMS conversation
function editContactName(phoneNumber, phoneId) {
    const nameElement = document.getElementById(`${phoneId}-contact-name`);
    if (!nameElement) return;
    
    const currentName = nameElement.textContent;
    const newName = prompt('Enter contact name:', currentName);
    
    if (newName && newName !== currentName) {
        // Update the display
        nameElement.textContent = newName;
        
        // Update all messages in localStorage with this phone number
        const messages = JSON.parse(localStorage.getItem('smsMessages') || '[]');
        messages.forEach(msg => {
            if (msg.phoneNumber === phoneNumber) {
                msg.name = newName;
            }
        });
        localStorage.setItem('smsMessages', JSON.stringify(messages));
        
        // Save contact name mapping
        const contactNames = JSON.parse(localStorage.getItem('smsContactNames') || '{}');
        contactNames[phoneNumber] = newName;
        localStorage.setItem('smsContactNames', JSON.stringify(contactNames));
        
        // Refresh the conversations list
        refreshSMSTab(phoneId);
        
        showNotification('Contact name updated', 'success');
    }
}

// Open SMS conversation
function openSMSConversation(phoneNumber, name, phoneId) {
    const messages = JSON.parse(localStorage.getItem('smsMessages') || '[]');
    const convMessages = messages.filter(msg => msg.phoneNumber === phoneNumber);
    
    // Mark messages as read
    messages.forEach(msg => {
        if (msg.phoneNumber === phoneNumber && msg.direction === 'inbound') {
            msg.read = true;
        }
    });
    localStorage.setItem('smsMessages', JSON.stringify(messages));
    
    // Update UI
    const header = document.getElementById(`${phoneId}-sms-header`);
    const messagesDiv = document.getElementById(`${phoneId}-sms-messages`);
    const phoneInput = document.getElementById(`${phoneId}-phone-input`);
    const messageInput = document.getElementById(`${phoneId}-message-input`);
    const sendBtn = document.getElementById(`${phoneId}-send-btn`);
    
    if (header) {
        header.style.display = 'block';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span id="${phoneId}-contact-name" style="font-weight: 600; font-size: 16px;">${name}</span>
                        <button onclick="editContactName('${phoneNumber}', '${phoneId}')" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 2px;">
                            <i class="fas fa-pencil-alt" style="font-size: 12px;"></i>
                        </button>
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">${phoneNumber}</div>
                </div>
            </div>
        `;
    }
    
    if (messagesDiv) {
        messagesDiv.innerHTML = convMessages.map(msg => `
            <div style="margin-bottom: 10px; display: flex; justify-content: ${msg.direction === 'outbound' ? 'flex-end' : 'flex-start'};">
                <div style="max-width: 70%; padding: 8px 12px; border-radius: 12px; background: ${msg.direction === 'outbound' ? '#0066cc' : '#e5e7eb'}; color: ${msg.direction === 'outbound' ? 'white' : '#111827'};">
                    <div>${msg.body}</div>
                    <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">${formatCallTime(new Date(msg.timestamp))}</div>
                </div>
            </div>
        `).join('');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    if (phoneInput) {
        phoneInput.value = phoneNumber;
        phoneInput.style.display = 'none';
    }
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.focus();
    }
    
    if (sendBtn) {
        sendBtn.disabled = false;
    }
    
    // Store current conversation
    window.currentSMSConversation = { phoneNumber, name };
}

// Send SMS
async function sendSMS(phoneId) {
    const phoneInput = document.getElementById(`${phoneId}-phone-input`);
    const messageInput = document.getElementById(`${phoneId}-message-input`);
    const messagesDiv = document.getElementById(`${phoneId}-sms-messages`);
    
    let phoneNumber = window.currentSMSConversation?.phoneNumber || phoneInput.value;
    const message = messageInput.value.trim();
    
    if (!phoneNumber || !message) {
        showNotification('Please enter phone number and message', 'error');
        return;
    }
    
    // Format phone number
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
    
    // Get sender number
    const callerSelect = document.getElementById(`${phoneId}-caller-select`);
    const fromNumber = callerSelect?.value || '+12164282605';
    
    try {
        console.log('Attempting to send SMS:');
        console.log('  From:', fromNumber);
        console.log('  To:', e164Number);
        console.log('  Message:', message);
        
        // Send via Telnyx API
        const response = await fetch('https://api.telnyx.com/v2/messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY_HERE',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromNumber,
                to: e164Number,
                text: message,
                messaging_profile_id: '40017cc0-7367-482f-9f61-d8c01e5e6b7b'  // Add messaging profile ID
            })
        });
        
        const data = await response.json();
        console.log('Telnyx API Response:', response.status, data);
        
        if (response.ok) {
            // Save to localStorage
            const smsMessages = JSON.parse(localStorage.getItem('smsMessages') || '[]');
            const newMessage = {
                id: Date.now(),
                phoneNumber: e164Number,
                name: getContactName(e164Number),
                body: message,
                direction: 'outbound',
                timestamp: new Date().toISOString(),
                read: true,
                messageId: data.data?.id
            };
            smsMessages.push(newMessage);
            localStorage.setItem('smsMessages', JSON.stringify(smsMessages));
            console.log('Saved message to localStorage. Total messages now:', smsMessages.length);
            console.log('New message:', newMessage);
            
            // Update UI
            if (messagesDiv) {
                messagesDiv.innerHTML += `
                    <div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
                        <div style="max-width: 70%; padding: 8px 12px; border-radius: 12px; background: #0066cc; color: white;">
                            <div>${message}</div>
                            <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Just now</div>
                        </div>
                    </div>
                `;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
            
            // Clear input
            messageInput.value = '';
            showNotification('Message sent', 'success');
            
            // Update conversation list
            refreshSMSTab(phoneId);
            
            // If this was a new conversation, open it
            if (!window.currentSMSConversation) {
                openSMSConversation(e164Number, getContactName(e164Number), phoneId);
            }
        } else {
            console.error('SMS Send Failed:', data);
            const errorMsg = data.errors?.[0]?.detail || data.errors?.[0]?.title || 'Unknown error';
            showNotification('Failed to send message: ' + errorMsg, 'error');
            
            // Log detailed error info
            if (data.errors) {
                data.errors.forEach(err => {
                    console.error('Error:', err);
                });
            }
        }
    } catch (error) {
        console.error('SMS error:', error);
        showNotification('Failed to send message: ' + error.message, 'error');
    }
}

// Helper function to refresh SMS tab with a specific element
function refreshSMSTabWithElement(conversationsList) {
    const conversations = getSMSConversations();
    console.log('Refreshing element with', conversations.length, 'conversations');
    
    // Extract phoneId from the element's ID
    const phoneId = conversationsList.id.replace('-conversations-list', '');
    
    conversationsList.innerHTML = conversations.length === 0 ? `
        <div style="padding: 20px; text-align: center; color: #6b7280;">
            <i class="fas fa-sms" style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;"></i>
            <div style="font-size: 14px;">No conversations</div>
            <div style="font-size: 12px; margin-top: 5px;">Send a message to start</div>
        </div>
    ` : conversations.map(conv => `
        <div class="contact-item" onclick="openSMSConversation('${conv.phoneNumber}', '${conv.name}', '${phoneId}')">
            <div style="flex: 1;">
                <div style="font-weight: ${conv.unread > 0 ? '600' : '400'};">${conv.name}</div>
                <div style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${conv.lastMessage}
                </div>
            </div>
            ${conv.unread > 0 ? `
                <span style="background: #3b82f6; color: white; border-radius: 10px; padding: 2px 6px; font-size: 11px;">
                    ${conv.unread}
                </span>
            ` : ''}
        </div>
    `).join('');
}

// Refresh SMS tab
function refreshSMSTab(phoneId) {
    console.log('Refreshing SMS tab with phoneId:', phoneId);
    
    // Find the conversations list element by ID
    const conversationsList = document.getElementById(`${phoneId}-conversations-list`);
    console.log('Found conversations list element:', !!conversationsList);
    
    // If not found, try to find any conversations list (in case phoneId doesn't match)
    if (!conversationsList) {
        const allConversationLists = document.querySelectorAll('[id$="-conversations-list"]');
        console.log('Found', allConversationLists.length, 'conversation list elements on page');
        if (allConversationLists.length > 0) {
            console.log('Using first found conversations list');
            const firstList = allConversationLists[0];
            refreshSMSTabWithElement(firstList);
            return;
        }
    }
    
    if (conversationsList) {
        // Get updated conversations
        const conversations = getSMSConversations();
        console.log('Got conversations:', conversations.length, 'conversations');
        
        // Update conversations list
        conversationsList.innerHTML = conversations.length === 0 ? `
            <div style="padding: 20px; text-align: center; color: #6b7280;">
                <i class="fas fa-sms" style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;"></i>
                <div style="font-size: 14px;">No conversations</div>
                <div style="font-size: 12px; margin-top: 5px;">Send a message to start</div>
            </div>
        ` : conversations.map(conv => `
            <div class="contact-item" onclick="openSMSConversation('${conv.phoneNumber}', '${conv.name}', '${phoneId}')">
                <div style="flex: 1;">
                    <div style="font-weight: ${conv.unread > 0 ? '600' : '400'};">${conv.name}</div>
                    <div style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${conv.lastMessage}
                    </div>
                </div>
                ${conv.unread > 0 ? `
                    <span style="background: #3b82f6; color: white; border-radius: 10px; padding: 2px 6px; font-size: 11px;">
                        ${conv.unread}
                    </span>
                ` : ''}
            </div>
        `).join('');
    }
}

// Enable SMS input when phone number is entered
function enableSMSInput(phoneId) {
    const phoneInput = document.getElementById(`${phoneId}-phone-input`);
    const messageInput = document.getElementById(`${phoneId}-message-input`);
    const sendBtn = document.getElementById(`${phoneId}-send-btn`);
    
    if (phoneInput && phoneInput.value.length >= 10) {
        if (messageInput) messageInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
    }
}

// Save call to history
function saveCallToHistory(callData) {
    const callHistory = JSON.parse(localStorage.getItem('callHistory') || '[]');
    
    // Add the new call to the beginning
    callHistory.unshift({
        ...callData,
        id: Date.now(),
        formattedTime: formatCallTime(new Date(callData.time))
    });
    
    // Keep only last 100 calls
    if (callHistory.length > 100) {
        callHistory.length = 100;
    }
    
    localStorage.setItem('callHistory', JSON.stringify(callHistory));
}

// Update call duration after call ends
function updateCallDuration(callId, durationInSeconds) {
    const callHistory = JSON.parse(localStorage.getItem('callHistory') || '[]');
    
    const callIndex = callHistory.findIndex(call => call.callId === callId);
    if (callIndex !== -1) {
        const mins = Math.floor(durationInSeconds / 60);
        const secs = durationInSeconds % 60;
        callHistory[callIndex].duration = `${mins}:${secs.toString().padStart(2, '0')}`;
        localStorage.setItem('callHistory', JSON.stringify(callHistory));
    }
}

// Get contact name from phone number
function getContactName(phoneNumber) {
    // Check saved contact names first
    const contactNames = JSON.parse(localStorage.getItem('smsContactNames') || '{}');
    if (contactNames[phoneNumber]) {
        return contactNames[phoneNumber];
    }
    
    // Check if it's in leads
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.phone?.includes(phoneNumber.replace(/\D/g, '').slice(-10)));
    if (lead) return lead.name || lead.contact;
    
    // Check if it's in clients
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const client = clients.find(c => c.phone?.includes(phoneNumber.replace(/\D/g, '').slice(-10)));
    if (client) return client.name;
    
    // Return formatted number if no name found
    return phoneNumber;
}

// Format call time for display
function formatCallTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
}

// Show audio indicator
function showAudioIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'audioIndicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: pulse 2s infinite;
    `;
    indicator.innerHTML = `
        <i class="fas fa-microphone"></i>
        <span>Microphone Active</span>
    `;
    document.body.appendChild(indicator);
    
    // Remove after 5 seconds
    setTimeout(() => {
        indicator.remove();
    }, 5000);
}

// DEPRECATED FUNCTIONS - Removed to prevent duplicate call screens
// The old showCallScreen, endCall, and toggle functions have been removed
// We now use showCallControls and related functions instead

function toggleHoldOld(btn) {
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (icon.classList.contains('fa-pause')) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        span.textContent = 'Resume';
        btn.style.background = '#f59e0b';
    } else {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        span.textContent = 'Hold';
        btn.style.background = 'rgba(255,255,255,0.2)';
    }
}

function showDialpad(phoneId) {
    alert('Opening in-call dialpad...');
}

function addCall() {
    alert('Adding another call...');
}

function transferCall() {
    alert('Transfer call to...');
}

function getLetters(num) {
    const letters = {
        2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL',
        6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ'
    };
    return letters[num] || '';
}

function playRecording(name, duration) {
    alert(`Playing recording from ${name} (${duration})`);
}

function playVoicemail(index) {
    alert(`Playing voicemail #${index + 1}`);
}

function searchContacts(input) {
    const searchTerm = input.value.toLowerCase();
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

// Removed duplicate openSMSConversation function - using the real one above

function backToSMSList(phoneId) {
    const content = document.getElementById(phoneId + '-content');
    content.innerHTML = generateSMSTab(phoneId);
}

function openSMSFromContact(name, phoneNumber, phoneId) {
    // Switch to SMS tab
    const tabs = document.querySelectorAll('.phone-tab');
    if (tabs.length >= 3) {
        tabs[2].click(); // SMS is the 3rd tab
        // Open the conversation after a brief delay to allow tab switch
        setTimeout(() => openSMSConversation(phoneNumber, name, phoneId), 100);
    }
}

function openEmailTool(emailAddress = null) {
    const windowId = 'email-window-' + Date.now();
    const content = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <!-- Email Toolbar -->
            <div style="padding: 10px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <button onclick="showComposeEmail('${windowId}')" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-edit"></i> Compose
                </button>
                <button onclick="refreshInbox('${windowId}')" style="padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-sync"></i> Refresh
                </button>
                <input type="text" placeholder="Search emails..." onkeyup="searchEmails(this, '${windowId}')" 
                       style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; width: 200px; float: right;">
            </div>
            
            <!-- Email Layout -->
            <div style="flex: 1; display: flex; overflow: hidden;">
                <!-- Sidebar -->
                <div style="width: 200px; background: #f9fafb; border-right: 1px solid #e5e7eb; padding: 10px;">
                    <div class="email-folders">
                        <div onclick="filterEmails('inbox', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder active">
                            <i class="fas fa-inbox"></i> Inbox <span style="float: right; background: #ef4444; color: white; border-radius: 10px; padding: 2px 6px; font-size: 11px;">3</span>
                        </div>
                        <div onclick="filterEmails('sent', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                            <i class="fas fa-paper-plane"></i> Sent
                        </div>
                        <div onclick="filterEmails('drafts', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                            <i class="fas fa-file-alt"></i> Drafts
                        </div>
                        <div onclick="filterEmails('trash', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                            <i class="fas fa-trash"></i> Trash
                        </div>
                        <div onclick="filterEmails('spam', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                            <i class="fas fa-exclamation-triangle"></i> Spam
                        </div>
                    </div>
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">LABELS</div>
                    <div onclick="filterEmails('important', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                        <span style="color: #f59e0b;">●</span> Important
                    </div>
                    <div onclick="filterEmails('work', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                        <span style="color: #3b82f6;">●</span> Work
                    </div>
                    <div onclick="filterEmails('personal', '${windowId}')" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;" class="email-folder">
                        <span style="color: #10b981;">●</span> Personal
                    </div>
                </div>
                
                <!-- Email List -->
                <div id="${windowId}-email-list" style="width: 350px; background: white; border-right: 1px solid #e5e7eb; overflow-y: auto;">
                    ${generateEmailList()}
                </div>
                
                <!-- Email Content -->
                <div id="${windowId}-email-content" style="flex: 1; background: white; padding: 0; overflow-y: auto;">
                    ${emailAddress ? generateComposeView(windowId, emailAddress) : `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">
                            <div style="text-align: center;">
                                <i class="fas fa-envelope-open" style="font-size: 48px; margin-bottom: 10px;"></i>
                                <p>Select an email to read</p>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    createToolWindow('Email', 'fa-envelope', content, 900, 600);
    
    // Add custom styles for email folders
    const style = document.createElement('style');
    style.textContent = `
        .email-folder:hover { background: #e5e7eb !important; }
        .email-folder.active { background: #dbeafe !important; color: #0066cc; }
        .email-item { padding: 12px; border-bottom: 1px solid #e5e7eb; cursor: pointer; }
        .email-item:hover { background: #f9fafb; }
        .email-item.unread { background: #f0f9ff; font-weight: 600; }
        .email-item.selected { background: #dbeafe; }
    `;
    document.head.appendChild(style);
}

// Generate sample email list
function generateEmailList() {
    const emails = [
        { from: 'John Smith', subject: 'Quote Request - Commercial Auto', time: '10:30 AM', unread: true, preview: 'Hi, I need a quote for 5 trucks...' },
        { from: 'Progressive', subject: 'New Rate Changes', time: '9:15 AM', unread: true, preview: 'Important updates to your commercial rates...' },
        { from: 'Sarah Johnson', subject: 'Re: Policy Renewal', time: 'Yesterday', unread: false, preview: 'Thank you for the renewal information...' },
        { from: 'State Farm', subject: 'Commission Statement', time: 'Yesterday', unread: false, preview: 'Your monthly commission statement is ready...' },
        { from: 'Mike Davis', subject: 'Claim Update', time: 'Dec 3', unread: false, preview: 'The claim has been processed and...' },
        { from: 'Nationwide', subject: 'Training Webinar Tomorrow', time: 'Dec 3', unread: true, preview: 'Join us for our monthly training...' }
    ];
    
    return emails.map((email, index) => `
        <div class="email-item ${email.unread ? 'unread' : ''}" onclick="showEmail(${index}, '${email.from}', '${email.subject}', '${email.time}', '${email.preview}', this)">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <input type="checkbox" style="margin-right: 10px;" onclick="event.stopPropagation()">
                <div style="flex: 1;">
                    <div style="font-size: 14px; ${email.unread ? 'font-weight: 600;' : ''}">${email.from}</div>
                    <div style="font-size: 12px; color: #6b7280; text-align: right;">${email.time}</div>
                </div>
            </div>
            <div style="font-size: 13px; ${email.unread ? 'font-weight: 500;' : ''} margin-bottom: 4px;">${email.subject}</div>
            <div style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${email.preview}</div>
        </div>
    `).join('');
}

// Show selected email
function showEmail(index, from, subject, time, preview, element) {
    // Update selection
    document.querySelectorAll('.email-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    element.classList.remove('unread');
    
    // Find the email content area
    const contentArea = element.closest('.tool-window').querySelector('[id$="-email-content"]');
    
    contentArea.innerHTML = `
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="font-size: 24px; margin-bottom: 10px;">${subject}</h2>
            <div style="display: flex; align-items: center; gap: 15px; color: #6b7280; font-size: 14px;">
                <div><strong>From:</strong> ${from} &lt;${from.toLowerCase().replace(' ', '.')}@example.com&gt;</div>
                <div><strong>Date:</strong> ${time}</div>
            </div>
            <div style="margin-top: 15px;">
                <button onclick="replyToEmail('${from}', '${subject}')" style="padding: 6px 12px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <button style="padding: 6px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                    <i class="fas fa-reply-all"></i> Reply All
                </button>
                <button style="padding: 6px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                    <i class="fas fa-share"></i> Forward
                </button>
                <button style="padding: 6px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button style="padding: 6px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-print"></i> Print
                </button>
            </div>
        </div>
        <div style="line-height: 1.6; color: #374151;">
            <p>Dear Insurance Team,</p>
            <br>
            <p>${preview} We are looking to update our commercial auto insurance policy and would like to explore better coverage options.</p>
            <br>
            <p>Our fleet consists of:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>3 Box trucks (2020-2022 models)</li>
                <li>2 Cargo vans (2021 models)</li>
                <li>All vehicles operate within state limits</li>
                <li>Clean driving records for all operators</li>
            </ul>
            <br>
            <p>Please provide a comprehensive quote including liability, collision, and comprehensive coverage. We're also interested in any fleet discounts you may offer.</p>
            <br>
            <p>Best regards,<br>${from}</p>
        </div>
    `;
}

// Generate compose view
function generateComposeView(windowId, emailAddress = '') {
    return `
        <div style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin-bottom: 20px; color: #111827; font-weight: 600;">Compose New Email</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6b7280;">To:</label>
                <input type="email" id="${windowId}-to" placeholder="recipient@example.com" value="${emailAddress}" 
                       style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6b7280;">Cc:</label>
                <input type="email" id="${windowId}-cc" placeholder="carbon copy recipients (optional)" 
                       style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6b7280;">Subject:</label>
                <input type="text" id="${windowId}-subject" placeholder="Enter email subject" 
                       style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="flex: 1; margin-bottom: 15px; display: flex; flex-direction: column;">
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6b7280;">Message:</label>
                <textarea id="${windowId}-message" placeholder="Type your message here..." 
                          style="flex: 1; width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; resize: vertical; font-size: 14px; font-family: 'Inter', sans-serif; min-height: 200px;"></textarea>
            </div>
            <div style="display: flex; gap: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <button onclick="sendEmail('${windowId}')" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-paper-plane"></i> Send
                </button>
                <button onclick="attachFile('${windowId}')" style="padding: 10px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-paperclip"></i> Attach File
                </button>
                <button onclick="saveDraft('${windowId}')" style="padding: 10px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-save"></i> Save Draft
                </button>
                <button onclick="insertTemplate('${windowId}')" style="padding: 10px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-file-alt"></i> Templates
                </button>
                <div style="flex: 1;"></div>
                <button onclick="discardDraft('${windowId}')" style="padding: 10px 20px; background: white; border: 1px solid #ef4444; color: #ef4444; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Discard
                </button>
            </div>
        </div>
    `;
}

// Show compose email interface
function showComposeEmail(windowId) {
    console.log('showComposeEmail called with windowId:', windowId);
    
    // The windowId is already in the format "email-window-XXX"
    // The content area ID is windowId + "-email-content"
    const contentArea = document.getElementById(`${windowId}-email-content`);
    
    if (contentArea) {
        console.log('Found content area, showing compose view');
        contentArea.innerHTML = generateComposeView(windowId);
        
        // Focus on the appropriate field after a short delay to ensure DOM is ready
        setTimeout(() => {
            const toField = document.getElementById(`${windowId}-to`);
            const subjectField = document.getElementById(`${windowId}-subject`);
            
            if (toField && toField.value) {
                // If To is already filled, focus on subject
                subjectField && subjectField.focus();
            } else if (toField) {
                // Otherwise focus on To field
                toField.focus();
            }
        }, 100);
    } else {
        console.error('Could not find email content area for windowId:', windowId);
    }
}

// Reply to email
function replyToEmail(from, subject) {
    const replyWindow = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 20px;">Reply to ${from}</h3>
            <div style="margin-bottom: 15px;">
                <input type="email" value="To: ${from.toLowerCase().replace(' ', '.')}@example.com" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb;" readonly>
            </div>
            <div style="margin-bottom: 15px;">
                <input type="text" value="Re: ${subject}" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <textarea placeholder="Type your reply..." style="width: 100%; height: 300px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; resize: vertical;"></textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <button style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i> Send Reply
                </button>
                <button style="padding: 10px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    createToolWindow('Reply', 'fa-reply', replyWindow, 600, 500);
}

// Filter emails by folder/label
function filterEmails(folder, windowId) {
    console.log('Filtering emails by:', folder, 'for window:', windowId);
    
    // Update active folder
    const folders = document.querySelectorAll('.email-folder');
    folders.forEach(f => f.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('.email-folder').classList.add('active');
    }
    
    // Get the content area
    const contentArea = document.getElementById(`${windowId}-email-content`);
    
    if (contentArea) {
        // Show different content based on folder
        if (folder === 'inbox') {
            contentArea.innerHTML = `
                <div style="padding: 20px;">
                    <h3 style="margin-bottom: 20px;">Inbox</h3>
                    <div class="email-list">
                        ${generateEmailList()}
                    </div>
                </div>
            `;
        } else if (folder === 'sent') {
            contentArea.innerHTML = `
                <div style="padding: 20px;">
                    <h3 style="margin-bottom: 20px;">Sent Messages</h3>
                    <div style="color: #6b7280;">
                        <p>No sent messages yet.</p>
                        <button onclick="showComposeEmail('${windowId}')" style="margin-top: 10px; padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-edit"></i> Compose Email
                        </button>
                    </div>
                </div>
            `;
        } else if (folder === 'drafts') {
            contentArea.innerHTML = `
                <div style="padding: 20px;">
                    <h3 style="margin-bottom: 20px;">Drafts</h3>
                    <div style="color: #6b7280;">
                        <p>No draft messages.</p>
                        <button onclick="showComposeEmail('${windowId}')" style="margin-top: 10px; padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-edit"></i> Start New Draft
                        </button>
                    </div>
                </div>
            `;
        } else {
            contentArea.innerHTML = `
                <div style="padding: 20px;">
                    <h3 style="margin-bottom: 20px;">${folder.charAt(0).toUpperCase() + folder.slice(1)}</h3>
                    <div style="color: #6b7280;">
                        <p>No messages in ${folder}.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Search emails
function searchEmails(input, windowId) {
    const searchTerm = input.value.toLowerCase();
    const emailItems = document.querySelectorAll('.email-item');
    
    emailItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Refresh inbox
function refreshInbox(windowId) {
    console.log('Refreshing inbox...');
    // Add spinning animation to refresh button
    event.target.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing...';
    setTimeout(() => {
        event.target.innerHTML = '<i class="fas fa-sync"></i> Refresh';
    }, 1000);
}

function openNotepad() {
    const savedContent = localStorage.getItem('notepad_content') || '';
    const content = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                <button onclick="saveNotepadContent(this)" style="padding: 6px 12px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-save"></i> Save
                </button>
                <button onclick="clearNotepad(this)" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-eraser"></i> Clear
                </button>
            </div>
            <textarea id="notepad-content" 
                      style="flex: 1; width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-family: 'Courier New', monospace; resize: none;"
                      placeholder="Start typing your notes here...">${savedContent}</textarea>
        </div>
    `;
    createToolWindow('Notepad', 'fa-sticky-note', content, 600, 400);
}

function saveNotepadContent(btn) {
    const textarea = btn.closest('.tool-window').querySelector('#notepad-content');
    if (textarea) {
        localStorage.setItem('notepad_content', textarea.value);
        // Show save confirmation
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#0066cc';
        }, 2000);
    }
}

function clearNotepad(btn) {
    const textarea = btn.closest('.tool-window').querySelector('#notepad-content');
    if (textarea && confirm('Clear all notes?')) {
        textarea.value = '';
        localStorage.removeItem('notepad_content');
    }
}

// Email helper functions
function sendEmail(windowId) {
    const to = document.getElementById(`${windowId}-to`).value;
    const cc = document.getElementById(`${windowId}-cc`).value;
    const subject = document.getElementById(`${windowId}-subject`).value;
    const message = document.getElementById(`${windowId}-message`).value;
    
    if (!to) {
        alert('Please enter a recipient email address');
        return;
    }
    
    if (!subject) {
        alert('Please enter a subject');
        return;
    }
    
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    // Show success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> Email sent to ${to}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    
    // Clear the form
    document.getElementById(`${windowId}-to`).value = '';
    document.getElementById(`${windowId}-cc`).value = '';
    document.getElementById(`${windowId}-subject`).value = '';
    document.getElementById(`${windowId}-message`).value = '';
    
    console.log('Email sent:', { to, cc, subject, message });
}

function attachFile(windowId) {
    alert('File attachment dialog would open here');
}

function saveDraft(windowId) {
    const to = document.getElementById(`${windowId}-to`).value;
    const subject = document.getElementById(`${windowId}-subject`).value;
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
    `;
    notification.innerHTML = `<i class="fas fa-save"></i> Draft saved`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function insertTemplate(windowId) {
    const templates = [
        { name: 'Quote Follow-up', text: 'Hello,\n\nI wanted to follow up on the insurance quote we discussed. Please let me know if you have any questions or if you\'d like to proceed with the coverage.\n\nBest regards' },
        { name: 'Policy Renewal', text: 'Dear [Client Name],\n\nYour insurance policy is due for renewal on [Date]. Please review the attached renewal documents and let us know if you\'d like to make any changes to your coverage.\n\nThank you' },
        { name: 'Welcome', text: 'Welcome to Vanguard Insurance!\n\nThank you for choosing us for your insurance needs. Your policy documents are attached. Please don\'t hesitate to reach out if you have any questions.\n\nBest regards' }
    ];
    
    const selected = prompt('Select template:\n1. Quote Follow-up\n2. Policy Renewal\n3. Welcome\n\nEnter number:');
    if (selected && templates[selected - 1]) {
        const messageField = document.getElementById(`${windowId}-message`);
        if (messageField) {
            messageField.value = templates[selected - 1].text;
        }
    }
}

function discardDraft(windowId) {
    if (confirm('Are you sure you want to discard this email?')) {
        // Clear all fields
        document.getElementById(`${windowId}-to`).value = '';
        document.getElementById(`${windowId}-cc`).value = '';
        document.getElementById(`${windowId}-subject`).value = '';
        document.getElementById(`${windowId}-message`).value = '';
        
        // Show the inbox view
        const contentArea = document.getElementById(windowId.replace('email-window', 'tool-window') + '-email-content');
        if (contentArea) {
            contentArea.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">
                    <div style="text-align: center;">
                        <i class="fas fa-envelope-open" style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>Select an email to read</p>
                    </div>
                </div>
            `;
        }
    }
}

// SIP Configuration Functions
let sipClient = null;

function saveSIPConfig(phoneId) {
    const config = {
        username: document.getElementById(`${phoneId}-sip-username`).value,
        password: document.getElementById(`${phoneId}-sip-password`).value,
        domain: document.getElementById(`${phoneId}-sip-domain`).value,
        proxy: document.getElementById(`${phoneId}-sip-proxy`).value,
        callerId: document.getElementById(`${phoneId}-sip-callerid`).value
    };

    // Validate required fields
    if (!config.username || !config.password || !config.domain) {
        showSIPStatus(phoneId, 'error', 'Please fill in all required fields (Username, Password, Domain)');
        return;
    }

    // Save to localStorage
    localStorage.setItem('sipConfig', JSON.stringify(config));

    showSIPStatus(phoneId, 'success', 'Configuration saved successfully!');
    console.log('SIP Configuration saved:', { ...config, password: '[HIDDEN]' });
}

async function testSIPConnection(phoneId) {
    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    if (!config.username || !config.password || !config.domain) {
        showSIPStatus(phoneId, 'error', 'Please save your configuration first');
        return;
    }

    // Update button state
    const testBtn = document.getElementById(`${phoneId}-test-btn`);
    const originalText = testBtn.innerHTML;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    testBtn.disabled = true;

    try {
        // Show connecting status
        showConnectionStatus(phoneId, 'connecting', 'Attempting to connect to SIP server...');

        // Initialize SIP client using JsSIP library if available
        if (typeof JsSIP !== 'undefined') {
            // Configure JsSIP - Try the working domain first
            const workingDomain = config.domain.includes('us1') ? config.domain : 'vanguard1.sip.twilio.com';
            const socket = new JsSIP.WebSocketInterface(`wss://${workingDomain}:443`);
            const sipConfig = {
                sockets: [socket],
                uri: `sip:${config.username}@${workingDomain}`,
                password: config.password,
                display_name: config.username,
                register: true,
                register_expires: 300,
                session_timers: false,
                connection_recovery_min_interval: 2,
                connection_recovery_max_interval: 30,
                use_preloaded_route: false,
                authorization_user: config.username
            };

            if (config.proxy) {
                sipConfig.outbound_proxy_set = `sip:${config.proxy};transport=ws`;
            }

            sipClient = new JsSIP.UA(sipConfig);

            // Set up event handlers
            sipClient.on('connecting', () => {
                showConnectionStatus(phoneId, 'connecting', 'Connecting to SIP server...');
            });

            sipClient.on('connected', () => {
                showConnectionStatus(phoneId, 'connected', `Connected to ${config.domain}`);
                showSIPStatus(phoneId, 'success', 'SIP connection established successfully!');
            });

            sipClient.on('disconnected', () => {
                showConnectionStatus(phoneId, 'disconnected', 'Disconnected from SIP server');
            });

            sipClient.on('registered', () => {
                showConnectionStatus(phoneId, 'registered', `Registered as ${config.username}@${config.domain}`);
                showSIPStatus(phoneId, 'success', 'SIP registration successful! You can now make calls.');
            });

            sipClient.on('unregistered', () => {
                showConnectionStatus(phoneId, 'disconnected', 'Unregistered from SIP server');
            });

            sipClient.on('registrationFailed', (e) => {
                showConnectionStatus(phoneId, 'error', `Registration failed: ${e.cause || 'Unknown error'}`);
                showSIPStatus(phoneId, 'error', `Registration failed: ${e.cause || 'Authentication error'}`);
            });

            // Start the client
            sipClient.start();

            // Set timeout for connection attempt
            setTimeout(() => {
                if (sipClient && sipClient.isConnected() === false) {
                    showConnectionStatus(phoneId, 'error', 'Connection timeout - check your settings');
                    showSIPStatus(phoneId, 'error', 'Connection timeout. Please verify your SIP settings.');
                }
            }, 10000);

        } else {
            // Fallback: Basic connectivity test using fetch to check if domain is reachable
            console.log('JsSIP not available, performing basic connectivity test...');

            // Try to resolve the domain
            try {
                // Simple connectivity test by trying to fetch from the domain
                const response = await fetch(`https://${config.domain}`, {
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(5000)
                });

                showConnectionStatus(phoneId, 'info', `Domain ${config.domain} is reachable`);
                showSIPStatus(phoneId, 'info', 'Basic connectivity test passed. Install JsSIP library for full SIP functionality.');
            } catch (error) {
                showConnectionStatus(phoneId, 'warning', `Could not verify connectivity to ${config.domain}`);
                showSIPStatus(phoneId, 'warning', 'Domain connectivity test failed. SIP functionality requires JsSIP library.');
            }
        }

    } catch (error) {
        console.error('SIP connection test failed:', error);
        showConnectionStatus(phoneId, 'error', `Connection failed: ${error.message}`);
        showSIPStatus(phoneId, 'error', `Connection test failed: ${error.message}`);
    } finally {
        // Restore button state
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
    }
}

function showSIPStatus(phoneId, type, message) {
    const statusDiv = document.getElementById(`${phoneId}-sip-status`);
    if (!statusDiv) return;

    const colors = {
        success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: 'check-circle' },
        error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: 'exclamation-triangle' },
        warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: 'exclamation-circle' },
        info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'info-circle' }
    };

    const style = colors[type] || colors.info;

    statusDiv.style.display = 'block';
    statusDiv.style.background = style.bg;
    statusDiv.style.border = `1px solid ${style.border}`;
    statusDiv.style.color = style.text;
    statusDiv.innerHTML = `<i class="fas fa-${style.icon}"></i> ${message}`;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function showConnectionStatus(phoneId, type, message) {
    const statusDiv = document.getElementById(`${phoneId}-connection-status`);
    if (!statusDiv) return;

    const colors = {
        connected: { bg: '#d1fae5', text: '#065f46', icon: 'check-circle' },
        registered: { bg: '#d1fae5', text: '#065f46', icon: 'user-check' },
        connecting: { bg: '#fef3c7', text: '#92400e', icon: 'spinner fa-spin' },
        disconnected: { bg: '#fee2e2', text: '#991b1b', icon: 'times-circle' },
        error: { bg: '#fee2e2', text: '#991b1b', icon: 'exclamation-triangle' },
        info: { bg: '#dbeafe', text: '#1e40af', icon: 'info-circle' },
        warning: { bg: '#fef3c7', text: '#92400e', icon: 'exclamation-circle' }
    };

    const style = colors[type] || colors.info;

    statusDiv.style.background = style.bg;
    statusDiv.style.color = style.text;
    statusDiv.innerHTML = `<i class="fas fa-${style.icon}"></i> ${message}`;
}

// SIP Calling Function
async function makeSIPCall(phoneNumber, callerName = 'Unknown') {
    console.log('===== SIP CALL INITIATED =====');
    console.log('Phone number:', phoneNumber);
    console.log('Caller name:', callerName);

    // Prevent duplicate calls
    if (window.currentSIPSession || window.currentTwilioCallSid) {
        console.log('⚠️ Call already in progress, ignoring duplicate request');
        return false;
    }

    const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    if (!sipConfig.username || !sipConfig.password || !sipConfig.domain) {
        console.error('❌ SIP configuration incomplete');
        showNotification('SIP not configured. Please configure SIP in phone settings.', 'error');
        return false;
    }

    try {
        // Initialize or reuse existing SIP client
        if (!sipClient || !sipClient.isConnected()) {
            console.log('🔧 Initializing SIP client...');

            const workingDomain = sipConfig.domain.includes('us1') ? sipConfig.domain : 'vanguard1.sip.twilio.com';

            console.log(`🔗 Connecting to: wss://${workingDomain}:443`);

            // Create WebSocket interface properly
            const socket = new JsSIP.WebSocketInterface(`wss://${workingDomain}:443`);

            const sipClientConfig = {
                sockets: [socket],
                uri: `sip:${sipConfig.username}@${workingDomain}`,
                password: sipConfig.password,
                display_name: sipConfig.username,
                register: true,
                register_expires: 600,
                session_timers: false,
                connection_recovery_min_interval: 2,
                connection_recovery_max_interval: 30,
                use_preloaded_route: false,
                authorization_user: sipConfig.username,
                no_answer_timeout: 60
            };

            if (sipConfig.proxy) {
                sipClientConfig.outbound_proxy_set = `sip:${sipConfig.proxy};transport=ws`;
            }

            sipClient = new JsSIP.UA(sipClientConfig);

            // Set up comprehensive event handlers
            sipClient.on('connecting', () => {
                console.log('🔗 SIP connecting...');
            });

            sipClient.on('connected', () => {
                console.log('✅ SIP WebSocket connected');
            });

            sipClient.on('disconnected', () => {
                console.log('❌ SIP WebSocket disconnected');
            });

            sipClient.on('registered', () => {
                console.log('🎉 SIP REGISTERED SUCCESSFULLY!');
                console.log(`📋 Registered as: ${sipConfig.username}@${workingDomain}`);
                showNotification('SIP registered - ready for calls!', 'success');
                performSIPCall(phoneNumber, sipConfig, workingDomain);
            });

            sipClient.on('unregistered', () => {
                console.log('⚠️ SIP unregistered');
            });

            sipClient.on('registrationFailed', (e) => {
                console.error('❌ SIP registration failed!');
                console.error('   Cause:', e.cause);
                console.error('   Response code:', e.response?.status_code);
                console.error('   Response reason:', e.response?.reason_phrase);

                let errorMsg = `SIP registration failed: ${e.cause}`;
                if (e.response?.status_code === 401) {
                    errorMsg = 'SIP authentication failed - check username/password';
                } else if (e.response?.status_code === 403) {
                    errorMsg = 'SIP forbidden - check account permissions';
                }

                showNotification(errorMsg, 'error');
            });

            // Start the client
            console.log('🚀 Starting SIP User Agent...');
            sipClient.start();

            // Set a shorter timeout and fallback to Voice API
            setTimeout(() => {
                if (sipClient && !sipClient.isRegistered()) {
                    console.warn('⏱️ SIP registration timeout after 5 seconds');
                    console.warn('   Falling back to Twilio Voice API...');
                    showNotification('SIP timeout - switching to Voice API', 'info');

                    // Stop the SIP client
                    sipClient.stop();

                    // Use Voice API instead
                    makeTwilioVoiceCall(phoneNumber, callerName);
                }
            }, 5000);

        } else {
            // SIP client already connected, make call immediately
            console.log('✅ Using existing SIP connection');
            const workingDomain = sipConfig.domain.includes('us1') ? sipConfig.domain : 'vanguard1.sip.twilio.com';
            performSIPCall(phoneNumber, sipConfig, workingDomain);
        }

        return true;

    } catch (error) {
        console.error('❌ SIP call failed:', error);
        showNotification(`SIP call failed: ${error.message}`, 'error');
        return false;
    }
}

function performSIPCall(phoneNumber, sipConfig, domain) {
    console.log('📞 Making SIP call...');

    // Format phone number for SIP calling
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
    const sipUri = `sip:${e164Number}@${domain}`;

    console.log(`Calling: ${sipUri}`);

    // Call options with media constraints
    const callOptions = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: {
            iceServers: [
                { urls: 'stun:stun.twilio.com:3478' },
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        },
        rtcOfferConstraints: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false
        }
    };

    try {
        // Make the call
        const session = sipClient.call(sipUri, callOptions);

        if (session) {
            console.log('✅ SIP call session created');
            setupSIPCallHandlers(session, phoneNumber);
            showNotification(`Calling ${phoneNumber} via SIP...`, 'info');

            // Show call control UI
            showCallControls(phoneNumber, 'SIP Call');
        } else {
            throw new Error('Failed to create SIP call session');
        }

    } catch (error) {
        console.error('❌ Failed to initiate SIP call:', error);
        showNotification(`Call failed: ${error.message}`, 'error');
    }
}

function setupSIPCallHandlers(session, phoneNumber) {
    session.on('progress', () => {
        console.log('📞 Call ringing...');
        showNotification('Call ringing...', 'info');
        updateCallStatus('ringing');
    });

    session.on('accepted', () => {
        console.log('✅ Call connected via SIP');
        showNotification('Call connected', 'success');
        updateCallStatus('connected');
    });

    session.on('ended', () => {
        console.log('📞 SIP call ended');
        showNotification('Call ended', 'info');
        hideCallControls();
    });

    session.on('failed', (e) => {
        console.error('❌ SIP call failed:', e);
        let errorMsg = 'Call failed';

        if (e.cause === 'Rejected') {
            errorMsg = 'Call rejected';
        } else if (e.cause === 'Busy') {
            errorMsg = 'Number is busy';
        } else if (e.cause === 'Request Timeout') {
            errorMsg = 'No answer';
        } else {
            errorMsg = `Call failed: ${e.cause}`;
        }

        showNotification(errorMsg, 'error');
        hideCallControls();
    });

    // Store current session for call control
    window.currentSIPSession = session;
}

function hangupSIPCall() {
    if (window.currentSIPSession) {
        console.log('🔴 Hanging up SIP call');
        window.currentSIPSession.terminate();
        window.currentSIPSession = null;
    }
}

// Twilio Voice API Calling Function
async function makeTwilioVoiceCall(phoneNumber, callerName = 'Unknown') {
    console.log('===== TWILIO VOICE API CALL INITIATED =====');
    console.log('Phone number:', phoneNumber);
    console.log('Caller name:', callerName);

    // Prevent duplicate calls
    if (window.currentSIPSession || window.currentTwilioCallSid) {
        console.log('⚠️ Voice API call already in progress, ignoring duplicate request');
        return false;
    }

    const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
    const callerId = sipConfig.callerId || '+13306369079';

    try {
        // Format phone number to E.164 format
        const formattedNumber = phoneNumber.replace(/\D/g, '');
        const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;

        console.log(`📞 Making Twilio Voice API call to ${e164Number}`);
        console.log(`📞 Using Caller ID: ${callerId}`);

        showNotification(`Calling ${phoneNumber} via Twilio Voice API...`, 'info');

        // Make the API call to existing backend
        const response = await fetch('http://162-220-14-239.nip.io:3001/api/twilio/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({
                to: e164Number,
                from: callerId,
                callerName: callerName
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log('✅ Call initiated successfully');
            console.log('Call SID:', result.callSid);

            showNotification(`Call initiated! Call SID: ${result.callSid}`, 'success');
            showCallControls(phoneNumber, `Twilio Voice Call - ${result.callSid}`, 'Calling');

            // Store call SID for potential hangup
            window.currentTwilioCallSid = result.callSid;

            // Start monitoring call status
            startCallStatusMonitoring(result.callSid);

        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }

    } catch (error) {
        console.error('❌ Twilio Voice API call failed:', error);

        let errorMessage = 'Call failed';
        if (error.message.includes('404')) {
            errorMessage = 'Twilio Voice API not configured on backend';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'Twilio authentication failed';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error - check connection';
        } else {
            errorMessage = `Call failed: ${error.message}`;
        }

        showNotification(errorMessage, 'error');

        // Fallback to original Telnyx API if Twilio fails
        console.log('🔄 Falling back to Telnyx API...');
        const callerSelect = document.querySelector('[id$="-caller-select"]');
        const fromNumber = callerSelect ? callerSelect.value : '+13303008092';
        makeTelnyxCallFromToolWindow(phoneNumber, fromNumber);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initTaskbar);