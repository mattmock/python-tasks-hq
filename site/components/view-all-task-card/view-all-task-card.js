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
        super.updateContent();  // Use the base class's updateContent which handles code blocks
        const descriptionEl = this.shadowRoot.querySelector('.task-description');
        if (descriptionEl) {
            this.checkDescriptionOverflow(descriptionEl);
        }
    }

    checkDescriptionOverflow(descriptionEl) {
        const hasOverflow = descriptionEl.scrollHeight > descriptionEl.clientHeight;
        descriptionEl.classList.toggle('has-overflow', hasOverflow);
    }
}

customElements.define('view-all-task-card', ViewAllTaskCard); 