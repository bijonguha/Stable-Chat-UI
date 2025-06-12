# Stable Chat UI - React Version

A modern, universal chat interface for connecting to any AI service via configurable API endpoints. Built with React for better performance, maintainability, and developer experience.

![Stable Chat UI](public/stable-chat.png)

## Features

- **Universal AI Interface**: Connect to any AI chat service with a compatible API
- **DeepChat Development Standards**: Follows DeepChat format for seamless integration
- **Configurable Endpoints**: Add, edit, and manage multiple API endpoints with optional model specification
- **Streaming Support**: Real-time streaming responses for compatible APIs
- **Markdown Rendering**: Rich text formatting in chat messages with code highlighting
- **Conversation Tracking**: Displays conversation IDs with floating chip design
- **New Chat Sessions**: Start fresh conversations with one click
- **Resizable Chat Window**: Drag to resize chat interface with size constraints
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Configurations and conversations saved in browser storage
- **React Architecture**: Component-based architecture for better maintainability

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stable-chat-ui.git
   cd stable-chat-ui
   ```

2. Install dependencies and start the development server:
   ```bash
   # Install dependencies
   npm install
   
   # Start development server
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Serve production build
npm install -g serve
serve -s build
```

### Configuration

To use Stable Chat UI, you need to configure at least one API endpoint:

1. Click the "+ Add Endpoint" button
2. Enter a name for your endpoint (e.g., "GPT-4", "Claude", "Local Server")
3. Enter the URL of the API endpoint
4. Configure headers (typically including your API key)
5. Specify model name (optional, defaults to "custom-notset")
6. Select the HTTP method (usually POST)
7. Toggle streaming if your API supports it
8. Click Save

## API Compatibility

Stable Chat UI follows **DeepChat development standards** and is designed to work with various AI chat APIs. The application expects the following exact format for requests and responses:

### Request Format

```json
{
  "messages": [
    {
      "role": "user",
      "text": "Your message here"
    }
  ],
  "model": "custom-notset",
  "conversation_id": "optional-conversation-id"
}
```

### Response Format

For regular (non-streaming) responses:

```json
{
  "text": "AI response text",
  "conversation_id": "conversation-id"
}
```

For streaming responses, the application supports:
- Server-Sent Events (SSE)
- Line-delimited JSON
- Plain text streaming

### CORS Configuration

For local development with backend APIs, ensure CORS is configured:

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Your UI port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Project Structure

The React project is organized into components and utilities:

```
src/
├── components/           # React components
│   ├── Header.js        # Logo and title section
│   ├── EndpointSection.js # API endpoint management
│   ├── ChatContainer.js # Main chat interface
│   ├── ChatHeader.js    # Chat header with controls
│   ├── ChatMessages.js  # Message list container
│   └── ...              # Other UI components
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.js
│   ├── useChatApi.js
│   └── useResizeHandler.js
├── context/             # React Context for state
│   └── AppContext.js
├── utils/               # Utility functions
│   ├── utils.js
│   └── markdownParser.js
├── App.js              # Main App component
├── App.css             # Component styles
└── index.js            # React entry point
```

## Customization

### Adding a Default Endpoint

You can modify the default endpoint in `src/context/AppContext.js`:

```javascript
const getDefaultEndpoint = () => ({
    id: 'default',
    name: 'Local Server',
    url: 'http://localhost:8000/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    model: 'custom-notset',
    isDefault: true,
    isStreaming: false
});
```

### Styling

The application uses CSS variables for theming. You can modify the colors and styles in `src/App.css`.

## Troubleshooting

If you encounter issues:

- Check that your API endpoint URL is correct
- Verify your API key and headers
- Ensure your API service is running and accessible
- Check browser console for any errors
- Verify that your API follows the exact DeepChat format (role, text, model fields)
- Ensure your API returns `conversation_id` in responses
- For streaming issues, verify your API supports Server-Sent Events

### Common Issues

**CORS Errors**: Configure CORS headers on your backend or serve the UI from the same domain as your API.

**No Response**: Check browser console for errors, verify API response format matches the exact DeepChat structure above.

**Conversation ID Not Showing**: Ensure your API returns `conversation_id` in the response. The ID will appear as a floating purple chip in the top-left corner of the chat.

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
