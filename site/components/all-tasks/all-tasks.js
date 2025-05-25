import { BaseComponent } from '../base/base-component.js';
import { ViewAllTaskCard } from '../view-all-task-card/view-all-task-card.js';

export class AllTasks extends BaseComponent {
    constructor() {
        super();
        this.allTasks = [];
        this.filteredTasks = [];
        this.selectedCategories = new Set();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadStyles();
            await this.loadTemplate();
            await this.loadTasks();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing AllTasks:', error);
        }
    }

    async loadStyles() {
        const response = await fetch('/site/components/all-tasks/all-tasks.css');
        const styles = await response.text();
        this.attachStyles(styles);
    }

    async loadTemplate() {
        const template = `
            <div class="search-bar-container">
                <div class="search-section">
                    <input type="text" class="search-input" placeholder="Search tasks by name or category..." autocomplete="off" />
                    <div class="autocomplete-dropdown" style="display: none;"></div>
                </div>
                <div class="selected-categories"></div>
            </div>
            <div class="task-grid"></div>
            <div class="empty-message" style="display: none">No tasks found.</div>
            <div class="error-message" style="display: none">Failed to load tasks.</div>
        `;
        this.attachTemplate(template);
    }

    async loadTasks() {
        try {
            const response = await fetch('/tasks');
            const tasks = await response.json();
            
            // Add IDs to tasks if they don't have them
            this.allTasks = tasks.map((task, index) => ({
                ...task,
                id: task.id || `task-${index + 1}`,
                completed: false
            }));
            
            this.filteredTasks = this.allTasks;
            this.renderTasks(this.filteredTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            const errorMessage = this.shadowRoot.querySelector('.error-message');
            if (errorMessage) errorMessage.style.display = 'block';
        }
    }

    renderTasks(tasks) {
        const grid = this.shadowRoot.querySelector('.task-grid');
        const emptyMessage = this.shadowRoot.querySelector('.empty-message');
        
        if (!grid) return;

        // Clear existing cards
        grid.innerHTML = '';
        
        if (!tasks.length) {
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';
        const fragment = document.createDocumentFragment();

        tasks.forEach(task => {
            const card = new ViewAllTaskCard();
            card.setAttribute('data-task-id', task.id);
            card.setAttribute('data-category', task.category);
            card.setAttribute('data-title', task.title);
            card.setAttribute('data-description', task.description);
            card.setAttribute('data-completed', (task.completed || false).toString());
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
    }

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const dropdown = this.shadowRoot.querySelector('.autocomplete-dropdown');
        const selectedCategoriesContainer = this.shadowRoot.querySelector('.selected-categories');

        if (!searchInput || !dropdown || !selectedCategoriesContainer) {
            console.error('Required elements not found in all-tasks component');
            return;
        }

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
    }

    updateDropdown(query) {
        const dropdown = this.shadowRoot.querySelector('.autocomplete-dropdown');
        if (!dropdown) return;

        // Get all unique categories from tasks
        const allCategories = [...new Set(this.allTasks.map(task => task.category))];
        
        // Filter out already selected categories
        const availableCategories = allCategories.filter(cat => !this.selectedCategories.has(cat));
        
        // Filter categories based on query
        const matchingCategories = availableCategories.filter(cat => 
            this.fuzzyMatch(cat, query)
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
        const container = this.shadowRoot.querySelector('.selected-categories');
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
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        // First filter by selected categories
        let filtered = this.allTasks;
        if (this.selectedCategories.size > 0) {
            filtered = filtered.filter(task => 
                this.selectedCategories.has(task.category)
            );
        }

        // Then filter by search query
        if (query) {
            const titleMatches = filtered.filter(task => 
                this.fuzzyMatch(task.title, query)
            );
            const categoryMatches = filtered.filter(task =>
                !titleMatches.includes(task) && 
                this.fuzzyMatch(task.category, query)
            );
            const descriptionMatches = filtered.filter(task =>
                !titleMatches.includes(task) && 
                !categoryMatches.includes(task) &&
                this.fuzzyMatch(task.description, query)
            );
            filtered = [...titleMatches, ...categoryMatches, ...descriptionMatches];
        }

        this.filteredTasks = filtered;
        this.renderTasks(this.filteredTasks);
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

customElements.define('all-tasks', AllTasks); 