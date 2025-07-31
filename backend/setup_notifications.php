<?php
// Setup notifications table and sample data
include 'db.php';

// Create notifications table
$createTableSQL = "
CREATE TABLE IF NOT EXISTS notifications (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL
)";

if ($conn->query($createTableSQL)) {
    echo "Notifications table created successfully\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

// Check if we already have notifications
$checkSQL = "SELECT COUNT(*) as count FROM notifications";
$result = $conn->query($checkSQL);
$row = $result->fetch_assoc();

if ($row['count'] == 0) {
    // Add sample notifications
    $sampleNotifications = [
        [
            'title' => 'Welcome to Admin Dashboard',
            'message' => 'You have successfully logged into the admin dashboard. All systems are operational.',
            'type' => 'success'
        ],
        [
            'title' => 'New Client Added',
            'message' => 'A new client "John Doe" has been added to the system.',
            'type' => 'info'
        ],
        [
            'title' => 'System Backup Completed',
            'message' => 'Daily system backup has been completed successfully. All data is secure.',
            'type' => 'success'
        ],
        [
            'title' => 'Profile Update Required',
            'message' => 'Please review and update your admin profile settings for security compliance.',
            'type' => 'warning'
        ]
    ];

    $insertSQL = "INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insertSQL);

    foreach ($sampleNotifications as $notification) {
        $stmt->bind_param("sss", $notification['title'], $notification['message'], $notification['type']);
        $stmt->execute();
    }

    echo "Sample notifications added successfully\n";
} else {
    echo "Notifications already exist. Count: " . $row['count'] . "\n";
}

$conn->close();
?>