<?php
require_once 'config.php';
function e($value) { return htmlspecialchars((string)($value ?? ''), ENT_QUOTES, 'UTF-8'); }
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if ($_SERVER['REQUEST_METHOD'] === 'POST') $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
if (!$id) die('ID Todo tidak valid.');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $priority = $_POST['priority'] ?? 'low';
    $dueDate = $_POST['due_date'] ?? '';
    $notificationTime = trim($_POST['notification_time'] ?? '');
    $status = $_POST['status'] ?? 'In Progress';
    $visibility = $_POST['visibility'] ?? 'personal';
    $photo = $_POST['photo'] ?? null;
    $removePhoto = ($_POST['remove_photo'] ?? '') === '1';

    if ($title === '' || $description === '' || $dueDate === '' ||
        !in_array($priority, ['low', 'medium', 'high'], true) ||
        !in_array($status, ['In Progress', 'Completed'], true) ||
        !in_array($visibility, ['personal', 'shared'], true)) die('Data Todo tidak valid.');

    if ($notificationTime === '') $notificationTime = null;
    if ($removePhoto) $photo = null;
    elseif ($photo === '') $photo = $_POST['existing_photo'] ?? null;
    if ($photo !== null && (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $photo) || strlen($photo) > 2800000)) {
        die('Format foto tidak valid atau ukuran foto terlalu besar (maksimal sekitar 2 MB).');
    }

    $stmt = $conn->prepare("UPDATE todos SET title=?, description=?, priority=?, due_date=?, notification_time=?, status=?, photo=?, visibility=? WHERE id=?");
    $stmt->bind_param("ssssssssi", $title, $description, $priority, $dueDate, $notificationTime, $status, $photo, $visibility, $id);
    if (!$stmt->execute()) die('Gagal memperbarui Todo: ' . e($stmt->error));
    $stmt->close();
    $conn->close();
    header('Location: index.php?page=' . urlencode($visibility) . '&id=' . $id);
    exit;
}

$stmt = $conn->prepare("SELECT * FROM todos WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();
$todo = $stmt->get_result()->fetch_assoc();
$stmt->close();
if (!$todo) die('Todo tidak ditemukan.');
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Todo</title>
    <link rel="stylesheet" href="style.css?v=3">
</head>

<body>
<header><h1>Edit Todo</h1><p>Update your task details</p><button type="button" id="theme-toggle">Dark Mode</button></header>
<main class="edit-main">
    <section class="edit-section">
        <form action="update.php" method="POST">
            <input type="hidden" name="id" value="<?= (int)$todo['id'] ?>">
            <input type="hidden" name="existing_photo" value="<?= e($todo['photo']) ?>">
            <input type="hidden" name="photo" id="photo">
            <input type="hidden" name="remove_photo" id="remove-photo-value" value="0">
            <div><label for="title">Todo Title</label><input type="text" id="title" name="title" value="<?= e($todo['title']) ?>" required></div>
            <div><label for="description">Description</label><textarea id="description" name="description" required><?= e($todo['description']) ?></textarea></div>
            <div><label for="priority">Priority</label><select id="priority" name="priority">
                <?php foreach (['low','medium','high'] as $v): ?><option value="<?= $v ?>" <?= $todo['priority']===$v?'selected':'' ?>><?= ucfirst($v) ?></option><?php endforeach; ?>
            </select></div>
            <div><label for="due_date">Due Date</label><input type="date" id="due_date" name="due_date" value="<?= e($todo['due_date']) ?>" required></div>
            <div><label for="notification_time">Notification Time</label><input type="datetime-local" id="notification_time" name="notification_time" value="<?= $todo['notification_time'] ? e(date('Y-m-d\TH:i', strtotime($todo['notification_time']))) : '' ?>"></div>
            <div><label for="status">Status</label><select id="status" name="status">
                <option value="In Progress" <?= $todo['status']==='In Progress'?'selected':'' ?>>In Progress</option>
                <option value="Completed" <?= $todo['status']==='Completed'?'selected':'' ?>>Completed</option>
            </select></div>
            <div><label for="visibility">Category</label><select id="visibility" name="visibility">
                <option value="personal" <?= $todo['visibility']==='personal'?'selected':'' ?>>Personal</option>
                <option value="shared" <?= $todo['visibility']==='shared'?'selected':'' ?>>Shared</option>
            </select></div>
            <fieldset>
                <legend>Todo Image</legend>
                <?php if (!empty($todo['photo'])): ?><img id="photo-preview" class="todo-image" src="<?= e($todo['photo']) ?>" alt="Current Todo image"><?php else: ?><img id="photo-preview" class="todo-image" alt="Preview" hidden><?php endif; ?>
                <label for="photo-file">Choose a new image</label><input class="photo-file-input" type="file" id="photo-file" accept="image/*">
                <button type="button" id="remove-photo">Remove Image</button>
            </fieldset>
            <button type="submit">Save Changes</button>
            <a class="cancel-link" href="index.php?page=<?= e($todo['visibility']) ?>&id=<?= (int)$todo['id'] ?>">Cancel</a>
        </form>
    </section>
</main>

<script src="script.js?v=2"></script>
<script>
    
document.getElementById('remove-photo')?.addEventListener('click', () => {
    document.getElementById('remove-photo-value').value = '1';
    document.getElementById('photo').value = '';
    const preview = document.getElementById('photo-preview');
    preview.src = '';
    preview.hidden = true;
});
</script>
</body>
</html>