import { ShieldCheck, Lock, RefreshCcw, CheckCircle } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: CheckCircle, text: 'Instant access', subtext: 'Start using immediately' },
  { icon: ShieldCheck, text: 'Money-back guarantee', subtext: '30 days, no questions asked' },
  { icon: Lock, text: 'Secure payments', subtext: 'Powered by Stripe' },
  { icon: RefreshCcw, text: 'Cancel anytime', subtext: 'No long-term contracts' },
];

export function GuaranteeSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {TRUST_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.text} className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              <Icon className="w-6 h-6 text-accent" />
            </div>
            <span className="font-medium text-white">{item.text}</span>
            <span className="text-sm text-gray-500">{item.subtext}</span>
          </div>
        );
      })}
    </div>
  );
}
