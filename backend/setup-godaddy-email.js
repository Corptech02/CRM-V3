#!/usr/bin/env node

const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('\n=========================================');
console.log('    GoDaddy Email Setup for COI Inbox');
console.log('=========================================\n');

console.log('This will connect your GoDaddy-hosted email to the COI inbox.\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const questions = [
    { key: 'email', prompt: 'Enter your email (e.g., grant@vigagency.com): ' },
    { key: 'password', prompt: 'Enter your email password: ', hidden: true }
];

const config = {
    // GoDaddy IMAP settings
    imap: {
        host: 'imap.secureserver.net',
        port: 993,
        secure: true,
        auth: {
            user: '',
            pass: ''
        }
    },
    // GoDaddy SMTP settings
    smtp: {
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: {
            user: '',
            pass: ''
        }
    }
};

let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion < questions.length) {
        const q = questions[currentQuestion];

        if (q.hidden) {
            // Hide password input
            const stdin = process.openStdin();
            process.stdin.on('data', function(char) {
                char = char + '';
                switch (char) {
                    case '\n':
                    case '\r':
                    case '\u0004':
                        stdin.pause();
                        break;
                    default:
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(q.prompt + '*'.repeat(config[q.key]?.length || 0));
                        break;
                }
            });
        }

        rl.question(q.prompt, (answer) => {
            if (q.key === 'email') {
                config.imap.auth.user = answer.trim();
                config.smtp.auth.user = answer.trim();
                config.email = answer.trim();
            } else if (q.key === 'password') {
                config.imap.auth.pass = answer;
                config.smtp.auth.pass = answer;
            }
            currentQuestion++;
            askQuestion();
        });
    } else {
        saveConfig();
    }
}

function saveConfig() {
    console.log('\nTesting connection to GoDaddy email servers...\n');

    const Imap = require('imap');
    const imap = new Imap(config.imap);

    imap.once('ready', function() {
        console.log('✅ IMAP connection successful!');
        imap.end();

        // Save to database
        const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const settings = {
            provider: 'godaddy',
            email: config.email,
            imap: config.imap,
            smtp: config.smtp,
            configured_at: new Date().toISOString()
        };

        db.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
            ['email_config', JSON.stringify(settings)],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    process.exit(1);
                }

                console.log('\n✅ SUCCESS! GoDaddy email is now connected!');
                console.log('\n=== Configuration Saved ===\n');
                console.log('Email:', config.email);
                console.log('IMAP Server:', config.imap.host);
                console.log('SMTP Server:', config.smtp.host);
                console.log('\n=== Next Steps ===\n');
                console.log('1. Restart the backend:');
                console.log('   pm2 restart vanguard-backend\n');
                console.log('2. The COI inbox will now fetch emails from:', config.email);
                console.log('3. You can send emails through the COI management system');

                db.close();
                rl.close();
                process.exit(0);
            }
        );
    });

    imap.once('error', function(err) {
        console.error('❌ Connection failed:', err.message);
        console.error('\nPossible issues:');
        console.error('1. Check your email and password');
        console.error('2. Enable "Less secure app access" if needed');
        console.error('3. Make sure IMAP is enabled in your GoDaddy email settings');
        console.error('\nGoDaddy Email Settings:');
        console.error('- Log into your GoDaddy account');
        console.error('- Go to Email & Office Dashboard');
        console.error('- Check email settings for IMAP access');
        rl.close();
        process.exit(1);
    });

    imap.connect();
}

// Check if imap module is installed
try {
    require('imap');
} catch (e) {
    console.log('Installing required dependency...');
    require('child_process').execSync('npm install imap', { stdio: 'inherit' });
}

console.log('GoDaddy Email Server Settings:');
console.log('================================');
console.log('IMAP Server: imap.secureserver.net (port 993)');
console.log('SMTP Server: smtpout.secureserver.net (port 465)');
console.log('Both use SSL/TLS encryption\n');

askQuestion();