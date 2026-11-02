// What Roeiblik's own Time-Team routes return (server/api/time-team/*). The raw Time-Team answers
// are reshaped on the server; the browser only ever sees these shapes, with only what the page
// shows. A failure is a 4xx or 5xx status with a body { error }.

export type TtRole = 'Rower' | 'Cox' | 'Coach';

// /api/time-team/search
export interface TtPerson {
  id: string;
  displayname: string;
}

export interface TtSearchResponse {
  person: TtPerson[]; // sorted by name, then id
}

// /api/time-team/person
export interface TtCrewMember {
  name: string;
  position?: number;
  id?: string; // Time-Team person id: links to that person's page
  self?: boolean; // the person whose page this is
}

export interface TtCrew {
  rowers: TtCrewMember[];
  coxes: TtCrewMember[];
  coaches: TtCrewMember[];
  boat?: string;
}

export interface TtSplit {
  at: string; // "500m", "1000m", or a place name on a head race ("Rozenoord")
  time: string;
  pos?: number;
}

export interface TtRace {
  id: string;
  date?: string; // YYYY-MM-DD, the regatta day (no time zone involved)
  round: string; // round code: "FA", "E", "R1", "TT", "2000m", or "" for a straight final
  roundName: string; // "A-finale", "voorwedstrijd", ...
  distance?: number; // metres
  course?: string; // Time-Team's name for the course ("2000m", "B4 8000")
  position?: number; // place within the person's own event in this round
  result?: string; // a time, or a status code such as DNS when there is no time
  margin?: string; // behind the winner: "+1.68"
  lane?: string;
  rules: string[]; // progression rules: "1e en 2e" (door)
  progressed?: boolean; // the crew went on to a later round from here
  outOfCompetition?: boolean; // buiten mededinging
  penalty?: boolean;
  provisional?: boolean;
  splits?: TtSplit[];
  win: boolean; // the race that decided a won entry (gets the trophy)
}

export interface TtEntry {
  id: string;
  regattaId: string;
  name: string;
  blade?: string; // club blade image
  role?: TtRole; // undefined: not known (crew not looked up and not the stroke)
  won: boolean; // first in the race that decided the event (see decide() in the person route)
  crew: TtCrew | null; // null: not looked up yet (see /api/time-team/entry)
  races: TtRace[]; // latest round first
}

export interface TtEvent {
  id: string;
  code: string; // "HOnerv C4+"
  name: string; // "Heren onervaren C-vier"
  regatta?: string; // "Northwave Regatta"
  city?: string; // "Zevenhuizen"
  entries: TtEntry[];
}

export interface TtClub {
  id: string;
  name: string;
  blade?: string;
}

export interface TtProfile {
  person: TtPerson;
  clubs: TtClub[];
  events: TtEvent[]; // newest first
  firstRace?: { date?: string; entry: string; event: string };
  // A regatta or crew lookup failed or came too late: the answer is not cached, so the next visit
  // tries again. (Lookups left out of a long history for the budget do not count: those crews
  // load when opened.)
  partial?: boolean;
}

export type TtPersonResponse = Partial<TtProfile>;

// /api/time-team/entry
export interface TtEntryResponse {
  crew?: TtCrew;
  role?: TtRole;
}
