<script lang="ts">
  import {
    getDatasheet, getWeapon, validSizes, pointsForSize, pointsConfirmed,
    canTakeEnhancement, getEnhancement, getDetachment
  } from '../lib/catalog';
  import { listStore, type ListUnit, type ArmyList } from '../lib/store/lists.svelte';

  let { list, unit }: { list: ArmyList; unit: ListUnit } = $props();
  let open = $state(false);

  const d = $derived(getDatasheet(unit.datasheetId));
  const sizes = $derived(d ? validSizes(d) : [1]);
  const detachment = $derived(getDetachment(list.detachment));
  const enh = $derived(getEnhancement(unit.enhancementId));
  const basePts = $derived(d ? pointsForSize(d, unit.size) : 0);
  const rowPts = $derived(basePts + (enh?.pts ?? 0));
  const equipped = $derived((id: string) => (unit.loadout ? unit.loadout.includes(id) : true));

  function cycleSize() {
    if (!d) return;
    const next = sizes[(sizes.indexOf(unit.size) + 1) % sizes.length];
    listStore.setUnitSize(list.id, unit.uid, next);
  }
</script>

{#if d}
  <div class="urow">
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <div class="left">
        <span class="name small-caps">{d.name}</span>
        <span class="sub">
          {unit.size} {unit.size === 1 ? 'model' : 'models'}{#if enh} · {enh.name}{/if}
        </span>
      </div>
      <div class="right">
        <span class="pts" class:unconfirmed={!pointsConfirmed(d, unit.size)}>{rowPts} pts</span>
        <span class="chev" class:open>›</span>
      </div>
    </button>

    {#if open}
      <div class="detail">
        {#if sizes.length > 1}
          <div class="field">
            <span class="lbl">Size</span>
            <button class="chip" onclick={cycleSize}>{unit.size} models →</button>
          </div>
        {/if}

        {#if canTakeEnhancement(d)}
          <div class="field col">
            <span class="lbl">Enhancement</span>
            {#if detachment}
              <select
                class="enh-select"
                value={unit.enhancementId ?? ''}
                onchange={(e) => listStore.setEnhancement(list.id, unit.uid, (e.target as HTMLSelectElement).value || undefined)}
              >
                <option value="">None</option>
                {#each detachment.enhancements as opt}
                  <option value={opt.id}>{opt.name} (+{opt.pts})</option>
                {/each}
              </select>
            {:else}
              <span class="hint">Choose a detachment first.</span>
            {/if}
          </div>
        {/if}

        <div class="field col">
          <span class="lbl">Wargear ({d.weapons.length} options)</span>
          <div class="gear">
            {#each d.weapons as wid}
              {@const w = getWeapon(wid)}
              {#if w}
                <label class="gear-item">
                  <input type="checkbox" checked={equipped(wid)} onchange={() => listStore.toggleLoadout(list.id, unit.uid, wid, d.weapons)} />
                  <span class="gear-name">{w.name}</span>
                  <span class="gear-kind">{w.kind === 'ranged' ? 'R' : 'M'}</span>
                </label>
              {/if}
            {/each}
          </div>
        </div>

        <button class="rm" onclick={() => listStore.removeUnit(list.id, unit.uid)}>Remove unit</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .urow { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 6px; overflow: hidden; }
  .head { width: 100%; display: flex; align-items: center; justify-content: space-between; background: none; border: none; padding: 8px 10px; min-height: var(--tap); text-align: left; }
  .left { display: flex; flex-direction: column; gap: 2px; }
  .name { font-size: 15px; font-weight: 600; }
  .sub { font-size: 12px; color: var(--text-dim); }
  .right { display: flex; align-items: center; gap: 8px; }
  .pts { color: var(--accent); font-weight: 700; font-size: 14px; }
  .pts.unconfirmed { opacity: 0.5; }
  .chev { color: var(--text-dim); font-size: 20px; transition: transform 0.15s; }
  .chev.open { transform: rotate(90deg); }

  .detail { padding: 4px 10px 10px; border-top: 1px solid var(--border); }
  .field { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
  .field.col { flex-direction: column; align-items: stretch; gap: 4px; }
  .lbl { font-size: 11px; text-transform: uppercase; color: var(--text-dim); }
  .chip { font-size: 13px; background: var(--surface-2); min-height: 32px; align-self: flex-start; }
  .enh-select { height: 38px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; font: inherit; }
  .hint { font-size: 12px; color: var(--text-dim); }
  .gear { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; }
  .gear-item { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 3px 0; }
  .gear-name { flex: 1; }
  .gear-kind { font-size: 10px; color: var(--text-dim); border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; }
  .rm { width: 100%; margin-top: 8px; color: var(--danger); border-color: var(--danger); background: none; }
</style>
