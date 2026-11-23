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

<main>
    <section id="todo-list" aria-labelledby="todo-list-title">
        <h2 id="todo-list-title"><?= $page === 'personal' ? 'My Tasks' : 'Shared Tasks' ?></h2>
        <?php if (count($todos) === 0): ?>
            <p class="empty-state">Belum ada Todo di menu ini.</p>
        <?php endif; ?>

        <?php foreach ($todos as $todo): ?>
            <article
                class="todo-card <?= $todo['status'] === 'Completed' ? 'completed' : '' ?> <?= $selectedTodo && $selectedTodo['id'] === $todo['id'] ? 'selected' : '' ?>"
                tabindex="0"
                data-id="<?= (int)$todo['id'] ?>"
                data-title="<?= e($todo['title']) ?>"
                data-description="<?= e($todo['description']) ?>"
                data-priority="<?= e(ucfirst($todo['priority'])) ?>"
                data-due-date="<?= e($todo['due_date']) ?>"
                data-status="<?= e($todo['status']) ?>"
                data-photo="<?= e($todo['photo']) ?>"
            >
                <h3><?= e($todo['title']) ?></h3>
                <p><?= e($todo['description']) ?></p>
                <p><strong>Priority:</strong> <span class="priority <?= e($todo['priority']) ?>"><?= e(ucfirst($todo['priority'])) ?></span></p>
                <p><strong>Due Date:</strong> <?= e($todo['due_date']) ?></p>
                <p><strong>Status:</strong> <?= e($todo['status']) ?></p>
                <?php if (!empty($todo['photo'])): ?>
                    <img class="todo-image" src="<?= e($todo['photo']) ?>" alt="Todo image">
                <?php endif; ?>
                <div class="todo-actions">
                    <a href="update.php?id=<?= (int)$todo['id'] ?>">Edit Todo</a>
                    <form action="status.php" method="POST">
                        <input type="hidden" name="id" value="<?= (int)$todo['id'] ?>">
                        <input type="hidden" name="page" value="<?= e($page) ?>">
                        <button type="submit" class="complete-action"><?= $todo['status'] === 'Completed' ? 'Mark In Progress' : 'Mark Completed' ?></button>
                    </form>
                    <form action="delete.php" method="POST" onsubmit="return confirm('Yakin ingin menghapus Todo ini?');">
                        <input type="hidden" name="id" value="<?= (int)$todo['id'] ?>">
                        <input type="hidden" name="page" value="<?= e($page) ?>">
                        <button type="submit" class="delete-todo">Delete</button>
                    </form>
                </div>
            </article>
        <?php endforeach; ?>
    </section>

    <aside>
        <h2>Todo Detail</h2>
        <?php if ($selectedTodo): ?>
            <article aria-live="polite">
                <h3 id="detail-title"><?= e($selectedTodo['title']) ?></h3>
                <p id="detail-description"><?= e($selectedTodo['description']) ?></p>
                <p><strong>Priority:</strong> <span id="detail-priority"><?= e(ucfirst($selectedTodo['priority'])) ?></span></p>
                <p><strong>Due Date:</strong> <span id="detail-due-date"><?= e($selectedTodo['due_date']) ?></span></p>
                <p><strong>Status:</strong> <span id="detail-status"><?= e($selectedTodo['status']) ?></span></p>
                <img id="detail-image" class="todo-image" src="<?= e($selectedTodo['photo']) ?>" alt="Todo image" <?= empty($selectedTodo['photo']) ? 'hidden' : '' ?>>
                <a class="primary-button" id="edit-todo-button" href="update.php?id=<?= (int)$selectedTodo['id'] ?>">Edit Todo</a>
            </article>
        <?php else: ?>
            <p>Pilih Todo untuk melihat detailnya.</p>
        <?php endif; ?>
    </aside>
</main>

<section class="create-section" aria-labelledby="form-title">
    <h2 id="form-title">Create New Todo</h2>
    <form action="create.php" method="POST">
        <input type="hidden" name="visibility" value="<?= e($page) ?>">
        <div>
            <label for="todo-title">Todo Title</label>
            <input type="text" id="todo-title" name="title" placeholder="Enter todo title" required>
        </div>
        <div>
            <label for="todo-description">Description</label>
            <textarea id="todo-description" name="description" placeholder="Enter todo description" required></textarea>
        </div>
        <div>
            <label for="todo-priority">Priority</label>
            <select id="todo-priority" name="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
        </div>
        <div>
            <label for="todo-date">Due Date</label>
            <input type="date" id="todo-date" name="due_date" required>
        </div>
        <div>
            <label for="todo-notification">Notification Time</label>
            <input type="datetime-local" id="todo-notification" name="notification_time">
        </div>
        <fieldset>
            <legend>Todo Image</legend>
            <video id="camera-preview" autoplay playsinline muted aria-label="Camera preview" hidden></video>
            <canvas id="photo-canvas" hidden></canvas>
            <div class="camera-controls">
                <button type="button" id="open-camera">Open Camera</button>
                <button type="button" id="take-photo" disabled>Take Photo</button>
                <button type="button" id="remove-photo" disabled>Remove Photo</button>
            </div>
            <label for="photo-file">Or choose an image</label>
            <input class="photo-file-input" type="file" id="photo-file" accept="image/*">
            <input type="hidden" name="photo" id="photo">
            <img id="photo-preview" alt="Preview of Todo image" hidden>
        </fieldset>
        <button type="submit" id="form-submit">Create Todo</button>
    </form>
</section>

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