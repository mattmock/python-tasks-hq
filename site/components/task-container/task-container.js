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
        const viewToggle = this.shadowRoot.querySelector('.view-toggle');
        const resetButton = this.shadowRoot.querySelector('.reset-button');
        const resetDialog = this.shadowRoot.querySelector('#resetDialog');
        const dailyTasks = this.shadowRoot.querySelector('daily-tasks');
        const allTasks = this.shadowRoot.querySelector('all-tasks');

        if (viewToggle) {
            viewToggle.addEventListener('click', () => {
                const isAllTasks = allTasks.style.display !== 'none';
                allTasks.style.display = isAllTasks ? 'none' : 'block';
                dailyTasks.style.display = isAllTasks ? 'block' : 'none';
                viewToggle.textContent = isAllTasks ? 'View All Tasks' : 'View Daily Tasks';
                
                // Update header text
                const header = this.shadowRoot.querySelector('h1');
                if (header) {
                    header.textContent = isAllTasks ? 'Daily Python Tasks' : 'All Python Tasks';
                }
            });
        }

        if (resetButton && resetDialog) {
            resetButton.addEventListener('click', () => {
                resetDialog.showModal();
            });

            resetDialog.addEventListener('close', async (event) => {
                if (event.target.returnValue === 'confirm') {
                    try {
                        const response = await fetch('/tasks/today/shuffle', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!response.ok) {
                            throw new Error('Failed to reset tasks');
                        }

                        // Reload daily tasks
                        if (dailyTasks) {
                            dailyTasks.reload();
                        }
                    } catch (error) {
                        console.error('Error resetting tasks:', error);
                    }
                }
            });
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