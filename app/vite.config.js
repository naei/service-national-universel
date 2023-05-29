import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  port: 8081,
  plugins: [
    react({
      include: "**/*.{jsx,tsx}",
    }),
  ],
});
