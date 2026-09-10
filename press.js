/* Optional local search. Every record and source link remains in the static HTML. */
(() => {
  'use strict';
  const search = document.getElementById('press-search');
  const input = document.getElementById('press-query');
  const clear = document.getElementById('press-clear');
  const status = document.getElementById('press-status');
  const empty = document.getElementById('press-empty');
  const records = Array.from(document.querySelectorAll('[data-press-record]'));
  const groups = Array.from(document.querySelectorAll('[data-press-group]'));
  if (!search || !input || !clear || !status || !empty || !records.length) return;
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const text = new Map(records.map(record => [record, normalize(record.textContent)]));
  function filter() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    records.forEach(record => {
      record.hidden = !words.every(word => text.get(record).includes(word));
      if (!record.hidden) count += 1;
    });
    groups.forEach(group => {
      group.hidden = !Array.from(group.querySelectorAll('[data-press-record]')).some(record => !record.hidden);
    });
    clear.hidden = !input.value;
    empty.hidden = count > 0;
    status.textContent = words.length ? `Showing ${count} of ${records.length} records.` : `Showing all ${records.length} records.`;
  }
  function reset() { input.value = ''; filter(); }
  input.addEventListener('input', filter);
  input.addEventListener('keydown', event => { if (event.key === 'Escape') reset(); });
  clear.addEventListener('click', () => { reset(); input.focus(); });
  document.querySelectorAll('.press-jumps a').forEach(link => link.addEventListener('click', reset));
  window.addEventListener('hashchange', () => { if (input.value) reset(); });
  search.hidden = false;
})();
