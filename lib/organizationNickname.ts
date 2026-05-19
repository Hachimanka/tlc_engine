const ORGANIZATION_ACRONYM_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "de",
  "del",
  "for",
  "in",
  "mga",
  "ng",
  "of",
  "sa",
  "the",
  "to",
]);

const normalizeOrganizationWords = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const buildOrganizationAcronym = (name: string) => {
  const words = normalizeOrganizationWords(name);
  const acronym = words
    .filter((word) => !ORGANIZATION_ACRONYM_STOP_WORDS.has(word))
    .map((word) => word[0])
    .join("");

  if (acronym) {
    return acronym;
  }

  return words[0]?.slice(0, 3) || "org";
};
