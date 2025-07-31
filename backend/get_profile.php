<?php
session_start();
header('Content-Type: application/json');

// Check if user is authenticated
if (!isset($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

// Include database connection
include 'db.php';

// Test database connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $currentUsername = $_SESSION['admin'];
    
    // Get current admin data (excluding password for security)
    $stmt = $conn->prepare("SELECT id, username, created_at FROM admin WHERE username = ?");
    $stmt->bind_param("s", $currentUsername);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $admin = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'admin' => $admin
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Admin user not found']);
    }
    
} catch (Exception $e) {
    error_log('Get profile error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

$conn->close();
?>