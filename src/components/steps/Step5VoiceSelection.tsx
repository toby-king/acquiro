import { motion } from 'framer-motion';
import { Play, User, Users } from 'lucide-react';
import { useAdvisor } from '../../contexts/AdvisorContext';
import { useState, useRef } from 'react';
import { useParticles } from '../../contexts/ParticleContext';

const voices = [
  {
    id: 'british-professional',
    name: 'British Professional',
    gender: 'male',
    description: 'Clear, authoritative, refined',
    sample: "Let's analyze this acquisition opportunity together with precision and care.",
  },
  {
    id: 'american-confident',
    name: 'American Confident',
    gender: 'male',
    description: 'Direct, energetic, assertive',
    sample: "We're going to break down this deal and find every angle that matters.",
  },
  {
    id: 'australian-warm',
    name: 'Australian Warm',
    gender: 'female',
    description: 'Friendly, approachable, optimistic',
    sample: "Right, let's have a good look at what makes this opportunity tick.",
  },
  {
    id: 'irish-friendly',
    name: 'Irish Friendly',
    gender: 'male',
    description: 'Engaging, personable, thoughtful',
    sample: "Now then, let's take our time and really understand what we're looking at here.",
  },
  {
    id: 'canadian-balanced',
    name: 'Canadian Balanced',
    gender: 'female',
    description: 'Measured, diplomatic, clear',
    sample: "We should carefully consider all aspects of this acquisition before proceeding.",
  },
  {
    id: 'american-executive',
    name: 'American Executive',
    gender: 'female',
    description: 'Powerful, decisive, commanding',
    sample: "Here's the bottom line: we need to evaluate this deal with absolute clarity.",
  },
];

function Waveform({ isPlaying, isSelected }: { isPlaying: boolean; isSelected: boolean }) {
  const bars = 20;

  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {[...Array(bars)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{
            background: isSelected ? 'var(--accent-color)' : 'var(--text-tertiary)',
          }}
          animate={isPlaying ? {
            height: [
              Math.random() * 20 + 10,
              Math.random() * 40 + 10,
              Math.random() * 20 + 10,
            ],
          } : {
            height: Math.abs(Math.sin((i / bars) * Math.PI)) * 30 + 10,
          }}
          transition={{
            duration: 0.5,
            repeat: isPlaying ? Infinity : 0,
            ease: 'easeInOut',
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

export function Step5VoiceSelection() {
  const { state, updateVoice } = useAdvisor();
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const { triggerParticle } = useParticles();
  const voiceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handlePlaySample = (voiceId: string) => {
    setPlayingVoice(voiceId);
    setTimeout(() => {
      setPlayingVoice(null);
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <motion.div
          className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Step 5 of 5
        </motion.div>
        <motion.h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Choose Your Advisor's Voice
        </motion.h2>
        <motion.p
          className="text-lg"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Select the voice that resonates with you
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {voices.map((voice, index) => {
          const isSelected = state.voice === voice.id;
          const isPlaying = playingVoice === voice.id;

          return (
            <motion.div
              key={voice.id}
              ref={(el) => (voiceRefs.current[voice.id] = el)}
              className="relative glass-card rounded-2xl p-6 cursor-pointer overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                updateVoice(voice.id);
                const voiceCard = voiceRefs.current[voice.id];
                if (voiceCard) triggerParticle(voiceCard);
              }}
              style={{
                border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--card-border)',
              }}
            >
              {isSelected && (
                <motion.div
                  className="absolute inset-0 accent-glow opacity-10"
                  layoutId="voice-background"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: isSelected ? 'var(--accent-color)' : 'var(--card-bg)',
                      }}
                    >
                      {voice.gender === 'male' ? (
                        <User size={24} style={{ color: isSelected ? '#0a0a0a' : 'var(--text-secondary)' }} />
                      ) : (
                        <Users size={24} style={{ color: isSelected ? '#0a0a0a' : 'var(--text-secondary)' }} />
                      )}
                    </motion.div>

                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {voice.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {voice.description}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: isPlaying ? 'var(--accent-color)' : 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySample(voice.id);
                    }}
                  >
                    <Play
                      size={16}
                      style={{ color: isPlaying ? '#0a0a0a' : 'var(--text-secondary)' }}
                      fill={isPlaying ? '#0a0a0a' : 'none'}
                    />
                  </motion.button>
                </div>

                <Waveform isPlaying={isPlaying} isSelected={isSelected} />

                <p className="text-sm italic mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  "{voice.sample}"
                </p>

                {isSelected && (
                  <motion.div
                    className="mt-4 flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full accent-bg"
                      animate={{
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    />
                    <span className="text-sm font-medium accent-text">Active Voice</span>
                  </motion.div>
                )}
              </div>

              {isPlaying && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 100 + i * 50,
                        height: 100 + i * 50,
                        border: '2px solid var(--accent-color)',
                        top: '50%',
                        left: '50%',
                        x: '-50%',
                        y: '-50%',
                      }}
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        repeatDelay: 0.6,
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {state.voice && (
        <motion.div
          className="glass-card rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Voice selected: <span className="font-bold accent-text">
              {voices.find(v => v.id === state.voice)?.name}
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
