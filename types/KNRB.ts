// The shapes the KNRB routes in server/api/knrb send to the page (not foys' raw shapes).

// GET /api/knrb/search?query=
export interface SearchResponse {
  items: PersonResult[];
  totalCount: number;
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
  rowingPoints: RowingPoint[];
  stats: PersonStats;
  tournaments: Tournament[];
}

export interface PersonStats {
  tournaments: number;
  // An event is one crew in one match: the main race plus its earlier rounds.
  events: number;
  races: number;
  wins: number;
}

export interface RowingPoint {
  date: string | null;
  type: "Sweeping" | "Sculling" | null;
  point: number;
  description: string;
}

export interface Tournament {
  tournamentId: number | null;
  tournamentName: string;
  firstTournamentDate: string | null;
  lastTournamentDate: string | null;
  // One entry per event, its highest round first.
  races: Race[];
}

export type RoundType = "final" | "semi" | "quarter" | "repechage" | "heat" | "timetrial" | "other";

export interface RaceRound {
  type: RoundType;
  rank: number;
  final?: string;
}

export interface RaceResult {
  raceId: number;
  tournamentId: number;
  tournamentDayId: number | null;
  matchId: number;
  matchNumber: number | null;
  matchCode: string;
  matchName: string;
  raceName: string;
  teamName: string;
  // null when the crew did not start or finish, or was not ranked.
  position: number | null;
  endTime: number | null;
  lane: number | null;
  round: RaceRound;
}

export interface Race extends RaceResult {
  won: boolean;
  preliminaries: RaceResult[];
}

// GET /api/knrb/round?tournamentId=&raceId=
export interface Round {
  raceId: number;
  matchId: number | null;
  name: string;
  startTime: string | null;
  distance: number | null;
  progression: string | null;
  isFinal: boolean;
  teams: RaceTeam[];
}

export interface RaceTeam {
  id: number | null;
  name: string;
  club: string | null;
  lane: number | null;
  position: number | null;
  time: number | null;
  measuredTime: number | null;
  corrected: boolean;
  bonusTime: number | null;
  didNotStart: boolean;
  didNotFinish: boolean;
  times: RaceTeamTime[];
  members: TeamMember[];
}

export interface RaceTeamTime {
  distance: number;
  time: number | null;
  position: number | null;
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
  isBow: boolean;
}

export type Role = "Roeier" | "Stuur" | "Coach";

export interface ApiError {
  error: string;
}
