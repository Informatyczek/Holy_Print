/* Sklep – lista produktów z filtrami (kategoria, patron, wyszukiwanie, sortowanie) */
(function () {
  'use strict';
  const HP = window.HP;
  const { $, $$, esc, plural, debounce } = HP.util;
  const P = HP.products;

  const state = { kategoria: '', swiety: '', q: '', sort: 'polecane' };
  const ORDER = new Map(P.all().map((p, i) => [p.id, i]));

  function readURL() {
    const prm = HP.util.params();
    state.kategoria = P.category(prm.get('kategoria')) ? prm.get('kategoria') : '';
    state.swiety = P.saint(prm.get('swiety')) ? prm.get('swiety') : '';
    state.q = (prm.get('q') || '').slice(0, 60);
    const s = prm.get('sort');
    state.sort = ['polecane', 'cena-rosnaco', 'cena-malejaco', 'nazwa'].includes(s) ? s : 'polecane';
  }

  function writeURL() {
    const prm = new URLSearchParams();
    if (state.kategoria) prm.set('kategoria', state.kategoria);
    if (state.swiety) prm.set('swiety', state.swiety);
    if (state.q) prm.set('q', state.q);
    if (state.sort !== 'polecane') prm.set('sort', state.sort);
    const qs = prm.toString();
    history.replaceState(null, '', 'sklep.html' + (qs ? '?' + qs : ''));
  }

  function matchesSaint(p, saintId) {
    if (!saintId) return true;
    if (p.saint === saintId) return true;
    return Array.isArray(p.includes) && p.includes.some((id) => { const x = P.get(id); return x && x.saint === saintId; });
  }

  function filtered() {
    let list = state.q ? P.search(state.q) : P.all();
    list = list.filter((p) => (!state.kategoria || p.category === state.kategoria) && matchesSaint(p, state.swiety));
    const price = (p) => P.priceRange(p)[0];
    if (state.sort === 'cena-rosnaco') list.sort((a, b) => price(a) - price(b));
    else if (state.sort === 'cena-malejaco') list.sort((a, b) => price(b) - price(a));
    else if (state.sort === 'nazwa') list.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name, 'pl'));
    else if (!state.q) list.sort((a, b) => ORDER.get(a.id) - ORDER.get(b.id));
    return list;
  }

  function renderTabs() {
    const all = P.all();
    const cats = [{ id: '', name: 'Wszystko', n: all.length }].concat(P.categories().map((c) => ({ id: c.id, name: c.name, n: all.filter((p) => p.category === c.id).length })).filter((c) => c.n));
    $('#cat-tabs').innerHTML = cats.map((c) =>
      '<button class="chip" type="button" data-cat="' + esc(c.id) + '" aria-pressed="' + (state.kategoria === c.id) + '">' + esc(c.name) + ' <span class="muted">' + c.n + '</span></button>').join('');
    const saints = [{ id: '', name: 'Wszyscy patroni' }].concat(P.saints());
    $('#saint-filter').innerHTML = saints.map((s) =>
      '<button class="chip chip--sm" type="button" data-saint="' + esc(s.id) + '" aria-pressed="' + (state.swiety === s.id) + '">' +
        (s.avatar ? '<img src="' + esc(s.avatar) + '" alt="" width="26" height="26" loading="lazy">' : HP.icon('halo')) + esc(s.short || s.name) + '</button>').join('');
  }

  function renderHead() {
    const cat = P.category(state.kategoria);
    const saint = P.saint(state.swiety);
    let title = 'Sklep', lead = 'Obrazki i breloki ze świętymi patronami w pixelowej odsłonie.';
    if (saint) {
      title = saint.name;
      lead = (cat ? cat.name + ' z wizerunkiem patrona. ' : 'Wszystkie produkty z wizerunkiem patrona. ') + 'Imieniny: ' + saint.feast + '.';
    } else if (cat) {
      title = cat.name;
      lead = cat.description;
    }
    if (state.q) lead = 'Wyniki wyszukiwania dla „' + state.q + '”.';
    $('#shop-title').textContent = title;
    $('#shop-lead').textContent = lead;
    $('#crumb-current').textContent = title;
    document.title = title + (title === 'Sklep' ? ' – obrazki i breloki ze świętymi' : '') + ' | Holy Print';
  }

  function render() {
    const list = filtered();
    renderTabs();
    renderHead();
    $('#shop-count').textContent = list.length + ' ' + plural(list.length, 'produkt', 'produkty', 'produktów');
    $('#shop-grid').innerHTML = list.map((p) => HP.ui.productCard(p)).join('');
    $('#shop-grid').hidden = !list.length;
    $('#shop-empty').hidden = !!list.length;
    $('#sort').value = state.sort;
    if ($('#shop-q').value !== state.q) $('#shop-q').value = state.q;
    HP.ui.observeReveal($('#shop-grid'));
  }

  HP.onReady(() => {
    readURL();
    render();
    document.addEventListener('click', (e) => {
      const c = e.target.closest('[data-cat]');
      if (c) { state.kategoria = c.dataset.cat; writeURL(); render(); return; }
      const s = e.target.closest('[data-saint]');
      if (s) { state.swiety = s.dataset.saint; writeURL(); render(); }
    });
    $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; writeURL(); render(); });
    $('#shop-q').addEventListener('input', debounce((e) => { state.q = e.target.value.trim().slice(0, 60); writeURL(); render(); }, 200));
    $('#reset-filters').addEventListener('click', () => { state.kategoria = ''; state.swiety = ''; state.q = ''; state.sort = 'polecane'; writeURL(); render(); });
    window.addEventListener('popstate', () => { readURL(); render(); });
  });
})();
