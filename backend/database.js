const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or open database
const db = new sqlite3.Database('./vanguard.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database module connected to SQLite');
    }
});

// Export the database for use in other modules
module.exports = db;