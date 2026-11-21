/* Strona koszyka */
(function () {
  'use strict';
  const HP = window.HP;
  const { $, esc, money, plural } = HP.util;
  const icon = (n, c) => HP.icon(n, c);

  function summaryHTML(t) {
    const ship = HP.pricing.cheapestShipping();
    const shipText = t.freeFrom && t.freeLeft === 0 ? '<strong style="color:var(--green)">gratis</strong>' : ship != null ? 'od ' + money(ship) : '—';
    return '<aside class="summary panel" aria-label="Podsumowanie koszyka">' +
      '<h2 class="summary__title">Podsumowanie</h2>' +
      HP.ui.freeShippingHTML(t) +
      '<div class="summary__rows">' +
        '<div class="sum-row"><span>Wartość produktów</span><span>' + money(t.subtotal) + '</span></div>' +
        (t.discount ? '<div class="sum-row sum-row--discount"><span>' + esc(t.bulk.label) + ' (−' + t.bulk.percent + '%)</span><span>−' + money(t.discount) + '</span></div>' : '') +
        '<div class="sum-row"><span>Dostawa</span><span>' + shipText + '</span></div>' +
      '</div>' +
      '<div class="sum-row sum-row--total"><span>Razem</span><span>' + money(t.goods) + '</span></div>' +
      '<p class="muted small">Koszt dostawy doliczymy po wyborze metody w kolejnym kroku.</p>' +
      '<a class="btn btn--primary btn--lg btn--block" href="zamowienie.html">' + icon('lock') + 'Przejdź do kasy</a>' +
      '<a class="link-arrow" href="sklep.html" style="justify-self:center">' + icon('arrow-left') + 'Kontynuuj zakupy</a>' +
      '<ul class="summary__trust">' +
        '<li>' + icon('truck') + 'Paczkomaty InPost 24/7 i kurier</li>' +
        '<li>' + icon('reload') + ((HP.cfg.legal && HP.cfg.legal.returnDays) || 14) + ' dni na zwrot</li>' +
        '<li>' + icon('shield') + 'Bezpieczne zakupy</li>' +
      '</ul>' +
    '</aside>';
  }

  function render() {
    const t = HP.pricing.totals();
    const root = $('#cart-root');
    if (!t.lines.length) {
      root.style.gridTemplateColumns = '1fr';
      root.innerHTML = '<div class="panel">' + HP.ui.emptyCartHTML() + '</div>';
      renderUpsell([]);
      return;
    }
    root.style.gridTemplateColumns = '';
    const active = document.activeElement;
    const focusKey = active && active.closest('.line') ? active.closest('.line').dataset.key : null;
    const focusSel = active && active.matches('input') ? 'input' : active && active.matches('[data-qty-inc]') ? '[data-qty-inc]' : '[data-qty-dec]';
    root.innerHTML =
      '<div class="panel">' +
        '<div class="cluster" style="justify-content:space-between;margin-bottom:16px">' +
          '<h2 class="h3">' + t.count + ' ' + plural(t.count, 'produkt', 'produkty', 'produktów') + '</h2>' +
          '<button class="btn btn--ghost btn--sm" type="button" id="clear-cart">' + icon('trash') + 'Wyczyść koszyk</button>' +
        '</div>' +
        '<ul class="lines">' + t.lines.map((l) => HP.ui.lineHTML(l)).join('') + '</ul>' +
        HP.ui.bulkHintHTML(t) +
      '</div>' + summaryHTML(t);
    $('#clear-cart').addEventListener('click', () => {
      if (window.confirm('Usunąć wszystkie produkty z koszyka?')) HP.cart.clear();
    });
    if (focusKey) {
      const el = root.querySelector('.line[data-key="' + CSS.escape(focusKey) + '"] ' + focusSel);
      if (el) el.focus();
    }
    renderUpsell(t.lines.map((l) => l.id));
  }

  function renderUpsell(inCart) {
    const list = HP.products.all().filter((p) => p.featured && !inCart.includes(p.id)).slice(0, 4);
    $('#upsell').hidden = !list.length;
    $('#upsell-grid').innerHTML = list.map((p) => HP.ui.productCard(p)).join('');
    HP.ui.observeReveal($('#upsell-grid'));
  }

  HP.onReady(() => {
    render();
    HP.cart.subscribe(render);
  });
})();
