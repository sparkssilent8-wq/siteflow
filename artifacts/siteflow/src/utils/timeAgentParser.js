const START_PATTERNS = [
  /\bstarted?\b/i, /\bbegan\b/i, /\bcommenced\b/i, /\binitiated\b/i,
  /\bwork\s+(has\s+)?started\b/i, /\bkaam\s+(start|shuru)(\s+ho\s+gaya)?\b/i,
];
const END_PATTERNS = [
  /\bcompleted?\b/i, /\bfinished?\b/i, /\bdone\b/i, /\bcomplete\b/i,
  /\binstallation\s+(is\s+)?complete\b/i, /\berection\s+(is\s+)?complete\b/i,
  /\bkaam\s+(complete|khatam)\b/i, /\bkaam\s+khatam\s+ho\s+gaya\b/i,
];
const DISCIPLINES = ['Piping', 'Civil', 'Mechanical', 'Electrical', 'Instrumentation', 'HSE'];
const DISCIPLINE_TERMS = {
  Piping: ['pipe', 'piping', 'spool', 'line', 'weld', 'welding', 'hydrotest', 'erection'],
  Civil: ['civil', 'foundation', 'excavation', 'concrete', 'valve pit', 'earthwork'],
  Mechanical: ['mechanical', 'equipment', 'compressor', 'pump', 'vessel', 'installation'],
  Electrical: ['electrical', 'cable', 'cable tray', '33kv', 'substation', 'termination'],
  Instrumentation: ['instrumentation', 'instrument', 'junction box', 'loop check', 'calibration'],
  HSE: ['hse', 'safety', 'permit', 'toolbox talk', 'ppe'],
};

function firstMatch(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function extractTime(text) {
  const match = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3].toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return { hour, minute, label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

function extractProgress(text) {
  const match = text.match(/\b(?:up\s+to|at|around|approximately|about)?\s*(\d{1,3})\s*%/i);
  if (!match) return null;
  const value = Math.max(0, Math.min(100, Number(match[1])));
  return Number.isFinite(value) ? value : null;
}

function extractLocation(text) {
  const patterns = [
    /\b(?:at|near|in)\s+(.+?)(?=\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b|\s+(?:started|completed|finished|done|today|yesterday)\b|[.!?]|$)/i,
    /\b(?:location|station|site)\s*[:=-]\s*(.+?)(?=[.!?]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ');
  }
  return null;
}

function inferDiscipline(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const discipline of DISCIPLINES) {
    const score = DISCIPLINE_TERMS[discipline].reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
    if (score > bestScore) { best = discipline; bestScore = score; }
  }
  return best;
}

function cleanActivityDescription(text) {
  return text
    .replace(/\b(?:started?|began|commenced|initiated|completed?|finished?|done|complete)\b/gi, '')
    .replace(/\b(?:at|around|approximately|about)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi, '')
    .replace(/\b(?:at|near|in)\s+[^.!?]+$/i, (part) => part.includes('%') ? part : '')
    .replace(/\b(?:kaam|work)\s+(?:start|shuru|complete|khatam)(?:\s+ho\s+gaya)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '');
}

export function parseTimeAgentTranscript(transcript) {
  const text = String(transcript || '').trim();
  if (!text) return { activity_description: '', confidence: 0, event_type: 'PROGRESS' };

  const progress = extractProgress(text);
  const hasStart = firstMatch(START_PATTERNS, text);
  const hasEnd = firstMatch(END_PATTERNS, text);
  const partialCompletion = hasEnd && progress !== null && progress < 100;
  let eventType = 'PROGRESS';
  if (hasStart && !hasEnd) eventType = 'ACTUAL_START';
  else if (hasEnd && !hasStart && !partialCompletion) eventType = 'ACTUAL_END';

  const discipline = inferDiscipline(text);
  const actualTime = extractTime(text);
  const location = extractLocation(text);
  const activityDescription = cleanActivityDescription(text) || text;
  const activityType = eventType === 'ACTUAL_START' ? 'START' : eventType === 'ACTUAL_END' ? 'COMPLETION' : 'PROGRESS_UPDATE';

  let confidence = 0.55;
  if (activityDescription.length >= 12) confidence += 0.12;
  if (discipline) confidence += 0.1;
  if (eventType !== 'PROGRESS') confidence += 0.1;
  if (actualTime) confidence += 0.06;
  if (location) confidence += 0.04;
  if (progress !== null) confidence += 0.06;
  confidence = Math.min(0.97, confidence);

  return {
    activity_description: activityDescription,
    activity_type: activityType,
    discipline,
    event_type: eventType,
    actual_time: actualTime?.label || null,
    location,
    reference: null,
    progress_pct: progress,
    confidence,
  };
}

export default parseTimeAgentTranscript;
