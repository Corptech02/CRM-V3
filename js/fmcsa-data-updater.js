// FMCSA Data Updater - Fetches and updates client data from FMCSA API
(function() {
    console.log('🔄 FMCSA Data Updater initializing...');
    
    // FMCSA API endpoint
    const FMCSA_API_URL = 'https://data.transportation.gov/resource/az4n-8mr2.json';
    
    // Function to fetch FMCSA data for a specific DOT number
    async function fetchFMCSAData(dotNumber) {
        // Temporarily disabled - FMCSA API endpoint is not available
        // Will be replaced with backend database queries
        return null;

        /* Original code - disabled
        try {
            // Clean the DOT number (remove any non-numeric characters)
            const cleanDOT = dotNumber.toString().replace(/\D/g, '');

            // Fetch data from FMCSA API with DOT number filter
            const response = await fetch(`${FMCSA_API_URL}?dot_number=${cleanDOT}`);

            if (!response.ok) {
                console.error(`Failed to fetch FMCSA data for DOT ${cleanDOT}: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data && data.length > 0) {
                // Return the first matching record
                return data[0];
            }

            return null;
        */
        } catch (error) {
            console.error(`Error fetching FMCSA data for DOT ${dotNumber}:`, error);
            return null;
        }
    }
    
    // Function to update client with FMCSA data
    function updateClientWithFMCSAData(client, fmcsaData) {
        if (!fmcsaData) return client;
        
        // Update client with FMCSA data
        const updatedClient = {
            ...client,
            // Company information
            legalName: fmcsaData.legal_name || client.legalName || client.name,
            dbaName: fmcsaData.dba_name || client.dbaName,
            
            // Address information
            address: fmcsaData.phy_street || client.address,
            city: fmcsaData.phy_city || client.city,
            state: fmcsaData.phy_state || client.state,
            zipCode: fmcsaData.phy_zip || client.zipCode,
            
            // Mailing address (if different)
            mailingAddress: fmcsaData.mailing_street || client.mailingAddress,
            mailingCity: fmcsaData.mailing_city || client.mailingCity,
            mailingState: fmcsaData.mailing_state || client.mailingState,
            mailingZip: fmcsaData.mailing_zip || client.mailingZip,
            
            // Contact information
            phone: fmcsaData.telephone ? fmcsaData.telephone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : client.phone,
            
            // Carrier information
            entityType: fmcsaData.entity_type || client.entityType,
            operatingStatus: fmcsaData.operating_status || client.operatingStatus,
            outOfServiceDate: fmcsaData.out_of_service_date || client.outOfServiceDate,
            
            // Fleet information
            powerUnits: fmcsaData.power_units || client.powerUnits || 0,
            drivers: fmcsaData.drivers || client.totalDrivers || 0,
            
            // MCS-150 information
            mcs150Date: fmcsaData.mcs_150_date || client.mcs150Date,
            mcs150Mileage: fmcsaData.mcs_150_mileage || client.mcs150Mileage,
            
            // Carrier operations
            carrierOperation: fmcsaData.carrier_operation || client.carrierOperation,
            cargoCarried: fmcsaData.cargo_carried || client.cargoCarried,
            
            // HazMat information
            hazmatFlag: fmcsaData.hazmat_flag === 'Y' || client.hazmatFlag,
            
            // Safety rating
            safetyRating: fmcsaData.safety_rating || client.safetyRating,
            ratingDate: fmcsaData.rating_date || client.ratingDate,
            
            // Review information
            reviewDate: fmcsaData.review_date || client.reviewDate,
            reviewType: fmcsaData.review_type || client.reviewType,
            
            // NBMFAA ID (if applicable)
            nbmfaaId: fmcsaData.nbmfaa_id || client.nbmfaaId,
            
            // Add data source and update timestamp
            dataSource: 'FMCSA API',
            lastUpdated: new Date().toISOString()
        };
        
        // Add inspection data if available
        if (fmcsaData.vehicle_inspections || fmcsaData.driver_inspections) {
            updatedClient.inspectionData = {
                vehicleInspections: fmcsaData.vehicle_inspections || 0,
                driverInspections: fmcsaData.driver_inspections || 0,
                hazmatInspections: fmcsaData.hazmat_inspections || 0,
                ibInspections: fmcsaData.ib_inspections || 0,
                ibVehicleInspections: fmcsaData.ib_vehicle_inspections || 0
            };
        }
        
        // Add violation data if available
        if (fmcsaData.vehicle_oos || fmcsaData.driver_oos) {
            updatedClient.violationData = {
                vehicleOOS: fmcsaData.vehicle_oos || 0,
                driverOOS: fmcsaData.driver_oos || 0,
                hazmatOOS: fmcsaData.hazmat_oos || 0,
                vehicleOOSPercent: fmcsaData.vehicle_oos_percent || 0,
                driverOOSPercent: fmcsaData.driver_oos_percent || 0
            };
        }
        
        // Add crash data if available
        if (fmcsaData.crash_total || fmcsaData.fatal_crash || fmcsaData.injury_crash || fmcsaData.tow_crash) {
            updatedClient.crashData = {
                totalCrashes: fmcsaData.crash_total || 0,
                fatalCrashes: fmcsaData.fatal_crash || 0,
                injuryCrashes: fmcsaData.injury_crash || 0,
                towCrashes: fmcsaData.tow_crash || 0
            };
        }
        
        return updatedClient;
    }
    
    // Function to update all clients with FMCSA data
    async function updateAllClientsWithFMCSAData() {
        console.log('📊 Starting FMCSA data update for all clients...');
        
        // Get existing clients
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        
        if (clients.length === 0) {
            console.log('No clients found to update');
            return;
        }
        
        let updatedCount = 0;
        const updatedClients = [];
        
        // Process each client
        for (const client of clients) {
            // Only update if client has a DOT number
            if (client.dotNumber) {
                console.log(`Fetching FMCSA data for ${client.name} (DOT: ${client.dotNumber})...`);
                
                const fmcsaData = await fetchFMCSAData(client.dotNumber);
                
                if (fmcsaData) {
                    const updatedClient = updateClientWithFMCSAData(client, fmcsaData);
                    updatedClients.push(updatedClient);
                    updatedCount++;
                    console.log(`✅ Updated ${client.name} with FMCSA data`);
                } else {
                    // Keep original client if no FMCSA data found
                    updatedClients.push(client);
                    console.log(`⚠️ No FMCSA data found for ${client.name} (DOT: ${client.dotNumber})`);
                }
                
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                // Keep clients without DOT numbers as-is
                updatedClients.push(client);
            }
        }
        
        // Save updated clients
        localStorage.setItem('insurance_clients', JSON.stringify(updatedClients));
        
        console.log(`✅ FMCSA data update complete. Updated ${updatedCount} of ${clients.length} clients`);
        
        // Refresh the view if on clients page
        if (window.location.hash === '#clients') {
            if (window.loadClientsView) {
                window.loadClientsView();
            }
        }
        
        return updatedClients;
    }
    
    // Function to update a single client
    window.updateClientFMCSAData = async function(clientId) {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const clientIndex = clients.findIndex(c => c.id === clientId);
        
        if (clientIndex === -1) {
            console.error('Client not found');
            return;
        }
        
        const client = clients[clientIndex];
        
        if (!client.dotNumber) {
            console.error('Client does not have a DOT number');
            return;
        }
        
        console.log(`Fetching FMCSA data for ${client.name}...`);
        const fmcsaData = await fetchFMCSAData(client.dotNumber);
        
        if (fmcsaData) {
            clients[clientIndex] = updateClientWithFMCSAData(client, fmcsaData);
            localStorage.setItem('insurance_clients', JSON.stringify(clients));
            console.log(`✅ Updated ${client.name} with FMCSA data`);
            
            // Refresh view
            if (window.location.hash === '#clients') {
                if (window.loadClientsView) {
                    window.loadClientsView();
                }
            }
            
            return clients[clientIndex];
        } else {
            console.log('No FMCSA data found for this DOT number');
            return null;
        }
    };
    
    // Expose the main update function globally
    window.updateAllClientsWithFMCSAData = updateAllClientsWithFMCSAData;
    
    // Auto-update on page load (with delay to ensure other scripts are loaded)
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we should auto-update (limit to once per day)
        const lastUpdate = localStorage.getItem('fmcsa_last_update');
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (!lastUpdate || (now - parseInt(lastUpdate)) > oneDay) {
            console.log('🔄 Auto-updating FMCSA data (daily update)...');
            
            // Delay the update to avoid conflicts with other initialization scripts
            setTimeout(() => {
                updateAllClientsWithFMCSAData().then(() => {
                    localStorage.setItem('fmcsa_last_update', now.toString());
                });
            }, 3000);
        } else {
            console.log('ℹ️ FMCSA data was updated recently. Skipping auto-update.');
        }
    });
    
    // Add manual update button to clients page
    if (window.location.hash === '#clients') {
        setTimeout(() => {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions && !document.getElementById('fmcsa-update-btn')) {
                const updateButton = document.createElement('button');
                updateButton.id = 'fmcsa-update-btn';
                updateButton.className = 'btn-secondary';
                updateButton.innerHTML = '<i class="fas fa-sync-alt"></i> Update FMCSA Data';
                updateButton.onclick = async function() {
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                    
                    await updateAllClientsWithFMCSAData();
                    localStorage.setItem('fmcsa_last_update', new Date().getTime().toString());
                    
                    this.innerHTML = '<i class="fas fa-check"></i> Updated!';
                    setTimeout(() => {
                        this.disabled = false;
                        this.innerHTML = '<i class="fas fa-sync-alt"></i> Update FMCSA Data';
                    }, 2000);
                };
                
                headerActions.insertBefore(updateButton, headerActions.firstChild);
            }
        }, 1000);
    }
    
    console.log('✅ FMCSA Data Updater initialized');
    console.log('   - Auto-updates daily');
    console.log('   - Manual update available via updateAllClientsWithFMCSAData()');
})();