// FMCSA SAFER Web Scraper - Fetches REAL insurance expiration dates
const puppeteer = require('puppeteer');

// Function to fetch real insurance data from SAFER
async function fetchRealInsuranceData(dotNumber) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Go to SAFER website
        const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dotNumber}`;
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Extract insurance information
        const insuranceData = await page.evaluate(() => {
            const data = {};

            // Find insurance table
            const tables = document.querySelectorAll('table');
            for (let table of tables) {
                const text = table.innerText;
                if (text.includes('Insurance on File')) {
                    // Parse insurance carrier
                    const carrierMatch = text.match(/Insurance Carrier:(.*?)(\n|$)/);
                    if (carrierMatch) {
                        data.insuranceCarrier = carrierMatch[1].trim();
                    }

                    // Parse policy/surety
                    const policyMatch = text.match(/Policy\/Surety:(.*?)(\n|$)/);
                    if (policyMatch) {
                        data.policyNumber = policyMatch[1].trim();
                    }

                    // Parse coverage dates
                    const coverageMatch = text.match(/Coverage From:(.*?)To:(.*?)(\n|$)/);
                    if (coverageMatch) {
                        data.coverageFrom = coverageMatch[1].trim();
                        data.coverageTo = coverageMatch[2].trim();

                        // Parse the expiration date
                        const toDate = coverageMatch[2].trim();
                        if (toDate && toDate !== 'N/A') {
                            // Convert MM/DD/YYYY to YYYY-MM-DD
                            const parts = toDate.split('/');
                            if (parts.length === 3) {
                                data.expirationDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                            }
                        }
                    }

                    // Parse effective date
                    const effectiveMatch = text.match(/Effective Date:(.*?)(\n|$)/);
                    if (effectiveMatch) {
                        data.effectiveDate = effectiveMatch[1].trim();
                    }

                    // Parse coverage amounts
                    const amountMatch = text.match(/\$[\d,]+/g);
                    if (amountMatch && amountMatch.length > 0) {
                        data.coverageAmount = amountMatch[0];
                    }
                }
            }

            // Also get company info
            const companyInfo = {};
            const headerText = document.body.innerText;

            const nameMatch = headerText.match(/Legal Name:(.*?)(\n|$)/);
            if (nameMatch) companyInfo.legalName = nameMatch[1].trim();

            const dbaMatch = headerText.match(/DBA Name:(.*?)(\n|$)/);
            if (dbaMatch) companyInfo.dbaName = dbaMatch[1].trim();

            const addressMatch = headerText.match(/Physical Address:(.*?)(\n|$)/);
            if (addressMatch) companyInfo.address = addressMatch[1].trim();

            const phoneMatch = headerText.match(/Phone:(.*?)(\n|$)/);
            if (phoneMatch) companyInfo.phone = phoneMatch[1].trim();

            return { ...data, ...companyInfo };
        });

        await browser.close();
        return insuranceData;

    } catch (error) {
        console.error(`Error fetching DOT ${dotNumber}:`, error);
        await browser.close();
        return null;
    }
}

// Function to batch fetch multiple carriers
async function fetchMultipleCarriers(dotNumbers, limit = 10) {
    const results = [];

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < dotNumbers.length && i < limit; i++) {
        console.log(`Fetching DOT ${dotNumbers[i]} (${i + 1}/${Math.min(dotNumbers.length, limit)})`);
        const data = await fetchRealInsuranceData(dotNumbers[i]);
        if (data && data.expirationDate) {
            results.push({
                dot_number: dotNumbers[i],
                ...data
            });
        }

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
}

module.exports = {
    fetchRealInsuranceData,
    fetchMultipleCarriers
};