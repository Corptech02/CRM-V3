/**
 * Transcription Progress Tracker
 * Shows progress bars for ongoing transcription and OpenAI processing
 */

(function() {
    console.log('📊 Loading Transcription Progress Tracker...');

    let progressContainer = null;
    let activeTranscriptions = new Map();

    // Create progress container
    function createProgressContainer() {
        if (progressContainer) return progressContainer;

        progressContainer = document.createElement('div');
        progressContainer.id = 'transcription-progress-container';
        progressContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 100002;
            background: rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 16px;
            display: none;
        `;

        document.body.appendChild(progressContainer);
        return progressContainer;
    }

    // Show simple sync progress for multiple leads
    function showTranscriptionProgress(selectedLeads) {
        createProgressContainer();

        // Clear any existing content
        progressContainer.innerHTML = '';

        // If it's just a count (old format), convert to simple display
        if (typeof selectedLeads === 'number') {
            progressContainer.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                        <i class="fas fa-sync fa-spin"></i> Syncing ${selectedLeads} leads
                    </h4>
                    <div style="font-size: 13px; opacity: 0.8;">Processing selected leads...</div>
                </div>
            `;
            progressContainer.style.display = 'block';
            return;
        }

        // Handle array of leads
        if (!Array.isArray(selectedLeads)) return;

        const leadsList = selectedLeads.map((lead, index) => `
            <div id="lead-sync-${index}" style="padding: 5px 0; font-size: 13px; opacity: 0.8;">
                <i class="fas fa-clock" style="margin-right: 5px; color: #fbbf24;"></i>
                ${lead.name || lead.company || lead.phone || `Lead ${index + 1}`}
            </div>
        `).join('');

        progressContainer.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 8px;">
                <h4 style="margin: 0 0 15px 0; font-size: 16px;">
                    <i class="fas fa-sync fa-spin"></i> Syncing ${selectedLeads.length} leads
                </h4>
                <div id="leads-sync-list" style="max-height: 200px; overflow-y: auto;">
                    ${leadsList}
                </div>
            </div>
        `;
        progressContainer.style.display = 'block';
    }

    // Update progress for leads being synced
    function updateTranscriptionStage(percentage, message) {
        if (!progressContainer) return;

        // Update header with current status
        const header = progressContainer.querySelector('h4');
        if (header && message) {
            header.innerHTML = `
                <i class="fas fa-sync fa-spin"></i> ${message}
            `;
        }

        // Mark leads as completed based on percentage
        const leadElements = progressContainer.querySelectorAll('[id^="lead-sync-"]');
        const completedCount = Math.floor((percentage / 100) * leadElements.length);

        leadElements.forEach((leadElement, index) => {
            if (index < completedCount) {
                // Mark as completed
                const icon = leadElement.querySelector('i');
                if (icon && icon.classList.contains('fa-clock')) {
                    icon.className = 'fas fa-check-circle';
                    icon.style.color = '#10b981';
                }
            }
        });
    }

    // Show completion message
    function showTranscriptionComplete(count) {
        if (!progressContainer) return;

        progressContainer.innerHTML = `
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                    <i class="fas fa-check-circle"></i> Sync Complete!
                </h4>
                <div style="font-size: 14px; text-align: center;">
                    ✅ ${count} leads synced successfully
                </div>
            </div>
        `;

        // Auto hide after 3 seconds
        setTimeout(() => {
            hideTranscriptionProgress();
        }, 3000);
    }

    // Hide all progress
    function hideTranscriptionProgress() {
        if (progressContainer) {
            progressContainer.style.display = 'none';
            progressContainer.innerHTML = '';
        }
    }

    // Monitor function (simplified)
    function monitorTranscriptionProgress() {
        // This function is simplified since we're using the new sync approach
    }

    // Add global functions
    window.showTranscriptionProgress = showTranscriptionProgress;
    window.updateTranscriptionStage = updateTranscriptionStage;
    window.updateTranscriptionProgress = updateTranscriptionStage; // Alias for compatibility
    window.hideTranscriptionProgress = hideTranscriptionProgress;
    window.showTranscriptionComplete = showTranscriptionComplete;

    console.log('✅ Simplified Transcription Progress Tracker loaded');

})();
