<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Check if user is authenticated
if (!isset($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

// Include database connection
include 'db.php';

try {
    // Update all notifications as read
    $sql = "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE is_read = 0";
    $result = $conn->query($sql);
    
    if ($result) {
        $affectedRows = $conn->affected_rows;
        
        echo json_encode([
            'success' => true,
            'message' => 'All notifications marked as read',
            'markedCount' => $affectedRows,
            'unreadCount' => 0
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
    
} catch (Exception $e) {
    error_log('Mark all notifications read error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

$conn->close();
?>