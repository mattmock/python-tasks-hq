import { BaseComponent } from '../base/base-component.js';
import { ViewAllTaskCard } from '../view-all-task-card/view-all-task-card.js';

export class AllTasks extends BaseComponent {
    constructor() {
        super();
        this.allTasks = [];
        this.filteredTasks = [];
        this.cardElements = [];
        this.initialize();
    }

    async initialize() {
        await this.loadStyles();
        await this.loadTemplate();
        await this.loadTasks();
        this.setupEventListeners();
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
            this.allTasks = this.parseYamlTasks(yamlText);
            this.filteredTasks = this.allTasks;
            this.renderAllCards(this.allTasks);
            this.displayTasks(this.filteredTasks);
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

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.task-search');
        if (searchInput) {
            const debouncedSearch = this.debounce((query) => {
                // First, filter by title matches
                const titleMatches = this.allTasks.filter(task => this.fuzzyMatch(task.title, query));
                // Then, filter by category matches (excluding those already in titleMatches)
                const categoryMatches = this.allTasks.filter(task =>
                    !titleMatches.includes(task) && this.fuzzyMatch(task.category, query)
                );
                this.filteredTasks = [...titleMatches, ...categoryMatches];
                this.displayTasks(this.filteredTasks);
            }, 200);
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                debouncedSearch(query);
            });
        }
    }

    debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    fuzzyMatch(text, query) {
        if (!query) return true;
        if (!text) return false;
        // Simple fuzzy match: all query chars must appear in order in text
        let t = 0, q = 0;
        text = text.toLowerCase();
        while (t < text.length && q < query.length) {
            if (text[t] === query[q]) q++;
            t++;
        }
        return q === query.length;
    }

    renderAllCards(tasks) {
        const grid = this.shadowRoot.querySelector('.task-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this.cardElements = tasks.map(task => {
            const taskCard = document.createElement('view-all-task-card');
            if (task.id) taskCard.setAttribute('data-task-id', task.id);
            if (task.category) taskCard.setAttribute('data-category', task.category);
            if (task.title) taskCard.setAttribute('data-title', task.title);
            if (task.description) taskCard.setAttribute('data-description', task.description);
            taskCard.setAttribute('data-completed', task.completed.toString());
            grid.appendChild(taskCard);
            return { id: task.id, card: taskCard };
        });
    }

    displayTasks(tasks) {
        // Show/hide cards based on filtered tasks
        const showIds = new Set(tasks.map(t => t.id));
        this.cardElements.forEach(({ id, card }) => {
            card.style.display = showIds.has(id) ? '' : 'none';
        });
    }
}

customElements.define('all-tasks', AllTasks); 