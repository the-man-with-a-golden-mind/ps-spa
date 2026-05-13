import { defineConfig } from "vite";
import { psSpaVite } from "ps-spa/scripts/vite-plugin.mjs";

export default defineConfig({
  plugins: [psSpaVite()]
});
