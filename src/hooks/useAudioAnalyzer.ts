import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioAnalyzer() {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smoothedVolumeRef = useRef(0);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const startAnalyzing = useCallback(() => {
    // Get all audio elements on the page (ElevenLabs creates one for playback)
    const findAndAnalyzeAudio = () => {
      const audioElements = document.querySelectorAll('audio');
      
      for (const audioElement of audioElements) {
        // Skip if already analyzing this element
        if (audioElement.dataset.analyzing === 'true') continue;
        
        try {
          // Create audio context if needed
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          
          const audioContext = audioContextRef.current;
          
          // Resume audio context if suspended (required by some browsers)
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          
          // Create analyzer
          const analyzer = audioContext.createAnalyser();
          analyzer.fftSize = 256;
          analyzer.smoothingTimeConstant = 0.8;
          analyzerRef.current = analyzer;
          
          // Connect audio element to analyzer
          const source = audioContext.createMediaElementSource(audioElement);
          source.connect(analyzer);
          analyzer.connect(audioContext.destination);
          
          sourceRef.current = source;
          audioElement.dataset.analyzing = 'true';
          
          console.log('[useAudioAnalyzer] Audio analyzer connected');
          return true;
        } catch (error) {
          console.error('[useAudioAnalyzer] Failed to connect audio analyzer:', error);
        }
      }
      return false;
    };

    // Poll for audio elements (ElevenLabs may create them dynamically)
    const pollInterval = setInterval(() => {
      if (findAndAnalyzeAudio()) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Start the animation loop to read volume
    const dataArray = new Uint8Array(128);
    
    const updateVolume = () => {
      if (analyzerRef.current) {
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        // Calculate RMS (root mean square) for better volume representation
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        
        // Normalize to 0-1 range
        const normalizedVolume = Math.min(rms / 128, 1);
        
        // Apply smoothing (fast attack, slower decay)
        const attack = 0.8;  // React quickly to louder sounds
        const decay = 0.15;  // Decay slowly for smooth falloff
        
        if (normalizedVolume > smoothedVolumeRef.current) {
          smoothedVolumeRef.current += (normalizedVolume - smoothedVolumeRef.current) * attack;
        } else {
          smoothedVolumeRef.current += (normalizedVolume - smoothedVolumeRef.current) * decay;
        }
        
        setVolume(smoothedVolumeRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
    
    // Cleanup poll interval after 10 seconds if no audio found
    setTimeout(() => clearInterval(pollInterval), 10000);
    
  }, []);

  const stopAnalyzing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    smoothedVolumeRef.current = 0;
    setVolume(0);
    
    // Disconnect source if exists
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      } catch (error) {
        console.error('[useAudioAnalyzer] Error disconnecting source:', error);
      }
    }
    
    // Clean up audio element markers
    document.querySelectorAll('audio[data-analyzing="true"]').forEach(el => {
      el.removeAttribute('data-analyzing');
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalyzing();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [stopAnalyzing]);

  return { volume, startAnalyzing, stopAnalyzing };
}
