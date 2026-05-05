<script>
  let { activeStatuses = $bindable(), searchQuery = $bindable() } = $props();

  const STATUS_CONFIG = [
    { key: 'Operating',                              label: 'Operating',            color: '#48bb78' },
    { key: 'Proposed',                               label: 'Proposed',             color: '#63b3ed' },
    { key: 'Approved/Permitted/Under construction',  label: 'Approved / Under Const.', color: '#f6ad55' },
    { key: 'Expanding',                              label: 'Expanding',            color: '#9f7aea' },
    { key: 'Suspended',                              label: 'Suspended',            color: '#718096' },
    { key: 'Cancelled',                              label: 'Cancelled',            color: '#fc8181' },
  ];

  function toggle(key) {
    const next = new Set(activeStatuses);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    activeStatuses = next;
  }

  function toggleAll() {
    if (activeStatuses.size === STATUS_CONFIG.length) {
      activeStatuses = new Set();
    } else {
      activeStatuses = new Set(STATUS_CONFIG.map(s => s.key));
    }
  }
</script>

<div class="filters">
  <div class="search-wrap">
    <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
    </svg>
    <input
      type="text"
      placeholder="Search by name, city, full state name (e.g. Illinois)…"
      bind:value={searchQuery}
      class="search"
    />
    {#if searchQuery}
      <button class="clear-search" onclick={() => searchQuery = ''}>×</button>
    {/if}
  </div>

  <div class="legend">
    <button class="toggle-all" onclick={toggleAll}>
      {activeStatuses.size === STATUS_CONFIG.length ? 'Hide all' : 'Show all'}
    </button>
    {#each STATUS_CONFIG as s}
      <button
        class="chip"
        class:inactive={!activeStatuses.has(s.key)}
        onclick={() => toggle(s.key)}
        style="--dot: {s.color}"
      >
        <span class="dot"></span>
        {s.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .filters {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #1a1f2e;
    border-bottom: 1px solid #2d3748;
    flex-wrap: wrap;
    flex-shrink: 0;
    z-index: 5;
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 8px;
    width: 15px;
    height: 15px;
    color: #718096;
    pointer-events: none;
  }

  .search {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 13px;
    padding: 5px 28px 5px 28px;
    width: 220px;
    outline: none;
    transition: border-color 0.15s;
  }

  .search:focus {
    border-color: #4a90d9;
  }

  .search::placeholder {
    color: #4a5568;
  }

  .clear-search {
    position: absolute;
    right: 6px;
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .toggle-all {
    background: none;
    border: 1px solid #4a5568;
    border-radius: 4px;
    color: #a0aec0;
    cursor: pointer;
    font-size: 11px;
    padding: 3px 8px;
    transition: all 0.15s;
  }

  .toggle-all:hover {
    border-color: #718096;
    color: #e2e8f0;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #1e2535;
    border: 1px solid #2d3748;
    border-radius: 4px;
    color: #e2e8f0;
    cursor: pointer;
    font-size: 12px;
    padding: 3px 9px;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .chip:hover {
    background: #252d40;
  }

  .chip.inactive {
    opacity: 0.4;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dot);
    flex-shrink: 0;
  }
</style>
