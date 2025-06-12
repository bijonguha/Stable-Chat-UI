import { useApp } from '../context/AppContext';
import { ACTIONS } from '../context/AppContext';

const useChatApi = () => {
    const { state, dispatch, addMessage, getActiveEndpoint } = useApp();

    const makeApiRequest = async (message) => {
        const endpoint = getActiveEndpoint();
        const requestUrl = endpoint?.url || 'http://localhost:8000/chat';
        
        const requestOptions = {
            method: endpoint?.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(endpoint?.headers || {})
            }
        };

        const requestBody = {
            messages: [{ role: "user", text: message }],
            model: endpoint?.model || "custom-notset",
            conversation_id: state.conversationId
        };

        if (requestOptions.method !== 'GET') {
            requestOptions.body = JSON.stringify(requestBody);
        }

        const response = await fetch(requestUrl, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    };

    const sendMessage = async (message) => {
        dispatch({ type: ACTIONS.SET_TYPING, payload: true });

        try {
            const data = await makeApiRequest(message);
            
            // Update conversation ID if provided
            if (!state.conversationId && data.conversation_id) {
                dispatch({ type: ACTIONS.SET_CONVERSATION_ID, payload: data.conversation_id });
            }

            // Add assistant response
            addMessage({
                text: data.text || data.response || data.message || 'No response received',
                role: 'assistant',
                timestamp: data.timestamp || new Date().toISOString()
            });

        } catch (error) {
            throw error;
        } finally {
            dispatch({ type: ACTIONS.SET_TYPING, payload: false });
        }
    };

    const sendStreamingMessage = async (message) => {
        dispatch({ type: ACTIONS.SET_STREAMING, payload: true });

        const endpoint = getActiveEndpoint();
        const requestUrl = endpoint?.url || 'http://localhost:8000/chat/stream';

        const requestOptions = {
            method: endpoint?.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                ...(endpoint?.headers || {})
            },
            body: JSON.stringify({
                messages: [{ role: "user", text: message }],
                model: endpoint?.model || "custom-notset",
                conversation_id: state.conversationId,
                stream: true
            })
        };

        try {
            const response = await fetch(requestUrl, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamingContent = '';

            // Will accumulate streaming content and show final result

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.trim() === '') continue;

                        try {
                            let content = '';
                            
                            // Handle Server-Sent Events format
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') continue;
                                
                                const parsed = JSON.parse(data);
                                content = extractContent(parsed);
                                
                                // Update conversation ID if provided
                                if (parsed.conversation_id && !state.conversationId) {
                                    dispatch({ type: ACTIONS.SET_CONVERSATION_ID, payload: parsed.conversation_id });
                                }
                            }
                            // Handle plain JSON streaming
                            else if (line.trim().startsWith('{')) {
                                const parsed = JSON.parse(line);
                                content = extractContent(parsed);
                            }
                            // Handle plain text streaming
                            else {
                                content = line;
                            }

                            if (content) {
                                streamingContent += content;
                                // For simplicity, we'll just accumulate and show final result
                            }
                        } catch (error) {
                            // If JSON parsing fails, treat as plain text
                            if (line.trim()) {
                                streamingContent += line;
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
                // Add final message with accumulated content
                addMessage({
                    text: streamingContent || 'No response received',
                    role: 'assistant',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            throw error;
        } finally {
            dispatch({ type: ACTIONS.SET_STREAMING, payload: false });
        }
    };

    const extractContent = (data) => {
        if (data.content) return data.content;
        if (data.response) return data.response;
        if (data.text) return data.text;
        if (data.delta && data.delta.content) return data.delta.content;
        if (typeof data === 'string') return data;
        return '';
    };

    return {
        sendMessage,
        sendStreamingMessage
    };
};

export default useChatApi;