<script>
  let { result, onClose } = $props();

  function getColumns(rows) {
    return rows?.length ? Object.keys(rows[0]) : [];
  }

  function formatCell(value) {
    return value === null || value === undefined || value === '' ? 'NULL' : String(value);
  }
</script>

<aside class:open={!!result}>
  {#if result}
    <div class="panel-header">
      <div>
        <h2>SQL Results</h2>
        <p>{result.rows?.length || 0} rows returned</p>
      </div>
      <button class="icon-btn" onclick={onClose} aria-label="Close SQL results">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="panel-body">
      <section>
        <h3>SQL</h3>
        <pre><code>{result.sql}</code></pre>
      </section>

      <section>
        <h3>Result Table</h3>
        {#if result.rows?.length}
          {@const columns = getColumns(result.rows)}
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  {#each columns as column}
                    <th>{column}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each result.rows as row}
                  <tr>
                    {#each columns as column}
                      <td>{formatCell(row[column])}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="empty">No rows returned.</p>
        {/if}
      </section>

      <section class="notes">
        {#each result.notes || [] as note}
          <p>{note}</p>
        {/each}
        <p>Results are limited to {result.rowLimit} rows.</p>
      </section>
    </div>
  {/if}
</aside>

<style>
  aside {
    width: 0;
    min-width: 0;
    flex: 0 0 0;
    overflow: hidden;
    background: #171c29;
    border-left: 1px solid #2d3748;
    display: flex;
    flex-direction: column;
    transition: width 0.2s ease, flex-basis 0.2s ease;
  }

  aside.open {
    width: min(560px, 42vw);
    flex-basis: min(560px, 42vw);
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid #2d3748;
  }

  .panel-header h2 {
    color: #e2e8f0;
    font-size: 16px;
    line-height: 1.2;
    margin-bottom: 3px;
  }

  .panel-header p {
    color: #718096;
    font-size: 12px;
  }

  .icon-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
  }

  .icon-btn:hover {
    color: #e2e8f0;
  }

  .icon-btn svg {
    display: block;
    width: 18px;
    height: 18px;
  }

  .panel-body {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }

  section {
    margin-bottom: 18px;
  }

  h3 {
    color: #cbd5e0;
    font-size: 12px;
    letter-spacing: 0;
    margin-bottom: 8px;
  }

  pre {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 6px;
    color: #e2e8f0;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    line-height: 1.45;
    margin: 0;
    overflow-x: auto;
    padding: 10px;
    white-space: pre;
  }

  .table-wrap {
    border: 1px solid #2d3748;
    border-radius: 6px;
    max-width: 100%;
    overflow: auto;
  }

  table {
    border-collapse: collapse;
    color: #dbe4f0;
    font-size: 12px;
    min-width: 100%;
    width: max-content;
  }

  th,
  td {
    border-bottom: 1px solid #2d3748;
    border-right: 1px solid #2d3748;
    max-width: 260px;
    padding: 7px 9px;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }

  th {
    background: #1e2535;
    color: #f8fafc;
    font-weight: 700;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  td:last-child,
  th:last-child {
    border-right: 0;
  }

  .empty,
  .notes p {
    color: #a0aec0;
    font-size: 12px;
    line-height: 1.45;
    margin-bottom: 8px;
  }

  .notes {
    border-top: 1px solid #2d3748;
    padding-top: 12px;
  }
</style>
