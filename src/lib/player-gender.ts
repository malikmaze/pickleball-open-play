export type PlayerGender = "female" | "male";

const FEMALE_NAMES = new Set([
  "mia",
  "jenna",
  "alexis",
  "sophie",
  "taylor",
  "chloe",
  "ruby",
  "maya",
  "tess",
  "stella",
  "daisy",
  "lily",
  "jamie",
  "quinn",
  "avery",
  "drew",
  "skyler",
  "reese",
  "parker",
  "blake",
  "tessa",
  "skye",
  "nora",
  "zoe",
]);

const MALE_NAMES = new Set([
  "jordan",
  "alex",
  "sam",
  "morgan",
  "casey",
  "riley",
  "morgan",
]);

export function getPlayerGender(name: string): PlayerGender {
  const key = name.trim().toLowerCase().replace(/^test\s+/, "");
  if (MALE_NAMES.has(key)) return "male";
  if (FEMALE_NAMES.has(key)) return "female";
  if (name.toLowerCase().includes("test")) return "female";
  return "female";
}
