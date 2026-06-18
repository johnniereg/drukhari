// User data: saved army lists, persisted to localStorage.
// (IndexedDB + export/import comes later; localStorage is fine for this size.)
import { pointsForSize, getDatasheet, getEnhancement } from '../catalog';

export type ListMode = 'official' | 'draft';

/** A sub-group of a unit split across transports (e.g. 2×5 from a 10-block). */
export interface SplitGroup {
  id: string;
  size: number;
  /** Equipped weapon ids for this group; undefined = all of the datasheet's weapons. */
  loadout?: string[];
  /** Transport unit uid this group is embarked in, if any. */
  transportUid?: string;
}

export interface ListUnit {
  uid: string; // unique within the list
  datasheetId: string;
  size: number; // model count (matches a points bracket)
  /** Selected detachment enhancement id (characters only). */
  enhancementId?: string;
  /** Equipped weapon ids; undefined = all of the datasheet's weapons. */
  loadout?: string[];
  /** Transport unit uid this whole (unsplit) unit is embarked in. */
  transportUid?: string;
  /** When present, the unit is split into these groups (sum of sizes = size). */
  groups?: SplitGroup[];
  notes?: string;
}

/** One occupant slot inside a transport (a whole unit or one split group). */
export interface EmbarkEntry {
  unitUid: string;
  groupId?: string;
  datasheetId: string;
  size: number;
  loadout?: string[];
}

/** All units/groups embarked in a given transport. */
export function embarkedIn(list: ArmyList, transportUid: string): EmbarkEntry[] {
  const out: EmbarkEntry[] = [];
  for (const u of list.units) {
    if (u.groups?.length) {
      for (const g of u.groups) {
        if (g.transportUid === transportUid)
          out.push({ unitUid: u.uid, groupId: g.id, datasheetId: u.datasheetId, size: g.size, loadout: g.loadout });
      }
    } else if (u.transportUid === transportUid) {
      out.push({ unitUid: u.uid, datasheetId: u.datasheetId, size: u.size, loadout: u.loadout });
    }
  }
  return out;
}

const chunk = (total: number, per: number): number[] => {
  const out: number[] = [];
  let left = total;
  while (left > 0) {
    out.push(Math.min(per, left));
    left -= per;
  }
  return out;
};

export interface ArmyList {
  id: string;
  name: string;
  mode: ListMode;
  pointCap: number;
  detachment?: string;
  units: ListUnit[];
  createdAt: number;
}

const KEY = 'drukhari-lists-v1';
const uid = () => Math.random().toString(36).slice(2, 10);

function load(): ArmyList[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ArmyList[]) : [];
  } catch {
    return [];
  }
}

class ListStore {
  lists = $state<ArmyList[]>(load());
  activeId = $state<string | null>(null);

  get active(): ArmyList | undefined {
    return this.lists.find((l) => l.id === this.activeId);
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.lists));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }

  create(name: string, mode: ListMode = 'draft', pointCap = 2000): string {
    const list: ArmyList = { id: uid(), name: name.trim() || 'Untitled list', mode, pointCap, units: [], createdAt: Date.now() };
    this.lists = [list, ...this.lists];
    this.activeId = list.id;
    this.persist();
    return list.id;
  }

  remove(id: string) {
    this.lists = this.lists.filter((l) => l.id !== id);
    if (this.activeId === id) this.activeId = null;
    this.persist();
  }

  update(id: string, patch: Partial<Pick<ArmyList, 'name' | 'mode' | 'pointCap' | 'detachment'>>) {
    this.lists = this.lists.map((l) => (l.id === id ? { ...l, ...patch } : l));
    this.persist();
  }

  addUnit(listId: string, datasheetId: string) {
    const d = getDatasheet(datasheetId);
    const size = d?.points[0]?.models ?? 1;
    this.mutate(listId, (l) => l.units.push({ uid: uid(), datasheetId, size }));
  }

  removeUnit(listId: string, unitUid: string) {
    this.mutate(listId, (l) => {
      l.units = l.units.filter((u) => u.uid !== unitUid);
      // clear any embarks that pointed at the removed unit (if it was a transport)
      for (const u of l.units) {
        if (u.transportUid === unitUid) u.transportUid = undefined;
        u.groups?.forEach((g) => {
          if (g.transportUid === unitUid) g.transportUid = undefined;
        });
      }
    });
  }

  setUnitSize(listId: string, unitUid: string, size: number) {
    this.mutate(listId, (l) => {
      const u = l.units.find((x) => x.uid === unitUid);
      if (u) u.size = size;
    });
  }

  /** Assign (or clear, with undefined) a detachment enhancement on a unit. */
  setEnhancement(listId: string, unitUid: string, enhancementId: string | undefined) {
    this.mutate(listId, (l) => {
      const u = l.units.find((x) => x.uid === unitUid);
      if (u) u.enhancementId = enhancementId;
    });
  }

  /** Toggle a weapon in a unit's loadout. undefined loadout = "all"; first toggle materializes the full set. */
  toggleLoadout(listId: string, unitUid: string, weaponId: string, allIds: string[]) {
    this.mutate(listId, (l) => {
      const u = l.units.find((x) => x.uid === unitUid);
      if (!u) return;
      const current = u.loadout ?? allIds.slice();
      u.loadout = current.includes(weaponId)
        ? current.filter((w) => w !== weaponId)
        : [...current, weaponId];
    });
  }

  /** Toggle a weapon in a split GROUP's loadout. */
  toggleGroupLoadout(listId: string, unitUid: string, groupId: string, weaponId: string, allIds: string[]) {
    this.mutate(listId, (l) => {
      const g = l.units.find((x) => x.uid === unitUid)?.groups?.find((x) => x.id === groupId);
      if (!g) return;
      const current = g.loadout ?? allIds.slice();
      g.loadout = current.includes(weaponId) ? current.filter((w) => w !== weaponId) : [...current, weaponId];
    });
  }

  /**
   * Embark a unit into a transport. Embarks whole if it fits; otherwise splits
   * into groups sized to the transport's split rule and embarks the first free
   * group that fits. Hard-enforces capacity and one-parent-unit-per-transport.
   * Returns true if something was embarked.
   */
  embark(listId: string, transportUid: string, unitUid: string): boolean {
    let ok = false;
    this.mutate(listId, (l) => {
      const t = l.units.find((x) => x.uid === transportUid);
      const u = l.units.find((x) => x.uid === unitUid);
      if (!t || !u || t.uid === u.uid) return;
      const td = getDatasheet(t.datasheetId);
      const cap = td?.transport?.capacity ?? 0;
      const split = td?.transport?.splitGroupSize;
      if (!cap) return;

      const entries = embarkedIn(l, transportUid);
      const used = entries.reduce((s, e) => s + e.size, 0);
      const remaining = cap - used;
      // one parent unit per transport
      const occupants = new Set(entries.map((e) => e.unitUid));
      if (occupants.size && !occupants.has(unitUid)) return;

      // Whole unit fits (and isn't already split)
      if (!u.groups?.length && u.size <= cap && u.size <= remaining) {
        u.transportUid = transportUid;
        ok = true;
        return;
      }
      // Needs splitting
      if (split) {
        if (!u.groups?.length) u.groups = chunk(u.size, split).map((sz) => ({ id: uid(), size: sz }));
        const free = u.groups.find((g) => !g.transportUid && g.size <= remaining);
        if (free) {
          free.transportUid = transportUid;
          ok = true;
        }
      }
    });
    return ok;
  }

  /** Remove a whole unit (and any of its groups) from its transport(s). */
  disembark(listId: string, unitUid: string) {
    this.mutate(listId, (l) => {
      const u = l.units.find((x) => x.uid === unitUid);
      if (!u) return;
      u.transportUid = undefined;
      u.groups?.forEach((g) => (g.transportUid = undefined));
    });
  }

  /** Remove a single split group from its transport. */
  disembarkGroup(listId: string, unitUid: string, groupId: string) {
    this.mutate(listId, (l) => {
      const g = l.units.find((x) => x.uid === unitUid)?.groups?.find((x) => x.id === groupId);
      if (g) g.transportUid = undefined;
    });
  }

  /** Drop a unit's split, recombining it into one block (clears group embarks). */
  unsplit(listId: string, unitUid: string) {
    this.mutate(listId, (l) => {
      const u = l.units.find((x) => x.uid === unitUid);
      if (u) u.groups = undefined;
    });
  }

  /** Changing detachment clears enhancements (they belong to a detachment). */
  setDetachment(listId: string, detachmentId: string | undefined) {
    this.mutate(listId, (l) => {
      l.detachment = detachmentId;
      l.units = l.units.map((u) => ({ ...u, enhancementId: undefined }));
    });
  }

  total(list: ArmyList): number {
    return list.units.reduce((sum, u) => {
      const d = getDatasheet(u.datasheetId);
      const enh = getEnhancement(u.enhancementId);
      return sum + (d ? pointsForSize(d, u.size) : 0) + (enh?.pts ?? 0);
    }, 0);
  }

  private mutate(listId: string, fn: (l: ArmyList) => void) {
    this.lists = this.lists.map((l) => {
      if (l.id !== listId) return l;
      const copy: ArmyList = { ...l, units: l.units.map((u) => ({ ...u })) };
      fn(copy);
      return copy;
    });
    this.persist();
  }
}

export const listStore = new ListStore();
