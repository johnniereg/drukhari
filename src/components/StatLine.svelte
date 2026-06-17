<script lang="ts">
  import type { Statline } from '../lib/catalog/types';
  let { stats }: { stats: Statline } = $props();

  // Saves come as "4+, 4++, 5+++": show the armour save large, the rest compact
  // beneath, so multi-save characters don't stretch the whole row taller.
  const saves = $derived(String(stats.sv).split(',').map((s) => s.trim()));
  const cells = $derived([
    { label: 'M', value: stats.m },
    { label: 'T', value: String(stats.t) },
    { label: 'SV', value: saves[0], sub: saves.slice(1).join(' ') },
    { label: 'W', value: String(stats.w) },
    { label: 'LD', value: stats.ld },
    { label: 'OC', value: String(stats.oc) }
  ]);
</script>

<div class="statline">
  {#each cells as c}
    <div class="stat">
      <div class="label">{c.label}</div>
      <div class="value">{c.value}</div>
      {#if c.sub}<div class="sub">{c.sub}</div>{/if}
    </div>
  {/each}
</div>

<style>
  .statline {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    margin: 8px 0;
  }
  .stat {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px;
    overflow: hidden;
  }
  .label { font-size: 10px; color: var(--text-dim); line-height: 1.1; }
  .value { font-size: 16px; font-weight: 700; line-height: 1.1; }
  .sub { font-size: 10px; color: var(--text-dim); line-height: 1.1; margin-top: 1px; white-space: nowrap; }
</style>
