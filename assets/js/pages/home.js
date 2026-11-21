/* Strona główna – patroni, polecane produkty, ceny formatów */
(function () {
  'use strict';
  const HP = window.HP;
  const { $, $$, esc, money } = HP.util;
  const P = HP.products;

  function minPrice(filter) {
    let min = Infinity;
    P.all().forEach((p) => {
      const vs = P.variants(p);
      if (vs.length) vs.forEach((v) => { if (filter(p, v)) min = Math.min(min, v.price != null ? v.price : p.price); });
      else if (filter(p, null)) min = Math.min(min, p.price);
    });
    return isFinite(min) ? min : null;
  }

  HP.onReady(() => {
    const list = $('#patrons-list');
    if (list) {
      list.innerHTML = P.saints().map((s) =>
        '<a class="patron reveal" href="sklep.html?swiety=' + encodeURIComponent(s.id) + '">' +
          '<span class="patron__pic">' +
            '<img class="patron__halo" src="assets/img/aureola.svg" alt="" aria-hidden="true">' +
            '<img class="patron__avatar" src="' + esc(s.avatar) + '" alt="" width="170" height="170" loading="lazy">' +
          '</span>' +
          '<span class="patron__name">' + esc(s.name) + '</span>' +
          '<span class="patron__feast">' + esc(s.feast) + '</span>' +
        '</a>').join('');
    }

    const grid = $('#featured');
    if (grid) {
      const items = P.all().filter((p) => p.featured).slice(0, 8);
      grid.innerHTML = items.map((p) => HP.ui.productCard(p)).join('');
    }

    $$('[data-price-from]').forEach((el) => {
      const key = el.dataset.priceFrom;
      const v = key === 'breloki'
        ? minPrice((p) => p.category === 'breloki')
        : minPrice((p, variant) => variant && variant.format === key);
      if (v != null) el.textContent = money(v);
    });
    $$('[data-format-size]').forEach((el) => {
      const f = P.format(el.dataset.formatSize);
      if (f && f.size) el.textContent = f.size;
    });

    HP.ui.observeReveal();
  });
})();
