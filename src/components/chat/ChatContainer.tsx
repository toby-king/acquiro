import { useState, useEffect, useRef } from 'react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { SelectionSummary } from '../advisor/SelectionSummary';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Settings } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { isValidEmail } from '../../utils/emailValidation';
import { createLead } from '../../services/leadService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatContainer() {
  const { config, advisorName, userName, userEmail, setUserName, setUserEmail } = useAdvisorStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAskingForUserName, setIsAskingForUserName] = useState(false);
  const [isAskingForEmail, setIsAskingForEmail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only run once on mount
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // Generate initial message based on personality
    const generateIntroMessage = () => {
      const name = advisorName || 'your advisor';
      if (config.personality) {
        return `Hello, I'm ${name}. ${config.personality.quote} Time to find you the perfect acquisition.`;
      } else if (config.customStats) {
        return `Hello, I'm ${name}. I'm your custom-configured advisor, ready to help you navigate this acquisition. Time to find you the perfect acquisition.`;
      }
      return `Hello, I'm ${name}. I'm ready to help you navigate this acquisition. Time to find you the perfect acquisition.`;
    };
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const firstMessage: Message = {
        id: '1',
        text: generateIntroMessage(),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([firstMessage]);
      
      // Send second message asking for user's name (only if not already set)
      if (!userName) {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
              id: '2',
              text: "Before we begin, what should I call you?",
              isUser: false,
              timestamp: new Date(),
            }]);
            setIsAskingForUserName(true);
          }, 1000);
        }, 500);
      } else if (!userEmail) {
        // If name exists but email doesn't, ask for email
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
              id: '2',
              text: "What's your email address? I'd like to be able to reach out if we get disconnected.",
              isUser: false,
              timestamp: new Date(),
            }]);
            setIsAskingForEmail(true);
          }, 1000);
        }, 500);
      }
    }, 1000);
  }, [advisorName, config.personality, config.customStats, userName, userEmail]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  const handleSend = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // If we're asking for the user's name, save it
    if (isAskingForUserName && text.trim()) {
      setUserName(text.trim());
      setIsAskingForUserName(false);
      setIsTyping(true);
      
      // Acknowledge the name
      setTimeout(() => {
        setIsTyping(false);
        const advisorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Great to meet you, ${text.trim()}!`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, advisorMessage]);
        
        // Ask for email after name acknowledgment (only if not already set)
        if (!userEmail) {
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              setMessages(prev => [...prev, {
                id: (Date.now() + 2).toString(),
                text: "What's your email address? I'd like to be able to reach out if we get disconnected.",
                isUser: false,
                timestamp: new Date(),
              }]);
              setIsAskingForEmail(true);
            }, 1000);
          }, 500);
        } else {
          // If email already exists, proceed to normal chat
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              setMessages(prev => [...prev, {
                id: (Date.now() + 3).toString(),
                text: "Now, how can I help you with your acquisition today?",
                isUser: false,
                timestamp: new Date(),
              }]);
            }, 750);
          }, 250);
        }
      }, 750);
      return;
    }
    
    // If we're asking for the user's email, validate and save it
    if (isAskingForEmail && text.trim()) {
      const email = text.trim();
      
      if (isValidEmail(email)) {
        setUserEmail(email);
        setIsAskingForEmail(false);
        
        // Send lead to API if we have both name and email
        if (userName) {
          createLead({
            name: userName,
            email: email,
          });
        }
        
        setIsTyping(true);
        
        // Acknowledge the email
        setTimeout(() => {
          setIsTyping(false);
          const advisorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "Perfect! Now, how can I help you with your acquisition today?",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, advisorMessage]);
        }, 750);
      } else {
        // Invalid email, ask to try again
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const advisorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "That doesn't look like a valid email address. Could you try again?",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, advisorMessage]);
        }, 750);
      }
      return;
    }
    
    setIsTyping(true);
    
    // Simulate advisor response
    setTimeout(() => {
      setIsTyping(false);
      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand. Let me help you analyze this further. What specific aspect would you like to explore?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, advisorMessage]);
    }, 750);
  };
  
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      {/* Chat Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <AdvisorOrb intensity={100} isActivated size={48} />
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {advisorName || 'Your Advisor'}
              </h2>
              <div className="text-xs -mt-1">
                <SelectionSummary showTraits={false} textColor="secondary"/>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                showAvatar={!message.isUser && message.id === messages[0]?.id}
              />
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <ChatMessage
              message=""
              isUser={false}
              isTyping={true}
              showAvatar={messages.length === 0}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="sticky bottom-0 bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
