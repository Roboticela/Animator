import type { McqQuestion } from './types';
import { pick, shuffle, uniqueId } from './random';

const BASE_KEYBOARD_QUESTIONS: McqQuestion[] = [
  { q: 'How many keys are on a standard 104-key keyboard?', options: ['101', '102', '104', '106'], answer: 2, explanation: 'The US standard 104-key keyboard has 104 keys including function keys, numpad, and navigation keys.' },
  { q: 'Which keyboard layout is most common in English-speaking countries?', options: ['AZERTY', 'DVORAK', 'QWERTY', 'COLEMAK'], answer: 2, explanation: 'QWERTY has been the dominant layout since its introduction on the Sholes & Glidden typewriter in 1874.' },
  { q: 'What is the "home row" on a QWERTY keyboard?', options: ['QWEASD', 'ASDF JKL;', 'ZXCVBNM', '1234567890'], answer: 1, explanation: 'The home row is ASDF JKL; — the row where fingers rest when touch typing.' },
  { q: 'What does the "Print Screen" key do by default on Windows?', options: ['Print the page', 'Copy screen to clipboard', 'Open print dialog', 'Screenshot to file'], answer: 1, explanation: 'PrtScn copies the entire screen to the clipboard. Win+PrtScn saves to a file.' },
  { q: 'How many function keys (F-keys) are on a standard keyboard?', options: ['10', '12', '14', '16'], answer: 1, explanation: 'Standard keyboards have 12 function keys: F1 through F12.' },
  { q: 'Which key is located between Shift and Z on a QWERTY keyboard?', options: ['Caps Lock', 'Tab', 'Alt', 'There is no key there'], answer: 3, explanation: 'On a standard QWERTY layout there is no key between the left Shift key and Z.' },
  { q: 'What does pressing Ctrl + A typically do?', options: ['Open a file', 'Select all', 'Save as', 'Bold text'], answer: 1, explanation: 'Ctrl+A selects all content in the current context — text, files, or items.' },
  { q: 'The Scroll Lock key originated from which older function?', options: ['Scrolling spreadsheets', 'Locking the keyboard', 'Pausing output', 'Switching between monitors'], answer: 0, explanation: 'Scroll Lock was designed to scroll spreadsheet content using arrow keys without moving the cursor.' },
  { q: 'Which key combination opens Task Manager on Windows?', options: ['Ctrl+Alt+Del', 'Ctrl+Shift+Esc', 'Win+R', 'Ctrl+Alt+Esc'], answer: 1, explanation: 'Ctrl+Shift+Esc opens Task Manager directly.' },
  { q: 'What is "actuation force" in the context of keyboard switches?', options: ['Typing speed', 'Force needed to register a keypress', 'Key travel distance', 'Noise level'], answer: 1, explanation: 'Actuation force is the force required to register a key press.' },
  { q: 'What does Caps Lock do?', options: ['Locks all keys', 'Toggles uppercase letters', 'Disables numbers', 'Opens settings'], answer: 1, explanation: 'Caps Lock toggles uppercase letter input until pressed again.' },
  { q: 'Which connector is most common on modern wired keyboards?', options: ['PS/2', 'USB', 'Serial', 'HDMI'], answer: 1, explanation: 'USB is the standard wired keyboard connector today.' },
  { q: 'What is N-key rollover (NKRO)?', options: ['Number of keys on a keyboard', 'Ability to register many simultaneous key presses', 'Speed of key repeat', 'Layout switching'], answer: 1, explanation: 'NKRO means the keyboard can detect many keys pressed at the same time without ghosting.' },
  { q: 'Which key toggles between overwrite and insert modes in many text editors?', options: ['Insert', 'Home', 'End', 'Pause'], answer: 0, explanation: 'The Insert key toggles insert/overwrite typing behavior in many applications.' },
  { q: 'What is key ghosting?', options: ['Invisible key labels', 'False key registrations when multiple keys are pressed', 'Backlight failure', 'Wireless interference'], answer: 1, explanation: 'Ghosting occurs when a keyboard reports keys that were not actually pressed during multi-key input.' },
  { q: 'Which switch type is generally loudest?', options: ['Membrane', 'Scissor', 'Clicky mechanical', 'Optical linear'], answer: 2, explanation: 'Clicky mechanical switches produce an audible click on actuation.' },
  { q: 'What does the Num Lock key control?', options: ['Number row only', 'Numpad number vs navigation mode', 'Caps behavior', 'Brightness'], answer: 1, explanation: 'Num Lock switches the numpad between numbers and navigation functions on many keyboards.' },
  { q: 'Which row contains the space bar?', options: ['Home row', 'Bottom row', 'Top row', 'Number row'], answer: 1, explanation: 'The space bar sits on the bottom row between the Alt keys on standard layouts.' },
  { q: 'What is a tenkeyless (TKL) keyboard?', options: ['10 total keys', 'No numpad section', 'Only function keys', 'Laptop sized'], answer: 1, explanation: 'TKL keyboards omit the number pad while keeping the main typing area and function row.' },
  { q: 'Which protocol do most wireless keyboards use?', options: ['Bluetooth or 2.4 GHz dongle', 'Infrared only', 'NFC', 'Ethernet'], answer: 0, explanation: 'Consumer wireless keyboards commonly use Bluetooth or a proprietary 2.4 GHz USB receiver.' },
  { q: 'What does the Tab key typically insert?', options: ['A tab character or indentation', 'A new paragraph', 'A bullet point', 'A line break only'], answer: 0, explanation: 'Tab advances focus or inserts a tab stop for indentation.' },
  { q: 'What is a hot-swappable keyboard?', options: ['Wireless only', 'Switches can be replaced without soldering', 'Keys glow when hot', 'Auto-switches layouts'], answer: 1, explanation: 'Hot-swap sockets let you pull and replace mechanical switches without desoldering.' },
  { q: 'What is key chatter?', options: ['Keys talking to each other', 'Repeated unintended key registrations from one press', 'RGB flicker', 'Bluetooth pairing noise'], answer: 1, explanation: 'Chatter is when a single physical press registers as multiple key events.' },
  { q: 'Which stabilizer style is generally preferred in custom boards?', options: ['Plate mount only', 'Screw-in', 'Costar wire only', 'No stabilizers'], answer: 1, explanation: 'Screw-in stabilizers are popular for reduced rattle and secure mounting.' },
  { q: 'What does PBT stand for in keycaps?', options: ['Programmable Button Technology', 'Polybutylene terephthalate plastic', 'Printed Backlit Text', 'Precision Binary Transfer'], answer: 1, explanation: 'PBT is a durable plastic commonly used for high-quality keycaps.' },
  { q: 'ABS keycaps compared to PBT typically…', options: ['Never wear', 'Develop shine faster with use', 'Are always thicker', 'Cannot be laser etched'], answer: 1, explanation: 'ABS keycaps often develop a glossy shine after extended use.' },
  { q: 'What is a ortholinear keyboard?', options: ['Curved ergonomic split', 'Keys arranged in a grid without stagger', 'One-handed only', 'Virtual on-screen'], answer: 1, explanation: 'Ortholinear layouts place keys in straight columns rather than the traditional stagger.' },
  { q: 'Which key is the longest on a standard keyboard?', options: ['Shift', 'Space bar', 'Enter', 'Backspace'], answer: 1, explanation: 'The space bar is the widest key, typically 6.25u on standard layouts.' },
  { q: 'What unit measures key width in mechanical keyboards?', options: ['Millimeters only', 'u (units relative to one alphanumeric key)', 'Pixels', 'Grams'], answer: 1, explanation: 'Key widths use "u" where 1u is the width of one standard letter key.' },
  { q: 'What does Win key + V open on Windows 10/11?', options: ['Volume mixer', 'Clipboard history', 'VPN settings', 'Voice typing'], answer: 1, explanation: 'Win+V opens the clipboard history panel on modern Windows.' },
];

const ROWS = {
  number: { label: 'Number row', keys: '1234567890'.split('') },
  top: { label: 'Top row', keys: 'qwertyuiop'.split('') },
  home: { label: 'Home row', keys: 'asdfghjkl'.split('') },
  bottom: { label: 'Bottom row', keys: 'zxcvbnm'.split('') },
} as const;

const ROW_OPTIONS = ['Number row', 'Top row', 'Home row', 'Bottom row'];

const FULL_ROWS: Record<string, string[]> = {
  number: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  top: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  home: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  bottom: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
};

const FINGER_MAP: Record<string, string> = {
  '`': 'Left pinky', '1': 'Left pinky', 'q': 'Left pinky', 'a': 'Left pinky', 'z': 'Left pinky',
  '2': 'Left ring', 'w': 'Left ring', 's': 'Left ring', 'x': 'Left ring',
  '3': 'Left middle', 'e': 'Left middle', 'd': 'Left middle', 'c': 'Left middle',
  '4': 'Left index', '5': 'Left index', 'r': 'Left index', 't': 'Left index', 'f': 'Left index', 'g': 'Left index', 'v': 'Left index', 'b': 'Left index',
  '6': 'Right index', '7': 'Right index', 'y': 'Right index', 'u': 'Right index', 'h': 'Right index', 'j': 'Right index', 'n': 'Right index', 'm': 'Right index',
  '8': 'Right middle', 'i': 'Right middle', 'k': 'Right middle', ',': 'Right middle',
  '9': 'Right ring', 'o': 'Right ring', 'l': 'Right ring', '.': 'Right ring',
  '0': 'Right pinky', '-': 'Right pinky', '=': 'Right pinky', 'p': 'Right pinky', ';': 'Right pinky', '/': 'Right pinky',
  '[': 'Right pinky', ']': 'Right pinky', '\\': 'Right pinky', "'": 'Right pinky',
};

const SHIFT_NUMBERS: Record<string, string> = {
  '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
  '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?', '`': '~',
};

const MX_SWITCHES = [
  { name: 'Cherry MX Red', feel: 'Linear', force: '45g' },
  { name: 'Cherry MX Black', feel: 'Linear', force: '60g' },
  { name: 'Cherry MX Brown', feel: 'Tactile', force: '45g' },
  { name: 'Cherry MX Blue', feel: 'Clicky', force: '50g' },
  { name: 'Cherry MX Silent Red', feel: 'Linear', force: '45g' },
  { name: 'Cherry MX Speed Silver', feel: 'Linear', force: '45g' },
  { name: 'Cherry MX Green', feel: 'Clicky', force: '80g' },
  { name: 'Cherry MX Clear', feel: 'Tactile', force: '65g' },
  { name: 'Gateron Yellow', feel: 'Linear', force: '50g' },
  { name: 'Gateron Blue', feel: 'Clicky', force: '55g' },
  { name: 'Kailh Box White', feel: 'Clicky', force: '45g' },
  { name: 'Kailh Box Red', feel: 'Linear', force: '45g' },
  { name: 'Holy Panda', feel: 'Tactile', force: '67g' },
  { name: 'Boba U4T', feel: 'Tactile', force: '62g' },
  { name: 'Glorious Panda', feel: 'Tactile', force: '67g' },
];

const POLLING_RATES = ['125 Hz', '250 Hz', '500 Hz', '1000 Hz', '2000 Hz', '4000 Hz', '8000 Hz'];
const KEYCAP_PROFILES = ['OEM', 'Cherry', 'SA', 'DSA', 'XDA', 'MT3', 'KAT', 'DOM'];
const PLATE_MATERIALS = ['Aluminum', 'Brass', 'Polycarbonate', 'FR4', 'Steel', 'Carbon fiber'];
const KEYBOARD_SIZES = ['40%', '60%', '65%', '75%', 'TKL', 'Full-size', '1800-compact', '96%', 'Arisu'];
const CONNECTORS = ['USB-A', 'USB-C', 'Bluetooth', '2.4 GHz dongle', 'PS/2', 'Lightning adapter'];

const SPECIAL_KEYS: Array<{ key: string; action: string }> = [
  { key: 'Backspace', action: 'Delete character to the left' },
  { key: 'Delete', action: 'Delete character to the right' },
  { key: 'Enter', action: 'Confirm input or new line' },
  { key: 'Escape', action: 'Cancel or close context' },
  { key: 'Tab', action: 'Indent or move to next field' },
  { key: 'Home', action: 'Jump to start of line' },
  { key: 'End', action: 'Jump to end of line' },
  { key: 'Page Up', action: 'Scroll one page up' },
  { key: 'Page Down', action: 'Scroll one page down' },
  { key: 'Arrow Up', action: 'Move cursor up' },
  { key: 'Arrow Down', action: 'Move cursor down' },
  { key: 'Arrow Left', action: 'Move cursor left' },
  { key: 'Arrow Right', action: 'Move cursor right' },
];

const FINGERS = [...new Set(Object.values(FINGER_MAP))];

function label(key: string) {
  if (key === '\\') return '\\';
  if (key === ';') return ';';
  if (key === "'") return "'";
  if (key === '`') return '`';
  if (key === ',') return ',';
  if (key === '.') return '.';
  if (key === '/') return '/';
  if (key === '[') return '[';
  if (key === ']') return ']';
  if (key === '-') return '-';
  if (key === '=') return '=';
  return key.toUpperCase();
}

function mcq(q: string, correct: string, pool: string[], explanation: string): McqQuestion {
  const distractors = shuffle(pool.filter((x) => x !== correct)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { q, options, answer: options.indexOf(correct), explanation };
}

function generateRowQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  for (const row of Object.values(ROWS)) {
    for (const key of row.keys) {
      const upper = key.toUpperCase();
      out.push(mcq(`On QWERTY, which row contains "${upper}"?`, row.label, ROW_OPTIONS, `"${upper}" is on the ${row.label.toLowerCase()}.`));
    }
  }
  for (const [rowId, keys] of Object.entries(FULL_ROWS)) {
    const rowLabel = ROWS[rowId as keyof typeof ROWS]?.label ?? rowId;
    for (const key of keys) {
      out.push(mcq(`On QWERTY, which row contains "${label(key)}"?`, rowLabel, ROW_OPTIONS, `"${label(key)}" is on the ${rowLabel.toLowerCase()}.`));
    }
  }
  return out;
}

function generateNeighborQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  for (const keys of Object.values(FULL_ROWS)) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i > 0) {
        out.push(mcq(
          `Which key is immediately to the LEFT of "${label(key)}" on QWERTY?`,
          label(keys[i - 1]),
          shuffle(keys.filter((k) => k !== keys[i - 1])).slice(0, 3).map(label),
          `"${label(keys[i - 1])}" sits directly left of "${label(key)}".`,
        ));
      }
      if (i < keys.length - 1) {
        out.push(mcq(
          `Which key is immediately to the RIGHT of "${label(key)}" on QWERTY?`,
          label(keys[i + 1]),
          shuffle(keys.filter((k) => k !== keys[i + 1])).slice(0, 3).map(label),
          `"${label(keys[i + 1])}" sits directly right of "${label(key)}".`,
        ));
      }
    }
  }
  return out;
}

function generateFingerQuestions(): McqQuestion[] {
  return Object.entries(FINGER_MAP).map(([key, finger]) =>
    mcq(
      `In touch typing, which finger presses "${label(key)}"?`,
      finger,
      FINGERS,
      `The ${finger.toLowerCase()} presses "${label(key)}".`,
    ),
  );
}

function generateShiftSymbolQuestions(): McqQuestion[] {
  return Object.entries(SHIFT_NUMBERS).map(([base, shifted]) =>
    mcq(
      `On US QWERTY, what character does Shift+${label(base)} produce?`,
      shifted,
      shuffle(Object.values(SHIFT_NUMBERS).filter((v) => v !== shifted)).slice(0, 3),
      `Shift+${label(base)} types "${shifted}".`,
    ),
  );
}

function generateOddOneOutQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  const rowIds = Object.keys(FULL_ROWS);

  for (let n = 0; n < 400; n++) {
    const targetRow = pick(rowIds);
    const wrongRow = pick(rowIds.filter((r) => r !== targetRow));
    const targetKeys = FULL_ROWS[targetRow];
    const wrongKeys = FULL_ROWS[wrongRow];
    const intruder = pick(wrongKeys);
    const sameRow = shuffle(targetKeys).slice(0, 3);
    const options = shuffle([intruder, ...sameRow]);
    const targetLabel = ROWS[targetRow as keyof typeof ROWS]?.label ?? targetRow;

    out.push({
      q: `Which key does NOT belong on the ${targetLabel.toLowerCase()}?`,
      options: options.map(label),
      answer: options.indexOf(intruder),
      explanation: `"${label(intruder)}" is not on the ${targetLabel.toLowerCase()}.`,
    });
  }
  return out;
}

function generateSameRowQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  for (let n = 0; n < 300; n++) {
    const rowId = pick(Object.keys(FULL_ROWS));
    const keys = FULL_ROWS[rowId];
    if (keys.length < 4) continue;
    const pair = shuffle(keys).slice(0, 2);
    const wrongKey = pick(FULL_ROWS[pick(Object.keys(FULL_ROWS).filter((r) => r !== rowId))]);
    out.push({
      q: 'Which two keys are on the SAME row? (Pick the pair)',
      options: [
        `${label(pair[0])} and ${label(pair[1])}`,
        `${label(pair[0])} and ${label(wrongKey)}`,
        `${label(pair[1])} and ${label(wrongKey)}`,
        'None of these',
      ],
      answer: 0,
      explanation: `${label(pair[0])} and ${label(pair[1])} share the same row.`,
    });
  }
  return out;
}

function generateSwitchQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  const feels = ['Linear', 'Tactile', 'Clicky', 'Membrane'];
  const forces = [...new Set(MX_SWITCHES.map((s) => s.force))];

  for (const sw of MX_SWITCHES) {
    out.push(mcq(`What type of feel does ${sw.name} have?`, sw.feel, feels, `${sw.name} is a ${sw.feel.toLowerCase()} switch.`));
    out.push(mcq(`What is the rated actuation force of ${sw.name}?`, sw.force, forces, `${sw.name} is rated around ${sw.force}.`));
    out.push(mcq(`Which switch is ${sw.feel.toLowerCase()} with ${sw.force} actuation?`, sw.name, MX_SWITCHES.map((s) => s.name), `${sw.name} matches that description.`));
  }
  return out;
}

function generateNumericQuestions(): McqQuestion[] {
  const layouts = [40, 47, 60, 61, 65, 68, 75, 84, 87, 88, 96, 98, 104, 108, 1800];
  return layouts.map((count) =>
    mcq(
      `How many keys does a ${count}-key keyboard have?`,
      String(count),
      layouts.filter((n) => n !== count).map(String),
      `A ${count}-key board has ${count} keys.`,
    ),
  );
}

function generateHardwareQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  for (const size of KEYBOARD_SIZES) {
    out.push(mcq(`"${size}" is a recognized keyboard…`, 'Size / form factor', ['Switch type', 'Connector', 'Polling rate', 'Keycap profile'], `${size} describes keyboard size.`));
  }
  for (const profile of KEYCAP_PROFILES) {
    out.push(mcq(`"${profile}" is a keycap…`, 'Profile / sculpt', ['Switch stem', 'Plate material', 'Connector', 'Firmware'], `${profile} is a popular keycap profile.`));
  }
  for (const material of PLATE_MATERIALS) {
    out.push(mcq(`A keyboard plate made of ${material} affects…`, 'Typing feel and sound', ['Wireless range', 'NKRO limit', 'OS language', 'Battery life'], `${material} plates change acoustics and stiffness.`));
  }
  for (const rate of POLLING_RATES) {
    const num = rate.replace(' Hz', '');
    const correct = `${num} times per second`;
    const pool = POLLING_RATES.filter((r) => r !== rate).map((r) => `${r.replace(' Hz', '')} times per second`);
    out.push(mcq(`A polling rate of ${rate} means the keyboard reports input…`, correct, pool, `At ${rate}, the device polls every ${num}ms interval.`));
  }
  for (const connector of CONNECTORS) {
    out.push(mcq(`"${connector}" is a keyboard…`, 'Connection method', ['Switch brand', 'Layout name', 'Stabilizer type', 'Keycap plastic'], `${connector} describes how a keyboard connects.`));
  }
  return out;
}

function generateSpecialKeyQuestions(): McqQuestion[] {
  const actions = SPECIAL_KEYS.map((s) => s.action);
  return SPECIAL_KEYS.map(({ key, action }) =>
    mcq(`What does the ${key} key typically do?`, action, shuffle(actions.filter((a) => a !== action)).slice(0, 3), `${key}: ${action}.`),
  );
}

function generateAboveBelowQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  const pairs: Array<[string, string, string]> = [
    ['a', 'q', 'z'], ['s', 'w', 'x'], ['d', 'e', 'c'], ['f', 'r', 'v'], ['g', 't', 'b'],
    ['h', 'y', 'n'], ['j', 'u', 'm'], ['k', 'i', ','], ['l', 'o', '.'], [';', 'p', '/'],
  ];
  for (const [home, top, bottom] of pairs) {
    out.push(mcq(`Which key is directly ABOVE "${home.toUpperCase()}" on QWERTY?`, top.toUpperCase(), shuffle(FULL_ROWS.top).slice(0, 3).map(label), `"${top.toUpperCase()}" is above "${home.toUpperCase()}".`));
    out.push(mcq(`Which key is directly BELOW "${home.toUpperCase()}" on QWERTY?`, bottom.toUpperCase(), shuffle(FULL_ROWS.bottom).slice(0, 3).map(label), `"${bottom.toUpperCase()}" is below "${home.toUpperCase()}".`));
  }
  return out;
}

function generateKeyCountQuestions(): McqQuestion[] {
  const out: McqQuestion[] = [];
  for (const rowId of Object.keys(FULL_ROWS)) {
    const count = FULL_ROWS[rowId].length;
    const label = ROWS[rowId as keyof typeof ROWS]?.label ?? rowId;
    out.push(mcq(
      `How many keys are on the ${label.toLowerCase()} (main block, approx.)?`,
      String(count),
      shuffle([String(count - 2), String(count + 1), String(count + 3), String(count - 1)].filter((v) => v !== String(count))).slice(0, 3),
      `The ${label.toLowerCase()} has ${count} keys in the standard US layout.`,
    ));
  }
  return out;
}

let cached: McqQuestion[] | null = null;

export function getKeyboardQuizQuestions(): McqQuestion[] {
  if (cached) return cached;
  const generated = [
    ...generateRowQuestions(),
    ...generateNeighborQuestions(),
    ...generateFingerQuestions(),
    ...generateShiftSymbolQuestions(),
    ...generateOddOneOutQuestions(),
    ...generateSameRowQuestions(),
    ...generateSwitchQuestions(),
    ...generateNumericQuestions(),
    ...generateHardwareQuestions(),
    ...generateSpecialKeyQuestions(),
    ...generateAboveBelowQuestions(),
    ...generateKeyCountQuestions(),
  ];
  const seen = new Set<string>();
  cached = [...BASE_KEYBOARD_QUESTIONS, ...generated].filter((q) => {
    const id = uniqueId([q.q, ...q.options]);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return cached;
}

export const KEYBOARD_QUIZ_COUNT = () => getKeyboardQuizQuestions().length;

export function sampleKeyboardQuiz(count = 15): McqQuestion[] {
  return shuffle(getKeyboardQuizQuestions()).slice(0, count);
}
