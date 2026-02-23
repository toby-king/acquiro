import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { motion } from 'framer-motion';
import { buildDashboardSystemPrompt } from '../../prompts/dashboardPrompt';
import { getBuyerInfo } from '../../services/buyerInfoService';
import { fetchMatches } from '../../services/matchesService';

type CallStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function AdvisorPanel() {
  const { config, userName, userId, leadId } = useAdvisorStore();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPulse, setSpeechPulse] = useState(0);
  const pulseAnimationRef = useRef<number | null>(null);
  const pulseStartTimeRef = useRef<number | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  // Handle unhandled errors from ElevenLabs SDK
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if this is an ElevenLabs SDK error
      if (event.message?.includes('error_type') || event.filename?.includes('elevenlabs')) {
        console.warn('ElevenLabs SDK error caught:', event.message);
        // Prevent the error from crashing the app
        event.preventDefault();
        // Use functional update to avoid dependency on callStatus
        setCallStatus((currentStatus) => {
          if (currentStatus === 'connected' || currentStatus === 'connecting') {
            return 'error';
          }
          return currentStatus;
        });
        setErrorMessage('Connection error occurred. Please try again.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Catch unhandled promise rejections from SDK
      if (event.reason?.message?.includes('error_type') || event.reason?.toString().includes('elevenlabs')) {
        console.warn('ElevenLabs SDK promise rejection caught:', event.reason);
        event.preventDefault();
        setCallStatus((currentStatus) => {
          if (currentStatus === 'connected' || currentStatus === 'connecting') {
            return 'error';
          }
          return currentStatus;
        });
        setErrorMessage('Connection error occurred. Please try again.');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      isConnectingRef.current = false;
      setCallStatus('connected');
      setErrorMessage('');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      isConnectingRef.current = false;
      setCallStatus('idle');
      setIsSpeaking(false);
      setSpeechPulse(0);
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current);
        pulseAnimationRef.current = null;
      }
      pulseStartTimeRef.current = null;
    },
    onError: (error: unknown) => {
      console.error('ElevenLabs error:', error);
      let errorMessage = 'Connection error. Please try again.';

      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
          const msg = (error as { message: string }).message.toLowerCase();
          if (msg.includes('audioworklet') || msg.includes('audio context')) {
            errorMessage = 'Audio initialization failed. Please refresh the page and try again.';
          } else if (msg.includes('websocket') || msg.includes('connection')) {
            errorMessage = 'Connection failed. Please check your internet connection and try again.';
          } else {
            errorMessage = (error as { message: string }).message;
          }
        } else if (typeof (error as Error).toString === 'function') {
          errorMessage = (error as Error).toString();
        }
      }

      setCallStatus('error');
      setErrorMessage(errorMessage);
    },
    onModeChange: (mode) => {
      // Safely handle mode changes with optional chaining
      if (!mode || typeof mode !== 'object') {
        console.warn('Invalid mode change event:', mode);
        return;
      }
      const speaking = mode.mode === 'speaking';
      setIsSpeaking(speaking);
      
      if (speaking) {
        pulseStartTimeRef.current = Date.now();
      } else {
        setSpeechPulse(0);
        if (pulseAnimationRef.current) {
          cancelAnimationFrame(pulseAnimationRef.current);
          pulseAnimationRef.current = null;
        }
        pulseStartTimeRef.current = null;
      }
    },
  });

  // Create speech-pattern pulsing animation when agent is speaking
  useEffect(() => {
    if (!isSpeaking || callStatus !== 'connected') {
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current);
        pulseAnimationRef.current = null;
      }
      return;
    }

    let smoothedPulse = 0;

    const animatePulse = () => {
      if (!pulseStartTimeRef.current) {
        pulseStartTimeRef.current = Date.now();
      }

      const elapsed = Date.now() - pulseStartTimeRef.current;
      
      const syllablesPerSecond = 4;
      const pulseRate = syllablesPerSecond * 1.5;
      
      const t = elapsed / 1000;
      
      const primaryPulse = Math.sin(t * pulseRate * Math.PI * 2) * 0.5;
      const wordPulse = Math.sin(t * (pulseRate / 3) * Math.PI * 2) * 0.2;
      const phrasePulse = Math.sin(t * (pulseRate / 8) * Math.PI * 2) * 0.1;
      
      const combinedPulse = primaryPulse + wordPulse + phrasePulse;
      const normalizedPulse = (combinedPulse + 1) / 2;
      
      const smoothingFactor = 0.08;
      smoothedPulse = smoothedPulse + (normalizedPulse - smoothedPulse) * smoothingFactor;
      
      const gentlePulse = smoothedPulse * 0.75;
      
      setSpeechPulse(gentlePulse);
      pulseAnimationRef.current = requestAnimationFrame(animatePulse);
    };

    animatePulse();

    return () => {
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current);
        pulseAnimationRef.current = null;
      }
    };
  }, [isSpeaking, callStatus]);

  const startCall = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      return;
    }
    
    try {
      isConnectingRef.current = true;
      setCallStatus('connecting');
      setErrorMessage('');

      // Request microphone permission first to ensure user interaction
      // This creates the audio context needed for AudioWorkletNode
      let testStream: MediaStream | null = null;
      try {
        testStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        // Don't stop the stream immediately - let the SDK handle it
        // Stopping too early can cause AudioWorkletNode errors
      } catch (mediaError) {
        if (mediaError instanceof DOMException && mediaError.name === 'NotAllowedError') {
          setCallStatus('error');
          setErrorMessage('Microphone access is required for the call. Please allow microphone access and try again.');
          isConnectingRef.current = false;
          return;
        }
        throw mediaError;
      }

      // Dashboard: custom first message and prompt (buyer criteria + matches)
      const firstMessage = userName
        ? `Hi ${userName}, how can I help?`
        : 'Hi, how can I help?';

      let buyerInfo = null;
      let matches: Awaited<ReturnType<typeof fetchMatches>> = [];
      const userIdentifier = userId || leadId;
      if (userIdentifier) {
        try {
          [buyerInfo, matches] = await Promise.all([
            getBuyerInfo(userIdentifier),
            fetchMatches(userIdentifier).catch(() => []),
          ]);
        } catch (e) {
          console.warn('[AdvisorPanel] Could not load buyer info or matches:', e);
        }
      }

      const systemPrompt = buildDashboardSystemPrompt(config, userName, buyerInfo, matches);

      // Prepare dynamic variables for ElevenLabs
      const dynamicVariables: Record<string, string> = {};
      if (userName) {
        dynamicVariables.name = userName;
        dynamicVariables.user_name = userName;
      }
      if (config.advisorName) {
        dynamicVariables.agent_name = config.advisorName;
      }
      if (userIdentifier) {
        dynamicVariables.user_id = userIdentifier;
      }

      // Small delay to ensure audio context is fully initialized
      // This helps prevent AudioWorkletNode errors
      await new Promise(resolve => setTimeout(resolve, 200));

      const overrides: any = {
        agent: {
          prompt: { prompt: systemPrompt },
          firstMessage,
        },
      };

      // Add TTS voice override if voice is selected
      if (config.voice?.id) {
        overrides.tts = {
          voiceId: config.voice.id,
        };
        console.log('[AdvisorPanel] Setting voice override:', config.voice.id);
      } else {
        console.log('[AdvisorPanel] No voice selected in config');
      }
      
      console.log('[AdvisorPanel] Full overrides object:', JSON.stringify(overrides, null, 2));

      // Start the conversation with dynamic variables and system prompt override
      try {
        const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_0401kfask9wye6dt9cymkzbcxdg3';
        await conversation.startSession({
          agentId,
          connectionType: 'webrtc' as const,
          ...(Object.keys(dynamicVariables).length > 0 && { dynamicVariables }),
          overrides,
        });
        
        // Stop the test stream after session is established
        // Give the SDK time to set up its own audio pipeline
        if (testStream) {
          setTimeout(() => {
            testStream?.getTracks().forEach(track => {
              track.stop();
            });
            testStream = null;
          }, 1000);
        }
      } catch (sessionError: any) {
        // Stop test stream on error
        if (testStream) {
          testStream.getTracks().forEach(track => track.stop());
        }
        
        // Handle SDK-specific errors
        console.error('Session start error:', sessionError);
        let errorMsg = 'Failed to start session. Please try again.';
        
        if (sessionError?.message) {
          const msg = sessionError.message.toLowerCase();
          if (msg.includes('cancelled') || msg.includes('cancel')) {
            errorMsg = 'Connection was cancelled. Please try again.';
          } else if (msg.includes('audioworklet') || msg.includes('audio context')) {
            errorMsg = 'Audio initialization failed. Please refresh the page and try again.';
          } else {
            errorMsg = sessionError.message;
          }
        }
        
        setCallStatus('error');
        setErrorMessage(errorMsg);
      } finally {
        isConnectingRef.current = false;
      }
    } catch (error) {
      isConnectingRef.current = false;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCallStatus('error');
        setErrorMessage('Microphone access is required for the call. Please allow microphone access and try again.');
      } else {
        console.error('Failed to start call:', error);
        const errorMsg = (error as any)?.message || (error as any)?.toString() || 'Failed to connect. Please try again.';
        setCallStatus('error');
        setErrorMessage(errorMsg);
      }
    }
  };

  const endCall = async () => {
    try {
      await conversation.endSession();
      setCallStatus('idle');
      setErrorMessage('');
    } catch (error: any) {
      console.error('Failed to end call:', error);
      // Don't set error status on end call failures - just reset to idle
      setCallStatus('idle');
      setErrorMessage('');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing animations
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current);
        pulseAnimationRef.current = null;
      }
      // End session if still connected
      if (callStatus === 'connected' || callStatus === 'connecting') {
        conversation.endSession().catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, [callStatus, conversation]);

  // Determine orb intensity and activation based on call status
  const orbIntensity = callStatus === 'connected' ? 80 : callStatus === 'connecting' ? 60 : 50;
  const orbIsActivated = callStatus === 'connected';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {/* Advisor Orb */}
      <div className="mb-8">
        <AdvisorOrb
          intensity={orbIntensity}
          isActivated={orbIsActivated}
          size={280}
          allowProfanity={config.allowProfanity}
          paletteIndex={1}
          particleSpeed={callStatus === 'connected' ? 1.2 : 1.0}
          agentVolume={speechPulse}
          isInCall={callStatus === 'connected'}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Call Button */}
      <div className="flex flex-col items-center gap-3">
        {callStatus === 'idle' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={startCall}
            className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-all"
          >
            <Phone className="w-5 h-5" />
            Call Agent
          </motion.button>
        )}

        {callStatus === 'connecting' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            disabled
            className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-gray-700 text-gray-400 font-medium rounded-full cursor-not-allowed"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </motion.button>
        )}

        {callStatus === 'connected' && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={endCall}
              className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-red-600 text-white font-medium rounded-full hover:bg-red-700 transition-all"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </motion.button>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-accent text-sm flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Call in progress
            </motion.p>
          </>
        )}

        {callStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-red-400 text-sm text-center max-w-xs">
              {errorMessage || 'Failed to connect. Please try again.'}
            </p>
            <button
              onClick={startCall}
              className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-all"
            >
              <Phone className="w-5 h-5" />
              Retry Call
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
