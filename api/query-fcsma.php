<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);

    $expiryDays = isset($input['expiryDays']) ? (int)$input['expiryDays'] : 30;
    $limit = isset($input['limit']) ? (int)$input['limit'] : 100;
    $carrier = isset($input['carrier']) ? trim($input['carrier']) : '';

    // Execute Python script to query FCSMA database
    $pythonScript = '
import sqlite3, json, sys
from datetime import datetime

try:
    # Connect to FCSMA database
    conn = sqlite3.connect("/home/corp06/fcsma_leads.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Parameters
    expiry_days = ' . $expiryDays . '
    limit = ' . $limit . '
    carrier = "' . addslashes($carrier) . '"

    # Build query
    query = """
    SELECT DISTINCT
        mc_number,
        dot_number,
        insurance_carrier,
        policy_number,
        policy_start_date,
        policy_end_date,
        primary_coverage_amount,
        coverage_level,
        (julianday(policy_end_date) - julianday(date(\'now\'))) as days_until_expiry
    FROM insurance_policies
    WHERE policy_end_date IS NOT NULL
        AND policy_end_date != \'\'
        AND julianday(policy_end_date) - julianday(date(\'now\')) BETWEEN 0 AND ?
    """

    params = [expiry_days]

    # Add carrier filter
    if carrier:
        query += " AND UPPER(insurance_carrier) LIKE UPPER(?)"
        params.append("%" + carrier + "%")

    query += " ORDER BY policy_end_date ASC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    results = cursor.fetchall()

    # Format results
    leads = []
    for row in results:
        leads.append({
            "mc_number": row["mc_number"],
            "dot_number": row["dot_number"],
            "insurance_carrier": row["insurance_carrier"],
            "policy_number": row["policy_number"],
            "policy_start_date": row["policy_start_date"],
            "policy_end_date": row["policy_end_date"],
            "primary_coverage_amount": int(row["primary_coverage_amount"]) if row["primary_coverage_amount"] else 0,
            "coverage_level": row["coverage_level"],
            "days_until_expiry": int(round(row["days_until_expiry"])) if row["days_until_expiry"] else 0,
            "source": "FCSMA Database"
        })

    print(json.dumps({
        "success": True,
        "leads": leads,
        "count": len(leads),
        "source": "FCSMA Database"
    }))

    conn.close()

except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e),
        "leads": [],
        "count": 0
    }))
';

    // Execute Python script
    $tempFile = tempnam(sys_get_temp_dir(), 'fcsma_query_');
    file_put_contents($tempFile, $pythonScript);

    $output = shell_exec("python3 $tempFile 2>&1");
    unlink($tempFile);

    // Try to decode JSON output
    $result = json_decode($output, true);

    if ($result === null) {
        throw new Exception("Failed to parse Python output: " . $output);
    }

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'leads' => [],
        'count' => 0
    ]);
}
?>