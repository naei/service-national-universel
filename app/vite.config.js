import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs/promises";

export default defineConfig({
  build: {
    // Relative to the root
    outDir: "../dist",
  },
  plugins: [
    // …
    react({
      // Use React plugin in all *.jsx and *.tsx files
      include: "**/*.{js,jsx,tsx}",
    }),
  ],

  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    // loader: "tsx",
    // include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: "load-js-files-as-jsx",
          setup(build) {
            build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => ({
              loader: "jsx",
              contents: await fs.readFile(args.path, "utf8"),
            }));
          },
        },
      ],
    },
  },
  publicDir: "public",
});
