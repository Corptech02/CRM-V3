// Communications Reminders Module - New Policies and Birthday Gifts
class CommunicationsReminders {
    constructor() {
        this.reminders = [];
        this.giftsSent = JSON.parse(localStorage.getItem('giftsSent') || '{}');
    }

    // Initialize communications reminders
    init() {
        this.updateRemindersDisplay();
        this.updateStats();

        // Refresh every 30 seconds
        setInterval(() => {
            this.updateRemindersDisplay();
            this.updateStats();
        }, 30000);
    }

    // Get all reminders (new policies and birthdays)
    getReminders() {
        const reminders = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get new policies from the last 7 days
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

        policies.forEach(policy => {
            const createdDate = new Date(policy.createdAt || policy.date);
            if (createdDate >= sevenDaysAgo && createdDate <= new Date()) {
                reminders.push({
                    id: `policy_${policy.id}`,
                    type: 'new_policy',
                    clientName: policy.clientName || 'Unknown Client',
                    policyType: policy.type || 'Insurance',
                    premium: policy.premium || 0,
                    date: createdDate,
                    daysAgo: Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)),
                    giftSent: this.giftsSent[`policy_${policy.id}`] || false
                });
            }
        });

        // Get upcoming birthdays (within next 30 days)
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        clients.forEach(client => {
            if (client.dateOfBirth) {
                const birthDate = new Date(client.dateOfBirth);
                const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

                let upcomingBirthday = thisYearBirthday;
                if (thisYearBirthday < today) {
                    upcomingBirthday = nextYearBirthday;
                }

                if (upcomingBirthday >= today && upcomingBirthday <= thirtyDaysFromNow) {
                    const daysUntil = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));
                    reminders.push({
                        id: `birthday_${client.id}_${upcomingBirthday.getFullYear()}`,
                        type: 'birthday',
                        clientName: client.name || 'Unknown Client',
                        email: client.email,
                        phone: client.phone,
                        date: upcomingBirthday,
                        daysUntil: daysUntil,
                        age: upcomingBirthday.getFullYear() - birthDate.getFullYear(),
                        giftSent: this.giftsSent[`birthday_${client.id}_${upcomingBirthday.getFullYear()}`] || false
                    });
                }
            }
        });

        // Sort by priority (new policies by recency, birthdays by proximity)
        reminders.sort((a, b) => {
            if (a.type === 'new_policy' && b.type === 'new_policy') {
                return a.date - b.date; // Most recent first
            }
            if (a.type === 'birthday' && b.type === 'birthday') {
                return a.daysUntil - b.daysUntil; // Soonest first
            }
            // Prioritize birthdays happening today/tomorrow over new policies
            if (a.type === 'birthday' && a.daysUntil <= 1) return -1;
            if (b.type === 'birthday' && b.daysUntil <= 1) return 1;
            // Otherwise prioritize new policies
            return a.type === 'new_policy' ? -1 : 1;
        });

        return reminders;
    }

    // Update reminders display
    updateRemindersDisplay() {
        const tbody = document.getElementById('communications-reminders-tbody');
        if (!tbody) return;

        const reminders = this.getReminders();

        if (reminders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                        No reminders at this time
                    </td>
                </tr>
            `;
        } else {
            const html = reminders.map(reminder => {
                let reminderHTML = '';

                if (reminder.type === 'new_policy') {
                    const badgeClass = this.getPolicyBadgeClass(reminder.policyType);
                    reminderHTML = `
                        <tr class="${reminder.giftSent ? 'gift-sent' : ''}">
                            <td>
                                <span class="reminder-type-badge new-policy">
                                    <i class="fas fa-file-contract"></i> New Policy
                                </span>
                            </td>
                            <td>
                                <strong>${reminder.clientName}</strong>
                                <br>
                                <small class="text-muted">${reminder.policyType}</small>
                            </td>
                            <td>
                                <span class="policy-badge ${badgeClass}">$${reminder.premium}/mo</span>
                            </td>
                            <td>
                                ${reminder.daysAgo === 0 ? 'Today' :
                                  reminder.daysAgo === 1 ? 'Yesterday' :
                                  `${reminder.daysAgo} days ago`}
                            </td>
                            <td>
                                ${reminder.giftSent ?
                                    '<span class="status-badge completed"><i class="fas fa-check"></i> Gift Sent</span>' :
                                    '<span class="status-badge pending">Pending</span>'
                                }
                            </td>
                            <td>
                                ${!reminder.giftSent ? `
                                    <button class="btn-small btn-primary" onclick="window.communicationsReminders.markGiftSent('${reminder.id}', '${reminder.clientName}')">
                                        <i class="fas fa-gift"></i> Mark Sent
                                    </button>
                                ` : `
                                    <button class="btn-small btn-secondary" onclick="window.communicationsReminders.undoGiftSent('${reminder.id}')">
                                        <i class="fas fa-undo"></i> Undo
                                    </button>
                                `}
                            </td>
                        </tr>
                    `;
                } else if (reminder.type === 'birthday') {
                    const urgencyClass = reminder.daysUntil <= 3 ? 'urgent' : reminder.daysUntil <= 7 ? 'soon' : '';
                    reminderHTML = `
                        <tr class="${reminder.giftSent ? 'gift-sent' : ''} ${urgencyClass}">
                            <td>
                                <span class="reminder-type-badge birthday">
                                    <i class="fas fa-birthday-cake"></i> Birthday
                                </span>
                            </td>
                            <td>
                                <strong>${reminder.clientName}</strong>
                                <br>
                                <small class="text-muted">Turning ${reminder.age}</small>
                            </td>
                            <td>
                                <small>${reminder.email || 'No email'}</small>
                            </td>
                            <td>
                                ${reminder.daysUntil === 0 ? '<strong style="color: #ef4444;">Today!</strong>' :
                                  reminder.daysUntil === 1 ? '<strong style="color: #f97316;">Tomorrow</strong>' :
                                  `In ${reminder.daysUntil} days`}
                                <br>
                                <small>${reminder.date.toLocaleDateString()}</small>
                            </td>
                            <td>
                                ${reminder.giftSent ?
                                    '<span class="status-badge completed"><i class="fas fa-check"></i> Gift Sent</span>' :
                                    '<span class="status-badge pending">Pending</span>'
                                }
                            </td>
                            <td>
                                ${!reminder.giftSent ? `
                                    <button class="btn-small btn-primary" onclick="window.communicationsReminders.markGiftSent('${reminder.id}', '${reminder.clientName}')">
                                        <i class="fas fa-gift"></i> Mark Sent
                                    </button>
                                ` : `
                                    <button class="btn-small btn-secondary" onclick="window.communicationsReminders.undoGiftSent('${reminder.id}')">
                                        <i class="fas fa-undo"></i> Undo
                                    </button>
                                `}
                            </td>
                        </tr>
                    `;
                }

                return reminderHTML;
            }).join('');

            tbody.innerHTML = html;
        }
    }

    // Update statistics
    updateStats() {
        const reminders = this.getReminders();
        const pendingGifts = reminders.filter(r => !r.giftSent).length;
        const sentGifts = reminders.filter(r => r.giftSent).length;
        const urgentBirthdays = reminders.filter(r => r.type === 'birthday' && r.daysUntil <= 3 && !r.giftSent).length;

        // Update stats if elements exist
        const pendingElement = document.getElementById('pending-gifts-count');
        if (pendingElement) pendingElement.textContent = pendingGifts;

        const sentElement = document.getElementById('sent-gifts-count');
        if (sentElement) sentElement.textContent = sentGifts;

        const urgentElement = document.getElementById('urgent-birthdays-count');
        if (urgentElement) urgentElement.textContent = urgentBirthdays;
    }

    // Mark gift as sent
    markGiftSent(reminderId, clientName) {
        if (confirm(`Mark gift as sent for ${clientName}?`)) {
            this.giftsSent[reminderId] = {
                sentAt: new Date().toISOString(),
                sentBy: sessionStorage.getItem('vanguard_user') || 'User'
            };
            localStorage.setItem('giftsSent', JSON.stringify(this.giftsSent));

            // Add to activity log
            this.addActivityLog(`Gift sent to ${clientName}`, reminderId.includes('birthday') ? 'birthday' : 'new_policy');

            // Update display
            this.updateRemindersDisplay();
            this.updateStats();

            // Show success message
            this.showNotification(`Gift marked as sent for ${clientName}`, 'success');
        }
    }

    // Undo gift sent
    undoGiftSent(reminderId) {
        delete this.giftsSent[reminderId];
        localStorage.setItem('giftsSent', JSON.stringify(this.giftsSent));

        // Update display
        this.updateRemindersDisplay();
        this.updateStats();

        this.showNotification('Gift status updated', 'info');
    }

    // Add activity log
    addActivityLog(message, type) {
        const activities = JSON.parse(localStorage.getItem('gift_activities') || '[]');
        activities.unshift({
            message,
            type,
            timestamp: new Date().toISOString(),
            user: sessionStorage.getItem('vanguard_user') || 'User'
        });

        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }

        localStorage.setItem('gift_activities', JSON.stringify(activities));
    }

    // Get policy badge class
    getPolicyBadgeClass(policyType) {
        const type = (policyType || '').toLowerCase();
        if (type.includes('auto')) return 'auto';
        if (type.includes('home')) return 'home';
        if (type.includes('commercial')) return 'commercial';
        if (type.includes('life')) return 'life';
        return 'general';
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize when loaded
window.communicationsReminders = new CommunicationsReminders();

// Export for use in other modules
window.CommunicationsReminders = CommunicationsReminders;