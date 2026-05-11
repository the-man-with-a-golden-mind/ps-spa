export const INDEX_SEGMENT = "Index";
export const LEGACY_INDEX_SEGMENTS = new Set(["Home_", "HomeIndex"]);
export const DYNAMIC_SUFFIX = "Param";
export const LEGACY_DYNAMIC_SUFFIXES = ["_", "Dynamic"];

export function pascalToKebab(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function capitalize(input) {
  return input.length === 0 ? input : input[0].toUpperCase() + input.slice(1);
}

export function lowerFirst(input) {
  return input.length === 0 ? input : input[0].toLowerCase() + input.slice(1);
}

export function isIndexSegment(segment) {
  return segment === INDEX_SEGMENT || LEGACY_INDEX_SEGMENTS.has(segment);
}

export function isDynamicSegment(segment) {
  return (
    segment.endsWith(DYNAMIC_SUFFIX) ||
    LEGACY_DYNAMIC_SUFFIXES.some((suffix) => segment.endsWith(suffix))
  );
}

export function dynamicSegmentBase(segment) {
  if (segment.endsWith(DYNAMIC_SUFFIX)) {
    return segment.slice(0, -DYNAMIC_SUFFIX.length);
  }

  if (segment.endsWith("_")) {
    return segment.slice(0, -1);
  }

  if (segment.endsWith("Dynamic")) {
    return segment.slice(0, -"Dynamic".length);
  }

  return segment;
}

export function segmentToParamName(segment) {
  return lowerFirst(dynamicSegmentBase(segment));
}

export function normalizeFileSegment(segment) {
  if (isIndexSegment(segment)) return INDEX_SEGMENT;
  if (isDynamicSegment(segment)) return `${dynamicSegmentBase(segment)}${DYNAMIC_SUFFIX}`;
  return segment;
}

export function routeSegmentToFilePart(segment) {
  if (segment.startsWith(":")) {
    return `${capitalize(segment.slice(1))}${DYNAMIC_SUFFIX}`;
  }

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join("");
}

export function segmentToRoutePart(segment) {
  const normalized = normalizeFileSegment(segment);

  if (normalized === INDEX_SEGMENT) return "";
  if (isDynamicSegment(normalized)) {
    return `:${segmentToParamName(normalized)}`;
  }

  return pascalToKebab(normalized);
}
