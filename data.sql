DROP TABLE IF EXISTS todos;

CREATE TABLE todos (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'low',
    due_date DATE NOT NULL,
    notification_time DATETIME DEFAULT NULL,
    status ENUM('In Progress', 'Completed') DEFAULT 'In Progress',
    photo LONGTEXT DEFAULT NULL,
    visibility ENUM('personal', 'shared') DEFAULT 'personal',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO todos (id, title, description, priority, due_date, notification_time, status, photo, visibility, created_at) 
VALUES
(1, 'Finish KKA assignment', 'Complete the FOL and fuzzy tasks', 'high', '2026-12-01', NULL, 'In Progress', NULL, 'personal', '2026-11-23 14:09:52'),
(2, 'Prepare Project Presentation', 'Prepare materials for the team presentation.', 'medium', '2026-12-05', NULL, 'In Progress', NULL, 'shared', '2026-11-23 14:09:52'),
(3, 'Finish assembling Poe s X-Wing model', 'Set the remaining decals', 'low', '2026-12-31', NULL, 'In Progress', NULL, 'personal', '2026-11-25 17:09:15');