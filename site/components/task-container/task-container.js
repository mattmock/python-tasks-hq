import { BaseComponent } from '../base/base-component.js';
import { TaskCard } from '../task-card/task-card.js';

export class TaskContainer extends BaseComponent {
    constructor() {
        super();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadStyles();
            await this.loadTemplate();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing TaskContainer:', error);
        }
    }

    async loadStyles() {
        const response = await fetch('/site/components/task-container/task-container.css');
        const styles = await response.text();
        this.attachStyles(styles);
    }

    async loadTemplate() {
        const response = await fetch('/site/components/task-container/task-container.html');
        const template = await response.text();
        this.attachTemplate(template);
    }

    setupEventListeners() {
        const toggleButton = this.shadowRoot.querySelector('.view-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleView());
        }
    }

    toggleView() {
        const dailyTasks = this.shadowRoot.querySelector('daily-tasks');
        const allTasks = this.shadowRoot.querySelector('all-tasks');
        const toggleButton = this.shadowRoot.querySelector('.view-toggle');
        const header = this.shadowRoot.querySelector('h1');
        
        if (dailyTasks.style.display !== 'none') {
            dailyTasks.style.display = 'none';
            allTasks.style.display = 'block';
            toggleButton.textContent = 'Back to Daily Tasks';
            header.textContent = 'All Python Tasks';
        } else {
            dailyTasks.style.display = 'block';
            allTasks.style.display = 'none';
            toggleButton.textContent = 'View All Tasks';
            header.textContent = 'Daily Python Tasks';
        }
    }

    displayDailyTasks() {
        const dailyTasks = this.shadowRoot.querySelector('daily-tasks');
        if (!dailyTasks) return;
        dailyTasks.style.display = 'block';
    }

    displayAllTasks() {
        const allTasks = this.shadowRoot.querySelector('all-tasks');
        if (!allTasks) return;
        allTasks.style.display = 'block';
    }
}

customElements.define('task-container', TaskContainer); 