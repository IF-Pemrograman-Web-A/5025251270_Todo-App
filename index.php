<?php
require_once 'config.php';
$page = $_GET['page'] ?? 'personal';
if (!in_array($page, ['personal', 'shared'], true)) {
    $page = 'personal';
}
$visibility = $page;

$stmt = $conn->prepare("SELECT * FROM todos WHERE visibility = ? ORDER BY created_at DESC");
$stmt->bind_param("s", $visibility);
$stmt->execute();
$result = $stmt->get_result();
$todos = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$selectedId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$selectedTodo = null;
foreach ($todos as $item) {
    if ($item['id'] === $selectedId) {
        $selectedTodo = $item;
        break;
    }
}
if (!$selectedTodo && count($todos) > 0) {
    $selectedTodo = $todos[0];
}
function e($value) {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="style.css?v=3">
</head>
<body>
<header>
    <h1>Todo App</h1>
    <p>Manage your tasks easily</p>
    <button type="button" id="theme-toggle">Dark Mode</button>
    <button type="button" id="enable-notifications">Enable Notifications</button>
</header>

<?php include 'includes/menu-bar.php'; ?>

<?php include 'includes/content.php'; ?>

<footer><p>&copy; 2026 Pemrograman Web A</p></footer>
<script>
window.todoReminders = <?= json_encode(array_map(function($todo) {
    return [
        'id' => (int)$todo['id'],
        'title' => $todo['title'],
        'notificationTime' => $todo['notification_time'],
        'status' => $todo['status']
    ];
}, $todos), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) ?>;
</script>
<script src="script.js?v=2"></script>
</body>
</html>