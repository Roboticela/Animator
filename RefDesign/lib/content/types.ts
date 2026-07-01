export interface McqQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ShortcutQuestion {
  shortcut: string;
  correct: string;
  options: string[];
  platform: 'Windows' | 'macOS' | 'Linux' | 'Universal';
}
