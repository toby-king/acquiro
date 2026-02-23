/**
 * Service for fetching matches via the Bubble API
 *
 * API response: { status, response: { matches: "<json string>" } }
 * matches string: comma-separated objects with business_name, description, image
 * Descriptions may contain unescaped newlines - we fix those before parsing.
 */

const API_BASE = import.meta.env.VITE_BUBBLE_API_BASE_URL;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;
const DISPLAY_MATCHES_URL = `${API_BASE}/display_matches`;
const DISMISS_MATCH_URL = `${API_BASE}/dismiss_match`;

if (!API_TOKEN || !API_BASE) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

interface BubbleMatchItem {
  match_id?: string;
  business_name?: string;
  description?: string;
  image?: string;
}

export interface Match {
  id: string;
  matchId: string | null;
  companyName: string;
  description: string;
  status: 'new' | 'pending' | null;
  thumbnail: string | null;
}

/**
 * Fixes unescaped newlines in JSON string values so JSON.parse can handle them.
 */
function fixUnescapedNewlines(str: string): string {
  return str
    .replace(/\r\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\n')
    .replace(/\u2029/g, '\\n');
}

/**
 * Bubble API truncates descriptions with " ... , "image":" which breaks JSON
 * (missing closing quote before comma). Fix by adding the closing quote.
 */
function fixTruncatedDescription(str: string): string {
  return str.replace(/(\.{2,})\s*,\s*"image":/g, '$1", "image":');
}

/**
 * Splits by object boundary and parses each part.
 * Delimiter variations: "}, {" (with/without newline between objects)
 */
function splitAndParse(str: string): BubbleMatchItem[] {
  const delimiters = ['"}, {"', '"},\n{"', '"},\r\n{"', '"},{"'];
  for (const delim of delimiters) {
    if (!str.includes(delim)) continue;
    const parts = str.split(delim);
    if (parts.length < 2) continue;
    const results: BubbleMatchItem[] = [];
    for (let i = 0; i < parts.length; i++) {
      let chunk = parts[i].trim();
      if (!chunk) continue;
      if (i === 0) chunk += '}';
      else chunk = '{' + chunk;
      if (!chunk.endsWith('}')) chunk += '}';
      try {
        const obj = JSON.parse(chunk) as BubbleMatchItem;
        if (obj && typeof obj === 'object' && (obj.business_name || obj.description)) {
          results.push(obj);
        }
      } catch {
        // skip
      }
    }
    if (results.length > 0) return results;
  }
  return [];
}

/**
 * Extract objects by finding each {"match_id": or {"business_name": and the matching closing }
 */
function extractByPattern(str: string): BubbleMatchItem[] {
  const results: BubbleMatchItem[] = [];
  const pattern = /\{\s*"(?:match_id|business_name)"\s*:\s*"/g;
  let match;
  while ((match = pattern.exec(str)) !== null) {
    const start = match.index;
    const after = str.slice(start);
    const delim = after.indexOf('"}, {"');
    const chunk = delim === -1
      ? after
      : after.slice(0, delim + 2); // include "} to close object
    try {
      const obj = JSON.parse(chunk) as BubbleMatchItem;
      if (obj && typeof obj === 'object') results.push(obj);
    } catch {
      // skip
    }
  }
  return results;
}

/**
 * Parses the matches JSON string from the Bubble API.
 * Format: {"business_name":"...","description":"...","image":"..."}, {"business_name":"...", ...}
 * Descriptions may contain unescaped newlines - we fix those first so JSON.parse works.
 */
function parseMatchesString(str: string): BubbleMatchItem[] {
  const fixed = fixTruncatedDescription(fixUnescapedNewlines(str));

  // 1. Try JSON.parse with array brackets (comma-separated objects)
  try {
    const parsed = JSON.parse(`[${fixed.trim()}]`);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // continue
  }

  // 2. Split by object boundary and parse each chunk
  let result = splitAndParse(fixed);
  if (result.length > 0) return result;

  // 3. Extract by pattern (find each {"business_name":)
  result = extractByPattern(fixed);
  if (result.length > 0) return result;

  return [];
}

export async function fetchMatches(userId: string): Promise<Match[]> {
  if (!userId) throw new Error('User ID is required');

  const response = await fetch(DISPLAY_MATCHES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  let matchesStr = data?.response?.matches ?? data?.matches ?? data?.response;

  // Handle double-encoded: sometimes matches is JSON string of the actual string
  if (typeof matchesStr === 'string' && matchesStr.startsWith('"')) {
    try {
      const decoded = JSON.parse(matchesStr);
      if (typeof decoded === 'string') matchesStr = decoded;
    } catch {
      // not double-encoded
    }
  }

  if (typeof matchesStr !== 'string') {
    return [];
  }

  const raw = parseMatchesString(matchesStr);

  return raw.map((item, index) => {
    const imageRaw = item.image?.trim();
    const firstImageUrl = imageRaw?.split(',')[0]?.trim();
    const thumbnail =
      firstImageUrl && firstImageUrl.startsWith('http') ? firstImageUrl : null;
    const matchId = item.match_id?.trim() || null;

    return {
      id: matchId ?? `match-${index}`,
      matchId,
      companyName: item.business_name ?? 'Unknown Business',
      description: item.description ?? '',
      status: null,
      thumbnail,
    };
  });
}

/**
 * Dismiss a match via the Bubble API.
 * @param matchId - The match_id from the API response
 * @throws Error if the API request fails
 */
export async function dismissMatch(matchId: string): Promise<void> {
  if (!matchId) throw new Error('Match ID is required to dismiss');
  if (!API_TOKEN || !API_BASE) throw new Error('API not configured');

  const response = await fetch(DISMISS_MATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ match_id: matchId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to dismiss match: ${response.status} ${errorText}`);
  }
}
