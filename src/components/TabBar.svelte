<script lang="ts">
  export type Tab = 'browse' | 'lists' | 'game';
  let { active, onchange }: { active: Tab; onchange: (t: Tab) => void } = $props();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'browse', label: 'Browse', icon: '☰' },
    { id: 'lists', label: 'Lists', icon: '◳' },
    { id: 'game', label: 'Game', icon: '⚔' }
  ];
</script>

<nav class="tabbar">
  {#each tabs as t}
    <button class="tab" class:active={active === t.id} onclick={() => onchange(t.id)} aria-current={active === t.id}>
      <span class="icon">{t.icon}</span>
      <span class="lbl">{t.label}</span>
    </button>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 20;
  }
  .tab {
    background: none;
    border: none;
    border-radius: 0;
    min-height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--text-dim);
  }
  .tab.active { color: var(--accent); background: none; }
  .icon { font-size: 18px; line-height: 1; }
  .lbl { font-size: 11px; }
</style>
