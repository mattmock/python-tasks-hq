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
}

customElements.define('view-all-task-card', ViewAllTaskCard); 