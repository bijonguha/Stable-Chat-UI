/**
 * MarkdownParser Module
 * Handles markdown parsing and rendering for chat messages
 */

export const MarkdownParser = {
    parse(text) {
        if (!text) return '';
        
        let html = text;
        
        // Code blocks (must be processed first)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'text';
            return `<div class="code-block">
                <div class="code-header">
                    <span>${language}</span>
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                </div>
                <pre><code>${this.escapeHtml(code.trim())}</code></pre>
            </div>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Lists (unordered)
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Lists (ordered)
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Global function for copy button
window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    });
};

export default MarkdownParser;