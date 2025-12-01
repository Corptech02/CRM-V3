<?php
// Loss Runs File Download API Endpoint
// Serves uploaded files with proper security checks

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Connect to main vanguard database
    $dbPath = '/var/www/vanguard/vanguard.db';

    if (!file_exists($dbPath)) {
        throw new Exception("Database not found");
    }

    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $fileId = $_GET['fileId'] ?? '';

    if (empty($fileId)) {
        throw new Exception("File ID is required");
    }

    // Get file info from database
    $stmt = $pdo->prepare("
        SELECT id, lead_id, file_name, file_size, file_type
        FROM loss_runs
        WHERE id = ?
    ");
    $stmt->execute([$fileId]);
    $file = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$file) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }

    $filePath = '/var/www/vanguard/uploads/loss-runs/' . $file['file_name'];

    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found on disk']);
        exit;
    }

    // Set appropriate headers
    header('Content-Type: ' . $file['file_type']);
    header('Content-Length: ' . filesize($filePath));
    header('Content-Disposition: inline; filename="' . basename($file['file_name']) . '"');

    // Output file content
    readfile($filePath);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>