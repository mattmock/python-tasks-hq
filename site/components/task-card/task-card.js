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

    processCodeBlocks(text) {
        if (!text) return '';
        
        // Replace code blocks with proper HTML
        return text.replace(/`([^`]+)`/g, (match, code) => {
            // If the code contains newlines, wrap it in a pre tag
            if (code.includes('\n')) {
                return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
            }
            // Otherwise, just use a code tag
            return `<code>${this.escapeHtml(code)}</code>`;
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            if (descriptionEl) {
                descriptionEl.innerHTML = this.processCodeBlocks(description) || '';
                // Check for overflow after content is set
                this.checkDescriptionOverflow(descriptionEl);
            }
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

    checkDescriptionOverflow(descriptionEl) {
        // Check if content height is greater than container height
        const hasOverflow = descriptionEl.scrollHeight > descriptionEl.clientHeight;
        descriptionEl.classList.toggle('has-overflow', hasOverflow);
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