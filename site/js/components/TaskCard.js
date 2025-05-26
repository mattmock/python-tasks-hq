import { loadTemplate, handleConditional } from '../utils/template.js';

/**
 * Represents a task card in the UI
 */
export class TaskCard {
    /**
     * Creates a new TaskCard instance
     * @param {Object} data - The task data
     * @param {string} view - The current view mode ('daily' or 'all')
     */
    constructor(data, view) {
        this.data = data;
        this.view = view;
        this.element = null;
    }

    /**
     * Initializes the task card
     * @returns {Promise<HTMLElement>} The initialized task card element
     */
    async initialize() {
        this.element = await this.createElement();
        if (this.view === 'daily') {
            this.setupEventListeners();
        }
        return this.element;
    }

    /**
     * Creates the DOM element for the task card
     * @returns {Promise<HTMLElement>}
     */
    async createElement() {
        const response = await fetch('/site/templates/task-card.html');
        let template = await response.text();
        
        // Handle conditional sections
        template = handleConditional(template, 'isDaily', this.view === 'daily');
        template = handleConditional(template, 'completed', this.data.completed);
        
        // Replace template variables
        const replacements = {
            '{{category}}': this.data.category,
            '{{title}}': this.data.title,
            '{{description}}': this.data.description
        };
        
        const el = document.createElement('div');
        el.innerHTML = template.trim();
        return el.firstChild;
    }

    /**
     * Sets up event listeners for the task card
     */
    setupEventListeners() {
        const button = this.element.querySelector('.task-card__complete-btn');
        if (button) {
            button.addEventListener('click', this.handleComplete.bind(this));
        }
    }

    /**
     * Handles the complete/uncomplete action
     * @param {Event} e 
     */
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