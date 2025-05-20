import { BaseComponent } from '../base/base-component.js';

export class TaskCard extends BaseComponent {
    static cardSheet = null;
    static get observedAttributes() {
        return ['data-task-id', 'data-category', 'data-title', 'data-description', 'data-completed'];
    }

    constructor() {
        super();
        this._templateLoaded = false;
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadStyles();
            await this.loadTemplate();
            this._templateLoaded = true;
            this.setupEventListeners();
            this.updateContent();
        } catch (error) {
            console.error('Error initializing TaskCard:', error);
        }
    }

    async loadStyles() {
        const response = await fetch('/site/components/task-card/task-card.css');
        const styles = await response.text();
        // Always use Constructable Stylesheets (adoptedStyleSheets)
        if (!TaskCard.cardSheet) {
            TaskCard.cardSheet = new CSSStyleSheet();
            TaskCard.cardSheet.replaceSync(styles);
        }
        this.shadowRoot.adoptedStyleSheets = [TaskCard.cardSheet, ...(this.shadowRoot.adoptedStyleSheets || [])];
    }

    async loadTemplate() {
        const response = await fetch('/site/components/task-card/task-card.html');
        const template = await response.text();
        this.attachTemplate(template);
    }

    connectedCallback() {
        if (this._templateLoaded) {
            this.setupEventListeners();
            this.updateContent();
        }
    }

    setupEventListeners() {
        const completeButton = this.shadowRoot.querySelector('.complete-button');
        if (completeButton) {
            completeButton.addEventListener('click', () => this.toggleCompletion());
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this._templateLoaded) {
            this.updateContent();
        }
    }

    updateContent() {
        if (!this._templateLoaded) return;

        try {
            const category = this.getAttribute('data-category');
            const title = this.getAttribute('data-title');
            const description = this.getAttribute('data-description');
            const completed = this.getAttribute('data-completed') === 'true';

            const categoryEl = this.shadowRoot.querySelector('.task-category');
            const titleEl = this.shadowRoot.querySelector('.task-title');
            const descriptionEl = this.shadowRoot.querySelector('.task-description');
            const completeButton = this.shadowRoot.querySelector('.complete-button');
            const cardEl = this.shadowRoot.querySelector('.task-card');

            if (categoryEl) categoryEl.textContent = category || '';
            if (titleEl) titleEl.innerHTML = title || '';
            if (descriptionEl) descriptionEl.innerHTML = description || '';
            if (completeButton) completeButton.textContent = completed ? 'Mark Incomplete' : 'Mark Complete';

            if (cardEl) {
                if (completed) {
                    cardEl.classList.add('completed');
                } else {
                    cardEl.classList.remove('completed');
                }
            }
        } catch (error) {
            console.error('Error updating task card content:', error);
        }
    }

    toggleCompletion() {
        const completed = this.getAttribute('data-completed') === 'true';
        this.setAttribute('data-completed', (!completed).toString());
        
        this.dispatchEvent(new CustomEvent('task-completed', {
            detail: { completed: !completed },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('task-card', TaskCard); 