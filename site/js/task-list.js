class TaskList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentView = 'daily';
        this.selectedCategories = new Set();
        this.initialize();
    }

    async initialize() {
        this.createTemplate();
        this.setupEventListeners();
        await this.loadTasks();
    }

    createTemplate() {
        this.container.innerHTML = `
            <header class="task-list__header">
                <h1 class="task-list__title">Daily Python Tasks</h1>
                <div class="task-list__controls">
                    <button class="task-list__view-toggle">View All Tasks</button>
                    <button class="task-list__reset" title="Reset Tasks">↺</button>
                </div>
            </header>
            <div class="search-bar-container" style="display: none">
                <div class="search-section">
                    <input type="text" class="search-input" placeholder="Search tasks by name or category..." autocomplete="off" />
                    <div class="autocomplete-dropdown" style="display: none;"></div>
                </div>
                <div class="selected-categories"></div>
            </div>
            <div class="task-grid"></div>
            <div class="empty-message" style="display: none">No tasks found.</div>
            <div class="error-message" style="display: none">Failed to load tasks.</div>
            <div class="task-list__confirm-dialog" style="display: none">
                <div class="confirm-dialog__content">
                    <h3>Reset All Tasks?</h3>
                    <p>This will mark all tasks as not completed. This action cannot be undone.</p>
                    <div class="confirm-dialog__buttons">
                        <button class="confirm-dialog__cancel">Cancel</button>
                        <button class="confirm-dialog__confirm">Reset Tasks</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const viewToggle = this.container.querySelector('.task-list__view-toggle');
        const resetButton = this.container.querySelector('.task-list__reset');
        const confirmDialog = this.container.querySelector('.task-list__confirm-dialog');
        const cancelButton = this.container.querySelector('.confirm-dialog__cancel');
        const confirmResetButton = this.container.querySelector('.confirm-dialog__confirm');
        const searchInput = this.container.querySelector('.search-input');
        const dropdown = this.container.querySelector('.autocomplete-dropdown');
        const selectedCategoriesContainer = this.container.querySelector('.selected-categories');

        viewToggle.addEventListener('click', () => this.toggleView());
        resetButton.addEventListener('click', () => this.showResetConfirmation());
        cancelButton.addEventListener('click', () => this.hideResetConfirmation());
        confirmResetButton.addEventListener('click', () => this.resetTasks());

        // Show/hide dropdown on focus/blur
        searchInput.addEventListener('focus', () => this.updateDropdown(searchInput.value));
        searchInput.addEventListener('blur', () => {
            setTimeout(() => dropdown.style.display = 'none', 200);
        });

        // Update dropdown as user types with debounce
        const debouncedSearch = this.debounce((query) => {
            this.updateDropdown(query);
            this.filterTasks();
        }, 200);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            debouncedSearch(query);
        });

        // Handle dropdown clicks
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                const category = item.textContent.trim();
                this.selectedCategories.add(category);
                this.updatePills();
                this.filterTasks();
                searchInput.value = '';
                dropdown.style.display = 'none';
            }
        });

        // Handle pill removal
        selectedCategoriesContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-pill');
            if (removeBtn) {
                const pill = removeBtn.closest('.category-pill');
                const category = pill.textContent.replace('×', '').trim();
                this.selectedCategories.delete(category);
                this.updatePills();
                this.filterTasks();
            }
        });

        // Close dialog when clicking outside
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                this.hideResetConfirmation();
            }
        });
    }

    showResetConfirmation() {
        const dialog = this.container.querySelector('.task-list__confirm-dialog');
        dialog.style.display = 'flex';
    }

    hideResetConfirmation() {
        const dialog = this.container.querySelector('.task-list__confirm-dialog');
        dialog.style.display = 'none';
    }

    async resetTasks() {
        const resetButton = this.container.querySelector('.task-list__reset');
        const confirmButton = this.container.querySelector('.confirm-dialog__confirm');
        
        try {
            resetButton.disabled = true;
            confirmButton.disabled = true;
            confirmButton.textContent = 'Resetting...';

            const response = await fetch('/tasks/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                this.hideResetConfirmation();
                await this.loadTasks();
            } else {
                throw new Error('Failed to reset tasks');
            }
        } catch (error) {
            console.error('Error resetting tasks:', error);
            const errorMessage = this.container.querySelector('.error-message');
            errorMessage.textContent = 'Failed to reset tasks. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            resetButton.disabled = false;
            confirmButton.disabled = false;
            confirmButton.textContent = 'Reset Tasks';
        }
    }

    async toggleView() {
        const button = this.container.querySelector('.task-list__view-toggle');
        const title = this.container.querySelector('.task-list__title');
        const searchContainer = this.container.querySelector('.search-bar-container');
        
        // Toggle view first
        this.currentView = this.currentView === 'daily' ? 'all' : 'daily';
        
        // Update UI before loading tasks
        if (this.currentView === 'daily') {
            button.textContent = 'View All Tasks';
            title.textContent = 'Daily Python Tasks';
            searchContainer.style.display = 'none';
        } else {
            button.textContent = 'View Daily Tasks';
            title.textContent = 'All Python Tasks';
            searchContainer.style.display = 'block';
        }
        
        // Load tasks for the new view
        await this.loadTasks();
    }

    async loadTasks() {
        const grid = this.container.querySelector('.task-grid');
        const emptyMessage = this.container.querySelector('.empty-message');
        const errorMessage = this.container.querySelector('.error-message');

        try {
            // Clear existing content first
            grid.innerHTML = '';
            emptyMessage.style.display = 'none';
            errorMessage.style.display = 'none';

            // Get tasks from the correct endpoint
            const endpoint = this.currentView === 'daily' ? '/tasks/today' : '/tasks';
            console.log('Loading tasks from:', endpoint); // Debug log
            const response = await fetch(endpoint);
            const tasks = await response.json();

            if (Array.isArray(tasks) && tasks.length > 0) {
                this.renderTasks(tasks);
            } else {
                emptyMessage.style.display = 'block';
            }
        } catch (e) {
            console.error('Error loading tasks:', e);
            errorMessage.style.display = 'block';
        }
    }

    renderTasks(tasks) {
        const grid = this.container.querySelector('.task-grid');
        const fragment = document.createDocumentFragment();

        tasks.forEach(task => {
            const taskCard = new TaskCard(task, this.currentView);
            taskCard.element.addEventListener('taskCompleted', this.handleTaskCompleted.bind(this));
            fragment.appendChild(taskCard.element);
        });

        grid.appendChild(fragment);
    }

    handleTaskCompleted(event) {
        const { taskId, completed } = event.detail;
        console.log(`Task ${taskId} ${completed ? 'completed' : 'uncompleted'}`);
    }

    updateDropdown(query) {
        const dropdown = this.container.querySelector('.autocomplete-dropdown');
        if (!dropdown) return;

        // Get all unique categories from tasks
        const allCategories = [...new Set(Array.from(this.container.querySelectorAll('.task-card'))
            .map(card => card.querySelector('.task-card__category').textContent))];
        
        // Filter out already selected categories
        const availableCategories = allCategories.filter(cat => !this.selectedCategories.has(cat));
        
        // Filter categories based on query
        const matchingCategories = availableCategories.filter(cat => 
            this.fuzzyMatch(cat.toLowerCase(), query.toLowerCase())
        );

        if (matchingCategories.length > 0 && query) {
            dropdown.innerHTML = matchingCategories
                .map(cat => `<div class="autocomplete-item">${cat}</div>`)
                .join('');
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }

    updatePills() {
        const container = this.container.querySelector('.selected-categories');
        if (!container) return;

        container.innerHTML = Array.from(this.selectedCategories)
            .map(category => `
                <div class="category-pill">
                    ${category}
                    <span class="remove-pill">×</span>
                </div>
            `)
            .join('');
    }

    filterTasks() {
        const searchInput = this.container.querySelector('.search-input');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const taskCards = Array.from(this.container.querySelectorAll('.task-card'));
        const emptyMessage = this.container.querySelector('.empty-message');

        let visibleTasks = taskCards;

        // First filter by selected categories
        if (this.selectedCategories.size > 0) {
            visibleTasks = visibleTasks.filter(card => {
                const category = card.querySelector('.task-card__category').textContent;
                return this.selectedCategories.has(category);
            });
        }

        // Then filter by search query
        if (query) {
            visibleTasks = visibleTasks.filter(card => {
                const title = card.querySelector('.task-card__title').textContent.toLowerCase();
                const category = card.querySelector('.task-card__category').textContent.toLowerCase();
                const description = card.querySelector('.task-card__description').textContent.toLowerCase();
                
                return this.fuzzyMatch(title, query) || 
                       this.fuzzyMatch(category, query) || 
                       this.fuzzyMatch(description, query);
            });
        }

        // Show/hide tasks based on filters
        taskCards.forEach(card => {
            card.style.display = visibleTasks.includes(card) ? '' : 'none';
        });

        // Show/hide empty message
        emptyMessage.style.display = visibleTasks.length === 0 ? 'block' : 'none';
    }

    fuzzyMatch(text, query) {
        if (!query) return true;
        if (!text) return false;
        
        let t = 0, q = 0;
        text = text.toLowerCase();
        query = query.toLowerCase();
        
        while (t < text.length && q < query.length) {
            if (text[t] === query[q]) q++;
            t++;
        }
        return q === query.length;
    }

    debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
}

class TaskCard {
    constructor(data, view) {
        this.data = data;
        this.view = view;
        this.element = this.createElement();
        if (this.view === 'daily') {
            this.setupEventListeners();
        }
    }

    createElement() {
        const el = document.createElement('div');
        el.className = 'task-card';
        el.innerHTML = `
            <div class="task-card__header">
                <span class="task-card__category">${this.data.category}</span>
            </div>
            <h3 class="task-card__title">${this.data.title}</h3>
            <p class="task-card__description">${this.data.description}</p>
            ${this.view === 'daily' ? `
                <button class="task-card__complete-btn ${this.data.completed ? 'completed' : ''}" type="button">
                    ${this.data.completed ? 'Mark Not Done' : 'Mark Complete'}
                </button>
            ` : ''}
        `;
        return el;
    }

    setupEventListeners() {
        const button = this.element.querySelector('.task-card__complete-btn');
        button.addEventListener('click', this.handleComplete.bind(this));
    }

    async handleComplete(e) {
        e.preventDefault();
        const button = e.target;
        button.disabled = true;

        try {
            const response = await fetch(`/tasks/today/${this.data.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !this.data.completed })
            });
            
            const data = await response.json();
            if (response.ok && data.success) {
                this.data.completed = !this.data.completed;
                button.textContent = this.data.completed ? 'Mark Not Done' : 'Mark Complete';
                button.classList.toggle('completed', this.data.completed);
                
                // Dispatch event for parent to handle
                this.element.dispatchEvent(new CustomEvent('taskCompleted', {
                    detail: { taskId: this.data.id, completed: this.data.completed }
                }));
            }
        } catch (error) {
            console.error('Error updating task completion status:', error);
        } finally {
            button.disabled = false;
        }
    }
}

// Initialize the task list
document.addEventListener('DOMContentLoaded', () => {
    new TaskList('task-container');
}); 