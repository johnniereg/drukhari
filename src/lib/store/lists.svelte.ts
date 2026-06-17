// User data: saved army lists, persisted to localStorage.
// (IndexedDB + export/import comes later; localStorage is fine for this size.)
import { pointsForSize, getDatasheet, getEnhancement } from '../catalog';

export type ListMode = 'official' | 'draft';

export interface ListUnit {
  uid: string; // unique within the list
  datasheetId: string;
  size: number; // model count (matches a points bracket)
  /** Selected detachment enhancement id (characters only). */
  enhancementId?: string;
  /** Equipped weapon ids; undefined = all of the datasheet's weapons. */
  loadout?: string[];
  notes?: string;
}

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
    this.mutate(listId, (l) => (l.units = l.units.filter((u) => u.uid !== unitUid)));
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
