/** Yields to the browser so React can paint before heavy synchronous work. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    const sched = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (sched?.yield) {
      void sched.yield().then(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}
