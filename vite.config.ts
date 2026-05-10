import { defineConfig, loadEnv } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_singleFetch: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      tsconfigPaths(),
    ],
    define: {
      'import.meta.env.PUBLIC_GOOGLE_CLIENT_ID': JSON.stringify(env.PUBLIC_GOOGLE_CLIENT_ID),
    },
    // NOTE on uploads/ in dev:
    //   In dev (`npm run dev`), Vite's filesystem middleware serves any
    //   project-root file matching the request URL — that means
    //   /uploads/<...> bypasses our Remix splat route at
    //   app/routes/uploads.$.tsx in dev. This is a Vite-only quirk;
    //   `server.fs.deny` does not apply to URL routing.
    //   In production (`npm run start` → remix-serve) Vite is gone and the
    //   Remix loader IS the only handler, so the extension whitelist and
    //   traversal checks are enforced there. Security tests pass in prod.
    //   Don't rely on dev to validate /uploads/* security behavior.
  };
});
