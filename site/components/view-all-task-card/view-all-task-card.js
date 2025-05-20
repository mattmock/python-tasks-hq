import { TaskCard } from '../task-card/task-card.js';

export class ViewAllTaskCard extends TaskCard {
    static get observedAttributes() {
        return ['data-task-id', 'data-category', 'data-title', 'data-description', 'data-completed'];
    }

    constructor() {
        super();
    }

    setupEventListeners() {
        // No Mark Complete button or related logic
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateContent();
        }
    }

    updateContent() {
        const taskData = this.getTaskData();
        const categoryEl = this.shadowRoot.querySelector('.task-category');
        const titleEl = this.shadowRoot.querySelector('.task-title');
        const descriptionEl = this.shadowRoot.querySelector('.task-description');
        const cardEl = this.shadowRoot.querySelector('.task-card');

        if (categoryEl) categoryEl.textContent = taskData.category || '';
        if (titleEl) titleEl.textContent = taskData.title || '';
        if (descriptionEl) {
            descriptionEl.textContent = taskData.description || '';
            this.checkDescriptionOverflow(descriptionEl);
        }

        if (cardEl) {
            cardEl.classList.toggle('completed', taskData.completed);
        }
    }

    checkDescriptionOverflow(descriptionEl) {
        const hasOverflow = descriptionEl.scrollHeight > descriptionEl.clientHeight;
        descriptionEl.classList.toggle('has-overflow', hasOverflow);
    }
}

customElements.define('view-all-task-card', ViewAllTaskCard); 