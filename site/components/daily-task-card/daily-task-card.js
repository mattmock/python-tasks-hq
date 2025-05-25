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

            .complete-button:hover {
                background: var(--accent-hover);
            }

            .complete-button.completed {
                background: var(--bg-tertiary);
                color: var(--text-secondary);
            }

            .complete-button.completed:hover {
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
        const isCompleted = this.getAttribute('data-completed') === 'true';
        button.textContent = isCompleted ? 'Mark Not Done' : 'Mark Complete';
        if (isCompleted) button.classList.add('completed');
        
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
            this._boundMarkComplete = this.markComplete.bind(this);
            button.addEventListener('click', this._boundMarkComplete);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === 'data-completed' && oldValue !== newValue) {
            const button = this.querySelector('.complete-button');
            if (button) {
                const isCompleted = newValue === 'true';
                button.textContent = isCompleted ? 'Mark Not Done' : 'Mark Complete';
                button.classList.toggle('completed', isCompleted);
            }
        }
    }

    async markComplete() {
        const taskId = this.getAttribute('data-task-id');
        const completed = this.getAttribute('data-completed') === 'true';
        
        try {
            const response = await fetch(`/tasks/today/${taskId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !completed })
            });
            
            if (response.ok) {
                // Update the attribute which will trigger attributeChangedCallback
                this.setAttribute('data-completed', (!completed).toString());
                
                // Dispatch event for parent components
                this.dispatchEvent(new CustomEvent('daily-task-completed', {
                    bubbles: true,
                    composed: true,
                    detail: { taskId, completed: !completed }
                }));
            } else {
                console.error('Failed to update task completion status');
                throw new Error('Failed to update task completion status');
            }
        } catch (error) {
            console.error('Error updating task completion status:', error);
            // Show error to user
            const button = this.querySelector('.complete-button');
            if (button) {
                const originalText = button.textContent;
                const originalClass = button.className;
                button.textContent = 'Error!';
                button.style.background = '#ff4444';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    button.className = originalClass;
                }, 2000);
            }
        }
    }
}

customElements.define('daily-task-card', DailyTaskCard); 