import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const appUrl = import.meta.env.VITE_APP_URL || '(not set)'
  const apiUrl = import.meta.env.VITE_API_URL || '(not set)'

  return (
    <>
      <img src="/favicon.svg" alt="Roboticela DevKit" className="app-logo" />
      <h1>Roboticela DevKit</h1>
      <section
        className="mx-auto mt-6 w-full max-w-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-left text-sm text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        aria-labelledby="env-config-heading"
      >
        <h2 id="env-config-heading" className="mb-2 text-base font-semibold">
          Build-time environment
        </h2>
        <dl className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:gap-x-3 sm:gap-y-2">
          <dt className="font-medium text-neutral-600 dark:text-neutral-400">APP_URL</dt>
          <dd className="min-w-0 break-all font-mono text-neutral-900 dark:text-neutral-100">
            {appUrl}
            <span className="mt-0.5 block text-xs font-sans font-normal text-neutral-500 dark:text-neutral-400">
              Frontend / app base URL (from <code className="font-mono">VITE_APP_URL</code> or{' '}
              <code className="font-mono">APP_URL</code>)
            </span>
          </dd>
          <dt className="font-medium text-neutral-600 dark:text-neutral-400">API_URL</dt>
          <dd className="min-w-0 break-all font-mono text-neutral-900 dark:text-neutral-100">
            {apiUrl}
            <span className="mt-0.5 block text-xs font-sans font-normal text-neutral-500 dark:text-neutral-400">
              Backend server URL (from <code className="font-mono">VITE_API_URL</code> or{' '}
              <code className="font-mono">API_URL</code>)
            </span>
          </dd>
        </dl>
      </section>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  )
}

export default App
