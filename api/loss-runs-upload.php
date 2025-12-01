<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Loss Runs File Upload API Endpoint
// Handles file uploads to server storage with database metadata

try {
    // Connect to main vanguard database
    $dbPath = '/var/www/vanguard/vanguard.db';

    if (!file_exists($dbPath)) {
        throw new Exception("Database not found at: $dbPath");
    }

    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Handle file upload
        if (!isset($_POST['leadId'])) {
            throw new Exception("Lead ID is required");
        }

        $leadId = $_POST['leadId'];
        $uploadDir = '/var/www/vanguard/uploads/loss-runs/';

        // Create upload directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $uploadedFiles = [];

        if (isset($_FILES['files'])) {
            $files = $_FILES['files'];

            // Handle multiple files
            if (is_array($files['name'])) {
                $fileCount = count($files['name']);
                for ($i = 0; $i < $fileCount; $i++) {
                    $uploadedFiles[] = processFileUpload(
                        $leadId,
                        $files['name'][$i],
                        $files['tmp_name'][$i],
                        $files['size'][$i],
                        $files['type'][$i],
                        $uploadDir,
                        $pdo
                    );
                }
            } else {
                // Single file
                $uploadedFiles[] = processFileUpload(
                    $leadId,
                    $files['name'],
                    $files['tmp_name'],
                    $files['size'],
                    $files['type'],
                    $uploadDir,
                    $pdo
                );
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Files uploaded successfully',
            'files' => $uploadedFiles,
            'count' => count($uploadedFiles)
        ]);

    } elseif ($method === 'GET') {
        // Handle file retrieval
        $leadId = $_GET['leadId'] ?? '';

        if (empty($leadId)) {
            throw new Exception("Lead ID is required");
        }

        $stmt = $pdo->prepare("
            SELECT id, lead_id, file_name, file_size, file_type, uploaded_date, status, notes
            FROM loss_runs
            WHERE lead_id = ?
            ORDER BY uploaded_date DESC
        ");
        $stmt->execute([$leadId]);
        $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'files' => $files,
            'count' => count($files)
        ]);

    } elseif ($method === 'DELETE') {
        // Handle file deletion
        $input = json_decode(file_get_contents('php://input'), true);
        $fileId = $input['fileId'] ?? '';

        if (empty($fileId)) {
            throw new Exception("File ID is required");
        }

        // Get file info first
        $stmt = $pdo->prepare("SELECT file_name FROM loss_runs WHERE id = ?");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$file) {
            throw new Exception("File not found");
        }

        // Delete from filesystem
        $filePath = '/var/www/vanguard/uploads/loss-runs/' . $file['file_name'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM loss_runs WHERE id = ?");
        $stmt->execute([$fileId]);

        echo json_encode([
            'success' => true,
            'message' => 'File deleted successfully'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function processFileUpload($leadId, $fileName, $tmpName, $fileSize, $fileType, $uploadDir, $pdo) {
    // Generate unique filename
    $fileId = uniqid() . '_' . time();
    $extension = pathinfo($fileName, PATHINFO_EXTENSION);
    $uniqueFileName = $fileId . '.' . $extension;
    $filePath = $uploadDir . $uniqueFileName;

    // Move uploaded file
    if (!move_uploaded_file($tmpName, $filePath)) {
        throw new Exception("Failed to move uploaded file: $fileName");
    }

    // Insert into database
    $stmt = $pdo->prepare("
        INSERT INTO loss_runs (id, lead_id, file_name, file_size, file_type, status)
        VALUES (?, ?, ?, ?, ?, 'uploaded')
    ");
    $stmt->execute([$fileId, $leadId, $uniqueFileName, $fileSize, $fileType]);

    return [
        'id' => $fileId,
        'lead_id' => $leadId,
        'file_name' => $uniqueFileName,
        'original_name' => $fileName,
        'file_size' => $fileSize,
        'file_type' => $fileType,
        'uploaded_date' => date('Y-m-d H:i:s')
    ];
}
?>