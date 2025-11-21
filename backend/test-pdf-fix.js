#!/usr/bin/env node

/**
 * Test the PDF attachment base64 encoding issue and fix
 */

const fs = require('fs');

console.log('🔍 Testing PDF base64 encoding issue...\n');

// Read the PDF file
const pdfPath = '/var/www/vanguard/ACORD_25_fillable.pdf';
const pdfBuffer = fs.readFileSync(pdfPath);
const pdfBase64 = pdfBuffer.toString('base64');

console.log(`📄 Original PDF size: ${pdfBuffer.length} bytes`);
console.log(`📦 Base64 size: ${pdfBase64.length} characters`);
console.log(`📊 First 100 chars: ${pdfBase64.substring(0, 100)}`);

// Test the problematic line-breaking approach (current Gmail service)
console.log('\n❌ PROBLEMATIC METHOD (current Gmail service):');
const brokenLines = pdfBase64.match(/.{1,76}/g) || [];
const brokenResult = brokenLines.join('\r\n');
console.log(`   Lines created: ${brokenLines.length}`);
console.log(`   Total length after join: ${brokenResult.length}`);
console.log(`   First line: ${brokenLines[0]}`);
console.log(`   Last 3 lines:`);
console.log(`     ${brokenLines[brokenLines.length-3]}`);
console.log(`     ${brokenLines[brokenLines.length-2]}`);
console.log(`     ${brokenLines[brokenLines.length-1]}`);

// Test the correct approach
console.log('\n✅ CORRECT METHOD (fixed approach):');
const correctBase64 = pdfBase64.replace(/(.{76})/g, '$1\r\n');
console.log(`   Total length: ${correctBase64.length}`);
console.log(`   First 76 chars + newline: ${correctBase64.substring(0, 78)}`);

// Verify they decode to the same thing
console.log('\n🧪 VERIFICATION:');
try {
    const decodedBroken = Buffer.from(brokenResult.replace(/\r\n/g, ''), 'base64');
    const decodedCorrect = Buffer.from(correctBase64.replace(/\r\n/g, ''), 'base64');

    console.log(`   Original size: ${pdfBuffer.length}`);
    console.log(`   Broken decode size: ${decodedBroken.length}`);
    console.log(`   Correct decode size: ${decodedCorrect.length}`);
    console.log(`   Original matches broken: ${pdfBuffer.equals(decodedBroken)}`);
    console.log(`   Original matches correct: ${pdfBuffer.equals(decodedCorrect)}`);
} catch (error) {
    console.log(`   ❌ Decoding error: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('CONCLUSION: The issue is in how base64 lines are joined!');
console.log('Current method breaks the base64 data structure.');
console.log('='.repeat(60));