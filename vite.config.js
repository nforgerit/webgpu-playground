// vite.config.js

import { defineConfig } from 'vite'

export default defineConfig({
  lib: {
    formats: ['es']
  },
  worker: {
    format: 'es'
  }
})

