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
            (!modalTitle.textContent.includes('Edit Policy') &&
             !modalTitle.textContent.includes('Create New Policy') &&
             !modalTitle.textContent.includes('Policy Details'))) {
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

    // Expose initQuickFill globally
    window.initQuickFill = initQuickFill;

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
            trailers: [], // FIXED: Initialize trailers array
            drivers: [],
            coverages: {},
            carrier: '', // Auto-detected carrier
            policyType: 'commercial-auto' // Always set to commercial
        };
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        // Auto-detect carrier from the text patterns
        data.carrier = detectCarrier(text);
        console.log('Auto-detected carrier:', data.carrier);

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

            // Policy Number - handle both explicit and implicit formats
            if (line.match(/Policy Number:\s*(.+)/i)) {
                data.policyNumber = line.match(/Policy Number:\s*(.+)/i)[1].trim();
            }
            // For Progressive, the policy number might be in the file name or not explicitly labeled
            // Look for patterns that might be policy numbers
            else if (!data.policyNumber && line.match(/^[A-Z]{2,3}\d{8,12}$/) && line.length >= 10) {
                data.policyNumber = line.trim();
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

            // Premium - Enhanced flexible parsing
            else if (line.match(/premium|total.*cost|annual.*cost/i)) {
                console.log('Checking premium line:', line);
                const nextLine = lines[i + 1] || '';
                let premium = null;

                // Check same line first for various patterns
                const patterns = [
                    /\$?([\d,]+\.?\d*)/,
                    /premium[:\s]*\$?([\d,]+\.?\d*)/i,
                    /cost[:\s]*\$?([\d,]+\.?\d*)/i
                ];

                for (const pattern of patterns) {
                    const match = line.match(pattern);
                    if (match && match[1]) {
                        premium = match[1].replace(/,/g, '');
                        break;
                    }
                }

                // If not found on same line, check next line
                if (!premium) {
                    const nextLineMatch = nextLine.match(/\$?([\d,]+\.?\d*)/);
                    if (nextLineMatch) {
                        premium = nextLineMatch[1].replace(/,/g, '');
                        i++; // Skip next line since we used it
                    }
                }

                if (premium && parseFloat(premium) > 100) { // Only accept reasonable premium amounts
                    data.premium = premium;
                    console.log('Found premium:', premium, 'from line:', line);
                }
            }

            // Business/Insured Name - handle both GEICO and Progressive formats
            else if (line.match(/Business Name[:\s]*(.+)/i)) {
                const businessName = line.match(/Business Name[:\s]*(.+)/i)[1].trim();
                if (businessName && businessName !== 'Business Name') {
                    data.insuredName = businessName;
                    data.businessName = businessName;
                }
            }
            // GEICO format: Direct business name line
            else if (!data.insuredName && line.match(/^[A-Z][A-Z\s'&.,\-]{10,}(?:LLC|INC|CORP|LTD|CO\.?)?\s*$/)) {
                // Look for lines that look like business names (all caps, long, with entity suffix)
                if (line.length > 10 && (line.includes('LLC') || line.includes('INC') || line.includes('CORP') || line.includes('SERVICES'))) {
                    data.insuredName = line.trim();
                    data.businessName = line.trim();
                }
            }
            // Progressive format: Company name after "Insured Information:"
            else if (line.match(/^[A-Z'][A-Z\s'&.,\-]{5,}(?:LLC|INC|CORP|LTD|CO\.?)?\s*$/i) && i > 0 && lines[i-1].includes('Insured Information:')) {
                data.insuredName = line.trim();
                data.businessName = line.trim();
            }

            // Email - handle both GEICO and Progressive formats
            else if (line.match(/Email[:\s]*(.+)/i)) {
                data.email = line.match(/Email[:\s]*(.+)/i)[1].trim();
            }
            // Progressive email format - standalone email address
            else if (line.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) && !data.email) {
                data.email = line.trim();
            }

            // Business Phone Number - more flexible matching for GEICO
            else if (line.match(/Business Phone Number[:\s]*(.+)/i)) {
                const phoneMatch = line.match(/Business Phone Number[:\s]*(.+)/i)[1].trim();
                // Only save if it looks like a phone number
                if (phoneMatch && phoneMatch.match(/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/)) {
                    data.phone = phoneMatch;
                }
            }
            // GEICO phone format - look for specific phone pattern lines
            else if (line.match(/^\((\d{3})\)\s*(\d{3})-(\d{4})$/) && !data.phone) {
                data.phone = line.trim();
            }
            // Progressive phone format - standalone phone number
            else if (line.match(/^\d{3}-\d{3}-\d{4}$/) && !data.phone) {
                data.phone = line.trim();
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

            // City, State ZIP pattern - handle both comma and space separated
            else if (line.match(/^([A-Z\s]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)) {
                const match = line.match(/^([A-Z\s]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
                data.city = match[1].trim().replace(/,$/, ''); // Remove trailing comma
                data.state = match[2].trim();
                data.zip = match[3].trim();
            }

            // Street address patterns (standalone address lines that aren't vehicles)
            else if (line.match(/^\d{3,5}\s+[A-Z\s]+(?:STREET|ST|AVENUE|AVE|BOULEVARD|BLVD|ROAD|RD|LANE|LN|DRIVE|DR|WAY|CIRCLE|CIR|TOWNSHIP|COURT|CT)\s*(?:\d+)?$/i)) {
                // This looks like a street address (starts with numbers, has street type)
                if (!data.address) {
                    data.address = line.trim();
                }
            }

            // City name on its own line (common in parsed text)
            else if (!data.city && line.match(/^[A-Z\s]{3,}$/) && !line.match(/LLC|INC|CORP|COMPANY/) &&
                     line.length < 30 && !line.includes('BUSINESS') && !line.includes('COVERAGE')) {
                // This could be a city name - but only if we don't already have one
                const possibleCity = line.trim();
                if (possibleCity.length >= 3 && possibleCity.length <= 25) {
                    data.city = possibleCity;
                }
            }

            // Business Class/Type
            else if (line.match(/Business Class[:\s]*(.+)/i)) {
                data.businessClass = line.match(/Business Class[:\s]*(.+)/i)[1].trim();
            }

            // Progressive-specific fields
            // USDOT Number
            else if (line.match(/USDOT Number[:\s]*(.+)/i)) {
                data.usdotNumber = line.match(/USDOT Number[:\s]*(.+)/i)[1].trim();
            }

            // Business Owner (Progressive format)
            else if (line.match(/Business Owner[:\s]*(.+)/i)) {
                data.businessOwner = line.match(/Business Owner[:\s]*(.+)/i)[1].trim();
            }

            // Agent Code (Progressive)
            else if (line.match(/Agent Code[:\s]*(.+)/i)) {
                data.agentCode = line.match(/Agent Code[:\s]*(.+)/i)[1].trim();
            }

            // Company/Carrier (Progressive format)
            else if (line.match(/Company[:\s]*(.+)/i) && !data.carrier) {
                const companyMatch = line.match(/Company[:\s]*(.+)/i)[1].trim();
                if (companyMatch.includes('Progressive')) {
                    data.carrier = 'Progressive';
                }
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

                    // FIXED: Detect if this is a trailer based on make/model content
                    const isTrailer = makeModel.toLowerCase().includes('trailer') ||
                                    model.toLowerCase().includes('trailer') ||
                                    make.toLowerCase().includes('trailer') ||
                                    makeModel.toLowerCase().includes('gooseneck') ||
                                    makeModel.toLowerCase().includes('utility') && model.toLowerCase().includes('trailer');

                    if (isTrailer) {
                        // Initialize trailers array if not exists
                        if (!data.trailers) {
                            data.trailers = [];
                        }

                        data.trailers.push({
                            number: vehicleNum,
                            year: year,
                            make: make,
                            model: model,
                            id: vehicleId,
                            type: 'trailer',
                            owner: data.insuredName,
                            state: ''
                        });

                        console.log(`Found trailer: ${year} ${make} ${model} (${vehicleId})`);
                    } else {
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
                    }
                    i += 4; // Skip processed lines
                }
            }

            // Progressive vehicle parsing - look for year make model patterns
            // Enhanced validation: must be reasonable year (1980-2030) and make must be automotive brand
            else if (line.match(/^(\d{4})\s+([\w\s]+)$/) && currentSection === 'vehicles') {
                const match = line.match(/^(\d{4})\s+([\w\s]+)$/);
                const year = match[1];
                const makeModel = match[2].trim();
                const parts = makeModel.split(/\s+/);

                // Validate year range (reasonable for vehicles)
                const yearNum = parseInt(year);
                const isValidYear = yearNum >= 1980 && yearNum <= 2030;

                // Common automotive makes (to filter out addresses)
                const commonMakes = ['PETERBILT', 'FREIGHTLINER', 'KENWORTH', 'MACK', 'VOLVO', 'INTERNATIONAL', 'FORD', 'CHEVROLET', 'GMC', 'DODGE', 'RAM', 'TOYOTA', 'HONDA', 'NISSAN', 'UTILITY', 'GREAT DANE', 'WABASH', 'TRAILER', 'SEMI'];
                const firstWord = parts[0]?.toUpperCase() || '';
                const isLikelyMake = commonMakes.includes(firstWord) || firstWord.includes('TRAILER') || parts.join(' ').includes('TRAILER');

                // Additional check: avoid parsing address-like patterns
                const looksLikeAddress = makeModel.match(/(?:STREET|ST|AVENUE|AVE|BOULEVARD|BLVD|ROAD|RD|LANE|LN|DRIVE|DR|WAY|CIRCLE|CIR|TOWNSHIP|COURT|CT)/i);

                console.log(`🚗 Checking potential vehicle: "${year} ${makeModel}" - Year valid: ${isValidYear}, Make valid: ${isLikelyMake}, Looks like address: ${!!looksLikeAddress}`);

                if (parts.length >= 2 && isValidYear && isLikelyMake && !looksLikeAddress) {
                    // Check if next line has body style info (Progressive format)
                    let bodyStyle = '';
                    let vin = '';

                    if (i + 1 < lines.length && lines[i + 1].match(/^Body Style:/)) {
                        bodyStyle = lines[i + 1].replace(/^Body Style:\s*/, '').trim();
                        i++; // Skip the body style line
                    }

                    if (i + 1 < lines.length && lines[i + 1].match(/^VIN:/)) {
                        vin = lines[i + 1].replace(/^VIN:\s*/, '').trim();
                        i++; // Skip the VIN line
                    }

                    // Extract garaging and other info if present
                    let garaging = '';
                    let radius = '';

                    if (i + 1 < lines.length && lines[i + 1].match(/^Garaging:/)) {
                        garaging = lines[i + 1].replace(/^Garaging:\s*/, '').trim();
                        i++; // Skip the garaging line
                    }

                    if (i + 1 < lines.length && lines[i + 1].match(/^Radius:/)) {
                        radius = lines[i + 1].replace(/^Radius:\s*/, '').trim();
                        i++; // Skip the radius line
                    }

                    // FIXED: Detect if this is a trailer based on make/model content
                    const fullModel = parts.slice(1).join(' ');
                    const isTrailer = fullModel.toLowerCase().includes('trailer') ||
                                    parts[0].toLowerCase().includes('trailer') ||
                                    makeModel.toLowerCase().includes('gooseneck') ||
                                    parts[0].toLowerCase().includes('utility') && fullModel.toLowerCase().includes('trailer') ||
                                    bodyStyle.toLowerCase().includes('trailer');

                    if (isTrailer) {
                        // Initialize trailers array if not exists
                        if (!data.trailers) {
                            data.trailers = [];
                        }

                        data.trailers.push({
                            number: (data.trailers.length || 0) + 1,
                            year: year,
                            make: parts[0],
                            model: fullModel,
                            bodyStyle: bodyStyle,
                            id: vin,
                            type: 'trailer',
                            owner: data.insuredName,
                            state: garaging,
                            radius: radius
                        });
                        console.log(`Found Progressive trailer: ${year} ${parts[0]} ${fullModel} (VIN: ${vin})`);
                    } else {
                        data.vehicles.push({
                            number: data.vehicles.length + 1,
                            year: year,
                            make: parts[0],
                            model: fullModel,
                            bodyStyle: bodyStyle,
                            id: vin,
                            owner: data.insuredName,
                            state: garaging,
                            radius: radius
                        });
                        console.log(`Found Progressive vehicle: ${year} ${parts[0]} ${fullModel} (VIN: ${vin})`);
                    }
                }
            }

            // Driver parsing - handle both GEICO and Progressive formats
            else if (currentSection === 'drivers' && line.match(/^[A-Z]+$/)) {
                // Driver first name (GEICO format)
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

            // Progressive driver parsing - look for full name patterns
            else if (line.match(/^([A-Z]+)\s+([A-Z\s]+)$/) &&
                     (i + 1 < lines.length && lines[i + 1].match(/^Date of Birth:|^License State:|^Progressive Points:/))) {
                const nameMatch = line.match(/^([A-Z]+)\s+([A-Z\s]+)$/);
                const firstName = nameMatch[1];
                const lastName = nameMatch[2].trim();

                // Look for additional driver info
                let dateOfBirth = '';
                let licenseState = '';
                let licenseNumber = '';
                let progressivePoints = '';

                // Parse following lines for driver details
                for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                    const driverInfoLine = lines[j];
                    if (driverInfoLine.match(/^Date of Birth:\s*(.+)/)) {
                        dateOfBirth = driverInfoLine.replace(/^Date of Birth:\s*/, '').trim();
                    } else if (driverInfoLine.match(/^License State:\s*(.+)/)) {
                        licenseState = driverInfoLine.replace(/^License State:\s*/, '').trim();
                    } else if (driverInfoLine.match(/^License:\s*(.+)/)) {
                        licenseNumber = driverInfoLine.replace(/^License:\s*/, '').trim();
                    } else if (driverInfoLine.match(/^Progressive Points:\s*(.+)/)) {
                        progressivePoints = driverInfoLine.replace(/^Progressive Points:\s*/, '').trim();
                    }
                }

                data.drivers.push({
                    firstName: firstName,
                    lastName: lastName,
                    dateOfBirth: dateOfBirth,
                    licenseState: licenseState,
                    licenseNumber: licenseNumber,
                    progressivePoints: progressivePoints,
                    status: 'Active'
                });
                console.log(`Found Progressive driver: ${firstName} ${lastName} (DOB: ${dateOfBirth})`);
            }

            // Coverage limits - Enhanced flexible parsing for multiple formats
            else if (line.match(/liability|Combined Single Limit|CSL|BI\/PD/i)) {
                console.log('Checking liability line:', line);
                // Look for dollar amount on same line or next line
                const nextLine = lines[i + 1] || '';
                let liability = null;

                // Check same line first
                const sameLineMatch = line.match(/\$?([\d,]+(?:\/\$?[\d,]+)?(?:,\$?[\d,]+)?)/);
                if (sameLineMatch) {
                    liability = sameLineMatch[1];
                } else {
                    // Check next line
                    const nextLineMatch = nextLine.match(/\$?([\d,]+(?:\/\$?[\d,]+)?(?:,\$?[\d,]+)?)/);
                    if (nextLineMatch) {
                        liability = nextLineMatch[1];
                        i++; // Skip next line since we used it
                    }
                }

                if (liability) {
                    data.coverages.liability = liability.includes('$') ? liability : '$' + liability;
                    console.log('Found liability coverage:', data.coverages.liability);
                }
            }
            else if (line.match(/uninsured.*motorist|umbi/i)) {
                console.log('Checking UMBI line:', line);
                const nextLine = lines[i + 1] || '';
                let umbi = null;

                const sameLineMatch = line.match(/\$?([\d,]+(?:\/\$?[\d,]+)?)/);
                if (sameLineMatch) {
                    umbi = sameLineMatch[1];
                } else {
                    const nextLineMatch = nextLine.match(/\$?([\d,]+(?:\/\$?[\d,]+)?)/);
                    if (nextLineMatch) {
                        umbi = nextLineMatch[1];
                        i++;
                    }
                }

                if (umbi) {
                    data.coverages.umbi = umbi.includes('$') ? umbi : '$' + umbi;
                    console.log('Found UMBI coverage:', data.coverages.umbi);
                }
            }
            else if (line.match(/underinsured.*motorist|uimbi/i)) {
                console.log('Checking UIMBI line:', line);
                const nextLine = lines[i + 1] || '';
                let uimbi = null;

                const sameLineMatch = line.match(/\$?([\d,]+(?:\/\$?[\d,]+)?)/);
                if (sameLineMatch) {
                    uimbi = sameLineMatch[1];
                } else {
                    const nextLineMatch = nextLine.match(/\$?([\d,]+(?:\/\$?[\d,]+)?)/);
                    if (nextLineMatch) {
                        uimbi = nextLineMatch[1];
                        i++;
                    }
                }

                if (uimbi) {
                    data.coverages.uimbi = uimbi.includes('$') ? uimbi : '$' + uimbi;
                    console.log('Found UIMBI coverage:', data.coverages.uimbi);
                }
            }
            else if (line.match(/medical.*payment|med.*pay/i)) {
                console.log('Checking medical line:', line);
                const nextLine = lines[i + 1] || '';
                let medPay = null;

                const sameLineMatch = line.match(/\$?([\d,]+)/);
                if (sameLineMatch) {
                    medPay = sameLineMatch[1];
                } else {
                    const nextLineMatch = nextLine.match(/\$?([\d,]+)/);
                    if (nextLineMatch) {
                        medPay = nextLineMatch[1];
                        i++;
                    }
                }

                if (medPay) {
                    data.coverages.medPay = medPay.includes('$') ? medPay : '$' + medPay;
                    console.log('Found medical payments:', data.coverages.medPay);
                }
            }
            else if (line.match(/cargo|motor.*truck.*cargo|mtc/i)) {
                console.log('🚛 Checking cargo line:', line);
                const nextLine = lines[i + 1] || '';
                console.log('🚛 Next line after cargo:', nextLine);
                let cargo = null;

                // Enhanced regex patterns to handle various cargo formats
                // Pattern 1: Check same line for short form first (highest priority)
                const sameLineShortMatch = line.match(/\$?(\d+)k\b/i);
                if (sameLineShortMatch) {
                    const shortValue = parseInt(sameLineShortMatch[1]);
                    cargo = (shortValue * 1000).toLocaleString(); // Convert 100k to 100,000
                    console.log('🚛 Found cargo short form on same line:', sameLineShortMatch[0], '-> converted to:', cargo);
                }

                // Pattern 2: Check next line for short form (second priority)
                if (!cargo) {
                    const nextLineShortMatch = nextLine.match(/\$?(\d+)k\b/i);
                    if (nextLineShortMatch) {
                        const shortValue = parseInt(nextLineShortMatch[1]);
                        cargo = (shortValue * 1000).toLocaleString(); // Convert 100k to 100,000
                        console.log('🚛 Found cargo short form on next line:', nextLineShortMatch[0], '-> converted to:', cargo);
                        i++; // Skip next line since we used it
                    }
                }

                // Pattern 3: Look for full dollar amounts (lowest priority)
                if (!cargo) {
                    const fullAmountMatch = line.match(/\$?([\d,]+(?:\.\d{2})?)/);
                    console.log('🚛 Same line full amount match:', fullAmountMatch);
                    if (fullAmountMatch) {
                        cargo = fullAmountMatch[1];
                        console.log('🚛 Found cargo full amount on same line:', cargo);
                    } else {
                        const nextLineMatch = nextLine.match(/\$?([\d,]+(?:\.\d{2})?)/);
                        console.log('🚛 Next line match:', nextLineMatch);
                        if (nextLineMatch) {
                            cargo = nextLineMatch[1];
                            console.log('🚛 Found cargo on next line:', cargo);
                            i++; // Skip next line since we used it
                        }
                    }
                }

                if (cargo && !data.coverages.cargo) { // Only set if not already set
                    data.coverages.cargo = cargo.includes('$') ? cargo : '$' + cargo;
                    console.log('🚛 Set cargo coverage:', data.coverages.cargo);
                } else if (cargo && data.coverages.cargo) {
                    console.log('🚛 Cargo already set to:', data.coverages.cargo, '- not overwriting with:', cargo);
                }
            }

            // Also try standalone dollar amount lines when in coverage section
            else if (currentSection === 'coverages' && line.match(/^\$?([\d,]+(?:\.\d{2})?)/)) {
                const amount = line.match(/^\$?([\d,]+(?:\.\d{2})?)/)[1];
                console.log('💰 Found standalone coverage amount in coverage section:', amount);

                // Map to coverage types based on context or order - but don't override existing values
                if (!data.coverages.liability && amount.includes('1,000,000')) {
                    data.coverages.liability = '$' + amount;
                    console.log('💰 Set liability from standalone amount:', data.coverages.liability);
                } else if (!data.coverages.umbi && amount.includes('75,000')) {
                    data.coverages.umbi = '$' + amount;
                    console.log('💰 Set UMBI from standalone amount:', data.coverages.umbi);
                } else if (!data.coverages.medPay && amount.includes('5,000')) {
                    data.coverages.medPay = '$' + amount;
                    console.log('💰 Set medical from standalone amount:', data.coverages.medPay);
                } else if (!data.coverages.cargo && amount.includes('100')) {
                    data.coverages.cargo = '$' + amount;
                    console.log('💰 Set cargo from standalone amount:', data.coverages.cargo);
                } else {
                    console.log('💰 Standalone amount not mapped:', amount);
                }
            }

            // Enhanced deductibles from vehicle coverage section - handle various patterns
            else if (line.match(/\$(\d+,?\d*)\s+Not Included\s+\$(\d+,?\d*)/)) {
                const match = line.match(/\$(\d+,?\d*)\s+Not Included\s+\$(\d+,?\d*)/);
                // Only set if not already found from other sources
                if (!data.coverages.compDeductible) {
                    data.coverages.compDeductible = match[1].replace(/,/g, '');
                }
                if (!data.coverages.collDeductible) {
                    data.coverages.collDeductible = match[2].replace(/,/g, '');
                }
                console.log('🚗 Found vehicle deductibles - Comp:', data.coverages.compDeductible, 'Coll:', data.coverages.collDeductible);
            }
            // Also handle patterns where both deductibles are the same (common in commercial auto)
            else if (currentSection === 'vehicle-coverages' && line.match(/^\$(\d+,?\d*)\s+(\$\d+,?\d*\s+)?Not Included/)) {
                const match = line.match(/^\$(\d+,?\d*)/);
                const deductible = match[1].replace(/,/g, '');
                if (!data.coverages.compDeductible && !data.coverages.collDeductible) {
                    data.coverages.compDeductible = deductible;
                    data.coverages.collDeductible = deductible;
                    console.log('🚗 Found matching vehicle deductibles:', deductible);
                }
            }

            // Enhanced cargo deductible parsing - handle format like "$100k/$2500 deductible"
            else if (line.includes('deductible') && (line.includes('k/') || line.includes('K/'))) {
                console.log('🚛 Checking cargo deductible line:', line);
                // Look for patterns like "$100k/$2500 deductible"
                const cargoDeductMatch = line.match(/\$?\d+k?\s*\/\s*\$?(\d+,?\d*)\s+deductible/i);
                if (cargoDeductMatch) {
                    data.coverages.cargoDeductible = cargoDeductMatch[1].replace(/,/g, '');
                    console.log('🚛 Found cargo deductible from combined format:', data.coverages.cargoDeductible);
                }
            }
            // Fallback: Parse cargo deductible from separate cargo line
            else if (data.coverages.cargo && line.includes('deductible') && line.match(/\$(\d+)/)) {
                const deductibleMatch = line.match(/\$(\d+)/);
                if (deductibleMatch && !data.coverages.cargoDeductible) { // Only if not already found
                    data.coverages.cargoDeductible = deductibleMatch[1];
                    console.log('Found cargo deductible:', data.coverages.cargoDeductible);
                }
            }
        }

        // Post-processing: Apply business logic for missing standard coverages
        applyStandardCoverageLogic(data);

        console.log('📋 Coverage data parsed:', data.coverages);
        console.log('Parsed policy data:', data);
        return data;
    }

    // Apply standard coverage business logic for commercial auto policies
    function applyStandardCoverageLogic(data) {
        if (!data.coverages) data.coverages = {};

        console.log('🔧 Applying standard coverage logic...');

        // Auto-set General Aggregate based on liability limits (industry standard)
        if (data.coverages.liability && !data.coverages.generalAggregate) {
            const liabilityAmount = data.coverages.liability.replace(/[$,]/g, '');
            if (liabilityAmount.includes('1,000,000') || liabilityAmount.includes('1000000')) {
                data.coverages.generalAggregate = '$2,000,000';
                console.log('🔧 Auto-set General Aggregate to $2M (liability is $1M)');
            } else if (liabilityAmount.includes('2,000,000') || liabilityAmount.includes('2000000')) {
                data.coverages.generalAggregate = '$4,000,000';
                console.log('🔧 Auto-set General Aggregate to $4M (liability is $2M)');
            } else if (liabilityAmount.includes('5,000,000') || liabilityAmount.includes('5000000')) {
                data.coverages.generalAggregate = '$10,000,000';
                console.log('🔧 Auto-set General Aggregate to $10M (liability is $5M)');
            }
        }

        // Set standard deductibles if vehicles show coverage but no deductibles specified
        if (data.vehicles && data.vehicles.length > 0 &&
            (!data.coverages.compDeductible || !data.coverages.collDeductible)) {

            // Look for common commercial auto deductible patterns
            if (!data.coverages.compDeductible) {
                data.coverages.compDeductible = '2500'; // Common commercial auto comprehensive deductible
                console.log('🔧 Auto-set Comprehensive deductible to $2,500 (commercial auto standard)');
            }
            if (!data.coverages.collDeductible) {
                data.coverages.collDeductible = '2500'; // Common commercial auto collision deductible
                console.log('🔧 Auto-set Collision deductible to $2,500 (commercial auto standard)');
            }
        }

        // Set standard cargo deductible if cargo coverage exists but no deductible
        if (data.coverages.cargo && !data.coverages.cargoDeductible) {
            data.coverages.cargoDeductible = '2500'; // Standard cargo deductible
            console.log('🔧 Auto-set Cargo deductible to $2,500 (standard)');
        }

        console.log('✅ Standard coverage logic applied');
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
        // Check if we're in create mode (old initial form) or edit mode (tabbed form)
        const isCreateMode = document.getElementById('initialPolicyForm') &&
                            document.getElementById('initialPolicyForm').style.display !== 'none';

        // Check if we're in the new direct tabbed form mode
        const isTabbedMode = document.getElementById('overview-content') ||
                           document.querySelector('.tab-content.active');

        console.log('PopulateFormFields called, isCreateMode:', isCreateMode, 'isTabbedMode:', isTabbedMode);
        console.log('Available form fields:', Array.from(document.querySelectorAll('input, select')).map(f => f.id));

        let fieldMappings;

        if (isCreateMode) {
            // Old create mode - shouldn't be used anymore but keep for compatibility
            fieldMappings = {
                'policyNumber': data.policyNumber,
                'policyType': 'commercial-auto', // Always set to commercial
                'carrier': data.carrier, // Use auto-detected carrier
                'policyStatus': mapStatus(data.status) || 'active',
                'effectiveDate': data.effectiveDate,
                'expirationDate': data.expirationDate
            };
            console.log('Create mode field mappings:', fieldMappings);
        } else if (isTabbedMode) {
            // New tabbed mode - this is now the primary mode
            // Edit Policy tabbed form field mappings
            fieldMappings = {
                // Overview tab
                'overview-policy-number': data.policyNumber,
                'overview-policy-type': 'commercial-auto', // Always set to commercial
                'overview-carrier': data.carrier, // Use auto-detected carrier
                'overview-status': mapStatus(data.status) || 'active',
                'overview-effective-date': data.effectiveDate,
                'overview-expiration-date': data.expirationDate,
                'overview-premium': data.premium,
                'overview-dot-number': data.usdotNumber,

                // Insured tab
                'insured-name': data.insuredName || data.businessName,

                // Contact tab
                'contact-phone': data.phone || data.mobilePhone,
                'contact-email': data.email,
                'contact-address': data.address,
                'contact-city': data.city,
                'contact-state': data.state,
                'contact-zip': data.zip,

                // Financial tab
                'financial-annual-premium': data.premium,
                'overview-premium': data.premium,

                // Coverage tab - map to proper field names and values (both text and dropdown)
                'coverage-liability-limits': mapLiabilityCoverage(data.coverages.liability),
                'coverage-liability-limits-text': data.coverages.liability || '',
                'coverage-general-aggregate': mapGeneralAggregate(data.coverages.generalAggregate),
                'coverage-general-aggregate-text': data.coverages.generalAggregate || '',
                'coverage-comp-deduct': mapDeductible(data.coverages.compDeductible),
                'coverage-comp-deduct-text': data.coverages.compDeductible ? `$${data.coverages.compDeductible}` : '',
                'coverage-coll-deduct': mapDeductible(data.coverages.collDeductible),
                'coverage-coll-deduct-text': data.coverages.collDeductible ? `$${data.coverages.collDeductible}` : '',
                'coverage-um-uim': mapLiabilityLimit(data.coverages.umbi),
                'coverage-um-uim-text': data.coverages.umbi || '',
                'coverage-medical': mapMedicalPayments(data.coverages.medPay),
                'coverage-medical-text': data.coverages.medPay || '',
                'coverage-cargo-limit': mapCargoLimit(data.coverages.cargo),
                'coverage-cargo-limit-text': data.coverages.cargo || '',
                'coverage-cargo-deduct': mapDeductible(data.coverages.cargoDeductible),
                'coverage-cargo-deduct-text': data.coverages.cargoDeductible ? `$${data.coverages.cargoDeductible}` : '',
                'coverage-trailer-interchange': mapTrailerInterchange(data.coverages.trailerInterchange),
                'coverage-trailer-interchange-text': data.coverages.trailerInterchange || '',
                'coverage-non-trucking': mapNonTrucking(data.coverages.nonTrucking),
                'coverage-non-trucking-text': data.coverages.nonTrucking || ''
            };
            console.log('Tabbed mode field mappings:', fieldMappings);
        } else {
            // Fallback to tabbed mode field mappings as default
            fieldMappings = {
                // Overview tab
                'overview-policy-number': data.policyNumber,
                'overview-policy-type': 'commercial-auto',
                'overview-carrier': data.carrier,
                'overview-status': mapStatus(data.status) || 'active',
                'overview-effective-date': data.effectiveDate,
                'overview-expiration-date': data.expirationDate,
                'overview-premium': data.premium,
                'overview-dot-number': data.usdotNumber,
                'insured-name': data.insuredName,
                'contact-phone': data.phone || data.mobilePhone,
                'contact-email': data.email,
                'contact-address': data.address,
                'contact-city': data.city,
                'contact-state': data.state,
                'contact-zip': data.zip,
                'financial-annual-premium': data.premium
            };
            console.log('Fallback field mappings:', fieldMappings);
        }

        let fieldsPopulated = 0;

        for (const [fieldId, value] of Object.entries(fieldMappings)) {
            if (value !== undefined && value !== null && value !== '') {
                let field = document.getElementById(fieldId);
                console.log(`Trying to populate field ${fieldId} with value:`, value, 'Field found:', !!field);

                if (field) {
                    // Handle different field types
                    if (field.tagName === 'SELECT') {
                        // For select fields, try to find matching option
                        const options = Array.from(field.options);
                        let matchedOption = options.find(opt =>
                            opt.value === value ||
                            opt.text.toLowerCase().includes(value.toLowerCase()) ||
                            opt.value.toLowerCase().includes(value.toLowerCase())
                        );

                        if (matchedOption) {
                            field.value = matchedOption.value;
                            console.log(`✅ Set select field ${fieldId} to:`, matchedOption.value);
                        } else {
                            // Try to create and add the option if it doesn't exist
                            const newOption = document.createElement('option');
                            newOption.value = value;
                            newOption.text = value;
                            field.appendChild(newOption);
                            field.value = value;
                            console.log(`✅ Added and selected new option for ${fieldId}:`, value);
                        }
                    } else {
                        // For input fields
                        field.value = value;
                        console.log(`✅ Set input field ${fieldId} to:`, value);
                    }

                    // Trigger multiple events for better framework compatibility
                    const changeEvent = new Event('change', { bubbles: true });
                    field.dispatchEvent(changeEvent);

                    const inputEvent = new Event('input', { bubbles: true });
                    field.dispatchEvent(inputEvent);

                    // Also trigger blur event to ensure validation
                    const blurEvent = new Event('blur', { bubbles: true });
                    field.dispatchEvent(blurEvent);

                    // Force a visual update
                    field.setAttribute('value', field.value);

                    fieldsPopulated++;
                } else {
                    console.log(`❌ Field ${fieldId} not found in DOM`);
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

        // Populate trailers if any
        if (data.trailers && data.trailers.length > 0) {
            populateTrailers(data.trailers);

            // Also add trailer info to notes as backup
            setTimeout(() => {
                addTrailerInfoToNotes(data.trailers);
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

        // Debug premium and coverage field population
        console.log('💰 Premium value being mapped:', data.premium);
        console.log('🔍 Debugging coverage field population...');
        const coverageFields = [
            'coverage-liability-limits',
            'coverage-comp-deduct',
            'coverage-coll-deduct',
            'coverage-medical',
            'coverage-um-uim',
            'coverage-cargo-limit',
            'coverage-cargo-deduct'
        ];

        coverageFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const mappedValue = fieldMappings[fieldId];
            console.log(`Coverage field ${fieldId}:`, {
                fieldFound: !!field,
                mappedValue: mappedValue,
                fieldOptions: field ? Array.from(field.options).map(opt => opt.value) : 'N/A'
            });

            // Force populate coverage fields if they exist
            if (field && mappedValue && field.tagName === 'SELECT') {
                // Try exact match first
                let optionFound = false;
                for (let option of field.options) {
                    if (option.value === mappedValue) {
                        field.value = mappedValue;
                        optionFound = true;
                        console.log(`✅ Exact match for ${fieldId}: ${mappedValue}`);
                        break;
                    }
                }

                // If no exact match, try partial matches
                if (!optionFound) {
                    for (let option of field.options) {
                        if (option.value.includes(mappedValue) || mappedValue.includes(option.value)) {
                            field.value = option.value;
                            console.log(`✅ Partial match for ${fieldId}: ${option.value}`);
                            break;
                        }
                    }
                }

                // Trigger change event
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Debug premium field population specifically
        const premiumFields = ['financial-annual-premium', 'overview-premium'];
        premiumFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            console.log(`💰 Premium field ${fieldId}:`, {
                fieldFound: !!field,
                currentValue: field ? field.value : 'N/A',
                mappedValue: fieldMappings[fieldId]
            });

            if (field && fieldMappings[fieldId]) {
                field.value = fieldMappings[fieldId];
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`✅ Set ${fieldId} to: ${fieldMappings[fieldId]}`);
            }
        });

        // Update coverage text fields if they exist
        populateCoverageTextFields(data.coverages);

        // Add all parsed data to notes as backup
        addParsedDataToNotes(data);

        const summary = [];
        summary.push(`${fieldsPopulated} basic fields`);
        if (data.vehicles && data.vehicles.length > 0) {
            summary.push(`${data.vehicles.length} vehicle(s)`);
        }
        if (data.trailers && data.trailers.length > 0) {
            summary.push(`${data.trailers.length} trailer(s)`);
        }
        if (data.drivers && data.drivers.length > 0) {
            summary.push(`${data.drivers.length} driver(s)`);
        }
        if (data.coverages && Object.keys(data.coverages).length > 0) {
            summary.push('coverage details');
        }

        console.log(`QuickFill populated ${summary.join(', ')} in ${isCreateMode ? 'create' : 'edit'} mode`);

        // Force UI refresh after population
        setTimeout(() => {
            console.log('🔄 Forcing UI refresh to ensure visual updates');

            // Force field value visibility update
            for (const [fieldId, value] of Object.entries(fieldMappings)) {
                if (value !== undefined && value !== null && value !== '') {
                    const field = document.getElementById(fieldId);
                    if (field && field.value) {
                        // Force visual update by triggering focus and blur
                        field.focus();
                        field.blur();

                        // Update the attribute to ensure rendering
                        field.setAttribute('value', field.value);
                    }
                }
            }

            // Switch tabs to force refresh
            const currentTab = document.querySelector('.tab-nav a.active');
            const overviewTab = document.querySelector('[data-tab="overview"]');
            if (overviewTab && currentTab !== overviewTab) {
                overviewTab.click();
                setTimeout(() => {
                    if (currentTab) {
                        currentTab.click();
                    }
                }, 200);
            }

            console.log('✅ UI refresh completed');
        }, 1500);
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

    // Auto-detect carrier based on specific patterns in policy text
    function detectCarrier(text) {
        const upperText = text.toUpperCase();

        // GEICO patterns - check for multiple GEICO-specific indicators
        const geicoIndicators = [
            'ELECTRONIC FUNDS TRANSFER (EFT) PROGRAM',
            'CHANGE YOUR BANK ACCOUNT INFORMATION',
            'BUSINESS INFORMATION',
            'FILING ADDED',
            'FILINGS INFORMATION',
            'ADDITIONAL INTERESTS (AI/DI/COI)',
            'POLICY COVERAGES - FOR THE INSURED AND OTHERS',
            'COMBINED SINGLE LIMIT LIABILITY (CSL)',
            'MOTOR TRUCK CARGO (MTC)',
            'FILING ADDED',
            'ACTIVE STATE AND/OR FEDERAL FILINGS'
        ];

        // Progressive patterns - check for Progressive-specific structure
        const progressiveIndicators = [
            'POLICY DETAILS',
            'INSURED INFORMATION:',
            'BUSINESS INFORMATION:',
            'BUSINESS OWNER:',
            'USDOT NUMBER:',
            'RATING INFORMATION:',
            'CHANNEL: AGENCY',
            'AGENT CODE:',
            'COMPANY:',
            'NAIC:',
            'RATE REVISION:',
            'PROGRESSIVE PREFERRED INSURANCE CO',
            'PROGRESSIVE POINTS:',
            'COVERED PROPERTY (VEHICLES)',
            'VEHICLE GROUPS:',
            'GARAGING:',
            'RADIUS:',
            'AUTO INSURANCE HISTORY',
            'CONTINUOUS COVERAGE INDICATOR:',
            'BLANKET ADDITIONAL INSURED ENDORSEMENT',
            'BLANKET WAIVER OF SUBROGATION ENDORSEMENT',
            'POLICY ATTACHMENTS'
        ];

        // Count indicators for each carrier
        let geicoScore = 0;
        let progressiveScore = 0;

        geicoIndicators.forEach(indicator => {
            if (upperText.includes(indicator)) {
                geicoScore++;
            }
        });

        progressiveIndicators.forEach(indicator => {
            if (upperText.includes(indicator)) {
                progressiveScore++;
            }
        });

        // Also check for explicit carrier mentions
        if (upperText.includes('GEICO')) geicoScore += 3;
        if (upperText.includes('PROGRESSIVE')) progressiveScore += 3;

        console.log(`Carrier detection scores - GEICO: ${geicoScore}, Progressive: ${progressiveScore}`);

        // Determine carrier based on scores (need at least 3 indicators to be confident)
        if (geicoScore >= 3 && geicoScore > progressiveScore) {
            return 'GEICO';
        } else if (progressiveScore >= 3 && progressiveScore > geicoScore) {
            return 'Progressive';
        } else if (upperText.includes('STATE FARM')) {
            return 'State Farm';
        } else if (upperText.includes('ALLSTATE')) {
            return 'Allstate';
        } else if (upperText.includes('LIBERTY MUTUAL')) {
            return 'Liberty Mutual';
        } else if (upperText.includes('NATIONWIDE')) {
            return 'Nationwide';
        } else if (upperText.includes('FARMERS')) {
            return 'Farmers';
        } else if (upperText.includes('USAA')) {
            return 'USAA';
        } else if (upperText.includes('TRAVELERS')) {
            return 'Travelers';
        }

        return '';
    }

    // Helper function to extract carrier from text (for cases where carrier isn't explicitly labeled)
    function extractCarrierFromText() {
        // This is now handled by detectCarrier function above
        return '';
    }

    // Helper function to map liability coverage
    function mapLiabilityCoverage(liability) {
        if (!liability) return '';
        const upper = liability.toUpperCase();

        // Common liability limits mapping
        if (upper.includes('1,000,000') || upper.includes('$1,000,000')) return '1000000';
        if (upper.includes('500,000') || upper.includes('$500,000')) return '500000';
        if (upper.includes('750,000') || upper.includes('$750,000')) return '750000';
        if (upper.includes('2,000,000') || upper.includes('$2,000,000')) return '2000000';
        if (upper.includes('5,000,000') || upper.includes('$5,000,000')) return '5000000';

        return '';
    }

    // Helper function to map deductible values
    function mapDeductible(deductible) {
        if (!deductible) return '';
        const upper = deductible.toUpperCase().replace(/[$,]/g, '');

        // Common deductible amounts
        if (upper.includes('2500') || upper === '2500') return '2500';
        if (upper.includes('1000') || upper === '1000') return '1000';
        if (upper.includes('500') || upper === '500') return '500';
        if (upper.includes('5000') || upper === '5000') return '5000';
        if (upper.includes('10000') || upper === '10000') return '10000';

        return '';
    }

    // Helper function to map medical payments
    function mapMedicalPayments(medPay) {
        if (!medPay) return '';
        const upper = medPay.toUpperCase().replace(/[$,]/g, '');

        // Common medical payment limits
        if (upper.includes('5000') || upper === '5000') return '5000';
        if (upper.includes('10000') || upper === '10000') return '10000';
        if (upper.includes('25000') || upper === '25000') return '25000';
        if (upper.includes('50000') || upper === '50000') return '50000';

        return '';
    }

    // Helper function to map cargo limits
    function mapCargoLimit(cargo) {
        if (!cargo) return '';
        const upper = cargo.toUpperCase().replace(/[$,]/g, '');

        // Common cargo limits
        if (upper.includes('5000') || upper.includes('5K')) return '5000';
        if (upper.includes('10000') || upper.includes('10K')) return '10000';
        if (upper.includes('25000') || upper.includes('25K')) return '25000';
        if (upper.includes('50000') || upper.includes('50K')) return '50000';
        if (upper.includes('100000') || upper.includes('100K')) return '100000';

        return '';
    }

    // Helper function to map UM/UIM limits
    function mapLiabilityLimit(limit) {
        if (!limit) return '';
        const upper = limit.toUpperCase().replace(/[$,]/g, '');

        // Common UM/UIM limits
        if (upper.includes('75000') || upper.includes('75,000')) return '75000';
        if (upper.includes('100000') || upper.includes('100,000')) return '100000';
        if (upper.includes('250000') || upper.includes('250,000')) return '250000';
        if (upper.includes('500000') || upper.includes('500,000')) return '500000';

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

                // Process vehicles sequentially with proper delays
                let processingDelay = 500;
                vehicles.forEach((vehicle, index) => {
                    setTimeout(() => {
                        console.log(`🚗 Processing vehicle ${index + 1} of ${vehicles.length}:`, vehicle);

                        const addVehicleBtn = document.querySelector('button[onclick*="addVehicle"], .btn-secondary[onclick*="addVehicle"]');
                        if (addVehicleBtn) {
                            console.log(`🚗 Clicking add vehicle button for vehicle ${index + 1}`);
                            addVehicleBtn.click();

                            // Wait longer for DOM to be ready, then populate
                            setTimeout(() => {
                                fillLatestVehicleFields(vehicle, index);

                                // Force focus to ensure fields are visible
                                const vehiclesList = document.getElementById('vehiclesList');
                                if (vehiclesList && vehiclesList.children.length > 0) {
                                    const latestVehicle = vehiclesList.lastElementChild;
                                    const firstInput = latestVehicle.querySelector('input');
                                    if (firstInput) {
                                        firstInput.focus();
                                        firstInput.blur();
                                    }
                                }
                            }, 600);
                        }
                    }, processingDelay + (index * 800)); // Stagger each vehicle by 800ms
                });

                // Final fallback check after all vehicles should be processed
                setTimeout(() => {
                    console.log('🔍 Running final vehicle population check...');
                    populateAnyEmptyVehicleFields(vehicles);
                }, processingDelay + (vehicles.length * 800) + 1000);
            }
        } catch (error) {
            console.error('Error populating vehicles:', error);
        }
    }

    // Enhanced fallback method to populate any empty vehicle fields found on the page
    function populateAnyEmptyVehicleFields(vehicles) {
        console.log(`🔍 Looking for empty vehicle fields to populate with ${vehicles.length} vehicles`);

        // Look for vehicle input fields by multiple criteria
        const allVehicleFields = document.querySelectorAll(`
            input[placeholder*="Year"], input[placeholder*="year"],
            input[placeholder*="Make"], input[placeholder*="make"],
            input[placeholder*="Model"], input[placeholder*="model"],
            input[placeholder*="VIN"], input[placeholder*="vin"]
        `);

        console.log(`🔍 Found ${allVehicleFields.length} vehicle input fields on page`);

        // Group fields by their parent containers (each vehicle form)
        const vehicleContainers = [];
        allVehicleFields.forEach(field => {
            const container = field.closest('.form-row, .vehicle-form, [class*="vehicle"]') || field.parentElement?.parentElement;
            if (container && !vehicleContainers.includes(container)) {
                vehicleContainers.push(container);
            }
        });

        console.log(`🔍 Found ${vehicleContainers.length} vehicle form containers`);

        // Populate each container with corresponding vehicle data
        vehicleContainers.forEach((container, containerIndex) => {
            if (containerIndex < vehicles.length) {
                const vehicle = vehicles[containerIndex];
                console.log(`🚗 Populating container ${containerIndex + 1} with:`, vehicle);

                const yearField = container.querySelector('input[placeholder*="ear" i]');
                const makeField = container.querySelector('input[placeholder*="ake" i]');
                const modelField = container.querySelector('input[placeholder*="odel" i]');
                const vinField = container.querySelector('input[placeholder*="in" i], input[placeholder*="vin" i]');

                if (yearField && !yearField.value && vehicle.year) {
                    yearField.value = vehicle.year;
                    yearField.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Set year: ${vehicle.year}`);
                }
                if (makeField && !makeField.value && vehicle.make) {
                    makeField.value = vehicle.make;
                    makeField.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Set make: ${vehicle.make}`);
                }
                if (modelField && !modelField.value && vehicle.model) {
                    modelField.value = vehicle.model;
                    modelField.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Set model: ${vehicle.model}`);
                }
                if (vinField && !vinField.value && vehicle.id) {
                    vinField.value = vehicle.id;
                    vinField.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Set VIN: ${vehicle.id}`);
                }
            }
        });

        // Additional fallback: try by field order if containers approach didn't work
        if (vehicleContainers.length === 0) {
            console.log('🔄 No containers found, trying direct field matching...');
            const yearFields = document.querySelectorAll('input[placeholder*="Year" i], input[placeholder*="year" i]');
            yearFields.forEach((yearField, index) => {
                if (index < vehicles.length && !yearField.value) {
                    const vehicle = vehicles[index];
                    yearField.value = vehicle.year;
                    yearField.dispatchEvent(new Event('change', { bubbles: true }));

                    // Try to find related fields in the same parent
                    const parent = yearField.parentElement?.parentElement || yearField.parentElement;
                    const makeField = parent?.querySelector('input[placeholder*="ake" i]');
                    const modelField = parent?.querySelector('input[placeholder*="odel" i]');
                    const vinField = parent?.querySelector('input[placeholder*="in" i]');

                    if (makeField && !makeField.value) makeField.value = vehicle.make;
                    if (modelField && !modelField.value) modelField.value = vehicle.model;
                    if (vinField && !vinField.value) vinField.value = vehicle.id;

                    console.log(`✅ Direct field fill for vehicle ${index + 1}:`, vehicle);
                }
            });
        }
    }

    // Fill the latest vehicle fields (for newly added vehicles)
    function fillLatestVehicleFields(vehicle, index) {
        console.log(`Filling latest vehicle fields for vehicle ${index}:`, vehicle);

        // Get the last vehicle entry added
        const vehiclesList = document.getElementById('vehiclesList');
        if (vehiclesList && vehiclesList.children.length > 0) {
            const latestVehicleEntry = vehiclesList.lastElementChild;
            const inputs = latestVehicleEntry.querySelectorAll('input');

            console.log(`Found ${inputs.length} input fields in latest vehicle entry`);

            // Map vehicle data to input fields by placeholder
            inputs.forEach((input, inputIndex) => {
                const placeholder = input.placeholder.toLowerCase();
                let value = '';

                if (placeholder.includes('year')) {
                    value = vehicle.year;
                } else if (placeholder.includes('make')) {
                    value = vehicle.make;
                } else if (placeholder.includes('model')) {
                    value = vehicle.model;
                } else if (placeholder.includes('vin')) {
                    value = vehicle.id || vehicle.vin;
                } else if (placeholder.includes('value')) {
                    value = vehicle.value || '';
                }

                if (value) {
                    input.value = value;
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                    console.log(`Set ${placeholder} to: ${value}`);
                }
            });
        }
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
        console.log('🚗 Starting driver population for', drivers.length, 'drivers');
        try {
            // Switch to drivers tab first
            const driversTab = document.querySelector('[data-tab="drivers"]');
            if (driversTab) {
                driversTab.click();

                setTimeout(() => {
                    drivers.forEach((driver, index) => {
                        console.log(`Adding driver ${index}:`, driver);

                        // Always try to add a new driver using the Add Driver button
                        const addDriverBtn = document.querySelector('button[onclick*="addDriver"], .btn-secondary[onclick*="addDriver"]');
                        console.log('Add driver button found:', addDriverBtn);

                        if (addDriverBtn) {
                            addDriverBtn.click();

                            // Wait for the new driver form to appear, then populate it
                            setTimeout(() => {
                                fillLatestDriverFields(driver, index);
                            }, 300);
                        } else {
                            // Fallback to old method
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

    // Fill the latest driver fields (for newly added drivers)
    function fillLatestDriverFields(driver, index) {
        console.log(`Filling latest driver fields for driver ${index}:`, driver);

        // Get the last driver entry added
        const driversList = document.getElementById('driversList');
        if (driversList && driversList.children.length > 0) {
            const latestDriverEntry = driversList.lastElementChild;
            const inputs = latestDriverEntry.querySelectorAll('input, select');

            console.log(`Found ${inputs.length} input fields in latest driver entry`);

            // Map driver data to input fields by placeholder or type
            inputs.forEach((input, inputIndex) => {
                const placeholder = (input.placeholder || '').toLowerCase();
                const inputType = input.type;
                let value = '';

                if (placeholder.includes('name') || placeholder.includes('full')) {
                    value = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
                } else if (placeholder.includes('birth') || inputType === 'date') {
                    value = driver.dateOfBirth || driver.dob || '';
                } else if (placeholder.includes('license')) {
                    value = driver.licenseNumber || driver.license || '';
                } else if (input.tagName === 'SELECT' && (placeholder.includes('type') || placeholder.includes('relationship'))) {
                    value = driver.relationship || driver.type || 'owner-operator';
                }

                if (value) {
                    input.value = value;
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                    console.log(`Set driver ${placeholder || inputType} to: ${value}`);
                }
            });
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

        // DISABLED: This was causing all coverage text fields to be filled with the complete summary
        // instead of individual values. The specific field mappings above handle this properly.
        /*
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
        */
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

    // Populate trailers section
    function populateTrailers(trailers) {
        console.log(`Attempting to populate ${trailers.length} trailers:`, trailers);

        try {
            // Ensure we're on the vehicles tab where trailers are located
            const vehiclesTab = document.querySelector('[data-tab="vehicles"]');
            if (vehiclesTab) {
                vehiclesTab.click();
                console.log('🚛 Switched to vehicles tab for trailer population');
            }

            // Process trailers sequentially with proper delays
            let processingDelay = 1000; // Increased delay to ensure vehicles tab loads
            trailers.forEach((trailer, index) => {
                setTimeout(() => {
                    console.log(`🚛 Processing trailer ${index + 1} of ${trailers.length}:`, trailer);

                    // Try multiple approaches to find the add trailer button
                    let addTrailerBtn = document.querySelector('button[onclick*="addTrailer"]') ||
                                       document.querySelector('button[onclick*="Trailer"]') ||
                                       document.querySelector('[onclick*="trailer"]');

                    // If direct selector fails, search by text content
                    if (!addTrailerBtn) {
                        const allButtons = document.querySelectorAll('button');
                        for (const button of allButtons) {
                            if (button.textContent.toLowerCase().includes('trailer') ||
                                button.textContent.toLowerCase().includes('add trailer')) {
                                addTrailerBtn = button;
                                console.log(`🚛 Found trailer button by text: "${button.textContent}"`);
                                break;
                            }
                        }
                    }

                    if (addTrailerBtn) {
                        console.log(`🚛 Found add trailer button for trailer ${index + 1}:`, addTrailerBtn);
                        addTrailerBtn.click();

                        // Wait for DOM to be ready, then populate
                        setTimeout(() => {
                            fillLatestTrailerFields(trailer, index);
                        }, 600);
                    } else {
                        console.log(`⚠️ No add trailer button found for trailer ${index + 1}`);
                    }
                }, processingDelay + (index * 800)); // Stagger each trailer by 800ms
            });

            // Try fallback after processing
            setTimeout(() => {
                populateAnyEmptyTrailerFields(trailers);
            }, 1000 + (trailers.length * 800) + 1000);
        } catch (error) {
            console.error('Error populating trailers:', error);
        }
    }

    function populateAnyEmptyTrailerFields(trailers) {
        console.log(`🔍 Looking for empty trailer fields to populate with ${trailers.length} trailers`);

        trailers.forEach((trailer, index) => {
            // Try to find trailer-specific fields or empty fields that could be used
            const trailerFields = [
                `trailer_${index}_year`,
                `trailer_${index}_make`,
                `trailer_${index}_model`,
                `trailer_${index}_vin`,
                `trailer_${index}_id`
            ];

            trailerFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && !field.value) {
                    const fieldType = fieldId.split('_')[2]; // get 'year', 'make', etc.
                    if (trailer[fieldType]) {
                        field.value = trailer[fieldType];
                        console.log(`✅ Populated trailer field ${fieldId} with:`, trailer[fieldType]);
                    }
                }
            });
        });
    }

    function fillLatestTrailerFields(trailer, index) {
        console.log(`🚛 Filling trailer fields for trailer ${index + 1}:`, trailer);

        // Try multiple approaches to find trailer forms
        let trailerContainer = null;

        // Approach 1: Look for trailersList
        const trailersList = document.getElementById('trailersList');
        if (trailersList && trailersList.children.length > 0) {
            trailerContainer = trailersList.lastElementChild;
            console.log('🚛 Found trailer via trailersList');
        }

        // Approach 2: Look for trailer-entry class
        if (!trailerContainer) {
            const trailerEntries = document.querySelectorAll('.trailer-entry');
            if (trailerEntries.length > 0) {
                trailerContainer = trailerEntries[trailerEntries.length - 1];
                console.log('🚛 Found trailer via .trailer-entry');
            }
        }

        // Approach 3: Look for any form container that might be a trailer
        if (!trailerContainer) {
            const allContainers = document.querySelectorAll('.form-group, .vehicle-entry, .input-group, .trailer-container');
            for (const container of allContainers) {
                if (container.textContent.toLowerCase().includes('trailer') ||
                    container.querySelector('input[placeholder*="trailer"]') ||
                    container.querySelector('label:contains("Trailer")')) {
                    trailerContainer = container;
                    console.log('🚛 Found trailer via text content search');
                    break;
                }
            }
        }

        if (trailerContainer) {
            console.log('🚛 Using trailer container:', trailerContainer);

            const fields = {
                'year': trailer.year || '',
                'make': trailer.make || '',
                'model': trailer.model || '',
                'vin': trailer.id || trailer.vin || ''
            };

            Object.keys(fields).forEach(fieldType => {
                // Try multiple ways to find the field
                let field = trailerContainer.querySelector(`input[id*="${fieldType}"]`) ||
                           trailerContainer.querySelector(`input[placeholder*="${fieldType}"]`) ||
                           trailerContainer.querySelector(`input[name*="${fieldType}"]`);

                // If still not found, try position-based selection
                if (!field && trailerContainer.querySelectorAll('input').length >= 4) {
                    const inputs = trailerContainer.querySelectorAll('input');
                    const fieldIndex = ['year', 'make', 'model', 'vin'].indexOf(fieldType);
                    if (fieldIndex >= 0 && inputs[fieldIndex]) {
                        field = inputs[fieldIndex];
                        console.log(`🚛 Found ${fieldType} field by position:`, fieldIndex);
                    }
                }

                if (field && fields[fieldType]) {
                    field.value = fields[fieldType];
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`✅ Set trailer ${fieldType}:`, fields[fieldType]);
                } else if (fields[fieldType]) {
                    console.log(`⚠️ Could not find trailer ${fieldType} field`);
                }
            });
        } else {
            console.log('⚠️ No trailer container found, trailer will be added to notes only');
        }
    }

    // Add trailer information to notes section as fallback
    function addTrailerInfoToNotes(trailers) {
        const notesField = document.getElementById('notes-content') ||
                          document.querySelector('textarea[id*="notes"]') ||
                          document.querySelector('textarea[placeholder*="notes"]');

        if (notesField && trailers.length > 0) {
            const trailerText = trailers.map((trailer, index) =>
                `Trailer ${index + 1}: ${trailer.year} ${trailer.make} ${trailer.model}${trailer.id ? ` (VIN: ${trailer.id})` : ''}`
            ).join('\n');

            const existingText = notesField.value || '';
            const newText = existingText ?
                `${existingText}\n\nTRAILERS:\n${trailerText}` :
                `TRAILERS:\n${trailerText}`;

            notesField.value = newText;
            const event = new Event('change', { bubbles: true });
            notesField.dispatchEvent(event);

            console.log('Added trailer info to notes:', trailerText);
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

    // Add all parsed data to notes as comprehensive backup
    function addParsedDataToNotes(data) {
        // Try multiple selectors for notes field
        let notesField = document.querySelector('#notes') ||
                        document.querySelector('#notes-content') ||
                        document.querySelector('textarea[id*="notes"]') ||
                        document.querySelector('textarea[placeholder*="notes"]') ||
                        document.querySelector('textarea[name*="notes"]') ||
                        document.querySelector('.notes textarea') ||
                        document.querySelector('textarea');

        if (!notesField) {
            console.log('No notes field found');
            return;
        }

        const sections = [];

        // Basic policy info
        if (data.carrier || data.policyNumber || data.insuredName) {
            const policyInfo = [];
            if (data.carrier) policyInfo.push(`Carrier: ${data.carrier}`);
            if (data.policyNumber) policyInfo.push(`Policy #: ${data.policyNumber}`);
            if (data.insuredName) policyInfo.push(`Insured: ${data.insuredName}`);
            if (data.premium) policyInfo.push(`Premium: $${data.premium}`);
            if (data.usdotNumber) policyInfo.push(`USDOT: ${data.usdotNumber}`);
            sections.push(`POLICY INFO:\n${policyInfo.join('\n')}`);
        }

        // Contact info
        if (data.email || data.phone || data.address) {
            const contactInfo = [];
            if (data.email) contactInfo.push(`Email: ${data.email}`);
            if (data.phone) contactInfo.push(`Phone: ${data.phone}`);
            if (data.address) contactInfo.push(`Address: ${data.address}`);
            if (data.city && data.state) contactInfo.push(`City/State: ${data.city}, ${data.state} ${data.zip || ''}`);
            sections.push(`CONTACT INFO:\n${contactInfo.join('\n')}`);
        }

        // Add to notes
        const newText = `=== QUICKFILL DATA ===\n${sections.join('\n\n')}\n\n`;
        const existingText = notesField.value || '';
        notesField.value = newText + existingText;

        const event = new Event('change', { bubbles: true });
        notesField.dispatchEvent(event);

        console.log('Added comprehensive parsed data to notes');
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

    // Helper function to map general aggregate coverage
    function mapGeneralAggregate(aggregate) {
        if (!aggregate) return '';

        // Remove $ and commas for comparison
        const cleanValue = aggregate.replace(/[$,]/g, '');

        // Map to dropdown values
        const aggregateMap = {
            '1000000': '1000000',
            '2000000': '2000000',
            '3000000': '3000000',
            '4000000': '4000000',
            '5000000': '5000000',
            '10000000': '10000000'
        };

        return aggregateMap[cleanValue] || cleanValue;
    }

    // Helper function to map trailer interchange coverage
    function mapTrailerInterchange(interchange) {
        if (!interchange) return '';

        const cleanValue = interchange.replace(/[$,]/g, '');

        const interchangeMap = {
            '0': '0',
            '20000': '20000',
            '25000': '25000',
            '50000': '50000',
            '75000': '75000',
            '100000': '100000'
        };

        return interchangeMap[cleanValue] || cleanValue;
    }

    // Helper function to map non-trucking liability
    function mapNonTrucking(nonTrucking) {
        if (!nonTrucking) return '';

        // Handle both CSL and split limit formats
        if (nonTrucking.includes('CSL') || nonTrucking.includes('1,000,000') || nonTrucking.includes('1000000')) {
            return '1000000';
        } else if (nonTrucking.includes('100/300/100') || nonTrucking.includes('100K/300K/100K')) {
            return '100/300/100';
        } else if (nonTrucking.includes('30/60/25') || nonTrucking.includes('30K/60K/25K')) {
            return '30/60/25';
        } else if (nonTrucking.includes('No Coverage') || nonTrucking === '0') {
            return '0';
        }

        return '';
    }

    // Start observing when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeModalChanges);
    } else {
        observeModalChanges();
    }

})();