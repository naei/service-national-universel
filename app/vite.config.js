import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// eslint-disable-next-line no-unused-vars
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  return {

    port: 8081,
    plugins: [
      react({
        include: "**/*.{jsx,tsx}",
      }),
      // Put the Sentry vite plugin after all other plugins
      sentryVitePlugin({
        org: "sentry",
        project: env.MODE !== "staging" ? "snu-production" : "snu-staging",
        authToken: env.SENTRY_AUTH_TOKEN,
        url: "https://sentry.selego.co/",
        environment: "app",
        deploy: {
          env: "app",
        },
        validate: true,
        sourcemaps: {
          // Specify the directory containing build artifacts
          assets: "./**",
          // Don't upload the source maps of dependencies
          ignore: ["./node_modules/**"],
        },

        // Helps troubleshooting - set to false to make plugin less noisy
        debug: true,
      }),
    ],
  };
});
