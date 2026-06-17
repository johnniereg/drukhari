<script lang="ts">
  import { catalog } from './lib/catalog';
  import TabBar, { type Tab } from './components/TabBar.svelte';
  import Browse from './routes/Browse.svelte';
  import Lists from './routes/Lists.svelte';
  import Game from './routes/Game.svelte';

  let tab = $state<Tab>('browse');
  const titles: Record<Tab, string> = { browse: 'Drukhari', lists: 'Army Lists', game: 'Game Mode' };
</script>

<header class="topbar">
  <h1 class="small-caps">{titles[tab]}</h1>
  {#if tab === 'browse'}<span class="meta">{catalog.meta.edition} ed · {catalog.datasheets.length} datasheets</span>{/if}
</header>

<main>
  {#if tab === 'browse'}
    <Browse />
  {:else if tab === 'lists'}
    <Lists />
  {:else}
    <Game gotoLists={() => (tab = 'lists')} />
  {/if}
</main>

<TabBar active={tab} onchange={(t) => (tab = t)} />

<style>
  .topbar {
    position: sticky; top: 0; z-index: 10;
    background: var(--bg); border-bottom: 1px solid var(--border);
    padding: 10px 14px; display: flex; align-items: baseline; gap: 10px;
  }
  h1 { font-size: 22px; margin: 0; color: var(--accent); }
  .meta { font-size: 12px; color: var(--text-dim); }
  main { padding: 12px 14px calc(72px + env(safe-area-inset-bottom)); max-width: 720px; margin: 0 auto; }
</style>
