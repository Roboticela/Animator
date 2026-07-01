import { shuffle, uniqueId } from './random';

export interface FnQuestion {
  key: string;
  correct: string;
  options: string[];
  note: string;
}

const FN_ACTIONS: Record<string, { correct: string; distractors: string[]; note: string }> = {
  F1: { correct: 'Help / Documentation', distractors: ['Save', 'Refresh', 'Open file', 'Print'], note: 'F1 opens Help or documentation in most applications.' },
  F2: { correct: 'Rename selected item', distractors: ['Undo', 'Search', 'Bold', 'Cut'], note: 'F2 renames the selected file or cell in Explorer and Excel.' },
  F3: { correct: 'Open search / Find', distractors: ['Copy', 'New tab', 'Print', 'Paste'], note: 'F3 opens search or Find in many apps including Explorer.' },
  F4: { correct: 'Focus address bar / Alt+F4 closes', distractors: ['Fullscreen', 'Paste', 'Format', 'Save'], note: 'F4 focuses the address bar; Alt+F4 closes the active window.' },
  F5: { correct: 'Refresh / Reload', distractors: ['Screenshot', 'Save', 'Run', 'Stop'], note: 'F5 refreshes the page in browsers and Windows Explorer.' },
  F6: { correct: 'Focus address bar / pane', distractors: ['Open new tab', 'Find next', 'Bold', 'Mute'], note: 'F6 moves focus between panes or the address bar.' },
  F7: { correct: 'Spell check (Office)', distractors: ['Save all', 'Play/Pause', 'Properties', 'Zoom'], note: 'F7 opens spell check in Microsoft Word and Office apps.' },
  F8: { correct: 'Safe Mode / boot options', distractors: ['Copy all', 'Bluetooth toggle', 'Format drive', 'Sleep'], note: 'F8 historically opened Windows boot options including Safe Mode.' },
  F9: { correct: 'Refresh fields (Office)', distractors: ['Save', 'New window', 'Zoom', 'Cut'], note: 'F9 refreshes fields in Word and Outlook.' },
  F10: { correct: 'Activate menu bar', distractors: ['Close tab', 'Mute audio', 'Print preview', 'Screenshot'], note: 'F10 activates the menu bar in most Windows applications.' },
  F11: { correct: 'Toggle full screen', distractors: ['Zoom out', 'Show downloads', 'Open sidebar', 'New window'], note: 'F11 toggles fullscreen in browsers and many apps.' },
  F12: { correct: 'Open developer tools', distractors: ['Open settings', 'Save as', 'Print', 'Inspect network'], note: 'F12 opens Developer Tools in major browsers.' },
};

const APPS = ['in a browser', 'in Microsoft Word', 'in Windows Explorer', 'in Excel', 'in Outlook', 'in VS Code', 'during startup', 'in a game'];

function generateContextQuestions(): FnQuestion[] {
  const out: FnQuestion[] = [];
  for (const [key, data] of Object.entries(FN_ACTIONS)) {
    for (const app of APPS) {
      out.push({
        key,
        correct: data.correct,
        options: shuffle([data.correct, ...shuffle(data.distractors).slice(0, 3)]),
        note: `${key} ${data.note.replace('in most applications', app)}`,
      });
    }
  }
  return out;
}

function generateReverseQuestions(): FnQuestion[] {
  const keys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
  return Object.entries(FN_ACTIONS).map(([key, data]) => ({
    key: `Which key: ${data.correct}?`,
    correct: key,
    options: shuffle([key, ...shuffle(keys.filter((k) => k !== key)).slice(0, 3)]),
    note: `${key} is used for: ${data.correct}`,
  }));
}

let cached: FnQuestion[] | null = null;

export function getFunctionKeyQuestions(): FnQuestion[] {
  if (cached) return cached;
  const base = Object.entries(FN_ACTIONS).map(([key, data]) => ({
    key,
    correct: data.correct,
    options: shuffle([data.correct, ...data.distractors.slice(0, 3)]),
    note: data.note,
  }));
  const seen = new Set<string>();
  cached = [...base, ...generateContextQuestions(), ...generateReverseQuestions()].filter((q) => {
    const id = uniqueId([q.key, q.correct, q.note]);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return cached;
}

export function sampleFunctionKeyQuiz(count = 12): FnQuestion[] {
  return shuffle(getFunctionKeyQuestions()).slice(0, count);
}
