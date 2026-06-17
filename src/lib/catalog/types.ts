// Catalog types — the rules data, separated from presentation and from user data.
// Everything the app renders or queries flows through these shapes.

export interface Meta {
  /** Munitions Field Manual / points pack version this catalog tracks. */
  pointsVersion: string;
  /** ISO date the points/rules were last updated. */
  updated: string;
  /** Core rules edition. */
  edition: string;
}

export interface Statline {
  m: string; // movement, e.g. "7\""
  t: number; // toughness
  sv: string; // save, e.g. "4+, 2++" (armour + invuln)
  w: number; // wounds
  ld: string; // leadership, e.g. "6+"
  oc: number; // objective control
}

export type WeaponKind = 'ranged' | 'melee';

export interface Weapon {
  id: string;
  name: string;
  kind: WeaponKind;
  range?: string; // ranged only, e.g. "36\""
  a: string; // attacks, e.g. "3" or "D6"
  skill: string; // BS (ranged) or WS (melee), e.g. "3+" or "N/A"
  s: string; // strength
  ap: string; // armour penetration, e.g. "-1"
  d: string; // damage, e.g. "1" or "D6+2"
  keywords: string[]; // weapon abilities, e.g. ["Assault", "Lethal Hits"]
}

export interface Ability {
  id: string;
  name: string;
  text: string;
}

/** Capacity/split behaviour for a TRANSPORT datasheet. */
export interface TransportRule {
  capacity: number;
  /** Venom-style: an embarking unit may split into groups of this size. */
  splitGroupSize?: number;
  /** Models on the firing deck, if any. */
  firingDeck?: number;
  notes?: string;
}

/** A points bracket keyed by model count (10e/11e style). */
export interface PointsBracket {
  models: number;
  pts: number;
  /** false = placeholder pending confirmation against the current MFM. */
  verified: boolean;
}

export interface UnitComposition {
  min: number;
  max: number;
  /** Human-readable composition note. */
  note?: string;
}

/** A secondary model statline within a datasheet (e.g. Sybarite, Klaivex). */
export interface ModelProfile {
  name: string;
  m: string;
  t: string;
  sv: string;
  w: string;
  ld: string;
  oc: string;
}

export interface Datasheet {
  id: string;
  name: string;
  /** Battlefield role for grouping, e.g. "Character", "Transport", "Vehicle". */
  role: string;
  /** Not present in the legacy data; enriched later. */
  keywords?: string[];
  stats: Statline;
  /** Not present in the legacy data; enriched later. */
  composition?: UnitComposition;
  /** Additional model statlines (champions, etc.). */
  modelProfiles?: ModelProfile[];
  /** Optional reference photo (path under /public, e.g. "/units/archon.jpg"). */
  image?: string;
  /** Weapon ids this datasheet can field. */
  weapons: string[];
  /** Ability ids + free-text ability names not yet modelled. */
  abilities: string[];
  /** Pain-token ability name (Drukhari-specific). */
  pain?: string;
  points: PointsBracket[];
  /** Present only on TRANSPORT datasheets. */
  transport?: TransportRule;
  /** This unit can embark and (if size allows) be split across transports. */
  splittable?: boolean;
  /** Datasheet ids this character can lead. */
  canLead?: string[];
}

export interface Catalog {
  meta: Meta;
  datasheets: Datasheet[];
  weapons: Weapon[];
  abilities: Ability[];
}
