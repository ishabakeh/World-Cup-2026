import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// `base` lets the same build work on Netlify ("/") and GitHub Pages ("/<repo>/").
// Set VITE_BASE=/WC26/ in the GitHub Actions deploy; defaults to "/" everywhere else.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
