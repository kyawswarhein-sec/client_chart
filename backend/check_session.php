<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['admin'])) {
    echo json_encode(['authenticated' => false]);
    exit();
}

// Include database connection
include 'db.php';

// Fetch real client data from database
$clientsQuery = "SELECT * FROM clients ORDER BY arrival_date DESC";
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