/* Progressive enhancement: without JavaScript all categories remain readable. */
(() => {
  'use strict';
  const tabs = Array.from(document.querySelectorAll('[data-category-tab]'));
  const panels = Array.from(document.querySelectorAll('.cp-category'));
  const search = document.getElementById('company-search');
  const three = document.getElementById('filter-three-up');
  const pullback = document.getElementById('filter-pullback');
  const count = document.getElementById('company-result-count');
  const empty = document.getElementById('company-no-matches');
  const reset = document.getElementById('company-reset');
  if (!tabs.length || !search || !three || !pullback || !count || !empty) return;
  let active = tabs[0].dataset.categoryTab;
  const initialHash = window.location.hash.slice(1);
  for (const panel of panels) {
    if (panel.id === initialHash || Array.from(panel.querySelectorAll('[id]')).some(el => el.id === initialHash)) {
      active = panel.dataset.category;
    }
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'tab-' + panel.dataset.category);
  }
  tabs[0].parentElement.setAttribute('role', 'tablist');
  function render() {
    const term = search.value.trim().toLocaleLowerCase();
    let shown = new Set();
    let total = new Set();
    let associations = 0;
    const filtering = !!(term || three.checked || pullback.checked);
    for (const tab of tabs) {
      const selected = tab.dataset.categoryTab === active;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'category-' + tab.dataset.categoryTab);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) {
      const selected = panel.dataset.category === active;
      panel.hidden = !selected;
      if (!selected) continue;
      for (const row of panel.querySelectorAll('.cp-company')) {
        total.add(row.dataset.symbol);
        const matches = (!term || row.dataset.search.includes(term)) &&
          (!three.checked || row.dataset.threeUp === 'true') &&
          (!pullback.checked || row.dataset.pullback === 'true');
        row.hidden = !matches;
        if (matches) { shown.add(row.dataset.symbol); associations += 1; }
      }
      for (const node of panel.querySelectorAll('.cp-node')) {
        const rows = Array.from(node.querySelectorAll('.cp-company'));
        node.hidden = rows.length ? rows.every(row => row.hidden) : filtering;
      }
      for (const chain of panel.querySelectorAll('.cp-chain')) {
        chain.hidden = Array.from(chain.querySelectorAll('.cp-node')).every(node => node.hidden);
      }
      for (const link of panel.querySelectorAll('.cp-chain-nav a')) {
        const target = document.getElementById(link.getAttribute('href').slice(1));
        link.hidden = !!target?.hidden;
      }
    }
    const label = tabs.find(tab => tab.dataset.categoryTab === active).childNodes[0].textContent.trim();
    count.textContent = label + '重点观察 · 显示 ' + shown.size + ' / ' + total.size + ' 只A股 · ' + associations + ' 条业务关联' + (filtering ? ' · 指标已筛选，地图保持完整' : ' · 当前大类全部展开');
    empty.hidden = shown.size !== 0;
  }
  for (const tab of tabs) {
    tab.addEventListener('click', event => {
      event.preventDefault();
      active = tab.dataset.categoryTab;
      window.history.replaceState(null, '', '#category-' + active);
      render();
    });
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      active = tabs[next].dataset.categoryTab;
      tabs[next].focus();
      window.history.replaceState(null, '', '#category-' + active);
      render();
    });
  }
  search.addEventListener('input', render);
  for (const link of document.querySelectorAll('[data-reveal-node]')) {
    link.addEventListener('click', () => {
      search.value = '';
      three.checked = false;
      pullback.checked = false;
      render();
    });
  }
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(window.location.hash.slice(1));
    const panel = target?.closest('.cp-category');
    if (panel) { active = panel.dataset.category; render(); target.scrollIntoView(); }
  });
  three.addEventListener('change', render);
  pullback.addEventListener('change', render);
  reset.addEventListener('click', () => {
    search.value = '';
    three.checked = false;
    pullback.checked = false;
    render();
    search.focus();
  });
  render();
  if (initialHash) document.getElementById(initialHash)?.scrollIntoView({behavior: 'instant', block: 'start'});
  window.addEventListener('load', () => {
    if (initialHash && window.location.hash.slice(1) === initialHash) document.getElementById(initialHash)?.scrollIntoView({behavior: 'instant', block: 'start'});
  }, {once: true});
})();
