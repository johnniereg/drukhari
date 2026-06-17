<script lang="ts">
  import type { Datasheet } from '../lib/catalog/types';
  import { weaponsFor, resolveAbility, startingPoints } from '../lib/catalog';
  import StatLine from './StatLine.svelte';
  import WeaponTable from './WeaponTable.svelte';

  let { unit }: { unit: Datasheet } = $props();
  let open = $state(false);

  const ranged = $derived(weaponsFor(unit, 'ranged'));
  const melee = $derived(weaponsFor(unit, 'melee'));
  const abilities = $derived(unit.abilities.map(resolveAbility));
  const painAbility = $derived(unit.pain ? resolveAbility(unit.pain) : null);
</script>

<div class="card">
  <button class="header" onclick={() => (open = !open)} aria-expanded={open}>
    <div class="title">
      <span class="name small-caps">{unit.name}</span>
      <span class="role">{unit.role}</span>
    </div>
    <div class="right">
      <span class="pts">{startingPoints(unit) ? `${startingPoints(unit)} pts` : '— pts'}</span>
      <span class="chev" class:open>›</span>
    </div>
  </button>

  <StatLine stats={unit.stats} />

  {#if open}
    <div class="body">
      {#if unit.image}
        <img class="ref-photo" src={unit.image} alt={unit.name} loading="lazy" />
      {/if}

      {#if unit.modelProfiles?.length}
        <div class="profiles">
          {#each unit.modelProfiles as p}
            <div class="profile-row">
              <span class="pname small-caps">{p.name}</span>
              <span class="pstats">M {p.m} · T {p.t} · SV {p.sv} · W {p.w} · LD {p.ld} · OC {p.oc}</span>
            </div>
          {/each}
        </div>
      {/if}

      <WeaponTable weapons={ranged} kind="ranged" />
      <WeaponTable weapons={melee} kind="melee" />

      {#if abilities.length}
        <h3>Abilities</h3>
        <ul class="abilities">
          {#each abilities as a}
            <li><strong class="small-caps">{a.name}</strong>{#if a.text} — {a.text}{/if}</li>
          {/each}
        </ul>
      {/if}

      {#if painAbility}
        <h3>Pain — {painAbility.name}</h3>
        <p class="pain">{#if painAbility.text}{painAbility.text}{:else}<span class="dim">No description on file.</span>{/if}</p>
      {/if}

      {#if unit.transport}
        <p class="transport">
          <strong>Transport:</strong> capacity {unit.transport.capacity}{#if unit.transport.splitGroupSize}, splittable into groups of {unit.transport.splitGroupSize}{/if}.
          {#if unit.transport.notes}<span class="dim"> {unit.transport.notes}</span>{/if}
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; margin: 8px 0; }
  .header { width: 100%; display: flex; justify-content: space-between; align-items: center; background: none; border: none; padding: 0; min-height: var(--tap); text-align: left; }
  .title { display: flex; flex-direction: column; }
  .name { font-size: 18px; font-weight: 700; }
  .role { font-size: 12px; color: var(--text-dim); }
  .right { display: flex; align-items: center; gap: 10px; }
  .pts { color: var(--accent); font-weight: 700; font-size: 14px; }
  .chev { transition: transform 0.15s; color: var(--text-dim); font-size: 22px; }
  .chev.open { transform: rotate(90deg); }
  h3 { font-size: 12px; text-transform: uppercase; color: var(--text-dim); margin: 12px 0 4px; }
  .abilities { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.4; }
  .abilities li { margin-bottom: 4px; }
  .pain, .transport { font-size: 13px; margin: 4px 0 0; line-height: 1.4; }
  .dim { color: var(--text-dim); }
  .ref-photo { width: 100%; max-height: 240px; object-fit: contain; border-radius: 8px; background: var(--surface-2); margin-bottom: 8px; }
  .profiles { margin: 4px 0 2px; }
  .profile-row { display: flex; flex-direction: column; padding: 4px 0; border-bottom: 1px solid var(--border); }
  .pname { font-size: 13px; font-weight: 700; }
  .pstats { font-size: 12px; color: var(--text-dim); }
</style>
