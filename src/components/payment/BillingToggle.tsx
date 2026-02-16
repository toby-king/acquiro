interface BillingToggleProps {
  billingPeriod: 'monthly' | 'annual';
  onChange: (period: 'monthly' | 'annual') => void;
}

export function BillingToggle({ billingPeriod, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span 
        className={`text-sm font-medium transition-colors ${
          billingPeriod === 'monthly' ? 'text-white' : 'text-gray-500'
        }`}
      >
        Monthly
      </span>
      
      {/* Toggle switch */}
      <button
        onClick={() => onChange(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          billingPeriod === 'annual' ? 'bg-accent' : 'bg-gray-700'
        }`}
      >
        <span 
          className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            billingPeriod === 'annual' ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      
      <span 
        className={`text-sm font-medium transition-colors ${
          billingPeriod === 'annual' ? 'text-white' : 'text-gray-500'
        }`}
      >
        Annual
      </span>
      
      {/* Discount badge */}
      <span className="px-2 py-1 text-xs font-semibold bg-accent/20 text-accent rounded-full">
        Save 20%
      </span>
    </div>
  );
}
