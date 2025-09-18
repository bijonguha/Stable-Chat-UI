/**
 * VoiceManager Module
 * Handles speech-to-text functionality using Web Speech API
 * Designed to integrate seamlessly with existing ChatManager flow
 */
export class VoiceManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.onResult = null;
        this.onError = null;
        this.onStart = null;
        this.onEnd = null;
        
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        // Check for browser support
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.isSupported = true;
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            this.isSupported = true;
        } else {
            console.warn('Speech Recognition not supported in this browser');
            this.isSupported = false;
            return;
        }

        // Configure speech recognition
        this.recognition.continuous = false; // Stop after first complete phrase
        this.recognition.interimResults = true; // Show interim results
        this.recognition.lang = 'en-US'; // Default language
        this.recognition.maxAlternatives = 1;

        // Event handlers
        this.recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.isListening = true;
            if (this.onStart) this.onStart();
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            console.log('🗣️ Speech result:', { final: finalTranscript, interim: interimTranscript });
            
            if (this.onResult) {
                this.onResult({
                    finalTranscript: finalTranscript.trim(),
                    interimTranscript: interimTranscript.trim(),
                    isFinal: finalTranscript.length > 0
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.isListening = false;
            
            if (this.onError) {
                this.onError({
                    error: event.error,
                    message: this.getErrorMessage(event.error)
                });
            }
        };

        this.recognition.onend = () => {
            console.log('🏁 Voice recognition ended');
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        };
    }

    getErrorMessage(errorType) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Audio capture failed. Check microphone permissions.',
            'not-allowed': 'Microphone access denied. Please allow microphone access.',
            'network': 'Network error. Please check your connection.',
            'service-not-allowed': 'Speech service not allowed.',
            'bad-grammar': 'Grammar error in speech recognition.',
            'language-not-supported': 'Language not supported.',
            'aborted': 'Speech recognition was aborted.'
        };
        
        return errorMessages[errorType] || `Speech recognition error: ${errorType}`;
    }

    startListening() {
        if (!this.isSupported) {
            if (this.onError) {
                this.onError({
                    error: 'not-supported',
                    message: 'Speech recognition is not supported in this browser.'
                });
            }
            return false;
        }

        if (this.isListening) {
            console.log('⚠️ Already listening');
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('❌ Failed to start recognition:', error);
            if (this.onError) {
                this.onError({
                    error: 'start-failed',
                    message: 'Failed to start voice recognition.'
                });
            }
            return false;
        }
    }

    stopListening() {
        if (!this.isListening || !this.recognition) {
            return;
        }

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('❌ Failed to stop recognition:', error);
        }
    }

    // Toggle listening state
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    // Set language for recognition
    setLanguage(language) {
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }

    // Check if browser supports speech recognition
    static isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    // Get available languages (this is a simplified list)
    static getSupportedLanguages() {
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish' },
            { code: 'fr-FR', name: 'French' },
            { code: 'de-DE', name: 'German' },
            { code: 'it-IT', name: 'Italian' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'ru-RU', name: 'Russian' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' }
        ];
    }
}

export default VoiceManager;