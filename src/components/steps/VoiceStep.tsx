import { useState, useRef } from 'react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { VOICE_OPTIONS } from '../../constants/voices';
import { Card } from '../ui/Card';
import { Play, Pause, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerChildren, slideUp } from '../../utils/animations';
import { useAbsorption } from '../../hooks/useAbsorption';

export function VoiceStep() {
  const { config, setVoice } = useAdvisorStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { triggerAbsorption } = useAbsorption();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const handleSelect = (voiceId: string) => {
    const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
    if (voice) {
      setVoice(voice);
      const element = cardRefs.current[voiceId];
      if (element) {
        triggerAbsorption(element, `voice-${voiceId}`);
      }
    }
  };
  
  const handlePlay = (voiceId: string) => {
    if (playingId === voiceId) {
      setPlayingId(null);
    } else {
      setPlayingId(voiceId);
      // In production, this would play audio preview
      setTimeout(() => setPlayingId(null), 3000);
    }
  };
  
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className='text-center'>
        <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">
          Choose Your Voice
        </h2>
        <p className="text-[var(--text-secondary)]">
          Select the voice that best represents your advisor's communication style.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VOICE_OPTIONS.map((voice) => {
          const isSelected = config.voice?.id === voice.id;
          const isPlaying = playingId === voice.id;
          
          return (
            <motion.div key={voice.id} variants={slideUp}>
              <div
                ref={(el) => { cardRefs.current[voice.id] = el; }}
                data-card-id={`voice-${voice.id}`}
                className="relative"
              >
                <Card
                  selected={isSelected}
                  interactive
                  onClick={() => handleSelect(voice.id)}
                  className="relative"
                >
                <div className="space-y-4">
                  {/* Top row: Avatar, Name/Description, Play button */}
                  <div className="flex items-center gap-4">
                    {/* Avatar placeholder */}
                    <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center flex-shrink-0">
                      <User size={24} className="text-white" />
                    </div>
                    
                    {/* Name and Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                        {voice.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {voice.description}
                      </p>
                    </div>
                    
                    {/* Play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(voice.id);
                      }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 flex-shrink-0 ${
                        isPlaying
                          ? 'bg-accent'
                          : 'border-2 border-white/30 hover:border-white/50'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause size={16} className="text-[var(--bg-primary)]" />
                      ) : (
                        <Play size={16} className="text-white" fill="white" />
                      )}
                    </button>
                  </div>
                  
                  {/* Waveform visualization */}
                  <div className="relative flex items-center justify-center h-12">
                    {/* Expanding accent rings when playing */}
                    {isPlaying && (
                      <>
                        {[0, 1, 2].map((ringIndex) => (
                          <motion.div
                            key={`ring-${ringIndex}`}
                            className="absolute rounded-full border border-accent"
                            style={{
                              width: '100px',
                              height: '100px',
                              left: '50%',
                              top: '50%',
                            }}
                            initial={false}
                            animate={{
                              scale: [0.3, 2.5, 4.0],
                              opacity: [0.8, 0.2, 0],
                              x: '-50%',
                              y: '-50%',
                            }}
                            transition={{
                              duration: 2.0,
                              repeat: Infinity,
                              repeatType: 'loop',
                              delay: ringIndex * 0.6,
                              ease: [0.25, 0.1, 0.25, 1], // Smooth cubic bezier
                            }}
                          />
                        ))}
                      </>
                    )}
                    
                    {/* Waveform bars */}
                    <div className="relative flex items-center gap-1 h-8 z-10">
                      {voice.waveformData?.map((height, i) => {
                        // Default waveform pattern - show actual waveform scaled down
                        const defaultHeight = height * 0.6; // Show waveform pattern even when not playing
                        return (
                          <motion.div
                            key={i}
                            className="bg-[var(--text-secondary)] rounded-full"
                            style={{ width: '3px' }}
                            animate={{
                              height: isPlaying ? `${height * 100}%` : `${defaultHeight * 100}%`,
                            }}
                            transition={{
                              duration: 0.3,
                              delay: i * 0.05,
                              repeat: isPlaying ? Infinity : 0,
                              repeatType: 'reverse',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Sample quote */}
                  <div className="pt-3 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-secondary)] italic">
                      "{voice.sampleQuote}"
                    </p>
                  </div>
                </div>
              </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
