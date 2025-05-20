import { TaskCard } from '../task-card/task-card.js';

export class DailyTaskCard extends TaskCard {
    static get observedAttributes() {
        return ['data-task-id', 'data-category', 'data-title', 'data-description', 'data-completed'];
    }

    constructor() {
        super();
    }

    setupEventListeners() {
        // No need to inject the button, just set up the event listener
        const button = this.shadowRoot.querySelector('button[slot="action"]');
        if (button) {
            button.removeEventListener('click', this._boundMarkComplete);
            this._boundMarkComplete = this.markComplete.bind(this);
            button.addEventListener('click', this._boundMarkComplete);
        }
    }

    markComplete() {
        const completed = this.getAttribute('data-completed') === 'true';
        this.setAttribute('data-completed', (!completed).toString());
        this.dispatchEvent(new CustomEvent('daily-task-completed', {
            detail: { taskId: this.getAttribute('data-task-id'), completed: !completed },
            bubbles: true,
            composed: true
        }));
        // Update button text
        const button = this.shadowRoot.querySelector('button[slot="action"]');
        if (button) button.textContent = !completed ? 'Mark Incomplete' : 'Mark Complete';
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateContent();
        }
    }

    updateContent() {
        super.updateContent();
        // Render the button in the slot
        this.renderActionSlot();
        this.setupEventListeners();
    }

    renderActionSlot() {
        // Remove any existing button in the slot
        const oldButton = this.shadowRoot.querySelector('button[slot="action"]');
        if (oldButton) oldButton.remove();
        // Create and append the button to the card, not the header
        const card = this.shadowRoot.querySelector('.task-card');
        if (card) {
            const button = document.createElement('button');
            button.className = 'complete-button';
            button.setAttribute('slot', 'action');
            button.textContent = this.getAttribute('data-completed') === 'true' ? 'Mark Incomplete' : 'Mark Complete';
            card.appendChild(button);
        }
    }

    checkDescriptionOverflow(descriptionEl) {
        const hasOverflow = descriptionEl.scrollHeight > descriptionEl.clientHeight;
        descriptionEl.classList.toggle('has-overflow', hasOverflow);
    }
}

customElements.define('daily-task-card', DailyTaskCard); 