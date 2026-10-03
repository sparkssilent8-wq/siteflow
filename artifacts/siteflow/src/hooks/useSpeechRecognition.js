import { useCallback, useEffect, useRef, useState } from 'react';

/** Browser-native speech recognition hook for SiteFlow Time Agent. */
export function useSpeechRecognition({ language = 'en-IN', interimResults = true } = {}) {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognition));
    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError(event.error || 'Speech recognition failed');
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += text + ' ';
        else interimText += text;
      }
      if (finalText) setTranscript((current) => `${current} ${finalText}`.trim());
      setInterimTranscript(interimText.trim());
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language, interimResults]);

  const startListening = useCallback(() => {
    setError(null);
    setInterimTranscript('');
    if (!recognitionRef.current) return false;
    try {
      recognitionRef.current.start();
      return true;
    } catch (err) {
      // SpeechRecognition throws if start() is called twice.
      if (!String(err?.message || '').toLowerCase().includes('already started')) setError(err?.message || 'Unable to start microphone');
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return { transcript, interimTranscript, isListening, isSupported, error, startListening, stopListening, resetTranscript };
}

export default useSpeechRecognition;
