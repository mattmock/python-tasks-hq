import { BaseComponent } from '../base/base-component.js';
import { TaskCard } from '../task-card/task-card.js';

export class AllTasks extends BaseComponent {
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
            console.error('Error initializing AllTasks:', error);
        }
    }

    async loadStyles() {
        const response = await fetch('/site/components/all-tasks/all-tasks.css');
        const styles = await response.text();
        this.attachStyles(styles);
    }

    async loadTemplate() {
        const response = await fetch('/site/components/all-tasks/all-tasks.html');
        const template = await response.text();
        this.attachTemplate(template);
    }

    async loadTasks() {
        try {
            const response = await fetch('/data/tasks/tasks.yaml');
            const yamlText = await response.text();
            const tasks = this.parseYamlTasks(yamlText);
            this.displayTasks(tasks);
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

    displayTasks(tasks) {
        const grid = this.shadowRoot.querySelector('.task-grid');
        if (!grid) return;

        grid.innerHTML = '';
        tasks.forEach(task => {
            const taskCard = document.createElement('task-card');
            if (task.id) taskCard.setAttribute('data-task-id', task.id);
            if (task.category) taskCard.setAttribute('data-category', task.category);
            if (task.title) taskCard.setAttribute('data-title', task.title);
            if (task.description) taskCard.setAttribute('data-description', task.description);
            taskCard.setAttribute('data-completed', task.completed.toString());
            grid.appendChild(taskCard);
        });
    }
}

customElements.define('all-tasks', AllTasks); 