import { loadTemplate } from '../utils/template.js';

/**
 * Represents a confirmation dialog component
 */
export class ConfirmDialog {
    /**
     * Creates a new ConfirmDialog instance
     * @param {Function} onConfirm - Callback function when user confirms
     * @param {Function} onCancel - Callback function when user cancels
     */
    constructor(onConfirm, onCancel) {
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.element = null;
    }

    /**
     * Initializes the dialog
     * @returns {Promise<HTMLElement>} The initialized dialog element
     */
    async initialize() {
        this.element = await loadTemplate('/site/templates/confirm-dialog.html');
        this.setupEventListeners();
        document.body.appendChild(this.element);
        this.hide();
        return this.element;
    }

    /**
     * Sets up event listeners for the dialog
     */
    setupEventListeners() {
        const confirmBtn = this.element.querySelector('.confirm-dialog__confirm');
        const cancelBtn = this.element.querySelector('.confirm-dialog__cancel');

        confirmBtn.addEventListener('click', () => {
            this.hide();
            this.onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            this.hide();
            this.onCancel();
        });

        // Close on click outside
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
                this.onCancel();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.element.style.display !== 'none') {
                this.hide();
                this.onCancel();
            }
        });
    }

    /**
     * Shows the dialog
     */
    show() {
        if (this.element) {
            this.element.style.display = 'flex';
            this.element.querySelector('.confirm-dialog__cancel').focus();
        }
    }

    /**
     * Hides the dialog
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }
} 