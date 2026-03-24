/**
 * Discover Bubble.io schema by fetching a sample record from each known type.
 * Run: npx tsx scripts/discover-schema.ts
 */

import 'dotenv/config';

const BUBBLE_BASE = 'https://toby-85612.bubbleapps.io/version-test/api/1.1';
const API_KEY = process.env.BUBBLE_API_KEY;

if (!API_KEY) {
  console.error('BUBBLE_API_KEY not set. Make sure .env is in server/');
  process.exit(1);
}

const TYPES = [
  'user',
  'Leads',
  'Agents',
  'Business',
  'Buyer_Info',
  'matches',
  'UserNotification',
  'LangcliffeOutreach',
];

function classifyValue(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return 'date (ISO string)';
    return `text ("${val.length > 80 ? val.slice(0, 80) + '...' : val}")`;
  }
  if (Array.isArray(val)) return `array[${val.length}] (${val.slice(0, 3).map(v => typeof v).join(', ')})`;
  if (typeof val === 'object') return `object ${JSON.stringify(val).slice(0, 100)}`;
  return typeof val;
}

async function fetchSample(type: string) {
  const url = `${BUBBLE_BASE}/obj/${type}?limit=2`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { error: `${res.status} ${text.slice(0, 200)}` };
  }

  const data = await res.json() as { response: { results: Record<string, unknown>[]; count: number; remaining: number } };
  return {
    total_records: (data.response.count ?? 0) + (data.response.remaining ?? 0),
    sample: data.response.results[0] ?? null,
  };
}

async function main() {
  console.log('Discovering Bubble schema...\n');

  for (const type of TYPES) {
    console.log(`${'═'.repeat(70)}`);
    console.log(`TYPE: /obj/${type}`);
    console.log(`${'═'.repeat(70)}`);

    const result = await fetchSample(type);

    if ('error' in result) {
      console.log(`  ERROR: ${result.error}\n`);
      continue;
    }

    console.log(`  Total records: ${result.total_records}`);

    if (!result.sample) {
      console.log('  No records found.\n');
      continue;
    }

    const fields = Object.keys(result.sample).sort();
    console.log(`  Fields (${fields.length}):\n`);

    for (const field of fields) {
      const val = result.sample[field];
      console.log(`    ${field.padEnd(50)} ${classifyValue(val)}`);
    }

    console.log('');
  }
}

main().catch(console.error);
