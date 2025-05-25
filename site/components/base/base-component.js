export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Create a container div for all content
        this.container = document.createElement('div');
        this.container.className = 'component-container';
        this.shadowRoot.appendChild(this.container);
        
        // Add CSS variables to both shadow root and element itself
        const style = document.createElement('style');
        const cssVars = `
            :host, :root {
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
                display: block;
            }

            .component-container {
                display: contents;
            }

            /* Allow styles to pierce shadow DOM */
            ::slotted(*) {
                all: initial;
            }
        `;
        style.textContent = cssVars;
        this.shadowRoot.appendChild(style);

        // Also apply variables to light DOM
        const lightStyle = document.createElement('style');
        lightStyle.textContent = cssVars;
        this.appendChild(lightStyle);
    }

    // Helper method to create and attach styles
    attachStyles(styles) {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        this.shadowRoot.appendChild(styleElement);
    }

    // Helper method to create and attach template
    attachTemplate(template) {
        // Clear the container
        this.container.innerHTML = '';
        
        // Add new content
        const templateDiv = document.createElement('div');
        templateDiv.innerHTML = template;
        while (templateDiv.firstChild) {
            this.container.appendChild(templateDiv.firstChild);
        }
    }

    // Helper method to get CSS variables from parent
    getCssVariable(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name).trim();
    }
} 