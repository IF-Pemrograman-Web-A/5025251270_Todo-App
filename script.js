// Tema terang/gelap
const themeToggle = document.getElementById("theme-toggle");
function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
    if (themeToggle) themeToggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);
themeToggle?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
});

// Pilih Todo untuk melihat detail
document.querySelectorAll(".todo-card").forEach(card => {
    card.addEventListener("click", event => {
        if (event.target.closest("a, button, form, input, label")) return;
        document.querySelectorAll(".todo-card").forEach(item => item.classList.remove("selected"));
        card.classList.add("selected");
        const data = card.dataset;
        document.getElementById("detail-title").textContent = data.title;
        document.getElementById("detail-description").textContent = data.description;
        document.getElementById("detail-priority").textContent = data.priority;
        document.getElementById("detail-due-date").textContent = data.dueDate;
        document.getElementById("detail-status").textContent = data.status;
        const image = document.getElementById("detail-image");
        if (image) {
            image.src = data.photo || "";
            image.hidden = !data.photo;
        }
        const edit = document.getElementById("edit-todo-button");
        if (edit) edit.href = `update.php?id=${data.id}`;
    });
});

// Kamera dan foto Todo
const cameraPreview = document.getElementById("camera-preview");
const photoCanvas = document.getElementById("photo-canvas");
const photoPreview = document.getElementById("photo-preview");
const photoInput = document.getElementById("photo");
const openCameraButton = document.getElementById("open-camera");
const takePhotoButton = document.getElementById("take-photo");
const removePhotoButton = document.getElementById("remove-photo");
let cameraStream = null;

function stopCamera() {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    if (cameraPreview) {
        cameraPreview.srcObject = null;
        cameraPreview.hidden = true;
    }
    if (takePhotoButton) takePhotoButton.disabled = true;
}

openCameraButton?.addEventListener("click", async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraPreview.srcObject = cameraStream;
        cameraPreview.hidden = false;
        takePhotoButton.disabled = false;
    } catch (error) {
        alert("Tidak dapat mengakses kamera. Periksa izin kamera browser.");
    }
});

takePhotoButton?.addEventListener("click", () => {
    if (!cameraStream) return;
    photoCanvas.width = cameraPreview.videoWidth;
    photoCanvas.height = cameraPreview.videoHeight;
    photoCanvas.getContext("2d").drawImage(cameraPreview, 0, 0);
    const photo = photoCanvas.toDataURL("image/jpeg", 0.8);
    photoInput.value = photo;
    photoPreview.src = photo;
    photoPreview.hidden = false;
    removePhotoButton.disabled = false;
    stopCamera();
});

removePhotoButton?.addEventListener("click", () => {
    photoInput.value = "";
    photoPreview.src = "";
    photoPreview.hidden = true;
    removePhotoButton.disabled = true;
});

document.querySelectorAll(".photo-file-input").forEach(input => {
    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran foto maksimal 2 MB.");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            photoInput.value = reader.result;
            photoPreview.src = reader.result;
            photoPreview.hidden = false;
        };
        reader.readAsDataURL(file);
    });
});

window.addEventListener("beforeunload", stopCamera);

// Notifikasi: meminta izin dan menampilkan notifikasi yang waktunya sudah tiba
if ("Notification" in window && Notification.permission === "default") {
    // Izin diminta melalui tombol agar sesuai kebijakan browser.
}
document.getElementById("enable-notifications")?.addEventListener("click", async () => {
    if (!("Notification" in window)) return alert("Browser tidak mendukung notifikasi.");
    const permission = await Notification.requestPermission();
    alert(permission === "granted" ? "Notifikasi berhasil diaktifkan." : "Izin notifikasi belum diberikan.");
    if (permission === "granted") await scheduleAllNotifications();
});
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(error => console.error("Service Worker:", error));
}


// Penjadwalan pengingat berdasarkan notification_time dari database.
// Pengingat browser berjalan selama halaman aplikasi terbuka.
const notificationTimers = new Map();

async function scheduleTodoNotification(todo) {
    if (notificationTimers.has(todo.id)) {
        clearTimeout(notificationTimers.get(todo.id));
        notificationTimers.delete(todo.id);
    }
    if (!todo.notificationTime || todo.status === "Completed") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notificationDate = new Date(todo.notificationTime.replace(" ", "T"));
    const delay = notificationDate.getTime() - Date.now();
    if (delay <= 0 || delay > 2147483647) return;

    const timer = setTimeout(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Todo Reminder", {
                body: todo.title,
                tag: `todo-${todo.id}`,
                data: { todoId: todo.id }
            });
        } catch (error) {
            console.error("Failed to show notification:", error);
        }
        notificationTimers.delete(todo.id);
    }, delay);
    notificationTimers.set(todo.id, timer);
}

async function scheduleAllNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    for (const todo of (window.todoReminders || [])) {
        await scheduleTodoNotification(todo);
    }
}
scheduleAllNotifications();

let deferredPrompt;
const installButton = document.getElementById("install-app");

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
});

installButton?.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
        console.log("Todo App berhasil di-install.");
    }

    deferredPrompt = null;
    installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    console.log("Todo App telah di-install.");
});