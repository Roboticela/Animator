import type { ShortcutQuestion } from './types';
import { pick, shuffle, uniqueId } from './random';

type Platform = ShortcutQuestion['platform'];

interface ShortcutEntry {
  platform: Platform;
  shortcut: string;
  correct: string;
  distractors: string[];
}

function entry(platform: Platform, shortcut: string, correct: string, distractors: string[]): ShortcutEntry {
  return { platform, shortcut, correct, distractors };
}

// ── Windows ─────────────────────────────────────────────────────────────────
export const windowsShortcutEntries: ShortcutEntry[] = [
  entry('Windows', 'Ctrl + C', 'Copy', ['Cut', 'Paste', 'Close', 'Undo']),
  entry('Windows', 'Ctrl + V', 'Paste', ['Copy', 'Save', 'Print', 'Find']),
  entry('Windows', 'Ctrl + X', 'Cut', ['Copy', 'Delete', 'Select All', 'Redo']),
  entry('Windows', 'Ctrl + Z', 'Undo', ['Redo', 'Save', 'Quit', 'Zoom']),
  entry('Windows', 'Ctrl + Y', 'Redo', ['Undo', 'Save', 'Close', 'Find']),
  entry('Windows', 'Ctrl + A', 'Select all', ['Open', 'Save As', 'New', 'Print']),
  entry('Windows', 'Ctrl + S', 'Save', ['Save As', 'Search', 'Sync', 'Sort']),
  entry('Windows', 'Ctrl + O', 'Open file', ['New', 'Close', 'Print', 'Save']),
  entry('Windows', 'Ctrl + P', 'Print', ['Paste', 'Preview', 'Pause', 'Properties']),
  entry('Windows', 'Ctrl + N', 'New document / window', ['Next', 'Navigate', 'Network', 'Note']),
  entry('Windows', 'Ctrl + W', 'Close tab or window', ['Quit app', 'New tab', 'Minimize', 'Wrap']),
  entry('Windows', 'Ctrl + F', 'Find', ['Replace', 'Format', 'Filter', 'Fullscreen']),
  entry('Windows', 'Ctrl + H', 'Replace', ['Find', 'History', 'Help', 'Hide']),
  entry('Windows', 'Ctrl + G', 'Find next', ['Find previous', 'Go to line', 'Group', 'Generate']),
  entry('Windows', 'Ctrl + Shift + G', 'Find previous', ['Find next', 'Go to line', 'Group tabs', 'Generate report']),
  entry('Windows', 'Ctrl + T', 'New tab', ['New window', 'Terminal', 'Toggle', 'Table']),
  entry('Windows', 'Ctrl + Shift + T', 'Reopen closed tab', ['New tab', 'Close tab', 'Terminal', 'Tile tabs']),
  entry('Windows', 'Ctrl + Shift + N', 'New incognito / InPrivate window', ['New tab', 'New note', 'Night mode', 'Next window']),
  entry('Windows', 'Ctrl + Tab', 'Next tab', ['Previous tab', 'Close tab', 'New tab', 'Task switcher']),
  entry('Windows', 'Ctrl + Shift + Tab', 'Previous tab', ['Next tab', 'Close tab', 'Split view', 'Save tab']),
  entry('Windows', 'Ctrl + R', 'Refresh', ['Hard refresh', 'Redo', 'Run', 'Rename']),
  entry('Windows', 'Ctrl + Shift + R', 'Hard refresh (bypass cache)', ['Refresh', 'Restart', 'Record', 'Restore']),
  entry('Windows', 'Ctrl + F5', 'Hard refresh', ['Refresh', 'Find', 'Fullscreen', 'Save']),
  entry('Windows', 'F5', 'Refresh', ['Hard refresh', 'Find', 'Run', 'Screenshot']),
  entry('Windows', 'Ctrl + D', 'Bookmark page', ['Download', 'Delete', 'Duplicate', 'Debug']),
  entry('Windows', 'Ctrl + L', 'Focus address bar', ['Lock screen', 'Logout', 'Left align', 'Link']),
  entry('Windows', 'Ctrl + K', 'Search / command palette', ['Kill process', 'Keep', 'Kernel log', 'Keymap']),
  entry('Windows', 'Ctrl + J', 'Open downloads', ['Jump to line', 'Join', 'Journal', 'JSON viewer']),
  entry('Windows', 'Ctrl + B', 'Bold text', ['Bookmark', 'Back', 'Bluetooth', 'Bullets']),
  entry('Windows', 'Ctrl + I', 'Italic text', ['Insert', 'Inspect', 'Import', 'Indent']),
  entry('Windows', 'Ctrl + U', 'Underline text', ['Undo', 'Unlink', 'Upload', 'Unmute']),
  entry('Windows', 'Ctrl + Plus', 'Zoom in', ['Zoom out', 'New tab', 'Paste', 'Print']),
  entry('Windows', 'Ctrl + Minus', 'Zoom out', ['Zoom in', 'Minimize', 'Mute', 'Markdown']),
  entry('Windows', 'Ctrl + 0', 'Reset zoom', ['Close tab', 'Open menu', 'OCR', 'Outline']),
  entry('Windows', 'Ctrl + Home', 'Go to start of document', ['Go to desktop', 'New document', 'Hide UI', 'Help']),
  entry('Windows', 'Ctrl + End', 'Go to end of document', ['Close app', 'End call', 'Exit fullscreen', 'Eject']),
  entry('Windows', 'Ctrl + Left Arrow', 'Move cursor one word left', ['Select word', 'Switch desktop', 'Close window', 'Scroll']),
  entry('Windows', 'Ctrl + Right Arrow', 'Move cursor one word right', ['Select word', 'Next tab', 'Redo', 'Run']),
  entry('Windows', 'Ctrl + Shift + Left Arrow', 'Select previous word', ['Move word left', 'Home', 'Hide panel', 'Split']),
  entry('Windows', 'Ctrl + Shift + Right Arrow', 'Select next word', ['Move word right', 'End', 'Find', 'Format']),
  entry('Windows', 'Ctrl + Backspace', 'Delete previous word', ['Delete line', 'Undo', 'Close tab', 'Clear form']),
  entry('Windows', 'Ctrl + Delete', 'Delete next word', ['Delete line', 'Undo', 'Cut', 'Close']),
  entry('Windows', 'Shift + Delete', 'Permanently delete (skip Recycle Bin)', ['Move to trash', 'Undo', 'Archive', 'Hide']),
  entry('Windows', 'Alt + Tab', 'Switch between open windows', ['Close window', 'Minimize all', 'Task Manager', 'Snap window']),
  entry('Windows', 'Alt + Shift + Tab', 'Switch windows in reverse order', ['Switch forward', 'Close app', 'Snap left', 'Show desktop']),
  entry('Windows', 'Alt + Esc', 'Cycle windows in order opened', ['Switch apps', 'Close window', 'Minimize', 'Maximize']),
  entry('Windows', 'Alt + F4', 'Close active window', ['Force quit only', 'Minimize', 'Refresh', 'Fullscreen']),
  entry('Windows', 'Alt + Enter', 'Open Properties / toggle fullscreen', ['Submit form', 'New line', 'Mute', 'Search']),
  entry('Windows', 'Alt + Space', 'Open window system menu', ['Close window', 'Snap menu', 'Search', 'Settings']),
  entry('Windows', 'Alt + Underline menu letter', 'Activate menu bar item', ['Close menu', 'Open search', 'Minimize', 'Print']),
  entry('Windows', 'Ctrl + Shift + Esc', 'Open Task Manager', ['Open security screen', 'Lock PC', 'Sign out', 'Run dialog']),
  entry('Windows', 'Ctrl + Alt + Del', 'Open security screen', ['Open Task Manager', 'Restart PC', 'Lock only', 'Sign out immediately']),
  entry('Windows', 'Win', 'Open Start menu', ['Open search only', 'Show desktop', 'Lock PC', 'Open Settings']),
  entry('Windows', 'Win + A', 'Open Quick Settings / Action Center', ['Open apps', 'Open audio only', 'Open alerts', 'Open accounts']),
  entry('Windows', 'Win + B', 'Focus system tray', ['Focus taskbar apps', 'Open Bluetooth', 'Open battery', 'Open Start']),
  entry('Windows', 'Win + C', 'Open Copilot / voice typing', ['Open clipboard', 'Open calendar', 'Open camera', 'Open contacts']),
  entry('Windows', 'Win + D', 'Show or hide desktop', ['Lock screen', 'Open display settings', 'Delete file', 'Duplicate monitor']),
  entry('Windows', 'Win + E', 'Open File Explorer', ['Open Edge', 'Open email', 'Eject USB', 'Edit file']),
  entry('Windows', 'Win + F', 'Open Feedback Hub', ['Open Find', 'Open File Explorer', 'Fullscreen', 'Format drive']),
  entry('Windows', 'Win + G', 'Open Xbox Game Bar', ['Open Game Mode toggle only', 'Open GPU settings', 'Record only', 'Open gallery']),
  entry('Windows', 'Win + H', 'Open voice typing', ['Open share', 'Open history', 'Open help', 'Open HDR settings']),
  entry('Windows', 'Win + I', 'Open Settings', ['Open input tools', 'Install updates', 'Inspect element', 'Invert colors']),
  entry('Windows', 'Win + K', 'Open Cast / Connect devices', ['Open clipboard', 'Kill app', 'Open keyboard settings', 'Open calendar']),
  entry('Windows', 'Win + L', 'Lock the PC', ['Log out', 'Launch app', 'Open library', 'List windows']),
  entry('Windows', 'Win + M', 'Minimize all windows', ['Maximize all', 'Mute audio', 'Move window', 'Mirror display']),
  entry('Windows', 'Win + Shift + M', 'Restore minimized windows', ['Minimize all', 'Move window', 'Mirror display', 'Mute mic']),
  entry('Windows', 'Win + O', 'Lock device orientation', ['Open Office', 'Open OneDrive', 'Open Outlook', 'Open overlay']),
  entry('Windows', 'Win + P', 'Open display projection options', ['Print screen', 'Pause system', 'Pin window', 'Project file']),
  entry('Windows', 'Win + Pause', 'Open System Properties', ['Pause media', 'Open power settings', 'Print', 'Project display']),
  entry('Windows', 'Win + R', 'Open Run dialog', ['Restart PC', 'Record screen', 'Refresh page', 'Rename file']),
  entry('Windows', 'Win + S', 'Open Search', ['Open Settings', 'Open Start only', 'Save file', 'Screenshot']),
  entry('Windows', 'Win + Shift + S', 'Open Snipping Tool / screen snip', ['Screenshot full screen', 'Save file', 'Search', 'Share']),
  entry('Windows', 'Win + T', 'Cycle taskbar apps', ['Open Terminal', 'New tab', 'Toggle tablet mode', 'Task Manager']),
  entry('Windows', 'Win + Tab', 'Open Task View', ['Switch apps only', 'Tile windows', 'Open Terminal', 'Toggle tablet mode']),
  entry('Windows', 'Win + U', 'Open Accessibility Settings', ['Undo', 'Uninstall app', 'Upload file', 'Underline text']),
  entry('Windows', 'Win + V', 'Open clipboard history', ['Paste only', 'Volume mixer', 'VPN settings', 'Voice typing']),
  entry('Windows', 'Win + W', 'Open Widgets board', ['Close window', 'Open Word', 'Open Wi-Fi', 'Wrap text']),
  entry('Windows', 'Win + X', 'Open Quick Link / power user menu', ['Open Xbox', 'Close app', 'Cut file', 'XML view']),
  entry('Windows', 'Win + Z', 'Open Snap layouts', ['Zoom in', 'Undo', 'Sleep PC', 'Zero zoom']),
  entry('Windows', 'Win + Comma', 'Peek at desktop (hold)', ['Open Command Prompt', 'Copy', 'Comment line', 'Compare files']),
  entry('Windows', 'Win + Plus', 'Open Magnifier and zoom in', ['Zoom out', 'Paste', 'Print', 'Pin app']),
  entry('Windows', 'Win + Minus', 'Zoom out in Magnifier', ['Zoom in', 'Minimize window', 'Mute', 'Mirror']),
  entry('Windows', 'Win + Esc', 'Close Magnifier', ['Exit app', 'End task', 'Escape fullscreen', 'Eject drive']),
  entry('Windows', 'Win + Ctrl + D', 'Create new virtual desktop', ['Close desktop', 'Show desktop', 'Duplicate display', 'Delete desktop']),
  entry('Windows', 'Win + Ctrl + F4', 'Close current virtual desktop', ['Create desktop', 'Fullscreen', 'Force quit', 'Find window']),
  entry('Windows', 'Win + Ctrl + Left Arrow', 'Switch to left virtual desktop', ['Snap window left', 'Move window monitor', 'Previous app', 'Rotate display']),
  entry('Windows', 'Win + Ctrl + Right Arrow', 'Switch to right virtual desktop', ['Snap window right', 'Move window monitor', 'Next app', 'Rotate display']),
  entry('Windows', 'Win + Left Arrow', 'Snap window to left half', ['Move to left monitor', 'Switch desktop left', 'Collapse panel', 'Cursor word left']),
  entry('Windows', 'Win + Right Arrow', 'Snap window to right half', ['Move to right monitor', 'Switch desktop right', 'Expand panel', 'Cursor word right']),
  entry('Windows', 'Win + Up Arrow', 'Maximize window', ['Snap top', 'Switch app up', 'Scroll up', 'Volume up']),
  entry('Windows', 'Win + Down Arrow', 'Restore or minimize window', ['Snap bottom', 'Close window', 'Scroll down', 'Volume down']),
  entry('Windows', 'Win + Shift + Left Arrow', 'Move window to left monitor', ['Snap left', 'Switch desktop', 'Select word', 'Scroll left']),
  entry('Windows', 'Win + Shift + Right Arrow', 'Move window to right monitor', ['Snap right', 'Switch desktop', 'Select word', 'Scroll right']),
  entry('Windows', 'Win + 1 … 9', 'Open or switch to taskbar app by position', ['Close taskbar app', 'Pin app', 'Open Start', 'Open Settings']),
  entry('Windows', 'Win + Shift + 1 … 9', 'Open new instance of taskbar app', ['Switch to app', 'Close app', 'Pin file', 'Print']),
  entry('Windows', 'Ctrl + Shift + I', 'Open Developer Tools', ['Inspect element only', 'Import data', 'Italic', 'Insert snippet']),
  entry('Windows', 'Ctrl + Shift + J', 'Open browser console', ['Open debugger only', 'Join meeting', 'Journal', 'JSON formatter']),
  entry('Windows', 'Ctrl + Shift + C', 'Inspect element', ['Copy path', 'Clear cache', 'Comment code', 'Center page']),
  entry('Windows', 'F2', 'Rename selected item', ['Refresh', 'Find', 'Help', 'Fullscreen']),
  entry('Windows', 'F3', 'Open search in Explorer / Find next in browser', ['Rename', 'Refresh', 'Help', 'Fullscreen']),
  entry('Windows', 'F10', 'Activate menu bar', ['Fullscreen', 'Find', 'Refresh', 'Force quit']),
  entry('Windows', 'F11', 'Toggle fullscreen', ['Refresh', 'Find', 'Developer tools', 'Format cell']),
  entry('Windows', 'Shift + F10', 'Open context menu', ['Refresh', 'Rename', 'Find', 'Force quit']),
  entry('Windows', 'PrtScn', 'Copy full-screen screenshot to clipboard', ['Save screenshot to file', 'Open Snip tool', 'Print screen', 'Paste screenshot']),
  entry('Windows', 'Win + PrtScn', 'Save full-screen screenshot to Pictures', ['Copy to clipboard only', 'Open Snip tool', 'Print', 'Project display']),
  entry('Windows', 'Alt + PrtScn', 'Screenshot active window to clipboard', ['Screenshot full screen', 'Open Game Bar', 'Print window', 'Pin window']),
];

// ── macOS ───────────────────────────────────────────────────────────────────
const MACOS: ShortcutEntry[] = [
  entry('macOS', 'Cmd + C', 'Copy', ['Cut', 'Paste', 'Close', 'Undo']),
  entry('macOS', 'Cmd + V', 'Paste', ['Copy', 'Save', 'Print', 'Find']),
  entry('macOS', 'Cmd + X', 'Cut', ['Copy', 'Delete', 'Select All', 'Redo']),
  entry('macOS', 'Cmd + Z', 'Undo', ['Redo', 'Save', 'Quit', 'Zoom']),
  entry('macOS', 'Cmd + Shift + Z', 'Redo', ['Undo', 'Save', 'Close', 'Find']),
  entry('macOS', 'Cmd + A', 'Select all', ['Open', 'Save As', 'New', 'Print']),
  entry('macOS', 'Cmd + S', 'Save', ['Save As', 'Search', 'Sync', 'Sort']),
  entry('macOS', 'Cmd + O', 'Open file', ['New', 'Close', 'Print', 'Save']),
  entry('macOS', 'Cmd + P', 'Print', ['Paste', 'Preview', 'Pause', 'Properties']),
  entry('macOS', 'Cmd + N', 'New document / window', ['New tab', 'Next', 'Network', 'Note']),
  entry('macOS', 'Cmd + W', 'Close window or tab', ['Quit app', 'Minimize', 'New tab', 'Wrap']),
  entry('macOS', 'Cmd + Q', 'Quit application', ['Close window', 'Minimize', 'Hide app', 'Force quit']),
  entry('macOS', 'Cmd + M', 'Minimize window', ['Maximize', 'Mute', 'Move tab', 'Mirror display']),
  entry('macOS', 'Cmd + H', 'Hide application', ['Quit app', 'Help', 'History', 'Highlight']),
  entry('macOS', 'Cmd + Option + H', 'Hide other applications', ['Hide all', 'Quit others', 'Help', 'Home']),
  entry('macOS', 'Cmd + Tab', 'Switch applications', ['Switch windows in app', 'Close app', 'Show desktop', 'Mission Control']),
  entry('macOS', 'Cmd + `', 'Switch windows in same app', ['Switch apps', 'Close tab', 'Minimize', 'Mission Control']),
  entry('macOS', 'Cmd + Shift + Tab', 'Switch apps in reverse', ['Switch forward', 'Close app', 'Cycle tabs', 'Show desktop']),
  entry('macOS', 'Cmd + Space', 'Open Spotlight Search', ['Open Finder', 'Open Siri only', 'Open Settings', 'Open Safari']),
  entry('macOS', 'Cmd + Option + Space', 'Open Finder search window', ['Open Spotlight', 'Open Siri', 'Open Settings', 'Open Share sheet']),
  entry('macOS', 'Cmd + F', 'Find in document / page', ['Replace', 'Fullscreen', 'Filter', 'Format']),
  entry('macOS', 'Cmd + G', 'Find next', ['Find previous', 'Go to line', 'Generate', 'Group']),
  entry('macOS', 'Cmd + Shift + G', 'Find previous', ['Find next', 'Go to folder', 'Generate', 'Group tabs']),
  entry('macOS', 'Cmd + Option + F', 'Find and replace', ['Find only', 'Format', 'Filter', 'Fullscreen']),
  entry('macOS', 'Cmd + T', 'New tab', ['New window', 'Terminal', 'Toggle', 'Table']),
  entry('macOS', 'Cmd + Shift + T', 'Reopen closed tab (browser)', ['New tab', 'Close tab', 'Terminal', 'Tile tabs']),
  entry('macOS', 'Cmd + Shift + N', 'New private window / new folder in Finder', ['New tab', 'New note', 'Night mode', 'Next window']),
  entry('macOS', 'Cmd + L', 'Focus address bar / go to folder', ['Lock screen', 'Logout', 'Left align', 'Link']),
  entry('macOS', 'Cmd + R', 'Refresh page', ['Hard refresh', 'Redo', 'Run', 'Rename']),
  entry('macOS', 'Cmd + Shift + R', 'Hard refresh', ['Refresh', 'Restart', 'Record', 'Restore']),
  entry('macOS', 'Cmd + D', 'Bookmark page / duplicate in Finder', ['Delete', 'Download', 'Debug', 'Dictation']),
  entry('macOS', 'Cmd + B', 'Bold text', ['Bookmark', 'Back', 'Bluetooth', 'Bullets']),
  entry('macOS', 'Cmd + I', 'Italic text', ['Inspect', 'Import', 'Indent', 'Info panel']),
  entry('macOS', 'Cmd + U', 'Underline text', ['Undo', 'Unlink', 'Upload', 'Unmute']),
  entry('macOS', 'Cmd + K', 'Insert hyperlink', ['Search', 'Kill line', 'Kernel log', 'Keymap']),
  entry('macOS', 'Cmd + Plus', 'Zoom in', ['Zoom out', 'New tab', 'Paste', 'Print']),
  entry('macOS', 'Cmd + Minus', 'Zoom out', ['Zoom in', 'Minimize', 'Mute', 'Markdown']),
  entry('macOS', 'Cmd + 0', 'Reset zoom', ['Close tab', 'Open menu', 'OCR', 'Outline']),
  entry('macOS', 'Cmd + Up Arrow', 'Go to beginning of document / open enclosing folder', ['Scroll up', 'Mission Control', 'Maximize', 'Volume up']),
  entry('macOS', 'Cmd + Down Arrow', 'Go to end of document / open selection', ['Scroll down', 'Minimize', 'Volume down', 'Delete']),
  entry('macOS', 'Cmd + Left Arrow', 'Go to beginning of line', ['Move word left', 'Back', 'Previous tab', 'Snap left']),
  entry('macOS', 'Cmd + Right Arrow', 'Go to end of line', ['Move word right', 'Forward', 'Next tab', 'Snap right']),
  entry('macOS', 'Cmd + Shift + Up Arrow', 'Select to beginning of document', ['Move up', 'Mission Control', 'Page up', 'Volume up']),
  entry('macOS', 'Cmd + Shift + Down Arrow', 'Select to end of document', ['Move down', 'Minimize', 'Page down', 'Volume down']),
  entry('macOS', 'Option + Left Arrow', 'Move cursor one word left', ['Select word', 'Switch desktop', 'Back', 'Scroll']),
  entry('macOS', 'Option + Right Arrow', 'Move cursor one word right', ['Select word', 'Forward', 'Next tab', 'Scroll']),
  entry('macOS', 'Cmd + Delete', 'Move item to Trash', ['Delete immediately', 'Undo', 'Cut', 'Close window']),
  entry('macOS', 'Cmd + Shift + Delete', 'Empty Trash', ['Move to Trash', 'Undo', 'Archive', 'Hide']),
  entry('macOS', 'Cmd + ,', 'Open Preferences / Settings', ['Open files', 'Close window', 'Copy', 'Cut']),
  entry('macOS', 'Cmd + Shift + 3', 'Screenshot entire screen', ['Screenshot selection', 'Screenshot window', 'Screen record', 'Share screen']),
  entry('macOS', 'Cmd + Shift + 4', 'Screenshot selected area', ['Screenshot full screen', 'Screenshot window', 'Screen record', 'Save PDF']),
  entry('macOS', 'Cmd + Shift + 5', 'Open screenshot and screen recording toolbar', ['Screenshot full screen', 'Screenshot selection', 'Open Grab', 'Open Game Bar']),
  entry('macOS', 'Cmd + Shift + 4 then Space', 'Screenshot a window', ['Screenshot region', 'Screenshot full screen', 'Record window', 'Print window']),
  entry('macOS', 'Cmd + Option + Esc', 'Open Force Quit Applications', ['Open Task Manager', 'Lock screen', 'Log out', 'Restart']),
  entry('macOS', 'Cmd + Option + Power', 'Sleep Mac', ['Shut down', 'Restart', 'Lock screen', 'Log out']),
  entry('macOS', 'Cmd + Control + Power', 'Restart Mac', ['Sleep', 'Shut down', 'Lock screen', 'Log out']),
  entry('macOS', 'Cmd + Option + Control + Power', 'Shut down Mac immediately', ['Restart', 'Sleep', 'Lock screen', 'Log out']),
  entry('macOS', 'Control + Cmd + F', 'Toggle fullscreen', ['Maximize', 'Mission Control', 'Find', 'Format']),
  entry('macOS', 'Control + Cmd + Space', 'Open emoji and symbol picker', ['Open Spotlight', 'Open Siri', 'Open search', 'Open share']),
  entry('macOS', 'Cmd + Option + I', 'Open Developer Tools (browser)', ['Inspect element only', 'Import', 'Italic', 'Info']),
  entry('macOS', 'Cmd + Option + J', 'Open browser console', ['Open debugger only', 'Journal', 'Join meeting', 'JSON view']),
  entry('macOS', 'Cmd + Option + C', 'Inspect element', ['Copy path', 'Clear cache', 'Comment', 'Center']),
  entry('macOS', 'Cmd + Option + V', 'Paste and match style', ['Paste normally', 'Paste special', 'Print', 'Preview']),
  entry('macOS', 'Cmd + Shift + V', 'Paste and match style (some apps)', ['Paste normally', 'Paste special', 'Print', 'Preview']),
  entry('macOS', 'Control + Up Arrow', 'Mission Control', ['App Exposé', 'Desktop', 'Volume up', 'Page up']),
  entry('macOS', 'Control + Down Arrow', 'App Exposé / show all windows of app', ['Mission Control', 'Desktop', 'Volume down', 'Page down']),
  entry('macOS', 'F11', 'Show desktop (default)', ['Fullscreen', 'Find', 'Refresh', 'Mission Control']),
  entry('macOS', 'Cmd + F3', 'Show desktop', ['Mission Control', 'Fullscreen', 'Find', 'Spotlight']),
  entry('macOS', 'Control + Cmd + Q', 'Lock screen', ['Log out', 'Quit app', 'Force quit', 'Sleep']),
  entry('macOS', 'Cmd + Shift + ?', 'Open Help menu search', ['Open Help file only', 'Open History', 'Open Home', 'Open Highlight']),
  entry('macOS', 'Fn + Left Arrow', 'Home', ['End', 'Page up', 'Desktop', 'Dictation']),
  entry('macOS', 'Fn + Right Arrow', 'End', ['Home', 'Page down', 'Desktop', 'Dictation']),
  entry('macOS', 'Fn + Up Arrow', 'Page Up', ['Page Down', 'Mission Control', 'Volume up', 'Desktop']),
  entry('macOS', 'Fn + Down Arrow', 'Page Down', ['Page Up', 'App Exposé', 'Volume down', 'Desktop']),
];

// ── Linux ───────────────────────────────────────────────────────────────────
const LINUX: ShortcutEntry[] = [
  entry('Linux', 'Ctrl + C', 'Copy (or interrupt terminal process)', ['Paste', 'Close', 'Cut', 'Undo']),
  entry('Linux', 'Ctrl + Shift + C', 'Copy in terminal', ['Interrupt process', 'Paste in terminal', 'Close terminal', 'Clear terminal']),
  entry('Linux', 'Ctrl + V', 'Paste', ['Copy', 'Save', 'Print', 'Find']),
  entry('Linux', 'Ctrl + Shift + V', 'Paste in terminal', ['Copy in terminal', 'Interrupt', 'Close tab', 'Clear line']),
  entry('Linux', 'Ctrl + X', 'Cut', ['Copy', 'Delete', 'Select All', 'Redo']),
  entry('Linux', 'Ctrl + Z', 'Undo (or suspend terminal process)', ['Redo', 'Save', 'Quit', 'Zoom']),
  entry('Linux', 'Ctrl + Shift + Z', 'Redo', ['Undo', 'Save', 'Close', 'Find']),
  entry('Linux', 'Ctrl + A', 'Select all', ['Open', 'Save As', 'New', 'Print']),
  entry('Linux', 'Ctrl + S', 'Save', ['Search', 'Sync', 'Sort', 'Suspend process']),
  entry('Linux', 'Ctrl + O', 'Open file', ['New', 'Close', 'Print', 'Save']),
  entry('Linux', 'Ctrl + P', 'Print', ['Paste', 'Preview', 'Pause', 'Properties']),
  entry('Linux', 'Ctrl + N', 'New document / window', ['Next', 'Navigate', 'Network', 'Note']),
  entry('Linux', 'Ctrl + W', 'Close tab or window', ['Quit app', 'New tab', 'Minimize', 'Wrap']),
  entry('Linux', 'Ctrl + Q', 'Quit application', ['Close tab', 'Minimize', 'Hide', 'Force quit']),
  entry('Linux', 'Ctrl + F', 'Find', ['Replace', 'Format', 'Filter', 'Fullscreen']),
  entry('Linux', 'Ctrl + H', 'Replace', ['Find', 'History', 'Help', 'Hide']),
  entry('Linux', 'Ctrl + G', 'Find next', ['Find previous', 'Go to line', 'Group', 'Generate']),
  entry('Linux', 'Ctrl + Shift + G', 'Find previous', ['Find next', 'Go to line', 'Group tabs', 'Generate report']),
  entry('Linux', 'Ctrl + T', 'New tab', ['New terminal tab', 'Terminal', 'Toggle', 'Table']),
  entry('Linux', 'Ctrl + Shift + T', 'Reopen closed tab', ['New tab', 'Close tab', 'Terminal', 'Tile tabs']),
  entry('Linux', 'Ctrl + Shift + N', 'New incognito / private window', ['New tab', 'New note', 'Night mode', 'Next window']),
  entry('Linux', 'Ctrl + Tab', 'Next tab', ['Previous tab', 'Close tab', 'New tab', 'Switch workspace']),
  entry('Linux', 'Ctrl + Shift + Tab', 'Previous tab', ['Next tab', 'Close tab', 'Split view', 'Save tab']),
  entry('Linux', 'Ctrl + R', 'Refresh / reverse search in terminal', ['Hard refresh', 'Redo', 'Run', 'Rename']),
  entry('Linux', 'Ctrl + Shift + R', 'Hard refresh', ['Refresh', 'Restart', 'Record', 'Restore']),
  entry('Linux', 'Ctrl + L', 'Focus address bar / clear terminal screen', ['Lock screen', 'Logout', 'Left align', 'Link']),
  entry('Linux', 'Ctrl + D', 'Bookmark page / EOF in terminal', ['Delete', 'Download', 'Duplicate', 'Debug']),
  entry('Linux', 'Ctrl + Plus', 'Zoom in', ['Zoom out', 'New tab', 'Paste', 'Print']),
  entry('Linux', 'Ctrl + Minus', 'Zoom out', ['Zoom in', 'Minimize', 'Mute', 'Markdown']),
  entry('Linux', 'Ctrl + 0', 'Reset zoom', ['Close tab', 'Open menu', 'OCR', 'Outline']),
  entry('Linux', 'Ctrl + Alt + T', 'Open terminal (Ubuntu / GNOME)', ['Open Files', 'Open Settings', 'Open text editor', 'Open browser']),
  entry('Linux', 'Ctrl + Alt + L', 'Lock screen (Ubuntu)', ['Log out', 'Open terminal', 'Open launcher', 'Open laptop lid settings']),
  entry('Linux', 'Ctrl + Alt + Del', 'Log out / shutdown dialog (varies by DE)', ['Open Task Manager', 'Lock screen', 'Restart X', 'Open terminal']),
  entry('Linux', 'Ctrl + Alt + Backspace', 'Restart X server (legacy / optional)', ['Log out', 'Lock screen', 'Open terminal', 'Kill app']),
  entry('Linux', 'Ctrl + Alt + F1 … F6', 'Switch to virtual console TTY', ['Switch workspace', 'Open terminal', 'Lock screen', 'Logout']),
  entry('Linux', 'Ctrl + Alt + F7', 'Return to graphical desktop (typical)', ['Open TTY1', 'Lock screen', 'Logout', 'Restart']),
  entry('Linux', 'Alt + Tab', 'Switch between windows', ['Switch workspaces', 'Close window', 'Minimize all', 'Show desktop']),
  entry('Linux', 'Alt + Shift + Tab', 'Switch windows in reverse', ['Switch forward', 'Close app', 'Snap left', 'Show desktop']),
  entry('Linux', 'Alt + F4', 'Close window', ['Force quit only', 'Minimize', 'Refresh', 'Fullscreen']),
  entry('Linux', 'Alt + F2', 'Open run command dialog (GNOME / KDE)', ['Open terminal', 'Open files', 'Open settings', 'Open search']),
  entry('Linux', 'Alt + Esc', 'Cycle between windows', ['Switch apps', 'Close window', 'Minimize', 'Maximize']),
  entry('Linux', 'Super', 'Open activities / app launcher (GNOME)', ['Show desktop', 'Lock screen', 'Open terminal', 'Open settings']),
  entry('Linux', 'Super + L', 'Lock screen (many desktops)', ['Log out', 'Open launcher', 'Open laptop settings', 'Launch app']),
  entry('Linux', 'Super + D', 'Show desktop (GNOME / KDE)', ['Lock screen', 'Open display settings', 'Delete file', 'Duplicate monitor']),
  entry('Linux', 'Super + A', 'Show application grid', ['Open activities overview', 'Open audio', 'Open alerts', 'Open accounts']),
  entry('Linux', 'Super + Tab', 'Switch applications overview', ['Switch windows only', 'Tile windows', 'Open terminal', 'Toggle panel']),
  entry('Linux', 'Super + S', 'Open overview search (GNOME)', ['Open settings', 'Open screenshot', 'Save file', 'Suspend']),
  entry('Linux', 'Super + V', 'Clipboard history (GNOME extension / some DEs)', ['Paste only', 'Volume mixer', 'VPN settings', 'Voice typing']),
  entry('Linux', 'Super + Left Arrow', 'Snap window left (GNOME / KDE)', ['Switch workspace left', 'Move monitor left', 'Collapse panel', 'Cursor word left']),
  entry('Linux', 'Super + Right Arrow', 'Snap window right (GNOME / KDE)', ['Switch workspace right', 'Move monitor right', 'Expand panel', 'Cursor word right']),
  entry('Linux', 'Super + Up Arrow', 'Maximize window', ['Switch workspace up', 'Mission Control', 'Volume up', 'Scroll up']),
  entry('Linux', 'Super + Down Arrow', 'Restore / minimize window', ['Switch workspace down', 'Close window', 'Volume down', 'Scroll down']),
  entry('Linux', 'Ctrl + Alt + Left Arrow', 'Switch to left workspace (many DEs)', ['Snap window left', 'Move window monitor', 'Previous app', 'Rotate display']),
  entry('Linux', 'Ctrl + Alt + Right Arrow', 'Switch to right workspace (many DEs)', ['Snap window right', 'Move window monitor', 'Next app', 'Rotate display']),
  entry('Linux', 'Ctrl + Alt + Up Arrow', 'Switch to workspace above', ['Maximize', 'Mission Control', 'Volume up', 'Move window up']),
  entry('Linux', 'Ctrl + Alt + Down Arrow', 'Switch to workspace below', ['Minimize', 'Show desktop', 'Volume down', 'Move window down']),
  entry('Linux', 'Ctrl + Alt + Shift + Left Arrow', 'Move window to left workspace', ['Snap left', 'Switch workspace', 'Select word', 'Scroll left']),
  entry('Linux', 'Ctrl + Alt + Shift + Right Arrow', 'Move window to right workspace', ['Snap right', 'Switch workspace', 'Select word', 'Scroll right']),
  entry('Linux', 'Ctrl + Shift + Alt + R', 'Start / stop screen recording (Ubuntu)', ['Screenshot', 'Refresh', 'Restart', 'Restore']),
  entry('Linux', 'PrtScn', 'Screenshot full screen (varies by DE)', ['Screenshot window', 'Open Snip tool', 'Copy only', 'Print screen']),
  entry('Linux', 'Shift + PrtScn', 'Screenshot selection (many DEs)', ['Screenshot full screen', 'Screenshot window', 'Record screen', 'Share screen']),
  entry('Linux', 'Alt + PrtScn', 'Screenshot active window (many DEs)', ['Screenshot full screen', 'Open Game Bar', 'Print window', 'Pin window']),
  entry('Linux', 'Ctrl + Shift + I', 'Open Developer Tools (browser)', ['Inspect element only', 'Import data', 'Italic', 'Insert snippet']),
  entry('Linux', 'Ctrl + Shift + J', 'Open browser console', ['Open debugger only', 'Join meeting', 'Journal', 'JSON formatter']),
  entry('Linux', 'Ctrl + Shift + C', 'Inspect element', ['Copy path', 'Clear cache', 'Comment code', 'Center page']),
  entry('Linux', 'Ctrl + Shift + Esc', 'Open system monitor (some DEs)', ['Open terminal', 'Lock screen', 'Log out', 'Run dialog']),
  entry('Linux', 'Ctrl + Alt + K', 'Open Konsole (KDE)', ['Open terminal', 'Open files', 'Open settings', 'Kill app']),
  entry('Linux', 'Ctrl + E', 'Open file chooser / address bar (some apps)', ['Open editor', 'Open email', 'Eject USB', 'Edit file']),
  entry('Linux', 'Ctrl + Shift + W', 'Close all tabs / windows (browser)', ['Close tab', 'Close app', 'Clear cache', 'Clear terminal']),
  entry('Linux', 'Ctrl + Shift + Q', 'Quit application (some DEs)', ['Close tab', 'Lock screen', 'Log out', 'Force quit']),
  entry('Linux', 'Ctrl + Home', 'Go to start of document', ['Go to desktop', 'New document', 'Hide UI', 'Help']),
  entry('Linux', 'Ctrl + End', 'Go to end of document', ['Close app', 'End call', 'Exit fullscreen', 'Eject']),
  entry('Linux', 'Ctrl + Shift + F', 'Toggle fullscreen (many apps)', ['Find', 'Format', 'Filter', 'Focus address bar']),
  entry('Linux', 'F11', 'Toggle fullscreen', ['Refresh', 'Find', 'Developer tools', 'Format cell']),
  entry('Linux', 'Ctrl + Alt + D', 'Show desktop (some DEs)', ['Lock screen', 'Duplicate monitor', 'Delete file', 'Open display settings']),
  entry('Linux', 'Super + P', 'Display projection / monitor settings', ['Print', 'Pause system', 'Pin window', 'Project file']),
  entry('Linux', 'Ctrl + Alt + S', 'Open settings (some DEs)', ['Save file', 'Screenshot', 'Search', 'Suspend']),
];

// ── Cross-platform (browsers / editors — shown per OS modifier) ─────────────
const UNIVERSAL: ShortcutEntry[] = [
  entry('Universal', 'Ctrl/Cmd + C', 'Copy', ['Cut', 'Paste', 'Close', 'Undo']),
  entry('Universal', 'Ctrl/Cmd + V', 'Paste', ['Copy', 'Save', 'Print', 'Find']),
  entry('Universal', 'Ctrl/Cmd + Z', 'Undo', ['Redo', 'Save', 'Quit', 'Zoom']),
  entry('Universal', 'Ctrl/Cmd + Shift + Z', 'Redo', ['Undo', 'Save', 'Close', 'Find']),
  entry('Universal', 'Ctrl/Cmd + F', 'Find in page', ['Replace', 'Format', 'Filter', 'Fullscreen']),
  entry('Universal', 'Ctrl/Cmd + S', 'Save', ['Search', 'Sync', 'Sort', 'Screenshot']),
  entry('Universal', 'Ctrl/Cmd + P', 'Print', ['Paste', 'Preview', 'Pause', 'Properties']),
  entry('Universal', 'Ctrl/Cmd + W', 'Close tab', ['Quit app', 'New tab', 'Minimize', 'Wrap']),
  entry('Universal', 'Ctrl/Cmd + T', 'New tab', ['New window', 'Terminal', 'Toggle', 'Table']),
  entry('Universal', 'Ctrl/Cmd + Shift + T', 'Reopen closed tab', ['New tab', 'Close tab', 'Terminal', 'Tile tabs']),
  entry('Universal', 'Ctrl/Cmd + R', 'Refresh', ['Hard refresh', 'Redo', 'Run', 'Rename']),
  entry('Universal', 'Ctrl/Cmd + Shift + R', 'Hard refresh', ['Refresh', 'Restart', 'Record', 'Restore']),
  entry('Universal', 'Ctrl/Cmd + L', 'Focus address bar', ['Lock screen', 'Logout', 'Left align', 'Link']),
  entry('Universal', 'Ctrl/Cmd + D', 'Bookmark page', ['Delete', 'Download', 'Duplicate', 'Debug']),
  entry('Universal', 'Ctrl/Cmd + Plus', 'Zoom in', ['Zoom out', 'New tab', 'Paste', 'Print']),
  entry('Universal', 'Ctrl/Cmd + Minus', 'Zoom out', ['Zoom in', 'Minimize', 'Mute', 'Markdown']),
  entry('Universal', 'Ctrl/Cmd + 0', 'Reset zoom', ['Close tab', 'Open menu', 'OCR', 'Outline']),
  entry('Universal', 'Ctrl/Cmd + Shift + I', 'Open Developer Tools', ['Inspect element only', 'Import', 'Italic', 'Insert']),
  entry('Universal', 'Ctrl/Cmd + Shift + J', 'Open browser console', ['Debugger only', 'Journal', 'Join meeting', 'JSON view']),
  entry('Universal', 'Ctrl/Cmd + Shift + C', 'Inspect element', ['Copy path', 'Clear cache', 'Comment', 'Center']),
  entry('Universal', 'F11', 'Toggle fullscreen (most browsers)', ['Refresh', 'Find', 'Developer tools', 'Format']),
];

const ALL_ENTRIES: ShortcutEntry[] = [...windowsShortcutEntries, ...MACOS, ...LINUX, ...UNIVERSAL];

function toQuestion(entry: ShortcutEntry, reverse = false): ShortcutQuestion {
  if (!reverse) {
    return {
      platform: entry.platform,
      shortcut: entry.shortcut,
      correct: entry.correct,
      options: shuffle([entry.correct, ...shuffle(entry.distractors).slice(0, 3)]),
    };
  }

  const samePlatform = ALL_ENTRIES.filter((e) => e.platform === entry.platform && e.shortcut !== entry.shortcut);
  const distractorShortcuts = shuffle(samePlatform).slice(0, 3).map((e) => e.shortcut);

  return {
    platform: entry.platform,
    shortcut: `On ${entry.platform}, how do you: ${entry.correct}?`,
    correct: entry.shortcut,
    options: shuffle([entry.shortcut, ...distractorShortcuts]),
  };
}

function generateCrossPlatformCompareQuestions(): ShortcutQuestion[] {
  const out: ShortcutQuestion[] = [];
  const pairs: Array<[string, string, string, string]> = [
    ['Copy', 'Ctrl + C', 'Cmd + C', 'Ctrl + Shift + C'],
    ['Paste', 'Ctrl + V', 'Cmd + V', 'Ctrl + Shift + V'],
    ['Undo', 'Ctrl + Z', 'Cmd + Z', 'Ctrl + Shift + Z'],
    ['Save', 'Ctrl + S', 'Cmd + S', 'Ctrl + Alt + S'],
    ['Find', 'Ctrl + F', 'Cmd + F', 'Ctrl + Shift + F'],
    ['Close window', 'Alt + F4', 'Cmd + W', 'Ctrl + Q'],
    ['Lock screen', 'Win + L', 'Control + Cmd + Q', 'Ctrl + Alt + L'],
    ['Show desktop', 'Win + D', 'F11', 'Super + D'],
    ['Screenshot area', 'Win + Shift + S', 'Cmd + Shift + 4', 'Shift + PrtScn'],
    ['Open terminal', 'Win + X then I', 'Cmd + Space then type Terminal', 'Ctrl + Alt + T'],
    ['Switch apps', 'Alt + Tab', 'Cmd + Tab', 'Alt + Tab'],
    ['Open Run / command', 'Win + R', 'Cmd + Space', 'Alt + F2'],
    ['New tab', 'Ctrl + T', 'Cmd + T', 'Ctrl + T'],
    ['Hard refresh', 'Ctrl + Shift + R', 'Cmd + Shift + R', 'Ctrl + Shift + R'],
    ['Developer tools', 'Ctrl + Shift + I', 'Cmd + Option + I', 'Ctrl + Shift + I'],
  ];

  for (const [action, win, mac, linux] of pairs) {
    out.push({
      platform: 'Windows',
      shortcut: `Which shortcut ${action.toLowerCase()} on Windows?`,
      correct: win,
      options: shuffle([win, mac, linux, pick(['Ctrl + Y', 'Win + C', 'Alt + C', 'Ctrl + Shift + X'])]),
    });
    out.push({
      platform: 'macOS',
      shortcut: `Which shortcut ${action.toLowerCase()} on macOS?`,
      correct: mac,
      options: shuffle([mac, win, linux, pick(['Cmd + Y', 'Ctrl + C', 'Option + C', 'Cmd + Shift + X'])]),
    });
    out.push({
      platform: 'Linux',
      shortcut: `Which shortcut ${action.toLowerCase()} on Linux?`,
      correct: linux,
      options: shuffle([linux, win, mac, pick(['Ctrl + Y', 'Super + C', 'Alt + C', 'Ctrl + Shift + X'])]),
    });
  }
  return out;
}

let cached: ShortcutQuestion[] | null = null;

export function getShortcutQuestions(): ShortcutQuestion[] {
  if (cached) return cached;

  const forward = ALL_ENTRIES.map((e) => toQuestion(e, false));
  const reverse = ALL_ENTRIES.map((e) => toQuestion(e, true));
  const compare = generateCrossPlatformCompareQuestions();

  const seen = new Set<string>();
  cached = [...forward, ...reverse, ...compare].filter((q) => {
    const id = uniqueId([q.platform, q.shortcut, q.correct]);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return cached;
}

export function sampleShortcutQuiz(count = 15): ShortcutQuestion[] {
  return shuffle(getShortcutQuestions()).slice(0, count);
}

export const SHORTCUT_COUNTS = () => ({
  windows: WINDOWS.length,
  macos: MACOS.length,
  linux: LINUX.length,
  universal: UNIVERSAL.length,
  total: getShortcutQuestions().length,
});
