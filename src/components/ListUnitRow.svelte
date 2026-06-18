<script lang="ts">
  import {
    getDatasheet, getWeapon, validSizes, pointsForSize, pointsConfirmed,
    canTakeEnhancement, getEnhancement, getDetachment, isTransport, canEmbark
  } from '../lib/catalog';
  import { listStore, embarkedIn, type ListUnit, type ArmyList } from '../lib/store/lists.svelte';

  let { list, unit }: { list: ArmyList; unit: ListUnit } = $props();
  let open = $state(false);

  const d = $derived(getDatasheet(unit.datasheetId));
  const sizes = $derived(d ? validSizes(d) : [1]);
  const detachment = $derived(getDetachment(list.detachment));
  const enh = $derived(getEnhancement(unit.enhancementId));
  const basePts = $derived(d ? pointsForSize(d, unit.size) : 0);
  const rowPts = $derived(basePts + (enh?.pts ?? 0));
  const transport = $derived(d ? isTransport(d) : false);

  // transport occupancy (this unit IS the transport)
  const entries = $derived(transport ? embarkedIn(list, unit.uid) : []);
  const used = $derived(entries.reduce((s, e) => s + e.size, 0));
  const cap = $derived(d?.transport?.capacity ?? 0);

  function unitName(uid: string) {
    return getDatasheet(list.units.find((u) => u.uid === uid)?.datasheetId ?? '')?.name ?? '?';
  }

  function eligibleToEmbark() {
    const remaining = cap - used;
    const split = d?.transport?.splitGroupSize;
    const occupants = new Set(entries.map((e) => e.unitUid));
    return list.units.filter((o) => {
      if (o.uid === unit.uid) return false;
      const od = getDatasheet(o.datasheetId);
      if (!od || !canEmbark(od)) return false;
      if (occupants.size && !occupants.has(o.uid)) return false;
      if (o.groups?.length) return o.groups.some((g) => !g.transportUid && g.size <= remaining);
      if (o.transportUid) return false;
      if (o.size <= cap && o.size <= remaining) return true;
      return !!split && Math.min(split, o.size) <= remaining;
    });
  }

  function cycleSize() {
    if (!d) return;
    const next = sizes[(sizes.indexOf(unit.size) + 1) % sizes.length];
    listStore.setUnitSize(list.id, unit.uid, next);
  }

  function gear(loadout: string[] | undefined) {
    return (d?.weapons ?? []).map((id) => ({ id, w: getWeapon(id) })).filter((x) => x.w);
  }
  const equipped = (loadout: string[] | undefined, id: string) => (loadout ? loadout.includes(id) : true);

  // where is this (non-transport) unit / its groups?
  const whereWhole = $derived(unit.transportUid ? unitName(unit.transportUid) : null);
</script>

{#if d}
  <div class="urow">
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <div class="left">
        <span class="name small-caps">{d.name}</span>
        <span class="sub">
          {unit.size} {unit.size === 1 ? 'model' : 'models'}{#if enh} · {enh.name}{/if}
          {#if transport && used > 0} · carrying {used}/{cap}{/if}
          {#if whereWhole} · in {whereWhole}{/if}
          {#if unit.groups?.length} · split {unit.groups.map((g) => g.size).join('+')}{/if}
        </span>
      </div>
      <div class="right">
        <span class="pts" class:unconfirmed={!pointsConfirmed(d, unit.size)}>{rowPts} pts</span>
        <span class="chev" class:open>›</span>
      </div>
    </button>

    {#if open}
      <div class="detail">
        {#if sizes.length > 1 && !unit.groups?.length}
          <div class="field">
            <span class="lbl">Size</span>
            <button class="chip" onclick={cycleSize}>{unit.size} models →</button>
          </div>
        {/if}

        {#if canTakeEnhancement(d)}
          <div class="field col">
            <span class="lbl">Enhancement</span>
            {#if detachment}
              <select class="sel" value={unit.enhancementId ?? ''} onchange={(e) => listStore.setEnhancement(list.id, unit.uid, (e.target as HTMLSelectElement).value || undefined)}>
                <option value="">None</option>
                {#each detachment.enhancements as opt}<option value={opt.id}>{opt.name} (+{opt.pts})</option>{/each}
              </select>
            {:else}<span class="hint">Choose a detachment first.</span>{/if}
          </div>
        {/if}

        <!-- TRANSPORT: who's aboard -->
        {#if transport}
          <div class="field col">
            <span class="lbl">Transport — {used}/{cap} capacity</span>
            {#each entries as e}
              <div class="aboard">
                <span>{getDatasheet(e.datasheetId)?.name} ({e.size})</span>
                <button class="mini" onclick={() => e.groupId ? listStore.disembarkGroup(list.id, e.unitUid, e.groupId) : listStore.disembark(list.id, e.unitUid)}>Disembark</button>
              </div>
            {/each}
            {#if eligibleToEmbark().length}
              <select class="sel" value="" onchange={(ev) => { const v = (ev.target as HTMLSelectElement).value; if (v) listStore.embark(list.id, unit.uid, v); (ev.target as HTMLSelectElement).value=''; }}>
                <option value="">+ Embark a unit…</option>
                {#each eligibleToEmbark() as o}<option value={o.uid}>{getDatasheet(o.datasheetId)?.name}</option>{/each}
              </select>
            {:else if used >= cap}
              <span class="hint">Full.</span>
            {:else}
              <span class="hint">No eligible units to embark.</span>
            {/if}
          </div>
        {/if}

        <!-- SPLIT GROUPS: per-group location + wargear -->
        {#if unit.groups?.length}
          <div class="field col">
            <span class="lbl">Groups</span>
            {#each unit.groups as g, i}
              <div class="group">
                <div class="group-head">
                  <span>Group {i + 1} — {g.size} models · {g.transportUid ? `in ${unitName(g.transportUid)}` : 'on foot'}</span>
                  {#if g.transportUid}<button class="mini" onclick={() => listStore.disembarkGroup(list.id, unit.uid, g.id)}>Disembark</button>{/if}
                </div>
                <div class="gear">
                  {#each gear(g.loadout) as { id, w }}
                    <label class="gear-item"><input type="checkbox" checked={equipped(g.loadout, id)} onchange={() => listStore.toggleGroupLoadout(list.id, unit.uid, g.id, id, d.weapons)} /><span class="gn">{w!.name}</span><span class="gk">{w!.kind === 'ranged' ? 'R' : 'M'}</span></label>
                  {/each}
                </div>
              </div>
            {/each}
            <button class="mini wide" onclick={() => listStore.unsplit(list.id, unit.uid)}>Recombine (undo split)</button>
          </div>
        {:else}
          <!-- whole-unit wargear -->
          <div class="field col">
            <span class="lbl">Wargear ({d.weapons.length} options)</span>
            <div class="gear">
              {#each gear(unit.loadout) as { id, w }}
                <label class="gear-item"><input type="checkbox" checked={equipped(unit.loadout, id)} onchange={() => listStore.toggleLoadout(list.id, unit.uid, id, d.weapons)} /><span class="gn">{w!.name}</span><span class="gk">{w!.kind === 'ranged' ? 'R' : 'M'}</span></label>
              {/each}
            </div>
          </div>
          {#if whereWhole}
            <div class="field"><span class="lbl">Embarked</span><span class="hint">In {whereWhole}</span><button class="mini" onclick={() => listStore.disembark(list.id, unit.uid)}>Disembark</button></div>
          {/if}
        {/if}

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
  .field { display: flex; align-items: center; gap: 10px; padding: 8px 0; flex-wrap: wrap; }
  .field.col { flex-direction: column; align-items: stretch; gap: 4px; }
  .lbl { font-size: 11px; text-transform: uppercase; color: var(--text-dim); }
  .chip { font-size: 13px; background: var(--surface-2); min-height: 32px; align-self: flex-start; }
  .sel { height: 38px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; font: inherit; }
  .hint { font-size: 12px; color: var(--text-dim); }

  .aboard { display: flex; justify-content: space-between; align-items: center; font-size: 13px; background: var(--surface-2); border-radius: 6px; padding: 4px 8px; }
  .group { border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; }
  .group-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 4px; }
  .mini { font-size: 11px; min-height: 28px; padding: 0 8px; background: var(--surface-2); }
  .mini.wide { width: 100%; }

  .gear { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; }
  .gear-item { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 3px 0; }
  .gn { flex: 1; }
  .gk { font-size: 10px; color: var(--text-dim); border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; }
  .rm { width: 100%; margin-top: 8px; color: var(--danger); border-color: var(--danger); background: none; }
</style>
