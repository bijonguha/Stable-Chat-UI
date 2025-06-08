/**
 * MenuManager Module
 * Handles the hamburger menu and documentation panel
 */
export class MenuManager {
    constructor() {
        this.isMenuOpen = false;
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // Create hamburger menu button
        this.menuButton = document.createElement('button');
        this.menuButton.className = 'menu-toggle';
        this.menuButton.innerHTML = '☰';
        document.body.appendChild(this.menuButton);

        // Create documentation panel
        this.docPanel = document.createElement('div');
        this.docPanel.className = 'doc-panel';
        this.docPanel.innerHTML = `
            <div class="doc-header">
                <h2>Menu</h2>
                <button class="doc-close">×</button>
            </div>
            <div class="doc-content">
                <div class="menu-options">
                    <div class="menu-option" id="about-option">
                        <div class="menu-option-header">
                            <span class="menu-option-title">About</span>
                            <span class="menu-option-icon">+</span>
                        </div>
                        <div class="menu-option-content">
                            <h3>Stable Chat UI</h3>
                            <p>A modern, universal chat interface for connecting to any AI service via configurable API endpoints.</p>
                            
                            <h4>Quick Start</h4>
                            <p>To use Stable Chat UI, you need to configure at least one API endpoint:</p>
                            <ol>
                                <li>Click the "+ Add Endpoint" button</li>
                                <li>Enter a name for your endpoint (e.g., "GPT-4", "Claude", etc.)</li>
                                <li>Enter the URL of the API endpoint</li>
                                <li>Configure headers (typically including your API key)</li>
                                <li>Select the HTTP method (usually POST)</li>
                                <li>Toggle streaming if your API supports it</li>
                                <li>Click Save</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div class="menu-option" id="docs-option">
                        <div class="menu-option-header">
                            <span class="menu-option-title">Documentation</span>
                            <span class="menu-option-icon">→</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.docPanel);

        this.closeButton = this.docPanel.querySelector('.doc-close');
    }

    initEventListeners() {
        this.menuButton.addEventListener('click', () => this.toggleMenu());
        this.closeButton.addEventListener('click', () => this.closeMenu());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen &&
                e.target !== this.menuButton &&
                e.target !== this.docPanel &&
                !this.docPanel.contains(e.target)) {
                this.closeMenu();
            }
        });
        
        // About option (collapsible)
        const aboutOption = this.docPanel.querySelector('#about-option');
        const aboutHeader = aboutOption.querySelector('.menu-option-header');
        const aboutContent = aboutOption.querySelector('.menu-option-content');
        const aboutIcon = aboutOption.querySelector('.menu-option-icon');
        
        aboutHeader.addEventListener('click', () => {
            aboutContent.classList.toggle('expanded');
            aboutIcon.textContent = aboutContent.classList.contains('expanded') ? '−' : '+';
        });
        
        // Documentation option (opens new page)
        const docsOption = this.docPanel.querySelector('#docs-option');
        docsOption.addEventListener('click', () => {
            window.open('https://github.com/bijonguha/Stable-Chat-UI', '_blank');
        });
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    }

    openMenu() {
        this.docPanel.classList.add('open');
        this.menuButton.classList.add('active');
    }

    closeMenu() {
        this.docPanel.classList.remove('open');
        this.menuButton.classList.remove('active');
        this.isMenuOpen = false;
    }
}

export default MenuManager;