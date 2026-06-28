/**
 * Vite Plugin for Umami Analytics Environment Variable Injection
 * 
 * Replaces __UMAMI_WEBSITE_ID__ and __UMAMI_SCRIPT_URL__ placeholders
 * in index.html with values from environment variables.
 * 
 * Usage in vite.config.ts:
 *   import umamiPlugin from '../shared/vite-plugin-umami.js';
 *   export default defineConfig({
 *     plugins: [umamiPlugin()],
 *     // ... other config
 *   });
 * 
 * Environment variables:
 *   VITE_UMAMI_WEBSITE_ID - The Umami website UUID
 *   VITE_UMAMI_SCRIPT_URL - The Umami script URL (default: https://analytics.sebastianmorales.sbs/script.js)
 */

export default function umamiPlugin() {
  return {
    name: 'vite-plugin-umami',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const websiteId = process.env.VITE_UMAMI_WEBSITE_ID || '';
        const scriptUrl = process.env.VITE_UMAMI_SCRIPT_URL || 'https://analytics.sebastianmorales.sbs/script.js';
        
        if (!websiteId) {
          console.warn('[vite-plugin-umami] VITE_UMAMI_WEBSITE_ID not set');
          return html;
        }
        
        return html
          .replace(/__UMAMI_WEBSITE_ID__/g, websiteId)
          .replace(/__UMAMI_SCRIPT_URL__/g, scriptUrl);
      }
    }
  };
}
