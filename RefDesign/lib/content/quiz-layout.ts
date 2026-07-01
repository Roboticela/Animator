import type { McqQuestion } from './types';
import { shuffle, uniqueId } from './random';

const BASE: McqQuestion[] = [
  { q: 'Which keyboard layout places vowels on the left hand home row?', options: ['QWERTY', 'AZERTY', 'DVORAK', 'COLEMAK'], answer: 2, explanation: 'DVORAK places vowels A, O, E, U, I on the left home row to reduce finger movement.' },
  { q: 'AZERTY is primarily used in which country?', options: ['Germany', 'Spain', 'France', 'Italy'], answer: 2, explanation: 'AZERTY is the standard French keyboard layout.' },
  { q: 'QWERTZ is the standard layout for which country?', options: ['Spain', 'Germany', 'Netherlands', 'Poland'], answer: 1, explanation: 'QWERTZ is used in German-speaking countries with Y and Z swapped.' },
  { q: 'Colemak was introduced in which year?', options: ['1998', '2003', '2006', '2010'], answer: 2, explanation: 'Colemak was introduced in 2006 as a modern QWERTY alternative.' },
  { q: 'Which layout is used for typing Russian?', options: ['AZERTY', 'JCUKEN', 'QWERTY', 'DVORAK'], answer: 1, explanation: 'JCUKEN (ЙЦУКЕН) is the standard Russian Cyrillic layout.' },
  { q: 'What distinguishes Programmer Dvorak?', options: ['Extra function keys', 'Numbers require Shift, symbols are direct', 'No number row', 'Symbols on left side only'], answer: 1, explanation: 'Programmer Dvorak swaps numbers and symbols for coding.' },
  { q: 'QWERTY was originally designed to solve what problem?', options: ['Increase typing speed', 'Prevent typewriter key jams', 'Reduce finger fatigue', 'Fit more keys'], answer: 1, explanation: 'QWERTY separated common letter pairs to reduce mechanical jams.' },
  { q: 'Which layout is often considered optimal for programming?', options: ['QWERTY', 'AZERTY', 'DVORAK', 'Programmer Dvorak / Colemak'], answer: 3, explanation: 'Programmer Dvorak and Colemak are popular among programmers.' },
  { q: 'How many unique key positions does QWERTY share with Colemak?', options: ['12', '17', '20', '26'], answer: 1, explanation: 'Colemak keeps 17 keys in the same position as QWERTY.' },
  { q: 'Which is NOT a real keyboard layout?', options: ['BÉPO', 'MALTRON', 'WORKMAN', 'HEXTYPE'], answer: 3, explanation: 'BÉPO, MALTRON, and WORKMAN are real layouts. HEXTYPE is not.' },
];

const LAYOUTS = ['QWERTY', 'AZERTY', 'QWERTZ', 'DVORAK', 'COLEMAK', 'WORKMAN', 'BÉPO', 'JCUKEN', 'MALTRON', 'HANGUL'];
const COUNTRIES: Array<{ country: string; layout: string }> = [
  { country: 'France', layout: 'AZERTY' },
  { country: 'Belgium', layout: 'AZERTY' },
  { country: 'Germany', layout: 'QWERTZ' },
  { country: 'Austria', layout: 'QWERTZ' },
  { country: 'Russia', layout: 'JCUKEN' },
  { country: 'United States', layout: 'QWERTY' },
  { country: 'United Kingdom', layout: 'QWERTY' },
  { country: 'Canada', layout: 'QWERTY' },
  { country: 'South Korea', layout: 'HANGUL' },
  { country: 'Spain', layout: 'QWERTY' },
];

const YEARS: Record<string, number> = {
  QWERTY: 1874,
  DVORAK: 1932,
  COLEMAK: 2006,
  WORKMAN: 2010,
  BÉPO: 2004,
  AZERTY: 1890,
};

function mcq(q: string, correct: string, pool: string[], explanation: string): McqQuestion {
  const options = shuffle([correct, ...shuffle(pool.filter((x) => x !== correct)).slice(0, 3)]);
  return { q, options, answer: options.indexOf(correct), explanation };
}

function generateCountryQuestions(): McqQuestion[] {
  return COUNTRIES.map(({ country, layout }) =>
    mcq(
      `Which keyboard layout is commonly used in ${country}?`,
      layout,
      LAYOUTS,
      `${layout} is widely associated with ${country}.`,
    ),
  );
}

function generateYearQuestions(): McqQuestion[] {
  return Object.entries(YEARS).map(([layout, year]) => {
    const options = shuffle([String(year), String(year - 8), String(year + 6), String(year + 15)]);
    return {
      q: `In which year was ${layout} introduced (approximately)?`,
      options,
      answer: options.indexOf(String(year)),
      explanation: `${layout} was introduced around ${year}.`,
    };
  });
}

function generateComparisonQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  for (let i = 0; i < LAYOUTS.length; i++) {
    for (let j = i + 1; j < LAYOUTS.length; j++) {
      const a = LAYOUTS[i];
      const b = LAYOUTS[j];
      out.push(
        mcq(
          `Which of these is a real keyboard layout: ${a} or ${b}?`,
          `Both ${a} and ${b} are real layouts`,
          [`Only ${a}`, `Only ${b}`, `Neither is real`],
          `${a} and ${b} are both recognized layout families.`,
        ),
      );
    }
  }
  return out;
}

let cached: McqQuestion[] | null = null;

export function getLayoutQuizQuestions(): McqQuestion[] {
  if (cached) return cached;
  const seen = new Set<string>();
  cached = [...BASE, ...generateCountryQuestions(), ...generateYearQuestions(), ...generateComparisonQuestions()].filter((q) => {
    const id = uniqueId([q.q]);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return cached;
}

export function sampleLayoutQuiz(count = 10): McqQuestion[] {
  return shuffle(getLayoutQuizQuestions()).slice(0, count);
}
