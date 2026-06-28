/**
 * Vite Plugin for Umami Analytics Environment Variable Injection
 * 
 * Replaces __UMAMI_WEBSITE_ID__ and __UMAMI_SCRIPT_URL__ placeholders
 * in index.html with values from environment variables.
 * 
 * Environment variables:
 *   VITE_UMAMI_WEBSITE_ID - The Umami website UUID
 *   VITE_UMAMI_SCRIPT_URL - The Umami script URL (default: https://analytics.sebastianmorales.sbs/script.js)
 */

import { loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

export default function umamiPlugin() {
  return {
    name: 'vite-plugin-umami',
    configResolved(config) {
      // Load .env file values
      const env = loadEnv(config.mode, config.root, '');
      this.websiteId = env.VITE_UMAMI_WEBSITE_ID || process.env.VITE_UMAMI_WEBSITE_ID || '';
      this.scriptUrl = env.VITE_UMAMI_SCRIPT_URL || process.env.VITE_UMAMI_SCRIPT_URL || 'https://analytics.sebastianmorales.sbs/script.js';
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!this.websiteId) {
          console.warn('[vite-plugin-umami] VITE_UMAMI_WEBSITE_ID not set');
          return html;
        }
        
        return html
          .replace(/__UMAMI_WEBSITE_ID__/g, this.websiteId)
          .replace(/__UMAMI_SCRIPT_URL__/g, this.scriptUrl);
      }
    }
  };
}
