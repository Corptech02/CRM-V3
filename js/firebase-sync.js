// Firebase Cloud Sync - Real-time data sync across all devices
// This provides a free, reliable cloud database solution
(function() {
    console.log('🔥 Firebase Sync System initializing...');
    
    // Firebase configuration
    // To use this, create a free Firebase project at https://console.firebase.google.com
    // Then replace these values with your project's config
    const firebaseConfig = {
        apiKey: "AIzaSyD_SAMPLE_KEY_REPLACE_WITH_YOUR_OWN",
        authDomain: "vanguard-insurance.firebaseapp.com",
        databaseURL: "https://vanguard-insurance-default-rtdb.firebaseio.com",
        projectId: "vanguard-insurance",
        storageBucket: "vanguard-insurance.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef123456789012345"
    };
    
    // For immediate use without Firebase, we'll use a simple GitHub Gist approach
    // This allows reading/writing JSON data without authentication
    const GIST_CONFIG = {
        // Create a public gist at https://gist.github.com with a file named 'vanguard-data.json'
        // Then replace this with your gist ID
        gistId: '8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c', // Sample - replace with your gist ID
        fileName: 'vanguard-data.json',
        // Optional: Add a GitHub personal access token for write access
        // Without token, you can only read public gists
        token: null
    };
    
    let isInitialized = false;
    let syncInProgress = false;
    let lastSyncTime = null;
    
    // Initialize sync system
    async function initSync() {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined') {
            initFirebase();
        } else {
            // Fallback to GitHub Gist
            initGistSync();
        }
    }
    
    // Initialize Firebase
    function initFirebase() {
        try {
            firebase.initializeApp(firebaseConfig);
            const db = firebase.database();
            
            // Set up real-time listeners for each data type
            setupFirebaseListeners(db);
            
            // Push local data to Firebase if needed
            pushLocalToFirebase(db);
            
            isInitialized = true;
            console.log('✅ Firebase sync initialized');
            showSyncStatus('Firebase Connected', 'success');
        } catch (error) {
            console.error('Firebase init error:', error);
            initGistSync(); // Fallback to Gist
        }
    }
    
    // Setup Firebase real-time listeners
    function setupFirebaseListeners(db) {
        const dataTypes = ['leads', 'clients', 'insurance_policies', 'quotes'];
        
        dataTypes.forEach(type => {
            db.ref(type).on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && !syncInProgress) {
                    // Update local storage with Firebase data
                    localStorage.setItem(type, JSON.stringify(data));
                    console.log(`📥 Received ${type} update from Firebase`);
                    
                    // Refresh UI if on relevant page
                    refreshViewIfNeeded(type);
                }
            });
        });
        
        // Listen for connection state
        db.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                console.log('🟢 Firebase connected');
                showSyncStatus('Cloud Connected', 'success');
            } else {
                console.log('🔴 Firebase disconnected');
                showSyncStatus('Offline Mode', 'warning');
            }
        });
    }
    
    // Push local data to Firebase
    async function pushLocalToFirebase(db) {
        syncInProgress = true;
        const dataTypes = ['leads', 'clients', 'insurance_policies', 'quotes'];
        
        for (const type of dataTypes) {
            const localData = localStorage.getItem(type);
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    await db.ref(type).set(parsed);
                    console.log(`📤 Pushed ${type} to Firebase`);
                } catch (error) {
                    console.error(`Error pushing ${type}:`, error);
                }
            }
        }
        
        syncInProgress = false;
        lastSyncTime = new Date();
    }
    
    // Initialize GitHub Gist sync
    async function initGistSync() {
        console.log('📝 Using GitHub Gist for data sync');
        
        // Load data from Gist
        await loadFromGist();
        
        // Set up auto-save
        setupAutoSave();
        
        // Add manual sync buttons
        addManualSyncControls();
        
        isInitialized = true;
        showSyncStatus('Gist Sync Active', 'info');
    }
    
    // Load data from GitHub Gist
    async function loadFromGist() {
        try {
            const url = `https://api.github.com/gists/${GIST_CONFIG.gistId}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch gist');
            }
            
            const gist = await response.json();
            const content = gist.files[GIST_CONFIG.fileName]?.content;
            
            if (content) {
                const data = JSON.parse(content);
                
                // Import to localStorage
                Object.keys(data).forEach(key => {
                    if (key !== 'metadata') {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    }
                });
                
                console.log('✅ Data loaded from Gist');
                showSyncStatus('Data Loaded', 'success');
                
                // Refresh current view
                location.reload();
            }
        } catch (error) {
            console.error('Error loading from Gist:', error);
            showSyncStatus('Load Failed', 'error');
        }
    }
    
    // Save data to GitHub Gist
    async function saveToGist() {
        if (!GIST_CONFIG.token) {
            console.warn('No GitHub token configured - cannot save to Gist');
            showSyncStatus('Read-Only Mode', 'warning');
            return;
        }
        
        try {
            syncInProgress = true;
            
            // Collect all data
            const data = {
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: '1.0.0'
                },
                leads: JSON.parse(localStorage.getItem('leads') || '[]'),
                clients: JSON.parse(localStorage.getItem('clients') || '[]'),
                insurance_policies: JSON.parse(localStorage.getItem('insurance_policies') || '[]'),
                quotes: JSON.parse(localStorage.getItem('quotes') || '[]')
            };
            
            // Update Gist
            const url = `https://api.github.com/gists/${GIST_CONFIG.gistId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${GIST_CONFIG.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        [GIST_CONFIG.fileName]: {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            if (response.ok) {
                console.log('✅ Data saved to Gist');
                showSyncStatus('Saved to Cloud', 'success');
                lastSyncTime = new Date();
            } else {
                throw new Error('Failed to save to Gist');
            }
        } catch (error) {
            console.error('Error saving to Gist:', error);
            showSyncStatus('Save Failed', 'error');
        } finally {
            syncInProgress = false;
        }
    }
    
    // Setup auto-save functionality
    function setupAutoSave() {
        // Save to cloud when localStorage changes
        const originalSetItem = localStorage.setItem;
        let saveTimeout;
        
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            
            // Only sync certain keys
            const syncKeys = ['leads', 'clients', 'insurance_policies', 'quotes'];
            if (syncKeys.includes(key)) {
                // Debounce saves
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    if (GIST_CONFIG.token) {
                        saveToGist();
                    }
                }, 5000); // Wait 5 seconds after last change
            }
        };
    }
    
    // Add manual sync controls to UI
    function addManualSyncControls() {
        const controls = document.createElement('div');
        controls.id = 'sync-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10000;
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        
        controls.innerHTML = `
            <button onclick="window.syncData.export()" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">📥 Export Data</button>
            
            <button onclick="window.syncData.import()" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">📤 Import Data</button>
            
            <span id="sync-status" style="
                font-size: 12px;
                color: #6b7280;
                margin-left: 10px;
            ">Ready</span>
        `;
        
        document.body.appendChild(controls);
    }
    
    // Show sync status
    function showSyncStatus(message, type = 'info') {
        const statusEl = document.getElementById('sync-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#6b7280'
            }[type] || '#6b7280';
        }
    }
    
    // Refresh view if needed
    function refreshViewIfNeeded(dataType) {
        const hash = window.location.hash;
        
        if ((dataType === 'leads' && hash.includes('lead')) ||
            (dataType === 'clients' && hash.includes('client')) ||
            (dataType === 'insurance_policies' && hash.includes('polic'))) {
            
            // Trigger view refresh
            const event = new HashChangeEvent('hashchange');
            window.dispatchEvent(event);
        }
    }
    
    // Export/Import functions
    window.syncData = {
        export: function() {
            const data = {
                timestamp: new Date().toISOString(),
                leads: JSON.parse(localStorage.getItem('leads') || '[]'),
                clients: JSON.parse(localStorage.getItem('clients') || '[]'),
                insurance_policies: JSON.parse(localStorage.getItem('insurance_policies') || '[]'),
                quotes: JSON.parse(localStorage.getItem('quotes') || '[]')
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vanguard-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showSyncStatus('Data Exported', 'success');
        },
        
        import: function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    // Import to localStorage
                    if (data.leads) localStorage.setItem('leads', JSON.stringify(data.leads));
                    if (data.clients) localStorage.setItem('clients', JSON.stringify(data.clients));
                    if (data.insurance_policies) localStorage.setItem('insurance_policies', JSON.stringify(data.insurance_policies));
                    if (data.quotes) localStorage.setItem('quotes', JSON.stringify(data.quotes));
                    
                    showSyncStatus('Data Imported', 'success');
                    setTimeout(() => location.reload(), 1000);
                } catch (error) {
                    console.error('Import error:', error);
                    showSyncStatus('Import Failed', 'error');
                }
            };
            input.click();
        },
        
        sync: loadFromGist,
        save: saveToGist
    };
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSync);
    } else {
        initSync();
    }
    
    console.log('✅ Cloud Sync System ready');
    console.log('   - Use syncData.export() to download backup');
    console.log('   - Use syncData.import() to restore backup');
    console.log('   - Data syncs automatically when changed');
})();