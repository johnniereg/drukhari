// Typed access to the catalog. The rest of the app queries data through here
// rather than reaching into the JSON, so storage/source can change later.
import catalogJson from '../../../data/catalog.json';
import type { Catalog, Datasheet, Weapon, Ability } from './types';

export const catalog = catalogJson as Catalog;

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const weaponById = new Map<string, Weapon>(catalog.weapons.map((w) => [w.id, w]));
const abilityById = new Map<string, Ability>(catalog.abilities.map((a) => [a.id, a]));
const datasheetById = new Map<string, Datasheet>(catalog.datasheets.map((d) => [d.id, d]));

export function getWeapon(id: string): Weapon | undefined {
  return weaponById.get(id);
}

export function getDatasheet(id: string): Datasheet | undefined {
  return datasheetById.get(id);
}

/** Resolve an ability by id or display name to its full definition; fall back to the bare name. */
export function resolveAbility(idOrName: string): { name: string; text?: string } {
  const a = abilityById.get(idOrName) ?? abilityById.get(slug(idOrName));
  return a ? { name: a.name, text: a.text } : { name: idOrName };
}

export function weaponsFor(d: Datasheet, kind: 'ranged' | 'melee'): Weapon[] {
  return d.weapons.map((id) => weaponById.get(id)).filter((w): w is Weapon => !!w && w.kind === kind);
}

export function startingPoints(d: Datasheet): number {
  return d.points[0]?.pts ?? 0;
}

/** Valid model counts for a datasheet (its points brackets), or [1] if none defined. */
export function validSizes(d: Datasheet): number[] {
  return d.points.length ? d.points.map((p) => p.models) : [1];
}

/** Points for a given model count; 0 (unknown) if no matching bracket. */
export function pointsForSize(d: Datasheet, size: number): number {
  return d.points.find((p) => p.models === size)?.pts ?? 0;
}

/** True if every bracket used by the list has confirmed points. */
export function pointsConfirmed(d: Datasheet, size: number): boolean {
  return d.points.find((p) => p.models === size)?.verified ?? false;
}
