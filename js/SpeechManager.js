/**
 * SpeechManager Module
 * Handles text-to-speech functionality using Web Speech API
 * Designed to integrate with ChatManager for both regular and streaming responses
 */
export class SpeechManager {
    constructor() {
        this.synthesis = null;
        this.currentUtterance = null;
        this.isSupported = false;
        this.isPaused = false;
        this.isSpeaking = false;
        this.selectedVoice = null;
        this.voices = [];
        this.streamingBuffer = '';
        this.streamingTimer = null;
        
        // Speech settings
        this.settings = {
            rate: 1.0,      // Speech rate (0.1 - 10)
            pitch: 1.0,     // Speech pitch (0 - 2)
            volume: 1.0,    // Speech volume (0 - 1)
            language: 'en-US',
            autoPlay: true  // Auto-play assistant responses (enabled by default)
        };
        
        // Event callbacks
        this.onStart = null;
        this.onEnd = null;
        this.onPause = null;
        this.onResume = null;
        this.onError = null;
        
        this.initSpeechSynthesis();
    }

    initSpeechSynthesis() {
        // Check for browser support
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
            this.isSupported = true;
            console.log('🔊 Speech synthesis supported - SpeechManager initialized');
            
            // Load voices when they're ready
            this.loadVoices();
            
            // Some browsers need this event to load voices
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        } else {
            console.error('❌ Speech synthesis not supported in this browser');
            this.isSupported = false;
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log(`🗣️ Loaded ${this.voices.length} voices`);
        
        // Auto-select best English voice if none selected
        if (!this.selectedVoice && this.voices.length > 0) {
            this.selectBestEnglishVoice();
        }
    }

    selectBestEnglishVoice() {
        // Priority order for voice selection
        const priorities = [
            (voice) => voice.lang === 'en-US' && voice.name.includes('Neural'),
            (voice) => voice.lang === 'en-US' && voice.name.includes('Enhanced'),
            (voice) => voice.lang === 'en-US' && voice.default,
            (voice) => voice.lang.startsWith('en-') && voice.default,
            (voice) => voice.lang === 'en-US',
            (voice) => voice.lang.startsWith('en-')
        ];

        for (const priority of priorities) {
            const voice = this.voices.find(priority);
            if (voice) {
                this.selectedVoice = voice;
                console.log('🎯 Selected voice:', voice.name, voice.lang);
                break;
            }
        }
    }

    speak(text, options = {}) {
        console.log('🎤 SpeechManager.speak called:', { text: text.substring(0, 50) + '...', isSupported: this.isSupported, options });
        
        if (!this.isSupported || !text || text.trim() === '') {
            console.warn('❌ Speech not supported or no text provided');
            return false;
        }

        // Stop any current speech
        this.stop();

        // Clean text for better speech
        const cleanText = this.cleanTextForSpeech(text);
        
        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
        
        // Apply settings
        this.currentUtterance.rate = options.rate || this.settings.rate;
        this.currentUtterance.pitch = options.pitch || this.settings.pitch;
        this.currentUtterance.volume = options.volume || this.settings.volume;
        this.currentUtterance.lang = options.language || this.settings.language;
        
        // Set voice
        if (this.selectedVoice) {
            this.currentUtterance.voice = this.selectedVoice;
        }

        // Event handlers
        this.currentUtterance.onstart = () => {
            console.log('🔊 Speech started');
            this.isSpeaking = true;
            this.isPaused = false;
            if (this.onStart) this.onStart();
        };

        this.currentUtterance.onend = () => {
            console.log('🔇 Speech ended');
            this.isSpeaking = false;
            this.isPaused = false;
            this.currentUtterance = null;
            
            // Check if there's more text in the streaming buffer to speak
            if (this.streamingBuffer.trim()) {
                console.log('📬 Continuing with buffered streaming content');
                setTimeout(() => {
                    this.speak(this.streamingBuffer);
                    this.streamingBuffer = '';
                }, 100);
            } else {
                if (this.onEnd) this.onEnd();
            }
        };

        this.currentUtterance.onpause = () => {
            console.log('⏸️ Speech paused');
            this.isPaused = true;
            if (this.onPause) this.onPause();
        };

        this.currentUtterance.onresume = () => {
            console.log('▶️ Speech resumed');
            this.isPaused = false;
            if (this.onResume) this.onResume();
        };

        this.currentUtterance.onerror = (event) => {
            console.error('❌ Speech error:', event.error);
            this.isSpeaking = false;
            this.isPaused = false;
            this.currentUtterance = null;
            if (this.onError) this.onError(event.error);
        };

        // Start speaking
        try {
            this.synthesis.speak(this.currentUtterance);
            return true;
        } catch (error) {
            console.error('❌ Failed to start speech:', error);
            if (this.onError) this.onError(error.message);
            return false;
        }
    }

    // For streaming text-to-speech - speaks text as it arrives
    speakStreaming(text) {
        if (!this.isSupported) return false;

        console.log('📺 Streaming text received:', text.substring(0, 30) + '...');

        // Add to streaming buffer
        this.streamingBuffer += text;

        // Clear existing timer
        if (this.streamingTimer) {
            clearTimeout(this.streamingTimer);
        }

        // Check for immediate speaking opportunities
        const sentences = this.extractCompleteSentences(this.streamingBuffer);
        
        if (sentences.length > 0) {
            // We have complete sentences - speak them immediately
            const textToSpeak = sentences.join(' ');
            console.log('🎯 Speaking complete sentences immediately:', textToSpeak.substring(0, 50) + '...');
            
            if (!this.isSpeaking) {
                // Start speaking if not already speaking
                this.speak(textToSpeak);
            } else {
                // Queue the text to be spoken after current speech
                this.queueStreamingText(textToSpeak);
            }
            
            // Remove spoken text from buffer
            this.streamingBuffer = this.streamingBuffer.substring(textToSpeak.length).trim();
        } else {
            // No complete sentences yet - set a shorter timer for responsiveness
            this.streamingTimer = setTimeout(() => {
                if (this.streamingBuffer.trim()) {
                    // Check if we have enough text to speak (at least 10 words or a phrase)
                    const words = this.streamingBuffer.trim().split(/\s+/);
                    
                    if (words.length >= 8 || this.streamingBuffer.includes(',') || this.streamingBuffer.includes(';')) {
                        console.log('🚀 Speaking partial content for responsiveness:', this.streamingBuffer.substring(0, 50) + '...');
                        
                        if (!this.isSpeaking) {
                            this.speak(this.streamingBuffer);
                            this.streamingBuffer = '';
                        }
                    }
                }
            }, 150); // Reduced wait time for better responsiveness
        }

        return true;
    }

    queueStreamingText(text) {
        // Simple queuing - just append to buffer if we're currently speaking
        // This will be spoken when current utterance ends
        this.streamingBuffer = text + ' ' + this.streamingBuffer;
    }

    // Finish streaming and speak any remaining text
    finishStreaming() {
        console.log('🏁 Finishing streaming TTS, buffer:', this.streamingBuffer.substring(0, 50) + '...');
        
        if (this.streamingTimer) {
            clearTimeout(this.streamingTimer);
            this.streamingTimer = null;
        }

        // Speak any remaining text in buffer
        if (this.streamingBuffer.trim()) {
            console.log('📤 Speaking final buffer content');
            if (!this.isSpeaking) {
                this.speak(this.streamingBuffer);
            }
            this.streamingBuffer = '';
        }
    }

    extractCompleteSentences(text) {
        // Split on sentence endings, keep the punctuation
        // Also consider other natural breaking points for streaming
        const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
        
        // If no complete sentences, check for other natural breaks
        if (sentences.length === 0) {
            // Look for phrases ending with comma, colon, or other breaks
            const phrases = text.match(/[^,;:\n]*[,;:\n]+/g) || [];
            if (phrases.length > 0) {
                // Only return phrases if they're substantial (more than 5 words)
                return phrases.filter(p => p.trim().split(/\s+/).length > 5).map(s => s.trim());
            }
        }
        
        return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }

    cleanTextForSpeech(text) {
        return text
            // Remove markdown formatting
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
            .replace(/\*(.*?)\*/g, '$1')      // Italic
            .replace(/`(.*?)`/g, '$1')        // Inline code
            .replace(/```[\s\S]*?```/g, 'code block') // Code blocks
            .replace(/#{1,6}\s*/g, '')        // Headers
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    pause() {
        if (this.isSupported && this.isSpeaking && !this.isPaused) {
            this.synthesis.pause();
            return true;
        }
        return false;
    }

    resume() {
        if (this.isSupported && this.isPaused) {
            this.synthesis.resume();
            return true;
        }
        return false;
    }

    stop() {
        if (this.isSupported) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.isPaused = false;
            this.currentUtterance = null;
            
            // Clear streaming state
            this.streamingBuffer = '';
            if (this.streamingTimer) {
                clearTimeout(this.streamingTimer);
                this.streamingTimer = null;
            }
            return true;
        }
        return false;
    }

    // Toggle speech playback
    toggle() {
        if (this.isSpeaking && !this.isPaused) {
            return this.pause();
        } else if (this.isPaused) {
            return this.resume();
        }
        return false;
    }

    // Voice management
    setVoice(voiceIndex) {
        if (voiceIndex >= 0 && voiceIndex < this.voices.length) {
            this.selectedVoice = this.voices[voiceIndex];
            console.log('🎯 Voice changed to:', this.selectedVoice.name);
            return true;
        }
        return false;
    }

    getVoices() {
        return this.voices.map((voice, index) => ({
            index,
            name: voice.name,
            lang: voice.lang,
            default: voice.default,
            localService: voice.localService
        }));
    }

    // Settings management
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('⚙️ Speech settings updated:', this.settings);
    }

    // Check if text-to-speech is supported
    static isSupported() {
        return 'speechSynthesis' in window;
    }

    // Get available languages from voices
    getAvailableLanguages() {
        const languages = [...new Set(this.voices.map(voice => voice.lang))];
        return languages.sort();
    }

    // Helper method to speak assistant responses automatically
    speakAssistantResponse(text, isStreaming = false) {
        if (!this.settings.autoPlay) return false;

        if (isStreaming) {
            return this.speakStreaming(text);
        } else {
            return this.speak(text);
        }
    }
}

export default SpeechManager;