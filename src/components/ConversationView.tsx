import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Settings, Sun, Moon } from 'lucide-react';
import { ConversationOrb } from './ConversationOrb';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'advisor';
  content: string;
  timestamp: number;
}

const advisorTypeNames = {
  mentor: 'Your Mentor',
  workhorse: 'Your Workhorse',
  hybrid: 'Your Hybrid Advisor',
};

const getFirstMessage = (advisorType: string, personalityPreset: string): string => {
  const messages: Record<string, Record<string, string>> = {
    mentor: {
      buffett: "Good to meet you. I'm here to walk you through every step of finding and acquiring the right business. There are no rushed decisions in this process — just careful thinking and honest assessment. What's on your mind?",
      jobs: "I'm here to help you find something insanely great. We're not looking for mediocre businesses — we're looking for excellence. What matters to you in an acquisition?",
      oprah: "Welcome! I'm so glad we're doing this together. Finding the right business is a journey, and I'm here to support you every step of the way. What brings you here today?",
      musk: "Ready to find something revolutionary. The best acquisitions aren't just good deals — they're game-changers. What are you looking for?",
      custom: "I'm here to guide you through your acquisition journey with patience and clarity. Let's take this one step at a time. What would you like to explore?",
    },
    workhorse: {
      buffett: "Let's cut to what matters: value. I'll help you find businesses with real fundamentals and avoid the noise. What sector are you targeting?",
      jobs: "Let's get to work. I'll cut through the noise and surface what actually matters. No fluff, just insight. What's your target?",
      oprah: "I'm here to help you move quickly while staying thoughtful. We can be efficient and intentional at the same time. What's your first question?",
      musk: "Time to move fast. I'll give you direct analysis without wasting time. The data will guide us. What are you evaluating?",
      custom: "I'm here to help you work efficiently. Direct insights, no unnecessary delays. What do you need to know?",
    },
    hybrid: {
      buffett: "I'll adapt to what you need — detailed guidance when it helps, quick insights when you're ready. Think of me as your flexible partner. Where should we start?",
      jobs: "I'll read the situation and give you what you need — depth when it matters, speed when it doesn't. Let's figure out what you're looking for.",
      oprah: "I'm here to meet you where you are. Sometimes you'll need support, sometimes you'll need efficiency. I'll adjust. How can I help today?",
      musk: "I adjust based on what you need. Complex decisions get depth, clear ones get speed. Let's see what you're working on.",
      custom: "I'll adapt my approach based on what you need. Let's start with your current focus and go from there.",
    },
  };

  return messages[advisorType]?.[personalityPreset] || messages[advisorType]?.custom || "I'm here to help you with your acquisition journey. What would you like to discuss?";
};

export function ConversationView() {
  const { state } = useAdvisor();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const advisorName = state.advisorType ? advisorTypeNames[state.advisorType] : 'Your Advisor';

  useEffect(() => {
    const firstMessage = getFirstMessage(
      state.advisorType || 'mentor',
      state.personalityPreset || 'custom'
    );

    setIsTyping(true);
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      setMessages([{
        id: '1',
        role: 'advisor',
        content: firstMessage,
        timestamp: Date.now(),
      }]);
    }, 1500);

    return () => clearTimeout(typingTimer);
  }, [state.advisorType, state.personalityPreset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      setIsTyping(true);

      setTimeout(() => {
        const advisorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'advisor',
          content: "I'm a demo advisor, so I can't provide real responses yet. In a production version, this would connect to your AI backend to generate contextual responses based on your configuration.",
          timestamp: Date.now(),
        };

        setIsTyping(false);
        setMessages(prev => [...prev, advisorMessage]);
      }, 1500);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div className="noise-overlay" />

      <header
        className="border-b backdrop-blur-xl z-10"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ConversationOrb size={64} state={isThinking ? 'thinking' : (isTyping ? 'typing' : 'idle')} />
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {advisorName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--accent-color)' }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
            </motion.button>

            <motion.button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'dark' ? (
                <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {message.role === 'advisor' && index === 0 && (
                  <div className="flex-shrink-0 mt-1">
                    <ConversationOrb size={32} state="idle" />
                  </div>
                )}

                {message.role === 'advisor' && index > 0 && <div className="w-8" />}

                <motion.div
                  className="rounded-2xl px-4 py-3 max-w-[85%]"
                  style={{
                    background: message.role === 'user'
                      ? 'var(--accent-color)'
                      : 'var(--card-bg)',
                    color: message.role === 'user' ? '#0a0a0a' : 'var(--text-primary)',
                    border: message.role === 'advisor' ? '1px solid var(--border-color)' : 'none',
                  }}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {(isThinking || isTyping) && (
            <motion.div
              className="flex justify-start gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex-shrink-0 mt-1">
                <ConversationOrb size={32} state={isThinking ? 'thinking' : 'typing'} />
              </div>

              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-1"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--accent-color)' }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className="border-t backdrop-blur-xl"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your advisor anything..."
                className="w-full px-4 py-3 rounded-full text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-color)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(198, 255, 74, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <motion.button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: input.trim() ? 'var(--accent-color)' : 'var(--border-color)',
                color: input.trim() ? '#0a0a0a' : 'var(--text-secondary)',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
              }}
              whileHover={input.trim() ? { scale: 1.05 } : {}}
              whileTap={input.trim() ? { scale: 0.95 } : {}}
            >
              <Send size={18} />
            </motion.button>
          </div>

          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
            This is a demo interface. In production, your advisor would provide real-time responses.
          </p>
        </div>
      </div>
    </div>
  );
}
