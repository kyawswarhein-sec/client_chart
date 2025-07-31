<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Debug logging
error_log('Update profile request received');
error_log('Session admin: ' . (isset($_SESSION['admin']) ? $_SESSION['admin'] : 'NOT SET'));

// Check if user is authenticated
if (!isset($_SESSION['admin'])) {
    error_log('Update profile failed - user not authenticated');
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

// Include database connection
include 'db.php';

// Test database connection
if ($conn->connect_error) {
    error_log('Database connection failed in update_profile: ' . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    error_log('Raw input: ' . $input);
    
    $profileData = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON decode error: ' . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit();
    }
    
    error_log('Decoded profile data: ' . json_encode($profileData));
    
    // Get current admin username from session
    $currentUsername = $_SESSION['admin'];
    
    // Get current admin data
    $getCurrentStmt = $conn->prepare("SELECT * FROM admin WHERE username = ?");
    $getCurrentStmt->bind_param("s", $currentUsername);
    $getCurrentStmt->execute();
    $result = $getCurrentStmt->get_result();
    
    if ($result->num_rows === 0) {
        error_log('Admin user not found: ' . $currentUsername);
        echo json_encode(['success' => false, 'message' => 'Admin user not found']);
        exit();
    }
    
    $currentAdmin = $result->fetch_assoc();
    
    // Determine what needs to be updated
    $updateName = isset($profileData['name']) && !empty(trim($profileData['name']));
    $updatePassword = isset($profileData['current_password']) && !empty($profileData['current_password']) &&
                      isset($profileData['new_password']) && !empty($profileData['new_password']);
    
    if (!$updateName && !$updatePassword) {
        echo json_encode(['success' => false, 'message' => 'No changes specified']);
        exit();
    }
    
    // Validate name if provided
    if ($updateName) {
        $newName = trim($profileData['name']);
        if (strlen($newName) < 2) {
            echo json_encode(['success' => false, 'message' => 'Name must be at least 2 characters long']);
            exit();
        }
    }
    
    // Validate password if provided
    if ($updatePassword) {
        $currentPassword = $profileData['current_password'];
        $newPassword = $profileData['new_password'];
        $confirmPassword = isset($profileData['confirm_password']) ? $profileData['confirm_password'] : '';
        
        // Verify current password
        $hashedCurrentPassword = hash('sha256', $currentPassword);
        if ($hashedCurrentPassword !== $currentAdmin['password']) {
            error_log('Current password verification failed');
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
            exit();
        }
        
        // Validate new password
        if (strlen($newPassword) < 6) {
            echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters long']);
            exit();
        }
        
        // Check if new password matches confirmation
        if ($newPassword !== $confirmPassword) {
            echo json_encode(['success' => false, 'message' => 'New password and confirmation do not match']);
            exit();
        }
        
        // Check if new password is different from current
        $hashedNewPassword = hash('sha256', $newPassword);
        if ($hashedNewPassword === $currentAdmin['password']) {
            echo json_encode(['success' => false, 'message' => 'New password must be different from current password']);
            exit();
        }
    }
    
    // Prepare update query based on what needs to be updated
    $updates = [];
    $params = [];
    $types = '';
    
    if ($updateName) {
        $updates[] = "username = ?";
        $params[] = $newName;
        $types .= 's';
    }
    
    if ($updatePassword) {
        $updates[] = "password = ?";
        $params[] = hash('sha256', $newPassword);
        $types .= 's';
    }
    
    // Add the WHERE parameter
    $params[] = $currentAdmin['id'];
    $types .= 'i';
    
    $sql = "UPDATE admin SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        error_log('Prepare failed: ' . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Database prepare error']);
        exit();
    }
    
    // Bind parameters dynamically
    $stmt->bind_param($types, ...$params);
    
    error_log('Executing profile update for admin ID: ' . $currentAdmin['id']);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            error_log('Profile updated successfully. Affected rows: ' . $stmt->affected_rows);
            
            // Update session if username changed
            if ($updateName) {
                $_SESSION['admin'] = $newName;
            }
            
            // Fetch the updated admin data
            $fetchStmt = $conn->prepare("SELECT id, username, created_at FROM admin WHERE id = ?");
            $fetchStmt->bind_param("i", $currentAdmin['id']);
            $fetchStmt->execute();
            $result = $fetchStmt->get_result();
            $updatedAdmin = $result->fetch_assoc();
            
            $response = [
                'success' => true,
                'message' => 'Profile updated successfully',
                'admin' => $updatedAdmin,
                'changes' => []
            ];
            
            if ($updateName) {
                $response['changes'][] = 'name';
            }
            if ($updatePassword) {
                $response['changes'][] = 'password';
            }
            
            echo json_encode($response);
        } else {
            error_log('No rows affected during profile update');
            echo json_encode(['success' => false, 'message' => 'No changes were made']);
        }
    } else {
        error_log('Execute failed: ' . $stmt->error);
        echo json_encode(['success' => false, 'message' => 'Database update error: ' . $stmt->error]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log('Update profile error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>