// Show the comprehensive 35-vehicle application from app-submissions.js
window.showComprehensiveApplication = function(leadId) {
    console.log('Showing comprehensive 35-vehicle application for lead:', leadId);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const allLeads = [...leads, ...insuranceLeads];
    const lead = allLeads.find(l => l.id == leadId);

    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Create sample data structure that matches what app-submissions.js expects
    const data = {
        // General information
        name: lead.name || '',
        contact: lead.contact || '',
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.address || '',
        dotNumber: lead.dotNumber || lead.dot || '',
        mcNumber: lead.mcNumber || lead.mc || '',
        yearsInBusiness: lead.yearsInBusiness || '',

        // Coverage information
        autoLiability: '$1,000,000',
        medicalPayments: '$5,000',
        comprehensiveDeductible: '$1,000',
        collisionDeductible: '$1,000',
        generalLiability: '$1,000,000',
        cargoLimit: '$100,000',
        cargoDeductible: '$1,000',
        roadsideAssistance: 'Yes',

        // Sample vehicle data for demonstration (populate first few vehicles)
        vehicle1Year: '2020',
        vehicle1Make: 'Freightliner Cascadia',
        vehicle1Type: 'Tractor',
        vehicle1TrailerType: 'Dry Van',
        vehicle1VIN: '1FUJGHDV8LLAW2345',
        vehicle1Value: '$85,000',
        vehicle1Radius: '500+ miles',

        vehicle2Year: '2019',
        vehicle2Make: 'Peterbilt 579',
        vehicle2Type: 'Tractor',
        vehicle2TrailerType: 'Reefer',
        vehicle2VIN: '1XP5DB9X5KD123456',
        vehicle2Value: '$92,000',
        vehicle2Radius: '500+ miles',

        vehicle3Year: '2021',
        vehicle3Make: 'Kenworth T680',
        vehicle3Type: 'Tractor',
        vehicle3TrailerType: 'Flatbed',
        vehicle3VIN: '1XKDD99X5MJ789012',
        vehicle3Value: '$95,000',
        vehicle3Radius: '300+ miles',

        // Sample driver data
        driver1Name: 'John Smith',
        driver1DOB: '1980-05-15',
        driver1License: 'CDL123456',
        driver1Experience: '15 years',
        driver1Violations: 'None',

        driver2Name: 'Maria Rodriguez',
        driver2DOB: '1985-08-22',
        driver2License: 'CDL789012',
        driver2Experience: '8 years',
        driver2Violations: '1 speeding (2021)',

        // Additional interests
        additionalInterestName1: 'ABC Leasing Company',
        additionalInterestAddress1: '123 Finance St, Columbus OH 43215',
        additionalInterestType1: 'LP',
        additionalInterestPercent1: '100'
    };

    // Remove existing modal
    const existingModal = document.getElementById('comprehensive-app-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal using the exact structure from app-submissions.js
    const modal = document.createElement('div');
    modal.id = 'comprehensive-app-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 95%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    // Use the EXACT structure from app-submissions.js lines 430-658
    content.innerHTML = `
        <button onclick="document.getElementById('comprehensive-app-modal').remove();"
                style="position: absolute; top: 15px; right: 15px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                onmouseout="this.style.backgroundColor='white'; this.style.color='#666'">
            ×
        </button>

        <div style="padding: 40px; background: white;">
            <!-- Header from app-submissions.js -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 20px;">
                <div style="background: #0066cc; color: white; padding: 15px; margin: -40px -40px 20px -40px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold;">VANGUARD INSURANCE GROUP</h1>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">2888 Nationwide Pkwy, Brunswick, OH 44212 • (330) 460-0872</p>
                </div>
                <div style="text-align: left; margin-top: 20px;">
                    <h2 style="margin: 0; color: #0066cc; font-size: 28px;">TRUCKING APPLICATION</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Professional Commercial Auto Insurance Application</p>
                </div>
            </div>

            <!-- GENERAL INFORMATION -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">GENERAL INFORMATION</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Insured's Name:</label>
                            <input type="text" id="insuredName" value="${data.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact Person:</label>
                            <input type="text" id="contactPerson" value="${data.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Business Phone:</label>
                            <input type="text" id="businessPhone" value="${data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                            <input type="email" id="email" value="${data.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Mailing Address:</label>
                            <input type="text" id="mailingAddress" value="${data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">US DOT #:</label>
                            <input type="text" id="dotNumber" value="${data.dotNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">MC #:</label>
                            <input type="text" id="mcNumber" value="${data.mcNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Years in Business:</label>
                            <input type="text" id="yearsInBusiness" value="${data.yearsInBusiness || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCHEDULE OF DRIVERS -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF DRIVERS</h3>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.addDriverRow()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Driver
                        </button>
                    </div>
                    <table id="driversTable" style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">DOB</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">License #</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Experience</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Violations</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; width: 40px;">Action</th>
                        </tr>
                        ${Array.from({length: 25}, (_, i) => i + 1).map(i => `
                            <tr id="driverRow${i}" style="display: ${i <= 2 ? 'table-row' : 'none'};">
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}Name" value="${data[`driver${i}Name`] || ''}"
                                           placeholder="Full Name" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="date" id="driver${i}DOB" value="${data[`driver${i}DOB`] || ''}"
                                           style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}License" value="${data[`driver${i}License`] || ''}"
                                           placeholder="License #" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}Experience" value="${data[`driver${i}Experience`] || ''}"
                                           placeholder="Years" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}Violations" value="${data[`driver${i}Violations`] || ''}"
                                           placeholder="Violations" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5; text-align: center;">
                                    <button onclick="window.removeDriverRow(${i})" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>

            <!-- SCHEDULE OF AUTOS - THE COMPREHENSIVE 35 VEHICLE SECTION -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF AUTOS</h3>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.addVehicleRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    </div>
                    <table id="vehiclesTable" style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Year</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Make/Model</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type of Truck</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Trailer Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">VIN</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Value</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Radius</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; width: 40px;">Action</th>
                        </tr>
                        ${Array.from({length: 35}, (_, i) => i + 1).map(i => `
                            <tr id="vehicleRow${i}" style="display: ${i <= 3 ? 'table-row' : 'none'};">
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}Year" value="${data[`vehicle${i}Year`] || ''}"
                                           placeholder="Year" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}Make" value="${data[`vehicle${i}Make`] || ''}"
                                           placeholder="Make/Model" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="vehicle${i}Type" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Type</option>
                                        <option value="Tractor" ${data[`vehicle${i}Type`] === 'Tractor' ? 'selected' : ''}>Tractor</option>
                                        <option value="Truck" ${data[`vehicle${i}Type`] === 'Truck' ? 'selected' : ''}>Truck</option>
                                        <option value="Box Truck" ${data[`vehicle${i}Type`] === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
                                        <option value="Dump Truck" ${data[`vehicle${i}Type`] === 'Dump Truck' ? 'selected' : ''}>Dump Truck</option>
                                        <option value="Other" ${data[`vehicle${i}Type`] === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="vehicle${i}TrailerType" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Trailer</option>
                                        <option value="Dry Van" ${data[`vehicle${i}TrailerType`] === 'Dry Van' ? 'selected' : ''}>Dry Van</option>
                                        <option value="Reefer" ${data[`vehicle${i}TrailerType`] === 'Reefer' ? 'selected' : ''}>Reefer</option>
                                        <option value="Flatbed" ${data[`vehicle${i}TrailerType`] === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
                                        <option value="Tank" ${data[`vehicle${i}TrailerType`] === 'Tank' ? 'selected' : ''}>Tank</option>
                                        <option value="Auto Hauler" ${data[`vehicle${i}TrailerType`] === 'Auto Hauler' ? 'selected' : ''}>Auto Hauler</option>
                                        <option value="Other" ${data[`vehicle${i}TrailerType`] === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}VIN" value="${data[`vehicle${i}VIN`] || ''}"
                                           placeholder="VIN" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}Value" value="${data[`vehicle${i}Value`] || ''}"
                                           placeholder="$" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="vehicle${i}Radius" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Radius</option>
                                        <option value="0-100 miles" ${data[`vehicle${i}Radius`] === '0-100 miles' ? 'selected' : ''}>0-100 miles</option>
                                        <option value="101-300 miles" ${data[`vehicle${i}Radius`] === '101-300 miles' ? 'selected' : ''}>101-300 miles</option>
                                        <option value="300+ miles" ${data[`vehicle${i}Radius`] === '300+ miles' ? 'selected' : ''}>300+ miles</option>
                                        <option value="500+ miles" ${data[`vehicle${i}Radius`] === '500+ miles' ? 'selected' : ''}>500+ miles</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5; text-align: center;">
                                    <button onclick="window.removeVehicleRow(${i})" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>

            <!-- COVERAGES -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">COVERAGES</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Auto Liability:</label>
                            <input type="text" id="autoLiability" value="${data.autoLiability || ''}" placeholder="$1,000,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Medical Payments:</label>
                            <input type="text" id="medicalPayments" value="${data.medicalPayments || ''}" placeholder="$5,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Comprehensive Deductible:</label>
                            <input type="text" id="comprehensiveDeductible" value="${data.comprehensiveDeductible || ''}" placeholder="$1,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Collision Deductible:</label>
                            <input type="text" id="collisionDeductible" value="${data.collisionDeductible || ''}" placeholder="$1,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">General Liability:</label>
                            <input type="text" id="generalLiability" value="${data.generalLiability || ''}" placeholder="$1,000,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Limit:</label>
                            <input type="text" id="cargoLimit" value="${data.cargoLimit || ''}" placeholder="$100,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Deductible:</label>
                            <input type="text" id="cargoDeductible" value="${data.cargoDeductible || ''}" placeholder="$1,000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Roadside Assistance:</label>
                            <select id="roadsideAssistance" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <option value="">Select</option>
                                <option value="Yes" ${data.roadsideAssistance === 'Yes' ? 'selected' : ''}>Yes</option>
                                <option value="No" ${data.roadsideAssistance === 'No' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADDITIONAL INTERESTS -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">ADDITIONAL INTERESTS</h3>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.addAdditionalInterestRow()" style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Additional Interest
                        </button>
                    </div>
                    <p style="margin: 0 0 10px 0; font-size: 10px;"><strong>AI</strong>-Additional insured &nbsp;&nbsp; <strong>LP</strong>-Loss Payee &nbsp;&nbsp; <strong>AL</strong>-Additional Insured & Loss Payee</p>
                    <table id="additionalInterestsTable" style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name & Address</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">% Interest</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; width: 40px;">Action</th>
                        </tr>
                        ${Array.from({length: 5}, (_, i) => i + 1).map(i => `
                            <tr id="additionalInterestRow${i}" style="display: ${i <= 1 ? 'table-row' : 'none'};">
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="additionalInterestName${i}" value="${data[`additionalInterestName${i}`] || ''}"
                                           placeholder="Name" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px; margin-bottom: 4px;">
                                    <input type="text" id="additionalInterestAddress${i}" value="${data[`additionalInterestAddress${i}`] || ''}"
                                           placeholder="Address" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="additionalInterestType${i}" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Type</option>
                                        <option value="AI" ${data[`additionalInterestType${i}`] === 'AI' ? 'selected' : ''}>AI - Additional Insured</option>
                                        <option value="LP" ${data[`additionalInterestType${i}`] === 'LP' ? 'selected' : ''}>LP - Loss Payee</option>
                                        <option value="AL" ${data[`additionalInterestType${i}`] === 'AL' ? 'selected' : ''}>AL - Additional Insured & Loss Payee</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="additionalInterestPercent${i}" value="${data[`additionalInterestPercent${i}`] || ''}"
                                           placeholder="%" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5; text-align: center;">
                                    <button onclick="window.removeAdditionalInterestRow(${i})" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
                <button onclick="window.saveComprehensiveApplication('${leadId}')"
                        style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    <i class="fas fa-save"></i> Save Application
                </button>
                <button onclick="window.printApplication()"
                        style="background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    <i class="fas fa-print"></i> Print
                </button>
                <button onclick="document.getElementById('comprehensive-app-modal').remove();"
                        style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    console.log('Comprehensive 35-vehicle application displayed');
};

// Show comprehensive application for editing with pre-filled data
window.showComprehensiveApplicationForEdit = function(leadId, existingApplication) {
    console.log('📝 Showing comprehensive application for editing:', existingApplication.id);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const allLeads = [...leads, ...insuranceLeads];
    const lead = allLeads.find(l => l.id == leadId);

    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Merge lead data with existing application data
    const data = { ...lead, ...existingApplication.formData };

    // Remove any existing modal
    const existingModal = document.getElementById('comprehensive-app-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Call the regular comprehensive application function but with merged data
    // We'll modify the original function to accept pre-filled data
    window.showComprehensiveApplicationWithData(leadId, data, existingApplication.id);
};

// Modified version that accepts pre-filled data and existing application ID
window.showComprehensiveApplicationWithData = function(leadId, prefilledData, existingAppId = null) {
    console.log('Showing comprehensive application with prefilled data:', prefilledData);

    // Use the provided data instead of loading from scratch
    const data = prefilledData;

    // Remove any existing modal
    const existingModal = document.getElementById('comprehensive-app-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal using the exact same structure as the main function
    const modal = document.createElement('div');
    modal.id = 'comprehensive-app-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 95%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    // Use the EXACT SAME HTML structure as the main comprehensive application
    content.innerHTML = `
        <button onclick="document.getElementById('comprehensive-app-modal').remove();"
                style="position: absolute; top: 15px; right: 15px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                onmouseout="this.style.backgroundColor='white'; this.style.color='#666'">
            ×
        </button>

        <div style="padding: 40px; background: white;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 20px;">
                <div style="background: #0066cc; color: white; padding: 15px; margin: -40px -40px 20px -40px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold;">VANGUARD INSURANCE GROUP</h1>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">2888 Nationwide Pkwy, Brunswick, OH 44212 • (330) 460-0872</p>
                </div>
                <div style="text-align: left; margin-top: 20px;">
                    <h2 style="margin: 0; color: #0066cc; font-size: 28px;">TRUCKING APPLICATION ${existingAppId ? '(EDITING)' : ''}</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Professional Commercial Auto Insurance Application ${existingAppId ? '• Application ID: ' + existingAppId : ''}</p>
                </div>
            </div>

            <!-- GENERAL INFORMATION -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">GENERAL INFORMATION</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Insured's Name:</label>
                            <input type="text" id="name" value="${data.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact Person:</label>
                            <input type="text" id="contact" value="${data.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Business Phone:</label>
                            <input type="text" id="phone" value="${data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                            <input type="email" id="email" value="${data.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Mailing Address:</label>
                            <input type="text" id="address" value="${data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">US DOT #:</label>
                            <input type="text" id="dotNumber" value="${data.dotNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">MC #:</label>
                            <input type="text" id="mcNumber" value="${data.mcNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Years in Business:</label>
                            <input type="text" id="yearsInBusiness" value="${data.yearsInBusiness || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCHEDULE OF DRIVERS -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF DRIVERS</h3>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">DOB</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">License #</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Experience</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Violations</th>
                        </tr>
                        ${Array.from({length: 25}, (_, i) => i + 1).map(i => `
                            <tr>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="driver${i}Name" value="${data[`driver${i}Name`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="driver${i}DOB" value="${data[`driver${i}DOB`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="driver${i}License" value="${data[`driver${i}License`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="driver${i}Experience" value="${data[`driver${i}Experience`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="driver${i}Violations" value="${data[`driver${i}Violations`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>

            <!-- SCHEDULE OF AUTOS -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF AUTOS (35 Vehicles)</h3>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Year</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Make/Model</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Trailer</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">VIN</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Value</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Radius</th>
                        </tr>
                        ${Array.from({length: 35}, (_, i) => i + 1).map(i => `
                            <tr>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}Year" value="${data[`vehicle${i}Year`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}Make" value="${data[`vehicle${i}Make`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}Type" value="${data[`vehicle${i}Type`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}TrailerType" value="${data[`vehicle${i}TrailerType`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}VIN" value="${data[`vehicle${i}VIN`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}Value" value="${data[`vehicle${i}Value`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="vehicle${i}Radius" value="${data[`vehicle${i}Radius`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>

            <!-- COVERAGES -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">COVERAGES</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Auto Liability:</label>
                            <input type="text" id="autoLiability" value="${data.autoLiability || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Medical Payments:</label>
                            <input type="text" id="medicalPayments" value="${data.medicalPayments || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Comprehensive Deductible:</label>
                            <input type="text" id="comprehensiveDeductible" value="${data.comprehensiveDeductible || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Collision Deductible:</label>
                            <input type="text" id="collisionDeductible" value="${data.collisionDeductible || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">General Liability:</label>
                            <input type="text" id="generalLiability" value="${data.generalLiability || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Limit:</label>
                            <input type="text" id="cargoLimit" value="${data.cargoLimit || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Deductible:</label>
                            <input type="text" id="cargoDeductible" value="${data.cargoDeductible || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Roadside Assistance:</label>
                            <input type="text" id="roadsideAssistance" value="${data.roadsideAssistance || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADDITIONAL INTERESTS -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">ADDITIONAL INTERESTS</h3>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name & Address</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">% Interest</th>
                        </tr>
                        ${Array.from({length: 5}, (_, i) => i + 1).map(i => `
                            <tr>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="additionalInterestName${i}" placeholder="Name" value="${data[`additionalInterestName${i}`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px; margin-bottom: 2px;">
                                    <input type="text" id="additionalInterestAddress${i}" placeholder="Address" value="${data[`additionalInterestAddress${i}`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="additionalInterestType${i}" value="${data[`additionalInterestType${i}`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;"><input type="text" id="additionalInterestPercent${i}" value="${data[`additionalInterestPercent${i}`] || ''}" style="width: 100%; padding: 4px; border: none; font-size: 11px;"></td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
                <button onclick="window.saveComprehensiveApplication('${leadId}', '${existingAppId || ''}')"
                        style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    <i class="fas fa-save"></i> ${existingAppId ? 'Update Application' : 'Save Application'}
                </button>
                <button onclick="window.printApplication()"
                        style="background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    <i class="fas fa-print"></i> Print
                </button>
                <button onclick="document.getElementById('comprehensive-app-modal').remove();"
                        style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    console.log('Comprehensive application with prefilled data displayed');
};

}

// Vehicle management functions
window.addVehicleRow = function() {
    const table = document.getElementById('vehiclesTable');
    if (!table) return;

    // Find the next hidden row and show it
    for (let i = 1; i <= 35; i++) {
        const row = document.getElementById(`vehicleRow${i}`);
        if (row && row.style.display === 'none') {
            row.style.display = 'table-row';
            console.log(`Added vehicle row ${i}`);
            return;
        }
    }
    alert('Maximum 35 vehicles reached');
};

window.removeVehicleRow = function(rowNum) {
    const row = document.getElementById(`vehicleRow${rowNum}`);
    if (row) {
        // Clear all fields in the row
        row.querySelectorAll('input, select').forEach(field => {
            field.value = '';
        });
        // Hide the row
        row.style.display = 'none';
        console.log(`Removed vehicle row ${rowNum}`);
    }
};

// Driver management functions
window.addDriverRow = function() {
    const table = document.getElementById('driversTable');
    if (!table) return;

    // Find the next hidden row and show it
    for (let i = 1; i <= 25; i++) {
        const row = document.getElementById(`driverRow${i}`);
        if (row && row.style.display === 'none') {
            row.style.display = 'table-row';
            console.log(`Added driver row ${i}`);
            return;
        }
    }
    alert('Maximum 25 drivers reached');
};

window.removeDriverRow = function(rowNum) {
    const row = document.getElementById(`driverRow${rowNum}`);
    if (row) {
        // Clear all fields in the row
        row.querySelectorAll('input, select').forEach(field => {
            field.value = '';
        });
        // Hide the row
        row.style.display = 'none';
        console.log(`Removed driver row ${rowNum}`);
    }
};

// Additional Interest management functions
window.addAdditionalInterestRow = function() {
    const table = document.getElementById('additionalInterestsTable');
    if (!table) return;

    // Find the next hidden row and show it
    for (let i = 1; i <= 5; i++) {
        const row = document.getElementById(`additionalInterestRow${i}`);
        if (row && row.style.display === 'none') {
            row.style.display = 'table-row';
            console.log(`Added additional interest row ${i}`);
            return;
        }
    }
    alert('Maximum 5 additional interests reached');
};

window.removeAdditionalInterestRow = function(rowNum) {
    const row = document.getElementById(`additionalInterestRow${rowNum}`);
    if (row) {
        // Clear all fields in the row
        row.querySelectorAll('input, select').forEach(field => {
            field.value = '';
        });
        // Hide the row
        row.style.display = 'none';
        console.log(`Removed additional interest row ${rowNum}`);
    }
};

// Save application function
window.saveComprehensiveApplication = function(leadId) {
    console.log('Saving comprehensive application for lead:', leadId);

    const applicationData = {
        id: 'app_' + Date.now(),
        leadId: leadId,
        created: new Date().toISOString(),
        status: 'saved',
        type: 'comprehensive-trucking',
        formData: {}
    };

    console.log('💾 Saving application with leadId:', leadId, '(type:', typeof leadId, ')');

    // Collect general information
    applicationData.formData.name = document.getElementById('insuredName')?.value || '';
    applicationData.formData.contact = document.getElementById('contactPerson')?.value || '';
    applicationData.formData.phone = document.getElementById('businessPhone')?.value || '';
    applicationData.formData.email = document.getElementById('email')?.value || '';
    applicationData.formData.address = document.getElementById('mailingAddress')?.value || '';
    applicationData.formData.dotNumber = document.getElementById('dotNumber')?.value || '';
    applicationData.formData.mcNumber = document.getElementById('mcNumber')?.value || '';
    applicationData.formData.yearsInBusiness = document.getElementById('yearsInBusiness')?.value || '';

    // Collect all 35 vehicle data
    for (let i = 1; i <= 35; i++) {
        const year = document.getElementById(`vehicle${i}Year`)?.value || '';
        const make = document.getElementById(`vehicle${i}Make`)?.value || '';
        const type = document.getElementById(`vehicle${i}Type`)?.value || '';
        const trailerType = document.getElementById(`vehicle${i}TrailerType`)?.value || '';
        const vin = document.getElementById(`vehicle${i}VIN`)?.value || '';
        const value = document.getElementById(`vehicle${i}Value`)?.value || '';
        const radius = document.getElementById(`vehicle${i}Radius`)?.value || '';

        if (year || make || type || trailerType || vin || value || radius) {
            applicationData.formData[`vehicle${i}Year`] = year;
            applicationData.formData[`vehicle${i}Make`] = make;
            applicationData.formData[`vehicle${i}Type`] = type;
            applicationData.formData[`vehicle${i}TrailerType`] = trailerType;
            applicationData.formData[`vehicle${i}VIN`] = vin;
            applicationData.formData[`vehicle${i}Value`] = value;
            applicationData.formData[`vehicle${i}Radius`] = radius;
        }
    }

    // Collect all 25 driver data
    for (let i = 1; i <= 25; i++) {
        const name = document.getElementById(`driver${i}Name`)?.value || '';
        const dob = document.getElementById(`driver${i}DOB`)?.value || '';
        const license = document.getElementById(`driver${i}License`)?.value || '';
        const experience = document.getElementById(`driver${i}Experience`)?.value || '';
        const violations = document.getElementById(`driver${i}Violations`)?.value || '';

        if (name || dob || license || experience || violations) {
            applicationData.formData[`driver${i}Name`] = name;
            applicationData.formData[`driver${i}DOB`] = dob;
            applicationData.formData[`driver${i}License`] = license;
            applicationData.formData[`driver${i}Experience`] = experience;
            applicationData.formData[`driver${i}Violations`] = violations;
        }
    }

    // Collect coverage data
    applicationData.formData.autoLiability = document.getElementById('autoLiability')?.value || '';
    applicationData.formData.medicalPayments = document.getElementById('medicalPayments')?.value || '';
    applicationData.formData.comprehensiveDeductible = document.getElementById('comprehensiveDeductible')?.value || '';
    applicationData.formData.collisionDeductible = document.getElementById('collisionDeductible')?.value || '';
    applicationData.formData.generalLiability = document.getElementById('generalLiability')?.value || '';
    applicationData.formData.cargoLimit = document.getElementById('cargoLimit')?.value || '';
    applicationData.formData.cargoDeductible = document.getElementById('cargoDeductible')?.value || '';
    applicationData.formData.roadsideAssistance = document.getElementById('roadsideAssistance')?.value || '';

    // Collect additional interests data
    for (let i = 1; i <= 5; i++) {
        const name = document.getElementById(`additionalInterestName${i}`)?.value || '';
        const address = document.getElementById(`additionalInterestAddress${i}`)?.value || '';
        const type = document.getElementById(`additionalInterestType${i}`)?.value || '';
        const percent = document.getElementById(`additionalInterestPercent${i}`)?.value || '';

        if (name || address || type || percent) {
            applicationData.formData[`additionalInterestName${i}`] = name;
            applicationData.formData[`additionalInterestAddress${i}`] = address;
            applicationData.formData[`additionalInterestType${i}`] = type;
            applicationData.formData[`additionalInterestPercent${i}`] = percent;
        }
    }

    // Count vehicles for the success message
    const vehicleCount = Object.keys(applicationData.formData).filter(key => key.includes('vehicle') && key.includes('Year') && applicationData.formData[key]).length;

    // Save to localStorage
    const submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
    submissions.push(applicationData);
    localStorage.setItem('appSubmissions', JSON.stringify(submissions));

    // Debug: Log the saved data
    console.log('Saved to localStorage. Total submissions now:', submissions.length);
    console.log('Latest submission:', applicationData);

    // Close the modal first
    const modal = document.getElementById('comprehensive-app-modal');
    if (modal) {
        modal.remove();
    }

    // Try to save to server (but don't wait for it)
    saveApplicationToServer(applicationData).catch(error => {
        console.warn('Server save failed, but application saved locally:', error);
    });

    // Refresh the lead profile Application Submissions section
    console.log('🔄 Refreshing lead profile Application Submissions section for lead:', leadId);

    // Instead of reloading all applications, just add the new one to the display
    if (window.addNewApplicationToDisplay && typeof window.addNewApplicationToDisplay === 'function') {
        console.log('📋 Adding new application to display for lead:', leadId);
        window.addNewApplicationToDisplay(leadId, applicationData);
    } else {
        // Fallback to full refresh
        if (window.showApplicationSubmissions && typeof window.showApplicationSubmissions === 'function') {
            console.log('📋 Calling showApplicationSubmissions for lead:', leadId);
            window.showApplicationSubmissions(leadId);
        }
    }

    // Also refresh the app submissions system if available
    if (window.appSubmissions && typeof window.appSubmissions.loadSubmissions === 'function') {
        window.appSubmissions.loadSubmissions().catch(() => {
            console.log('Server failed, but lead profile should still refresh');
        });
    }

    // Show success message
    alert(`✅ Comprehensive trucking application saved successfully!\n\nApplication ID: ${applicationData.id}\nVehicles captured: ${vehicleCount}\n\nYou can view it in App Submissions.`);

    console.log('Application saved:', applicationData);
};

// Save to server function
async function saveApplicationToServer(applicationData) {
    return new Promise((resolve, reject) => {
        try {
            const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`);

            // Construct the correct URL (avoid double /api/ if API_URL already includes it)
            const saveUrl = API_URL.includes('/api')
                ? `${API_URL}/app-submissions`
                : `${API_URL}/api/app-submissions`;

            console.log('🌐 API_URL:', API_URL);
            console.log('🌐 Attempting server save to:', saveUrl);
            console.log('📦 Application data being sent:', applicationData);

            fetch(saveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(applicationData)
            })
            .then(response => {
                console.log('📡 Server response status:', response.status, response.statusText);
                console.log('📡 Response ok:', response.ok);

                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
                }
            })
            .then(data => {
                console.log('✅ Application saved to server successfully:', data);
                resolve(true);
            })
            .catch(error => {
                console.warn('Server save failed, application saved locally:', error.message);
                reject(error);
            });
        } catch (error) {
            console.warn('Error attempting to save to server:', error.message);
            reject(error);
        }
    });
}

// Print application function
window.printApplication = function() {
    window.print();
};