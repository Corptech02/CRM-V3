// Policy QuickFill Enhancement
// Adds a QuickFill button to policy edit modal headers for bulk data import

(function() {
    'use strict';

    // Wait for DOM and check for modal
    function initQuickFill() {
        // Check if we're in a policy edit modal
        const modalHeader = document.querySelector('#policyModal .modal-header');
        const modalTitle = modalHeader?.querySelector('h2');

        if (!modalHeader || !modalTitle ||
            (!modalTitle.textContent.includes('Edit Policy') && !modalTitle.textContent.includes('Create New Policy'))) {
            return;
        }

        // Check if QuickFill button already exists
        if (modalHeader.querySelector('.quickfill-btn')) {
            return;
        }

        // Create QuickFill button
        const quickFillBtn = document.createElement('button');
        quickFillBtn.className = 'quickfill-btn';
        quickFillBtn.innerHTML = '⚡ QuickFill';
        quickFillBtn.style.cssText = `
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-left: 12px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        // Add hover effect
        quickFillBtn.addEventListener('mouseenter', () => {
            quickFillBtn.style.transform = 'translateY(-1px)';
            quickFillBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
        });

        quickFillBtn.addEventListener('mouseleave', () => {
            quickFillBtn.style.transform = 'translateY(0)';
            quickFillBtn.style.boxShadow = 'none';
        });

        // Add click handler
        quickFillBtn.addEventListener('click', showQuickFillDialog);

        // Insert button into header
        const headerContent = modalHeader.querySelector('div[style*="display: flex"]');
        if (headerContent) {
            headerContent.appendChild(quickFillBtn);
        }
    }

    // Show QuickFill dialog
    function showQuickFillDialog() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'quickfill-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999999 !important;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'quickfill-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow: hidden;
            animation: slideIn 0.3s ease;
            position: relative;
            z-index: 9999999 !important;
        `;

        dialog.innerHTML = `
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                    ⚡ Policy QuickFill
                </h3>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">
                    Paste your policy information below and we'll automatically fill the form
                </p>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                        Policy Information
                    </label>
                    <textarea
                        id="quickfill-input"
                        placeholder="Paste your policy information here...

Example:
Policy Number: 9300258908
Status: InForce
Policy Period: 12/29/2025 - 12/29/2026
Total Premium: $16,902.00

Business Name: MAVICS GLOBAL SERVICES LLC
Email: MAVICSGLOBAL@YAHOO.COM
Business Phone Number: (216) 551-6363

Mailing Address: 24800 CHAGRIN BLVD STE 208
BEACHWOOD, OH 44122"
                        style="width: 100%; height: 300px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; box-sizing: border-box;"
                    ></textarea>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="closeQuickFillDialog()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancel</button>
                    <button onclick="processQuickFill()" style="
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">🚀 Fill Form</button>
                </div>
            </div>
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(style);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Focus textarea
        setTimeout(() => {
            const textarea = document.getElementById('quickfill-input');
            textarea?.focus();
        }, 100);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeQuickFillDialog();
            }
        });
    }

    // Close QuickFill dialog
    window.closeQuickFillDialog = function() {
        const overlay = document.querySelector('.quickfill-overlay');
        if (overlay) {
            overlay.remove();
        }
    };

    // Process QuickFill data
    window.processQuickFill = function() {
        const textarea = document.getElementById('quickfill-input');
        const rawText = textarea?.value?.trim();

        if (!rawText) {
            alert('Please paste some policy information first.');
            return;
        }

        try {
            const parsedData = parsePolicyData(rawText);
            populateFormFields(parsedData);
            closeQuickFillDialog();

            // Show success message
            showSuccessMessage('Policy data imported successfully!');
        } catch (error) {
            console.error('QuickFill error:', error);
            alert('Error parsing policy data. Please check the format and try again.');
        }
    };

    // Parse policy data from text
    function parsePolicyData(text) {
        const data = {
            vehicles: [],
            drivers: [],
            coverages: {}
        };
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        let currentSection = '';
        let vehicleBuffer = {};
        let driverBuffer = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Section detection
            if (line.match(/^Vehicles?$/i)) {
                currentSection = 'vehicles';
                console.log('QuickFill: Entering vehicles section');
                continue;
            } else if (line.match(/^Drivers?$/i)) {
                currentSection = 'drivers';
                console.log('QuickFill: Entering drivers section');
                continue;
            } else if (line.match(/Policy Coverages/i)) {
                currentSection = 'coverages';
                console.log('QuickFill: Entering coverages section');
                continue;
            } else if (line.match(/Vehicle Coverages/i)) {
                currentSection = 'vehicle-coverages';
                continue;
            } else if (line.match(/Business Information/i)) {
                currentSection = 'business';
                continue;
            }

            // Policy Number
            if (line.match(/Policy Number:\s*(.+)/i)) {
                data.policyNumber = line.match(/Policy Number:\s*(.+)/i)[1].trim();
            }

            // Status
            else if (line.match(/Status:\s*(.+)/i)) {
                data.status = line.match(/Status:\s*(.+)/i)[1].trim();
            }

            // Policy Period
            else if (line.match(/Policy Period:\s*(.+)/i)) {
                const period = line.match(/Policy Period:\s*(.+)/i)[1].trim();
                const dates = period.split(' - ');
                if (dates.length === 2) {
                    data.effectiveDate = formatDate(dates[0].trim());
                    data.expirationDate = formatDate(dates[1].trim());
                }
            }

            // Premium
            else if (line.match(/Total Premium[:\s]*\$?([\d,]+\.?\d*)/i)) {
                data.premium = line.match(/Total Premium[:\s]*\$?([\d,]+\.?\d*)/i)[1].replace(/,/g, '');
            }

            // Business/Insured Name
            else if (line.match(/Business Name[:\s]*(.+)/i)) {
                data.insuredName = line.match(/Business Name[:\s]*(.+)/i)[1].trim();
            }

            // Email
            else if (line.match(/Email[:\s]*(.+)/i)) {
                data.email = line.match(/Email[:\s]*(.+)/i)[1].trim();
            }

            // Business Phone Number - more flexible matching
            else if (line.match(/(?:Business\s+)?Phone\s*(?:Number)?[:\s]*(.+)/i)) {
                const phoneMatch = line.match(/(?:Business\s+)?Phone\s*(?:Number)?[:\s]*(.+)/i)[1].trim();
                // Don't save if it's just the word "Number"
                if (phoneMatch && phoneMatch.toLowerCase() !== 'number') {
                    data.phone = phoneMatch;
                }
            }

            // Mobile Phone Number
            else if (line.match(/Mobile\s*(?:Phone)?\s*(?:Number)?[:\s]*(.+)/i)) {
                const mobileMatch = line.match(/Mobile\s*(?:Phone)?\s*(?:Number)?[:\s]*(.+)/i)[1].trim();
                // Don't save if it's just the word "Number"
                if (mobileMatch && mobileMatch.toLowerCase() !== 'number') {
                    data.mobilePhone = mobileMatch;
                }
            }

            // Mailing Address - more flexible matching
            else if (line.match(/(?:Mailing\s+)?Address[:\s]*(.+)/i)) {
                data.address = line.match(/(?:Mailing\s+)?Address[:\s]*(.+)/i)[1].trim();
            }

            // Also catch phone numbers in format (xxx) xxx-xxxx
            else if (line.match(/^\((\d{3})\)\s*(\d{3})-(\d{4})$/) && !data.phone) {
                data.phone = line.trim();
            }

            // Catch email addresses
            else if (line.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) && !data.email) {
                data.email = line.trim();
            }

            // City, State ZIP pattern
            else if (line.match(/^([A-Z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)) {
                const match = line.match(/^([A-Z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
                data.city = match[1].trim();
                data.state = match[2].trim();
                data.zip = match[3].trim();
            }

            // Business Class/Type
            else if (line.match(/Business Class[:\s]*(.+)/i)) {
                data.businessClass = line.match(/Business Class[:\s]*(.+)/i)[1].trim();
            }

            // Vehicle parsing - look for patterns like "1\n2022\nDODGE RAM\n3500\n15774"
            else if (currentSection === 'vehicles' && line.match(/^\d+$/) && i + 4 < lines.length) {
                const vehicleNum = line;
                const year = lines[i + 1] || '';
                const makeModel = lines[i + 2] || '';
                const model2 = lines[i + 3] || '';
                const id = lines[i + 4] || '';

                // Check if this looks like a vehicle entry
                if (year.match(/^\d{4}$/) && makeModel.length > 0) {
                    let make, model, vehicleId;

                    // Parse make and model
                    const makeParts = makeModel.split(' ');
                    make = makeParts[0];

                    if (makeParts.length > 1) {
                        model = makeParts.slice(1).join(' ') + ' ' + model2;
                    } else {
                        model = model2;
                    }

                    // Vehicle ID could be in the 4th or 5th position
                    if (id.match(/^\d+$/)) {
                        vehicleId = id;
                    } else if (model2.match(/^\d+$/)) {
                        vehicleId = model2;
                        model = makeParts.slice(1).join(' ');
                    }

                    data.vehicles.push({
                        number: vehicleNum,
                        year: year,
                        make: make,
                        model: model,
                        id: vehicleId,
                        owner: data.insuredName,
                        state: ''
                    });

                    console.log(`Found vehicle: ${year} ${make} ${model} (${vehicleId})`);
                    i += 4; // Skip processed lines
                }
            }

            // Alternative vehicle parsing - look for lines with year make model pattern
            else if (line.match(/^(\d{4})\s+([\w\s]+)$/)) {
                const match = line.match(/^(\d{4})\s+([\w\s]+)$/);
                const year = match[1];
                const makeModel = match[2].trim();
                const parts = makeModel.split(/\s+/);

                if (parts.length >= 2) {
                    data.vehicles.push({
                        number: data.vehicles.length + 1,
                        year: year,
                        make: parts[0],
                        model: parts.slice(1).join(' '),
                        id: '',
                        owner: data.insuredName,
                        state: ''
                    });
                    console.log(`Found vehicle (alt): ${year} ${parts[0]} ${parts.slice(1).join(' ')}`);
                }
            }

            // Driver parsing
            else if (currentSection === 'drivers' && line.match(/^[A-Z]+$/)) {
                // Driver first name
                const firstName = line;
                const nextLine = lines[i + 1] || '';
                const afterNext = lines[i + 2] || '';
                const third = lines[i + 3] || '';

                if (nextLine.match(/^[A-Z\s]+$/)) {
                    data.drivers.push({
                        firstName: firstName,
                        lastName: nextLine,
                        relationship: afterNext,
                        age: third.match(/\d+/) ? third.match(/\d+/)[0] : '',
                        status: third.includes('Active') ? 'Active' : 'Inactive'
                    });
                    i += 3;
                }
            }

            // Coverage limits
            else if (line.match(/Combined Single Limit Liability \(CSL\)[:\s]*\$?(.+)/i)) {
                data.coverages.liability = line.match(/Combined Single Limit Liability \(CSL\)[:\s]*\$?(.+)/i)[1].trim();
            }
            else if (line.match(/Uninsured Motorist.*\(UMBI\)[:\s]*\$?(.+)/i)) {
                data.coverages.umbi = line.match(/Uninsured Motorist.*\(UMBI\)[:\s]*\$?(.+)/i)[1].trim();
            }
            else if (line.match(/Underinsured Motorist.*\(UIMBI\)[:\s]*\$?(.+)/i)) {
                data.coverages.uimbi = line.match(/Underinsured Motorist.*\(UIMBI\)[:\s]*\$?(.+)/i)[1].trim();
            }
            else if (line.match(/Medical Payments[:\s]*\$?(.+)/i)) {
                data.coverages.medPay = line.match(/Medical Payments[:\s]*\$?(.+)/i)[1].trim();
            }
            else if (line.match(/Motor Truck Cargo.*\(MTC\)[:\s]*(.+)/i)) {
                data.coverages.cargo = line.match(/Motor Truck Cargo.*\(MTC\)[:\s]*(.+)/i)[1].trim();
            }

            // Deductibles from vehicle coverage section
            else if (line.match(/\$(\d+,?\d*)\s+Not Included\s+\$(\d+,?\d*)/)) {
                const match = line.match(/\$(\d+,?\d*)\s+Not Included\s+\$(\d+,?\d*)/);
                data.coverages.compDeductible = match[1];
                data.coverages.collDeductible = match[2];
            }
        }

        console.log('Parsed policy data:', data);
        return data;
    }

    // Format date from various formats to YYYY-MM-DD
    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    }

    // Populate form fields with parsed data
    function populateFormFields(data) {
        // Check if we're in create mode or edit mode
        const isCreateMode = document.getElementById('initialPolicyForm') &&
                            document.getElementById('initialPolicyForm').style.display !== 'none';

        let fieldMappings;

        if (isCreateMode) {
            // Create New Policy modal field mappings
            fieldMappings = {
                'policyNumber': data.policyNumber,
                'policyType': mapPolicyType(data.businessClass),
                'carrier': mapCarrier(data.carrier || extractCarrierFromText()),
                'policyStatus': mapStatus(data.status),
                'effectiveDate': data.effectiveDate,
                'expirationDate': data.expirationDate
            };
        } else {
            // Edit Policy tabbed form field mappings
            fieldMappings = {
                // Overview tab
                'overview-policy-number': data.policyNumber,
                'overview-policy-type': mapPolicyType(data.businessClass) || 'commercial-auto',
                'overview-status': data.status,
                'overview-effective-date': data.effectiveDate,
                'overview-expiration-date': data.expirationDate,
                'overview-premium': data.premium,

                // Insured tab
                'insured-name': data.insuredName,

                // Contact tab
                'contact-phone': data.phone || data.mobilePhone,
                'contact-email': data.email,
                'contact-address': data.address,
                'contact-city': data.city,
                'contact-state': data.state,
                'contact-zip': data.zip,

                // Financial tab
                'financial-annual-premium': data.premium,

                // Coverage tab
                'coverage-liability': mapLiabilityCoverage(data.coverages.liability),
                'coverage-comp-deduct-personal': data.coverages.compDeductible,
                'coverage-coll-deduct-personal': data.coverages.collDeductible,
                'coverage-um-uim-personal': data.coverages.umbi
            };
        }

        let fieldsPopulated = 0;

        for (const [fieldId, value] of Object.entries(fieldMappings)) {
            if (value) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;

                    // Trigger change event for validation/updates
                    const event = new Event('change', { bubbles: true });
                    field.dispatchEvent(event);

                    fieldsPopulated++;
                }
            }
        }

        // Populate vehicles if any
        if (data.vehicles && data.vehicles.length > 0) {
            populateVehicles(data.vehicles);

            // Also add vehicle info to notes as backup
            setTimeout(() => {
                addVehicleInfoToNotes(data.vehicles);
            }, 1500);
        }

        // Populate drivers if any
        if (data.drivers && data.drivers.length > 0) {
            populateDrivers(data.drivers);

            // Also add driver info to notes as backup
            setTimeout(() => {
                addDriverInfoToNotes(data.drivers);
            }, 1600);
        }

        // Update coverage text fields if they exist
        populateCoverageTextFields(data.coverages);

        const summary = [];
        summary.push(`${fieldsPopulated} basic fields`);
        if (data.vehicles && data.vehicles.length > 0) {
            summary.push(`${data.vehicles.length} vehicle(s)`);
        }
        if (data.drivers && data.drivers.length > 0) {
            summary.push(`${data.drivers.length} driver(s)`);
        }
        if (data.coverages && Object.keys(data.coverages).length > 0) {
            summary.push('coverage details');
        }

        console.log(`QuickFill populated ${summary.join(', ')} in ${isCreateMode ? 'create' : 'edit'} mode`);
    }

    // Helper function to map business class to policy type
    function mapPolicyType(businessClass) {
        if (!businessClass) return '';

        const lowerClass = businessClass.toLowerCase();
        if (lowerClass.includes('trucking') || lowerClass.includes('transport') || lowerClass.includes('motor')) {
            return 'commercial-auto';
        }
        return '';
    }

    // Helper function to map carrier name
    function mapCarrier(carrierText) {
        if (!carrierText) return '';

        const lowerCarrier = carrierText.toLowerCase();
        if (lowerCarrier.includes('geico')) return 'GEICO';
        if (lowerCarrier.includes('progressive')) return 'Progressive';
        if (lowerCarrier.includes('state farm')) return 'State Farm';
        if (lowerCarrier.includes('allstate')) return 'Allstate';

        return 'Other';
    }

    // Helper function to map status
    function mapStatus(status) {
        if (!status) return '';

        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('inforce') || lowerStatus.includes('in force')) return 'in-force';
        if (lowerStatus.includes('active')) return 'active';
        if (lowerStatus.includes('pending')) return 'pending';

        return '';
    }

    // Helper function to extract carrier from text (for cases where carrier isn't explicitly labeled)
    function extractCarrierFromText() {
        // This could be enhanced to detect carrier names in the pasted text
        return '';
    }

    // Helper function to map liability coverage
    function mapLiabilityCoverage(liability) {
        if (!liability) return '';
        if (liability.includes('1,000,000')) return '1000000';
        if (liability.includes('500,000')) return '500000';
        return '';
    }

    // Populate vehicles section
    function populateVehicles(vehicles) {
        console.log(`Attempting to populate ${vehicles.length} vehicles:`, vehicles);

        try {
            // Switch to vehicles tab first
            const vehiclesTab = document.querySelector('[data-tab="vehicles"]');
            if (vehiclesTab) {
                vehiclesTab.click();

                setTimeout(() => {
                    vehicles.forEach((vehicle, index) => {
                        console.log(`Processing vehicle ${index}:`, vehicle);

                        // For the first vehicle, just fill existing fields
                        if (index === 0) {
                            fillVehicleFields(vehicle, index);
                        } else {
                            // Try to add a new vehicle
                            const addVehicleBtn = document.querySelector('#add-vehicle-btn, .add-vehicle-btn, [onclick*="addVehicle"], button[title*="vehicle"], button[aria-label*="vehicle"]');
                            console.log('Add vehicle button found:', addVehicleBtn);

                            if (addVehicleBtn) {
                                addVehicleBtn.click();

                                // Wait for the new vehicle form to appear
                                setTimeout(() => {
                                    fillVehicleFields(vehicle, index);
                                }, 300);
                            } else {
                                // Fallback: try to fill fields with indexed naming
                                fillVehicleFields(vehicle, index);
                            }
                        }
                    });

                    // Alternative approach: Look for any empty vehicle fields and populate them
                    setTimeout(() => {
                        populateAnyEmptyVehicleFields(vehicles);
                    }, 1000);
                }, 500);
            }
        } catch (error) {
            console.error('Error populating vehicles:', error);
        }
    }

    // Fallback method to populate any empty vehicle fields found on the page
    function populateAnyEmptyVehicleFields(vehicles) {
        const allVehicleYearFields = document.querySelectorAll('input[id*="year"], input[placeholder*="year"], select[id*="year"]');
        console.log(`Found ${allVehicleYearFields.length} year fields`);

        let vehicleIndex = 0;
        allVehicleYearFields.forEach(field => {
            if (!field.value && vehicleIndex < vehicles.length) {
                const vehicle = vehicles[vehicleIndex];

                // Get the field prefix (e.g., "vehicle-1" from "vehicle-1-year")
                const fieldId = field.id;
                const prefix = fieldId.replace(/-(year|make|model|vin).*$/, '');

                // Fill related fields
                const fields = {
                    [`${prefix}-year`]: vehicle.year,
                    [`${prefix}-make`]: vehicle.make,
                    [`${prefix}-model`]: vehicle.model,
                    [`${prefix}-vin`]: vehicle.id
                };

                for (const [id, value] of Object.entries(fields)) {
                    const targetField = document.getElementById(id);
                    if (targetField && !targetField.value && value) {
                        targetField.value = value;
                        const event = new Event('change', { bubbles: true });
                        targetField.dispatchEvent(event);
                        console.log(`Filled ${id} with ${value}`);
                    }
                }

                vehicleIndex++;
            }
        });
    }

    // Fill individual vehicle fields
    function fillVehicleFields(vehicle, index) {
        const prefix = index === 0 ? 'vehicles' : `vehicles-${index}`;

        const fields = {
            [`${prefix}-year`]: vehicle.year,
            [`${prefix}-make`]: vehicle.make,
            [`${prefix}-model`]: vehicle.model,
            [`${prefix}-vin`]: vehicle.id,
            'vehicle-year': vehicle.year,
            'vehicle-make': vehicle.make,
            'vehicle-model': vehicle.model,
            'vehicle-vin': vehicle.id
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId) || document.querySelector(`[id*="${fieldId}"]`);
            if (field && value) {
                field.value = value;
                const event = new Event('change', { bubbles: true });
                field.dispatchEvent(event);
            }
        }
    }

    // Populate drivers section
    function populateDrivers(drivers) {
        try {
            // Switch to drivers tab first
            const driversTab = document.querySelector('[data-tab="drivers"]');
            if (driversTab) {
                driversTab.click();

                setTimeout(() => {
                    drivers.forEach((driver, index) => {
                        // Try to add a new driver if this isn't the first one
                        if (index > 0) {
                            const addDriverBtn = document.querySelector('#add-driver-btn, .add-driver-btn, [onclick*="addDriver"]');
                            if (addDriverBtn) {
                                addDriverBtn.click();

                                setTimeout(() => {
                                    fillDriverFields(driver, index);
                                }, 300);
                            }
                        } else {
                            fillDriverFields(driver, index);
                        }
                    });
                }, 500);
            }
        } catch (error) {
            console.error('Error populating drivers:', error);
        }
    }

    // Fill individual driver fields
    function fillDriverFields(driver, index) {
        const prefix = index === 0 ? 'drivers' : `drivers-${index}`;

        const fields = {
            [`${prefix}-first-name`]: driver.firstName,
            [`${prefix}-last-name`]: driver.lastName,
            [`${prefix}-age`]: driver.age,
            'driver-first-name': driver.firstName,
            'driver-last-name': driver.lastName,
            'driver-age': driver.age
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId) || document.querySelector(`[id*="${fieldId}"]`);
            if (field && value) {
                field.value = value;
                const event = new Event('change', { bubbles: true });
                field.dispatchEvent(event);
            }
        }
    }

    // Populate coverage text fields (for free-form text fields)
    function populateCoverageTextFields(coverages) {
        if (!coverages) return;

        // Look for coverage text fields and populate them
        const coverageFields = {
            'liability-coverage': coverages.liability,
            'liability-limits': coverages.liability,
            'cargo-coverage': coverages.cargo,
            'medical-payments': coverages.medPay,
            'comp-deductible': coverages.compDeductible,
            'collision-deductible': coverages.collDeductible,
            'umbi-coverage': coverages.umbi,
            'uimbi-coverage': coverages.uimbi
        };

        for (const [fieldId, value] of Object.entries(coverageFields)) {
            if (value) {
                // Try multiple ways to find the field
                let field = document.getElementById(fieldId);
                if (!field) {
                    field = document.querySelector(`[id*="${fieldId}"]`);
                }
                if (!field) {
                    field = document.querySelector(`input[placeholder*="liability"], textarea[placeholder*="liability"]`);
                }

                if (field) {
                    field.value = value;
                    const event = new Event('change', { bubbles: true });
                    field.dispatchEvent(event);
                }
            }
        }

        // Try to populate any visible text areas with coverage information
        const textAreas = document.querySelectorAll('textarea[id*="coverage"], textarea[id*="limits"], input[id*="coverage"], textarea[placeholder*="coverage"], input[placeholder*="coverage"]');
        textAreas.forEach(textarea => {
            if (!textarea.value && coverages.liability) {
                const coverageText = [
                    coverages.liability ? `Liability: ${coverages.liability}` : '',
                    coverages.cargo ? `Cargo: ${coverages.cargo}` : '',
                    coverages.medPay ? `Medical: ${coverages.medPay}` : '',
                    coverages.umbi ? `UMBI: ${coverages.umbi}` : '',
                    coverages.uimbi ? `UIMBI: ${coverages.uimbi}` : '',
                    coverages.compDeductible ? `Comp Deductible: $${coverages.compDeductible}` : '',
                    coverages.collDeductible ? `Collision Deductible: $${coverages.collDeductible}` : ''
                ].filter(Boolean).join('\n');

                textarea.value = coverageText;
                const event = new Event('change', { bubbles: true });
                textarea.dispatchEvent(event);
                console.log(`Populated coverage textarea with: ${coverageText}`);
            }
        });
    }

    // Add vehicle information to notes section as fallback
    function addVehicleInfoToNotes(vehicles) {
        const notesField = document.getElementById('notes-content') ||
                          document.querySelector('textarea[id*="notes"]') ||
                          document.querySelector('textarea[placeholder*="notes"]');

        if (notesField && vehicles.length > 0) {
            const vehicleText = vehicles.map((vehicle, index) =>
                `Vehicle ${index + 1}: ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.id ? ` (VIN: ${vehicle.id})` : ''}`
            ).join('\n');

            const existingText = notesField.value || '';
            const newText = existingText ?
                `${existingText}\n\nVEHICLES:\n${vehicleText}` :
                `VEHICLES:\n${vehicleText}`;

            notesField.value = newText;
            const event = new Event('change', { bubbles: true });
            notesField.dispatchEvent(event);

            console.log('Added vehicle info to notes:', vehicleText);
        }
    }

    // Add driver information to notes section as fallback
    function addDriverInfoToNotes(drivers) {
        const notesField = document.getElementById('notes-content') ||
                          document.querySelector('textarea[id*="notes"]') ||
                          document.querySelector('textarea[placeholder*="notes"]');

        if (notesField && drivers.length > 0) {
            const driverText = drivers.map((driver, index) =>
                `Driver ${index + 1}: ${driver.firstName} ${driver.lastName}${driver.age ? ` (Age: ${driver.age})` : ''}`
            ).join('\n');

            const existingText = notesField.value || '';
            const newText = existingText ?
                `${existingText}\n\nDRIVERS:\n${driverText}` :
                `DRIVERS:\n${driverText}`;

            notesField.value = newText;
            const event = new Event('change', { bubbles: true });
            notesField.dispatchEvent(event);

            console.log('Added driver info to notes:', driverText);
        }
    }

    // Show success message
    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 99999999 !important;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize on page load and modal changes
    function observeModalChanges() {
        // Initial check
        setTimeout(initQuickFill, 500);

        // Watch for modal changes
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && (
                            node.id === 'policyModal' ||
                            node.querySelector && node.querySelector('#policyModal')
                        )) {
                            setTimeout(initQuickFill, 100);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start observing when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeModalChanges);
    } else {
        observeModalChanges();
    }

})();