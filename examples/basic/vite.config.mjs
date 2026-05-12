import { defineConfig } from "vite";
import { psSpaVite } from "../../scripts/vite-plugin.mjs";

export default defineConfig({
  plugins: [psSpaVite()]
});
