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
            await this.loadTasks();
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

    async loadTasks() {
        try {
            const response = await fetch('/data/tasks/tasks.yaml');
            const yamlText = await response.text();
            this.allTasks = this.parseYamlTasks(yamlText);
            this.displayDailyTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    parseYamlTasks(yamlText) {
        const tasks = [];
        const lines = yamlText.split('\n');
        let currentTask = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('- category:')) {
                if (currentTask) {
                    tasks.push(currentTask);
                }
                currentTask = {
                    id: tasks.length + 1,
                    category: trimmedLine.replace('- category:', '').trim().replace(/"/g, ''),
                    title: '',
                    description: '',
                    completed: false
                };
            }
            else if (currentTask) {
                if (trimmedLine.startsWith('title:')) {
                    currentTask.title = trimmedLine.replace('title:', '').trim().replace(/"/g, '');
                } else if (trimmedLine.startsWith('description:')) {
                    currentTask.description = trimmedLine.replace('description:', '').trim().replace(/"/g, '');
                }
            }
        }

        if (currentTask) {
            tasks.push(currentTask);
        }

        return tasks;
    }

    displayDailyTasks() {
        const grid = this.shadowRoot.querySelector('.daily-tasks');
        if (!grid) return;

        grid.innerHTML = '';
        const shuffledTasks = this.shuffleArray([...this.allTasks]);
        const limitedTasks = shuffledTasks.slice(0, 8);

        limitedTasks.forEach(task => {
            const taskCard = document.createElement('task-card');
            if (task.id) taskCard.setAttribute('data-task-id', task.id);
            if (task.category) taskCard.setAttribute('data-category', task.category);
            if (task.title) taskCard.setAttribute('data-title', task.title);
            if (task.description) taskCard.setAttribute('data-description', task.description);
            taskCard.setAttribute('data-completed', task.completed.toString());
            grid.appendChild(taskCard);
        });
    }

    displayAllTasks() {
        const grid = this.shadowRoot.querySelector('.all-tasks');
        if (!grid) return;

        grid.innerHTML = '';
        this.allTasks.forEach(task => {
            const taskCard = document.createElement('task-card');
            if (task.id) taskCard.setAttribute('data-task-id', task.id);
            if (task.category) taskCard.setAttribute('data-category', task.category);
            if (task.title) taskCard.setAttribute('data-title', task.title);
            if (task.description) taskCard.setAttribute('data-description', task.description);
            taskCard.setAttribute('data-completed', task.completed.toString());
            grid.appendChild(taskCard);
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

customElements.define('task-container', TaskContainer); 