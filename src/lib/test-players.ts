/** Names used when wiring sample matches after seeding players. */
export const SAMPLE_MATCH_PLAYERS = {
  court1: {
    teamA: ["Mia", "Jenna"] as const,
    teamB: ["Alexis", "Sophie"] as const,
    scoreA: 11,
    scoreB: 8,
  },
  court2: {
    teamA: ["Taylor", "Chloe"] as const,
    teamB: ["Ruby", "Maya"] as const,
  },
  court3: {
    teamA: ["Tess", "Stella"] as const,
    teamB: ["Daisy", "Lily"] as const,
    scoreA: 9,
    scoreB: 10,
  },
} as const;

export function isTestPlayerName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("test") ||
    ["tess", "stella", "daisy", "lily", "tessa", "skye", "nora", "zoe"].includes(
      n
    )
  );
}
