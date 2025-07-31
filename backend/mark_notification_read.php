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
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit();
    }
    
    if (!isset($data['notificationId'])) {
        echo json_encode(['success' => false, 'message' => 'Notification ID is required']);
        exit();
    }
    
    $notificationId = intval($data['notificationId']);
    
    if ($notificationId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid notification ID']);
        exit();
    }
    
    // Update notification as read
    $sql = "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND is_read = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $notificationId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            // Get updated unread count
            $countSQL = "SELECT COUNT(*) as unreadCount FROM notifications WHERE is_read = 0";
            $countResult = $conn->query($countSQL);
            $unreadCount = $countResult->fetch_assoc()['unreadCount'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification marked as read',
                'unreadCount' => $unreadCount
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Notification not found or already read']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
    
} catch (Exception $e) {
    error_log('Mark notification read error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

$conn->close();
?>