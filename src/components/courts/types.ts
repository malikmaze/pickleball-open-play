import type { PlayerGender } from "@/lib/player-gender";

export interface CourtPlayerInfo {
  name: string;
  skill?: string;
  gamesPlayed?: number;
  gender?: PlayerGender;
  isYou?: boolean;
}
