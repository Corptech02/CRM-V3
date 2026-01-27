// PERSISTENT Profile Completion Sync - Ensures profiles ALWAYS match data
console.log('🔒 PERSISTENT SYNC: Loading bulletproof profile completion sync system...');

// Global sync state tracking
window.ProfileCompletionSync = {
    syncedLeads: new Set(),
    isActive: false,
    checkInterval: null,

    // Configuration
    CHECK_INTERVAL: 1000, // Check every 1 second
    RETRY_ATTEMPTS: 3,

    // Start the persistent sync system
    start() {
        if (this.isActive) return;

        console.log('🔒 PERSISTENT SYNC: Starting continuous sync system...');
        this.isActive = true;

        // Start continuous checking
        this.checkInterval = setInterval(() => {
            this.syncAllVisibleProfiles();
        }, this.CHECK_INTERVAL);

        // Hook into all possible data change events
        this.hookIntoEvents();

        console.log('✅ PERSISTENT SYNC: System active - checking every', this.CHECK_INTERVAL + 'ms');
    },

    // Stop the sync system
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isActive = false;
        console.log('🛑 PERSISTENT SYNC: System stopped');
    },

    // Main sync function - checks all visible profiles
    syncAllVisibleProfiles() {
        try {
            // Only run if profile modal is open
            const profileModal = document.getElementById('lead-profile-container');
            if (!profileModal || profileModal.style.display === 'none') {
                return;
            }

            // Find all profile completion elements
            const completionElements = document.querySelectorAll('[id^="reach-out-completion-"]');

            completionElements.forEach(element => {
                const leadId = element.id.replace('reach-out-completion-', '');
                if (leadId && !this.syncedLeads.has(leadId)) {
                    this.syncLeadProfile(leadId);
                }
            });

        } catch (error) {
            console.warn('⚠️ PERSISTENT SYNC: Error in syncAllVisibleProfiles:', error);
        }
    },

    // Sync a specific lead profile with retry logic
    syncLeadProfile(leadId, attempt = 1) {
        try {
            console.log(`🔄 PERSISTENT SYNC: Syncing lead ${leadId} (attempt ${attempt})`);

            // Get fresh lead data
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead = leads.find(l => String(l.id) === String(leadId));

            if (!lead) {
                console.warn(`⚠️ PERSISTENT SYNC: Lead ${leadId} not found in data`);
                return false;
            }

            // Get DOM elements
            const elements = this.getProfileElements(leadId);
            if (!elements.isValid) {
                if (attempt < this.RETRY_ATTEMPTS) {
                    setTimeout(() => {
                        this.syncLeadProfile(leadId, attempt + 1);
                    }, 500 * attempt); // Progressive delay
                    return false;
                }
                console.warn(`⚠️ PERSISTENT SYNC: DOM elements not found for lead ${leadId} after ${attempt} attempts`);
                return false;
            }

            // Determine completion status
            const completionData = this.analyzeCompletionStatus(lead);

            // Apply the correct visual state
            this.applyCompletionState(elements, completionData, leadId);

            // Mark as synced
            this.syncedLeads.add(leadId);

            console.log(`✅ PERSISTENT SYNC: Lead ${leadId} synced successfully`, {
                shouldShow: completionData.shouldShow,
                hasActiveHighlight: completionData.hasActiveHighlight,
                timeRemaining: completionData.timeRemaining
            });

            return true;

        } catch (error) {
            console.error(`❌ PERSISTENT SYNC: Error syncing lead ${leadId}:`, error);
            return false;
        }
    },

    // Get all required DOM elements for a lead
    getProfileElements(leadId) {
        const elements = {
            header: document.getElementById(`reach-out-header-title-${leadId}`),
            todo: document.getElementById(`reach-out-todo-${leadId}`),
            completion: document.getElementById(`reach-out-completion-${leadId}`),
            separator: document.getElementById(`reach-out-separator-${leadId}`),
            timestamp: document.getElementById(`completion-timestamp-${leadId}`),
            countdown: document.getElementById(`highlight-countdown-${leadId}`)
        };

        elements.isValid = !!(elements.header && elements.todo && elements.completion);
        return elements;
    },

    // Analyze lead data to determine completion status
    analyzeCompletionStatus(lead) {
        const reachOut = lead.reachOut || {};

        // Check all completion indicators
        const hasCompletion = !!(reachOut.completedAt || reachOut.reachOutCompletedAt);
        const hasEmailConfirmed = reachOut.emailConfirmed === true;
        const hasConnectedCalls = (reachOut.callsConnected || 0) > 0;
        const hasTexts = (reachOut.textCount || 0) > 0;
        const hasHighlightDuration = !!reachOut.greenHighlightUntil;

        // Determine if should show completion
        const shouldShow = hasCompletion || hasEmailConfirmed || hasConnectedCalls || hasTexts;

        // Check if highlight is active
        let hasActiveHighlight = false;
        let timeRemaining = '';

        if (hasHighlightDuration) {
            try {
                const now = new Date();
                const expiry = new Date(reachOut.greenHighlightUntil);
                hasActiveHighlight = now < expiry;

                if (hasActiveHighlight) {
                    const diff = expiry - now;
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    if (days > 0) {
                        timeRemaining = `${days}d ${hours}h`;
                    } else if (hours > 0) {
                        timeRemaining = `${hours}h ${minutes}m`;
                    } else {
                        timeRemaining = `${minutes}m`;
                    }
                } else {
                    timeRemaining = 'EXPIRED';
                }
            } catch (e) {
                console.warn('Error calculating highlight time:', e);
                hasActiveHighlight = false;
            }
        }

        // Get completion timestamp
        const completionTime = reachOut.completedAt || reachOut.reachOutCompletedAt;
        let formattedTime = '';
        if (completionTime) {
            try {
                const date = new Date(completionTime);
                const options = {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                };
                formattedTime = date.toLocaleDateString('en-US', options);
            } catch (e) {
                formattedTime = 'Invalid Date';
            }
        }

        return {
            shouldShow,
            hasActiveHighlight,
            timeRemaining,
            formattedTime,
            // Debug info
            hasCompletion,
            hasEmailConfirmed,
            hasConnectedCalls,
            hasTexts,
            hasHighlightDuration
        };
    },

    // Apply the visual state to DOM elements
    applyCompletionState(elements, completionData, leadId) {
        if (completionData.shouldShow) {
            // SHOW COMPLETION STATE

            // Update header to green
            const headerSpan = elements.header.querySelector('span');
            if (headerSpan) {
                headerSpan.style.color = '#10b981';
                headerSpan.style.fontWeight = 'bold';
            }

            // Update TODO to COMPLETED
            elements.todo.innerHTML = '<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>';

            // Show completion section
            elements.completion.style.display = 'block';

            // Update separator to green
            if (elements.separator) {
                elements.separator.style.borderBottom = '2px solid #10b981';
            }

            // Update timestamp
            if (elements.timestamp && completionData.formattedTime) {
                elements.timestamp.textContent = completionData.formattedTime;
            }

            // Update countdown
            if (elements.countdown) {
                if (completionData.hasActiveHighlight) {
                    elements.countdown.textContent = `Highlight expires in: ${completionData.timeRemaining}`;
                } else if (completionData.timeRemaining === 'EXPIRED') {
                    elements.countdown.textContent = 'Highlight expired';
                } else {
                    elements.countdown.textContent = '';
                }
            }

        } else {
            // HIDE COMPLETION STATE

            // Update header to red
            const headerSpan = elements.header.querySelector('span');
            if (headerSpan) {
                headerSpan.style.color = '#dc2626';
            }

            // Hide completion section
            elements.completion.style.display = 'none';

            // Update separator to orange
            if (elements.separator) {
                elements.separator.style.borderBottom = '2px solid #f59e0b';
            }
        }
    },

    // Hook into all events that might change data
    hookIntoEvents() {
        // Hook profile creation
        if (window.createEnhancedProfile) {
            const original = window.createEnhancedProfile;
            window.createEnhancedProfile = (...args) => {
                const result = original.apply(this, args);
                // Clear sync state and force re-sync
                this.syncedLeads.clear();
                setTimeout(() => this.syncAllVisibleProfiles(), 200);
                return result;
            };
        }

        // Hook reach-out updates
        if (window.updateReachOut) {
            const original = window.updateReachOut;
            window.updateReachOut = (...args) => {
                const result = original.apply(this, args);
                const leadId = args[0];
                // Remove from synced set to force re-sync
                if (leadId) this.syncedLeads.delete(String(leadId));
                setTimeout(() => this.syncAllVisibleProfiles(), 300);
                return result;
            };
        }

        // Hook localStorage changes
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            if (key === 'insurance_leads') {
                // Data changed, clear sync state
                window.ProfileCompletionSync.syncedLeads.clear();
                setTimeout(() => window.ProfileCompletionSync.syncAllVisibleProfiles(), 100);
            }
        };

        // Hook window focus (when user returns to tab)
        window.addEventListener('focus', () => {
            this.syncedLeads.clear();
            setTimeout(() => this.syncAllVisibleProfiles(), 500);
        });

        console.log('✅ PERSISTENT SYNC: Event hooks installed');
    },

    // Manual trigger for immediate sync
    forceSyncAll() {
        console.log('🔧 PERSISTENT SYNC: Force syncing all profiles...');
        this.syncedLeads.clear();
        this.syncAllVisibleProfiles();
    },

    // Get sync status
    getStatus() {
        return {
            isActive: this.isActive,
            syncedLeads: Array.from(this.syncedLeads),
            checkInterval: this.CHECK_INTERVAL
        };
    }
};

// Auto-start the persistent sync system
setTimeout(() => {
    window.ProfileCompletionSync.start();
}, 1000);

// Global access functions
window.forceSyncProfiles = () => window.ProfileCompletionSync.forceSyncAll();
window.getProfileSyncStatus = () => window.ProfileCompletionSync.getStatus();

console.log('✅ PERSISTENT SYNC: Bulletproof profile completion sync system loaded!');
console.log('Available commands:');
console.log('  forceSyncProfiles()     - Force sync all profiles immediately');
console.log('  getProfileSyncStatus()  - Get sync system status');