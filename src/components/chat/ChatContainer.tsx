import { useState, useEffect, useRef } from 'react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatActionButtons } from './ChatActionButtons';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { SelectionSummary } from '../advisor/SelectionSummary';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Settings } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { isValidEmail } from '../../utils/emailValidation';
import { createLead } from '../../services/leadService';
import { createAgent } from '../../services/agentService';
import { generateChatResponseStream } from '../../services/openaiService'; 

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatContainer() {
  const { config, userName, userEmail, setUserName, setUserEmail, setLeadId } = useAdvisorStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAskingForUserName, setIsAskingForUserName] = useState(false);
  const [isAskingForEmail, setIsAskingForEmail] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only run once on mount
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // Generate initial message based on personality
    const generateIntroMessage = () => {
      const name = config.advisorName || 'your advisor';
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
  }, [config.advisorName, config.personality, config.customStats, userName, userEmail]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingMessageId]);
  
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
          }).then((response) => {
            // Only proceed if lead was created successfully and we have a lead_id
            if (response && response.lead_id) {
              setLeadId(response.lead_id);
              
              // Create agent after lead is created successfully
              if (config.advisorName) {
                createAgent(response.lead_id, config);
              }
            } else {
              console.warn('Lead creation did not return a valid lead_id');
            }
          }).catch((error) => {
            // Handle any unexpected errors (though createLead catches internally)
            console.error('Unexpected error in lead creation flow:', error);
          });
        }
        
        setIsTyping(true);
        
        // Acknowledge the email
        setTimeout(() => {
          setIsTyping(false);
          const messageId = (Date.now() + 1).toString();
          const advisorMessage: Message = {
            id: messageId,
            text: "Perfect! Let's get started.\n\nNow, to give you the best guidance, I'd like to start with a quick discovery conversation — about 10-15 minutes where I learn about your background, goals, and what you're looking for in an acquisition.\n\nThink of it as us getting properly introduced.\n\nHow would you prefer to do this?",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, advisorMessage]);
          setShowActionButtons(true);
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
    
    // Hide action buttons if user sends a message after seeing them
    if (showActionButtons) {
      setShowActionButtons(false);
      // Enable LLM when user sends first message after discovery
      setUseLLM(true);
    }
    
    // Use LLM if enabled, otherwise use hardcoded response
    if (useLLM) {
      // Create placeholder message for streaming
      const messageId = (Date.now() + 1).toString();
      const placeholderMessage: Message = {
        id: messageId,
        text: '',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, placeholderMessage]);
      setStreamingMessageId(messageId);
      setIsTyping(true); // Show typing indicator until first chunk arrives
      
      let isFirstChunk = true;
      
      // Generate streaming response
      generateChatResponseStream(
        [...messages, userMessage],
        config,
        userName,
        (chunk: string) => {
          // Hide typing indicator when first chunk arrives
          if (isFirstChunk) {
            setIsTyping(false);
            isFirstChunk = false;
          }
          
          console.log('Received chunk:', chunk, 'for messageId:', messageId);
          // Update message incrementally as chunks arrive
          setMessages(prev => {
            const updated = prev.map(msg => {
              if (msg.id === messageId) {
                const newText = msg.text + chunk;
                console.log('Updating message', messageId, 'from', msg.text, 'to', newText);
                return { ...msg, text: newText };
              }
              return msg;
            });
            console.log('Updated messages:', updated);
            return updated;
          });
        }
      ).then(() => {
        // Stream completed
        setStreamingMessageId(null);
      }).catch((error) => {
        // Handle error - update message with fallback
        console.error('Streaming error:', error);
        setIsTyping(false); // Hide typing indicator on error
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, text: msg.text || "I apologize, but I'm having trouble responding right now. Could you try again?" }
              : msg
          )
        );
        setStreamingMessageId(null);
      });
    } else {
      // Fallback to hardcoded response if LLM is not enabled
      setIsTyping(true);
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
    }
  };

  const handleCallClick = () => {
    setShowActionButtons(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: "Let's Call!",
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    // TODO: Handle call scheduling logic
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Great! I'll reach out to schedule a call. What time works best for you?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, advisorMessage]);
    }, 750);
  };

  const handleMessageClick = () => {
    setShowActionButtons(false);
    setUseLLM(true); // Enable LLM when user chooses to message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: "Let's Message Here",
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Create placeholder message for streaming
    const messageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: messageId,
      text: '',
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, placeholderMessage]);
    setStreamingMessageId(messageId);
    setIsTyping(true); // Show typing indicator until first chunk arrives
    
    let isFirstChunk = true;
    
    // Generate streaming response
    generateChatResponseStream(
      [...messages, userMessage],
      config,
      userName,
      (chunk: string) => {
        // Hide typing indicator when first chunk arrives
        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }
        
        console.log('Received chunk:', chunk, 'for messageId:', messageId);
        // Update message incrementally as chunks arrive
        setMessages(prev => {
          const updated = prev.map(msg => {
            if (msg.id === messageId) {
              const newText = msg.text + chunk;
              console.log('Updating message', messageId, 'from', msg.text, 'to', newText);
              return { ...msg, text: newText };
            }
            return msg;
          });
          console.log('Updated messages:', updated);
          return updated;
        });
      }
    ).then(() => {
      // Stream completed
      setStreamingMessageId(null);
    }).catch((error) => {
      // Handle error - update message with fallback
      console.error('Streaming error:', error);
      setIsTyping(false); // Hide typing indicator on error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: msg.text || "Perfect! Let's dive in. To start, can you tell me a bit about your background and what brings you to acquisitions?" }
            : msg
        )
      );
      setStreamingMessageId(null);
    });
  };

  const handleRemindClick = () => {
    setShowActionButtons(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: "Remind Me Later",
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "No problem! I'll be here whenever you're ready. Feel free to come back anytime to continue our conversation.",
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
                {config.advisorName || 'Your Advisor'}
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
            {messages.map((message) => {
              // Hide empty streaming messages while typing indicator is showing
              if (!message.isUser && !message.text.trim() && isTyping && streamingMessageId === message.id) {
                return null;
              }
              return (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  showAvatar={!message.isUser && message.id === messages[0]?.id}
                />
              );
            })}
          </AnimatePresence>
          
          {showActionButtons && (
            <ChatActionButtons
              onCall={handleCallClick}
              onMessage={handleMessageClick}
              onRemind={handleRemindClick}
            />
          )}
          
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
