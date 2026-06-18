<script lang="ts">
  import { listStore } from '../lib/store/lists.svelte';
  import GameMode from '../components/GameMode.svelte';
  let { gotoLists }: { gotoLists: () => void } = $props();
  const active = $derived(listStore.active);
</script>

{#if !active}
  <div class="gate">
    <p class="big">Game Mode is list-driven.</p>
    <p class="dim">Select or build a list, then come here for a no-scroll, at-a-glance view of your army's stats and weapon profiles during a game.</p>
    <button class="primary" onclick={gotoLists}>Go to Lists</button>
  </div>
{:else}
  <GameMode list={active} />
{/if}

<style>
  .gate { text-align: center; padding: 40px 20px; }
  .big { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .dim { color: var(--text-dim); font-size: 14px; line-height: 1.5; margin-bottom: 16px; }
  .primary { background: var(--accent-dim); border-color: var(--accent); }
</style>
