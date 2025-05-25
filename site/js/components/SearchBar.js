import { debounce } from '../utils/debounce.js';
import { fuzzyMatch } from '../utils/fuzzyMatch.js';

/**
 * Represents the search bar component with category filtering
 */
export class SearchBar {
    /**
     * Creates a new SearchBar instance
     * @param {Function} onSearch - Callback function when search/filter changes
     */
    constructor(onSearch) {
        this.selectedCategories = new Set();
        this.onSearch = onSearch;
        this.element = null;
    }

    /**
     * Initializes the search bar
     * @returns {Promise<HTMLElement>} The initialized search bar element
     */
    async initialize() {
        const response = await fetch('/site/templates/search-bar.html');
        const template = await response.text();
        
        const el = document.createElement('div');
        el.innerHTML = template.trim();
        this.element = el.firstChild;
        
        this.setupEventListeners();
        return this.element;
    }

    /**
     * Sets up event listeners for the search bar
     */
    setupEventListeners() {
        const searchInput = this.element.querySelector('.search-input');
        const dropdown = this.element.querySelector('.autocomplete-dropdown');
        const selectedCategoriesContainer = this.element.querySelector('.selected-categories');

        // Show/hide dropdown on focus/blur
        searchInput.addEventListener('focus', () => this.updateDropdown(searchInput.value));
        searchInput.addEventListener('blur', () => {
            setTimeout(() => dropdown.style.display = 'none', 200);
        });

        // Update dropdown as user types with debounce
        const debouncedSearch = debounce((query) => {
            this.updateDropdown(query);
            this.onSearch(query, this.selectedCategories);
        }, 200);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            debouncedSearch(query);
        });

        // Handle dropdown clicks
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                const category = item.textContent.trim();
                this.selectedCategories.add(category);
                this.updatePills();
                this.onSearch(searchInput.value, this.selectedCategories);
                searchInput.value = '';
                dropdown.style.display = 'none';
            }
        });

        // Handle pill removal
        selectedCategoriesContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-pill');
            if (removeBtn) {
                const pill = removeBtn.closest('.category-pill');
                const category = pill.textContent.replace('×', '').trim();
                this.selectedCategories.delete(category);
                this.updatePills();
                this.onSearch(searchInput.value, this.selectedCategories);
            }
        });
    }

    /**
     * Updates the dropdown with matching categories
     * @param {string} query 
     */
    async updateDropdown(query) {
        const dropdown = this.element.querySelector('.autocomplete-dropdown');
        if (!dropdown) return;

        const response = await fetch('/tasks');
        const tasks = await response.json();
        
        // Get all unique categories
        const allCategories = [...new Set(tasks.map(task => task.category))];
        
        // Filter out already selected categories
        const availableCategories = allCategories.filter(cat => !this.selectedCategories.has(cat));
        
        // Filter categories based on query
        const matchingCategories = availableCategories.filter(cat => 
            fuzzyMatch(cat.toLowerCase(), query.toLowerCase())
        );

        if (matchingCategories.length > 0 && query) {
            dropdown.innerHTML = matchingCategories
                .map(cat => `<div class="autocomplete-item">${cat}</div>`)
                .join('');
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }

    /**
     * Updates the category pills display
     */
    async updatePills() {
        const container = this.element.querySelector('.selected-categories');
        if (!container) return;

        const response = await fetch('/site/templates/category-pill.html');
        const template = await response.text();

        container.innerHTML = Array.from(this.selectedCategories)
            .map(category => template.replace('{{category}}', category))
            .join('');
    }

    /**
     * Shows or hides the search bar
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.element) {
            this.element.style.display = visible ? 'block' : 'none';
        }
    }
} 