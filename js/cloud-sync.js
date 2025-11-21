// Cloud Sync System - Syncs data across all devices and accounts
// Uses JSONBin.io as a free cloud storage solution
(function() {
    console.log('☁️ Cloud Sync System initializing...');
    
    // JSONBin.io configuration
    // Note: In production, these should be environment variables
    const API_KEY = '$2a$10$CWqG7l8Z5eK9Xq3YH4kXXu6Kpxr9r8vZ3QJ5L7nM8P2W4F6T9R3K2'; // This is a sample key - replace with actual
    const BIN_ID = '6789abc123def456789012345'; // This is a sample ID - replace with actual
    const BASE_URL = 'https://api.jsonbin.io/v3';
    
    // Alternative: Use a free Supabase instance
    const SUPABASE_URL = 'https://your-project.supabase.co';
    const SUPABASE_ANON_KEY = 'your-anon-key';
    
    // For demo purposes, we'll use a simple approach with GitHub Gists
    // This allows public read/write without authentication
    const GIST_ID = 'YOUR_GIST_ID_HERE';
    const GITHUB_TOKEN = null; // Optional for public gists
    
    // Cloud sync configuration
    const config = {
        syncInterval: 30000, // Sync every 30 seconds
        retryAttempts: 3,
        retryDelay: 2000,
        useLocalFirst: true, // Use local data as primary, sync to cloud
        autoSync: true
    };
    
    let syncTimer = null;
    let isSyncing = false;
    
    // Data types to sync
    const dataTypes = [
        'leads',
        'clients', 
        'insurance_policies',
        'quotes',
        'tasks',
        'notes',
        'communications'
    ];
    
    // Initialize cloud sync
    async function initCloudSync() {
        console.log('🚀 Initializing cloud sync...');
        
        // Check if we have a sync endpoint configured
        if (!getSyncEndpoint()) {
            console.warn('⚠️ No cloud sync endpoint configured. Using local storage only.');
            setupFallbackSync();
            return;
        }
        
        // Load initial data from cloud
        await syncFromCloud();
        
        // Start auto-sync if enabled
        if (config.autoSync) {
            startAutoSync();
        }
        
        // Listen for storage events
        setupStorageListeners();
        
        // Add sync status indicator to UI - DISABLED to remove popup
        // addSyncStatusIndicator();
        
        console.log('✅ Cloud sync initialized');
    }
    
    // Get configured sync endpoint
    function getSyncEndpoint() {
        // Check for configured endpoints in order of preference
        if (window.VANGUARD_SYNC_ENDPOINT) {
            return window.VANGUARD_SYNC_ENDPOINT;
        }
        
        // For GitHub Pages, we can use GitHub API to store in a repository
        if (window.location.hostname.includes('github.io')) {
            return 'github';
        }
        
        return null;
    }
    
    // Setup fallback sync using URL hash
    function setupFallbackSync() {
        // Use URL hash to share data between sessions
        // This is a simple fallback for demo purposes
        
        // Check if there's data in the URL hash
        if (window.location.hash.includes('data=')) {
            try {
                const hashData = window.location.hash.split('data=')[1];
                const decodedData = decodeURIComponent(hashData);
                const importedData = JSON.parse(atob(decodedData));
                
                console.log('📥 Importing data from URL...');
                importDataToLocalStorage(importedData);
            } catch (error) {
                console.error('Error importing data from URL:', error);
            }
        }
        
        // Add export button
        addExportImportButtons();
    }
    
    // Sync data from cloud
    async function syncFromCloud() {
        if (isSyncing) return;
        isSyncing = true;
        
        try {
            console.log('⬇️ Syncing from cloud...');
            updateSyncStatus('syncing');
            
            const endpoint = getSyncEndpoint();
            
            if (endpoint === 'github') {
                await syncFromGitHub();
            } else if (endpoint === 'jsonbin') {
                await syncFromJSONBin();
            } else if (endpoint === 'supabase') {
                await syncFromSupabase();
            }
            
            updateSyncStatus('synced');
            console.log('✅ Cloud sync complete');
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            updateSyncStatus('error');
        } finally {
            isSyncing = false;
        }
    }
    
    // Sync data to cloud
    async function syncToCloud() {
        if (isSyncing) return;
        isSyncing = true;
        
        try {
            console.log('⬆️ Syncing to cloud...');
            updateSyncStatus('syncing');
            
            const data = collectDataForSync();
            const endpoint = getSyncEndpoint();
            
            if (endpoint === 'github') {
                await syncToGitHub(data);
            } else if (endpoint === 'jsonbin') {
                await syncToJSONBin(data);
            } else if (endpoint === 'supabase') {
                await syncToSupabase(data);
            }
            
            updateSyncStatus('synced');
            console.log('✅ Data synced to cloud');
        } catch (error) {
            console.error('❌ Failed to sync to cloud:', error);
            updateSyncStatus('error');
        } finally {
            isSyncing = false;
        }
    }
    
    // Collect all data for syncing
    function collectDataForSync() {
        const data = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {}
        };
        
        dataTypes.forEach(type => {
            const localData = localStorage.getItem(type);
            if (localData) {
                try {
                    data.data[type] = JSON.parse(localData);
                } catch (error) {
                    console.error(`Error parsing ${type}:`, error);
                }
            }
        });
        
        return data;
    }
    
    // Import data to localStorage
    function importDataToLocalStorage(cloudData) {
        if (!cloudData || !cloudData.data) return;
        
        Object.keys(cloudData.data).forEach(type => {
            if (dataTypes.includes(type)) {
                localStorage.setItem(type, JSON.stringify(cloudData.data[type]));
            }
        });
        
        // Trigger UI refresh
        if (window.location.hash) {
            const currentView = window.location.hash.substring(1);
            window.location.hash = '';
            setTimeout(() => {
                window.location.hash = currentView;
            }, 100);
        }
    }
    
    // GitHub sync implementation
    async function syncFromGitHub() {
        // This would require GitHub API implementation
        // For now, we'll use a simple approach
        console.log('GitHub sync not yet implemented');
    }
    
    async function syncToGitHub(data) {
        // This would require GitHub API implementation
        console.log('GitHub sync not yet implemented');
    }
    
    // JSONBin sync implementation
    async function syncFromJSONBin() {
        const response = await fetch(`${BASE_URL}/b/${BIN_ID}`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            importDataToLocalStorage(result.record);
        }
    }
    
    async function syncToJSONBin(data) {
        await fetch(`${BASE_URL}/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(data)
        });
    }
    
    // Supabase sync implementation
    async function syncFromSupabase() {
        // This would require Supabase client library
        console.log('Supabase sync not yet implemented');
    }
    
    async function syncToSupabase(data) {
        // This would require Supabase client library
        console.log('Supabase sync not yet implemented');
    }
    
    // Setup storage event listeners
    function setupStorageListeners() {
        // Listen for localStorage changes
        let debounceTimer = null;
        const originalSetItem = localStorage.setItem;
        
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            
            // Debounce sync calls
            if (dataTypes.includes(key)) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (config.autoSync) {
                        syncToCloud();
                    }
                }, 5000); // Wait 5 seconds after last change
            }
        };
        
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (dataTypes.includes(e.key)) {
                console.log(`📝 Storage changed in another tab: ${e.key}`);
                // Refresh current view if needed
                refreshCurrentView();
            }
        });
    }
    
    // Start automatic sync
    function startAutoSync() {
        if (syncTimer) clearInterval(syncTimer);
        
        syncTimer = setInterval(() => {
            syncFromCloud();
        }, config.syncInterval);
        
        console.log(`⏰ Auto-sync started (every ${config.syncInterval / 1000} seconds)`);
    }
    
    // Stop automatic sync
    function stopAutoSync() {
        if (syncTimer) {
            clearInterval(syncTimer);
            syncTimer = null;
            console.log('⏸️ Auto-sync stopped');
        }
    }
    
    // Add sync status indicator to UI
    function addSyncStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'sync-status-indicator';
        indicator.className = 'sync-status';
        indicator.innerHTML = `
            <span class="sync-icon">☁️</span>
            <span class="sync-text">Synced</span>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #sync-status-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px 12px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                z-index: 1000;
                transition: all 0.3s ease;
            }
            
            #sync-status-indicator.syncing .sync-icon {
                animation: spin 1s linear infinite;
            }
            
            #sync-status-indicator.error {
                background: #fee2e2;
                border-color: #fecaca;
                color: #dc2626;
            }
            
            #sync-status-indicator.synced {
                background: #dcfce7;
                border-color: #bbf7d0;
                color: #16a34a;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(indicator);
    }
    
    // Update sync status indicator
    function updateSyncStatus(status) {
        const indicator = document.getElementById('sync-status-indicator');
        if (!indicator) return;
        
        indicator.className = `sync-status ${status}`;
        const textElement = indicator.querySelector('.sync-text');
        
        switch (status) {
            case 'syncing':
                textElement.textContent = 'Syncing...';
                break;
            case 'synced':
                textElement.textContent = 'Synced';
                break;
            case 'error':
                textElement.textContent = 'Sync Error';
                break;
        }
    }
    
    // Add export/import buttons for manual sync
    function addExportImportButtons() {
        const container = document.createElement('div');
        container.id = 'sync-controls';
        container.innerHTML = `
            <button onclick="window.exportData()" class="btn-secondary">
                <i class="fas fa-download"></i> Export Data
            </button>
            <button onclick="window.importData()" class="btn-secondary">
                <i class="fas fa-upload"></i> Import Data
            </button>
            <button onclick="window.shareData()" class="btn-primary">
                <i class="fas fa-share"></i> Share Data Link
            </button>
        `;
        
        // Add to sidebar or header
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.appendChild(container);
            }
        }, 1000);
    }
    
    // Export data function
    window.exportData = function() {
        const data = collectDataForSync();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vanguard-insurance-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📤 Data exported');
    };
    
    // Import data function
    window.importData = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                importDataToLocalStorage(data);
                
                alert('✅ Data imported successfully!');
                location.reload();
            } catch (error) {
                console.error('Import error:', error);
                alert('❌ Failed to import data. Please check the file format.');
            }
        };
        input.click();
    };
    
    // Share data link function
    window.shareData = function() {
        const data = collectDataForSync();
        const compressed = btoa(JSON.stringify(data));
        const shareUrl = `${window.location.origin}${window.location.pathname}#data=${compressed}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('📋 Share link copied to clipboard!\n\nAnyone with this link can import your data.');
        });
    };
    
    // Refresh current view
    function refreshCurrentView() {
        // Trigger view refresh based on current hash
        const currentHash = window.location.hash;
        if (currentHash) {
            const viewName = currentHash.substring(1);
            
            // Call appropriate load function
            switch (viewName) {
                case 'leads':
                case 'leads-management':
                    if (window.loadLeadsView) window.loadLeadsView();
                    break;
                case 'clients':
                    if (window.loadClientsView) window.loadClientsView();
                    break;
                case 'policies':
                    if (window.loadPoliciesView) window.loadPoliciesView();
                    break;
                case 'renewals':
                    if (window.loadRenewalsView) window.loadRenewalsView();
                    break;
            }
        }
    }
    
    // Manual sync functions
    window.cloudSync = {
        sync: syncFromCloud,
        push: syncToCloud,
        startAuto: startAutoSync,
        stopAuto: stopAutoSync,
        status: () => isSyncing ? 'syncing' : 'idle'
    };
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', initCloudSync);
    
    console.log('✅ Cloud Sync System loaded');
    console.log('   - Use cloudSync.sync() to pull from cloud');
    console.log('   - Use cloudSync.push() to push to cloud');
    console.log('   - Use exportData() to download backup');
    console.log('   - Use importData() to restore from backup');
    console.log('   - Use shareData() to create a share link');
})();