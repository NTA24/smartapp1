import type { ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ensure .wasm served with correct MIME during dev (decoder resource loading)
function wasmMimePlugin() {
  return {
    name: 'wasm-mime',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
        if (req.url?.split('?')[0]?.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm')
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasmMimePlugin()],
})
