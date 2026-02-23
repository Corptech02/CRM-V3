// Vicidial DOT Lookup Integration
// Automatically populates carrier data from DB-V3 database when DOT number is detected
console.log('🚛 Vicidial DOT Lookup Integration initialized');

// Enhanced DOT lookup function for Vicidial imports
window.performDOTLookupForLead = async function(leadId, dotNumber) {
    if (!dotNumber || dotNumber.toString().trim() === '') {
        console.log('❌ No DOT number provided for lead', leadId);
        return null;
    }

    const cleanDOT = dotNumber.toString().trim().replace(/[^\d]/g, '');
    console.log(`🔍 DOT LOOKUP: Searching DB-V3 for DOT ${cleanDOT} (Lead: ${leadId})`);

    try {
        // Use simple test endpoint for now
        const directResponse = await fetch(`/api/test-db/${cleanDOT}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!directResponse.ok) {
            console.log('❌ Carrier profile API not available, trying alternative approach');
            // Try the search carriers endpoint
            const searchData = await window.apiService?.searchCarriers({
                usdot: cleanDOT,
                limit: 1
            });

            if (searchData?.carriers?.length > 0) {
                return await processCarrierData(leadId, searchData.carriers[0]);
            }
            return null;
        }

        const profileData = await directResponse.json();
        if (profileData.carrier) {
            console.log(`✅ Found carrier data for DOT ${cleanDOT}:`, profileData.carrier.LEGAL_NAME || profileData.carrier.legal_name || profileData.carrier.company_name);
            return await processCarrierData(leadId, profileData.carrier);
        }

    } catch (error) {
        console.error('❌ Error during DOT lookup:', error);

        // Fallback: Try to get basic carrier info from DB-V3 directly
        try {
            const fallbackData = await fetchCarrierFromDB3(cleanDOT);
            if (fallbackData) {
                return await processCarrierData(leadId, fallbackData);
            }
        } catch (fallbackError) {
            console.error('❌ Fallback DOT lookup also failed:', fallbackError);
        }
    }

    return null;
};

// Process and populate carrier data into lead profile
async function processCarrierData(leadId, carrierData) {
    console.log(`📝 POPULATE: Processing carrier data for lead ${leadId}`);

    const populatedData = {
        // Basic company information
        companyName: carrierData.LEGAL_NAME || carrierData.legal_name || carrierData.company_name || '',
        dbaName: carrierData.DBA_NAME || carrierData.dba_name || '',
        dotNumber: carrierData.DOT_NUMBER || carrierData.usdot_number || carrierData.dot_number || '',
        mcNumber: carrierData.MC_NUMBER || carrierData.mc_number || '',

        // Contact information
        phone: carrierData.PHONE || carrierData.phone || '',
        email: carrierData.EMAIL_ADDRESS || carrierData.email || carrierData.email_address || '',

        // Address
        address: carrierData.PHY_STREET || carrierData.physical_address || carrierData.street_address || '',
        city: carrierData.PHY_CITY || carrierData.physical_city || carrierData.city || '',
        state: carrierData.PHY_STATE || carrierData.physical_state || carrierData.state || '',
        zipCode: carrierData.PHY_ZIP || carrierData.physical_zip_code || carrierData.zip_code || '',

        // Business information
        yearEstablished: calculateYearFromDate(carrierData.ADD_DATE || carrierData.authority_date),
        operatingStatus: carrierData.operating_status || carrierData.STATUS_CODE || '',
        carrierOperation: carrierData.carrier_operation || carrierData.CARRIER_OPERATION || '',

        // Fleet information
        powerUnits: carrierData.power_units || carrierData.POWER_UNITS || 0,
        totalDrivers: carrierData.total_drivers || carrierData.TOTAL_DRIVERS || 0,

        // Insurance information
        insuranceCompany: carrierData.insurance_company || carrierData.primary_insurance_carrier || '',
        renewalDate: calculateRenewalDate(carrierData),

        // Commodity information
        commoditiesHauled: extractCommodities(carrierData),

        // Vehicle and trailer data
        vehicles: await extractVehicleData(carrierData),
        trailers: await extractTrailerData(carrierData),

        // Safety information
        safetyRating: carrierData.safety_rating || carrierData.SAFETY_RATING || ''
    };

    // Update lead fields
    await updateLeadWithCarrierData(leadId, populatedData);

    return populatedData;
}

// Update lead profile with carrier data
async function updateLeadWithCarrierData(leadId, data) {
    console.log(`📋 UPDATE LEAD: Populating lead ${leadId} with carrier data`);

    // Update basic fields
    if (data.companyName) await updateLeadField(leadId, 'name', data.companyName);
    if (data.phone) await updateLeadField(leadId, 'phone', data.phone);
    if (data.email) await updateLeadField(leadId, 'email', data.email);
    if (data.dotNumber) await updateLeadField(leadId, 'dotNumber', data.dotNumber);
    if (data.mcNumber) await updateLeadField(leadId, 'mcNumber', data.mcNumber);
    if (data.yearEstablished) await updateLeadField(leadId, 'yearsInBusiness', data.yearEstablished);
    if (data.renewalDate) await updateLeadField(leadId, 'renewalDate', data.renewalDate);
    if (data.insuranceCompany) await updateLeadField(leadId, 'insuranceCompany', data.insuranceCompany);
    if (data.state) await updateLeadField(leadId, 'state', data.state);
    if (data.commoditiesHauled) await updateLeadField(leadId, 'commodityHauled', data.commoditiesHauled);

    // Add vehicles
    if (data.vehicles && data.vehicles.length > 0) {
        console.log(`🚛 Adding ${data.vehicles.length} vehicles to lead ${leadId}`);
        for (const vehicle of data.vehicles) {
            await addVehicleToLeadFromData(leadId, vehicle);
        }
    }

    // Add trailers
    if (data.trailers && data.trailers.length > 0) {
        console.log(`🚚 Adding ${data.trailers.length} trailers to lead ${leadId}`);
        for (const trailer of data.trailers) {
            await addTrailerToLeadFromData(leadId, trailer);
        }
    }

    console.log(`✅ Lead ${leadId} populated with carrier data successfully`);
}

// Extract vehicle data with VIN decoding
async function extractVehicleData(carrierData) {
    const vehicles = [];

    // Check if carrier has vehicle inventory data
    if (carrierData.vehicle_inventory) {
        for (const vehicle of carrierData.vehicle_inventory) {
            const vehicleData = {
                year: vehicle.year || '',
                make: vehicle.make || '',
                model: vehicle.model || '',
                vin: vehicle.vin || '',
                licensePlate: vehicle.license_plate || '',
                licenseState: vehicle.license_state || '',
                vehicleType: vehicle.vehicle_type || vehicle.unit_type || '',
                gvwr: vehicle.gvwr || '',
                ...await decodeVIN(vehicle.vin) // Add VIN decoded data
            };
            vehicles.push(vehicleData);
        }
    }

    return vehicles;
}

// Extract trailer data
async function extractTrailerData(carrierData) {
    const trailers = [];

    if (carrierData.trailer_inventory) {
        for (const trailer of carrierData.trailer_inventory) {
            const trailerData = {
                year: trailer.year || '',
                make: trailer.make || '',
                model: trailer.model || '',
                vin: trailer.vin || '',
                licensePlate: trailer.license_plate || '',
                licenseState: trailer.license_state || '',
                trailerType: trailer.trailer_type || trailer.unit_type || '',
                length: trailer.length || '',
                ...await decodeVIN(trailer.vin) // Add VIN decoded data
            };
            trailers.push(trailerData);
        }
    }

    return trailers;
}

// VIN decoder function
async function decodeVIN(vin) {
    if (!vin || vin.length !== 17) {
        return {};
    }

    try {
        // Use NHTSA VIN decoder API
        const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
        const data = await response.json();

        if (data.Results) {
            const results = {};
            data.Results.forEach(item => {
                if (item.Value && item.Value !== 'Not Applicable' && item.Value !== '') {
                    switch (item.Variable) {
                        case 'Make':
                            results.decodedMake = item.Value;
                            break;
                        case 'Model':
                            results.decodedModel = item.Value;
                            break;
                        case 'Model Year':
                            results.decodedYear = item.Value;
                            break;
                        case 'Vehicle Type':
                            results.decodedVehicleType = item.Value;
                            break;
                        case 'Body Class':
                            results.bodyClass = item.Value;
                            break;
                        case 'GVWR':
                            results.decodedGVWR = item.Value;
                            break;
                    }
                }
            });
            return results;
        }
    } catch (error) {
        console.log('VIN decode failed, using manual decode:', error);
        return manualVINDecode(vin);
    }

    return {};
}

// Manual VIN decoding for common patterns
function manualVINDecode(vin) {
    if (!vin || vin.length !== 17) return {};

    // Extract year from VIN (10th character)
    const yearCode = vin.charAt(9);
    const year = decodeYearFromVIN(yearCode);

    return {
        decodedYear: year,
        vinCountryOrigin: decodeCountryOrigin(vin.substring(0, 3))
    };
}

// Helper function to decode year from VIN
function decodeYearFromVIN(yearCode) {
    const yearCodes = {
        'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989,
        'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999,
        'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
        'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
        'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
    };
    return yearCodes[yearCode] || '';
}

// Add vehicle to lead with decoded data
async function addVehicleToLeadFromData(leadId, vehicleData) {
    const container = document.getElementById(`vehicles-container-${leadId}`);
    if (!container) return;

    const vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Remove "no vehicles" message if present
    if (container.innerHTML.includes('No vehicles added yet')) {
        container.innerHTML = '';
    }

    const vehicleHTML = `
        <div class="vehicle-item" id="${vehicleId}" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #1f2937;">${vehicleData.decodedYear || vehicleData.year || ''} ${vehicleData.decodedMake || vehicleData.make || ''} ${vehicleData.decodedModel || vehicleData.model || ''}</strong>
                <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${vehicleData.decodedVehicleType || vehicleData.vehicleType || 'VEHICLE'}
                </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                <div><strong>VIN:</strong> ${vehicleData.vin || 'N/A'}</div>
                <div><strong>License:</strong> ${vehicleData.licensePlate || ''} (${vehicleData.licenseState || ''})</div>
                <div><strong>GVWR:</strong> ${vehicleData.decodedGVWR || vehicleData.gvwr || 'N/A'}</div>
                <div><strong>Body Class:</strong> ${vehicleData.bodyClass || 'N/A'}</div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', vehicleHTML);

    // Update vehicle count in header
    updateVehicleCount(leadId);
}

// Add trailer to lead
async function addTrailerToLeadFromData(leadId, trailerData) {
    const container = document.getElementById(`trailers-container-${leadId}`);
    if (!container) return;

    const trailerId = `trailer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Remove "no trailers" message if present
    if (container.innerHTML.includes('No trailers added yet')) {
        container.innerHTML = '';
    }

    const trailerHTML = `
        <div class="trailer-item" id="${trailerId}" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #2c3e50;">${trailerData.decodedYear || trailerData.year || ''} ${trailerData.decodedMake || trailerData.make || ''} ${trailerData.decodedModel || trailerData.model || ''}</strong>
                <span style="background: #e17055; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${trailerData.trailerType || 'TRAILER'}
                </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                <div><strong>VIN:</strong> ${trailerData.vin || 'N/A'}</div>
                <div><strong>License:</strong> ${trailerData.licensePlate || ''} (${trailerData.licenseState || ''})</div>
                <div><strong>Length:</strong> ${trailerData.length || 'N/A'}</div>
                <div><strong>Type:</strong> ${trailerData.trailerType || 'N/A'}</div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', trailerHTML);

    // Update trailer count in header
    updateTrailerCount(leadId);
}

// Update vehicle count in header
function updateVehicleCount(leadId) {
    const container = document.getElementById(`vehicles-container-${leadId}`);
    const header = container?.parentElement?.querySelector('h3');
    if (header && container) {
        const vehicleCount = container.querySelectorAll('.vehicle-item').length;
        header.innerHTML = `<i class="fas fa-truck"></i> Vehicles (${vehicleCount})`;
    }
}

// Update trailer count in header
function updateTrailerCount(leadId) {
    const container = document.getElementById(`trailers-container-${leadId}`);
    const header = container?.parentElement?.querySelector('h3');
    if (header && container) {
        const trailerCount = container.querySelectorAll('.trailer-item').length;
        header.innerHTML = `<i class="fas fa-trailer"></i> Trailers (${trailerCount})`;
    }
}

// Extract commodities from carrier data
function extractCommodities(carrierData) {
    const commodities = [];

    // Check various commodity fields in DB-V3 schema
    const commodityFields = [
        'CRGO_GENFREIGHT', 'CRGO_HOUSEHOLD', 'CRGO_METALSHEET', 'CRGO_MOTOVEH',
        'CRGO_DRIVETOW', 'CRGO_LOGPOLE', 'CRGO_BLDGMAT', 'CRGO_MOBILEHOME',
        'CRGO_MACHLRG', 'CRGO_PRODUCE', 'CRGO_LIQGAS', 'CRGO_INTERMODAL',
        'CRGO_PASSENGERS', 'CRGO_OILFIELD', 'CRGO_LIVESTOCK', 'CRGO_GRAINFEED',
        'CRGO_COALCOKE', 'CRGO_MEAT', 'CRGO_GARBAGE', 'CRGO_USMAIL', 'CRGO_CHEM',
        'CRGO_DRYBULK', 'CRGO_PAPERPROD', 'CRGO_UTILITY', 'CRGO_CONSTRUCT'
    ];

    commodityFields.forEach(field => {
        if (carrierData[field] === 'X' || carrierData[field] === 'Y' || carrierData[field] === '1') {
            commodities.push(formatCommodityName(field));
        }
    });

    return commodities.join(', ') || 'General Freight';
}

// Format commodity field names to readable text
function formatCommodityName(fieldName) {
    const commodityNames = {
        'CRGO_GENFREIGHT': 'General Freight',
        'CRGO_HOUSEHOLD': 'Household Goods',
        'CRGO_METALSHEET': 'Metal Sheets/Coils',
        'CRGO_MOTOVEH': 'Motor Vehicles',
        'CRGO_DRIVETOW': 'Drive/Tow Away',
        'CRGO_LOGPOLE': 'Logs/Poles/Lumber',
        'CRGO_BLDGMAT': 'Building Materials',
        'CRGO_MOBILEHOME': 'Mobile Homes',
        'CRGO_MACHLRG': 'Large Machinery',
        'CRGO_PRODUCE': 'Fresh Produce',
        'CRGO_LIQGAS': 'Liquids/Gases',
        'CRGO_INTERMODAL': 'Intermodal',
        'CRGO_PASSENGERS': 'Passengers',
        'CRGO_OILFIELD': 'Oilfield Equipment',
        'CRGO_LIVESTOCK': 'Livestock',
        'CRGO_GRAINFEED': 'Grain/Feed/Hay',
        'CRGO_COALCOKE': 'Coal/Coke',
        'CRGO_MEAT': 'Meat',
        'CRGO_GARBAGE': 'Garbage/Refuse',
        'CRGO_USMAIL': 'US Mail',
        'CRGO_CHEM': 'Chemicals',
        'CRGO_DRYBULK': 'Dry Bulk',
        'CRGO_PAPERPROD': 'Paper Products',
        'CRGO_UTILITY': 'Utilities',
        'CRGO_CONSTRUCT': 'Construction'
    };
    return commodityNames[fieldName] || fieldName.replace('CRGO_', '').replace('_', ' ');
}

// Calculate year from ADD_DATE
function calculateYearFromDate(dateStr) {
    if (!dateStr) return '';

    // Handle various date formats
    const year = dateStr.substring(0, 4);
    if (year && /^\d{4}$/.test(year)) {
        return year;
    }

    return '';
}

// Calculate renewal date based on insurance company patterns
function calculateRenewalDate(carrierData) {
    const insuranceCompany = carrierData.insurance_company || carrierData.primary_insurance_carrier || '';
    const dotNumber = carrierData.dot_number || carrierData.DOT_NUMBER || '';

    if (!insuranceCompany || !dotNumber) return '';

    // Use the same renewal calculation logic from the backend
    const RENEWAL_PATTERNS = {
        'PROGRESSIVE': { baseMonth: 1, cycleMonths: 6 },
        'GEICO': { baseMonth: 2, cycleMonths: 6 },
        'CANAL': { baseMonth: 3, cycleMonths: 12 },
        'GREAT WEST': { baseMonth: 1, cycleMonths: 12 },
        'OLD REPUBLIC': { baseMonth: 4, cycleMonths: 12 },
        'NORTHLAND': { baseMonth: 2, cycleMonths: 6 },
        'ACUITY': { baseMonth: 5, cycleMonths: 12 },
        'STATE FARM': { baseMonth: 6, cycleMonths: 6 }
    };

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    let pattern = RENEWAL_PATTERNS['PROGRESSIVE']; // default

    const upperInsurance = insuranceCompany.toUpperCase();
    for (const key in RENEWAL_PATTERNS) {
        if (upperInsurance.includes(key)) {
            pattern = RENEWAL_PATTERNS[key];
            break;
        }
    }

    const dotHash = parseInt(dotNumber) || Math.floor(Math.random() * 100000);
    const dayOffset = (dotHash % 28) + 1;
    const monthOffset = (dotHash % pattern.cycleMonths);

    let renewalMonth = pattern.baseMonth + monthOffset;
    let renewalYear = currentYear;

    if (renewalMonth <= currentMonth) {
        renewalYear++;
    }

    if (renewalMonth > 12) {
        renewalMonth -= 12;
        renewalYear++;
    }

    const renewalDate = new Date(renewalYear, renewalMonth - 1, dayOffset);
    return renewalDate.toLocaleDateString('en-US');
}

// Fallback function to fetch carrier data directly from DB-V3
async function fetchCarrierFromDB3(dotNumber) {
    // This would be implemented to directly query the SQLite database
    // For now, return null to indicate no fallback data available
    console.log(`🔄 Fallback: Attempting direct DB-V3 lookup for DOT ${dotNumber}`);
    return null;
}

// Auto-trigger DOT lookup when DOT field changes in lead profile
document.addEventListener('input', async function(e) {
    if (e.target && e.target.tagName === 'INPUT' && e.target.onchange) {
        const onchangeStr = e.target.onchange.toString();
        if (onchangeStr.includes("updateLeadField") && onchangeStr.includes("'dotNumber'")) {
            const dotValue = e.target.value.trim();
            if (dotValue && dotValue.length >= 6) {
                // Extract lead ID from onchange attribute
                const match = onchangeStr.match(/updateLeadField\('([^']+)'/);
                if (match) {
                    const leadId = match[1];
                    console.log(`🔍 Auto-triggering DOT lookup for lead ${leadId} with DOT ${dotValue}`);

                    // Debounce the lookup to avoid multiple calls
                    if (window.dotLookupTimeout) {
                        clearTimeout(window.dotLookupTimeout);
                    }

                    window.dotLookupTimeout = setTimeout(() => {
                        performDOTLookupForLead(leadId, dotValue);
                    }, 1000); // Wait 1 second after user stops typing
                }
            }
        }
    }
});

// Missing functions for vehicle and trailer management
async function addVehicleToLeadFromData(leadId, vehicle) {
    console.log(`🚛 Adding vehicle to lead ${leadId}:`, vehicle);

    // Check if there's an existing function to add vehicles
    if (typeof window.addVehicleToLead === 'function') {
        return window.addVehicleToLead(leadId, vehicle);
    }

    // Fallback: try to populate vehicle fields directly
    try {
        const vehicles = JSON.parse(localStorage.getItem(`lead_${leadId}_vehicles`) || '[]');
        vehicles.push(vehicle);
        localStorage.setItem(`lead_${leadId}_vehicles`, JSON.stringify(vehicles));
        console.log(`✅ Vehicle added to lead ${leadId} localStorage`);
        return true;
    } catch (error) {
        console.error(`❌ Error adding vehicle to lead ${leadId}:`, error);
        return false;
    }
}

async function addTrailerToLeadFromData(leadId, trailer) {
    console.log(`🚚 Adding trailer to lead ${leadId}:`, trailer);

    // Check if there's an existing function to add trailers
    if (typeof window.addTrailerToLead === 'function') {
        return window.addTrailerToLead(leadId, trailer);
    }

    // Fallback: try to populate trailer fields directly
    try {
        const trailers = JSON.parse(localStorage.getItem(`lead_${leadId}_trailers`) || '[]');
        trailers.push(trailer);
        localStorage.setItem(`lead_${leadId}_trailers`, JSON.stringify(trailers));
        console.log(`✅ Trailer added to lead ${leadId} localStorage`);
        return true;
    } catch (error) {
        console.error(`❌ Error adding trailer to lead ${leadId}:`, error);
        return false;
    }
}

// Enhanced updateLeadField function specifically for DOT lookup integration
async function updateLeadField(leadId, fieldName, value) {
    console.log(`📝 DOT Integration updateLeadField: ${fieldName} = ${value} for lead ${leadId}`);

    // Use global updateLeadField if available
    if (typeof window.updateLeadField === 'function' && window.updateLeadField !== updateLeadField) {
        try {
            await window.updateLeadField(leadId, fieldName, value);
            console.log(`✅ Updated ${fieldName} via global function`);
            return true;
        } catch (error) {
            console.error(`❌ Error using global updateLeadField:`, error);
        }
    }

    // Fallback to direct localStorage update
    try {
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(lead => lead.id === leadId || lead.id === leadId.toString());

        if (leadIndex !== -1) {
            leads[leadIndex][fieldName] = value;
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log(`✅ Updated ${fieldName} in localStorage for lead ${leadId}`);
            return true;
        } else {
            console.log(`⚠️ Lead ${leadId} not found in insurance_leads`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error updating field ${fieldName} for lead ${leadId}:`, error);
        return false;
    }
}

console.log('✅ Vicidial DOT Lookup Integration ready');