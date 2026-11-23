<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$priority = $_POST['priority'] ?? 'low';
$dueDate = $_POST['due_date'] ?? '';
$notificationTime = trim($_POST['notification_time'] ?? '');
$visibility = $_POST['visibility'] ?? 'personal';
$photo = $_POST['photo'] ?? null;

if ($title === '' || $description === '' || $dueDate === '' ||
    !in_array($priority, ['low', 'medium', 'high'], true) ||
    !in_array($visibility, ['personal', 'shared'], true)) {
    die('Data Todo tidak valid.');
}
if ($notificationTime === '') $notificationTime = null;
if ($photo === '') $photo = null;
if ($photo !== null && (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $photo) || strlen($photo) > 2800000)) {
    die('Format foto tidak valid atau ukuran foto terlalu besar (maksimal sekitar 2 MB).');
}

$stmt = $conn->prepare("INSERT INTO todos (title, description, priority, due_date, notification_time, photo, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssss", $title, $description, $priority, $dueDate, $notificationTime, $photo, $visibility);
if (!$stmt->execute()) die('Gagal menambahkan Todo: ' . htmlspecialchars($stmt->error));
$stmt->close();
$conn->close();
header('Location: index.php?page=' . urlencode($visibility));
exit;
?>