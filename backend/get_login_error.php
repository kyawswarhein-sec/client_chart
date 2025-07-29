<?php
session_start();
header('Content-Type: application/json');

$error = '';
if (isset($_SESSION['login_error'])) {
    $error = $_SESSION['login_error'];
    unset($_SESSION['login_error']); // Clear the error after reading
}

echo json_encode(['error' => $error]);
?> 