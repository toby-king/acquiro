import { useState, useRef, useCallback, useEffect } from 'react';

export function useWaveformAnalyzer() {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectToAudio = useCallback((audioElement: HTMLAudioElement) => {
    // Don't reconnect to the same element
    if (connectedElementRef.current === audioElement) return;
    
    try {
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      
      // Resume if suspended (browsers require user interaction)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Create analyzer for waveform data
      // Smaller fftSize = faster response, more reactive
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 128; // Reduced from 256 to 128 for faster response
      analyzer.smoothingTimeConstant = 0.3; // Lower = more reactive (was default 0.8)
      analyzerRef.current = analyzer;
      
      // Connect audio element → analyzer → speakers
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyzer);
      analyzer.connect(ctx.destination);
      
      sourceRef.current = source;
      connectedElementRef.current = audioElement;
      
      console.log('[useWaveformAnalyzer] Waveform analyzer connected to audio element');
    } catch (error) {
      console.error('[useWaveformAnalyzer] Failed to connect waveform analyzer:', error);
    }
  }, []);

  const startAnalyzing = useCallback(() => {
    const dataArray = new Uint8Array(64); // Reduced buffer size for faster processing
    
    const analyze = () => {
      if (analyzerRef.current) {
        // Get time domain data (waveform), not frequency data
        analyzerRef.current.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for more accurate amplitude representation
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const deviation = dataArray[i] - 128; // Deviation from center
          sumSquares += deviation * deviation;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        
        // Normalize to 0-1 (max RMS deviation is ~128)
        // Apply slight amplification for more visible response
        const normalizedAmplitude = Math.min((rms / 128) * 1.2, 1);
        
        setAmplitude(normalizedAmplitude);
      }
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  }, []);

  const startDetecting = useCallback(() => {
    // Start the animation frame loop
    startAnalyzing();
    
    // Poll for audio elements (ElevenLabs creates them dynamically)
    detectIntervalRef.current = setInterval(() => {
      const audioElements = document.querySelectorAll('audio');
      for (const el of audioElements) {
        const audioEl = el as HTMLAudioElement;
        // Connect to any audio element we haven't connected to yet
        if (connectedElementRef.current !== audioEl) {
          connectToAudio(audioEl);
          break;
        }
      }
    }, 100);
  }, [connectToAudio, startAnalyzing]);

  const stopAnalyzing = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop detection interval
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    
    // Reset amplitude
    setAmplitude(0);
    connectedElementRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalyzing();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopAnalyzing]);

  return { amplitude, startDetecting, stopAnalyzing };
}
