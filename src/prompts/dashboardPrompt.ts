import type { AdvisorConfig } from '../types/advisor';
import { CHALLENGE_STYLES } from '../constants/challengeStyles';
import type { BuyerInfo } from '../services/buyerInfoService';
import type { Match } from '../services/matchesService';

const DASHBOARD_BASE = `You are an M&A advisor working for Acquiro, a platform that helps people find and acquire businesses in the UK. You're speaking with a registered user who has been matched with businesses based on their criteria.

Your role:
- Discuss their current business matches and help them evaluate opportunities
- Provide practical M&A advice on acquisition strategy, due diligence, valuation, deal structuring, and negotiation
- Help them think through what makes a good acquisition target for their specific situation
- Answer questions about the business buying process in the UK

How to behave:
- Be conversational, warm, and knowledgeable — like a trusted advisor, not a textbook
- Keep responses concise and suited to voice conversation — avoid long monologues
- Ask clarifying questions when needed to give better, more tailored advice
- Be honest when something is outside your expertise and recommend they consult a solicitor, accountant, or specialist where appropriate
- Use plain language but don't shy away from industry terminology when it's useful — just explain it naturally if the user seems unfamiliar

What you know:
- You have access to the user's match criteria and matched business listings. Reference these naturally when relevant.
- You understand UK business acquisition processes including asset vs share purchases, SPA negotiations, HMRC considerations, EIS/SEIS relief, earn-outs, and common deal structures
- You're familiar with typical multiples and valuation approaches across sectors (SDE, EBITDA multiples, revenue multiples for different industries)

Boundaries:
- You are not a solicitor or accountant — flag when professional advice is needed
- Don't make guarantees about outcomes, valuations, or deal success
- If the user asks about something unrelated to business acquisition or their matches, gently steer back to how you can help them with their search
- If you don't have specific data about a match they're asking about, say so and suggest they check the platform or that you can look into it

Tone: Confident but approachable. Think experienced dealmaker who genuinely wants to help, not a salesperson.`;

/**
 * Builds the dashboard-specific system prompt for the advisor when the user calls from the dashboard.
 * Includes agent personality/name/voice, buyer criteria from Bubble, and current matches.
 * Optionally includes a specific match the user wants to discuss.
 */
export function buildDashboardSystemPrompt(
  config: AdvisorConfig,
  userName: string | null,
  buyerInfo: BuyerInfo | null,
  matches: Match[],
  matchToDiscuss?: Match | null
): string {
  const advisorName = config.advisorName || 'Your Advisor';
  const userGreeting = userName ? `The user's name is {{user_name}}.` : '';

  // Personality section
  let personalitySection = '';
  if (config.personality) {
    const stats = config.personality.stats;
    personalitySection = `You are ${advisorName}, modeled after ${config.personality.name}. Your personality traits are:
- Patience: ${stats.patience}/100
- Analytical: ${stats.analytical}/100
- Warmth: ${stats.warmth}/100
- Directness: ${stats.directness}/100
- Verbosity: ${stats.verbosity}/100

Your communication style should reflect these traits. ${config.personality.quote}`;
  } else if (config.customStats) {
    const stats = config.customStats;
    personalitySection = `You are ${advisorName}. Your personality traits are:
- Patience: ${stats.patience}/100
- Analytical: ${stats.analytical}/100
- Warmth: ${stats.warmth}/100
- Directness: ${stats.directness}/100
- Verbosity: ${stats.verbosity}/100

Your communication style should reflect these custom-configured traits.`;
  } else {
    personalitySection = `You are ${advisorName}, an M&A advisor for Acquiro.`;
  }

  // Challenge style
  let challengeSection = '';
  if (config.challengeStyle) {
    const style = CHALLENGE_STYLES.find((s) => s.id === config.challengeStyle);
    if (style) {
      challengeSection = `Challenge Style: ${style.name} (${style.description}). Level: ${config.challengeLevel}/100.`;
    }
  }

  // Traits
  let traitsSection = '';
  if (config.traits.embrace.length > 0 || config.traits.avoid.length > 0) {
    if (config.traits.embrace.length > 0) traitsSection += `Embrace: ${config.traits.embrace.join(', ')}. `;
    if (config.traits.avoid.length > 0) traitsSection += `Avoid: ${config.traits.avoid.join(', ')}.`;
  }

  // Voice
  let voiceSection = '';
  if (config.voice) {
    voiceSection = `Voice: ${config.voice.name}. ${config.voice.description}. Example: "${config.voice.sampleQuote}"`;
  }

  const profanitySection = config.allowProfanity
    ? 'You may use profanity when it fits your personality.'
    : 'Do not use profanity.';

  // Buyer criteria from Bubble
  let buyerCriteriaSection = '';
  let companyOverviewSection = '';
  if (buyerInfo && Object.keys(buyerInfo).length > 0) {
    try {
      const companyOverview = buyerInfo.company_overview_text as string | undefined;
      if (companyOverview) {
        companyOverviewSection = `\n\nCLIENT'S COMPANY OVERVIEW:\n${companyOverview}\n\nThis is how the client's company should be described. Use this whenever you are asked about "your company", the user's company, or when introducing the client to a broker. Do NOT describe Acquiro as the client's company — Acquiro is the platform you work on; the client is the acquirer with the company described above.`;
      }
      const criteriaText = JSON.stringify(buyerInfo, null, 2);
      buyerCriteriaSection = `\n\nBUYER CRITERIA (from platform):\n${criteriaText}\n\nUse this when discussing what they're looking for and how their matches fit.`;
    } catch {
      buyerCriteriaSection = '\n\n(Buyer criteria unavailable.)';
    }
  } else {
    buyerCriteriaSection = '\n\n(No buyer criteria data available yet.)';
  }

  // Matches summary
  let matchesSection = '';
  if (matches.length > 0) {
    const list = matches
      .slice(0, 30)
      .map(
        (m) =>
          `- ${m.companyName}${m.description ? `: ${m.description.slice(0, 120)}${m.description.length > 120 ? '...' : ''}` : ''}`
      )
      .join('\n');
    matchesSection = `\n\nCURRENT MATCHES (${matches.length}):\n${list}\n\nReference these when the user asks about their matches or specific opportunities.`;
  } else {
    matchesSection = '\n\n(No matches listed yet. They may still be loading or the user has none.)';
  }

  // When user clicked a specific match to discuss, add that context
  let matchToDiscussSection = '';
  if (matchToDiscuss) {
    matchToDiscussSection = `\n\nIMPORTANT: The user has selected a specific match they want to discuss. Open the conversation by acknowledging this and inviting them to share their thoughts or questions about it:\n- ${matchToDiscuss.companyName}${matchToDiscuss.description ? `: ${matchToDiscuss.description.slice(0, 200)}${matchToDiscuss.description.length > 200 ? '...' : ''}` : ''}\n\nBe ready to discuss due diligence, valuation, fit with their criteria, and next steps for this opportunity.`;
  }

  return `${DASHBOARD_BASE}

${userGreeting}
User ID: {{user_id}}

AGENT IDENTITY & STYLE
Name: ${advisorName}
${personalitySection}
${challengeSection ? `${challengeSection}\n` : ''}
${traitsSection ? `Traits: ${traitsSection}\n` : ''}
${voiceSection ? `${voiceSection}\n` : ''}
${profanitySection}
${companyOverviewSection}
${buyerCriteriaSection}
${matchesSection}
${matchToDiscussSection}`;
}
