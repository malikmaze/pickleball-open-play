import type { Player } from "@/types";
import type { QueuePlayer } from "@/lib/queue/queue-engine";

export function getMutualPartner(
  player: Pick<QueuePlayer, "id" | "partnerId">,
  pool: Pick<QueuePlayer, "id" | "partnerId">[]
): QueuePlayer | null {
  if (!player.partnerId) return null;
  const partner = pool.find((p) => p.id === player.partnerId);
  if (!partner || partner.partnerId !== player.id) return null;
  return partner as QueuePlayer;
}

export function getPartnerDisplayName(
  player: Pick<Player, "id" | "partnerId">,
  players: Pick<Player, "id" | "name" | "partnerId">[]
): string | null {
  if (!player.partnerId) return null;
  const partner = players.find((p) => p.id === player.partnerId);
  if (!partner) return null;
  if (partner.partnerId === player.id) return partner.name;
  return `${partner.name} (pending)`;
}

export function listMutualPairs(
  players: Pick<Player, "id" | "name" | "partnerId">[]
): { a: Player; b: Player }[] {
  const seen = new Set<string>();
  const pairs: { a: Player; b: Player }[] = [];

  for (const player of players) {
    if (!player.partnerId || seen.has(player.id)) continue;
    const partner = players.find((p) => p.id === player.partnerId);
    if (!partner || partner.partnerId !== player.id) continue;
    seen.add(player.id);
    seen.add(partner.id);
    pairs.push({ a: player as Player, b: partner as Player });
  }

  return pairs;
}

export type QueueDisplayGroup<T extends Pick<QueuePlayer, "id" | "partnerId">> =
  | { kind: "solo"; player: T; index: number }
  | { kind: "pair"; players: [T, T]; startIndex: number };

/** Split an ordered queue into solo rows and adjacent partner pairs for display. */
export function groupAdjacentQueuePartners<
  T extends Pick<QueuePlayer, "id" | "partnerId">,
>(players: T[]): QueueDisplayGroup<T>[] {
  const groups: QueueDisplayGroup<T>[] = [];
  let i = 0;

  while (i < players.length) {
    const player = players[i];
    const next = players[i + 1];
    const linked =
      next && getMutualPartner(player, players)?.id === next.id ? next : null;

    if (linked) {
      groups.push({ kind: "pair", players: [player, linked], startIndex: i });
      i += 2;
    } else {
      groups.push({ kind: "solo", player, index: i });
      i += 1;
    }
  }

  return groups;
}

export function partnerOptionsFor(
  playerId: string,
  players: Pick<Player, "id" | "name" | "status">[]
): Pick<Player, "id" | "name">[] {
  return players
    .filter((p) => p.id !== playerId && p.status !== "Waitlisted")
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Move the higher-priority player down to wait with their partner.
 * e.g. #3 linked to #7 → … #6, #3, #7 (not #3 ahead of #4–#6).
 */
export function orderQueueForPartners(
  sorted: QueuePlayer[],
  pool: QueuePlayer[] = sorted
): QueuePlayer[] {
  const result = [...sorted];
  const seen = new Set<string>();
  const moves: { earlierId: string; laterId: string }[] = [];

  for (const player of sorted) {
    if (seen.has(player.id)) continue;
    const partner = getMutualPartner(player, pool);
    if (!partner) continue;

    seen.add(player.id);
    seen.add(partner.id);

    const playerIdx = result.findIndex((p) => p.id === player.id);
    const partnerIdx = result.findIndex((p) => p.id === partner.id);
    if (playerIdx === -1 || partnerIdx === -1) continue;

    const earlierId =
      playerIdx < partnerIdx ? player.id : partner.id;
    const laterId = playerIdx < partnerIdx ? partner.id : player.id;
    const earlierIdx = Math.min(playerIdx, partnerIdx);
    const laterIdx = Math.max(playerIdx, partnerIdx);

    if (laterIdx - earlierIdx !== 1) {
      moves.push({ earlierId, laterId });
    }
  }

  // Apply from the back so indices stay stable.
  moves.sort((a, b) => {
    const aLater = result.findIndex((p) => p.id === a.laterId);
    const bLater = result.findIndex((p) => p.id === b.laterId);
    return bLater - aLater;
  });

  for (const { earlierId, laterId } of moves) {
    const earlierIdx = result.findIndex((p) => p.id === earlierId);
    const laterIdx = result.findIndex((p) => p.id === laterId);
    if (earlierIdx === -1 || laterIdx === -1) continue;
    if (laterIdx - earlierIdx === 1) continue;

    const [earlier] = result.splice(earlierIdx, 1);
    const insertAt = result.findIndex((p) => p.id === laterId);
    result.splice(insertAt, 0, earlier);
  }

  return result;
}

/** Queue as solo slots or inseparable partner pairs (in display order). */
export function buildQueueUnits(queue: QueuePlayer[]): QueuePlayer[][] {
  const seen = new Set<string>();
  const units: QueuePlayer[][] = [];

  for (const player of queue) {
    if (seen.has(player.id)) continue;
    const partner = getMutualPartner(player, queue);
    if (partner) {
      units.push([player, partner]);
      seen.add(player.id);
      seen.add(partner.id);
    } else {
      units.push([player]);
      seen.add(player.id);
    }
  }

  return units;
}

/** First valid group of exactly four players, keeping partner pairs together. */
export function pickFourFromQueueUnits(
  units: QueuePlayer[][]
): QueuePlayer[] | null {
  const memo = new Map<string, QueuePlayer[] | null>();

  function search(idx: number, selected: QueuePlayer[]): QueuePlayer[] | null {
    if (selected.length === 4) return selected;
    if (idx >= units.length) return null;

    const key = `${idx}:${selected.map((p) => p.id).join(",")}`;
    if (memo.has(key)) return memo.get(key)!;

    const unit = units[idx];
    let result: QueuePlayer[] | null = null;

    if (selected.length + unit.length <= 4) {
      result = search(idx + 1, [...selected, ...unit]);
    }
    if (!result) {
      result = search(idx + 1, selected);
    }

    memo.set(key, result);
    return result;
  }

  return search(0, []);
}
