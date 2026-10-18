/* Complete list stays in HTML; filtering never fetches or silently paginates it. */
(() => {
  'use strict';
  const tabs = Array.from(document.querySelectorAll('[data-directory-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-directory-category]'));
  const search = document.getElementById('directory-search');
  const count = document.getElementById('directory-count');
  const empty = document.getElementById('directory-empty');
  if (!tabs.length || !search || !count || !empty) return;
  let active = tabs[0].dataset.directoryTab;
  const selectHash = () => {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    const panel = target?.closest('[data-directory-category]');
    if (panel) active = panel.dataset.directoryCategory;
  };
  selectHash();
  function render() {
    const term = search.value.trim().toLocaleLowerCase();
    let shown = 0, total = 0;
    tabs[0].parentElement.setAttribute('role', 'tablist');
    for (const tab of tabs) {
      const selected = tab.dataset.directoryTab === active;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('aria-controls', 'category-' + tab.dataset.directoryTab);
      tab.id = 'directory-tab-' + tab.dataset.directoryTab;
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.directoryCategory !== active;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'directory-tab-' + panel.dataset.directoryCategory);
      if (panel.hidden) continue;
      for (const item of panel.querySelectorAll('[data-directory-company]')) {
        total += 1;
        item.hidden = !!term && !item.dataset.search.includes(term);
        if (!item.hidden) shown += 1;
      }
      for (const group of panel.querySelectorAll('.cp-directory-group')) {
        group.hidden = Array.from(group.querySelectorAll('[data-directory-company]')).every(item => item.hidden);
      }
    }
    count.textContent = '显示 ' + shown + ' / ' + total + ' 家 · ' + (term ? '已按关键词筛选' : '全部展开，无分页');
    empty.hidden = shown > 0;
  }
  tabs.forEach((tab, index) => {
    const activate = next => {
      active = tabs[next].dataset.directoryTab;
      search.value = '';
      window.history.replaceState(null, '', '#category-' + active);
      render();
    };
    tab.addEventListener('click', event => { event.preventDefault(); activate(index); });
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault(); activate(next); tabs[next].focus();
    });
  });
  search.addEventListener('input', render);
  window.addEventListener('hashchange', () => { selectHash(); search.value = ''; render(); document.getElementById(window.location.hash.slice(1))?.scrollIntoView(); });
  render();
  if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({behavior: 'instant', block: 'start'});
  const initialHash = window.location.hash;
  window.addEventListener('load', () => {
    if (initialHash && window.location.hash === initialHash) document.getElementById(initialHash.slice(1))?.scrollIntoView({behavior: 'instant', block: 'start'});
  }, {once: true});
})();
