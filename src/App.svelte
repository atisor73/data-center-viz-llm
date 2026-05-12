<script>
  import Map from './lib/Map.svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import Filters from './lib/Filters.svelte';
  import ChatSidebar from './lib/ChatSidebar.svelte';
  import SqlResultsPanel from './lib/SqlResultsPanel.svelte';

  let selectedCenter = $state(null);
  let activeSqlResult = $state(null);
  let activeStatuses = $state(new Set(['Operating', 'Proposed', 'Approved/Permitted/Under construction', 'Expanding', 'Suspended', 'Cancelled']));
  let activeBWSLabels = $state(new Set(['Low (<10%)', 'Low - Medium (10-20%)', 'Medium - High (20-40%)', 'High (40-80%)', 'Extremely High (>80%)', 'Arid and Low Water Use']));
  let searchQuery = $state('');
  let totalCount = $state(0);

  function handleSelect(center) {
    selectedCenter = center;
  }

  function handleClose() {
    selectedCenter = null;
  }

  function handleApplyFilters(filter) {
    searchQuery = filter.searchQuery || '';
    activeStatuses = new Set(filter.activeStatuses);
  }
</script>

<div class="app">
  <header>
    <h1>US Data Center Map</h1>
    <p>FracTracker Alliance · {totalCount} facilities shown</p>
  </header>

  <div class="layout">
    <Sidebar center={selectedCenter} onClose={handleClose} />

    <div class="map-panel">
      <Filters bind:activeStatuses bind:searchQuery bind:activeBWSLabels/>
      <Map
        {activeStatuses}
        {searchQuery}
        {activeBWSLabels}
        {selectedCenter}
        onSelect={handleSelect}
        bind:visibleCount={totalCount}
      />
    </div>

    <SqlResultsPanel result={activeSqlResult} onClose={() => activeSqlResult = null} />
    <ChatSidebar
      onShowResult={(result) => activeSqlResult = result}
      onApplyFilters={handleApplyFilters}
    />
  </div>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    overflow: hidden;
    height: 100vh;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  header {
    background: #1a1f2e;
    border-bottom: 1px solid #2d3748;
    padding: 12px 20px;
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-shrink: 0;
    z-index: 10;
  }

  header h1 {
    font-size: 18px;
    font-weight: 700;
    color: #e2e8f0;
  }

  header p {
    font-size: 13px;
    color: #718096;
  }

  .layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .map-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
</style>
