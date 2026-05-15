import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const KINDS = new Set(["patch", "minor", "major"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function readCurrentVersion(root) {
  const packageJson = readJson(path.join(root, "package.json"));
  if (typeof packageJson.version !== "string") {
    throw new Error(`Missing "version" field in ${path.join(root, "package.json")}`);
  }

  return packageJson.version;
}

export function extractSpagoPublishVersion(content) {
  const publishMatch = content.match(/^[ \t]*publish:\s*$/m);
  if (!publishMatch) return null;

  const startIndex = publishMatch.index + publishMatch[0].length;
  const slice = content.slice(startIndex, startIndex + 1000);
  const versionMatch = slice.match(/^[ \t]+version:\s*(\S+)\s*$/m);
  return versionMatch ? versionMatch[1] : null;
}

function incrementVersion(currentVersion, kind) {
  const match = SEMVER_PATTERN.exec(currentVersion);
  if (!match) {
    throw new Error(`Cannot bump "${currentVersion}" — it is not a valid semver string.`);
  }

  const [, majorRaw, minorRaw, patchRaw] = match;
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);

  switch (kind) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unknown bump kind "${kind}". Expected patch, minor, or major.`);
  }
}

function resolveTargetVersion(currentVersion, target) {
  if (KINDS.has(target)) {
    return incrementVersion(currentVersion, target);
  }

  if (!SEMVER_PATTERN.test(target)) {
    throw new Error(
      `Invalid version "${target}". Expected a semver string (e.g. 1.2.3) or one of: patch, minor, major.`
    );
  }

  return target;
}

function writePackageJsonVersion(filePath, nextVersion) {
  const packageJson = readJson(filePath);
  packageJson.version = nextVersion;
  fs.writeFileSync(filePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function writeSpagoYamlVersion(filePath, currentVersion, nextVersion) {
  const original = fs.readFileSync(filePath, "utf8");
  const escapedCurrent = currentVersion.replace(/[.+\-]/g, (character) => `\\${character}`);
  const pattern = new RegExp(`(^\\s+version:\\s*)${escapedCurrent}(\\s*$)`, "m");

  if (!pattern.test(original)) {
    throw new Error(
      `Could not find "version: ${currentVersion}" in ${filePath}. The publish.version field may be missing or set to a different value.`
    );
  }

  const updated = original.replace(pattern, `$1${nextVersion}$2`);
  fs.writeFileSync(filePath, updated);
}

function gitOutput(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  }).trim();
}

function gitInherit(args, cwd) {
  execFileSync("git", args, { cwd, stdio: "inherit" });
}

function isGitRepository(root) {
  try {
    gitOutput(["rev-parse", "--git-dir"], root);
    return true;
  } catch {
    return false;
  }
}

function assertCleanExceptVersionFiles(root, files) {
  const allowed = new Set(files);
  const porcelain = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  });

  // Porcelain format is "XY <path>" — never strip leading whitespace, X is often a space.
  const dirty = porcelain
    .split("\n")
    .filter((line) => line.length >= 4)
    .map((line) => line.slice(3))
    .filter((entry) => !allowed.has(entry));

  if (dirty.length > 0) {
    throw new Error(
      `Working tree has uncommitted changes beyond the version files:\n  ${dirty.join("\n  ")}\nCommit or stash them before bumping.`
    );
  }
}

function commitAndTag(root, files, nextVersion, { tag }) {
  gitInherit(["add", ...files], root);
  gitInherit(["commit", "-m", `v${nextVersion}`], root);

  if (tag) {
    gitInherit(["tag", `v${nextVersion}`], root);
  }
}

export function bumpVersion(root, target, options = {}) {
  const { commit = false, tag = false } = options;
  const shouldCommit = commit || tag;

  const packageJsonPath = path.join(root, "package.json");
  const spagoYamlPath = path.join(root, "spago.yaml");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Missing ${packageJsonPath}`);
  }
  if (!fs.existsSync(spagoYamlPath)) {
    throw new Error(`Missing ${spagoYamlPath}`);
  }

  const currentVersion = readCurrentVersion(root);
  const nextVersion = resolveTargetVersion(currentVersion, target);

  if (currentVersion === nextVersion) {
    return {
      currentVersion,
      nextVersion,
      changed: false,
      committed: false,
      tagged: false,
      files: []
    };
  }

  const files = [
    path.relative(root, packageJsonPath),
    path.relative(root, spagoYamlPath)
  ];

  // Validate git state BEFORE writing, so a refusal doesn't leave half-written files.
  if (shouldCommit) {
    if (!isGitRepository(root)) {
      throw new Error(`${root} is not a git repository; cannot --commit or --tag.`);
    }
    assertCleanExceptVersionFiles(root, files);
  }

  writePackageJsonVersion(packageJsonPath, nextVersion);
  writeSpagoYamlVersion(spagoYamlPath, currentVersion, nextVersion);

  if (shouldCommit) {
    commitAndTag(root, files, nextVersion, { tag });
  }

  return {
    currentVersion,
    nextVersion,
    changed: true,
    committed: shouldCommit,
    tagged: tag,
    files
  };
}
