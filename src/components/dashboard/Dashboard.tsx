import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { SelectionSummary } from '../advisor/SelectionSummary';
import { Card } from '../ui/Card';
import { CheckCircle, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { config, userName } = useAdvisorStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AdvisorOrb intensity={100} isActivated size={48} />
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {config.advisorName || 'Your Advisor'}
              </h1>
              <div className="text-xs -mt-1">
                <SelectionSummary showTraits={false} textColor="secondary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Welcome{userName ? `, ${userName}` : ''}!
            </h2>
          </div>
          <p className="text-[var(--text-secondary)]">
            Your subscription is now active. You have full access to all features.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Unlimited Conversations</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Chat with your advisor anytime</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Deal Flow</h3>
                  <p className="text-sm text-[var(--text-secondary)]">50 matches per month</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Priority Support</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Email & chat support</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Get Started</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Start a conversation with {config.advisorName || 'your advisor'} to begin finding your perfect acquisition.
            </p>
            <a
              href="/#chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Start Chatting
            </a>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
