<script lang="ts">
  import type { Weapon } from '../lib/catalog/types';
  let { weapons, kind }: { weapons: Weapon[]; kind: 'ranged' | 'melee' } = $props();
</script>

{#if weapons.length}
  <table class="weapons">
    <thead>
      <tr>
        <th class="name">{kind === 'ranged' ? 'Ranged' : 'Melee'}</th>
        {#if kind === 'ranged'}<th>R</th>{/if}
        <th>A</th>
        <th>{kind === 'ranged' ? 'BS' : 'WS'}</th>
        <th>S</th>
        <th>AP</th>
        <th>D</th>
      </tr>
    </thead>
    <tbody>
      {#each weapons as w}
        <tr>
          <td class="name">
            {w.name}
            {#if w.keywords.length}<div class="kw">[{w.keywords.join(', ')}]</div>{/if}
          </td>
          {#if kind === 'ranged'}<td>{w.range}</td>{/if}
          <td>{w.a}</td>
          <td>{w.skill}</td>
          <td>{w.s}</td>
          <td>{w.ap}</td>
          <td>{w.d}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .weapons { width: 100%; border-collapse: collapse; font-size: 13px; margin: 6px 0; }
  th, td { padding: 5px 4px; text-align: center; border-bottom: 1px solid var(--border); }
  th { color: var(--text-dim); font-size: 11px; text-transform: uppercase; }
  .name { text-align: left; }
  td.name { font-weight: 600; }
  .kw { font-size: 11px; color: var(--text-dim); font-weight: 400; }
</style>
