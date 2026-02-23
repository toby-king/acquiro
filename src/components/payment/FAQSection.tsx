import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '../../constants/pricing';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <div className="w-full max-w-2xl mx-auto min-w-0 px-4 sm:px-0">
      <h2 className="text-xl md:text-2xl font-semibold text-white text-center mb-8">
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => (
          <Card 
            key={index} 
            className="overflow-hidden p-0"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full min-h-[44px] flex items-center justify-between p-4 text-left hover:bg-gray-900/50 transition-colors"
            >
              <span className="font-medium text-white pr-4">{item.question}</span>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-gray-400">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}
