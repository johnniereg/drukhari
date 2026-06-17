<script lang="ts">
  import { catalog } from '../lib/catalog';
  import UnitCard from '../components/UnitCard.svelte';

  let query = $state('');
  const filtered = $derived(
    catalog.datasheets.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  );
</script>

<input class="search" type="search" placeholder="Search units…" bind:value={query} autocomplete="off" />

{#each filtered as unit (unit.id)}
  <UnitCard {unit} />
{/each}

{#if !filtered.length}
  <p class="empty">No units match “{query}”.</p>
{/if}

<style>
  .search {
    width: 100%;
    height: 34px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-dim);
    padding: 0 12px;
    font-size: 13px;
    margin-bottom: 10px;
    opacity: 0.7;
  }
  .search:focus { outline: none; opacity: 1; color: var(--text); border-color: var(--accent); }
  .empty { color: var(--text-dim); text-align: center; padding: 20px; }
</style>
