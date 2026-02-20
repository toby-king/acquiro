import { useState, useEffect, useRef } from 'react';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ArrowLeft, Phone, PhoneOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { useConversation } from '@elevenlabs/react';
import { buildSystemPrompt } from '../../prompts/advisorPrompt';

interface CallScreenProps {
  onBack: () => void;
  onContinue?: () => void;
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function CallScreen({ onBack, onContinue }: CallScreenProps) {
  const { config, userName, leadId } = useAdvisorStore();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPulse, setSpeechPulse] = useState(0);
  const [wasConnected, setWasConnected] = useState(false); // Track if call was ever connected
  const pulseAnimationRef = useRef<number | null>(null);
  const pulseStartTimeRef = useRef<number | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setCallStatus('connected');
      setWasConnected(true); // Mark that call was connected
      setErrorMessage('');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setCallStatus('idle');
      setIsSpeaking(false);
      setSpeechPulse(0);
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current);
        pulseAnimationRef.current = null;
      }
      pulseStartTimeRef.current = null;
      // Keep wasConnected as true so we show continue button
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setCallStatus('error');
      setErrorMessage('Connection error. Please try again.');
    },
    onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
      const speaking = mode.mode === 'speaking';
      setIsSpeaking(speaking);
      console.log('[CallScreen] Agent speaking:', speaking);
      
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

    let smoothedPulse = 0; // Track smoothed value for very smooth transitions

    const animatePulse = () => {
      if (!pulseStartTimeRef.current) {
        pulseStartTimeRef.current = Date.now();
      }

      const elapsed = Date.now() - pulseStartTimeRef.current;
      
      // Create a gentler speech-like pattern
      const syllablesPerSecond = 4; // Slightly slower
      const pulseRate = syllablesPerSecond * 1.5; // More gentle pulse rate
      
      const t = elapsed / 1000; // Time in seconds
      
      // Primary pulse (syllable rhythm) - gentler
      const primaryPulse = Math.sin(t * pulseRate * Math.PI * 2) * 0.5;
      
      // Secondary pulse (word rhythm - slower)
      const wordPulse = Math.sin(t * (pulseRate / 3) * Math.PI * 2) * 0.2;
      
      // Tertiary pulse (phrase rhythm - even slower)
      const phrasePulse = Math.sin(t * (pulseRate / 8) * Math.PI * 2) * 0.1;
      
      // Combine pulses with lighter weights for smoother effect
      const combinedPulse = primaryPulse + wordPulse + phrasePulse;
      
      // Normalize to 0-1 range (centered around 0.5)
      const normalizedPulse = (combinedPulse + 1) / 2;
      
      // Apply exponential smoothing for very smooth transitions
      const smoothingFactor = 0.08; // Much lower = smoother transitions
      smoothedPulse = smoothedPulse + (normalizedPulse - smoothedPulse) * smoothingFactor;
      
      // Moderate intensity
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
    try {
      setCallStatus('connecting');
      setErrorMessage('');

      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the test stream (ElevenLabs will handle the actual audio)
      stream.getTracks().forEach(track => track.stop());

      // Prepare dynamic variables
      const dynamicVariables: Record<string, string> = {};
      if (userName) {
        dynamicVariables.name = userName;
      }
      if (config.advisorName) {
        dynamicVariables.agent_name = config.advisorName;
      }
      if (leadId) {
        dynamicVariables.user_id = leadId;
      }

      // Build system prompt from advisorPrompt.ts
      const systemPrompt = buildSystemPrompt(config, userName);

      // Build overrides object with camelCase properties for @elevenlabs/react v0.14
      const overrides: any = {
        agent: {
          prompt: {
            prompt: systemPrompt,
          },
          firstMessage: 'Hello',
        },
      };

      // Add TTS voice override if voice is selected
      if (config.voice?.id) {
        overrides.tts = {
          voiceId: config.voice.id,
        };
        console.log('[CallScreen] Setting voice override:', config.voice.id);
      } else {
        console.log('[CallScreen] No voice selected in config');
      }

      console.log('[CallScreen] Full overrides object:', JSON.stringify(overrides, null, 2));

      // Start the conversation with dynamic variables and system prompt override
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_0401kfask9wye6dt9cymkzbcxdg3';
      await conversation.startSession({
        agentId,
        connectionType: 'webrtc' as const,
        ...(Object.keys(dynamicVariables).length > 0 && { dynamicVariables }),
        overrides,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCallStatus('error');
        setErrorMessage('Microphone access is required for the call. Please allow microphone access and try again.');
      } else {
        console.error('Failed to start call:', error);
        setCallStatus('error');
        setErrorMessage('Failed to connect. Please try again.');
      }
    }
  };

  const endCall = async () => {
    try {
      await conversation.endSession();
      setCallStatus('idle');
      setErrorMessage('');
      // wasConnected stays true to show continue button
    } catch (error) {
      console.error('Failed to end call:', error);
      setCallStatus('error');
      setErrorMessage('Failed to end call. Please try again.');
    }
  };

  const handleContinue = () => {
    setWasConnected(false); // Reset for next time
    if (onContinue) {
      onContinue(); // Navigate to subscription page
    } else {
      onBack(); // Fallback to going back to chat
    }
  };

  // Determine orb intensity and activation based on call status
  const orbIntensity = callStatus === 'connected' ? 80 : callStatus === 'connecting' ? 60 : 50;
  const orbIsActivated = callStatus === 'connected';
  const orbParticleSpeed = callStatus === 'connected' ? 1.2 : callStatus === 'connecting' ? 1.0 : 0.8;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Back to Chat</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full flex flex-col items-center gap-12">
          {/* Large Orb */}
          <div className="flex-shrink-0">
            <AdvisorOrb
              intensity={orbIntensity}
              isActivated={orbIsActivated}
              size={400}
              allowProfanity={config.allowProfanity}
              paletteIndex={1}
              particleSpeed={orbParticleSpeed}
              agentVolume={speechPulse}
              isInCall={callStatus === 'connected'}
              isSpeaking={isSpeaking}
            />
          </div>

          {/* Call Button - positioned below the orb */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {callStatus === 'idle' && !wasConnected && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={startCall}
                className="flex items-center gap-2 px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-all"
              >
                <Phone className="w-5 h-5" />
                Start Call
              </motion.button>
            )}

            {callStatus === 'idle' && wasConnected && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleContinue}
                className="flex items-center gap-2 px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}

            {callStatus === 'connecting' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                disabled
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-gray-400 font-medium rounded-full cursor-not-allowed"
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
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-full hover:bg-red-700 transition-all"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </motion.button>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-accent text-sm flex items-center gap-2"
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
                <p className="text-red-400 text-sm text-center max-w-md">
                  {errorMessage || 'Failed to connect. Please try again.'}
                </p>
                <button
                  onClick={startCall}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Retry Call
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
