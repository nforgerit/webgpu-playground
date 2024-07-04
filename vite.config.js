// vite.config.js

import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  lib: {
    formats: ['es']
  },
  worker: {
    format: 'es'
  }
})

