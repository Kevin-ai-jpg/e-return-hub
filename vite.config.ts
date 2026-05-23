// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      // Proxies browser requests to a local Flask API (avoids CORS in dev).
      // Set VITE_CHAT_API_URL=/api/chat in .env when using this proxy.
      proxy: {
        "/api/chat": {
          target: process.env.CHAT_API_PROXY_TARGET ?? "http://127.0.0.1:5000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, "/chat"),
        },
      },
    },
  },
});
