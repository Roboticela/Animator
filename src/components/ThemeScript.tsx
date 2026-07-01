const STORAGE_KEY = "animator:theme";

export function ThemeScript() {
  const codeToRun = `
    (function() {
      try {
        const theme = localStorage.getItem('${STORAGE_KEY}') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: codeToRun }} suppressHydrationWarning />;
}
