# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a React + TypeScript application using Vite:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

Access development server at: `http://localhost:5173`

## Tech Stack

- **Vite** - Build tool
- **React 19 + TypeScript** - UI framework
- **assistant-ui** - Chat component primitives (ThreadPrimitive, MessagePrimitive, ComposerPrimitive)
- **Tailwind CSS v4** - Styling (with @theme tokens)
- **lucide-react** - Icons

## Architecture Overview

**Stable Chat UI** is a universal chat interface that connects to configurable API endpoints with streaming support, voice I/O, and a dark glassmorphism design.

### Project Structure

```
src/
  components/
    chat/          # ChatWindow, ChatHeader, ChatToggle, CustomThread,
                   # CustomComposer, CustomAssistantMessage, CustomUserMessage,
                   # VoiceButton, SpeechButton
    endpoints/     # EndpointList, EndpointCard, EndpointModal, EndpointBadges
    layout/        # AppLayout, Header, MenuPanel, MenuButton
  hooks/
    useLocalStorage.ts
    useResponseTimeStats.ts
    useVoiceInput.ts
    useSpeechSynthesis.ts
    useResizeHandle.ts
  context/
    EndpointContext.tsx    # React Context + useReducer for endpoints
  runtime/
    StableChatAdapter.ts  # ChatModelAdapter bridging our API format to assistant-ui
    streamParser.ts       # SSE, line-delimited JSON, plain text parsing
    threadIdExtractor.ts  # Extract thread_id from various payload shapes
    requestBuilder.ts     # Build fetch requests with auth headers
  types/
    endpoint.ts, chat.ts, voice.ts, api.ts
  utils/
    clipboard.ts, formatters.ts, validators.ts
  styles/
    glassmorphism.css     # Custom glassmorphism utility classes
    animations.css        # Float, pulse, fade keyframes
```

### Key Design Patterns

- **assistant-ui Primitives**: Using ThreadPrimitive, MessagePrimitive, ComposerPrimitive for chat UI with full styling control
- **ChatModelAdapter**: `StableChatAdapter` implements assistant-ui's `ChatModelAdapter` interface, bridging our API format
- **Context-Based State**: `EndpointContext` with React Context + useReducer for endpoint management (persisted to localStorage)
- **Chat State**: Managed by assistant-ui's `LocalRuntime` internally
- **Ref-Based Adapter**: Adapter uses refs for mutable state (threadId, endpoint) to avoid recreation
- **Key-Based Reset**: New chat sessions use key-based remounting of `AssistantRuntimeProvider`

### API Integration Format

**Request Format:**
```json
{
  "thread_id": "optional-id",
  "messages": {"role": "user", "text": "message"},
  "stream": true
}
```

**Response Format:**
```json
{
  "text": "AI response",
  "thread_id": "thread-id"
}
```

### Streaming Implementation

Supports multiple streaming formats via `streamParser.ts`:
- Server-Sent Events (SSE) with `data: ` prefix
- Line-delimited JSON
- Plain text streaming

The `StableChatAdapter` yields incremental content updates as an async generator.

### Storage Architecture

Uses browser localStorage with keys:
- `chatEndpoints` - Array of configured API endpoints
- `activeEndpoint` - Currently selected endpoint ID
- `responseTimeStats` - Response time metrics per endpoint

Default endpoint points to `http://localhost:8000` for local development.
