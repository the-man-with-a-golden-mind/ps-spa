import { defineConfig } from "vite";
import { psSpaVite } from "ps-spa/scripts/vite-plugin.mjs";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), psSpaVite()]
});
