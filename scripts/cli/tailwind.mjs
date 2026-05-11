import fs from "node:fs";
import path from "node:path";

export const tailwindPackageJsonPatch = {
  devDependencies: {
    autoprefixer: "^10.4.20",
    postcss: "^8.4.49",
    tailwindcss: "^3.4.17"
  }
};

export const tailwindScaffoldFiles = [
  {
    path: "tailwind.config.cjs",
    content: `module.exports = {
  content: [
    "./src/**/*.purs",
    "./src/**/*.js",
    "./src/**/*.html"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
`
  },
  {
    path: "postcss.config.cjs",
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`
  },
  {
    path: path.join("styles", "tailwind.css"),
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-50 text-slate-950 antialiased;
  }
}
`
  },
  {
    path: path.join("public", ".gitkeep"),
    content: ""
  }
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

export function ensureTailwindScaffold(root) {
  mergePackageJson(root);

  for (const file of tailwindScaffoldFiles) {
    ensureTextFile(path.join(root, file.path), file.content);
  }
}
