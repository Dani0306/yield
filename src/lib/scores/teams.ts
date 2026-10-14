// Team names are written differently by each source ("Sportivo Barracas"
// vs "CS Barracas", "Quindio" vs "Deportes Quindio"), so teams are compared
// by their meaningful words.

// Words that say nothing about which club it is.
const FILLER = new Set([
  "fc",
  "cf",
  "sc",
  "cs",
  "cd",
  "ca",
  "ac",
  "afc",
  "afbc",
  "se",
  "club",
  "de",
  "del",
  "la",
  "el",
  "los",
  "the",
  "deportivo",
  "deportes",
  "deportiva",
  "atletico",
  "atl",
  "sportivo",
  "def",
  "defensores",
  "jrs",
  "juniors",
  "reserve",
  "reserves",
  "women",
]);

// "Atl. Tucumán" → {"tucuman"}; "Newell's Old Boys" → {"newells", "old", "boys"}.
export const teamWords = (name: string) =>
  new Set(
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !FILLER.has(word)),
  );
