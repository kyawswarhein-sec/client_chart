<?php
session_start();
include 'db.php';

$error_message = '';

// Check if user is already logged in
if (isset($_SESSION['admin'])) {
    header("Location: ../frontend/dashboard.html");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = hash('sha256', $_POST['password']);

    $stmt = $conn->prepare("SELECT * FROM admin WHERE username=? AND password=?");
    $stmt->bind_param("ss", $username, $password);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows == 1) {
        $_SESSION['admin'] = $username;
        header("Location: ../frontend/dashboard.html");
        exit();
    } else {
        // Redirect back to login with error message
        session_start();
        $_SESSION['login_error'] = "Invalid username or password!";
        header("Location: ../frontend/login.html");
        exit();
    }
}
?>
