const STORAGE_KEY = "todo-app-v1";

/**
 * @typedef {Object} TodoItem
 * @property {string} id
 * @property {string} text
 * @property {boolean} completed
 * @property {number} createdAt
 */

/**
 * Simple id generator
 */
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Persist and retrieve state
 */
const storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { todos: [], filter: "all" };
      const parsed = JSON.parse(raw);
      return {
        todos: Array.isArray(parsed.todos) ? parsed.todos : [],
        filter: parsed.filter === "active" || parsed.filter === "completed" ? parsed.filter : "all",
      };
    } catch (e) {
      console.warn("Failed to parse storage", e);
      return { todos: [], filter: "all" };
    }
  },
  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
};

class TodoApp {
  /** @type {TodoItem[]} */
  todos = [];
  /** @type {"all"|"active"|"completed"} */
  filter = "all";

  constructor() {
    const { todos, filter } = storage.load();
    this.todos = todos;
    this.filter = filter;

    this.cacheElements();
    this.bindEvents();
    this.render();
  }

  cacheElements() {
    this.input = document.getElementById("new-todo-input");
    this.addButton = document.getElementById("add-todo-btn");
    this.list = document.getElementById("todo-list");
    this.itemsLeft = document.getElementById("items-left");
    this.clearCompletedButton = document.getElementById("clear-completed-btn");
    this.toggleAllButton = document.getElementById("toggle-all-btn");
    this.filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
    this.template = /** @type {HTMLTemplateElement} */ (document.getElementById("todo-item-template"));
  }

  bindEvents() {
    this.addButton.addEventListener("click", () => this.handleAdd());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.handleAdd();
    });

    this.clearCompletedButton.addEventListener("click", () => this.clearCompleted());
    this.toggleAllButton.addEventListener("click", () => this.toggleAll());

    this.filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.setFilter(btn.dataset.filter);
      });
    });

    this.setupDragAndDrop();
  }

  handleAdd() {
    const text = this.input.value.trim();
    if (!text) return;
    this.todos.push({ id: generateId(), text, completed: false, createdAt: Date.now() });
    this.input.value = "";
    this.persistAndRender();
  }

  updateTodo(id, updates) {
    const idx = this.todos.findIndex((t) => t.id === id);
    if (idx === -1) return;
    this.todos[idx] = { ...this.todos[idx], ...updates };
    this.persistAndRender();
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this.persistAndRender();
  }

  clearCompleted() {
    this.todos = this.todos.filter((t) => !t.completed);
    this.persistAndRender();
  }

  toggleAll() {
    const allCompleted = this.todos.length > 0 && this.todos.every((t) => t.completed);
    const next = !allCompleted;
    this.todos = this.todos.map((t) => ({ ...t, completed: next }));
    this.persistAndRender();
  }

  setFilter(filter) {
    if (filter !== "all" && filter !== "active" && filter !== "completed") return;
    this.filter = filter;
    this.persistAndRender();
  }

  get filteredTodos() {
    switch (this.filter) {
      case "active":
        return this.todos.filter((t) => !t.completed);
      case "completed":
        return this.todos.filter((t) => t.completed);
      default:
        return this.todos;
    }
  }

  persistAndRender() {
    storage.save({ todos: this.todos, filter: this.filter });
    this.render();
  }

  render() {
    // Update filter buttons
    this.filterButtons.forEach((btn) => {
      const isActive = btn.dataset.filter === this.filter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    // Update items left
    const leftCount = this.todos.filter((t) => !t.completed).length;
    this.itemsLeft.textContent = `${leftCount}개 남음`;

    // Render list
    this.list.innerHTML = "";
    const fragment = document.createDocumentFragment();
    this.filteredTodos.forEach((todo) => {
      const item = this.createListItem(todo);
      fragment.appendChild(item);
    });
    this.list.appendChild(fragment);
  }

  createListItem(todo) {
    const clone = this.template.content.firstElementChild.cloneNode(true);
    const li = /** @type {HTMLLIElement} */ (clone);
    li.dataset.id = todo.id;
    li.classList.toggle("completed", todo.completed);

    const toggle = li.querySelector(".toggle");
    const textSpan = li.querySelector(".text");
    const editInput = li.querySelector(".edit");
    const deleteBtn = li.querySelector(".delete-btn");
    const editBtn = li.querySelector(".edit-btn");

    textSpan.textContent = todo.text;
    editInput.value = todo.text;
    toggle.checked = todo.completed;

    toggle.addEventListener("change", () => {
      this.updateTodo(todo.id, { completed: toggle.checked });
    });

    deleteBtn.addEventListener("click", () => this.deleteTodo(todo.id));

    editBtn.addEventListener("click", () => this.enterEditMode(li, editInput));
    li.addEventListener("dblclick", (e) => {
      if (e.target === textSpan) this.enterEditMode(li, editInput);
    });

    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.commitEdit(li, editInput, todo.id);
      } else if (e.key === "Escape") {
        this.exitEditMode(li, editInput, todo.text);
      }
    });
    editInput.addEventListener("blur", () => {
      // Commit on blur
      this.commitEdit(li, editInput, todo.id);
    });

    // Drag attributes
    li.addEventListener("dragstart", (e) => this.onDragStart(e));
    li.addEventListener("dragover", (e) => this.onDragOver(e));
    li.addEventListener("dragleave", () => this.onDragLeave(li));
    li.addEventListener("drop", (e) => this.onDrop(e));
    li.addEventListener("dragend", (e) => this.onDragEnd(e));

    return li;
  }

  enterEditMode(li, input) {
    li.classList.add("editing");
    input.focus();
    input.selectionStart = input.value.length;
  }

  exitEditMode(li, input, originalText) {
    li.classList.remove("editing");
    input.value = originalText;
  }

  commitEdit(li, input, id) {
    const newText = input.value.trim();
    if (!newText) {
      this.deleteTodo(id);
    } else {
      this.updateTodo(id, { text: newText });
    }
    li.classList.remove("editing");
  }

  setupDragAndDrop() {
    this.dragState = {
      draggingId: null,
      overId: null,
      position: null, // "above" | "below"
    };
  }

  onDragStart(event) {
    const li = event.currentTarget;
    this.dragState.draggingId = li.dataset.id;
    li.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    // Needed for Firefox
    event.dataTransfer.setData("text/plain", li.dataset.id);
  }

  onDragOver(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const draggingId = this.dragState.draggingId;
    const overId = target.dataset.id;
    if (!draggingId || !overId || draggingId === overId) return;

    const rect = target.getBoundingClientRect();
    const offset = event.clientY - rect.top;
    const position = offset < rect.height / 2 ? "above" : "below";

    // Update visual cue
    target.classList.toggle("drop-target-above", position === "above");
    target.classList.toggle("drop-target-below", position === "below");

    this.dragState.overId = overId;
    this.dragState.position = position;
  }

  onDragLeave(target) {
    target.classList.remove("drop-target-above", "drop-target-below");
  }

  onDrop(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const draggingId = this.dragState.draggingId;
    const overId = this.dragState.overId;
    const position = this.dragState.position;

    target.classList.remove("drop-target-above", "drop-target-below");

    if (!draggingId || !overId || draggingId === overId || !position) return;

    const fromIndex = this.todos.findIndex((t) => t.id === draggingId);
    const toIndex = this.todos.findIndex((t) => t.id === overId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = this.todos.splice(fromIndex, 1);
    const insertIndex = position === "above" ? toIndex : toIndex + 1;
    this.todos.splice(insertIndex, 0, moved);

    this.persistAndRender();
  }

  onDragEnd(event) {
    const li = event.currentTarget;
    li.classList.remove("dragging");
    this.dragState = { draggingId: null, overId: null, position: null };
  }
}

// Initialize app
window.addEventListener("DOMContentLoaded", () => new TodoApp());

