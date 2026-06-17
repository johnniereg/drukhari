<script lang="ts">
  import type { Statline } from '../lib/catalog/types';
  let { stats }: { stats: Statline } = $props();
  const cells = $derived([
    { label: 'M', value: stats.m },
    { label: 'T', value: String(stats.t) },
    { label: 'SV', value: stats.sv },
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
    text-align: center;
    padding: 6px 2px;
  }
  .label { font-size: 11px; color: var(--text-dim); }
  .value { font-size: 15px; font-weight: 700; }
</style>
