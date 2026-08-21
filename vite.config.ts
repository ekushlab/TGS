import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Relative base so the built assets resolve correctly both when hosted
    // at a domain root AND when loaded from file:///android_asset/www/ inside
    // the Android WebView wrapper (absolute "/assets/..." paths break there).
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Chromium (and therefore Android WebView, on every version) refuses
      // to fetch <script type="module"> / dynamic import() over file://
      // URLs -- it treats a file:// page as a null/opaque origin and blocks
      // the module fetch as cross-origin. Since this app is loaded from
      // file:///android_asset/www/index.html, Vite's default ES-module-only
      // build never executes there: the page just stays blank. This plugin
      // builds a second, classic-script ("nomodule") + SystemJS-loader
      // bundle, and Vite's own generated bootstrap script always prefers
      // that legacy bundle when location.protocol === "file:" -- so it
      // fixes the white screen regardless of how modern the device's
      // WebView actually is. Also gives real coverage on genuinely old
      // WebViews (budget/Go-edition phones like the Infinix Smart Plus).
      legacy({
        targets: ['defaults', 'Android >= 4.4', 'iOS >= 9'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
