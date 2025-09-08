class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.draggedElement = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }
    
    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.itemsLeft = document.getElementById('itemsLeft');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.themeToggle = document.getElementById('themeToggle');
    }
    
    bindEvents() {
        // Add todo events
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Clear completed
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        
        // Theme toggle (placeholder)
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(todo);
        this.todoInput.value = '';
        this.saveTodos();
        this.render();
        
        // Add animation
        setTimeout(() => {
            const firstItem = this.todoList.querySelector('.todo-item');
            if (firstItem) {
                firstItem.style.transform = 'translateX(-100%)';
                firstItem.style.opacity = '0';
                setTimeout(() => {
                    firstItem.style.transform = 'translateX(0)';
                    firstItem.style.opacity = '1';
                }, 10);
            }
        }, 10);
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }
    
    clearCompletedTodos() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
    }
    
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }
    
    render() {
        const filteredTodos = this.getFilteredTodos();
        const activeTodos = this.todos.filter(t => !t.completed);
        
        // Update items left counter
        this.itemsLeft.textContent = `${activeTodos.length} items left`;
        
        // Clear list
        this.todoList.innerHTML = '';
        
        if (filteredTodos.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        // Render todos
        filteredTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            this.todoList.appendChild(todoElement);
        });
        
        // Update clear completed button visibility
        const hasCompleted = this.todos.some(t => t.completed);
        this.clearCompleted.style.opacity = hasCompleted ? '1' : '0.5';
        this.clearCompleted.style.pointerEvents = hasCompleted ? 'auto' : 'none';
    }
    
    renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        
        let message = '';
        switch (this.currentFilter) {
            case 'active':
                message = this.todos.length === 0 
                    ? '<h3>No todos yet!</h3><p>Add your first todo above</p>'
                    : '<h3>All done! 🎉</h3><p>No active todos remaining</p>';
                break;
            case 'completed':
                message = '<h3>No completed todos</h3><p>Complete some todos to see them here</p>';
                break;
            default:
                message = '<h3>No todos yet!</h3><p>Add your first todo above</p>';
        }
        
        emptyDiv.innerHTML = message;
        this.todoList.appendChild(emptyDiv);
    }
    
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.id = todo.id;
        
        li.innerHTML = `
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                 onclick="app.toggleTodo(${todo.id})"></div>
            <span class="todo-text">${this.escapeHtml(todo.text)}</span>
            <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">×</button>
        `;
        
        // Add drag events
        li.addEventListener('dragstart', (e) => this.handleDragStart(e));
        li.addEventListener('dragover', (e) => this.handleDragOver(e));
        li.addEventListener('drop', (e) => this.handleDrop(e));
        li.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        return li;
    }
    
    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(this.todoList, e.clientY);
        if (afterElement == null) {
            this.todoList.appendChild(this.draggedElement);
        } else {
            this.todoList.insertBefore(this.draggedElement, afterElement);
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.reorderTodos();
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    reorderTodos() {
        const todoElements = [...this.todoList.querySelectorAll('.todo-item')];
        const newOrder = todoElements.map(el => {
            const id = parseInt(el.dataset.id);
            return this.todos.find(t => t.id === id);
        }).filter(Boolean);
        
        this.todos = newOrder;
        this.saveTodos();
    }
    
    toggleTheme() {
        // Simple theme toggle animation
        const body = document.body;
        body.style.filter = 'invert(1) hue-rotate(180deg)';
        setTimeout(() => {
            body.style.filter = '';
        }, 300);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

// Add some nice animations
document.addEventListener('DOMContentLoaded', () => {
    // Fade in animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});