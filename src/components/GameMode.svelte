<script lang="ts">
  import { listStore, type ArmyList } from '../lib/store/lists.svelte';
  import { getDatasheet, getWeapon, getDetachment, getEnhancement, resolveAbility } from '../lib/catalog';
  import WeaponTable from './WeaponTable.svelte';
  import type { Weapon } from '../lib/catalog/types';

  let { list }: { list: ArmyList } = $props();

  let expanded = $state<string | null>(null);
  let showRule = $state(false);

  const det = $derived(getDetachment(list.detachment));

  function rows() {
    return list.units
      .map((u) => ({ u, d: getDatasheet(u.datasheetId) }))
      .filter((r) => r.d);
  }

  function weapons(loadout: string[] | undefined, datasheetId: string, kind: 'ranged' | 'melee'): Weapon[] {
    const d = getDatasheet(datasheetId);
    if (!d) return [];
    const ids = loadout ?? d.weapons;
    return ids.map((id) => getWeapon(id)).filter((w): w is Weapon => !!w && w.kind === kind);
  }

  // Armour save big, secondary saves (invuln/FNP) small — same idiom as the cards.
  function saveParts(sv: string) {
    const parts = sv.split(',').map((s) => s.trim());
    return { primary: parts[0], rest: parts.slice(1).join(' ') };
  }
</script>

<!-- Quick list switcher + summary -->
<div class="bar">
  {#if listStore.lists.length > 1}
    <select class="list-pick" value={list.id} onchange={(e) => (listStore.activeId = (e.target as HTMLSelectElement).value)}>
      {#each listStore.lists as l}<option value={l.id}>{l.name}</option>{/each}
    </select>
  {:else}
    <span class="list-name">{list.name}</span>
  {/if}
  <span class="summary">{listStore.total(list)} pts · {list.units.length} units</span>
</div>

{#if det}
  <button class="det-line" onclick={() => (showRule = !showRule)}>
    <span><strong>{det.name}</strong> — {det.ruleName}</span>
    <span class="chev" class:open={showRule}>›</span>
  </button>
  {#if showRule}<p class="det-rule">{det.ruleText}</p>{/if}
{/if}

{#if !list.units.length}
  <p class="empty">This list has no units yet. Add some in the Lists tab.</p>
{:else}
  <table class="stats">
    <thead>
      <tr><th class="u">Unit</th><th>M</th><th>T</th><th>SV</th><th>W</th><th>LD</th><th>OC</th></tr>
    </thead>
    <tbody>
      {#each rows() as { u, d } (u.uid)}
        {@const sv = saveParts(d!.stats.sv)}
        {@const enh = getEnhancement(u.enhancementId)}
        <tr class="srow" onclick={() => (expanded = expanded === u.uid ? null : u.uid)}>
          <td class="u">
            <span class="uname small-caps">{d!.name}</span>
            <span class="umeta">{u.size}{#if enh} · {enh.name}{/if}</span>
          </td>
          <td>{d!.stats.m}</td>
          <td>{d!.stats.t}</td>
          <td class="sv"><span class="svp">{sv.primary}</span>{#if sv.rest}<span class="svs">{sv.rest}</span>{/if}</td>
          <td>{d!.stats.w}</td>
          <td>{d!.stats.ld}</td>
          <td>{d!.stats.oc}</td>
        </tr>
        {#if expanded === u.uid}
          <tr class="detail-row">
            <td colspan="7">
              <WeaponTable weapons={weapons(u.loadout, u.datasheetId, 'ranged')} kind="ranged" />
              <WeaponTable weapons={weapons(u.loadout, u.datasheetId, 'melee')} kind="melee" />
              {#if d!.abilities.length}
                <div class="abil"><strong>Abilities:</strong> {d!.abilities.map((a) => resolveAbility(a).name).join(', ')}</div>
              {/if}
              {#if d!.pain}<div class="abil"><strong>Pain:</strong> {resolveAbility(d!.pain).name}</div>{/if}
              {#if enh}<div class="abil enh"><strong>{enh.name}:</strong> {enh.text}</div>{/if}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
  <p class="hint">Tap a unit for its equipped weapons &amp; abilities.</p>
{/if}

<style>
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .list-pick { flex: 1; height: 36px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 0 8px; font: inherit; font-weight: 700; }
  .list-name { font-size: 16px; font-weight: 700; }
  .summary { font-size: 12px; color: var(--text-dim); white-space: nowrap; }

  .det-line { width: 100%; display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; min-height: 38px; margin-bottom: 6px; }
  .det-line .chev { color: var(--text-dim); font-size: 18px; transition: transform 0.15s; }
  .det-line .chev.open { transform: rotate(90deg); }
  .det-rule { font-size: 12px; color: var(--text-dim); line-height: 1.45; margin: 0 0 8px; padding: 0 4px; }

  .empty, .hint { color: var(--text-dim); text-align: center; font-size: 12px; padding: 12px; }

  .stats { width: 100%; border-collapse: collapse; }
  .stats th { font-size: 10px; text-transform: uppercase; color: var(--text-dim); padding: 4px 2px; text-align: center; }
  .stats th.u { text-align: left; }
  .srow { cursor: pointer; }
  .srow td { padding: 7px 2px; text-align: center; border-top: 1px solid var(--border); font-size: 14px; font-weight: 700; }
  .srow td.u { text-align: left; font-weight: 400; }
  .uname { display: block; font-size: 14px; font-weight: 700; }
  .umeta { display: block; font-size: 11px; color: var(--text-dim); }
  .sv { line-height: 1.05; }
  .svp { display: block; }
  .svs { display: block; font-size: 9px; color: var(--text-dim); font-weight: 400; white-space: nowrap; }
  .detail-row td { padding: 4px 0 10px; background: var(--surface); }
  .abil { font-size: 12px; line-height: 1.45; margin-top: 4px; padding: 0 4px; }
  .abil.enh { color: var(--text); }
  .abil strong { color: var(--accent); }
</style>
