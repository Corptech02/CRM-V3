// Clear any cached archiveLead functions and ensure deleteLead is used
console.log('🧹 Clearing archive functions and ensuring delete functionality...');

// Remove any lingering archiveLead function
if (window.archiveLead) {
    console.log('❌ Removing archiveLead function');
    delete window.archiveLead;
}

// Ensure we have the correct deleteLead function from app.js
if (!window.deleteLead) {
    console.error('⚠️ deleteLead function not found - this should not happen');
} else {
    console.log('✅ deleteLead function is available');
}

// Clear any archived lead state
console.log('🧹 Archive function cleanup complete');