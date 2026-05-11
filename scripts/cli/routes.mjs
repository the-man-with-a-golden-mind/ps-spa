import fs from "node:fs";
import path from "node:path";

import {
  INDEX_SEGMENT,
  capitalize,
  isDynamicSegment,
  normalizeFileSegment,
  routeSegmentToFilePart,
  segmentToParamName,
  segmentToRoutePart
} from "./naming.mjs";

export function routeToFileSegments(route) {
  if (route === "/") return [INDEX_SEGMENT];

  return route
    .split("/")
    .filter(Boolean)
    .map(routeSegmentToFilePart);
}

export function routeToPageFile(route) {
  return path.join("src", "Pages", `${path.join(...routeToFileSegments(route))}.purs`);
}

export function pageFileToRouteInfo(relativeFilePath) {
  const withoutPrefix = relativeFilePath.replace(/^src\/Pages\//, "");
  const withoutExtension = withoutPrefix.replace(/\.purs$/, "");
  const rawSegments = withoutExtension.split(path.sep);
  const segments = rawSegments.map(normalizeFileSegment);
  const lastSegment = segments[segments.length - 1];

  if (lastSegment === "NotFound") {
    return {
      constructor: "NotFound",
      dynamicParams: [],
      isNotFound: true,
      moduleName: `Pages.${segments.join(".")}`,
      pageFile: relativeFilePath,
      path: null,
      routePattern: "/not-found",
      routeSegments: []
    };
  }

  const routeParts = segments.map(segmentToRoutePart).filter(Boolean);
  const dynamicParams = segments.filter(isDynamicSegment).map(segmentToParamName);

  return {
    constructor: segments.join(""),
    dynamicParams,
    isNotFound: false,
    moduleName: `Pages.${segments.join(".")}`,
    pageFile: relativeFilePath,
    path: routeParts.length === 0 ? "/" : `/${routeParts.join("/")}`,
    routePattern: routeParts.length === 0 ? "/" : `/${routeParts.join("/")}`,
    routeSegments: segments
  };
}

export function compareRoutes(left, right) {
  if (left.isNotFound && !right.isNotFound) return 1;
  if (!left.isNotFound && right.isNotFound) return -1;
  if (left.routeSegments.length !== right.routeSegments.length) {
    return right.routeSegments.length - left.routeSegments.length;
  }

  if (left.dynamicParams.length !== right.dynamicParams.length) {
    return left.dynamicParams.length - right.dynamicParams.length;
  }

  return left.constructor.localeCompare(right.constructor);
}

export function scanPages(root) {
  const pagesDir = path.join(root, "src", "Pages");
  if (!fs.existsSync(pagesDir)) return [];

  const results = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".purs")) {
        const relative = path.relative(root, absolutePath);
        results.push(pageFileToRouteInfo(relative));
      }
    }
  }

  walk(pagesDir);
  return results.sort(compareRoutes);
}

export function titleFromRoute(route) {
  if (route === "/") return "Home";

  return route
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(":")) {
        return capitalize(segment.slice(1));
      }

      return segment
        .split("-")
        .filter(Boolean)
        .map((part) => capitalize(part))
        .join(" ");
    })
    .join(" ");
}
