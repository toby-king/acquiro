import { useState, FormEvent } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 min-w-0">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 min-w-0 px-4 py-3 min-h-[44px] bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <motion.button
        type="submit"
        disabled={!message.trim() || disabled}
        className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
          !message.trim() || disabled
            ? 'bg-accent/50 opacity-50 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-dark cursor-pointer'
        }`}
        whileHover={!message.trim() || disabled ? {} : { scale: 1.02 }}
        whileTap={!message.trim() || disabled ? {} : { scale: 0.98 }}
      >
        <Send 
          size={18} 
          strokeWidth={2.5} 
          className="text-[var(--bg-primary)]" 
        />
      </motion.button>
    </form>
  );
}
