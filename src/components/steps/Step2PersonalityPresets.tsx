import { motion } from 'framer-motion';
import { Sliders } from 'lucide-react';
import { useAdvisor, PersonalityPreset, PersonalityStats } from '../../contexts/AdvisorContext';
import { useState, useRef } from 'react';
import { useParticles } from '../../contexts/ParticleContext';

const presets = [
  {
    id: 'buffett' as PersonalityPreset,
    name: 'Warren Buffett',
    quote: '"Price is what you pay. Value is what you get. Let\'s find the real value together."',
    stats: { patience: 95, analytical: 90, warmth: 70, directness: 60, verbosity: 40 },
  },
  {
    id: 'jobs' as PersonalityPreset,
    name: 'Steve Jobs',
    quote: '"We\'re here to make a dent in the universe. This acquisition better be insanely great."',
    stats: { patience: 30, analytical: 85, warmth: 40, directness: 95, verbosity: 60 },
  },
  {
    id: 'oprah' as PersonalityPreset,
    name: 'Oprah Winfrey',
    quote: '"What I know for sure is that the right decision will feel right. Let\'s explore this together."',
    stats: { patience: 90, analytical: 70, warmth: 95, directness: 50, verbosity: 80 },
  },
  {
    id: 'musk' as PersonalityPreset,
    name: 'Elon Musk',
    quote: '"The data says this is either revolutionary or insane. Probably both. Let\'s crunch the numbers."',
    stats: { patience: 20, analytical: 95, warmth: 30, directness: 90, verbosity: 50 },
  },
];

function RadarChart({ stats, size = 120, isHovered = false }: { stats: PersonalityStats; size?: number; isHovered?: boolean }) {
  const center = size / 2;
  const radius = size / 2 - 20;
  const dimensions = ['patience', 'analytical', 'warmth', 'directness', 'verbosity'] as const;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const distance = radius + 15;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };

  const points = dimensions.map((dim, i) => getPoint(i, stats[dim]));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="overflow-visible">
      {[20, 40, 60, 80, 100].map((level) => {
        const levelPoints = dimensions.map((_, i) => getPoint(i, level));
        const levelPath = levelPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return (
          <path
            key={level}
            d={levelPath}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
            opacity="0.3"
          />
        );
      })}

      {dimensions.map((_, i) => {
        const endPoint = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="var(--border-color)"
            strokeWidth="1"
            opacity="0.3"
          />
        );
      })}

      <motion.path
        d={pathData}
        fill="var(--accent-color)"
        fillOpacity="0.2"
        stroke="var(--accent-color)"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isHovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {isHovered && dimensions.map((dim, i) => {
        const point = getPoint(i, stats[dim]);
        return (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="var(--accent-color)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        );
      })}
    </svg>
  );
}

export function Step2PersonalityPresets() {
  const { state, updatePersonalityPreset, toggleProfanity } = useAdvisor();
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const { triggerParticle } = useParticles();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
          Step 2 of 5
        </motion.div>
        <motion.h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Choose a Personality
        </motion.h2>
        <motion.p
          className="text-lg"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Select a preset or customize your own
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {presets.map((preset, index) => {
          const isSelected = state.personalityPreset === preset.id;
          const isHovered = hoveredPreset === preset.id;

          return (
            <motion.div
              key={preset.id}
              ref={(el) => (cardRefs.current[preset.id] = el)}
              className="relative glass-card rounded-2xl p-6 cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updatePersonalityPreset(preset.id);
                const card = cardRefs.current[preset.id];
                if (card) triggerParticle(card);
              }}
              onMouseEnter={() => setHoveredPreset(preset.id)}
              onMouseLeave={() => setHoveredPreset(null)}
              style={{
                border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--card-border)',
              }}
            >
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl accent-glow"
                  layoutId="personality-background"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0">
                  <RadarChart stats={preset.stats} size={120} isHovered={isHovered || isSelected} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {preset.name}
                  </h3>

                  <div className="space-y-1 mb-3">
                    {Object.entries(preset.stats).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="w-20 capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {key}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border-color)' }}>
                          <motion.div
                            className="h-full rounded-full accent-bg"
                            initial={{ width: 0 }}
                            animate={{ width: isHovered || isSelected ? `${value}%` : '0%' }}
                            transition={{ delay: 0.1 }}
                          />
                        </div>
                        <span className="w-8 text-right" style={{ color: 'var(--text-tertiary)' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {preset.quote}
                  </p>

                  {isSelected && (
                    <motion.div
                      className="mt-3 flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full accent-bg"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-sm font-medium accent-text">Active</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          ref={(el) => (cardRefs.current['custom'] = el)}
          className="glass-card rounded-2xl p-6 cursor-pointer flex items-center justify-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: presets.length * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            updatePersonalityPreset('custom');
            const card = cardRefs.current['custom'];
            if (card) triggerParticle(card);
          }}
          style={{
            border: state.personalityPreset === 'custom' ? '2px solid var(--accent-color)' : '1px solid var(--card-border)',
          }}
        >
          <div className="text-center">
            <Sliders size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-color)' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Custom
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Fine-tune every aspect
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="glass-card rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Allow colorful language
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {state.profanityEnabled ? 'Locker room vibes' : 'Boardroom-ready'}
            </p>
          </div>

          <motion.button
            onClick={toggleProfanity}
            className="relative w-16 h-8 rounded-full cursor-pointer"
            style={{
              background: state.profanityEnabled ? 'var(--accent-color)' : 'var(--border-color)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg"
              animate={{
                x: state.profanityEnabled ? 32 : 0,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
