<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

// Increase time limit for large operations
set_time_limit(60);

// Increase memory limit if needed
ini_set('memory_limit', '256M');

// Function to reorder client IDs to maintain sequential numbering
function reorderClientIds($conn) {
    try {
        error_log('Starting ID reordering process...');
        
        // Set a reasonable timeout for this operation
        set_time_limit(30);
        
        // Disable foreign key checks temporarily if needed
        $conn->query("SET foreign_key_checks = 0");
        $conn->query("SET autocommit = 0");
        $conn->query("START TRANSACTION");
        
        // Get all remaining clients ordered by their current ID
        $result = $conn->query("SELECT * FROM clients ORDER BY id ASC");
        
        if ($result && $result->num_rows > 0) {
            $clients = [];
            while ($row = $result->fetch_assoc()) {
                $clients[] = $row;
            }
            
            error_log('Found ' . count($clients) . ' clients to reorder');
            
            // Avoid reordering if there are too many clients
            if (count($clients) > 100) {
                error_log('Too many clients for safe reordering, skipping...');
                $conn->query("ROLLBACK");
                $conn->query("SET foreign_key_checks = 1");
                $conn->query("SET autocommit = 1");
                return false;
            }
            
            // Clear the table
            if (!$conn->query("DELETE FROM clients")) {
                throw new Exception('Failed to clear clients table: ' . $conn->error);
            }
            
            // Reset the auto-increment to 1
            if (!$conn->query("ALTER TABLE clients AUTO_INCREMENT = 1")) {
                throw new Exception('Failed to reset auto-increment: ' . $conn->error);
            }
            
            // Re-insert all clients with new sequential IDs
            $stmt = $conn->prepare("INSERT INTO clients (name, age, gender, location, type, dob, phone, arrival_date, us_arrival_date, visa_expiry_date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            if (!$stmt) {
                throw new Exception('Failed to prepare insert statement: ' . $conn->error);
            }
            
            foreach ($clients as $index => $client) {
                // Handle null values properly
                $name = $client['name'] ?? '';
                $age = intval($client['age'] ?? 0);
                $gender = $client['gender'] ?? '';
                $location = $client['location'] ?? '';
                $type = $client['type'] ?? '';
                $dob = !empty($client['dob']) ? $client['dob'] : null;
                $phone = !empty($client['phone']) ? $client['phone'] : null;
                $arrival_date = !empty($client['arrival_date']) ? $client['arrival_date'] : null;
                $us_arrival_date = !empty($client['us_arrival_date']) ? $client['us_arrival_date'] : null;
                $visa_expiry_date = !empty($client['visa_expiry_date']) ? $client['visa_expiry_date'] : null;
                $note = !empty($client['note']) ? $client['note'] : null;
                
                $stmt->bind_param("sissssssss", 
                    $name, 
                    $age, 
                    $gender, 
                    $location, 
                    $type, 
                    $dob, 
                    $phone, 
                    $arrival_date, 
                    $us_arrival_date, 
                    $visa_expiry_date, 
                    $note
                );
                
                if (!$stmt->execute()) {
                    error_log('Failed to re-insert client at index ' . $index . ': ' . $stmt->error);
                    throw new Exception('Failed to re-insert client: ' . $stmt->error);
                }
            }
            $stmt->close();
            
            // Commit the transaction
            $conn->query("COMMIT");
            error_log('Successfully reordered ' . count($clients) . ' clients');
        } else {
            error_log('No clients found or table is empty after deletion');
            $conn->query("COMMIT");
        }
        
        // Re-enable foreign key checks and autocommit
        $conn->query("SET foreign_key_checks = 1");
        $conn->query("SET autocommit = 1");
        
        return true;
    } catch (Exception $e) {
        error_log('Error reordering client IDs: ' . $e->getMessage());
        error_log('Error stack trace: ' . $e->getTraceAsString());
        
        // Rollback transaction and re-enable settings
        $conn->query("ROLLBACK");
        $conn->query("SET foreign_key_checks = 1");
        $conn->query("SET autocommit = 1");
        return false;
    }
}

// Test database connection
if ($conn->connect_error) {
    error_log('Database connection failed: ' . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

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

// Get client IDs from request
$input = json_decode(file_get_contents('php://input'), true);
$clientIds = isset($input['clientIds']) ? $input['clientIds'] : [];

// Debug logging (commented out to avoid interference)
// error_log('Delete clients request - Input: ' . print_r($input, true));
// error_log('Delete clients request - Client IDs: ' . print_r($clientIds, true));

if (empty($clientIds)) {
    error_log('Delete clients error: No client IDs provided in request');
    echo json_encode(['success' => false, 'message' => 'No client IDs provided']);
    exit();
}

// Validate and convert IDs to integers
$validClientIds = [];
foreach ($clientIds as $id) {
    if (!is_numeric($id)) {
        echo json_encode(['success' => false, 'message' => 'Invalid client ID format: ' . $id]);
        exit();
    }
    $validClientIds[] = (int)$id;
}
$clientIds = $validClientIds;

try {
    // Prepare placeholders for IN clause
    $placeholders = str_repeat('?,', count($clientIds) - 1) . '?';
    
    // Prepare the DELETE statement
    $stmt = $conn->prepare("DELETE FROM clients WHERE id IN ($placeholders)");
    
    // Bind parameters (all integers)
    $types = str_repeat('i', count($clientIds));
    $stmt->bind_param($types, ...$clientIds);
    
    // Execute the statement
    if ($stmt->execute()) {
        $deletedCount = $stmt->affected_rows;
        
        if ($deletedCount > 0) {
            // Only reorder IDs for small deletions to avoid timeout issues
            $shouldReorder = $deletedCount <= 10;
            $reorderSuccess = true;
            
            if ($shouldReorder) {
                $reorderSuccess = reorderClientIds($conn);
                error_log("Attempted ID reordering for $deletedCount deletions. Success: " . ($reorderSuccess ? 'yes' : 'no'));
            } else {
                error_log("Skipping ID reordering for large deletion ($deletedCount clients)");
            }
            
            echo json_encode([
                'success' => true, 
                'message' => "$deletedCount client(s) deleted successfully",
                'deletedCount' => $deletedCount,
                'idsReordered' => $shouldReorder && $reorderSuccess,
                'reorderSkipped' => !$shouldReorder
            ]);
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'No clients were found to delete'
            ]);
        }
    } else {
        throw new Exception('Failed to execute delete query');
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    // Log error for debugging
    error_log('Delete clients error: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage(),
        'error_details' => $e->getTraceAsString()
    ]);
}

$conn->close();
?> 