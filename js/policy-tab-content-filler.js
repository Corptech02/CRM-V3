// Policy Tab Content Filler - Populate all policy tabs with detailed information
console.log('🔧 Loading policy tab content filler...');

// Function to populate policy tab content with detailed information
function populatePolicyTabContent(policy) {
    console.log('📋 Populating tab content for policy:', policy.clientName);

    // Wait for tabs to be created, then populate content
    setTimeout(() => {
        populateOverviewTab(policy);
        populateNamedInsuredTab(policy);
        populateContactTab(policy);
        populateCoverageTab(policy);
        populateVehiclesTab(policy);
        populateDriversTab(policy);
        populateFinancialTab(policy);
        populateDocumentsTab(policy);
        populateNotesTab(policy);
    }, 300);
}

function populateOverviewTab(policy) {
    const overviewContent = document.getElementById('overview-view-content');
    if (!overviewContent) return;

    overviewContent.innerHTML = `
        <div style="padding: 20px;">
            <div class="policy-overview">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h3><i class="fas fa-file-contract"></i> Policy Information</h3>
                        <p><strong>Policy Number:</strong> ${policy.policyNumber}</p>
                        <p><strong>Client:</strong> ${policy.clientName}</p>
                        <p><strong>Carrier:</strong> ${policy.carrierName}</p>
                        <p><strong>Policy Type:</strong> ${policy.policyType}</p>
                        <p><strong>Status:</strong> <span class="badge active">${policy.status}</span></p>
                    </div>
                    <div>
                        <h3><i class="fas fa-calendar"></i> Policy Dates</h3>
                        <p><strong>Effective Date:</strong> ${policy.effectiveDate}</p>
                        <p><strong>Expiration Date:</strong> ${policy.expirationDate}</p>
                        <p><strong>Assigned To:</strong> ${policy.assignedTo}</p>
                        <p><strong>Annual Premium:</strong> <span style="color: #10b981; font-weight: bold;">$${policy.premium.toLocaleString()}</span></p>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h4><i class="fas fa-building"></i> Business Information</h4>
                    <p><strong>Business Name:</strong> ${policy.business.name}</p>
                    <p><strong>Business Type:</strong> ${policy.business.type}</p>
                    <p><strong>Classification:</strong> ${policy.business.classification}</p>
                    <p><strong>USDOT Number:</strong> ${policy.business.usdotNumber}</p>
                    ${policy.business.operatingRadius ? `<p><strong>Operating Radius:</strong> ${policy.business.operatingRadius}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

function populateNamedInsuredTab(policy) {
    const insuredContent = document.getElementById('insured-view-content');
    if (!insuredContent) return;

    insuredContent.innerHTML = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-user"></i> Named Insured Information</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <div style="margin-bottom: 20px;">
                    <h4>${policy.clientName}</h4>
                    <p><strong>Business Type:</strong> ${policy.business.type}</p>
                    <p><strong>Classification:</strong> ${policy.business.classification}</p>
                    <p><strong>USDOT Number:</strong> ${policy.business.usdotNumber}</p>
                </div>

                <div>
                    <h4>Primary Contact</h4>
                    <p><strong>Email:</strong> ${policy.email}</p>
                    <p><strong>Phone:</strong> ${policy.phone}</p>
                </div>
            </div>
        </div>
    `;
}

function populateContactTab(policy) {
    const contactContent = document.getElementById('contact-view-content');
    if (!contactContent) return;

    contactContent.innerHTML = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-address-book"></i> Contact Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4>Business Address</h4>
                    <p>${policy.address.street}</p>
                    <p>${policy.address.city}, ${policy.address.state} ${policy.address.zip}</p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4>Contact Details</h4>
                    <p><strong>Phone:</strong> <a href="tel:${policy.phone}">${policy.phone}</a></p>
                    <p><strong>Email:</strong> <a href="mailto:${policy.email}">${policy.email}</a></p>
                </div>
            </div>
        </div>
    `;
}

function populateCoverageTab(policy) {
    const coverageContent = document.getElementById('coverage-view-content');
    if (!coverageContent) return;

    let coverageHtml = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-shield-alt"></i> Coverage Information</h3>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>Policy Level Coverages</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Coverage</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Limits</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Premium</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Add motor truck cargo coverage
    if (policy.coverages.motorTruckCargo) {
        const mtc = policy.coverages.motorTruckCargo;
        coverageHtml += `
            <tr>
                <td style="padding: 8px; border: 1px solid #d1d5db;">Motor Truck Cargo</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${mtc.limits} with a $${mtc.deductible.toLocaleString()} Deductible</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">$${mtc.premium.toLocaleString()}</td>
            </tr>
        `;
    }

    coverageHtml += `
                    </tbody>
                </table>
            </div>
    `;

    // Add vehicle-specific coverage breakdown if available
    if (policy.premiumBreakdown) {
        coverageHtml += `
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
                <h4>Vehicles/Trailers Premium Breakdown</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e0f2fe;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #b3e5fc;">Vehicle</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #b3e5fc;">Premium</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.entries(policy.premiumBreakdown).forEach(([key, value]) => {
            if (key !== 'totalPremium' && key !== 'fees') {
                let vehicleName = key;
                if (key.includes('trailer')) {
                    const vehicle = policy.vehicles.find(v => v.id === key);
                    if (vehicle) {
                        vehicleName = `${vehicle.year} ${vehicle.make} (${vehicle.vin})`;
                    }
                } else if (key.includes('vehicle')) {
                    const vehicle = policy.vehicles.find(v => v.id === key);
                    if (vehicle) {
                        vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`;
                    }
                } else if (key === 'motorTruckCargo') {
                    vehicleName = 'Motor Truck Cargo Coverage';
                }

                coverageHtml += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #b3e5fc;">${vehicleName}</td>
                        <td style="padding: 8px; border: 1px solid #b3e5fc;">$${value.toLocaleString()}</td>
                    </tr>
                `;
            }
        });

        coverageHtml += `
                        <tr style="background: #e0f2fe; font-weight: bold;">
                            <td style="padding: 8px; border: 1px solid #b3e5fc;">Total Policy Premium</td>
                            <td style="padding: 8px; border: 1px solid #b3e5fc;">$${policy.premiumBreakdown.totalPremium.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    coverageContent.innerHTML = coverageHtml + '</div>';
}

function populateVehiclesTab(policy) {
    const vehiclesContent = document.getElementById('vehicles-view-content');
    if (!vehiclesContent) return;

    let vehiclesHtml = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-car"></i> Vehicles (${policy.vehicles.length})</h3>
    `;

    policy.vehicles.forEach((vehicle, index) => {
        vehiclesHtml += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>${vehicle.type} ${index + 1} - ${vehicle.year} ${vehicle.make} ${vehicle.model || ''}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <p><strong>VIN:</strong> ${vehicle.vin}</p>
                        <p><strong>Year:</strong> ${vehicle.year}</p>
                        <p><strong>Make:</strong> ${vehicle.make}</p>
                        <p><strong>Model:</strong> ${vehicle.model || 'N/A'}</p>
                    </div>
                    <div>
                        <p><strong>Type:</strong> ${vehicle.type}</p>
                        <p><strong>Total Premium:</strong> <span style="color: #10b981; font-weight: bold;">$${vehicle.totalPremium.toLocaleString()}</span></p>
                    </div>
                </div>

                <h5>Coverage Details:</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Coverage</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Limits</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Premium</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add coverage rows
        if (vehicle.bodilyInjuryPD) {
            vehiclesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">Bodily Injury and Property Damage Liability</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${vehicle.bodilyInjuryPD.limits}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.bodilyInjuryPD.premium.toLocaleString()}</td>
                </tr>
            `;
        }

        if (vehicle.uninsuredMotorist) {
            vehiclesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">Uninsured/Underinsured Motorist Bodily Injury</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${vehicle.uninsuredMotorist.limits}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${vehicle.uninsuredMotorist.limits.includes('Not applicable') ? 'Not applicable' : '$' + vehicle.uninsuredMotorist.premium.toLocaleString()}</td>
                </tr>
            `;
        }

        if (vehicle.comprehensive) {
            vehiclesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">Comprehensive</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.comprehensive.deductible.toLocaleString()} Deductible</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.comprehensive.premium.toLocaleString()}</td>
                </tr>
            `;
        }

        if (vehicle.collision) {
            vehiclesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">Collision</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.collision.deductible.toLocaleString()} Deductible</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.collision.premium.toLocaleString()}</td>
                </tr>
            `;
        }

        if (vehicle.medicalPayments) {
            vehiclesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">Medical Payments</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${vehicle.medicalPayments.limits}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.medicalPayments.premium.toLocaleString()}</td>
                </tr>
            `;
        }

        if (vehicle.roadsideAssistance) {
            vehiclesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">Roadside Assistance</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${vehicle.roadsideAssistance.limits}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.roadsideAssistance.premium.toLocaleString()}</td>
                </tr>
            `;
        }

        vehiclesHtml += `
                        <tr style="background: #e5e7eb; font-weight: bold;">
                            <td style="padding: 8px; border: 1px solid #d1d5db;" colspan="2">Total ${vehicle.type} Premium</td>
                            <td style="padding: 8px; border: 1px solid #d1d5db;">$${vehicle.totalPremium.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    });

    vehiclesContent.innerHTML = vehiclesHtml + '</div>';
}

function populateDriversTab(policy) {
    const driversContent = document.getElementById('drivers-view-content');
    if (!driversContent) return;

    let driversHtml = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-id-card"></i> Drivers (${policy.drivers.length})</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Name</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Date of Birth</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">License #</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Experience</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Relation</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    policy.drivers.forEach(driver => {
        driversHtml += `
            <tr>
                <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold;">${driver.name}</td>
                <td style="padding: 12px; border: 1px solid #d1d5db;">${driver.dob}</td>
                <td style="padding: 12px; border: 1px solid #d1d5db;">${driver.licenseNumber || 'N/A'}</td>
                <td style="padding: 12px; border: 1px solid #d1d5db;">${driver.experience || 'N/A'}</td>
                <td style="padding: 12px; border: 1px solid #d1d5db;">${driver.relation || 'N/A'}</td>
            </tr>
        `;
    });

    driversContent.innerHTML = driversHtml + '</tbody></table></div></div>';
}

function populateFinancialTab(policy) {
    const financialContent = document.getElementById('financial-view-content');
    if (!financialContent) return;

    financialContent.innerHTML = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-dollar-sign"></i> Financial Information</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4>Payment Information</h4>
                    ${policy.financialInfo ? `
                        <p><strong>Current Balance:</strong> <span style="color: ${policy.financialInfo.currentBalance > 0 ? '#dc2626' : '#10b981'};">$${Math.abs(policy.financialInfo.currentBalance).toLocaleString()}</span></p>
                        <p><strong>Last Payment:</strong> ${policy.financialInfo.lastPayment.date} - $${Math.abs(policy.financialInfo.lastPayment.amount).toLocaleString()}</p>
                        <p><strong>Next Payment:</strong> ${policy.financialInfo.nextPayment.date} - $${policy.financialInfo.nextPayment.amount.toLocaleString()}</p>
                        <p><strong>Payment Schedule:</strong> ${policy.financialInfo.paymentSchedule}</p>
                    ` : `
                        <p><strong>Annual Premium:</strong> $${policy.premium.toLocaleString()}</p>
                        <p><strong>Payment Status:</strong> Current</p>
                    `}
                </div>

                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
                    <h4>Premium Breakdown</h4>
                    <p><strong>Total Annual Premium:</strong> $${policy.premium.toLocaleString()}</p>
                    <p><strong>Policy Type:</strong> ${policy.policyType}</p>
                    <p><strong>Payment Method:</strong> ${policy.financialInfo?.paymentSchedule || 'Annual'}</p>
                    ${policy.additionalInfo?.discounts ? `
                        <p><strong>Discounts Applied:</strong></p>
                        <ul style="margin: 5px 0 0 20px;">
                            ${policy.additionalInfo.discounts.map(discount => `<li>${discount}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function populateDocumentsTab(policy) {
    const documentsContent = document.getElementById('documents-view-content');
    if (!documentsContent) return;

    documentsContent.innerHTML = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-file-alt"></i> Policy Documents</h3>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>Available Documents</h4>
                ${policy.documents && policy.documents.length > 0 ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        ${policy.documents.map(doc => `
                            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <h5><i class="fas fa-file-pdf"></i> ${doc.type}</h5>
                                <p style="color: #6b7280; margin: 5px 0;">${doc.description}</p>
                                <button style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No documents available for this policy.</p>'}
            </div>

            ${policy.filings && policy.filings.length > 0 ? `
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px;">
                    <h4>Required Filings</h4>
                    <ul style="margin: 10px 0 0 20px;">
                        ${policy.filings.map(filing => `<li>${filing}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

function populateNotesTab(policy) {
    const notesContent = document.getElementById('notes-view-content');
    if (!notesContent) return;

    notesContent.innerHTML = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-sticky-note"></i> Policy Notes</h3>

            ${policy.notes && policy.notes.length > 0 ? `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    ${policy.notes.map(note => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: bold; color: #3b82f6;">${note.type}</span>
                                <span style="color: #6b7280; font-size: 14px;">${note.date} - ${note.author}</span>
                            </div>
                            <p style="margin: 0; color: #374151;">${note.content}</p>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #6b7280;">No notes available for this policy.</p>
                    <button style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-plus"></i> Add Note
                    </button>
                </div>
            `}
        </div>
    `;
}

// Override switchViewTab to populate content when tabs are switched
const originalSwitchViewTab = window.switchViewTab;
window.switchViewTab = function(tabId) {
    // Call original function
    if (originalSwitchViewTab) {
        originalSwitchViewTab(tabId);
    }

    // Find the current policy data and populate the tab
    setTimeout(() => {
        const policyModal = document.getElementById('policyViewModal') ||
                           document.getElementById('policyModal') ||
                           document.querySelector('.modal:last-child');

        if (policyModal) {
            const policyIdElement = policyModal.querySelector('[data-policy-id]');
            if (policyIdElement) {
                const policyId = policyIdElement.getAttribute('data-policy-id');
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const policy = policies.find(p => p.id === policyId || p.policyNumber === policyId);

                if (policy) {
                    populatePolicyTabContent(policy);
                }
            }
        }
    }, 100);
};

// Override policy viewing functions to populate content
const originalEnhancedViewPolicy = window.enhancedViewPolicy;
if (originalEnhancedViewPolicy) {
    window.enhancedViewPolicy = function(policyId) {
        originalEnhancedViewPolicy(policyId);

        setTimeout(() => {
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const policy = policies.find(p => p.id === policyId || p.policyNumber === policyId);

            if (policy) {
                populatePolicyTabContent(policy);
            }
        }, 800);
    };
}

console.log('✅ Policy tab content filler loaded and active');