// Real ACORD 25 Form Display - Shows actual ACORD 25 certificate layout
console.log('📄 Real ACORD 25 Form Display loading...');

// Override prepareCOI to show real ACORD 25 form
window.prepareCOI = function(policyId) {
    console.log('🎯 Showing REAL ACORD 25 form for policy:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.policyNumber) === String(policyId) ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    // Extract policy details
    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       'Unknown';
    const policyNumber = policy.policyNumber || policy.id;
    const carrier = policy.carrier || policy.overview?.['Carrier'] || 'N/A';
    const effectiveDate = policy.effectiveDate || policy.overview?.['Effective Date'] || '';
    const expirationDate = policy.expirationDate || policy.overview?.['Expiration Date'] || '';
    const todayDate = new Date().toLocaleDateString('en-US');

    // Coverage limits
    const liabilityLimit = policy.coverage?.['Liability Limit'] ||
                          policy.coverage?.['Combined Single Limit'] ||
                          '$1,000,000';
    const cargoLimit = policy.coverage?.['Cargo Limit'] || '';
    const generalAggregate = policy.coverage?.['General Aggregate'] || '$2,000,000';
    const productsAggregate = policy.coverage?.['Products-Comp/Op Agg'] || '$2,000,000';
    const personalInjury = policy.coverage?.['Personal & Adv Injury'] || '$1,000,000';
    const eachOccurrence = policy.coverage?.['Each Occurrence'] || '$1,000,000';

    // Display ACTUAL ACORD 25 form layout
    policyViewer.innerHTML = `
        <div style="padding: 20px; background: white; font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
            <!-- Back Button -->
            <button onclick="backToPolicyList()"
                    style="margin-bottom: 20px; background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-arrow-left"></i> Back to Policy List
            </button>

            <!-- ACORD 25 FORM -->
            <div style="border: 2px solid #000; padding: 10px; background: white;">

                <!-- ACORD Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <div style="font-size: 20px; font-weight: bold;">ACORD®</div>
                    </div>
                    <div style="text-align: center; flex-grow: 1;">
                        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">CERTIFICATE OF LIABILITY INSURANCE</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px;">DATE (MM/DD/YYYY)</div>
                        <div style="font-size: 12px; font-weight: bold;">${todayDate}</div>
                    </div>
                </div>

                <!-- Important Notice -->
                <div style="background: #f0f0f0; padding: 5px; margin-bottom: 10px; font-size: 8px; text-align: center;">
                    THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS
                    CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES
                    BELOW. THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED
                    REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER.
                </div>

                <!-- Producer and Insured Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <!-- Producer Box -->
                    <div style="border: 1px solid #000; padding: 10px;">
                        <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">PRODUCER</div>
                        <div style="font-size: 11px;">
                            <strong>Vanguard Insurance Group</strong><br>
                            123 Insurance Way<br>
                            New York, NY 10001<br>
                            <br>
                            Phone: (555) 123-4567<br>
                            Fax: (555) 123-4568<br>
                            Email: coi@vanguardins.com
                        </div>
                    </div>

                    <!-- Insured Box -->
                    <div style="border: 1px solid #000; padding: 10px;">
                        <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">INSURED</div>
                        <div style="font-size: 11px;">
                            <strong>${insuredName}</strong><br>
                            ${policy.insured?.['Address'] || policy.address || '123 Business St'}<br>
                            ${policy.insured?.['City'] || policy.city || 'City'},
                            ${policy.insured?.['State'] || policy.state || 'ST'}
                            ${policy.insured?.['Zip'] || policy.zip || '12345'}<br>
                        </div>
                    </div>
                </div>

                <!-- Insurers Section -->
                <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">
                        INSURERS AFFORDING COVERAGE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAIC #
                    </div>
                    <div style="display: grid; grid-template-columns: 30px 1fr 100px; gap: 10px; font-size: 11px;">
                        <div>INSURER A:</div>
                        <div><strong>${carrier}</strong></div>
                        <div>25658</div>
                    </div>
                </div>

                <!-- Coverage Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px; text-align: left;">INSR LTR</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px; text-align: left;">TYPE OF INSURANCE</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px; width: 30px;">ADDL INSD</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px; width: 30px;">SUBR WVD</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px;">POLICY NUMBER</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px;">POLICY EFF DATE (MM/DD/YYYY)</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px;">POLICY EXP DATE (MM/DD/YYYY)</th>
                            <th style="border: 1px solid #000; padding: 5px; font-size: 9px;">LIMITS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Commercial General Liability -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px; text-align: center;">A</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">
                                <div style="display: flex; gap: 10px;">
                                    <label><input type="checkbox" checked> COMMERCIAL GENERAL LIABILITY</label>
                                </div>
                                <div style="display: flex; gap: 10px; margin-top: 5px;">
                                    <label><input type="checkbox"> CLAIMS-MADE</label>
                                    <label><input type="checkbox" checked> OCCUR</label>
                                </div>
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                <input type="checkbox" checked>
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                <input type="checkbox">
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">${policyNumber}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">${effectiveDate}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">${expirationDate}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">
                                EACH OCCURRENCE: ${eachOccurrence}<br>
                                DAMAGE TO RENTED PREMISES: $100,000<br>
                                MED EXP: $5,000<br>
                                PERSONAL & ADV INJURY: ${personalInjury}<br>
                                GENERAL AGGREGATE: ${generalAggregate}<br>
                                PRODUCTS-COMP/OP AGG: ${productsAggregate}
                            </td>
                        </tr>

                        <!-- Automobile Liability -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px; text-align: center;">A</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">
                                <div style="display: flex; gap: 10px;">
                                    <label><input type="checkbox" ${policy.policyType?.includes('auto') ? 'checked' : ''}> AUTOMOBILE LIABILITY</label>
                                </div>
                                <div style="display: flex; gap: 10px; margin-top: 5px;">
                                    <label><input type="checkbox" checked> ANY AUTO</label>
                                </div>
                                <div style="display: flex; gap: 10px; margin-top: 5px;">
                                    <label><input type="checkbox"> OWNED AUTOS ONLY</label>
                                    <label><input type="checkbox"> HIRED AUTOS ONLY</label>
                                </div>
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                <input type="checkbox" ${policy.policyType?.includes('auto') ? 'checked' : ''}>
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                <input type="checkbox">
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">${policy.policyType?.includes('auto') ? policyNumber : ''}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">${policy.policyType?.includes('auto') ? effectiveDate : ''}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">${policy.policyType?.includes('auto') ? expirationDate : ''}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">
                                ${policy.policyType?.includes('auto') ? `
                                    COMBINED SINGLE LIMIT: ${liabilityLimit}<br>
                                    BODILY INJURY (Per person): <br>
                                    BODILY INJURY (Per accident): <br>
                                    PROPERTY DAMAGE:
                                ` : ''}
                                ${cargoLimit ? `<br>CARGO: ${cargoLimit}` : ''}
                            </td>
                        </tr>

                        <!-- Umbrella/Excess -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px; text-align: center;"></td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">
                                <label><input type="checkbox"> UMBRELLA LIAB</label><br>
                                <label><input type="checkbox"> EXCESS LIAB</label>
                            </td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">
                                EACH OCCURRENCE: <br>
                                AGGREGATE:
                            </td>
                        </tr>

                        <!-- Workers Compensation -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px; text-align: center;"></td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 10px;">
                                WORKERS COMPENSATION<br>
                                AND EMPLOYERS' LIABILITY
                            </td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px;"></td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">
                                E.L. EACH ACCIDENT: <br>
                                E.L. DISEASE - EA EMPLOYEE: <br>
                                E.L. DISEASE - POLICY LIMIT:
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Description of Operations -->
                <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">
                        DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES (ACORD 101, Additional Remarks Schedule, may be attached if more space is required)
                    </div>
                    <div style="font-size: 10px; min-height: 40px;">
                        Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.
                    </div>
                </div>

                <!-- Certificate Holder -->
                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 10px;">
                    <div style="border: 1px solid #000; padding: 10px;">
                        <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">CERTIFICATE HOLDER</div>
                        <div style="font-size: 11px; min-height: 60px;">
                            <input type="text" placeholder="Enter Certificate Holder Name"
                                   style="width: 100%; margin-bottom: 5px; padding: 5px; border: 1px solid #ccc;">
                            <textarea placeholder="Enter Certificate Holder Address"
                                      style="width: 100%; height: 50px; padding: 5px; border: 1px solid #ccc;"></textarea>
                        </div>
                    </div>

                    <div style="border: 1px solid #000; padding: 10px;">
                        <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">CANCELLATION</div>
                        <div style="font-size: 8px;">
                            SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE
                            THE EXPIRATION DATE THEREOF, NOTICE WILL BE DELIVERED IN
                            ACCORDANCE WITH THE POLICY PROVISIONS.
                        </div>
                    </div>
                </div>

                <!-- Authorized Representative -->
                <div style="margin-top: 20px; text-align: right;">
                    <div style="display: inline-block; text-align: center;">
                        <div style="border-bottom: 2px solid #000; width: 250px; height: 30px;"></div>
                        <div style="font-size: 10px; margin-top: 5px;">AUTHORIZED REPRESENTATIVE</div>
                    </div>
                </div>

                <!-- ACORD Footer -->
                <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 8px;">
                    <div>© 1988-2015 ACORD CORPORATION. All rights reserved.</div>
                    <div>ACORD 25 (2016/03)</div>
                    <div>The ACORD name and logo are registered marks of ACORD</div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()"
                        style="background: #28a745; color: white; padding: 15px 40px; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-print"></i> Print Certificate
                </button>
                <button onclick="alert('PDF download would be implemented here')"
                        style="background: #007bff; color: white; padding: 15px 40px; border: none; border-radius: 5px; font-size: 18px; cursor: pointer;">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        </div>
    `;
};

// Force override on all possible triggers
window.realACORDGenerator = window.prepareCOI;
window.showRealACORD = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;

// Override any buttons that might call prepareCOI
setInterval(() => {
    document.querySelectorAll('[onclick*="prepareCOI"]').forEach(el => {
        el.onclick = function(e) {
            e.preventDefault();
            const match = el.getAttribute('onclick').match(/prepareCOI\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                window.prepareCOI(match[1]);
            }
            return false;
        };
    });
}, 500);

console.log('✅ Real ACORD 25 form display active');