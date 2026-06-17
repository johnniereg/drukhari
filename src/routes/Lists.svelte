<script lang="ts">
  import { listStore } from '../lib/store/lists.svelte';
  import { catalog } from '../lib/catalog';
  import DetachmentPanel from '../components/DetachmentPanel.svelte';
  import ListUnitRow from '../components/ListUnitRow.svelte';

  let newName = $state('');
  let adding = $state(false);

  const active = $derived(listStore.active);

  function createList() {
    listStore.create(newName || 'New list');
    newName = '';
  }
</script>

{#if !active}
  <!-- List index -->
  <div class="create">
    <input class="name-in" placeholder="New list name…" bind:value={newName} onkeydown={(e) => e.key === 'Enter' && createList()} />
    <button class="primary" onclick={createList}>+ Create</button>
  </div>

  {#if !listStore.lists.length}
    <p class="empty">No lists yet. Create one to start theory-crafting.</p>
  {/if}

  {#each listStore.lists as l (l.id)}
    <button class="list-row" onclick={() => (listStore.activeId = l.id)}>
      <div class="list-main">
        <span class="list-name">{l.name}</span>
        <span class="badge {l.mode}">{l.mode}</span>
      </div>
      <div class="list-sub">
        {listStore.total(l)} / {l.pointCap} pts · {l.units.length} units
      </div>
    </button>
  {/each}
{:else}
  <!-- List editor -->
  <div class="editor-head">
    <button class="back" onclick={() => (listStore.activeId = null)}>‹ Lists</button>
    <button class="del" onclick={() => listStore.remove(active.id)}>Delete</button>
  </div>

  <input class="title-in" value={active.name} oninput={(e) => listStore.update(active.id, { name: (e.target as HTMLInputElement).value })} />

  <div class="meta-row">
    <button class="badge {active.mode}" onclick={() => listStore.update(active.id, { mode: active.mode === 'official' ? 'draft' : 'official' })}>
      {active.mode}
    </button>
    <span class="total" class:over={listStore.total(active) > active.pointCap}>
      {listStore.total(active)} / {active.pointCap} pts
    </span>
  </div>

  <DetachmentPanel list={active} />

  {#each active.units as u (u.uid)}
    <ListUnitRow list={active} unit={u} />
  {/each}

  <button class="add-toggle" onclick={() => (adding = !adding)}>{adding ? 'Close' : '+ Add unit'}</button>

  {#if adding}
    <div class="picker">
      {#each catalog.datasheets as d (d.id)}
        <button class="pick" onclick={() => listStore.addUnit(active.id, d.id)}>
          <span>{d.name}</span>
          <span class="pick-pts">{d.points[0]?.pts ?? '—'} pts</span>
        </button>
      {/each}
    </div>
  {/if}

  <p class="note">Points shown faded are placeholders pending MFM confirmation.</p>
{/if}

<style>
  .create { display: flex; gap: 8px; margin-bottom: 12px; }
  .name-in, .title-in {
    flex: 1; height: 40px; background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); padding: 0 12px; font: inherit;
  }
  .title-in { width: 100%; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .primary { background: var(--accent-dim); border-color: var(--accent); white-space: nowrap; }
  .empty { color: var(--text-dim); text-align: center; padding: 20px; }

  .list-row, .pick { width: 100%; text-align: left; }
  .list-row {
    display: flex; flex-direction: column; gap: 4px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; margin-bottom: 8px;
  }
  .list-main { display: flex; align-items: center; gap: 8px; }
  .list-name { font-size: 16px; font-weight: 700; }
  .list-sub { font-size: 12px; color: var(--text-dim); }

  .badge { font-size: 11px; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border); min-height: 0; }
  .badge.official { color: var(--ok); border-color: var(--ok); }
  .badge.draft { color: var(--text-dim); }

  .editor-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .back, .del { background: none; border: none; min-height: 36px; padding: 0; }
  .back { color: var(--accent); }
  .del { color: var(--danger); }

  .meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .total { font-weight: 700; }
  .total.over { color: var(--danger); }

  .add-toggle { width: 100%; margin: 10px 0; }
  .picker { display: flex; flex-direction: column; gap: 4px; }
  .pick {
    display: flex; justify-content: space-between; background: var(--surface-2);
    border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;
  }
  .pick-pts { color: var(--text-dim); font-size: 13px; }
  .note { color: var(--text-dim); font-size: 11px; margin-top: 16px; text-align: center; }
</style>
