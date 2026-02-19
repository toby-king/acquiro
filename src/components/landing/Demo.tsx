import { Section, SectionLabel, SectionTitle, SectionDesc } from '../ui/Section';
import { Reveal } from '../ui/Reveal';
import { cn } from '../../utils/cn';

export function Demo() {
  return (
    <Section id="demo">
      <div className="space-y-12">
        <div className="space-y-4">
          <Reveal delay={0}>
            <SectionLabel>Preview</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>See It In Action</SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <SectionDesc>
              Experience the power of conversational AI with your personalized advisor.
            </SectionDesc>
          </Reveal>
        </div>

        <Reveal delay={300}>
          {/* Mock Chat Window */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-card overflow-hidden max-w-2xl mx-auto">
            {/* Chrome Bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[var(--text-tertiary)]" />
                <div className="w-3 h-3 rounded-full bg-[var(--text-tertiary)]" />
                <div className="w-3 h-3 rounded-full bg-[var(--text-tertiary)]" />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-6 space-y-4 min-h-[400px]">
              {/* AI Message 1 */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-[#8abf30] flex-shrink-0" />
                <div className="flex-1">
                  <div className="bg-[var(--bg-secondary)] border border-accent/20 rounded-card-sm p-4">
                    <p className="text-[var(--text-primary)]">
                      Hi! I've found 3 promising acquisition opportunities matching your criteria. The top match is a SaaS company with $2M ARR and 40% growth. Would you like details?
                    </p>
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 flex justify-end">
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-card-sm p-4 max-w-[80%]">
                    <p className="text-[var(--text-primary)]">
                      Yes, tell me more about the revenue breakdown.
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.08] flex-shrink-0" />
              </div>

              {/* AI Message 2 */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-[#8abf30] flex-shrink-0" />
                <div className="flex-1">
                  <div className="bg-[var(--bg-secondary)] border border-accent/20 rounded-card-sm p-4">
                    <p className="text-[var(--text-primary)]">
                      The revenue is 70% subscription-based ($1.4M), 20% professional services ($400K), and 10% one-time licenses ($200K). The subscription revenue has grown 45% YoY with 92% retention. Strong unit economics with 78% gross margins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
