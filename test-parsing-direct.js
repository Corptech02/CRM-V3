// Direct test of the parsing fix
console.log('Testing parsing fix for address vs vehicle issue...');

const testPolicyData = `Policy Details
Business Name
LOPEZ TRUCKING COMPANY LLC

Email
MCLOPEZ2006@GMAIL.COM

Phone
(567) 303-5530

Mailing Address
1158 TOWNSHIP ROAD 126
NOVA
OH 44859

Vehicles

1
1998
PETERBILT
379
45052

2
2025
Unidentified
Trailer For 45052

Policy Coverages - For the Insured and Others
Combined Single Limit Liability (CSL)
$1,000,000

Motor Truck Cargo (MTC)
$100k/$2500 deductible`;

// Load the parsing function
const fs = require('fs');
const path = require('path');

// Read the policy-quickfill.js file
const quickfillScript = fs.readFileSync(path.join(__dirname, 'js', 'policy-quickfill.js'), 'utf8');

// Extract just the parsePolicyData function
const functionMatch = quickfillScript.match(/function parsePolicyData\(data\) \{([\s\S]*?)\n\s*\}/);
if (!functionMatch) {
    console.error('Could not extract parsePolicyData function');
    process.exit(1);
}

// Create a minimal context to run the function
const functionCode = `
function parsePolicyData(data) {
${functionMatch[1]}
}
`;

// Execute the function code
eval(functionCode);

// Test the parsing
try {
    const parsed = parsePolicyData(testPolicyData);

    console.log('\n📊 Parsing Results:');
    console.log('=================');

    // Check contact information
    console.log('\n📧 Contact Information:');
    console.log(`Address: ${parsed.address || 'NOT FOUND'}`);
    console.log(`City: ${parsed.city || 'NOT FOUND'}`);
    console.log(`State: ${parsed.state || 'NOT FOUND'}`);
    console.log(`ZIP: ${parsed.zip || 'NOT FOUND'}`);
    console.log(`Email: ${parsed.email || 'NOT FOUND'}`);
    console.log(`Phone: ${parsed.phone || 'NOT FOUND'}`);

    // Check vehicles
    console.log('\n🚗 Vehicles:');
    if (parsed.vehicles && parsed.vehicles.length > 0) {
        parsed.vehicles.forEach((vehicle, index) => {
            console.log(`Vehicle ${index + 1}: ${vehicle.year} ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id})`);
        });
    } else {
        console.log('No vehicles found');
    }

    // Check for the specific issue
    console.log('\n🔍 Issue Check:');
    let addressAsVehicle = false;
    if (parsed.vehicles) {
        parsed.vehicles.forEach(vehicle => {
            if (vehicle.year === '1158' || vehicle.make === 'TOWNSHIP') {
                addressAsVehicle = true;
                console.log('❌ ERROR: Address was parsed as a vehicle!');
            }
        });
    }

    if (!addressAsVehicle) {
        console.log('✅ SUCCESS: Address was NOT parsed as a vehicle');
    }

    // Check if address was parsed correctly
    if (parsed.address && parsed.address.includes('1158 TOWNSHIP ROAD 126')) {
        console.log('✅ SUCCESS: Address was correctly parsed');
    } else {
        console.log('❌ ERROR: Address was not correctly parsed');
    }

    console.log('\n📋 Full parsed data:');
    console.log(JSON.stringify(parsed, null, 2));

} catch (error) {
    console.error('❌ Parsing failed:', error.message);
    console.error(error.stack);
}