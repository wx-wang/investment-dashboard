/* The complete table is in HTML. Controls only filter/reorder existing rows. */
(function () {
  'use strict';
  const numericKeys = new Set(['price', 'total_mv_yi', 'pe_ttm', 'return_5d', 'return_20d', 'return_60d']);
  const signals = new Set(['all', 'three', 'trend', 'pullback']);
  const sortKeys = new Set(['name', 'symbol', 'industry', ...numericKeys]);
  function matches(row, state) {
    const terms = String(state.query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return terms.every(term => row.search.includes(term)) && (!state.industry || row.industryCode === state.industry) &&
      (state.signal === 'all' || (!row.stale && row[state.signal] === true));
  }
  function compareRows(left, right, key, order) {
    const a = left[key], b = right[key];
    const emptyA = a === null || a === undefined || a === '';
    const emptyB = b === null || b === undefined || b === '';
    if (emptyA !== emptyB) return emptyA ? 1 : -1;
    let compared = 0;
    if (!emptyA) compared = numericKeys.has(key) ? a - b : String(a).localeCompare(String(b), 'zh-CN', {numeric: true});
    if (compared) return order === 'desc' ? -compared : compared;
    return left.symbol.localeCompare(right.symbol);
  }
  function parseNumber(value) {
    if (value === '' || value === undefined || value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {matches, compareRows, parseNumber};
  if (typeof document === 'undefined') return;
  const tbody = document.getElementById('stock-list-body');
  const search = document.getElementById('stock-list-search');
  const industry = document.getElementById('stock-list-industry');
  const sort = document.getElementById('stock-list-sort');
  const reset = document.getElementById('stock-list-reset');
  const count = document.getElementById('stock-list-count');
  const empty = document.getElementById('stock-list-empty');
  const radios = Array.from(document.querySelectorAll('input[name="stock-list-signal"]'));
  const headers = Array.from(document.querySelectorAll('[data-sort-column]'));
  if (!tbody || !search || !industry || !sort || !reset || !count || !empty) return;
  const rows = Array.from(tbody.querySelectorAll('.sl-stock')).map(element => {
    const row = {element, symbol: element.dataset.symbol, search: element.dataset.search, name: element.querySelector('.sl-name strong').textContent, industry: element.querySelector('.sl-industry').textContent, industryCode: element.dataset.l2, three: element.dataset.three === 'true', trend: element.dataset.trend === 'true', pullback: element.dataset.pullback === 'true', stale: element.dataset.stale === 'true'};
    for (const key of numericKeys) row[key] = parseNumber(element.getAttribute('data-' + key.replace(/_/g, '-')));
    return row;
  });
  const state = {query: '', industry: '', signal: 'all', key: 'symbol', order: 'asc'};
  const params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  if (Array.from(industry.options).some(option => option.value === params.get('industry'))) industry.value = params.get('industry');
  if (signals.has(params.get('signal'))) state.signal = params.get('signal');
  if (sortKeys.has(params.get('sort'))) state.key = params.get('sort');
  if (params.get('order') === 'desc') state.order = 'desc';
  for (const radio of radios) radio.checked = radio.value === state.signal;
  function setSortControl() {
    const value = state.key + ':' + state.order;
    let option = Array.from(sort.options).find(item => item.value === value);
    if (!option) {
      option = document.createElement('option');
      option.value = value;
      const header = headers.find(item => item.dataset.sortColumn === state.key);
      const label = header ? header.querySelector('button').firstChild.textContent : state.key;
      option.textContent = label + ' · ' + (state.order === 'asc' ? '升序' : '降序');
      option.dataset.dynamic = 'true';
      sort.appendChild(option);
    }
    sort.value = value;
    for (const extra of Array.from(sort.querySelectorAll('[data-dynamic]'))) if (extra.value !== value) extra.remove();
  }
  function updateUrl() {
    const next = new URL(window.location.href);
    for (const key of ['q', 'industry', 'signal', 'sort', 'order']) next.searchParams.delete(key);
    if (state.query.trim()) next.searchParams.set('q', state.query.trim());
    if (state.industry) next.searchParams.set('industry', state.industry);
    if (state.signal !== 'all') next.searchParams.set('signal', state.signal);
    if (state.key !== 'symbol' || state.order !== 'asc') { next.searchParams.set('sort', state.key); next.searchParams.set('order', state.order); }
    window.history.replaceState(null, '', next.pathname + next.search + next.hash);
  }
  let lastSort = 'symbol:asc';
  function render(persist = true) {
    state.query = search.value;
    state.industry = industry.value;
    let visible = 0;
    for (const row of rows) {
      const hidden = !matches(row, state);
      if (row.element.hidden !== hidden) row.element.hidden = hidden;
      if (!hidden) visible += 1;
    }
    const currentSort = state.key + ':' + state.order;
    if (lastSort !== currentSort) {
      rows.sort((a, b) => compareRows(a, b, state.key, state.order));
      const fragment = document.createDocumentFragment();
      for (const row of rows) fragment.appendChild(row.element);
      tbody.appendChild(fragment);
      lastSort = currentSort;
    }
    for (const header of headers) {
      const active = header.dataset.sortColumn === state.key;
      header.setAttribute('aria-sort', active ? (state.order === 'asc' ? 'ascending' : 'descending') : 'none');
      header.querySelector('.sl-sort-icon').textContent = active ? (state.order === 'asc' ? '↑' : '↓') : '↕';
    }
    count.textContent = '显示 ' + visible.toLocaleString('zh-CN') + ' / ' + rows.length.toLocaleString('zh-CN') + ' 只 · ' + (state.query.trim() || state.industry || state.signal !== 'all' ? '已筛选，结果全部展开' : '全部展开，无分页');
    empty.hidden = visible > 0;
    setSortControl();
    if (persist) updateUrl();
  }
  let timer;
  search.addEventListener('input', () => { window.clearTimeout(timer); timer = window.setTimeout(() => render(), 100); });
  industry.addEventListener('change', () => render());
  radios.forEach(radio => radio.addEventListener('change', () => { if (radio.checked) { state.signal = radio.value; render(); } }));
  sort.addEventListener('change', () => { [state.key, state.order] = sort.value.split(':'); render(); });
  headers.forEach(header => header.querySelector('button').addEventListener('click', () => {
    const key = header.dataset.sortColumn;
    state.order = state.key === key ? (state.order === 'asc' ? 'desc' : 'asc') : (numericKeys.has(key) ? 'desc' : 'asc');
    state.key = key;
    render();
  }));
  reset.addEventListener('click', () => {
    window.clearTimeout(timer);
    search.value = ''; industry.value = ''; state.signal = 'all'; state.key = 'symbol'; state.order = 'asc';
    for (const radio of radios) radio.checked = radio.value === 'all';
    render(); search.focus();
  });
  render(false);
})();
