import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
    include: /\.(tsx?|jsx?)$/,
    exclude: [],
    loader: "jsx",
  },
  publicDir: "public",
  // server: {
  //   port: 3000,
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:8080",
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/api/, ""),
  //     },
  //   },
  // },
});
