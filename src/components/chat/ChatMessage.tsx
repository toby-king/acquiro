import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  showAvatar?: boolean;
  isTyping?: boolean;
}

export function ChatMessage({ message, isUser, showAvatar = false, isTyping = false }: ChatMessageProps) {
  if (isTyping) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex gap-1 px-4 py-3 bg-[var(--bg-card)] rounded-2xl rounded-tl-sm">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      
      <div
        className={`px-4 py-3 rounded-2xl max-w-[70%] ${
          isUser
            ? 'bg-accent text-[var(--bg-primary)] rounded-tr-sm'
            : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-tl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
      </div>
    </motion.div>
  );
}
