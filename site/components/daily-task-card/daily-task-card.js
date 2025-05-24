import { TaskCard } from '../task-card/task-card.js';

export class DailyTaskCard extends TaskCard {
    static get observedAttributes() {
        return ['data-task-id', 'data-category', 'data-title', 'data-description', 'data-completed'];
    }

    constructor() {
        super();
    }

    setupEventListeners() {
        const button = this.shadowRoot.querySelector('button[slot="content"]');
        if (button) {
            button.removeEventListener('click', this._boundMarkComplete);
            this._boundMarkComplete = this.markComplete.bind(this);
            button.addEventListener('click', this._boundMarkComplete);
        }
    }

    async markComplete() {
        const taskId = this.getAttribute('data-task-id');
        const completed = this.getAttribute('data-completed') === 'true';
        
        try {
            const response = await fetch(`/tasks/today/${taskId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.setAttribute('data-completed', (!completed).toString());
                // Update button text
                const button = this.shadowRoot.querySelector('button[slot="content"]');
                if (button) button.textContent = !completed ? 'Mark Incomplete' : 'Mark Complete';
                
                // Add visual feedback
                this.classList.toggle('completed', !completed);
            } else {
                console.error('Failed to mark task as complete');
            }
        } catch (error) {
            console.error('Error marking task as complete:', error);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateContent();
        }
    }

    updateContent() {
        super.updateContent();
        // Render the button in the slot
        this.renderContentSlot();
        this.setupEventListeners();
    }

    renderContentSlot() {
        // Remove any existing button in the slot
        const oldButton = this.shadowRoot.querySelector('button[slot="content"]');
        if (oldButton) oldButton.remove();
        // Create and append the button to the card, not the header
        const card = this.shadowRoot.querySelector('.task-card');
        if (card) {
            const button = document.createElement('button');
            button.className = 'complete-button';
            button.setAttribute('slot', 'content');
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