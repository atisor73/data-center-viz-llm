import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const repoName =
  process.env.VITE_BASE_PATH?.replace(/^\/|\/$/g, '') ||
  process.env.GITHUB_REPOSITORY?.split('/')[1] ||
  'data-center-viz-llm'

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  base: command === 'build' && process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}))
