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
  /* Secondary: with ~20 units, scanning is primary; search is a fallback. */
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
  .search:focus {
    outline: none;
    opacity: 1;
    color: var(--text);
    border-color: var(--accent);
  }
  .empty { color: var(--text-dim); text-align: center; padding: 20px; }
  .footnote { color: var(--text-dim); font-size: 11px; margin-top: 20px; text-align: center; }
</style>
