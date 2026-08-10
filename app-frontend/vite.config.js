import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: '/static/' matches Django's STATIC_URL — asset references in the
// built index.html need this prefix for whitenoise to serve them correctly.
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    // manifest.json lets Django find hashed filenames if ever needed.
    manifest: true,
  },
})
