// Auto DOT Lookup Hook - Triggers DOT lookup immediately when leads are created/updated
(function() {
    'use strict';

    console.log('🚛 Auto DOT Lookup Hook initializing...');

    // Store the original localStorage.setItem method
    const originalSetItem = localStorage.setItem;

    // DISABLED: Auto localStorage monitoring - was causing too much spam
    // DOT lookup now only happens:
    // 1. Manual button click
    // 2. New lead import (detected by specific import events)
    console.log('🚛 AUTO DOT: localStorage auto-scanning DISABLED - manual/import only');

    // Built-in DOT lookup function since the main one isn't loading
    async function performBuiltInDOTLookup(leadId, dotNumber) {
        try {
            const cleanDOT = dotNumber.toString().trim().replace(/[^\d]/g, '');
            console.log(`🔍 BUILT-IN DOT: Looking up DOT ${cleanDOT} for lead ${leadId}`);

            // Call the comprehensive carrier profile API (same as carrier search)
            const response = await fetch(`/api/carrier/profile/${cleanDOT}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            const data = await response.json();

            if (data.success && data.carrier) {
                console.log(`✅ BUILT-IN DOT: Found data for DOT ${cleanDOT}:`, data.carrier);

                // Update the lead in localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const leadIndex = leads.findIndex(lead => lead.id === leadId || lead.id === leadId.toString());

                if (leadIndex !== -1) {
                    // Extract data from comprehensive API structure
                    const carrierDetails = data.carrier.carrier_details || data.carrier;

                    // Update with carrier data
                    leads[leadIndex].state = carrierDetails.PHY_STATE || data.carrier.address?.state || '';
                    leads[leadIndex].yearsInBusiness = calculateYearsFromAuthorityDate(carrierDetails.ADD_DATE) || data.carrier.years_in_business || calculateYearsFromDOT(data.carrier.usdot_number) || '';
                    leads[leadIndex].commodityHauled = determineCommodityFromDOTData(carrierDetails) || 'General Freight';
                    leads[leadIndex].phone = data.carrier.phone || carrierDetails.PHONE || leads[leadIndex].phone;
                    leads[leadIndex].email = data.carrier.email || carrierDetails.EMAIL_ADDRESS || leads[leadIndex].email;

                    // Save updated leads (set flag to prevent recursion)
                    window.dotLookupInProgress = true;

                    // VEHICLE AUTO-POPULATION: Create vehicles from REAL inspection data
                    const vehiclesCreated = createVehiclesFromRealInspectionData(leads[leadIndex], data.carrier, leadId);

                    // DRIVER AUTO-POPULATION: Create driver from contact information
                    const driversCreated = createDriverFromContactInfo(leads[leadIndex], leadId);

                    originalSetItem.call(localStorage, 'insurance_leads', JSON.stringify(leads));
                    window.dotLookupInProgress = false;

                    // CRITICAL: Also save DOT data to SERVER using updateLeadField
                    if (window.updateLeadField) {
                        console.log(`💾 AUTO DOT: Saving DOT data to server for lead ${leadId}`);
                        if (leads[leadIndex].state) {
                            window.updateLeadField(leadId, 'state', leads[leadIndex].state);
                            console.log(`💾 AUTO DOT: Saved state to server: ${leads[leadIndex].state}`);
                        }
                        if (leads[leadIndex].yearsInBusiness) {
                            window.updateLeadField(leadId, 'yearsInBusiness', leads[leadIndex].yearsInBusiness);
                            console.log(`💾 AUTO DOT: Saved yearsInBusiness to server: ${leads[leadIndex].yearsInBusiness}`);
                        }
                        if (leads[leadIndex].commodityHauled) {
                            window.updateLeadField(leadId, 'commodityHauled', leads[leadIndex].commodityHauled);
                            console.log(`💾 AUTO DOT: Saved commodityHauled to server: ${leads[leadIndex].commodityHauled}`);
                        }

                        // Save vehicles, trailers, AND drivers to server if any were created
                        if ((vehiclesCreated > 0 || driversCreated > 0) && (leads[leadIndex].vehicles || leads[leadIndex].trailers || leads[leadIndex].drivers)) {
                            setTimeout(() => {
                                if (window.syncLeadToServer && typeof window.syncLeadToServer === 'function') {
                                    try {
                                        const dataToSave = {};
                                        if (leads[leadIndex].vehicles && leads[leadIndex].vehicles.length > 0) {
                                            dataToSave.vehicles = leads[leadIndex].vehicles;
                                        }
                                        if (leads[leadIndex].trailers && leads[leadIndex].trailers.length > 0) {
                                            dataToSave.trailers = leads[leadIndex].trailers;
                                        }
                                        if (leads[leadIndex].drivers && leads[leadIndex].drivers.length > 0) {
                                            dataToSave.drivers = leads[leadIndex].drivers;
                                        }
                                        window.syncLeadToServer(leadId, dataToSave);
                                        console.log(`💾 AUTO DOT: Saved ${leads[leadIndex].vehicles?.length || 0} vehicles, ${leads[leadIndex].trailers?.length || 0} trailers, and ${leads[leadIndex].drivers?.length || 0} drivers to server`);
                                    } catch (error) {
                                        console.error(`❌ AUTO DOT: Error saving vehicles/trailers to server:`, error);
                                    }
                                }
                            }, 2000); // Delay to ensure all other saves complete first
                        }
                    } else {
                        console.log(`⚠️ AUTO DOT: updateLeadField not available, server save skipped`);
                    }

                    console.log(`✅ BUILT-IN DOT: Updated lead ${leadId} with DOT data`);
                    return {
                        success: true,
                        state: leads[leadIndex].state,
                        yearsInBusiness: leads[leadIndex].yearsInBusiness,
                        commodityHauled: leads[leadIndex].commodityHauled,
                        vehiclesCreated: vehiclesCreated,
                        driversCreated: driversCreated,
                        totalCreated: vehiclesCreated + driversCreated
                    };
                } else {
                    console.log(`⚠️ BUILT-IN DOT: Lead ${leadId} not found in localStorage`);
                }
            } else {
                console.log(`⚠️ BUILT-IN DOT: No data found for DOT ${cleanDOT}`);
            }
        } catch (error) {
            console.error(`❌ BUILT-IN DOT: Error looking up DOT ${dotNumber}:`, error);
        }

        return null;
    }

    // REMOVED: Fake vehicle generation function - now using ONLY real inspection data

    // NEW: Create vehicles/trailers from REAL inspection data (same as carrier search)
    function createVehiclesFromRealInspectionData(lead, carrierData, leadId) {
        console.log(`🚛 REAL FLEET: Extracting actual vehicles from inspection data...`);

        // Initialize arrays
        if (!lead.vehicles) lead.vehicles = [];
        if (!lead.trailers) lead.trailers = [];

        let vehiclesAdded = 0;
        let trailersAdded = 0;
        const seenVINs = new Set();

        // Get inspection records from comprehensive API
        const inspections = carrierData.inspections || [];
        console.log(`🚛 REAL FLEET: Found ${inspections.length} inspection records`);
        console.log(`🚛 REAL FLEET: Raw inspection data:`, inspections.map(i => ({
            truck: { type: i.Unit_Type_Desc, make: i.Unit_Make, vin: i.VIN },
            trailer: { type: i.Unit_Type_Desc2, make: i.Unit_Make2, vin: i.VIN2 }
        })));

        inspections.forEach((inspection, idx) => {
            // Extract TRUCK TRACTOR data
            if (inspection.Unit_Type_Desc === 'TRUCK TRACTOR' && inspection.VIN && !seenVINs.has(inspection.VIN)) {
                seenVINs.add(inspection.VIN);

                const vehicleId = `real_vehicle_${leadId}_${inspection.VIN}`;
                const realVehicle = {
                    id: vehicleId,
                    year: extractYearFromVIN(inspection.VIN) || 'Unknown',
                    make: inspection.Unit_Make || 'Unknown',
                    model: 'Truck Tractor', // Generic model from inspection
                    vin: inspection.VIN,
                    value: estimateValueFromVIN(inspection.VIN).toString(),
                    deductible: '2500',
                    type: 'Semi Truck',
                    gvwr: '80000',
                    license: inspection.Unit_License,
                    state: inspection.Unit_License_State,
                    source: 'REAL_INSPECTION_DATA'
                };

                // Check if vehicle already exists
                const existingVehicle = lead.vehicles.find(v => v.vin === inspection.VIN);
                if (!existingVehicle) {
                    lead.vehicles.push(realVehicle);
                    vehiclesAdded++;
                    console.log(`🚛 REAL FLEET: Added real vehicle: ${realVehicle.make} (${realVehicle.vin})`);
                }
            }

            // Extract SEMI-TRAILER data
            console.log(`🚚 TRAILER CHECK: Inspection ${idx}: Unit_Type_Desc2="${inspection.Unit_Type_Desc2}", VIN2="${inspection.VIN2}", seenVINs has it: ${seenVINs.has(inspection.VIN2)}`);
            if (inspection.Unit_Type_Desc2 === 'SEMI-TRAILER' && inspection.VIN2 && inspection.VIN2 !== 'UNKNOWN' && !seenVINs.has(inspection.VIN2)) {
                console.log(`🚚 TRAILER VALID: Processing trailer VIN2="${inspection.VIN2}"`);
                seenVINs.add(inspection.VIN2);

                const trailerId = `real_trailer_${leadId}_${inspection.VIN2}`;
                const realTrailer = {
                    id: trailerId,
                    year: extractYearFromVIN(inspection.VIN2) || 'Unknown',
                    make: inspection.Unit_Make2 || 'Unknown',
                    model: 'Semi-Trailer',
                    vin: inspection.VIN2,
                    value: estimateTrailerValueFromVIN(inspection.VIN2).toString(),
                    ownership: 'Unknown', // Inspection data doesn't specify ownership
                    type: 'Dry Van', // Default type
                    length: '53ft', // Default length
                    license: inspection.Unit_License2,
                    state: inspection.Unit_License_State2,
                    source: 'REAL_INSPECTION_DATA'
                };

                // Check if trailer already exists
                const existingTrailer = lead.trailers.find(t => t.vin === inspection.VIN2);
                if (!existingTrailer) {
                    lead.trailers.push(realTrailer);
                    trailersAdded++;
                    console.log(`🚚 REAL FLEET: Added real trailer: ${realTrailer.make} (${realTrailer.vin})`);
                }
            }
        });

        console.log(`✅ REAL FLEET: Added ${vehiclesAdded} real vehicles and ${trailersAdded} real trailers from inspection data`);
        return vehiclesAdded + trailersAdded;
    }

    // NEW: Create driver from contact information during DOT lookup
    function createDriverFromContactInfo(lead, leadId) {
        console.log(`👤 DRIVER AUTO: Creating driver from contact info...`);

        if (!lead.drivers) lead.drivers = [];

        // Check if driver already exists to avoid duplicates
        if (lead.drivers.length > 0) {
            console.log(`👤 DRIVER AUTO: Driver already exists (${lead.drivers.length}), skipping auto-creation`);
            return 0;
        }

        // Extract contact name (could be in 'contact' or 'name' field)
        let contactName = lead.contact || lead.name || '';

        if (!contactName.trim()) {
            console.log(`👤 DRIVER AUTO: No contact name available to create driver`);
            return 0;
        }

        // Clean up the contact name (remove company names, extra text)
        contactName = contactName.trim();

        // Split name into first and last (simple approach)
        const nameParts = contactName.split(' ').filter(part => part.length > 0);
        let firstName = '';
        let lastName = '';

        if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' '); // Everything after first word
        } else if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = '';
        }

        // Create the driver record with contact's name
        const driverRecord = {
            name: `${firstName} ${lastName}`.trim(),
            license: '',        // Leave blank as requested
            dob: '',           // Leave blank as requested
            hireDate: '',      // Leave blank as requested
            experience: '',    // Leave blank as requested (CDL experience)
            violations: ''
        };

        lead.drivers.push(driverRecord);
        console.log(`👤 DRIVER AUTO: Created driver record: "${driverRecord.name}"`);

        return 1; // Return count of drivers created
    }

    // Helper function to calculate years from DOT
    // Helper function to calculate years from actual authority date (ADD_DATE)
    function calculateYearsFromAuthorityDate(addDate) {
        if (!addDate) return '';

        console.log(`🔍 AUTHORITY DATE: Processing ADD_DATE: ${addDate}`);

        // Parse date format: YYYYMMDD (e.g., "20220302")
        if (addDate.length >= 8) {
            const year = parseInt(addDate.substr(0, 4));
            const month = parseInt(addDate.substr(4, 2));
            const day = parseInt(addDate.substr(6, 2));

            if (year && month && day) {
                const authorityDate = new Date(year, month - 1, day); // month is 0-indexed
                const currentDate = new Date();
                const ageInYears = (currentDate - authorityDate) / (365.25 * 24 * 60 * 60 * 1000);

                const years = Math.floor(ageInYears);
                console.log(`🔍 AUTHORITY DATE: Authority granted ${authorityDate.toLocaleDateString()}, ${years} years ago`);

                if (years < 1) return 'Less than 1 year';
                if (years === 1) return '1 year';
                return `${years} years`;
            }
        }

        console.log(`⚠️ AUTHORITY DATE: Could not parse ADD_DATE: ${addDate}`);
        return '';
    }

    function calculateYearsFromDOT(dotNumber) {
        if (!dotNumber) return '';
        const dotNum = parseInt(dotNumber);
        if (dotNum < 1000000) return '25+ years';
        if (dotNum < 2000000) return '15-20 years';
        if (dotNum < 3000000) return '10-15 years';
        return '5-10 years';
    }

    // Helper function to get actual authority age in years for realistic vehicle generation
    function getAuthorityAgeInYears(addDate) {
        if (!addDate || addDate.length < 8) return null;

        const year = parseInt(addDate.substr(0, 4));
        const month = parseInt(addDate.substr(4, 2));
        const day = parseInt(addDate.substr(6, 2));

        if (year && month && day) {
            const authorityDate = new Date(year, month - 1, day);
            const currentDate = new Date();
            const ageInYears = (currentDate - authorityDate) / (365.25 * 24 * 60 * 60 * 1000);
            return Math.max(1, Math.floor(ageInYears)); // Minimum 1 year for vehicle generation
        }

        return null;
    }

    // Helper function to get DOT age in years for realistic vehicle generation (fallback)
    function getDOTAgeInYears(dotNumber) {
        const dotNum = parseInt(dotNumber);
        if (dotNum < 1000000) return 25;
        if (dotNum < 2000000) return 18;
        if (dotNum < 3000000) return 12;
        return 8; // 5-10 years average
    }

    // Helper function to get realistic truck specs based on year
    // REMOVED: All fake vehicle generation helper functions - now using ONLY real inspection data

    // Helper function to extract year from VIN (10th character)
    function extractYearFromVIN(vin) {
        if (!vin || vin.length < 10) return null;

        const yearChar = vin.charAt(9).toUpperCase();
        const yearMapping = {
            'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
            'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
            'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026,
            '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
            '6': 2006, '7': 2007, '8': 2008, '9': 2009
        };

        return yearMapping[yearChar] || null;
    }

    // Helper function to estimate vehicle value from VIN
    function estimateValueFromVIN(vin) {
        const year = extractYearFromVIN(vin);
        if (!year) return 85000; // Default value

        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        const baseValue = 120000; // Base value for truck tractor
        const depreciationRate = 0.08;

        return Math.max(25000, Math.round(baseValue * Math.pow(1 - depreciationRate, age)));
    }

    // Helper function to estimate trailer value from VIN
    function estimateTrailerValueFromVIN(vin) {
        const year = extractYearFromVIN(vin);
        if (!year) return 35000; // Default value

        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        const baseValue = 50000; // Base value for trailer
        const depreciationRate = 0.06;

        return Math.max(15000, Math.round(baseValue * Math.pow(1 - depreciationRate, age)));
    }

    // Helper function to determine commodity from DOT CRGO_ fields (matches carrier search exactly)
    function determineCommodityFromDOTData(carrierData) {
        console.log(`🔍 COMMODITY: Analyzing DOT cargo data using carrier search logic...`);

        const commodities = [];

        // Check various commodity fields from the carrier_details (exact same logic as carrier search)
        const details = carrierData || {};

        if (details.CRGO_GENFREIGHT === 'X') commodities.push('General Freight');
        if (details.CRGO_HOUSEHOLD === 'X') commodities.push('Household Goods');
        if (details.CRGO_METALSHEET === 'X') commodities.push('Metal Sheets');
        if (details.CRGO_MOTOVEH === 'X') commodities.push('Motor Vehicles');
        if (details.CRGO_DRIVETOW === 'X') commodities.push('Drive/Tow Away');
        if (details.CRGO_LOGPOLE === 'X') commodities.push('Logs/Poles');
        if (details.CRGO_BLDGMAT === 'X') commodities.push('Building Materials');
        if (details.CRGO_MOBILEHOME === 'X') commodities.push('Mobile Homes');
        if (details.CRGO_MACHLRG === 'X') commodities.push('Machinery');
        if (details.CRGO_PRODUCE === 'X') commodities.push('Fresh Produce');
        if (details.CRGO_LIQGAS === 'X') commodities.push('Liquids/Gas');
        if (details.CRGO_INTERMODAL === 'X') commodities.push('Intermodal');
        if (details.CRGO_PASSENGERS === 'X') commodities.push('Passengers');
        if (details.CRGO_OILFIELD === 'X') commodities.push('Oilfield Equipment');
        if (details.CRGO_LIVESTOCK === 'X') commodities.push('Livestock');
        if (details.CRGO_GRAINFEED === 'X') commodities.push('Grain/Feed');
        if (details.CRGO_COALCOKE === 'X') commodities.push('Coal/Coke');
        if (details.CRGO_MEAT === 'X') commodities.push('Meat');
        if (details.CRGO_GARBAGE === 'X') commodities.push('Garbage/Refuse');
        if (details.CRGO_USMAIL === 'X') commodities.push('US Mail');
        if (details.CRGO_CHEM === 'X') commodities.push('Chemicals');
        if (details.CRGO_DRYBULK === 'X') commodities.push('Dry Bulk');
        if (details.CRGO_COLDFOOD === 'X') commodities.push('Refrigerated Food');
        if (details.CRGO_BEVERAGES === 'X') commodities.push('Beverages');
        if (details.CRGO_PAPERPROD === 'X') commodities.push('Paper Products');
        if (details.CRGO_UTILITY === 'X') commodities.push('Utilities');
        if (details.CRGO_FARMSUPP === 'X') commodities.push('Farm Supplies');
        if (details.CRGO_CONSTRUCT === 'X') commodities.push('Construction');
        if (details.CRGO_WATERWELL === 'X') commodities.push('Water Well');

        // Check for other cargo description
        if (details.CRGO_CARGOOTHR === 'X' && details.CRGO_CARGOOTHR_DESC) {
            commodities.push(details.CRGO_CARGOOTHR_DESC);
        }

        console.log(`🔍 COMMODITY: Found commodities:`, commodities);

        // Return exactly as carrier search does: comma-separated list or default
        return commodities.length > 0 ? commodities.join(', ') : 'General Freight';
    }

    // Process ONLY newly imported leads (limited scope)
    function processOnlyNewImportedLeads(importedCount) {
        console.log(`🚛 AUTO DOT: Processing ONLY the ${importedCount} most recently imported leads`);

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Get only the most recently added leads (by timestamp or order)
        const recentLeads = leads.slice(-importedCount); // Get last N leads

        console.log(`🚛 AUTO DOT: Checking ${recentLeads.length} recently imported leads for DOT numbers`);

        let processed = 0;
        recentLeads.forEach((lead, index) => {
            console.log(`🔍 AUTO DOT: Examining newly imported lead: ${lead.name} (ID: ${lead.id})`);
            console.log(`🔍 AUTO DOT: DOT Number: "${lead.dotNumber || 'NONE'}"`);

            if (lead.dotNumber && lead.dotNumber.trim() !== '') {
                const missingData = !lead.yearsInBusiness || !lead.state || !lead.commodityHauled;
                console.log(`🔍 AUTO DOT: Missing data check: yearsInBusiness="${lead.yearsInBusiness}", state="${lead.state}", commodityHauled="${lead.commodityHauled}" → Missing: ${missingData}`);

                if (missingData) {
                    console.log(`🚛 AUTO DOT: ✅ New import ${lead.name} has DOT ${lead.dotNumber} and missing data - triggering lookup NOW`);
                    processed++;

                    // Immediate lookup with small stagger
                    setTimeout(() => {
                        performBuiltInDOTLookup(lead.id, lead.dotNumber)
                            .then(result => {
                                if (result && result.success) {
                                    console.log(`✅ AUTO DOT: Successfully processed import ${lead.name} with DOT data`);
                                } else {
                                    console.log(`⚠️ AUTO DOT: No DOT data found for import ${lead.name}`);
                                }
                            });
                    }, index * 500); // Small stagger to avoid API spam
                } else {
                    console.log(`🚛 AUTO DOT: ❌ New import ${lead.name} already has complete DOT data - skipping`);
                }
            } else {
                console.log(`🚛 AUTO DOT: ❌ New import ${lead.name} has no DOT number - skipping`);
            }
        });

        if (processed === 0) {
            console.log(`🚛 AUTO DOT: No newly imported leads needed DOT lookup processing`);
        } else {
            console.log(`🚛 AUTO DOT: Initiated DOT lookup for ${processed} newly imported leads`);
        }
    }

    // Process specific imported lead by name (NEW VERSION - more accurate)
    function processSpecificImportedLead(importedLeadName, importedCount) {
        console.log(`🚛 AUTO DOT: Processing specific imported lead: "${importedLeadName}"`);

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Find the lead by name (exact match or partial match)
        let targetLead = null;
        let targetIndex = -1;

        if (importedLeadName) {
            // Try exact match first
            for (let i = 0; i < leads.length; i++) {
                if (leads[i].name === importedLeadName) {
                    targetLead = leads[i];
                    targetIndex = i;
                    console.log(`🔍 AUTO DOT: Found exact match for "${importedLeadName}" at index ${i}`);
                    break;
                }
            }

            // If no exact match, try partial match (lead name contains the imported name)
            if (!targetLead) {
                for (let i = 0; i < leads.length; i++) {
                    if (leads[i].name && leads[i].name.includes(importedLeadName)) {
                        targetLead = leads[i];
                        targetIndex = i;
                        console.log(`🔍 AUTO DOT: Found partial match for "${importedLeadName}": "${leads[i].name}" at index ${i}`);
                        break;
                    }
                }
            }
        }

        // If we couldn't find the specific lead, fall back to the old method
        if (!targetLead) {
            console.log(`⚠️ AUTO DOT: Could not find specific lead "${importedLeadName}", falling back to recent leads method`);
            processOnlyNewImportedLeads(importedCount);
            return;
        }

        // Process the found lead
        console.log(`🔍 AUTO DOT: Examining imported lead: ${targetLead.name} (ID: ${targetLead.id})`);
        console.log(`🔍 AUTO DOT: DOT Number: "${targetLead.dotNumber || 'NONE'}"`);

        if (targetLead.dotNumber && targetLead.dotNumber.trim() !== '') {
            const missingData = !targetLead.yearsInBusiness || !targetLead.state || !targetLead.commodityHauled;
            console.log(`🔍 AUTO DOT: Missing data check: yearsInBusiness="${targetLead.yearsInBusiness}", state="${targetLead.state}", commodityHauled="${targetLead.commodityHauled}" → Missing: ${missingData}`);

            if (missingData) {
                console.log(`🚛 AUTO DOT: ✅ Imported lead ${targetLead.name} has DOT ${targetLead.dotNumber} and missing data - triggering lookup NOW`);

                // Call the actual DOT lookup
                setTimeout(() => {
                    performBuiltInDOTLookup(targetLead.id, targetLead.dotNumber)
                        .then(result => {
                            if (result && result.success) {
                                console.log(`✅ AUTO DOT: Successfully processed specific import ${targetLead.name} with DOT data`);
                            } else {
                                console.log(`⚠️ AUTO DOT: No DOT data found for specific import ${targetLead.name}`);
                            }
                        });
                }, 500);
            } else {
                console.log(`🚛 AUTO DOT: ❌ Imported lead ${targetLead.name} already has complete DOT data - skipping`);
            }
        } else {
            console.log(`🚛 AUTO DOT: ❌ Imported lead ${targetLead.name} has no DOT number - skipping`);
        }
    }

    // LEGACY: Process all leads function (DISABLED to prevent spam)
    function processLeadsForDOTLookup(newLeads) {
        console.log('🚛 AUTO DOT: processLeadsForDOTLookup() called but DISABLED to prevent spam');
        console.log('🚛 AUTO DOT: Use manual DOT lookup button or import new leads instead');
        return;
        console.log('🚛 AUTO DOT: Checking for leads needing DOT lookup...');
        console.log(`🚛 AUTO DOT: Processing ${newLeads.length} leads`);

        // Get previous leads state from a cached copy
        const previousLeads = window.cachedInsuranceLeads || [];
        console.log(`🚛 AUTO DOT: Previous cache had ${previousLeads.length} leads`);

        // Update cache for next time
        window.cachedInsuranceLeads = [...newLeads];

        // Find leads that are new or have been updated
        const leadsToProcess = [];

        newLeads.forEach(lead => {
            console.log(`🚛 AUTO DOT: Examining lead ${lead.name} (ID: ${lead.id})`);
            console.log(`🚛 AUTO DOT:   DOT Number: "${lead.dotNumber || 'NONE'}"`);

            if (!lead.dotNumber || lead.dotNumber.trim() === '') {
                console.log(`🚛 AUTO DOT:   ❌ Skipping ${lead.name} - no DOT number`);
                return;
            }

            // Find if this lead existed before
            const previousLead = previousLeads.find(prev => prev.id === lead.id);

            // Process if:
            // 1. It's a new lead (no previous version)
            // 2. DOT number changed
            // 3. Missing key data that DOT lookup provides
            const isNewLead = !previousLead;
            const dotChanged = previousLead && previousLead.dotNumber !== lead.dotNumber;
            const missingData = !lead.yearsInBusiness || !lead.state || !lead.commodityHauled;

            console.log(`🚛 AUTO DOT:   Analysis for ${lead.name}:`);
            console.log(`🚛 AUTO DOT:     Is new lead: ${isNewLead}`);
            console.log(`🚛 AUTO DOT:     DOT changed: ${dotChanged}`);
            console.log(`🚛 AUTO DOT:     Missing data: ${missingData}`);
            console.log(`🚛 AUTO DOT:     Current state: "${lead.state || 'EMPTY'}"`);
            console.log(`🚛 AUTO DOT:     Current years: "${lead.yearsInBusiness || 'EMPTY'}"`);
            console.log(`🚛 AUTO DOT:     Current commodity: "${lead.commodityHauled || 'EMPTY'}"`);

            if (isNewLead || dotChanged || missingData) {
                console.log(`🚛 AUTO DOT:   ✅ Will process ${lead.name} for DOT lookup`);
                leadsToProcess.push(lead);
            } else {
                console.log(`🚛 AUTO DOT:   ❌ Skipping ${lead.name} - no processing needed`);
            }
        });

        // Trigger DOT lookups for identified leads
        if (leadsToProcess.length > 0) {
            console.log(`🚛 AUTO DOT: Found ${leadsToProcess.length} leads needing DOT lookup`);

            leadsToProcess.forEach((lead, index) => {
                console.log(`🔍 AUTO DOT: Queuing DOT lookup for ${lead.name} (DOT: ${lead.dotNumber})`);

                // Use built-in DOT lookup since external function isn't available
                setTimeout(() => {
                    console.log(`🚛 AUTO DOT: Starting DOT lookup for ${lead.name} (DOT: ${lead.dotNumber})`);
                    performBuiltInDOTLookup(lead.id, lead.dotNumber)
                        .then(result => {
                            if (result) {
                                console.log(`✅ AUTO DOT: Successfully populated ${lead.name} with carrier data`);
                            } else {
                                console.log(`⚠️ AUTO DOT: No data found for ${lead.name} (DOT: ${lead.dotNumber})`);
                            }
                        })
                        .catch(error => {
                            console.error(`❌ AUTO DOT: Error processing ${lead.name}:`, error);
                        });
                }, index * 2000); // 2 second delay between each lookup
            });
        } else {
            console.log('🚛 AUTO DOT: No leads require DOT lookup at this time');
        }
    }

    // Initialize the cache with current leads
    try {
        const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        window.cachedInsuranceLeads = [...currentLeads];
        console.log(`🚛 AUTO DOT: Initialized cache with ${currentLeads.length} existing leads`);
    } catch (error) {
        window.cachedInsuranceLeads = [];
        console.warn('🚛 AUTO DOT: Could not initialize cache, starting empty');
    }

    // DISABLED: Auto addLead hook - was causing spam
    console.log('🚛 AUTO DOT: addLead auto-hook DISABLED');

    // DISABLED: Form submission hook - was causing spam
    console.log('🚛 AUTO DOT: Form submission auto-hook DISABLED');

    // Keep ONLY Vicidial import detection for NEW leads (not all scanning)
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        originalConsoleLog.apply(console, args);

        const message = args.join(' ');

        // Skip our own debug messages to prevent infinite loop
        if (message.includes('🔍 AUTO DOT DEBUG') || message.includes('🚛 AUTO DOT')) {
            return;
        }

        // ONLY trigger on Vicidial imports (new leads being imported)
        if (message.includes('Selective import initiated:')) {
            console.log('🚛 AUTO DOT: Vicidial import message detected!');
            console.log('🚛 AUTO DOT: Full message:', message);

            // Extract lead name from the message (it's in parentheses at the end)
            const leadNameMatch = message.match(/\(([^)]+)\)$/);
            const importedLeadName = leadNameMatch ? leadNameMatch[1].trim() : null;

            console.log(`🚛 AUTO DOT: Imported lead name: "${importedLeadName}"`);

            // Try different patterns to extract count
            let importedCount = 1; // Default to 1

            // Pattern 1: "imported: 1"
            const importMatch1 = message.match(/imported:\s*(\d+)/);
            if (importMatch1) {
                importedCount = parseInt(importMatch1[1]);
                console.log('🚛 AUTO DOT: Found count via pattern 1:', importedCount);
            }

            // Pattern 2: Look in the object for "imported" property
            const objectMatch = message.match(/\{[^}]+imported:\s*(\d+)[^}]*\}/);
            if (objectMatch) {
                importedCount = parseInt(objectMatch[1]);
                console.log('🚛 AUTO DOT: Found count via object pattern:', importedCount);
            }

            console.log(`🚛 AUTO DOT: Will process ${importedCount} newly imported leads for DOT lookup`);

            setTimeout(() => {
                processSpecificImportedLead(importedLeadName, importedCount);
            }, 1000);
        }

        // Also catch the specific success message format in the object
        if (message.includes('Successfully quick imported')) {
            console.log('🚛 AUTO DOT: Quick import success message detected!');
            console.log('🚛 AUTO DOT: Full message:', message);

            const importMatch = message.match(/(\d+)\s+leads/);
            const importedCount = importMatch ? parseInt(importMatch[1]) : 1;

            console.log(`🚛 AUTO DOT: Will process ${importedCount} leads from success message`);

            setTimeout(() => {
                processOnlyNewImportedLeads(importedCount);
            }, 1000);
        }
    };

    // DISABLED: Input field monitoring - was causing spam
    console.log('🚛 AUTO DOT: Input field auto-monitoring DISABLED');

    // Global functions for manual testing and debugging
    window.debugDOTLookupHook = function() {
        console.log('🔍 DEBUG: DOT Lookup Hook Status');
        console.log('📋 Cached leads count:', (window.cachedInsuranceLeads || []).length);

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadsWithDOT = leads.filter(lead => lead.dotNumber && lead.dotNumber.trim() !== '');

        console.log('🚛 Current leads with DOT numbers:', leadsWithDOT.length);

        leadsWithDOT.forEach(lead => {
            const missingData = !lead.yearsInBusiness || !lead.state || !lead.commodityHauled;
            console.log(`  ${missingData ? '⚠️' : '✅'} ${lead.name} (DOT: ${lead.dotNumber}) - Missing data: ${missingData}`);
        });

        // Test if localStorage.setItem is hooked
        const setItemStr = localStorage.setItem.toString();
        console.log('🔗 localStorage.setItem hooked:', setItemStr.includes('insurance_leads'));

        return {
            totalLeads: leads.length,
            leadsWithDOT: leadsWithDOT.length,
            cachedLeads: (window.cachedInsuranceLeads || []).length,
            isHooked: setItemStr.includes('insurance_leads')
        };
    };

    window.manualDOTLookupTrigger = function(leadId, dotNumber) {
        console.log(`🚛 MANUAL: Triggering DOT lookup for lead ${leadId} with DOT ${dotNumber}`);
        return performBuiltInDOTLookup(leadId, dotNumber);
    };

    window.forceProcessAllDOTLeads = function() {
        console.log('🚫 DISABLED: forceProcessAllDOTLeads() - was causing spam');
        console.log('🚫 Use manual DOT lookup button on individual leads instead');
        return { disabled: true, reason: 'Prevents console spam and resource overuse' };
    };

    console.log('✅ Auto DOT Lookup Hook v22 - REAL DATA + DRIVER AUTO-POPULATION');
    console.log('🚫 DOT lookup ONLY works on: 1) Manual button clicks, 2) New Vicidial imports');
    console.log('🔧 Debug functions available: debugDOTLookupHook(), manualDOTLookupTrigger(leadId, dotNumber)');
})();