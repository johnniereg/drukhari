<script lang="ts">
  import { detachments, getDetachment } from '../lib/catalog';
  import { listStore, type ArmyList } from '../lib/store/lists.svelte';

  let { list }: { list: ArmyList } = $props();
  let showRules = $state(false);

  const current = $derived(getDetachment(list.detachment));
</script>

<div class="det">
  <div class="row">
    <select
      class="det-select"
      value={list.detachment ?? ''}
      onchange={(e) => listStore.setDetachment(list.id, (e.target as HTMLSelectElement).value || undefined)}
    >
      <option value="">No detachment</option>
      {#each detachments as d}
        <option value={d.id}>{d.name}</option>
      {/each}
    </select>
    {#if current}
      <button class="rules-toggle" onclick={() => (showRules = !showRules)}>{showRules ? 'Hide' : 'Rules'}</button>
    {/if}
  </div>

  {#if current && showRules}
    <div class="rules">
      <h4>{current.ruleName}</h4>
      <p>{current.ruleText}</p>

      <h4>Enhancements</h4>
      {#each current.enhancements as e}
        <div class="enh">
          <span class="enh-name">{e.name} <span class="enh-pts">{e.pts} pts</span>{#if !e.verified}<span class="ph">placeholder</span>{/if}</span>
          <span class="enh-text">{e.text}</span>
        </div>
      {/each}

      <h4>Stratagems</h4>
      {#each current.stratagems as s}
        <div class="strat">
          <span class="strat-name">{s.name} <span class="strat-meta">{s.cp} · {s.when}</span></span>
          <span class="strat-text">{s.effect}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .det { margin-bottom: 14px; }
  .row { display: flex; gap: 8px; }
  .det-select {
    flex: 1; height: 40px; background: var(--surface-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; font: inherit;
  }
  .rules-toggle { white-space: nowrap; }
  .rules { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-top: 8px; }
  h4 { font-size: 11px; text-transform: uppercase; color: var(--accent); margin: 10px 0 4px; }
  h4:first-child { margin-top: 0; }
  .rules p { font-size: 13px; line-height: 1.45; margin: 0; }
  .enh, .strat { display: flex; flex-direction: column; padding: 5px 0; border-bottom: 1px solid var(--border); }
  .enh-name, .strat-name { font-size: 13px; font-weight: 600; }
  .enh-pts { color: var(--accent); font-weight: 700; }
  .strat-meta { color: var(--text-dim); font-weight: 400; font-size: 11px; }
  .ph { color: var(--danger); font-size: 10px; text-transform: uppercase; margin-left: 6px; border: 1px solid var(--danger); border-radius: 4px; padding: 0 4px; }
  .enh-text, .strat-text { font-size: 12px; color: var(--text-dim); line-height: 1.4; }
</style>
