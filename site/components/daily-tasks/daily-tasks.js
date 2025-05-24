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
            this.setupEventListeners();
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
        const response = await fetch('/site/components/daily-tasks/daily-tasks.html');
        const template = await response.text();
        this.attachTemplate(template);
    }

    setupEventListeners() {
        const shuffleButton = this.shadowRoot.querySelector('.shuffle-button');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => this.shuffleTasks());
        }
    }

    async loadTasks() {
        try {
            const response = await fetch('/tasks/today');
            const tasks = await response.json();
            if (Array.isArray(tasks)) {
                this.displayTasks(tasks);
                this.checkCompletionState(tasks);
            } else {
                console.error('Invalid tasks response:', tasks);
                this.displayTasks([]);
                this.checkCompletionState([]);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.displayTasks([]);
            this.checkCompletionState([]);
        }
    }

    async shuffleTasks() {
        try {
            const response = await fetch('/tasks/today/shuffle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const tasks = await response.json();
            this.displayTasks(tasks);
            this.checkCompletionState(tasks);
        } catch (error) {
            console.error('Error shuffling tasks:', error);
        }
    }

    checkCompletionState(tasks) {
        const completionMessage = this.shadowRoot.querySelector('.completion-message');
        const taskGrid = this.shadowRoot.querySelector('.task-grid');
        
        if (tasks.length === 0) {
            completionMessage.style.display = 'block';
            taskGrid.style.display = 'none';
        } else {
            completionMessage.style.display = 'none';
            taskGrid.style.display = 'grid';
        }
    }

    async displayTasks(tasks) {
        const grid = this.shadowRoot.querySelector('.task-grid');
        if (!grid) return;

        // Get completed tasks
        const completedResponse = await fetch('/tasks/completed');
        const completedTasks = await completedResponse.json();
        const completedTaskIds = new Set(completedTasks.map(t => t.id));

        grid.innerHTML = '';
        tasks.forEach(task => {
            const taskCard = document.createElement('daily-task-card');
            taskCard.setAttribute('data-task-id', task.id);
            taskCard.setAttribute('data-category', task.category);
            taskCard.setAttribute('data-title', task.title);
            taskCard.setAttribute('data-description', task.description);
            taskCard.setAttribute('data-completed', completedTaskIds.has(task.id).toString());
            
            // Listen for task completion
            taskCard.addEventListener('daily-task-completed', () => {
                this.loadTasks(); // Reload tasks to check completion state
            });
            
            grid.appendChild(taskCard);
        });
    }
}

customElements.define('daily-tasks', DailyTasks); 