import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import "./App.css"

import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppPreferencesProvider } from '@/contexts/AppPreferencesContext'
import { HandProvider } from '@/contexts/HandContext'
import { FullscreenProvider } from '@/contexts/FullscreenContext'
import { MouseProvider } from '@/contexts/MouseContext'
import { ArrowProvider } from '@/contexts/ArrowContext'
import { KeyboardViewProvider } from '@/contexts/KeyboardViewContext'
import { KeyboardSyncProvider } from '@/contexts/KeyboardSyncContext'
import { KeyboardTypeProvider } from '@/contexts/KeyboardTypeContext'
import { FnShortcutProvider } from '@/contexts/FnShortcutContext'
import { KeyboardLockProvider } from '@/contexts/KeyboardLockContext'
import { KeyboardInputProvider } from '@/contexts/KeyboardInputContext'
import { FnFunctionProvider } from '@/contexts/FnFunctionContext'
import { SystemStateProvider } from '@/contexts/SystemStateContext'
import { TypingHandsProvider } from '@/contexts/TypingHandsContext'
import { StatusControlsProvider } from '@/contexts/StatusControlsContext'
import { AppResetProvider } from '@/contexts/AppResetContext'
import AppPreferencesPersistence from '@/components/AppPreferencesPersistence'
import { ThemeScript } from '@/components/ThemeScript'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeScript />
      <ThemeProvider>
        <AppPreferencesProvider>
          <BrowserRouter>
            <HandProvider>
              <FullscreenProvider>
                <MouseProvider>
                  <ArrowProvider>
                    <KeyboardViewProvider>
                      <KeyboardSyncProvider>
                        <KeyboardTypeProvider>
                          <FnShortcutProvider>
                            <KeyboardLockProvider>
                              <KeyboardInputProvider>
                                <FnFunctionProvider>
                                  <SystemStateProvider>
                                    <TypingHandsProvider>
                                      <StatusControlsProvider>
                                        <AppResetProvider>
                                          <AppPreferencesPersistence />
                                          <App />
                                        </AppResetProvider>
                                      </StatusControlsProvider>
                                    </TypingHandsProvider>
                                  </SystemStateProvider>
                                </FnFunctionProvider>
                              </KeyboardInputProvider>
                            </KeyboardLockProvider>
                          </FnShortcutProvider>
                        </KeyboardTypeProvider>
                      </KeyboardSyncProvider>
                    </KeyboardViewProvider>
                  </ArrowProvider>
                </MouseProvider>
              </FullscreenProvider>
            </HandProvider>
          </BrowserRouter>
        </AppPreferencesProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
