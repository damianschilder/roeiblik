export interface SearchResponse {
  timestamp: number;
  regatta: object[];
  country: object[];
  club: object[];
  person: Record<string, Person>;
}

export interface PersonResponse {
  timestamp: number;
  person: Record<string, Person>;
  event: Event[];
  entry: Entry[];
  round: Record<string, Person>;
  race: Record<string, Person>;
  round_crew: Record<string, Person>;
  race_crew: Record<string, Person>;
}

export interface RowerPerson {
  displayname: Person['displayname'];
  id: Person['id'];
  entry: Entry[];
  round: Record<string, Person>;
  race: Record<string, Person>;
  round_crew: Record<string, Person>;
  race_Crew: Record<string, Person>;
}

export interface Person {
  id: string;
  displayname: string;
}

interface RegattaDay {
  id: string;
  day_date: string;
}

interface Event {
  id: string;
  number: string;
  code: string;
  name: string;
  status: number;
  remarks: string | null;
  string: string;
  sort_order: number;
  stroke_pos: number;
  regatta_days: RegattaDay[];
  current_round: string;
}

interface Club {
  id: string;
  code: string;
  name: string;
  federation: string;
}

interface Blade {
  crop: string;
  full: string;
}

interface Rower {
  id: string;
  position: number;
  firstname: string;
  lastname: string;
  fullname: string;
  club_member_id: string;
}

interface Boat {
  id: string;
  position: number;
  name: string;
}

interface Entry {
  id: string;
  code: string;
  name: string;
  shortname: string;
  string: string;
  combination: boolean;
  club_id: string;
  event_id: string;
  status: number;
  blades: Blade;
  club: Club;
  country: string | null;
  rowers: Rower[];
  coxes: Rower[];
  coaches: Rower[];
  boats: Boat[];
}

interface Round {
  id: string;
  name: string;
  number: number;
  code: string;
  event_id: string;
}

interface Race {
  id: string;
  name: string;
  number: number;
  code: string;
  round_id: string;
  start_time: string; // Assuming ISO string format for time
  status: number;
}

interface CrewMember {
  id: string;
  position: number;
  role: string; // e.g., 'rower', 'cox', 'coach'
  person_id: string;
  fullname: string;
}

interface RoundCrew {
  id: string;
  entry_id: string;
  round_id: string;
  status: number;
  crew_members: CrewMember[];
}

interface RaceCrew {
  id: string;
  entry_id: string;
  race_id: string;
  status: number;
  crew_members: CrewMember[];
}

interface Root {
  timestamp: number;
  person: Record<string, Person>;
  event: Record<string, Event>;
  entry: Record<string, Entry>;
  round: Record<string, Round>;
  race: Record<string, Race>;
  round_crew: Record<string, RoundCrew>;
  race_crew: Record<string, RaceCrew>;
}
