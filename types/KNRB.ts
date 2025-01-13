export interface SearchResponse {
  items: PersonResult[];
  totalCount: number;
}

export interface PersonResult {
  personId: string;
  fullName: string
  federationMembershipIdentifier: string;
  clubName: string;
}

export interface Person {
  clubNames: string | null;
  rowingPoints: RowingPoint[];
  totalScullingPoints: number;
  totalSweepingPoints: number;
  personId: string;
  tournaments: Tournament[];
  fullName: string;
  federationMembershipIdentifier: string | null;
  organisationName: string | null;
  yearOfBirth: number;
}

interface RowingPoint {
  personId: string;
  id: number;
  date: string;
  type: "Sweeping" | "Sculling";
  point: number;
  description: string;
}

interface RaceTeamTime {
  id: number;
  time: number;
  position: number;
  isFinishTime: boolean;
  distance: number;
  splitTime: number;
}

interface TeamMember {
  boatPosition: number | null;
  fullName: string;
  isCox: boolean;
  isCoach: boolean;
  isStroke: boolean;
  isBow: boolean;
  person: Person;
}

interface TeamVersion {
  isActive: boolean;
  teamMembers: TeamMember[];
  matchTeam: MatchTeam;
}

interface MatchTeam {
  matchRegistrationId: number;
  matchRegistration: null;
  name: string | null;
  organisationName: string | null;
  teamVersions: unknown[]; // Replace `unknown` if needed
  boatName: string | null;
}

export interface RaceTeam {
  id: number;
  name: string | null;
  code: string | null;
  number: number | null;
  lane: number;
  endTime: number;
  correctedEndTime: number | null;
  endPosition: number;
  bonusTime: number;
  didNotStart: boolean;
  didNotFinish: boolean;
  raceTeamTimes: RaceTeamTime[];
  oarBladeUrl: string | null;
  teamVersionId: number;
  teamVersion: TeamVersion;
  boatName: string | null;
}

interface Preliminaries {
  tournamentName: string | null;
  firstTournamentDate: string | null;
  lastTournamentDate: string | null;
  position: number;
  matchCode: string;
  matchNumber: number;
  matchName: string;
  teamName: string;
  stroke: Person;
  raceName: string;
  bow: string | null;
  endTime: number;
  matchId: number;
  tournamentId: number;
  raceId: number;
  lane: number;
  tournamentDayId: number;
}

export interface Race {
  tournamentName: string | null;
  firstTournamentDate: string | null;
  lastTournamentDate: string | null;
  position: number;
  matchCode: string;
  matchNumber: number;
  matchName: string;
  teamName: string;
  stroke: Person;
  raceName: string;
  bow: string | null;
  endTime: number;
  matchId: number;
  tournamentId: number;
  raceId: number;
  lane: number;
  tournamentDayId: number;
  preliminaries: Preliminaries[];
  id: number;
  name: string;
  startTime: string;
  progressionInformation: string | null;
  environmentInformation: string | null;
  distance: number;
  raceTeams: RaceTeam[];
  match: Match;
}

interface Match {
  id: number;
  matchCategoryName: string | null;
  boatCategoryName: string | null;
  tournamentCostGroupName: string | null;
  tournamentCostGroupPrice: number;
  regulationName: string | null;
  tournamentTimeBlockNumber: string;
  date: string;
  registrationCount: number;
  matchRankingIds: number[];
  races: unknown[]; // Replace `unknown` if needed
  matchGeneratedCode: string;
  matchBoatCategoryCode: string;
  matchBoatCategoryCodePosition: number;
  matchFullName: string;
  matchFullNameWithAddition: string;
  matchNameWithAddition: string;
  matchCodeWithAddition: string;
  registrations: unknown[]; // Replace `unknown` if needed
  boatName: string;
  tournamentId: number;
  tournamentDayId: number;
  matchCategoryId: number;
  boatCategoryId: number;
  position: number;
  tournamentCostGroupId: number;
  tournamentTimeBlockId: number | null;
  regulationId: number;
  number: number;
  weightType: string;
  genderType: string;
  name: string;
  nameAddition: string | null;
  alternativeName: string | null;
  code: string;
  codeAddition: string | null;
  alternativeCode: string | null;
  remark: string | null;
  isClassifing: boolean;
  allowIndividualRegistration: boolean;
  allowRegistrations: boolean;
  matchDeviation: string | null;
}

export interface Tournament {
  tournamentName: string;
  firstTournamentDate: string;
  lastTournamentDate: string;
  races: Race[];
}

interface Root {
  clubNames: string | null;
  rowingPoints: RowingPoint[];
  totalScullingPoints: number;
  totalSweepingPoints: number;
  personId: string;
  fullName: string;
  federationMembershipIdentifier: string;
  organisationName: string;
  yearOfBirth: number;
  tournaments: Tournament[];
}

