import { motion } from 'framer-motion';
import { ThumbsUp, MessageCircle, Scale, Target, Swords } from 'lucide-react';
import { useAdvisor } from '../../contexts/AdvisorContext';

const styles = [
  {
    value: 0,
    label: 'Yes-Person',
    description: 'Validates your every decision',
    icon: ThumbsUp,
    color: '#60a5fa',
  },
  {
    value: 25,
    label: 'Supportive Challenger',
    description: 'Gentle pushback on risky moves',
    icon: MessageCircle,
    color: '#34d399',
  },
  {
    value: 50,
    label: "Devil's Advocate",
    description: 'Regularly stress-tests your thinking',
    icon: Scale,
    color: '#fbbf24',
  },
  {
    value: 75,
    label: 'Tough Love',
    description: 'Expects you to defend every decision',
    icon: Target,
    color: '#fb923c',
  },
  {
    value: 100,
    label: 'Ruthless Critic',
    description: 'Treats every deal like a hostile negotiation',
    icon: Swords,
    color: '#ef4444',
  },
];

export function Step4NegotiationStyle() {
  const { state, updateNegotiationStyle } = useAdvisor();

  const getCurrentStyle = () => {
    const closest = styles.reduce((prev, curr) =>
      Math.abs(curr.value - state.negotiationStyle) < Math.abs(prev.value - state.negotiationStyle)
        ? curr
        : prev
    );
    return closest;
  };

  const currentStyle = getCurrentStyle();
  const intensity = state.negotiationStyle / 100;

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
          Step 4 of 5
        </motion.div>
        <motion.h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Set the Challenge Level
        </motion.h2>
        <motion.p
          className="text-lg"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          How much should your advisor push back?
        </motion.p>
      </div>

      <motion.div
        className="glass-card rounded-2xl p-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: `linear-gradient(135deg, ${currentStyle.color}10 0%, var(--card-bg) 100%)`,
        }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 mx-auto"
            style={{
              background: currentStyle.color,
            }}
            animate={{
              scale: [1, 1.1, 1],
              rotate: intensity * 360,
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
              },
              rotate: {
                duration: 0.5,
              },
            }}
          >
            <currentStyle.icon size={48} color="white" />
          </motion.div>

          <motion.h3
            className="text-2xl font-bold mb-2"
            style={{ color: currentStyle.color }}
            key={currentStyle.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentStyle.label}
          </motion.h3>

          <motion.p
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
            key={currentStyle.description}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {currentStyle.description}
          </motion.p>
        </div>

        <div className="relative px-4">
          <div className="relative h-4 rounded-full" style={{ background: 'var(--border-color)' }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${styles[0].color} 0%, ${styles[2].color} 50%, ${styles[4].color} 100%)`,
              }}
              animate={{
                width: `${state.negotiationStyle}%`,
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />

            {styles.map((style) => (
              <motion.button
                key={style.value}
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 cursor-pointer"
                style={{
                  left: `${style.value}%`,
                  background: 'var(--bg-primary)',
                  borderColor: Math.abs(state.negotiationStyle - style.value) < 15 ? style.color : 'var(--border-color)',
                  transform: `translate(-50%, -50%) scale(${Math.abs(state.negotiationStyle - style.value) < 15 ? 1.2 : 1})`,
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateNegotiationStyle(style.value)}
              >
                {Math.abs(state.negotiationStyle - style.value) < 15 && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: style.color,
                    }}
                    layoutId="slider-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={state.negotiationStyle}
            onChange={(e) => updateNegotiationStyle(parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex justify-between mt-6 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Agreeable</span>
          <span>Balanced</span>
          <span>Critical</span>
        </div>

        <motion.div
          className="mt-8 pt-6"
          style={{ borderTop: '1px solid var(--border-color)' }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            Drag the slider or click the markers to adjust
          </p>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {styles.map((style, index) => {
          const Icon = style.icon;
          const isActive = Math.abs(state.negotiationStyle - style.value) < 15;

          return (
            <motion.button
              key={style.value}
              className="glass-card rounded-full p-4 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateNegotiationStyle(style.value)}
              style={{
                border: isActive ? `2px solid ${style.color}` : '1px solid var(--card-border)',
                background: isActive ? `${style.color}20` : 'var(--card-bg)',
              }}
            >
              <Icon
                size={32}
                className="mx-auto mb-2"
                style={{ color: isActive ? style.color : 'var(--text-secondary)' }}
              />
              <p className="text-xs font-medium text-center" style={{ color: isActive ? style.color : 'var(--text-secondary)' }}>
                {style.label}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
