import { localizeHtml } from './src/lib/page-metadata.ts';
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [tailwindcss(), solid(), { name: "localized-metadata", transformIndexHtml: (html) => localizeHtml(html) }],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
