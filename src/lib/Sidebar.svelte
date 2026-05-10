<script>
  let { center, onClose } = $props();

  const STATUS_COLOR = {
    'Operating':                             '#48bb78',
    'Proposed':                              '#63b3ed',
    'Approved/Permitted/Under construction': '#f6ad55',
    'Expanding':                             '#9f7aea',
    'Suspended':                             '#718096',
    'Cancelled':                             '#fc8181',
    'Unknown':                               '#a0aec0',
  };

  function fmt(val) {
    return val && val !== 'Unknown' && val !== '' ? val : null;
  }

  function fmtNumber(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n.toLocaleString();
  }
</script>

<aside class:open={!!center}>
  {#if center}
    <div class="sidebar-header">
      <div class="header-content">
        <h2>{center.facility_name || 'Unnamed Facility'}</h2>
        <div class="status-badge" style="background:{STATUS_COLOR[center.status] || '#a0aec0'}22; color:{STATUS_COLOR[center.status] || '#a0aec0'}; border-color:{STATUS_COLOR[center.status] || '#a0aec0'}44">
          {center.status}
        </div>
      </div>
      <button class="close-btn" onclick={onClose} aria-label="Close">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>

    <div class="sidebar-body">
      <!-- Location -->
      <section>
        <h3>Location</h3>
        <dl>
          {#if fmt(center.address)}
            <div><dt>Address</dt><dd>{center.address}</dd></div>
          {/if}
          {#if fmt(center.city) || fmt(center.state)}
            <div>
              <dt>City / State</dt>
              <dd>{[center.city, center.state].filter(fmt).join(', ')}</dd>
            </div>
          {/if}
          {#if fmt(center.county)}
            <div><dt>County</dt><dd>{center.county}</dd></div>
          {/if}
          {#if fmt(center.zip)}
            <div><dt>ZIP</dt><dd>{center.zip}</dd></div>
          {/if}
        </dl>
      </section>

      <!-- Operator -->
      {#if fmt(center.operator_name) || fmt(center.tenant) || fmt(center.purpose)}
        <section>
          <h3>Operator</h3>
          <dl>
            {#if fmt(center.operator_name)}
              <div><dt>Operator</dt><dd>{center.operator_name}</dd></div>
            {/if}
            {#if fmt(center.tenant)}
              <div><dt>Tenant</dt><dd>{center.tenant}</dd></div>
            {/if}
            {#if fmt(center.purpose)}
              <div><dt>Purpose</dt><dd>{center.purpose}</dd></div>
            {/if}
          </dl>
        </section>
      {/if}

      <!-- Capacity -->
      <section>
        <h3>Capacity &amp; Size</h3>
        <dl>
          {#if fmt(center.sizerank)}
            <div><dt>Size Category</dt><dd>{center.sizerank}</dd></div>
          {/if}
          {#if fmt(center.mw) && center.mw !== 'Unknown'}
            <div><dt>Power Capacity</dt><dd>{center.mw} MW</dd></div>
          {/if}
          {#if fmt(center.facility_size_sqft)}
            <div><dt>Facility Size</dt><dd>{fmtNumber(center.facility_size_sqft.replace(/,/g,''))} sq ft</dd></div>
          {/if}
          {#if fmt(center.property_size_acres)}
            <div><dt>Property Size</dt><dd>{center.property_size_acres} acres</dd></div>
          {/if}
          {#if fmt(center.number_of_buildings)}
            <div><dt>Buildings</dt><dd>{center.number_of_buildings}</dd></div>
          {/if}
        </dl>
      </section>

      <!-- Power & Cooling -->
      {#if fmt(center.power_source) || fmt(center.cooling_type) || fmt(center.cooling_source) || fmt(center.dedicated_power_plant)}
        <section>
          <h3>Infrastructure</h3>
          <dl>
            {#if fmt(center.power_source)}
              <div><dt>Power Source</dt><dd>{center.power_source}</dd></div>
            {/if}
            {#if fmt(center.dedicated_power_plant)}
              <div><dt>Dedicated Plant</dt><dd>{center.dedicated_power_plant}</dd></div>
            {/if}
            {#if fmt(center.number_of_generators)}
              <div><dt>Generators</dt><dd>{center.number_of_generators}</dd></div>
            {/if}
            {#if fmt(center.cooling_source)}
              <div><dt>Cooling Source</dt><dd>{center.cooling_source}</dd></div>
            {/if}
            {#if fmt(center.cooling_type)}
              <div><dt>Cooling Type</dt><dd>{center.cooling_type}</dd></div>
            {/if}
          </dl>
        </section>
      {/if}

      <!-- Project Info -->
      {#if fmt(center.project_cost) || fmt(center.expected_date_online)}
        <section>
          <h3>Project</h3>
          <dl>
            {#if fmt(center.project_cost)}
              <div><dt>Project Cost</dt><dd>{center.project_cost}</dd></div>
            {/if}
            {#if fmt(center.expected_date_online)}
              <div><dt>Expected Online</dt><dd>{center.expected_date_online}</dd></div>
            {/if}
          </dl>
        </section>
      {/if}

      <!-- Community -->
      {#if center.community_pushback === 'Yes' || fmt(center.resistance_status) || fmt(center.advocacy_information)}
        <section class="community">
          <h3>Community Response</h3>
          <dl>
            <div>
              <dt>Pushback</dt>
              <dd class:yes={center.community_pushback === 'Yes'} class:no={center.community_pushback === 'No'}>
                {center.community_pushback || 'Unknown'}
              </dd>
            </div>
            {#if fmt(center.resistance_status)}
              <div><dt>Resistance Level</dt><dd>{center.resistance_status}</dd></div>
            {/if}
            {#if fmt(center.advocacy_information)}
              <div><dt>Advocacy</dt><dd>{center.advocacy_information}</dd></div>
            {/if}
            {#if fmt(center.nda)}
              <div><dt>NDA</dt><dd>{center.nda}</dd></div>
            {/if}
          </dl>
          {#if fmt(center.community_group_website_1)}
            <a href={center.community_group_website_1} target="_blank" rel="noopener" class="link-btn">Community Group →</a>
          {/if}
          {#if fmt(center.community_group_website_2)}
            <a href={center.community_group_website_2} target="_blank" rel="noopener" class="link-btn">Community Group 2 →</a>
          {/if}
          {#if fmt(center.petition_url)}
            <a href={center.petition_url} target="_blank" rel="noopener" class="link-btn">Petition →</a>
          {/if}
        </section>
      {/if}

      <!-- Other Info -->
      {#if fmt(center.other_info)}
        <section>
          <h3>Additional Info</h3>
          <p class="other-info">{center.other_info}</p>
        </section>
      {/if}

      <!-- Sources -->
      {#if fmt(center.information_source)}
        <section>
          <h3>Sources</h3>
          <p class="source-type">{center.information_source}</p>
          <div class="source-links">
            {#each ['info_source_1','info_source_2','info_source_3','info_source_4','info_source_5','info_source_6','info_source_7','info_source_8'] as key, i}
              {#if fmt(center[key])}
                <a href={center[key]} target="_blank" rel="noopener" class="source-link">Source {i+1} →</a>
              {/if}
            {/each}
          </div>
        </section>
      {/if}

      {#if fmt(center.date_updated)}
        <div class="meta">Last updated: {center.date_updated}</div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
      </svg>
      <p>Click a dot on the map to view facility details</p>
    </div>
  {/if}
</aside>

<style>
  aside {
    width: 0;
    overflow: hidden;
    background: #1a1f2e;
    border-right: 1px solid #2d3748;
    display: flex;
    flex-direction: column;
    transition: width 0.25s ease;
    flex-shrink: 0;
  }

  aside.open {
    width: 320px;
    overflow-y: auto;
  }

  .sidebar-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 16px 12px;
    border-bottom: 1px solid #2d3748;
    position: sticky;
    top: 0;
    background: #1a1f2e;
    z-index: 2;
  }

  .header-content {
    flex: 1;
    min-width: 0;
  }

  h2 {
    font-size: 15px;
    font-weight: 700;
    color: #e2e8f0;
    line-height: 1.4;
    margin-bottom: 6px;
  }

  .status-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .close-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 2px;
    flex-shrink: 0;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: #e2e8f0;
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
    display: block;
  }

  .sidebar-body {
    padding: 12px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #718096;
    border-bottom: 1px solid #2d3748;
    padding-bottom: 4px;
  }

  dl {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  dl > div {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 8px;
    align-items: baseline;
  }

  dt {
    font-size: 11px;
    color: #718096;
    font-weight: 500;
  }

  dd {
    font-size: 12px;
    color: #e2e8f0;
    line-height: 1.4;
  }

  dd.yes { color: #fc8181; font-weight: 600; }
  dd.no  { color: #48bb78; }

  .other-info {
    font-size: 12px;
    color: #a0aec0;
    line-height: 1.6;
  }

  .source-type {
    font-size: 11px;
    color: #718096;
    margin-bottom: 4px;
  }

  .source-links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .source-link, .link-btn {
    font-size: 11px;
    color: #63b3ed;
    text-decoration: none;
    border: 1px solid #2d3748;
    border-radius: 4px;
    padding: 3px 8px;
    transition: all 0.15s;
  }

  .source-link:hover, .link-btn:hover {
    background: #2d3748;
    color: #90cdf4;
  }

  .link-btn {
    display: inline-block;
    margin-top: 4px;
    margin-right: 6px;
  }

  .community {
    background: #1e2535;
    border: 1px solid #2d3748;
    border-radius: 6px;
    padding: 10px;
  }

  .meta {
    font-size: 11px;
    color: #4a5568;
    text-align: right;
    padding-top: 8px;
    border-top: 1px solid #2d3748;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 100%;
    padding: 20px;
    color: #4a5568;
    text-align: center;
  }

  .empty-state svg {
    width: 40px;
    height: 40px;
  }

  .empty-state p {
    font-size: 13px;
    line-height: 1.5;
  }
</style>
