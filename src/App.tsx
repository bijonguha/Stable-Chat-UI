import { EndpointProvider } from './context/EndpointContext';
import { AppLayout } from './components/layout/AppLayout';
import { ChatWindow } from './components/chat/ChatWindow';

function App() {
  return (
    <EndpointProvider>
      <AppLayout>
        <ChatWindow />
      </AppLayout>
    </EndpointProvider>
  );
}

export default App;
