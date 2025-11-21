// Restore the original lead profile view (non-modal version)
(function() {
    'use strict';

    console.log('🔧 RESTORE-ORIGINAL-PROFILE: Restoring original view...');

    // Override showLeadProfile to prevent modal versions
    window.showLeadProfile = null;

    // Restore the original viewLead function
    window.viewLead = function(leadId) {
        console.log('Opening original lead profile for:', leadId);

        // Convert to string for consistency
        leadId = String(leadId);

        // Get lead data - try both storage keys
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = leads.find(l => String(l.id) === leadId);

        if (!lead) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            lead = leads.find(l => String(l.id) === leadId);
        }

        if (!lead) {
            alert('Lead not found');
            return;
        }

        // Get the dashboard content area
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) {
            console.error('Dashboard content area not found');
            return;
        }

        // Build the original profile HTML
        dashboardContent.innerHTML = `
            <div class="lead-profile" data-lead-id="${lead.id}">
                <header class="content-header">
                    <div>
                        <button class="btn-text" onclick="loadLeadsView()">
                            <i class="fas fa-arrow-left"></i> Back to Leads
                        </button>
                        <h1>Lead Profile: ${lead.name}</h1>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="editLead(${lead.id})">
                            <i class="fas fa-edit"></i> Edit Lead
                        </button>
                        <button class="btn-danger" onclick="deleteLead(${lead.id})">
                            <i class="fas fa-trash"></i> Delete Lead
                        </button>
                        <button class="btn-primary" onclick="convertLead(${lead.id})">
                            <i class="fas fa-user-check"></i> Convert to Client
                        </button>
                    </div>
                </header>

                <div class="profile-grid">
                    <!-- Lead Information -->
                    <div class="profile-section">
                        <h2><i class="fas fa-user"></i> Lead Information</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Name</label>
                                <p>${lead.name}</p>
                            </div>
                            <div class="info-item">
                                <label>Phone</label>
                                <p>${lead.phone}</p>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <p>${lead.email}</p>
                            </div>
                            <div class="info-item">
                                <label>Product Interest</label>
                                <p>${lead.product}</p>
                            </div>
                            <div class="info-item">
                                <label>Stage</label>
                                <p>${window.getStageHtml ? window.getStageHtml(lead.stage) : lead.stage}</p>
                            </div>
                            <div class="info-item">
                                <label>Assigned To</label>
                                <p>${lead.assignedTo || 'Unassigned'}</p>
                            </div>
                            <div class="info-item">
                                <label>Created Date</label>
                                <p>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Renewal Date</label>
                                <p>${lead.renewalDate || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Premium Amount</label>
                                <p class="premium-amount">$${(lead.premium || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Insurance Quotes Section -->
                    <div class="profile-section quotes-section">
                        <div class="section-header">
                            <h2><i class="fas fa-file-invoice-dollar"></i> Insurance Quotes</h2>
                            <button class="btn-primary" onclick="addQuote(${lead.id})">
                                <i class="fas fa-plus"></i> Add Quote
                            </button>
                        </div>

                        <div class="quotes-list" id="quotesList">
                            ${generateQuotesList(lead.quotes || [])}
                        </div>
                    </div>

                    <!-- Activity Timeline -->
                    <div class="profile-section">
                        <h2><i class="fas fa-history"></i> Activity Timeline</h2>
                        <div class="timeline">
                            <div class="timeline-item">
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <h4>Lead Created</h4>
                                    <p>Lead was created on ${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                                    <span class="timeline-date">${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</span>
                                </div>
                            </div>
                            ${lead.stage === 'quoted' ? `
                            <div class="timeline-item">
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <h4>Quote Provided</h4>
                                    <p>Insurance quote was provided to the lead</p>
                                    <span class="timeline-date">Recently</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Notes Section -->
                    <div class="profile-section">
                        <div class="section-header">
                            <h2><i class="fas fa-sticky-note"></i> Notes</h2>
                            <button class="btn-secondary" onclick="addNote(${lead.id})">
                                <i class="fas fa-plus"></i> Add Note
                            </button>
                        </div>

                        <div class="notes-list">
                            ${generateNotesList(lead.notes || [])}
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Original lead profile displayed');
    };

    // Helper function to generate quotes list
    window.generateQuotesList = function(quotes) {
        if (!quotes || quotes.length === 0) {
            return '<p class="empty-state">No quotes added yet</p>';
        }

        return quotes.map(quote => `
            <div class="quote-item">
                <div class="quote-header">
                    <h3>${quote.company || 'Unknown Company'}</h3>
                    <span class="quote-date">${quote.date || new Date().toLocaleDateString()}</span>
                </div>
                <div class="quote-details">
                    <div class="quote-detail">
                        <label>Premium:</label>
                        <span class="quote-premium">$${(quote.premium || 0).toLocaleString()}</span>
                    </div>
                    <div class="quote-detail">
                        <label>Coverage:</label>
                        <span>${quote.coverage || 'Standard'}</span>
                    </div>
                    <div class="quote-detail">
                        <label>Deductible:</label>
                        <span>$${(quote.deductible || 0).toLocaleString()}</span>
                    </div>
                </div>
                ${quote.notes ? `<p class="quote-notes">${quote.notes}</p>` : ''}
            </div>
        `).join('');
    };

    // Helper function to generate notes list
    window.generateNotesList = function(notes) {
        if (!notes || (typeof notes === 'string' && notes === '')) {
            return '<p class="empty-state">No notes added yet</p>';
        }

        // Handle both string and array format
        if (typeof notes === 'string') {
            return `<div class="note-item"><p>${notes}</p></div>`;
        }

        if (Array.isArray(notes)) {
            return notes.map(note => `
                <div class="note-item">
                    <p>${note.text || note}</p>
                    ${note.date ? `<span class="note-date">${note.date}</span>` : ''}
                </div>
            `).join('');
        }

        return '<p class="empty-state">No notes added yet</p>';
    };

    console.log('✅ RESTORE-ORIGINAL-PROFILE: Ready');
})();