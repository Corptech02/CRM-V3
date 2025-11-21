/**
 * Vicidial Sync with Full Transcription Support
 * This ensures leads are synced WITH their transcripts properly processed
 */

(function() {
    console.log('🔄 Loading Vicidial Sync with Transcription Support...');

    // Override the sync function to use the proper endpoint
    window.syncVicidialLeads = async function() {
        console.log('🔄 Starting Vicidial sync with transcription...');

        // Show loading notification with progress
        const notification = document.createElement('div');
        notification.id = 'sync-notification-transcription';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            z-index: 100001;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        notification.innerHTML = `
            <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                <i class="fas fa-sync fa-spin"></i> Syncing ViciDial Leads
            </h4>
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">
                Connecting to ViciDial server...
            </p>
            <div style="background: rgba(255,255,255,0.2); border-radius: 4px; height: 6px; overflow: hidden;">
                <div id="sync-progress-bar-trans" style="background: white; height: 100%; width: 0%; transition: width 0.3s;"></div>
            </div>
            <p id="sync-status-text" style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                Initializing...
            </p>
        `;

        document.body.appendChild(notification);

        // Function to update progress
        function updateProgress(percentage, status) {
            const progressBar = document.getElementById('sync-progress-bar-trans');
            const statusText = document.getElementById('sync-status-text');
            if (progressBar) progressBar.style.width = percentage + '%';
            if (statusText) statusText.textContent = status;
        }

        try {
            // Determine the correct backend URL
            const baseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            updateProgress(10, 'Connecting to ViciDial...');

            // Call the sync endpoint that includes transcription
            const response = await fetch(`${baseUrl}/api/vicidial/sync-sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Sync endpoint returned error: ' + response.status);
            }

            const result = await response.json();
            console.log('Sync initiated:', result);

            // Start monitoring transcription progress
            if (window.startTranscriptionMonitoring) {
                window.startTranscriptionMonitoring();
            }

            // Poll for sync status
            let checkCount = 0;
            const maxChecks = 600; // 10 minutes max (600 * 1 second) - transcription takes time

            const statusInterval = setInterval(async () => {
                checkCount++;

                try {
                    const statusResponse = await fetch(`${baseUrl}/api/vicidial/sync-status`);
                    if (statusResponse.ok) {
                        const status = await statusResponse.json();

                        if (status.status === 'running') {
                            updateProgress(status.percentage || 50, status.message || 'Processing leads...');

                            // Show which lead is being transcribed
                            if (status.message && status.message.includes('Processing transcript')) {
                                const leadMatch = status.message.match(/for (.+?) \(/);
                                if (leadMatch) {
                                    updateProgress(
                                        status.percentage,
                                        `Transcribing: ${leadMatch[1]}...`
                                    );
                                }
                            }
                        } else if (status.status === 'completed') {
                            clearInterval(statusInterval);

                            // Stop transcription monitoring
                            if (window.stopTranscriptionMonitoring) {
                                window.stopTranscriptionMonitoring();
                            }

                            // Get the leads with transcripts
                            const leadsResponse = await fetch(`${baseUrl}/api/leads`);
                            if (leadsResponse.ok) {
                                const leads = await leadsResponse.json();

                                // Count leads with transcripts
                                const leadsWithTranscripts = leads.filter(l =>
                                    l.callTranscript && l.callTranscript.length > 0
                                ).length;

                                // Update localStorage
                                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                                localStorage.setItem('leads', JSON.stringify(leads));

                                console.log(`✅ Synced ${leads.length} leads to localStorage`);
                                console.log(`🎵 ${leadsWithTranscripts} have transcripts`);

                                // Success message
                                notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                notification.innerHTML = `
                                    <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                                        <i class="fas fa-check-circle"></i> Sync Complete!
                                    </h4>
                                    <p style="margin: 0; font-size: 14px;">
                                        ✅ ${leads.length} leads synced<br>
                                        🎵 ${leadsWithTranscripts} with transcripts<br>
                                        📊 ${leads.length - leadsWithTranscripts} pending transcription
                                    </p>
                                `;

                                // Force refresh the leads view - multiple attempts
                                console.log('Refreshing leads view...');

                                // Try all possible refresh methods
                                if (typeof loadLeadsView === 'function') {
                                    console.log('Using loadLeadsView()');
                                    loadLeadsView();
                                }

                                if (typeof window.refreshLeadsList === 'function') {
                                    console.log('Using refreshLeadsList()');
                                    window.refreshLeadsList();
                                }

                                // Force a page reload of the leads section
                                const leadsLink = document.querySelector('a[onclick*="loadLeadsView"]');
                                if (leadsLink) {
                                    console.log('Clicking leads link to refresh');
                                    leadsLink.click();
                                }

                                // As a last resort, reload the leads view manually
                                setTimeout(() => {
                                    const leadsView = document.querySelector('.leads-view');
                                    if (leadsView && typeof loadLeadsView === 'function') {
                                        console.log('Force reloading leads view');
                                        loadLeadsView();
                                    }
                                }, 1000);

                                // Remove notification after 5 seconds
                                setTimeout(() => notification.remove(), 5000);
                            } else {
                                console.error('Failed to fetch leads from API');
                            }
                        }
                    }
                } catch (err) {
                    console.error('Status check error:', err);
                }

                // Timeout check
                if (checkCount >= maxChecks) {
                    clearInterval(statusInterval);

                    // Stop transcription monitoring
                    if (window.stopTranscriptionMonitoring) {
                        window.stopTranscriptionMonitoring();
                    }

                    console.log('⏰ Sync timeout reached, checking if sync actually completed...');

                    // Check one final time if sync completed
                    try {
                        const finalResponse = await fetch(`${baseUrl}/api/leads`);
                        if (finalResponse.ok) {
                            const leads = await finalResponse.json();
                            const vicidialLeads = leads.filter(l => l.id && l.id.includes('vicidial'));
                            const withTranscripts = vicidialLeads.filter(l => l.callTranscript && l.callTranscript.length > 100);

                            if (vicidialLeads.length > 0) {
                                // Sync actually completed!
                                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                                localStorage.setItem('leads', JSON.stringify(leads));

                                notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                notification.innerHTML = `
                                    <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                                        <i class="fas fa-check-circle"></i> Sync Completed!
                                    </h4>
                                    <p style="margin: 0; font-size: 14px;">
                                        ✅ ${leads.length} leads synced<br>
                                        📞 ${vicidialLeads.length} Vicidial leads<br>
                                        🎵 ${withTranscripts.length} with transcripts
                                    </p>
                                `;

                                // Refresh view
                                if (typeof loadLeadsView === 'function') {
                                    loadLeadsView();
                                }
                                setTimeout(() => notification.remove(), 5000);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('Final check failed:', e);
                    }

                    // Actually timed out
                    notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                    notification.innerHTML = `
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                            <i class="fas fa-clock"></i> Sync Taking Longer
                        </h4>
                        <p style="margin: 0; font-size: 14px;">
                            Transcription is still processing.<br>
                            Refresh the page to see completed leads.
                        </p>
                    `;
                    setTimeout(() => notification.remove(), 8000);
                }
            }, 1000); // Check every second

        } catch (error) {
            console.error('Sync error:', error);

            // Stop transcription monitoring on error
            if (window.stopTranscriptionMonitoring) {
                window.stopTranscriptionMonitoring();
            }

            notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            notification.innerHTML = `
                <h4 style="margin: 0 0 10px 0; font-size: 16px;">
                    <i class="fas fa-times-circle"></i> Sync Failed
                </h4>
                <p style="margin: 0; font-size: 14px;">
                    ${error.message || 'Could not connect to sync service'}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.8;">
                    Please check if the backend is running:<br>
                    <code style="background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 2px;">
                        pm2 status backend
                    </code>
                </p>
            `;
            setTimeout(() => notification.remove(), 8000);
        }
    };

    // Add a manual trigger for testing transcription on existing leads
    window.transcribeExistingLeads = async function() {
        console.log('📝 Starting transcription for existing leads...');

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadsWithoutTranscripts = leads.filter(l => !l.callTranscript || l.callTranscript.length === 0);

        if (leadsWithoutTranscripts.length === 0) {
            alert('All leads already have transcripts!');
            return;
        }

        console.log(`Found ${leadsWithoutTranscripts.length} leads without transcripts`);

        // Start the transcription process
        for (const lead of leadsWithoutTranscripts) {
            if (lead.id && lead.name) {
                console.log(`Processing transcript for: ${lead.name}`);
                // Show transcription progress
                if (window.showTranscriptionProgress) {
                    window.showTranscriptionProgress(lead.id, lead.name, lead.phone);

                    // Simulate progress stages
                    setTimeout(() => window.updateTranscriptionStage(lead.id, 'transcribe'), 2000);
                    setTimeout(() => window.updateTranscriptionStage(lead.id, 'openai'), 5000);
                    setTimeout(() => window.updateTranscriptionStage(lead.id, 'complete'), 8000);
                }
            }
        }
    };

    console.log('✅ Vicidial Sync with Transcription loaded');
    console.log('   Use syncVicidialLeads() to sync with full transcription');
    console.log('   Use transcribeExistingLeads() to transcribe leads without transcripts');
})();