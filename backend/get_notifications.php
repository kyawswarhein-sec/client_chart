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

try {
    // Get all notifications ordered by newest first
    $sql = "SELECT id, title, message, type, is_read, created_at, read_at FROM notifications ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    $notifications = [];
    $unreadCount = 0;
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $notifications[] = $row;
            if (!$row['is_read']) {
                $unreadCount++;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unreadCount' => $unreadCount
    ]);
    
} catch (Exception $e) {
    error_log('Get notifications error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

$conn->close();
?>