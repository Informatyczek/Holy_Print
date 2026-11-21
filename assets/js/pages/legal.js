/* Strony informacyjne (regulamin, polityka prywatności, dostawa, zwroty) */
(function () {
  'use strict';
  const HP = window.HP;
  const CFG = HP.cfg;
  const { $, $$, esc, money } = HP.util;

  HP.onReady(() => {
    // Notatka „wzór do uzupełnienia” – znika, gdy dane sprzedawcy są wpisane w config.js
    const s = CFG.seller || {};
    const placeholder = /\[|\]/.test(String(s.legalName || '') + String(s.address || '')) || !s.legalName;
    $$('[data-template-note]').forEach((el) => { el.hidden = !placeholder; });

    // Adres strony
    $$('[data-shop-url]').forEach((el) => { el.textContent = (CFG.shop && CFG.shop.url) || window.location.origin; });

    // NIP / REGON – pokaż tylko jeśli są
    $$('[data-if-nip]').forEach((el) => { el.hidden = !s.nip; });
    $$('[data-if-regon]').forEach((el) => { el.hidden = !s.regon; });

    // Tabela dostaw
    const ship = $('#shipping-table');
    if (ship) {
      const free = HP.pricing.freeFrom();
      ship.innerHTML = '<thead><tr><th scope="col">Sposób dostawy</th><th scope="col">Koszt</th><th scope="col">Czas doręczenia</th></tr></thead><tbody>' +
        HP.pricing.shippingMethods().map((m) => '<tr><td><strong>' + esc(m.label) + '</strong><br><span class="muted small">' + esc(m.description || '') + '</span></td><td>' + (m.price ? money(m.price) : 'bezpłatnie') + (free && m.price ? '<br><span class="muted small">gratis od ' + money(free) + '</span>' : '') + '</td><td>' + esc(m.eta || '—') + '</td></tr>').join('') +
        '</tbody>';
    }
    // Lista płatności
    const pay = $('#payment-list');
    if (pay) {
      pay.innerHTML = HP.pricing.paymentMethods(null).map((m) =>
        '<li><strong>' + esc(m.label) + '</strong>' + (m.comingSoon ? ' <span class="option__soon">wkrótce</span>' : '') + ' – ' + esc(m.description || '') + (m.fee ? ' (dopłata ' + money(m.fee) + ')' : '') + (m.onlyFor ? ' – dostępne tylko dla wybranych metod dostawy' : '') + '</li>').join('');
    }
    // Drukowanie formularza odstąpienia
    const pr = $('#print-form');
    if (pr) pr.addEventListener('click', () => window.print());

    // Aktywny link w bocznym menu
    const here = location.pathname.split('/').pop();
    $$('.legal-nav a').forEach((a) => { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
  });
})();
