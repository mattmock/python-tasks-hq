/**
 * Loads and parses an HTML template file
 * @param {string} templatePath - Path to the template file
 * @param {Object} replacements - Key-value pairs for template variable replacements
 * @returns {Promise<HTMLElement>} The first element from the template
 */
export async function loadTemplate(templatePath, replacements = {}) {
    const response = await fetch(templatePath);
    let template = await response.text();
    
    // Replace template variables
    Object.entries(replacements).forEach(([key, value]) => {
        const regex = new RegExp(key, 'g');
        template = template.replace(regex, value || '');
    });
    
    const el = document.createElement('div');
    el.innerHTML = template.trim();
    return el.firstChild;
}

/**
 * Handles conditional sections in templates
 * @param {string} template - The template string
 * @param {string} condition - The condition name
 * @param {boolean} value - The condition value
 * @returns {string} The processed template
 */
export function handleConditional(template, condition, value) {
    const startTag = `{{#if ${condition}}}`;
    const elseTag = '{{else}}';
    const endTag = '{{/if}}';
    
    const regex = new RegExp(`${startTag}(.*?)(?:${elseTag}(.*?))?${endTag}`, 'gs');
    
    return template.replace(regex, (_, ifContent, elseContent = '') => {
        return value ? ifContent : elseContent;
    });
} 