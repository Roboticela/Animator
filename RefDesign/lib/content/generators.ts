import { pick, shuffle, uniqueId } from './random';
import { WORDS } from './words';

const NOUNS = WORDS.filter((w) => w.length >= 4 && w.length <= 10);
const VERBS = [
  'accept', 'achieve', 'adapt', 'advance', 'analyze', 'answer', 'appear', 'apply', 'argue', 'arrive',
  'ask', 'assist', 'attach', 'attack', 'avoid', 'balance', 'become', 'begin', 'believe', 'build',
  'calculate', 'capture', 'carry', 'cause', 'change', 'choose', 'climb', 'collect', 'combine', 'compare',
  'complete', 'connect', 'consider', 'contain', 'continue', 'control', 'convert', 'create', 'decide', 'define',
  'deliver', 'describe', 'design', 'develop', 'discover', 'discuss', 'display', 'drive', 'earn', 'enable',
  'encourage', 'enjoy', 'enter', 'establish', 'evaluate', 'examine', 'expand', 'explain', 'explore', 'express',
  'extend', 'face', 'follow', 'form', 'gain', 'generate', 'grow', 'handle', 'happen', 'help',
  'identify', 'imagine', 'improve', 'include', 'increase', 'indicate', 'influence', 'introduce', 'invent', 'involve',
  'join', 'keep', 'launch', 'lead', 'learn', 'listen', 'locate', 'maintain', 'manage', 'measure',
  'meet', 'mention', 'move', 'notice', 'obtain', 'offer', 'open', 'operate', 'organize', 'perform',
  'plan', 'play', 'prepare', 'present', 'prevent', 'produce', 'protect', 'provide', 'publish', 'reach',
  'read', 'realize', 'receive', 'recognize', 'record', 'reduce', 'reflect', 'remain', 'remember', 'remove',
  'replace', 'report', 'represent', 'require', 'respond', 'result', 'return', 'reveal', 'search', 'select',
  'serve', 'share', 'show', 'solve', 'speak', 'start', 'stay', 'study', 'suggest', 'support',
  'teach', 'tell', 'think', 'train', 'travel', 'try', 'understand', 'update', 'use', 'visit',
  'watch', 'win', 'work', 'write',
];
const ADJECTIVES = [
  'active', 'actual', 'ancient', 'basic', 'bright', 'brief', 'broad', 'calm', 'careful', 'central',
  'certain', 'clear', 'close', 'common', 'complex', 'constant', 'creative', 'critical', 'current', 'daily',
  'deep', 'direct', 'early', 'effective', 'efficient', 'equal', 'essential', 'exact', 'extra', 'fair',
  'famous', 'fast', 'final', 'fine', 'firm', 'formal', 'free', 'fresh', 'full', 'general',
  'global', 'good', 'great', 'happy', 'hard', 'healthy', 'heavy', 'high', 'honest', 'huge',
  'human', 'ideal', 'important', 'independent', 'initial', 'inner', 'joint', 'key', 'large', 'late',
  'legal', 'light', 'likely', 'local', 'logical', 'long', 'loose', 'loud', 'low', 'main',
  'major', 'modern', 'moral', 'narrow', 'natural', 'near', 'new', 'normal', 'obvious', 'official',
  'open', 'original', 'other', 'outer', 'overall', 'partial', 'perfect', 'plain', 'popular', 'positive',
  'possible', 'powerful', 'practical', 'precise', 'present', 'primary', 'prime', 'prior', 'private', 'proper',
  'public', 'quick', 'quiet', 'random', 'rapid', 'rare', 'ready', 'real', 'recent', 'regular',
  'relative', 'relevant', 'remote', 'rich', 'right', 'rough', 'round', 'safe', 'secure', 'serious',
  'sharp', 'short', 'significant', 'similar', 'simple', 'single', 'slight', 'slow', 'small', 'smooth',
  'social', 'solid', 'special', 'specific', 'stable', 'standard', 'steady', 'still', 'straight', 'strong',
  'sudden', 'suitable', 'super', 'sure', 'sweet', 'tall', 'technical', 'thick', 'thin', 'tight',
  'total', 'tough', 'true', 'typical', 'unique', 'upper', 'useful', 'usual', 'valid', 'vast',
  'virtual', 'visible', 'vital', 'warm', 'weak', 'whole', 'wide', 'wild', 'wise', 'young',
];
const ADVERBS = [
  'always', 'barely', 'clearly', 'closely', 'completely', 'constantly', 'directly', 'easily', 'entirely', 'exactly',
  'finally', 'firmly', 'frequently', 'fully', 'gently', 'hardly', 'highly', 'honestly', 'largely', 'likely',
  'mainly', 'merely', 'mostly', 'nearly', 'never', 'normally', 'often', 'only', 'partly', 'perhaps',
  'probably', 'quickly', 'quietly', 'rarely', 'really', 'recently', 'roughly', 'seriously', 'shortly', 'simply',
  'slowly', 'softly', 'sometimes', 'soon', 'strongly', 'suddenly', 'surely', 'truly', 'usually', 'widely',
];
const TOPICS = [
  'keyboard design', 'typing practice', 'touch typing', 'ergonomic setups', 'mechanical switches',
  'software development', 'daily workflows', 'creative writing', 'online learning', 'remote collaboration',
  'productivity habits', 'memory training', 'hand coordination', 'focus routines', 'language skills',
  'computer literacy', 'digital tools', 'user interfaces', 'accessibility features', 'coding sessions',
  'research notes', 'team communication', 'project planning', 'problem solving', 'technical writing',
];

const SENTENCE_TEMPLATES: Array<() => string> = [
  () => `The ${pick(ADJECTIVES)} ${pick(NOUNS)} ${pick(VERBS)} ${pick(ADVERBS)} across the ${pick(NOUNS)}.`,
  () => `${capitalize(pick(NOUNS))} can ${pick(VERBS)} ${pick(ADVERBS)} when ${pick(NOUNS)} ${pick(VERBS)} with ${pick(ADJECTIVES)} focus.`,
  () => `A ${pick(ADJECTIVES)} ${pick(NOUNS)} helps people ${pick(VERBS)} ${pick(ADVERBS)} during ${pick(TOPICS)}.`,
  () => `When you ${pick(VERBS)} ${pick(ADVERBS)}, the ${pick(NOUNS)} becomes ${pick(ADJECTIVES)} and easier to manage.`,
  () => `${capitalize(pick(TOPICS))} improves if a ${pick(ADJECTIVES)} ${pick(NOUNS)} ${pick(VERBS)} ${pick(ADVERBS)} every day.`,
  () => `Many ${pick(NOUNS)} users ${pick(VERBS)} ${pick(ADVERBS)} to support ${pick(ADJECTIVES)} ${pick(NOUNS)}.`,
  () => `The ${pick(ADJECTIVES)} approach to ${pick(TOPICS)} is to ${pick(VERBS)} ${pick(ADVERBS)} and stay consistent.`,
  () => `${capitalize(pick(NOUNS))} and ${pick(NOUNS)} often ${pick(VERBS)} together in ${pick(ADJECTIVES)} systems.`,
  () => `If a ${pick(NOUNS)} ${pick(VERBS)} ${pick(ADVERBS)}, results in ${pick(TOPICS)} usually improve quickly.`,
  () => `Skilled typists ${pick(VERBS)} ${pick(ADVERBS)} while keeping a ${pick(ADJECTIVES)} ${pick(NOUNS)} posture.`,
  () => `Every ${pick(ADJECTIVES)} ${pick(NOUNS)} should ${pick(VERBS)} ${pick(ADVERBS)} before long ${pick(TOPICS)} sessions.`,
  () => `${capitalize(pick(ADVERBS))}, the ${pick(NOUNS)} will ${pick(VERBS)} better than a ${pick(ADJECTIVES)} alternative.`,
];

const PHRASE_TEMPLATES: Array<() => string> = [
  () => `${pick(WORDS)} ${pick(WORDS)} ${pick(WORDS)}`,
  () => `${pick(VERBS)} the ${pick(NOUNS)}`,
  () => `${pick(ADJECTIVES)} ${pick(NOUNS)} ${pick(VERBS)}`,
  () => `${pick(TOPICS)} with ${pick(NOUNS)}`,
  () => `${pick(WORDS)} and ${pick(WORDS)}`,
  () => `quick ${pick(NOUNS)} ${pick(VERBS)}`,
  () => `${pick(WORDS)} ${pick(VERBS)} ${pick(ADVERBS)}`,
  () => `${pick(ADJECTIVES)} ${pick(WORDS)} ${pick(WORDS)}`,
];

const PARAGRAPH_OPENERS = [
  'In modern computing,',
  'For many learners,',
  'During focused practice,',
  'Across different professions,',
  'When building new habits,',
  'In collaborative environments,',
  'Over repeated sessions,',
  'Within technical teams,',
  'Through steady repetition,',
  'Among experienced users,',
];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSentence(seed: number): string {
  const template = SENTENCE_TEMPLATES[seed % SENTENCE_TEMPLATES.length];
  return template();
}

function buildParagraph(seed: number): string {
  const opener = PARAGRAPH_OPENERS[seed % PARAGRAPH_OPENERS.length];
  const sentences = Array.from({ length: 3 + (seed % 3) }, (_, i) => buildSentence(seed + i * 17));
  return `${opener} ${sentences.join(' ')}`;
}

function buildPhrase(seed: number): string {
  return PHRASE_TEMPLATES[seed % PHRASE_TEMPLATES.length]();
}

/** Procedurally generates unique practice sentences (100k+ combinations). */
export function generateSentences(count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let seed = Math.floor(Math.random() * 100000);

  while (out.length < count) {
    const sentence = buildSentence(seed++);
    const id = uniqueId([sentence]);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(sentence);
    }
  }
  return out;
}

/** Procedurally generates unique typing passages. */
export function generatePassages(count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let seed = Math.floor(Math.random() * 100000);

  while (out.length < count) {
    const passage = buildParagraph(seed++);
    const id = uniqueId([passage]);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(passage);
    }
  }
  return out;
}

/** Short lowercase phrases for backspace drills. */
export function generatePhrases(count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let seed = Math.floor(Math.random() * 100000);

  while (out.length < count) {
    const phrase = buildPhrase(seed++);
    const id = uniqueId([phrase]);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(phrase);
    }
  }
  return out;
}

/** Mixed-case / symbol challenges for shift practice. */
export function generateShiftChallenges(count: number): string[] {
  const symbols = ['!', '@', '#', '$', '%', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', ';', ':', '"', "'", '<', '>', ',', '.', '?', '/'];
  const patterns: Array<() => string> = [
    () => `${capitalize(pick(NOUNS))}${pick(symbols)}`,
    () => `${pick(NOUNS).toUpperCase()}_${pick(NOUNS)}`,
    () => `${pick(NOUNS)}@${pick(NOUNS)}.com`,
    () => `$${10 + (Math.floor(Math.random() * 900))}.${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
    () => `${capitalize(pick(NOUNS))} ${capitalize(pick(NOUNS))}`,
    () => `v${1 + Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
    () => `SELECT * FROM ${pick(NOUNS).toUpperCase()} WHERE id = ${Math.floor(Math.random() * 9999)};`,
    () => `${pick(['https', 'http'])}://${pick(NOUNS)}.${pick(['com', 'org', 'io', 'dev'])}/${pick(NOUNS)}`,
    () => `${pick(NOUNS)}${pick(symbols)}${capitalize(pick(NOUNS))}`,
    () => `TODO: ${capitalize(pick(VERBS))} ${pick(NOUNS)} ${pick(symbols)}`,
    () => `${pick(['Ctrl', 'Alt', 'Shift'])}+${pick(NOUNS).charAt(0).toUpperCase()}`,
    () => `${pick(NOUNS)}-${pick(NOUNS)}-${Math.floor(Math.random() * 9999)}`,
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  let i = 0;
  while (out.length < count) {
    const value = patterns[i % patterns.length]();
    i++;
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

export const SENTENCE_POOL = generateSentences(2500);
export const PASSAGE_POOL = generatePassages(1500);
export const PHRASE_POOL = generatePhrases(2000);
export const SHIFT_POOL = generateShiftChallenges(2000);

export function randomSentence(): string {
  return pick(SENTENCE_POOL);
}

export function randomPassage(): string {
  return pick(PASSAGE_POOL);
}

export function randomPhrase(): string {
  return pick(PHRASE_POOL);
}

export function randomShiftChallenge(): string {
  return pick(SHIFT_POOL);
}

/** Pangrams and classic typing lines mixed with generated content. */
export const CLASSIC_SENTENCES = [
  'The five boxing wizards jump quickly over the lazy brown fox.',
  'Pack my box with five dozen liquor jugs before the show starts.',
  'How vexingly quick daft zebras jump across the wide open plain.',
  'Sphinx of black quartz, judge my vow before the sun goes down.',
  'Waltz, bad nymph, for quick jigs vex every lazy person nearby.',
  'Bright vixens jump; dozy fowl quack when the crazy dogs bark.',
  'Quick wafting zephyrs vex bold Jim as he plays the fine lute.',
  'The job requires extra pluck and zeal from every young quality worker.',
  'Jack quietly moved up front and seized the big ball of wax.',
  'Two driven jocks help fax my big quiz draft to every young club member.',
];

export const TYPING_SENTENCE_POOL = shuffle([...CLASSIC_SENTENCES, ...SENTENCE_POOL]);
