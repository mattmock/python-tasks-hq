import { BaseComponent } from '../base/base-component.js';
import { DailyTaskCard } from '../daily-task-card/daily-task-card.js';

export class DailyTasks extends BaseComponent {
    constructor() {
        super();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadStyles();
            await this.loadTemplate();
            await this.loadTasks();
        } catch (error) {
            console.error('Error initializing DailyTasks:', error);
        }
    }

    async loadStyles() {
        const response = await fetch('/site/components/daily-tasks/daily-tasks.css');
        const styles = await response.text();
        this.attachStyles(styles);
    }

    async loadTemplate() {
        const template = `
            <div class="task-grid"></div>
            <div class="empty-message" style="display: none">No tasks found.</div>
            <div class="error-message" style="display: none">Failed to load tasks.</div>
        `;
        this.attachTemplate(template);
    }

    async loadTasks() {
        const grid = this.shadowRoot.querySelector('.task-grid');
        const emptyMessage = this.shadowRoot.querySelector('.empty-message');
        const errorMessage = this.shadowRoot.querySelector('.error-message');

        try {
            const response = await fetch('/tasks/today');
            const tasks = await response.json();

            // Hide all messages initially
            emptyMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            grid.innerHTML = '';

            if (Array.isArray(tasks) && tasks.length > 0) {
                this.renderTasks(tasks);
            } else {
                emptyMessage.style.display = 'block';
            }
        } catch (e) {
            console.error('Error loading tasks:', e);
            errorMessage.style.display = 'block';
        }
    }

    renderTasks(tasks) {
        const grid = this.shadowRoot.querySelector('.task-grid');
        const fragment = document.createDocumentFragment();

        tasks.forEach(task => {
            const card = new DailyTaskCard();
            card.setAttribute('data-task-id', task.id);
            card.setAttribute('data-category', task.category);
            card.setAttribute('data-title', task.title);
            card.setAttribute('data-description', task.description);
            card.setAttribute('data-completed', (task.completed || false).toString());
            
            // Listen for task completion events
            card.addEventListener('daily-task-completed', this.handleTaskCompleted.bind(this));
            
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
    }

    handleTaskCompleted(event) {
        const { taskId, completed } = event.detail;
        // Here you could update any internal state or trigger other UI updates
        console.log(`Task ${taskId} ${completed ? 'completed' : 'uncompleted'}`);
    }
}

customElements.define('daily-tasks', DailyTasks); 