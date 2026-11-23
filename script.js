
 // Elemen HTML
const todoList = document.getElementById("todo-list");
const todoForm = document.getElementById("todo-form");

const formTitle = document.getElementById("form-title");
const formSubmit = document.getElementById("form-submit");

const editTodoButton = document.getElementById("edit-todo-button");
const themeToggle = document.getElementById("theme-toggle");

// Data aplikasi
let todos = [];
let selectedTodo = null;
let isEditing = false;

// Mengatur tema aplikasi
function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeToggle.textContent = "Dark Mode";
    }
}

// Memuat preferensi tema dari localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
}

// Mengganti dan menyimpan tema
themeToggle.addEventListener("click", function() {
    const isDarkMode = document.body.classList.contains("dark-mode");
    const newTheme = isDarkMode ? "light" : "dark";

    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
});

// Memuat tema saat aplikasi dibuka
loadTheme();

// Elemen Media Capture
const cameraPreview = document.getElementById("camera-preview");
const photoCanvas = document.getElementById("photo-canvas");
const photoPreview = document.getElementById("photo-preview");

const openCameraButton = document.getElementById("open-camera");
const takePhotoButton = document.getElementById("take-photo");
const removePhotoButton = document.getElementById("remove-photo");

let cameraStream = null;
let capturedPhoto = null;
let photoRemoved = false;

// Membuka kamera
openCameraButton.addEventListener("click", async function() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
        cameraPreview.srcObject = cameraStream;
        cameraPreview.hidden = false;
        takePhotoButton.disabled = false;
    } catch (error) {
        console.error("Camera access failed:", error);
        alert("Tidak dapat mengakses kamera. Periksa izin kamera browser.");
    }
});

// Mengambil foto dari kamera
takePhotoButton.addEventListener("click", function() {
    if (!cameraStream) return;

    photoCanvas.width = cameraPreview.videoWidth;
    photoCanvas.height = cameraPreview.videoHeight;

    const context = photoCanvas.getContext("2d");

    context.drawImage(
        cameraPreview,
        0,
        0,
        photoCanvas.width,
        photoCanvas.height
    );
    // Mengubah foto menjadi data URL
    capturedPhoto = photoCanvas.toDataURL("image/jpeg");
    // Menampilkan preview foto
    photoPreview.src = capturedPhoto;
    photoPreview.hidden = false;
    // Menutup kamera setelah mengambil foto
    stopCamera();
    takePhotoButton.disabled = true;
    removePhotoButton.disabled = false;
});
// Menghapus foto
removePhotoButton.addEventListener("click", function() {
    capturedPhoto = null;
    photoRemoved = true;
    photoPreview.src = "";
    photoPreview.hidden = true;
    removePhotoButton.disabled = true;
});
// Menghentikan kamera
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(function(track) {
            track.stop();
        });
        cameraStream = null;
    }

    cameraPreview.srcObject = null;
    cameraPreview.hidden = true;
    takePhotoButton.disabled = true;
}

// Inisialisasi aplikasi
async function initializeApp() {
    try {
        todos = await getAllTodos();
        selectedTodo = todos[0] || null;
        refreshTodoList();
        updateTodoDetail();
        await scheduleAllNotifications();
    } catch (error) {
        console.error("Failed to initialize database:", error);
        alert("Terjadi kesalahan saat membuka database.");
    }
}

// Mendaftarkan Service Worker
async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.error("Service Worker tidak didukung browser.");
        return;
    }
    try {
        const registration = await navigator.serviceWorker.register("./sw.js");
        console.log("Service Worker berhasil didaftarkan:", registration);
    } catch (error) {
        console.error("Service Worker gagal didaftarkan:", error);
    }
}
registerServiceWorker();

// Meminta izin notifikasi
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Browser tidak mendukung Notification API.");
        return false;
    }
    if (Notification.permission === "granted") {
        return true;
    }
    if (Notification.permission === "denied") {
        alert("Izin notifikasi diblokir. Silakan ubah melalui pengaturan browser.");
        return false;
    }
    const permission = await Notification.requestPermission();
    return permission === "granted";
}

// Menjadwalkan notifikasi Todo
const notificationTimers = new Map();

async function scheduleTodoNotification(todo) {
    // Hapus timer sebelumnya jika ada
    if (notificationTimers.has(todo.id)) {
        clearTimeout(notificationTimers.get(todo.id));
        notificationTimers.delete(todo.id);
    }
    if (!todo.notificationTime || todo.status === "Completed") {
        return;
    }
    // Memastikan izin notifikasi sudah diberikan
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }
    const notificationDate = new Date(todo.notificationTime);
    const delay = notificationDate.getTime() - Date.now();

    // Tidak menjadwalkan waktu yang sudah lewat
    if (delay <= 0) {
        return;
    }

    // Batas maksimum setTimeout browser
    if (delay > 2147483647) {
        console.warn("Notification time is too far in the future.");
        return;
    }

    const timer = setTimeout(async function() {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Todo Reminder", {
                body: todo.title,
                tag: `todo-${todo.id}`,
                data: {
                    todoId: todo.id
                }
            });
            notificationTimers.delete(todo.id);
        } catch (error) {
            console.error("Failed to show notification:", error);
        }
    }, delay);

    notificationTimers.set(todo.id, timer);
}

// Menjadwalkan semua Todo yang tersimpan
async function scheduleAllNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }

    for (const todo of todos) {
        await scheduleTodoNotification(todo);
    }
}

// Memperbarui detail Todo
function updateTodoDetail() {
    if (!selectedTodo) {
        document.getElementById("detail-title").textContent = "No Todo Selected";
        document.getElementById("detail-description").textContent = "Select a Todo to see its details.";
        document.getElementById("detail-priority").textContent = "-";
        document.getElementById("detail-due-date").textContent = "-";
        document.getElementById("detail-status").textContent = "-";

        editTodoButton.disabled = true;
        return;
    }

    editTodoButton.disabled = false;

    document.getElementById("detail-title").textContent = selectedTodo.title;
    document.getElementById("detail-description").textContent = selectedTodo.description;
    document.getElementById("detail-priority").textContent = selectedTodo.priority;
    document.getElementById("detail-due-date").textContent = selectedTodo.dueDate;
    document.getElementById("detail-status").textContent = selectedTodo.status;
}

// Membuat elemen Todo
function createTodoElement(todo) {
    const article = document.createElement("article");
    // Membuat Todo bisa diakses menggunakan keyboard
    article.tabIndex = 0;
    article.setAttribute("role", "group");
    article.setAttribute(
        "aria-label",
        `Todo: ${todo.title}. Tekan Enter atau Space untuk melihat detail.`
    );

    if (selectedTodo && selectedTodo.id === todo.id) {
        article.classList.add("selected");
    }
    // Judul
    const title = document.createElement("h3");
    title.textContent = todo.title;
    // Deskripsi
    const description = document.createElement("p");
    description.textContent = todo.description;
    // Menampilkan gambar Todo jika tersedia
    if (todo.photo) {
        const image = document.createElement("img");
        image.src = todo.photo;
        image.alt = `Image for ${todo.title}`;
        image.className = "todo-image";

        article.appendChild(image);
    }
    // Prioritas
    const priorityText = document.createElement("p");
    priorityText.textContent = "Priority: ";

    const priority = document.createElement("span");
    priority.className = `priority ${todo.priority}`;
    priority.textContent = todo.priority;

    priorityText.appendChild(priority);

    // Due Date
    const dueDate = document.createElement("p");
    dueDate.textContent = `Due: ${todo.dueDate}`;

    // Tombol Delete
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-todo";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
    "aria-label",
    `Delete Todo: ${todo.title}`
    );

    // Checkbox Complete
    const completeLabel = document.createElement("label");
    const completeCheckbox = document.createElement("input");

    completeCheckbox.type = "checkbox";
    completeCheckbox.className = "complete-todo";
    completeCheckbox.checked = todo.status === "Completed";
    completeCheckbox.setAttribute(
    "aria-label",
    `Mark ${todo.title} as completed`
    );

    completeLabel.appendChild(completeCheckbox);
    completeLabel.append(" Complete");

    // Memilih Todo
    article.addEventListener("click", function() {
        selectedTodo = todo;
        refreshTodoList();
        updateTodoDetail();
    });
    // Memilih Todo menggunakan keyboard
    article.addEventListener("keydown", function(event) {
        if (event.target !== article) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();

            selectedTodo = todo;
            refreshTodoList();
            updateTodoDetail();
        }
    });

    // Menghapus Todo
    deleteButton.addEventListener("click", async function(event) {
        event.stopPropagation();
        try {
            // Membatalkan timer notifikasi
            if (notificationTimers.has(todo.id)) {
                clearTimeout(notificationTimers.get(todo.id));
                notificationTimers.delete(todo.id);
            }
            await deleteTodo(todo.id);
            todos = await getAllTodos();
            if (selectedTodo && selectedTodo.id === todo.id) {
                selectedTodo = todos[0] || null;
            }
            refreshTodoList();
            updateTodoDetail();
        } catch (error) {
            console.error("Failed to delete Todo:", error);
            alert("Todo gagal dihapus.");
        }
    });

    // Mencegah checkbox memilih artikel
    completeCheckbox.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    // Mengubah status Todo
    completeCheckbox.addEventListener("change", async function(event) {
        event.stopPropagation();
        try {
            todo.status = completeCheckbox.checked
                ? "Completed"
                : "In Progress";
            await updateTodo(todo);
            if (selectedTodo && selectedTodo.id === todo.id) {
                selectedTodo = todo;
            }
            // Memperbarui jadwal notifikasi
            await scheduleTodoNotification(todo);
            refreshTodoList();
            updateTodoDetail();
        } catch (error) {
            console.error("Failed to update Todo:", error);
            alert("Status Todo gagal diperbarui.");
        }
    });

    // Menampilkan status completed
    if (todo.status === "Completed") {
        article.classList.add("completed");
    }

    article.append(
        title,
        description,
        priorityText,
        dueDate,
        deleteButton,
        completeLabel
    );
    return article;
}

// Menampilkan seluruh Todo
function displayTodos() {
    todos.forEach(function(todo) {
        const article = createTodoElement(todo);
        todoList.appendChild(article);
    });
}

// Memperbarui daftar Todo
function refreshTodoList() {
    todoList.innerHTML = "<h2>My Tasks</h2>";
    displayTodos();
}

// Mengatur form ke mode Create
function resetTodoForm() {
    todoForm.reset();
    isEditing = false;

    capturedPhoto = null;
    photoPreview.src = "";
    photoPreview.hidden = true;
    removePhotoButton.disabled = true;
    stopCamera();
    photoRemoved = false;

    formTitle.textContent = "Create New Todo";
    formSubmit.textContent = "Create Todo";
}

// Mengisi form untuk mengedit Todo
editTodoButton.addEventListener("click", function() {
    if (!selectedTodo) return;

    isEditing = true;

    formTitle.textContent = "Edit Todo";
    formSubmit.textContent = "Update Todo";

    document.getElementById("todo-title").value = selectedTodo.title;
    document.getElementById("todo-description").value = selectedTodo.description;
    document.getElementById("todo-priority").value = selectedTodo.priority;
    document.getElementById("todo-date").value = selectedTodo.dueDate;
    document.getElementById("todo-notification").value = selectedTodo.notificationTime || "";

    // Menampilkan foto Todo yang sudah tersimpan
    capturedPhoto = null;
    photoRemoved = false;
    if (selectedTodo.photo) {
        photoPreview.src = selectedTodo.photo;
        photoPreview.hidden = false;
        removePhotoButton.disabled = false;
    } else {
        photoPreview.src = "";
        photoPreview.hidden = true;
        removePhotoButton.disabled = true;
    }
});

// Membuat atau memperbarui Todo
todoForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-description").value;
    const priority = document.getElementById("todo-priority").value;
    const dueDate = document.getElementById("todo-date").value;
    const notificationTime = document.getElementById("todo-notification").value;

    // Meminta izin jika pengguna mengatur waktu notifikasi
    if (notificationTime) {
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) {
            alert("Todo tetap akan disimpan, tetapi pengingat tidak akan aktif karena izin notifikasi belum diberikan.");
        }
    }
    try {
        if (isEditing && selectedTodo) {
            // Memperbarui Todo
            const updatedTodo = {
                ...selectedTodo,
                title,
                description,
                priority,
                dueDate,
                notificationTime,
                photo: photoRemoved
                    ? null
                    : (capturedPhoto !== null
                        ? capturedPhoto
                        : selectedTodo.photo)
            };
            await updateTodo(updatedTodo);
            selectedTodo = updatedTodo;
        } else {
            // Menambahkan Todo baru
            const newTodo = {
                title,
                description,
                priority,
                dueDate,
                notificationTime,
                status: "In Progress",
                photo: capturedPhoto
            };
            const newId = await addTodo(newTodo);
            newTodo.id = newId;
            selectedTodo = newTodo;
        }
        // Memuat ulang data dari database
        todos = await getAllTodos();
        refreshTodoList();
        updateTodoDetail();
        // Memperbarui jadwal notifikasi
        await scheduleTodoNotification(selectedTodo);
        resetTodoForm();
    } catch (error) {
        console.error("Failed to save Todo:", error);
        alert("Todo gagal disimpan.");
    }
});

// Menjalankan aplikasi
initializeApp();
