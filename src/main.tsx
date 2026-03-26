import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initMiniAppDevtools, initMiniAppTracing, initMiniAppVConsole } from './miniapp/lib/enableDevtools'

void initMiniAppDevtools()
void initMiniAppVConsole()
initMiniAppTracing()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
