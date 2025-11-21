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

// FCSMA Lead Generation API Endpoint
// Connects to the FCSMA SQLite database created from actpendins_2025_10_08.txt

try {
    // Path to FCSMA database
    $dbPath = '/home/corp06/fcsma_leads.db';

    if (!file_exists($dbPath)) {
        throw new Exception("FCSMA database not found at: $dbPath");
    }

    // Connect to SQLite database
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);

    $expiryDays = isset($input['expiryDays']) ? (int)$input['expiryDays'] : 30;
    $limit = isset($input['limit']) ? (int)$input['limit'] : 100;
    $carrier = isset($input['carrier']) ? trim($input['carrier']) : '';
    $state = isset($input['state']) ? trim($input['state']) : '';

    // Build query
    $query = "
        SELECT DISTINCT
            mc_number,
            dot_number,
            insurance_carrier,
            policy_number,
            policy_start_date,
            policy_end_date,
            primary_coverage_amount,
            coverage_level,
            (julianday(policy_end_date) - julianday(date('now'))) as days_until_expiry
        FROM insurance_policies
        WHERE policy_end_date IS NOT NULL
            AND policy_end_date != ''
            AND julianday(policy_end_date) - julianday(date('now')) BETWEEN 0 AND :expiryDays
    ";

    $params = [':expiryDays' => $expiryDays];

    // Add carrier filter
    if (!empty($carrier)) {
        $query .= " AND UPPER(insurance_carrier) LIKE UPPER(:carrier)";
        $params[':carrier'] = "%$carrier%";
    }

    // Add limit
    $query .= " ORDER BY policy_end_date ASC LIMIT :limit";
    $params[':limit'] = $limit;

    // Execute query
    $stmt = $pdo->prepare($query);

    // Bind parameters with proper types
    foreach ($params as $key => $value) {
        if ($key === ':limit' || $key === ':expiryDays') {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
    }

    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format results for frontend
    $leads = [];
    foreach ($results as $row) {
        $leads[] = [
            'mc_number' => $row['mc_number'],
            'dot_number' => $row['dot_number'],
            'insurance_carrier' => $row['insurance_carrier'],
            'policy_number' => $row['policy_number'],
            'policy_start_date' => $row['policy_start_date'],
            'policy_end_date' => $row['policy_end_date'],
            'primary_coverage_amount' => (int)$row['primary_coverage_amount'],
            'coverage_level' => $row['coverage_level'],
            'days_until_expiry' => (int)round($row['days_until_expiry']),
            'coverage_amount_formatted' => '$' . number_format(($row['primary_coverage_amount'] * 1000), 0),
            'source' => 'FCSMA Database'
        ];
    }

    // Get database statistics
    $statsQuery = "
        SELECT
            COUNT(*) as total_policies,
            COUNT(CASE WHEN julianday(policy_end_date) - julianday(date('now')) BETWEEN 0 AND 30 THEN 1 END) as expiring_30_days,
            COUNT(CASE WHEN primary_coverage_amount >= 1000 THEN 1 END) as high_value_policies
        FROM insurance_policies
        WHERE policy_end_date IS NOT NULL AND policy_end_date != ''
    ";

    $statsStmt = $pdo->query($statsQuery);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // Response
    $response = [
        'success' => true,
        'leads' => $leads,
        'count' => count($leads),
        'criteria' => [
            'expiryDays' => $expiryDays,
            'limit' => $limit,
            'carrier' => $carrier,
            'state' => $state
        ],
        'stats' => $stats,
        'message' => count($leads) > 0 ?
            "Found " . count($leads) . " FCSMA leads expiring within $expiryDays days" :
            "No FCSMA leads found matching criteria"
    ];

    echo json_encode($response);

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