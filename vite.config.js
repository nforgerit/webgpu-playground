// vite.config.js

import { resolve } from 'node:path';

import glsl from 'vite-plugin-glsl';
import handlebars from 'vite-plugin-handlebars';

import { defineConfig } from 'vite'

const pageData = {
  '/index.html': {
    title: 'Main Page',
  },
  '/nested/subpage.html': {
    title: 'Sub Page',
  },
};

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shader: resolve(__dirname, 'shader/index.html'),
        acrossTheSystems: resolve(__dirname, 'skeleton/index.html'),
        applications: resolve(__dirname, 'applications/index.html'),
        grid: resolve(__dirname, 'applications/basic-grid/index.html'),
        coordinates: resolve(__dirname, 'learning/index.html'),
      },
    },
  },
  plugins: [glsl(
    {
      include: [                   // Glob pattern, or array of glob patterns to import
        '**/*.glsl', '**/*.wgsl',
        '**/*.vert', '**/*.frag',
        '**/*.vs', '**/*.fs'
      ],
      exclude: undefined,          // Glob pattern, or array of glob patterns to ignore
      warnDuplicatedImports: true, // Warn if the same chunk was imported multiple times
      defaultExtension: 'glsl',    // Shader suffix when no extension is specified
      compress: false,             // Compress output shader code
      watch: true,                 // Recompile shader on change
      root: '/'                    // Directory for root imports
    }),
    handlebars({
      partialDirectory: resolve(__dirname, './src/partials'),
      context(pagePath) {
        const p = String(pagePath).split('/').pop()
        return pageData[p];
      },
    }),
  ],
  lib: {
    formats: ['es']
  },
  worker: {
    format: 'es'
  }
})

