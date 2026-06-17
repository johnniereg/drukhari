<script lang="ts">
  import { catalog } from './lib/catalog';
  import UnitCard from './components/UnitCard.svelte';

  let query = $state('');
  const filtered = $derived(
    catalog.datasheets.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  );
</script>

<header class="topbar">
  <h1 class="small-caps">Drukhari</h1>
  <span class="meta">{catalog.meta.edition} ed · {catalog.datasheets.length} datasheets</span>
</header>

<main>
  <input
    class="search"
    type="search"
    placeholder="Search units…"
    bind:value={query}
    autocomplete="off"
  />

  {#each filtered as unit (unit.id)}
    <UnitCard {unit} />
  {/each}

  {#if !filtered.length}
    <p class="empty">No units match “{query}”.</p>
  {/if}

  <p class="footnote">
    Points are placeholders pending confirmation against the current MFM ({catalog.meta.pointsVersion}).
  </p>
</main>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: 10px 14px;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  h1 { font-size: 22px; margin: 0; color: var(--accent); }
  .meta { font-size: 12px; color: var(--text-dim); }
  main { padding: 12px 14px 40px; max-width: 720px; margin: 0 auto; }
  .search {
    width: 100%;
    min-height: var(--tap);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    padding: 0 14px;
    font: inherit;
    margin-bottom: 8px;
  }
  .empty { color: var(--text-dim); text-align: center; padding: 20px; }
  .footnote { color: var(--text-dim); font-size: 11px; margin-top: 20px; text-align: center; }
</style>
