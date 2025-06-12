import React from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import EndpointSection from './components/EndpointSection';
import ChatContainer from './components/ChatContainer';
import ChatToggle from './components/ChatToggle';
import Footer from './components/Footer';
import './App.css';

function App() {
    return (
        <AppProvider>
            <div className="App">
                <div className="main-content">
                    <Header />
                    <EndpointSection />
                </div>
                
                <ChatToggle />
                <ChatContainer />
                <Footer />
            </div>
        </AppProvider>
    );
}

export default App;