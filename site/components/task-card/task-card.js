import { BaseComponent } from '../base/base-component.js';

export class TaskCard extends BaseComponent {
    static get observedAttributes() {
        return ['data-task-id', 'data-category', 'data-title', 'data-description', 'data-completed'];
    }

    constructor() {
        super();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadStyles();
            await this.loadTemplate();
            this.setupEventListeners();
            this.updateContent();
        } catch (error) {
            console.error('Error initializing TaskCard:', error);
        }
    }

    async loadStyles() {
        const response = await fetch('/site/components/task-card/task-card.css');
        const styles = await response.text();
        this.attachStyles(styles);
    }

    async loadTemplate() {
        const response = await fetch('/site/components/task-card/task-card.html');
        const template = await response.text();
        this.attachTemplate(template);
    }

    setupEventListeners() {
        const button = this.shadowRoot.querySelector('.complete-button');
        if (button) {
            button.removeEventListener('click', this._boundMarkComplete);
            this._boundMarkComplete = this.markComplete.bind(this);
            button.addEventListener('click', this._boundMarkComplete);
        }
    }

    getTaskData() {
        return {
            id: this.getAttribute('data-task-id'),
            category: this.getAttribute('data-category'),
            title: this.getAttribute('data-title'),
            description: this.getAttribute('data-description'),
            completed: this.getAttribute('data-completed') === 'true'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateContent();
        }
    }

    updateContent() {
        const taskData = this.getTaskData();
        const card = this.shadowRoot.querySelector('.task-card');
        if (!card) return;

        // Update card completion state
        card.classList.toggle('completed', taskData.completed);

        // Update category
        const categoryEl = card.querySelector('.task-category');
        if (categoryEl) categoryEl.textContent = taskData.category || '';

        // Update title
        const titleEl = card.querySelector('.task-title');
        if (titleEl) titleEl.textContent = taskData.title || '';

        // Update description
        const descriptionEl = card.querySelector('.task-description');
        if (descriptionEl) {
            descriptionEl.innerHTML = this.renderCodeBlocks(taskData.description || '');
        }

        // Update complete button
        const button = card.querySelector('.complete-button');
        if (button) {
            button.textContent = taskData.completed ? 'Completed' : 'Mark Complete';
            button.disabled = taskData.completed;
        }
    }

    renderCodeBlocks(text) {
        if (!text) return '';
        return text.replace(/`([^`]+)`/g, (match, code) => {
            const div = document.createElement('div');
            div.textContent = code;
            return `<code>${div.innerHTML}</code>`;
        });
    }

    // Abstract method to be implemented by child classes
    markComplete() {
        throw new Error('markComplete() must be implemented by child class');
    }
}

customElements.define('task-card', TaskCard); 