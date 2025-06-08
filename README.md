# Stable Chat UI

A modern, universal chat interface for connecting to any AI service via configurable API endpoints. Designed for easy local or remote AI chat integration, with a beautiful, responsive UI and endpoint management.

![Stable Chat UI](images/stable-chat.png)

## Features

- **Universal AI Interface**: Connect to any AI chat service with a compatible API
- **Configurable Endpoints**: Add, edit, and manage multiple API endpoints
- **Streaming Support**: Real-time streaming responses for compatible APIs
- **Markdown Rendering**: Rich text formatting in chat messages
- **Code Highlighting**: Syntax highlighting for code blocks with copy functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Configurations saved in browser storage
- **No Dependencies**: Built with vanilla JavaScript, no external libraries required

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stable-chat-ui.git
   cd stable-chat-ui
   ```

2. Serve the files using any HTTP server:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js
   npx serve
   ```

3. Open your browser and navigate to `http://localhost:8080`

### Configuration

To use Stable Chat UI, you need to configure at least one API endpoint:

1. Click the "+ Add Endpoint" button
2. Enter a name for your endpoint (e.g., "GPT-4", "Claude", "Gemini")
3. Enter the URL of the API endpoint
4. Configure headers (typically including your API key)
5. Select the HTTP method (usually POST)
6. Toggle streaming if your API supports it
7. Click Save

## API Compatibility

Stable Chat UI is designed to work with various AI chat APIs. The application expects the following general format for requests and responses:

### Request Format

```json
{
  "messages": [
    { "text": "Your message here" }
  ],
  "conversation_id": "optional-conversation-id",
  "stream": true|false
}
```

### Response Format

For regular (non-streaming) responses:

```json
{
  "response": "AI response text",
  "conversation_id": "conversation-id"
}
```

For streaming responses, the application supports:
- Server-Sent Events (SSE)
- Line-delimited JSON
- Plain text streaming

## Project Structure

The project is organized into modular JavaScript files:

- `app.js` - Main application entry point
- `js/StableChatApp.js` - Main application orchestrator
- `js/EndpointManager.js` - Manages API endpoints and their UI
- `js/ChatManager.js` - Handles chat functionality and API communication
- `js/StorageManager.js` - Manages localStorage operations
- `js/MarkdownParser.js` - Handles markdown parsing and rendering
- `js/Utils.js` - Shared utility functions
- `js/MenuManager.js` - Manages the menu and documentation
- `index.html` - Main HTML structure
- `styles.css` - CSS styling

## Customization

### Adding a Default Endpoint

You can modify the default endpoint in `js/StorageManager.js`:

```javascript
static getDefaultEndpoint() {
    return {
        id: 'default',
        name: 'Your API',
        url: 'https://your-api-url.com/chat',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        isDefault: true,
        isStreaming: false
    };
}
```

### Styling

The application uses CSS variables for theming. You can modify the colors and styles in `styles.css`.

## Troubleshooting

If you encounter issues:

- Check that your API endpoint URL is correct
- Verify your API key and headers
- Ensure your API service is running and accessible
- Check browser console for any errors
- Verify that your API response format is compatible

## Browser Compatibility

Stable Chat UI works with all modern browsers that support ES6 modules, including:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
