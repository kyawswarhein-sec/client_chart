<?php
session_start();
header('Content-Type: application/json');

// Debug logging
error_log('Check session request received');
error_log('Session ID: ' . session_id());
error_log('Session admin: ' . (isset($_SESSION['admin']) ? $_SESSION['admin'] : 'NOT SET'));
error_log('All session data: ' . json_encode($_SESSION));

// Check if user is logged in
if (!isset($_SESSION['admin'])) {
    error_log('Session check failed - user not authenticated');
    echo json_encode(['authenticated' => false]);
    exit();
}

// Include database connection
include 'db.php';

// Test database connection
if ($conn->connect_error) {
    error_log('Database connection failed in check_session: ' . $conn->connect_error);
    echo json_encode(['authenticated' => true, 'admin' => $_SESSION['admin'], 'error' => 'Database connection failed']);
    exit();
}

error_log('Session check passed for user: ' . $_SESSION['admin']);

// Fetch real client data from database
$clientsQuery = "SELECT * FROM clients ORDER BY id DESC";
$clientsResult = $conn->query($clientsQuery);
$clients = [];

if ($clientsResult->num_rows > 0) {
    while($row = $clientsResult->fetch_assoc()) {
        $clients[] = $row;
    }
}

// Get total clients count
$totalClientsQuery = "SELECT COUNT(*) as total FROM clients";
$totalClientsResult = $conn->query($totalClientsQuery);
$totalClients = $totalClientsResult->fetch_assoc()['total'];

// Prepare age groups
$ageGroups = [
    '18-25' => 0,
    '26-35' => 0,
    '36-45' => 0,
    '46-55' => 0,
    '56+' => 0
];

// Count gender distribution
$genderCount = ['Male' => 0, 'Female' => 0, 'Other' => 0];

// Count location distribution (simplified)
$locationCount = [];

// Count visa type distribution
$visaTypeCount = [];

foreach ($clients as $client) {
    // Age grouping
    $age = $client['age'];
    if ($age >= 18 && $age <= 25) $ageGroups['18-25']++;
    elseif ($age >= 26 && $age <= 35) $ageGroups['26-35']++;
    elseif ($age >= 36 && $age <= 45) $ageGroups['36-45']++;
    elseif ($age >= 46 && $age <= 55) $ageGroups['46-55']++;
    else $ageGroups['56+']++;
    
    // Gender count
    $gender = $client['gender'];
    if (isset($genderCount[$gender])) {
        $genderCount[$gender]++;
    }
    
    // Location count
    $location = $client['location'];
    if (!isset($locationCount[$location])) {
        $locationCount[$location] = 0;
    }
    $locationCount[$location]++;
    
    // Visa type count
    $visaType = $client['type'];
    if (!isset($visaTypeCount[$visaType])) {
        $visaTypeCount[$visaType] = 0;
    }
    $visaTypeCount[$visaType]++;
}

// Return all data
echo json_encode([
    'authenticated' => true,
    'admin' => $_SESSION['admin'],
    'clients' => $clients,
    'totalClients' => $totalClients,
    'ageGroups' => $ageGroups,
    'genderCount' => $genderCount,
    'locationCount' => $locationCount,
    'visaTypeCount' => $visaTypeCount
]);
?> 