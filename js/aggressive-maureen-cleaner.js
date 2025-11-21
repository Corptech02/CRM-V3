/**
 * AGGRESSIVE Maureen Client Cleaner
 * Continuously removes all traces of Maureen's clients from the system
 */

(function() {
    console.log('🚨 AGGRESSIVE MAUREEN CLEANER ACTIVATED');

    // List of known Maureen client names to remove
    const maureensClients = [
        'HALL OF FAME', 'JAWAD TRANSPORT', 'HIGH WAY LOGISTICS LLC', 'jennings',
        'RONNIE CARLSON-COMM AUTO', 'ONE HUNTER HUNTERS', 'L & K PERFORMANCE LLC',
        'CATALAN TRUCKING', 'ECH-TIS LOGISTICS LLC', 'REDEX LLC', 'CIEARA REED',
        'AB GREEN LOGISTICS', 'LOUBAM AUTO', 'DLH TRUCKING', 'MOHAMED SOW DBA BEDA',
        'A AND N TRUCKING LLC', 'TOOZOO LOGISTICS', 'RIEF ENTERPRISES', 'RKOO LLC',
        'slammin', 'SHIVAUGHN WARE', 'EXPRESS LOAD WARRIORS LLC',
        'AME PROPERTY SOLUTIONS LLC-RC Transportation', 'MIDWEST REGIONAL CARRIER LLC',
        'RC TRANSPORTATION & FREIGHT LLC', 'CDG TRUCKING LLC', 'WENGER ROAD',
        'ROBLEDO TRUCKING', 'BULLDOG TRANSPORTATION', 'E AND V SERVICES',
        'JESSE CRISENBERRY', 'LUCKYBIRD LAWN', 'J & B DELIVERY LLC',
        'SHULTZ LOGISTICS LLC', 'ISABELLA STEELE-PERS AUTO', 'THIRTEENSTAR LOGISTICS LLC',
        'MLB TRUCKING', 'CIRCLE BACK-MICHAEL CASTLEEL', 'PORTERWAY LLC',
        'IKECON Logistics LLC', 'KAUR TRANSPORT INC', 'BONILLA TRANSORT',
        'TAS TRANSPORT', 'MEGA 1 HAULING LLC', 'REGWILL TRUCKING',
        'ROADTECH LOGISTICS LLC', 'JCB TRUCKING SOLUTION LLC', '3M LOGISTICS LLC',
        'ADVANCED FORM BUILDING INC', 'ALBION MOTOR SERVICES', 'BET ON SHED', 'APPROVED FREIGHT',
        'BIG MAC TRANSPORT', 'VCK ENTERPRISES LLC', 'COQUI EXPRESS LLC',
        'SHOUMAN EXCAVATING LLC', 'USA ONE TRUCKING', 'CARLA TOWNSEND AND JONATHAN WALKER',
        'MZM LOGISTICS INC', 'GET IT AND GO TRUCKING LLC', 'MARACANDA CARGO INC',
        'HUTCHINSON ENTERPRISES LLC', 'MAKE WAY TRANSPORTATION LLC', 'SULEY TRANSPORTATION LLC',
        'RAM TRUCKING', 'DP TRUCKING LLC', 'S&S EXPEDITED-EP TRANSPORT',
        'HST LOGISTICS', 'FLETCHER FREIGHT LLC', 'T85 LOGISTICS',
        'JIMENEZ TRUCKING', 'JOE POFF INC', 'ROCHELLE BOHANON-AUTO',
        'WALDRON TRUCKING', "TO'S HAULING AND CONSTRUCTION LLC", 'BUCKEYE LAKE',
        'TERRELL TYREE-COMM AUTO', 'MEAN GREEN TRANSPORT', 'FLETCHER AND SON TRUCKING',
        'FOOTS TRANSPORT LLC', 'LLC RAYS TRANSPORT', 'CHARLETTE LOGISTICS LLC',
        'GHOST HAULING LLC', 'JMD TRUCKS LLC', 'STONES THROW TRUCKING',
        'NATOSHA JORDAN', 'D & M TRUCKING', 'CHUCK AND JACKIE TRUCKING LLC',
        'UPPER DEK TRUCKING LLC', 'DONS HAULING LLC', 'CARLE TRUCKING LIMITED LIABILITY CO',
        'TY MCGUINEA TRANSPORT', 'GET RIGHT TRANSPORTATION', 'GOLD COST EXPRESS LLC',
        'LAMARR A RILEY', 'PHYLLIS GILL-PERS AUTO', 'DOCHFEL LOGISTICS',
        'SUNNY TRANSPORT LLC', 'Payless Express LLC', 'SAMI TRANS',
        'BLACKSHEEP TRANSPORTATION LLC', 'VICTOR RAMOS', 'NEDA NAQUIB-MAJOR KEYS 216',
        'NADER SHOUMAN-JET SKI', 'ADVANCED FORM BUILDING-JEFF BRINER',
        'NORTH AMERICAN TRADE-DAVID STORMS', 'QUEENSLAND TRANSPORT LLC',
        'SUDDENMOVE LLC', 'Rief Enterprises LLC', 'M SINGLETON', 'VLAD FREIGHT',
        'PRESIDENTIAL MOVES LOGISTICS-NEW', 'JASON BIBB dba JB EXPRESS',
        'LOUIS VELEZ', 'RSC COMPANY LLC', 'FRANKLIN MARTINEZ', 'KEEN LOGISTICS',
        'BUCKEYE BROS', 'Q&J TRUCKING LLC', 'GAWETHO EXPRESS LLC',
        'STEPHANIE SHOMON-PERS AUTO', 'JHS HOLDINGS', 'JMM LOGISTICS LLC',
        'JAHPORT LOGISTICS', 'MY CARRIER WAY INC', 'ANDRE DEHOSTOS',
        'KEVAN DAVIS-AUTO', 'MOHAMED ALI-NTL', 'MOHAMED ALI-PERS AUTO',
        'BAKERS 24 7 FORECLOSURE CLEANOUT & RUBBISH REMOVAL SERVICES LLC',
        'JAQUACE RICHARDSON', 'JESUS SANTIAGO-NTL', 'NORTH AMERICAN TRADE CORPORATION',
        'RAW LOGISTICS LLC', 'MARK SINGLETON-GOLF CART', 'LIV BEYOND LLC',
        'CHRIS STEVENS TRUCKING LLC', 'LEE CARNES'
    ];

    function cleanAllData() {
        // Clean localStorage
        const clientsData = localStorage.getItem('clients');
        if (clientsData) {
            try {
                let clients = JSON.parse(clientsData);
                const original = clients.length;

                // Filter by assignedTo
                clients = clients.filter(c => c.assignedTo !== 'Maureen');

                // Also filter by known names
                clients = clients.filter(c => {
                    const name = (c.name || '').toUpperCase();
                    return !maureensClients.some(mc => name.includes(mc.toUpperCase()));
                });

                if (clients.length < original) {
                    localStorage.setItem('clients', JSON.stringify(clients));
                    console.log(`🗑️ Removed ${original - clients.length} Maureen clients from localStorage`);
                }
            } catch(e) {}
        }

        // Clean window.allClients
        if (window.allClients && Array.isArray(window.allClients)) {
            const original = window.allClients.length;
            window.allClients = window.allClients.filter(c => {
                if (c.assignedTo === 'Maureen') return false;
                const name = (c.name || '').toUpperCase();
                return !maureensClients.some(mc => name.includes(mc.toUpperCase()));
            });
            if (window.allClients.length < original) {
                console.log(`🗑️ Removed ${original - window.allClients.length} from window.allClients`);
            }
        }

        // Clean DOM
        const clientCards = document.querySelectorAll('.client-card');
        clientCards.forEach(card => {
            const text = card.textContent || '';
            if (text.includes('Maureen') ||
                maureensClients.some(name => text.includes(name))) {
                card.remove();
                console.log('🗑️ Removed Maureen client card from DOM');
            }
        });

        // Also check for any client rows in tables
        const tableRows = document.querySelectorAll('tr');
        tableRows.forEach(row => {
            const text = row.textContent || '';
            if (text.includes('Maureen') ||
                maureensClients.some(name => text.includes(name))) {
                row.remove();
                console.log('🗑️ Removed Maureen client row from table');
            }
        });
    }

    // Clean immediately
    cleanAllData();

    // Clean every second
    setInterval(cleanAllData, 1000);

    // Override loadClients
    const originalLoadClients = window.loadClients;
    window.loadClients = async function() {
        const result = await (originalLoadClients ? originalLoadClients.apply(this, arguments) : []);
        if (Array.isArray(result)) {
            return result.filter(c => {
                if (c.assignedTo === 'Maureen') return false;
                const name = (c.name || '').toUpperCase();
                return !maureensClients.some(mc => name.includes(mc.toUpperCase()));
            });
        }
        return result;
    };

    // Override getClients
    const originalGetClients = window.getClients;
    window.getClients = function() {
        const clients = originalGetClients ? originalGetClients.apply(this, arguments) : [];
        if (Array.isArray(clients)) {
            return clients.filter(c => {
                if (c.assignedTo === 'Maureen') return false;
                const name = (c.name || '').toUpperCase();
                return !maureensClients.some(mc => name.includes(mc.toUpperCase()));
            });
        }
        return clients;
    };

    // Override renderClients if it exists
    if (window.renderClients) {
        const originalRenderClients = window.renderClients;
        window.renderClients = function() {
            const result = originalRenderClients.apply(this, arguments);
            setTimeout(cleanAllData, 100);
            return result;
        };
    }

    console.log('✅ AGGRESSIVE MAUREEN CLEANER RUNNING - Checking every second');
})();