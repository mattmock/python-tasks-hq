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
        await this.loadStyles();
        await this.loadTemplate();
        this.setupEventListeners();
        this.updateContent();
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
        // To be implemented by child classes
    }

    // Abstract methods to be implemented by child classes
    markComplete() {
        throw new Error('markComplete() must be implemented by child class');
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
        if (oldValue !== newValue) this.updateContent();
    }

    updateContent() {
        const taskData = this.getTaskData();
        const categoryEl = this.shadowRoot.querySelector('.task-category');
        const titleEl = this.shadowRoot.querySelector('.task-title');
        const descriptionEl = this.shadowRoot.querySelector('.task-description');
        const completeButton = this.shadowRoot.querySelector('.complete-button');
        const cardEl = this.shadowRoot.querySelector('.task-card');
        if (categoryEl) categoryEl.textContent = taskData.category || '';
        if (titleEl) titleEl.textContent = taskData.title || '';
        if (descriptionEl) descriptionEl.innerHTML = this.renderCodeBlocks(taskData.description || '');
        if (completeButton) completeButton.textContent = taskData.completed ? 'Mark Incomplete' : 'Mark Complete';
        if (cardEl) cardEl.classList.toggle('completed', taskData.completed);
    }

    renderCodeBlocks(text) {
        if (!text) return '';
        // Replace text between backticks with <code> blocks, escaping HTML
        return text.replace(/`([^`]+)`/g, (match, code) => {
            return `<code>${this.escapeHtml(code)}</code>`;
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('task-card', TaskCard); 