import { BaseComponent } from '../base/base-component.js';
import { TaskCard } from '../task-card/task-card.js';

export class HomePage extends BaseComponent {
    constructor() {
        super();
        console.log('HomePage constructor called');
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadStyles();
            await this.loadTemplate();
            await this.loadTasks();
        } catch (error) {
            console.error('Error initializing component:', error);
        }
    }

    async loadStyles() {
        console.log('Loading styles...');
        const response = await fetch('/site/components/home-page/home-page.css');
        const styles = await response.text();
        if (!HomePage.pageSheet) {
            HomePage.pageSheet = new CSSStyleSheet();
            HomePage.pageSheet.replaceSync(styles);
        }
        this.shadowRoot.adoptedStyleSheets = [HomePage.pageSheet, ...(this.shadowRoot.adoptedStyleSheets || [])];
        console.log('Styles loaded successfully');
    }

    async loadTemplate() {
        console.log('Loading template...');
        const response = await fetch('/site/components/home-page/home-page.html');
        const template = await response.text();
        this.attachTemplate(template);
        console.log('Template loaded successfully');
    }

    async loadTasks() {
        console.log('Loading tasks...');
        try {
            const response = await fetch('/data/tasks/tasks.yaml');
            const yamlText = await response.text();
            console.log('YAML loaded:', yamlText.substring(0, 100) + '...');
            const tasks = this.parseYamlTasks(yamlText);
            console.log('Parsed tasks:', tasks);
            this.displayTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    parseYamlTasks(yamlText) {
        console.log('Parsing YAML...');
        const tasks = [];
        const lines = yamlText.split('\n');
        let currentTask = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) continue;

            // Start of a new task
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
            // Task properties
            else if (currentTask) {
                if (trimmedLine.startsWith('title:')) {
                    currentTask.title = trimmedLine.replace('title:', '').trim().replace(/"/g, '');
                } else if (trimmedLine.startsWith('description:')) {
                    currentTask.description = trimmedLine.replace('description:', '').trim().replace(/"/g, '');
                }
            }
        }

        // Add the last task if exists
        if (currentTask) {
            tasks.push(currentTask);
        }

        console.log('Parsed tasks:', tasks);
        return tasks;
    }

    displayTasks(tasks) {
        console.log('Displaying tasks...');
        const grid = this.shadowRoot.querySelector('.task-grid');
        if (!grid) {
            console.error('Task grid not found in shadow DOM');
            return;
        }
        grid.innerHTML = '';

        // Limit to 8 tasks
        const limitedTasks = tasks.slice(0, 8);

        // Render each task as a <task-card> web component
        limitedTasks.forEach(task => {
            const taskCard = document.createElement('task-card');
            if (task.id) taskCard.setAttribute('data-task-id', task.id);
            if (task.category) taskCard.setAttribute('data-category', task.category);
            if (task.title) taskCard.setAttribute('data-title', task.title);
            if (task.description) taskCard.setAttribute('data-description', task.description);
            taskCard.setAttribute('data-completed', 'false');
            grid.appendChild(taskCard);
        });
        console.log('Tasks displayed');
    }
}

customElements.define('home-page', HomePage); 