<?php
session_start();
include 'db.php';

// Check if user is logged in
if (!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

// Fetch real client data from database
$clientsQuery = "SELECT * FROM clients ORDER BY arrival_date DESC";
$clientsResult = $conn->query($clientsQuery);
$clients = [];

if ($clientsResult->num_rows > 0) {
    while($row = $clientsResult->fetch_assoc()) {
        $clients[] = $row;
    }
}

// Get total client count
$totalClientsQuery = "SELECT COUNT(*) as total FROM clients";
$totalResult = $conn->query($totalClientsQuery);
$totalClients = $totalResult->fetch_assoc()['total'];

// Process data for charts
$ageGroups = [];
$genderCount = [];
$locationCount = [];
$visaTypeCount = [];

foreach ($clients as $client) {
    // Age groups
    $age = $client['age'];
    if ($age < 25) $ageGroup = '18-24';
    elseif ($age < 30) $ageGroup = '25-29';
    elseif ($age < 35) $ageGroup = '30-34';
    else $ageGroup = '35+';
    
    $ageGroups[$ageGroup] = ($ageGroups[$ageGroup] ?? 0) + 1;

    // Gender
    $genderCount[$client['gender']] = ($genderCount[$client['gender']] ?? 0) + 1;

    // Location
    $locationCount[$client['location']] = ($locationCount[$client['location']] ?? 0) + 1;
    
    // Visa Types
    $visaTypeCount[$client['type']] = ($visaTypeCount[$client['type']] ?? 0) + 1;
}

// Include the HTML template
include '../frontend/dashboard.html';
?>

<script>
// Pass PHP data to JavaScript
window.clientsData = <?php echo json_encode($clients); ?>;
window.ageGroupsData = <?php echo json_encode($ageGroups); ?>;
window.genderCountData = <?php echo json_encode($genderCount); ?>;
window.locationCountData = <?php echo json_encode($locationCount); ?>;
window.visaTypeCountData = <?php echo json_encode($visaTypeCount); ?>;

// Set total clients count
document.getElementById('totalClients').textContent = '<?php echo $totalClients; ?>';

// Set profile name
document.getElementById('profileName').textContent = '<?php echo htmlspecialchars($_SESSION['admin']); ?>';
</script>
