import fs from "node:fs";
import path from "node:path";

export const tailwindPackageJsonPatch = {
  devDependencies: {
    tailwindcss: "^4.3.0",
    "@tailwindcss/vite": "^4.3.0"
  }
};

export const tailwindScaffoldFiles = [
  {
    path: path.join("styles", "tailwind.css"),
    content: `@import "tailwindcss";

@layer base {
  body {
    @apply bg-slate-50 text-slate-950 antialiased;
  }
}
`
  }
];

export const tailwindObsoleteFiles = [
  "tailwind.config.cjs",
  "tailwind.config.js",
  "postcss.config.cjs",
  "postcss.config.js"
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureTextFile(filePath, contents) {
  if (fs.existsSync(filePath)) return;
  ensureDir(filePath);
  fs.writeFileSync(filePath, contents);
}

function mergePackageJson(root) {
  const filePath = path.join(root, "package.json");
  const baseline = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : { name: "ps-spa", private: true, type: "module", scripts: {} };

  baseline.scripts = { ...(baseline.scripts ?? {}) };
  baseline.devDependencies = {
    ...(baseline.devDependencies ?? {}),
    ...tailwindPackageJsonPatch.devDependencies
  };

  fs.writeFileSync(filePath, `${JSON.stringify(baseline, null, 2)}\n`);
}

function patchViteConfigForTailwind(content) {
  if (content.includes("@tailwindcss/vite")) {
    return { content, changed: false, reason: "already-patched" };
  }

  const importInsertion = content.replace(
    /(import \{ psSpaVite \} from "ps-spa\/scripts\/vite-plugin\.mjs";\n)/,
    `$1import tailwindcss from "@tailwindcss/vite";\n`
  );

  if (importInsertion === content) {
    return { content, changed: false, reason: "no-anchor-import" };
  }

  const pluginsInsertion = importInsertion.replace(
    /plugins:\s*\[\s*psSpaVite\(\)\s*\]/,
    "plugins: [tailwindcss(), psSpaVite()]"
  );

  if (pluginsInsertion === importInsertion) {
    return { content, changed: false, reason: "no-anchor-plugins" };
  }

  return { content: pluginsInsertion, changed: true, reason: "patched" };
}

function patchViteConfig(root) {
  const filePath = path.join(root, "vite.config.mjs");
  if (!fs.existsSync(filePath)) return;

  const original = fs.readFileSync(filePath, "utf8");
  const result = patchViteConfigForTailwind(original);

  if (result.changed) {
    fs.writeFileSync(filePath, result.content);
  }
}

export function ensureTailwindScaffold(root) {
  mergePackageJson(root);
  patchViteConfig(root);

  for (const file of tailwindScaffoldFiles) {
    ensureTextFile(path.join(root, file.path), file.content);
  }
}
