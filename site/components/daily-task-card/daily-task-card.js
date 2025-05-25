import { TaskCard } from '../task-card/task-card.js';

export class DailyTaskCard extends TaskCard {
    static get observedAttributes() {
        return ['data-task-id', 'data-category', 'data-title', 'data-description', 'data-completed'];
    }

    constructor() {
        super();
        // Add button styles to light DOM
        const style = document.createElement('style');
        style.textContent = `
            .complete-button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: var(--border-radius);
                background: var(--accent-primary);
                color: white;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
                margin-top: auto;
                user-select: none;
            }

            .complete-button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                pointer-events: none;
            }

            .complete-button:not(:disabled):hover {
                background: var(--accent-hover);
            }

            .complete-button.completed:not(:disabled) {
                background: var(--bg-tertiary);
                color: var(--text-secondary);
            }

            .complete-button.completed:not(:disabled):hover {
                background: var(--bg-secondary);
                color: var(--text-primary);
            }
        `;
        this.appendChild(style);
    }

    async initialize() {
        await super.initialize();
        this.addCompleteButton();
        this.setupEventListeners();
    }

    addCompleteButton() {
        // Remove existing button if any
        const existingContainer = this.querySelector('[slot="content"]');
        if (existingContainer) {
            existingContainer.remove();
        }

        const button = document.createElement('button');
        button.className = 'complete-button';
        button.setAttribute('type', 'button'); // Ensure it's a button type
        const isCompleted = this.getAttribute('data-completed') === 'true';
        button.textContent = isCompleted ? 'Mark Not Done' : 'Mark Complete';
        if (isCompleted) button.classList.add('completed');
        
        // Ensure button starts enabled
        button.disabled = false;
        
        const container = document.createElement('div');
        container.slot = 'content';
        container.appendChild(button);
        
        this.appendChild(container);
    }

    setupEventListeners() {
        const button = this.querySelector('.complete-button');
        if (button) {
            // Remove old listener if exists
            if (this._boundMarkComplete) {
                button.removeEventListener('click', this._boundMarkComplete);
            }
            
            // Create new bound function
            this._boundMarkComplete = async (e) => {
                e.preventDefault();
                await this.markComplete();
            };
            
            button.addEventListener('click', this._boundMarkComplete);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === 'data-completed' && oldValue !== newValue) {
            const button = this.querySelector('.complete-button');
            if (button && !this._requestInProgress) { // Only update if not in middle of update
                const isCompleted = newValue === 'true';
                button.textContent = isCompleted ? 'Mark Not Done' : 'Mark Complete';
                button.classList.toggle('completed', isCompleted);
            }
        }
    }

    async markComplete() {
        const button = this.querySelector('.complete-button');
        if (!button) return;

        // Disable the button immediately
        button.disabled = true;

        const taskId = this.getAttribute('data-task-id');
        const completed = this.getAttribute('data-completed') === 'true';

        try {
            const response = await fetch(`/tasks/today/${taskId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !completed })
            });
            
            const data = await response.json();
            if (response.ok && data.success) {
                this.setAttribute('data-completed', (!completed).toString());
            }
        } catch (error) {
            console.error('Error updating task completion status:', error);
        } finally {
            // Re-enable the button
            button.disabled = false;
        }
    }
}

customElements.define('daily-task-card', DailyTaskCard); 