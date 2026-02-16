import { Check, X } from 'lucide-react';
import { PricingPlan } from '../../constants/pricing';
import { motion } from 'framer-motion';

interface PricingCardProps {
  plan: PricingPlan;
  billingPeriod: 'monthly' | 'annual';
  onSelect: (planId: string) => void;
}

export function PricingCard({ plan, billingPeriod, onSelect }: PricingCardProps) {
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualMonthlyPrice;
  const isHighlighted = plan.highlighted;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col p-6 rounded-2xl border transition-all hover:scale-[1.02] ${
        isHighlighted 
          ? 'border-accent bg-accent/5 scale-105' 
          : 'border-gray-800 bg-gray-900/50'
      }`}
    >
      {/* Popular badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-black text-xs font-bold rounded-full">
          Most Popular
        </div>
      )}
      
      {/* Plan name & description */}
      <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
      <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
      
      {/* Price */}
      <div className="mt-6">
        <span className="text-4xl font-bold text-white">£{price}</span>
        <span className="text-gray-400">/month</span>
        
        {billingPeriod === 'annual' && (
          <div className="mt-1">
            <span className="text-sm text-gray-500 line-through">£{plan.monthlyPrice}/mo</span>
            <span className="ml-2 text-sm text-accent">Billed annually</span>
          </div>
        )}
      </div>
      
      {/* CTA Button */}
      <button
        onClick={() => onSelect(plan.id)}
        className={`mt-6 w-full py-3 rounded-lg font-medium transition-all ${
          isHighlighted
            ? 'bg-accent text-black hover:bg-accent/90'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
      >
        {plan.ctaText}
      </button>
      
      {/* Features list */}
      <ul className="mt-6 space-y-3 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
