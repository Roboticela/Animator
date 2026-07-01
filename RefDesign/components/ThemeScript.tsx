export function ThemeScript() {
  const codeToRun = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: codeToRun }}
      suppressHydrationWarning
    />
  );
}

