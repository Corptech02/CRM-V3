#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

console.log('\n📧 OUTLOOK PASSWORD SETUP\n');
console.log('Current email: grant@vigagency.com\n');

rl.question('Enter your Outlook password (or app password): ', (password) => {
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found!');
        rl.close();
        return;
    }

    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Update the password
    envContent = envContent.replace(
        /OUTLOOK_PASSWORD=.*/,
        `OUTLOOK_PASSWORD=${password}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Password updated successfully!');
    console.log('\nNow restart the server:');
    console.log('pm2 restart vanguard-backend\n');

    rl.close();
});

// Hide password input
rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted)
        rl.output.write("*");
    else
        rl.output.write(stringToWrite);
};

rl.on('line', () => {
    rl.stdoutMuted = false;
});

rl.stdoutMuted = true;