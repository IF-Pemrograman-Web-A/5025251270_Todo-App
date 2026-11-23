<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}
$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
$page = $_POST['page'] ?? 'personal';
if (!$id) die('ID Todo tidak valid.');
if (!in_array($page, ['personal', 'shared'], true)) $page = 'personal';
$stmt = $conn->prepare("DELETE FROM todos WHERE id=?");
$stmt->bind_param("i", $id);
if (!$stmt->execute()) die('Gagal menghapus Todo.');
$stmt->close();
$conn->close();
header('Location: index.php?page=' . urlencode($page));
exit;
?>