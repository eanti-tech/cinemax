/**
 * CINEMAX Configuration File
 * 
 * - For CLIENT-side config: Values can be configured here directly or loaded via Vite environment variables.
 * - For SECURE serverless backend config: Sensitive keys (like Cloudflare R2 secrets) should be set as 
 *   environment variables in your Cloudflare Pages dashboard (or wrangler.toml/.dev.vars) to prevent exposing them in the client bundle.
 */

export const CONFIG = {
  // --- Admin Security Settings ---
  // The master passcode hash required to enter the Admin Control Room (bcrypt hash of '1094')
  ADMIN_PASSCODE_HASH: '$2b$10$dFLFX00DhfUHOvYG362sOOJFQTQyTpfAVac331Ei0WM5NxtjBRKJC',

  // --- Cloudflare Integration Settings ---
  // When you deploy to Cloudflare Pages, set these values to link with your serverless Workers & R2 Storage
  CLOUDFLARE: {
    // True if you want to route API calls to Cloudflare Workers / Pages Functions
    // If false, the app runs entirely in client-side IndexedDB sandbox mode
    USE_CLOUDFLARE_BACKEND: true, 

    // The base URL of your Cloudflare Pages Functions or Worker endpoint
    // e.g. 'https://api.cinemax.workers.dev' or '/api' (if using Pages Functions)
    API_BASE_URL: '/api',

    // R2 Public Bucket URL (for viewing transcoded video streams and thumbnails)
    // e.g. 'https://pub-your-bucket-id.r2.dev' or a custom domain like 'https://media.oanti.solutions'
    R2_PUBLIC_URL: 'https://pub-de822e8a49534634a82d15f5249a773e.r2.dev',
  },

  // --- Progressive Web App (PWA) Settings ---
  PWA: {
    enabled: true,
    themeColor: '#050505',
    backgroundColor: '#050505',
    appName: 'CINEMAX Stream',
    appShortName: 'CINEMAX',
    appDescription: 'On-Demand Adaptive HLS Video Streaming Sandbox & Offline Player.',
  }
};
