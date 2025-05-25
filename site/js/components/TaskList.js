import { TaskCard } from './TaskCard.js';
import { SearchBar } from './SearchBar.js';
import { ConfirmDialog } from './ConfirmDialog.js';

/**
 * Main TaskList component that manages the task list interface
 */
export class TaskList {
    /**
     * Creates a new TaskList instance
     * @param {string} containerId - The ID of the container element
     */
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentView = 'daily';
        this.searchBar = null;
        this.confirmDialog = null;
        this.initialize();
    }

    /**
     * Initializes the task list
     */
    async initialize() {
        await this.createTemplate();
        await this.setupComponents();
        this.setupEventListeners();
        await this.loadTasks();
    }

    /**
     * Creates the initial template
     */
    async createTemplate() {
        this.container.innerHTML = `
            <header class="task-list__header">
                <h1 class="task-list__title">Daily Python Tasks</h1>
                <div class="task-list__controls">
                    <button class="task-list__view-toggle">View All Tasks</button>
                    <button class="task-list__reset" title="Reset Tasks">↺</button>
                </div>
            </header>
            <div class="task-list__search-container"></div>
            <div class="task-list__content"></div>
        `;
    }

    /**
     * Sets up the components
     */
    async setupComponents() {
        // Initialize search bar
        this.searchBar = new SearchBar((query, categories) => {
            this.filterTasks(query, categories);
        });
        
        const searchContainer = this.container.querySelector('.task-list__search-container');
        const searchElement = await this.searchBar.initialize();
        searchContainer.appendChild(searchElement);
        this.searchBar.setVisible(false);

        // Initialize confirm dialog
        this.confirmDialog = new ConfirmDialog(
            () => this.resetTasks(),
            () => {} // No-op for cancel
        );
        await this.confirmDialog.initialize();
    }

    /**
     * Sets up event listeners
     */
    setupEventListeners() {
        const viewToggle = this.container.querySelector('.task-list__view-toggle');
        const resetButton = this.container.querySelector('.task-list__reset');
        const title = this.container.querySelector('.task-list__title');

        viewToggle.addEventListener('click', () => this.toggleView());
        resetButton.addEventListener('click', () => this.confirmDialog.show());

        // Listen for task completion events
        this.container.addEventListener('taskCompleted', () => {
            this.loadTasks(); // Refresh the task list
        });
    }

    /**
     * Toggles between daily and all tasks views
     */
    async toggleView() {
        const button = this.container.querySelector('.task-list__view-toggle');
        const title = this.container.querySelector('.task-list__title');
        
        this.currentView = this.currentView === 'daily' ? 'all' : 'daily';
        
        if (this.currentView === 'daily') {
            button.textContent = 'View All Tasks';
            title.textContent = 'Daily Python Tasks';
            this.searchBar.setVisible(false);
        } else {
            button.textContent = 'View Daily Tasks';
            title.textContent = 'All Python Tasks';
            this.searchBar.setVisible(true);
        }

        await this.loadTasks();
    }

    /**
     * Loads tasks from the server
     */
    async loadTasks() {
        try {
            const endpoint = this.currentView === 'daily' ? '/tasks/today' : '/tasks';
            const response = await fetch(endpoint);
            const tasks = await response.json();
            
            await this.renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    /**
     * Renders the task list
     * @param {Array} tasks - Array of task objects
     */
    async renderTasks(tasks) {
        const content = this.container.querySelector('.task-list__content');
        content.innerHTML = '';

        const taskCards = await Promise.all(
            tasks.map(async task => {
                const card = new TaskCard(task, this.currentView);
                await card.initialize();
                return card;
            })
        );

        taskCards.forEach(card => {
            content.appendChild(card.element);
        });
    }

    /**
     * Filters tasks based on search query and selected categories
     * @param {string} query - Search query
     * @param {Set} categories - Set of selected categories
     */
    async filterTasks(query, categories) {
        const response = await fetch('/tasks');
        const tasks = await response.json();

        const filteredTasks = tasks.filter(task => {
            const matchesQuery = !query || 
                task.title.toLowerCase().includes(query.toLowerCase()) ||
                task.description.toLowerCase().includes(query.toLowerCase());

            const matchesCategories = categories.size === 0 || 
                categories.has(task.category);

            return matchesQuery && matchesCategories;
        });

        await this.renderTasks(filteredTasks);
    }

    /**
     * Resets all tasks to incomplete
     */
    async resetTasks() {
        try {
            const response = await fetch('/tasks/reset', { method: 'POST' });
            if (response.ok) {
                await this.loadTasks();
            }
        } catch (error) {
            console.error('Error resetting tasks:', error);
        }
    }
} 