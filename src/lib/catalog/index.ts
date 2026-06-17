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
