/**
 * MarkdownParser Module
 * Handles all markdown parsing and rendering
 */
export class MarkdownParser {
    static parse(text) {
        // Handle code blocks first to avoid processing markdown inside them
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'text';
            const trimmedCode = code.trim();
            const escapedCode = this.escapeHtml(trimmedCode);
            
            // Map common language aliases to Prism-supported languages
            const languageMap = {
                'sql': 'sql',
                'python': 'python',
                'py': 'python', 
                'javascript': 'javascript',
                'js': 'javascript',
                'typescript': 'typescript',
                'ts': 'typescript',
                'json': 'json',
                'bash': 'bash',
                'shell': 'bash',
                'yaml': 'yaml',
                'yml': 'yaml',
                'markdown': 'markdown',
                'md': 'markdown',
                'html': 'html',
                'css': 'css',
                'text': 'text'
            };
            
            const prismLang = languageMap[lang.toLowerCase()] || 'text';
            const languageClass = prismLang === 'text' ? '' : `language-${prismLang}`;
            
            return `<div class="code-block syntax-highlighted">
                <div class="code-header">
                    <span class="language-label">${lang.toUpperCase()}</span>
                    <button class="copy-btn" onclick="window.app.utils.copyCode(this, '${this.escapeForAttribute(code.trim())}')">
                        📋 Copy
                    </button>
                </div>
                <pre class="line-numbers"><code class="${languageClass}">${escapedCode}</code></pre>
            </div>`;
        });

        // Handle inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle headers
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Handle bold and italic
        text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Handle links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Handle blockquotes
        text = text.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');

        // Handle horizontal rules
        text = text.replace(/^---$/gm, '<hr>');
        text = text.replace(/^\*\*\*$/gm, '<hr>');

        // Handle unordered lists
        text = text.replace(/^[\*\-\+] (.*)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

        // Handle ordered lists
        text = text.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');

        // Handle line breaks and paragraphs
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');

        // Wrap in paragraph tags if not already wrapped
        if (!text.startsWith('<')) {
            text = '<p>' + text + '</p>';
        }

        // Clean up empty paragraphs
        text = text.replace(/<p><\/p>/g, '');
        text = text.replace(/<p><br><\/p>/g, '');

        return text;
    }

    static escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        // Note: We preserve line breaks and whitespace for code blocks
    }

    static escapeForAttribute(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
    
    /**
     * Apply syntax highlighting to code blocks in the given element
     * @param {HTMLElement} element - Element containing code blocks to highlight
     */
    static applySyntaxHighlighting(element) {
        if (typeof Prism !== 'undefined') {
            // Highlight all code blocks within the element
            Prism.highlightAllUnder(element);
        }
    }
    
    /**
     * Parse markdown and apply syntax highlighting
     * @param {string} text - Markdown text to parse
     * @param {HTMLElement} targetElement - Element where parsed content will be inserted
     * @returns {string} - Parsed HTML
     */
    static parseAndHighlight(text, targetElement = null) {
        const parsed = this.parse(text);
        
        // If target element is provided, apply highlighting after a short delay
        if (targetElement && typeof Prism !== 'undefined') {
            setTimeout(() => {
                this.applySyntaxHighlighting(targetElement);
            }, 10);
        }
        
        return parsed;
    }
}

export default MarkdownParser;