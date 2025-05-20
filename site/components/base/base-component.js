export class BaseComponent extends HTMLElement {
    static globalSheet = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    // Helper method to create and attach styles using adoptedStyleSheets
    attachStyles(styles) {
        // Prepend CSS variables (no @import)
        const cssVars = `
            :host {
                --bg-primary: #1a1a1a;
                --bg-secondary: #2d2d2d;
                --bg-tertiary: #3d3d3d;
                --text-primary: #ffffff;
                --text-secondary: #b3b3b3;
                --accent-primary: #646cff;
                --accent-hover: #535bf2;
                --border-color: #444;
                --spacing-xs: 0.25rem;
                --spacing-sm: 0.5rem;
                --spacing-md: 1rem;
                --spacing-lg: 1.5rem;
                --spacing-xl: 2rem;
                --border-radius: 0.5rem;
                --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --font-family-mono: 'JetBrains Mono', monospace;
            }
        `;
        const fullStyles = cssVars + styles;

        // Always use Constructable Stylesheets (adoptedStyleSheets)
        if (!BaseComponent.globalSheet) {
            BaseComponent.globalSheet = new CSSStyleSheet();
            BaseComponent.globalSheet.replaceSync(fullStyles);
        }
        this.shadowRoot.adoptedStyleSheets = [BaseComponent.globalSheet];
    }

    // Helper method to create and attach template
    attachTemplate(template) {
        // Clear everything except adoptedStyleSheets
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
        // Add new content
        const templateDiv = document.createElement('div');
        templateDiv.innerHTML = template;
        while (templateDiv.firstChild) {
            this.shadowRoot.appendChild(templateDiv.firstChild);
        }
    }

    // Helper method to get CSS variables from parent
    getCssVariable(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name).trim();
    }
} 