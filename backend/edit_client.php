<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Debug logging
error_log('Edit client request received');
error_log('Session admin: ' . (isset($_SESSION['admin']) ? $_SESSION['admin'] : 'NOT SET'));

// Check if user is authenticated
if (!isset($_SESSION['admin'])) {
    error_log('Edit client failed - user not authenticated');
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

// Include database connection
include 'db.php';

// Test database connection
if ($conn->connect_error) {
    error_log('Database connection failed in edit_client: ' . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    error_log('Raw input: ' . $input);
    
    $clientData = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON decode error: ' . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit();
    }
    
    error_log('Decoded client data: ' . json_encode($clientData));
    
    // Validate required fields
    $requiredFields = ['id', 'name', 'age', 'gender', 'location', 'type'];
    foreach ($requiredFields as $field) {
        if (!isset($clientData[$field]) || trim($clientData[$field]) === '') {
            error_log('Missing required field: ' . $field);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            exit();
        }
    }
    
    // Validate client ID
    $clientId = intval($clientData['id']);
    if ($clientId <= 0) {
        error_log('Invalid client ID: ' . $clientData['id']);
        echo json_encode(['success' => false, 'message' => 'Invalid client ID']);
        exit();
    }
    
    // Check if client exists
    $checkStmt = $conn->prepare("SELECT id FROM clients WHERE id = ?");
    $checkStmt->bind_param("i", $clientId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        error_log('Client not found with ID: ' . $clientId);
        echo json_encode(['success' => false, 'message' => 'Client not found']);
        exit();
    }
    
    // Prepare update statement
    $sql = "UPDATE clients SET 
            name = ?, 
            age = ?, 
            gender = ?, 
            location = ?, 
            type = ?, 
            phone = ?, 
            dob = ?, 
            arrival_date = ?, 
            us_arrival_date = ?, 
            visa_expiry_date = ?, 
            note = ?
            WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        error_log('Prepare failed: ' . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Database prepare error']);
        exit();
    }
    
    // Sanitize and prepare data
    $name = trim($clientData['name']);
    $age = intval($clientData['age']);
    $gender = trim($clientData['gender']);
    $location = trim($clientData['location']);
    $type = trim($clientData['type']);
    $phone = isset($clientData['phone']) ? trim($clientData['phone']) : null;
    $dob = isset($clientData['dob']) && !empty($clientData['dob']) ? $clientData['dob'] : null;
    $arrival_date = isset($clientData['arrival_date']) && !empty($clientData['arrival_date']) ? $clientData['arrival_date'] : null;
    $us_arrival_date = isset($clientData['us_arrival_date']) && !empty($clientData['us_arrival_date']) ? $clientData['us_arrival_date'] : null;
    $visa_expiry_date = isset($clientData['visa_expiry_date']) && !empty($clientData['visa_expiry_date']) ? $clientData['visa_expiry_date'] : null;
    $note = isset($clientData['note']) ? trim($clientData['note']) : null;
    
    // Additional validation
    if ($age < 1 || $age > 120) {
        echo json_encode(['success' => false, 'message' => 'Age must be between 1 and 120']);
        exit();
    }
    
    if (!in_array($gender, ['Male', 'Female', 'Other'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid gender value']);
        exit();
    }
    
    if (!in_array($type, ['H1B', 'F1', 'L1', 'O1', 'J1'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid visa type']);
        exit();
    }
    
    // Bind parameters
    $stmt->bind_param("sisssssssssi", 
        $name, 
        $age, 
        $gender, 
        $location, 
        $type, 
        $phone, 
        $dob, 
        $arrival_date, 
        $us_arrival_date, 
        $visa_expiry_date, 
        $note, 
        $clientId
    );
    
    error_log('Executing update for client ID: ' . $clientId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            error_log('Client updated successfully. Affected rows: ' . $stmt->affected_rows);
            
            // Fetch the updated client data
            $fetchStmt = $conn->prepare("SELECT * FROM clients WHERE id = ?");
            $fetchStmt->bind_param("i", $clientId);
            $fetchStmt->execute();
            $result = $fetchStmt->get_result();
            $updatedClient = $result->fetch_assoc();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Client updated successfully',
                'client' => $updatedClient
            ]);
        } else {
            error_log('No rows affected during update');
            echo json_encode(['success' => false, 'message' => 'No changes were made']);
        }
    } else {
        error_log('Execute failed: ' . $stmt->error);
        echo json_encode(['success' => false, 'message' => 'Database update error: ' . $stmt->error]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log('Edit client error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>