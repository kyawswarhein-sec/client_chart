<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

// Test database connection
if ($conn->connect_error) {
    error_log('Database connection failed: ' . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

// Get client data from request
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// Required fields
$requiredFields = ['name', 'age', 'gender', 'location', 'type'];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
        exit();
    }
}

// Validate data
$name = trim($input['name']);
$age = intval($input['age']);
$gender = trim($input['gender']);
$location = trim($input['location']);
$type = trim($input['type']);

// Optional fields
$dob = !empty($input['dob']) ? $input['dob'] : null;
$phone = !empty($input['phone']) ? trim($input['phone']) : null;
$arrival_date = !empty($input['arrival_date']) ? $input['arrival_date'] : null;
$us_arrival_date = !empty($input['us_arrival_date']) ? $input['us_arrival_date'] : null;
$visa_expiry_date = !empty($input['visa_expiry_date']) ? $input['visa_expiry_date'] : null;
$note = !empty($input['note']) ? trim($input['note']) : null;

// Validate age
if ($age < 1 || $age > 120) {
    echo json_encode(['success' => false, 'message' => 'Age must be between 1 and 120']);
    exit();
}

// Validate gender
$validGenders = ['Male', 'Female', 'Other'];
if (!in_array($gender, $validGenders)) {
    echo json_encode(['success' => false, 'message' => 'Invalid gender value']);
    exit();
}

// Validate visa type
$validVisaTypes = ['H1B', 'F1', 'L1', 'O1', 'J1'];
if (!in_array($type, $validVisaTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid visa type']);
    exit();
}

try {
    // Prepare the INSERT statement
    $stmt = $conn->prepare("INSERT INTO clients (name, age, gender, location, type, dob, phone, arrival_date, us_arrival_date, visa_expiry_date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Bind parameters
    $stmt->bind_param("sissssssss", $name, $age, $gender, $location, $type, $dob, $phone, $arrival_date, $us_arrival_date, $visa_expiry_date, $note);
    
    // Execute the statement
    if ($stmt->execute()) {
        $clientId = $conn->insert_id;
        
        echo json_encode([
            'success' => true, 
            'message' => 'Client added successfully',
            'clientId' => $clientId,
            'clientName' => $name
        ]);
    } else {
        throw new Exception('Failed to execute insert query: ' . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log('Add client error: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 