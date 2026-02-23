import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatActionButtons } from './ChatActionButtons';
import { CallScreen } from './CallScreen';
import { OrbTransition } from './OrbTransition';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { SelectionSummary } from '../advisor/SelectionSummary';
import { ThemeToggle } from '../layout/ThemeToggle';
import { SubscriptionPage } from '../payment/SubscriptionPage';
import { Settings, Phone } from 'lucide-react';
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
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [conversationStartIndex, setConversationStartIndex] = useState<number | null>(null); // Track where the real conversation starts
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const headerOrbRef = useRef<HTMLDivElement>(null);
  const streamingTextRefs = useRef<Record<string, string>>({});
  
  useEffect(() => {
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

    // Show first message immediately so it's always visible (avoids Strict Mode timer issues)
    const firstMessage: Message = {
      id: '1',
      text: generateIntroMessage(),
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([firstMessage]);

    // Schedule second message - check store at fire time (handles persist rehydration)
    // No cleanup: Strict Mode's unmount/remount clears timers and breaks the flow.
    // setState on unmounted component is a no-op in React 18.
    setTimeout(() => {
      const { userName: currentName, userEmail: currentEmail } = useAdvisorStore.getState();
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (!currentName) {
          setMessages((prev) => [
            ...prev,
            {
              id: '2',
              text: 'Before we begin, what should I call you?',
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setIsAskingForUserName(true);
        } else if (!currentEmail) {
          setMessages((prev) => [
            ...prev,
            {
              id: '2',
              text: "What's your email address? I'd like to be able to reach out if we get disconnected.",
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setIsAskingForEmail(true);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: '2',
              text: `Welcome back${currentName ? `, ${currentName}` : ''}! How can I help you with your acquisition today?`,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setUseLLM(true);
        }
      }, 1000);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; config captured in closure
  }, []);
  
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
      
      // Initialize streaming text ref for this message
      streamingTextRefs.current[messageId] = '';
      
      // Determine which messages to send to the LLM
      // If conversationStartIndex is set, only include messages from that point onwards
      // Otherwise, include all messages (fallback for safety)
      const messagesToSend = conversationStartIndex !== null
        ? [...messages.slice(conversationStartIndex), userMessage]
        : [...messages, userMessage];
      
      // Generate streaming response
      generateChatResponseStream(
        messagesToSend,
        config,
        userName,
        (chunk: string) => {
          // Hide typing indicator when first chunk arrives
          if (isFirstChunk) {
            setIsTyping(false);
            isFirstChunk = false;
          }
          
          // Accumulate text in ref for immediate access
          streamingTextRefs.current[messageId] += chunk;
          
          // Force immediate update using flushSync for smooth streaming
          flushSync(() => {
            setMessages(prev => {
              return prev.map(msg => {
                if (msg.id === messageId) {
                  return { ...msg, text: streamingTextRefs.current[messageId] };
                }
                return msg;
              });
            });
          });
        }
      ).then(() => {
        // Clear ref when streaming completes
        delete streamingTextRefs.current[messageId];
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
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    setShowCallScreen(true);
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
    
    // Mark this as the start of the real conversation
    // The next message count will be where the conversation starts
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // Set conversation start index to the current length (before adding user message)
      // This means we'll only include messages from this point forward
      setConversationStartIndex(prev.length);
      return newMessages;
    });
    
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
    
    // Initialize streaming text ref for this message
    streamingTextRefs.current[messageId] = '';
    
    // Start fresh - don't send any previous messages, just the user's "Let's Message Here"
    // This allows the agent to respond with the opening greeting from the prompt
    const messagesToSend: Message[] = [userMessage];
    
    // Generate streaming response
    generateChatResponseStream(
      messagesToSend,
      config,
      userName,
      (chunk: string) => {
        // Hide typing indicator when first chunk arrives
        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }
        
        // Accumulate text in ref for immediate access
        streamingTextRefs.current[messageId] += chunk;
        
        // Force immediate update using flushSync for smooth streaming
        flushSync(() => {
          setMessages(prev => {
            return prev.map(msg => {
              if (msg.id === messageId) {
                return { ...msg, text: streamingTextRefs.current[messageId] };
              }
              return msg;
            });
          });
        });
      }
    ).then(() => {
      // Clear ref when streaming completes
      delete streamingTextRefs.current[messageId];
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

  

  const handleSelectPlan = (planId: string, billingPeriod: 'monthly' | 'annual') => {
    console.log(`Selected plan: ${planId} with ${billingPeriod} billing`);
    // The SubscriptionPage component handles opening the checkout modal
    // We don't need to do anything here - the modal will open automatically
  };

  const handleTalkToAdvisor = () => {
    setShowSubscriptionPage(false);
    // User can continue chatting
  };

  // Show subscription page if user clicked continue after call
  if (showSubscriptionPage) {
    return (
      <SubscriptionPage
        advisorName={config.advisorName || undefined}
        onSelectPlan={handleSelectPlan}
        onTalkToAdvisor={handleTalkToAdvisor}
        onBack={() => setShowSubscriptionPage(false)}
      />
    );
  }

  // Show transition animation with CallScreen behind it
  if (isTransitioning || showCallScreen) {
    return (
      <>
        {/* Render CallScreen immediately but hide orb during transition */}
        <div style={{ opacity: isTransitioning ? 0 : 1, pointerEvents: isTransitioning ? 'none' : 'auto' }}>
          <CallScreen
            onBack={() => {
              setShowCallScreen(false);
              setIsTransitioning(false);
            }}
            onContinue={() => setShowSubscriptionPage(true)}
          />
        </div>
        
        {/* Transition overlay - only show during transition */}
        {isTransitioning && (
          <>
            {/* Render hidden header for orb position reference */}
            <div className="fixed inset-0 pointer-events-none opacity-0 z-[101]">
              <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 md:px-6 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  <div className="flex items-center gap-3">
                    <div ref={headerOrbRef}>
                      <AdvisorOrb intensity={100} isActivated size={48} />
                    </div>
                  </div>
                </div>
              </header>
            </div>
            
            {/* Transition overlay */}
            <OrbTransition
              headerOrbRef={headerOrbRef}
              onComplete={handleTransitionComplete}
            />
          </>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] overflow-x-hidden">
      {/* Chat Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto min-w-0">
          <div className="flex items-center gap-3">
            <div ref={headerOrbRef}>
              <AdvisorOrb 
                intensity={100} 
                isActivated 
                size={48} 
                allowProfanity={config.allowProfanity}
                paletteIndex={1}
              />
            </div>
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
              onClick={handleCallClick}
              className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200"
              aria-label="Start Call"
            >
              <Phone size={18} />
            </button>
            <button
              className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4 min-w-0 w-full">
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
      
      {/* Input Area - disabled until agent asks for name, then for email, then until user picks Let's call or Let's message */}
      <div className="sticky bottom-0 bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border)] px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto min-w-0">
          <ChatInput
            onSend={handleSend}
            disabled={
              !(isAskingForUserName || isAskingForEmail || useLLM) || showActionButtons
            }
          />
        </div>
      </div>
    </div>
  );
}
