const todos = [
    {
        title: "Finish PWEB Assignment",
        description: "Complete the E01a Todo App assignment.",
        priority: "high",
        dueDate: "2026-09-13",
        status: "In Progress"
    },
    {
        title: "Study HTML Semantic",
        description: "Review semantic HTML elements.",
        priority: "medium",
        dueDate: "2026-09-15",
        status: "In Progress"
    },
    {
        title: "Practice CSS Grid",
        description: "Practice creating responsive layouts using CSS Grid.",
        priority: "medium",
        dueDate: "2026-09-17",
        status: "In Progress"
    },
    {
        title: "Read PWEB Material",
        description: "Read the latest Web Programming materials.",
        priority: "low",
        dueDate: "2026-09-20",
        status: "In Progress"
    }
];


const todoList = document.getElementById("todo-list");

const todoForm = document.getElementById("todo-form");

const formTitle = document.getElementById("form-title");
const formSubmit = document.getElementById("form-submit");

const editTodoButton = document.getElementById("edit-todo-button");


const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", function(){
    document.body.classList.toggle("dark-mode");
});

let selectedTodo = todos[0];

let isEditing = false;

function updateTodoDetail() {
    document.getElementById("detail-title").textContent = selectedTodo.title;
    document.getElementById("detail-description").textContent = selectedTodo.description;
    document.getElementById("detail-priority").textContent = selectedTodo.priority;
    document.getElementById("detail-due-date").textContent = selectedTodo.dueDate;
    document.getElementById("detail-status").textContent = selectedTodo.status;
}

updateTodoDetail();

editTodoButton.addEventListener("click", function() {
    isEditing = true;
    formTitle.textContent = "Edit Todo";
    formSubmit.textContent = "Update Todo";

    document.getElementById("todo-title").value = selectedTodo.title;
    document.getElementById("todo-description").value = selectedTodo.description;
    document.getElementById("todo-priority").value = selectedTodo.priority;
    document.getElementById("todo-date").value = selectedTodo.dueDate;
});

todoForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-description").value;
    const priority = document.getElementById("todo-priority").value;
    const dueDate = document.getElementById("todo-date").value;

    const newTodo = {
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate,
        status: "In Progress"
    };

if(isEditing){
    selectedTodo.title = title;
    selectedTodo.description = description;
    selectedTodo.priority = priority;
    selectedTodo.dueDate = dueDate;

    refreshTodoList();
    updateTodoDetail();

    formTitle.textContent = "Create New Todo";
    formSubmit.textContent = "Create Todo";
    todoForm.reset();

    isEditing = false;
} else{
    todos.push(newTodo);

    const article = createTodoElement(newTodo);
    todoList.appendChild(article);
    }
});

function createTodoElement(todo) {
    const article = document.createElement("article");

    article.addEventListener("click", function() {
        selectedTodo = todo;

        const allArticles = todoList.querySelectorAll("article");

        allArticles.forEach(function(item) {
            item.classList.remove("selected");
        });

        article.classList.add("selected");

        updateTodoDetail();
    });

    article.innerHTML = `
        <h3>${todo.title}</h3>
        <p>${todo.description}</p>
        <p>
            Priority:
            <span class="priority ${todo.priority}">
                ${todo.priority}
            </span>
        </p>
        <p>Due: ${todo.dueDate}</p>
        <button type="button" class="delete-todo"> Delete </button>
        <label>
            <input type="checkbox" class="complete-todo">
            Complete
        </label>
    `;

    const deleteButton = article.querySelector(".delete-todo");
    deleteButton.addEventListener("click", function(event) {
        event.stopPropagation();
        const todoIndex = todos.indexOf(todo);
        todos.splice(todoIndex, 1);

        refreshTodoList();
    });

    const completeCheckbox = article.querySelector(".complete-todo");
    completeCheckbox.checked = todo.status === "Completed";

    if(todo.status === "Completed"){
        article.classList.add("completed");
    }

    completeCheckbox.addEventListener("click", function(event) {
    event.stopPropagation();
    });

    completeCheckbox.addEventListener("change", function() {
        if(completeCheckbox.checked){
        todo.status = "Completed";
        article.classList.add("completed");
        } else{
            todo.status = "In Progress";
            article.classList.remove("completed");
        }
        updateTodoDetail();
    });
    return article;
}

function refreshTodoList() {
    todoList.innerHTML = "<h2>My Tasks</h2>";
    displayTodos();
}

function displayTodos() {
    todos.forEach(function(todo) {
        const article = createTodoElement(todo);

        todoList.appendChild(article);
    });
}
displayTodos();