// The shapes the KNRB routes in server/api/knrb send to the page (not foys' raw shapes): only what
// the page shows. A failure is a 4xx or 5xx status with an ApiError body.

// GET /api/knrb/search?query=  (sorted by name, then id)
export interface SearchResponse {
  items: PersonResult[];
}

export interface PersonResult {
  personId: string;
  fullName: string;
  clubName: string | null;
}

// GET /api/knrb/person?id=
export interface Person {
  personId: string;
  fullName: string;
  club: string | null;
  yearOfBirth: number | null;
  totalScullingPoints: number;
  totalSweepingPoints: number;
  stats: PersonStats;
  tournaments: Tournament[];
}

export interface PersonStats {
  // Events won: one crew in one match, decided by its main race (isWin in the person route).
  wins: number;
}

export interface Tournament {
  tournamentId: number | null;
  tournamentName: string;
  firstTournamentDate: string | null;
  lastTournamentDate: string | null;
  // One entry per event, its highest round first.
  races: Race[];
}

export interface RaceResult {
  raceId: number;
  tournamentId: number;
  matchCode: string;
  matchName: string;
  raceName: string;
  teamName: string;
  // null when the crew did not start or finish, or was not ranked.
  position: number | null;
  endTime: number | null;
}

export interface Race extends RaceResult {
  won: boolean;
  preliminaries: RaceResult[];
}

// GET /api/knrb/round?tournamentId=&raceId=
export interface Round {
  raceId: number;
  name: string;
  distance: number | null;
  teams: RaceTeam[];
}

export interface RaceTeam {
  id: number | null;
  name: string;
  lane: number | null;
  position: number | null;
  // The corrected time when there is one (after a penalty or a bonus), else the measured time.
  time: number | null;
  didNotStart: boolean;
  didNotFinish: boolean;
  times: RaceTeamTime[];
  members: TeamMember[];
}

export interface RaceTeamTime {
  distance: number;
  time: number | null;
}

export interface TeamMember {
  // null and `hidden` for people who asked not to be shown.
  personId: string | null;
  fullName: string | null;
  hidden: boolean;
  boatPosition: number | null;
  isCox: boolean;
  isCoach: boolean;
  isStroke: boolean;
}

export type Role = "Roeier" | "Stuur" | "Coach";

export interface ApiError {
  error: string;
}
