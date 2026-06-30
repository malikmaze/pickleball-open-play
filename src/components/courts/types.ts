import type { PlayerGender } from "@/lib/player-gender";

export interface CourtPlayerInfo {
  name: string;
  skill?: string;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  gender?: PlayerGender;
  isYou?: boolean;
}
