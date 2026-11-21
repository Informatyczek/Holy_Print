/* Podziękowanie za zamówienie + instrukcja płatności */
(function () {
  'use strict';
  const HP = window.HP;
  const CFG = HP.cfg;
  const { $, esc, money } = HP.util;
  const icon = (n, c) => HP.icon(n, c);

  function payHTML(order) {
    let ins = HP.payments.instructions(order);
    // gdy płatność online nie wystartowała – pokaż dane do zwykłego przelewu
    if (!ins && HP.util.params().get('blad') === 'platnosc') ins = HP.payments.provider('przelew').instructions(order);
    if (!ins) return '';
    return '<div class="panel pay-box">' +
      '<h2 class="h3">' + icon(ins.type === 'blik' ? 'device-phone' : ins.type === 'cod' ? 'coin' : 'wallet') + ' ' + esc(ins.title) + '</h2>' +
      '<dl class="pay-rows">' + ins.rows.map(([k, v, copy]) =>
        '<div class="pay-row"><dt>' + esc(k) + '</dt><dd>' + esc(v || '—') + '</dd>' +
        (copy && v ? '<button class="copy-btn" type="button" data-copy="' + esc(String(v).replace(/\s/g, k === 'Kwota' ? ' ' : '')) + '">' + icon('copy') + 'Kopiuj</button>' : '<span></span>') + '</div>').join('') +
      '</dl>' +
      (ins.note ? '<p class="muted small">' + esc(ins.note) + '</p>' : '') +
    '</div>';
  }

  function summaryHTML(o) {
    const sh = o.shipping;
    const where = sh.point ? 'Paczkomat <strong>' + esc(sh.point.code) + '</strong>' + (sh.point.line1 ? '<br>' + esc(sh.point.line1 + ', ' + sh.point.line2) : '')
      : sh.address ? esc(sh.address.street) + '<br>' + esc(sh.address.postcode + ' ' + sh.address.city) : 'Odbiór osobisty';
    return '<div class="panel summary" style="position:relative;top:0">' +
      '<h2 class="summary__title">Podsumowanie</h2>' +
      '<ul class="summary__items">' + o.items.map((it) => {
        const p = HP.products.get(it.id);
        const img = p ? HP.products.cover(p, it.variantId) : null;
        return '<li class="summary__item"><span class="summary__item-img' + (img ? ' summary__item-img--' + img.kind : '') + '">' + (img ? '<img src="' + esc(img.thumb) + '" alt="">' : '') + '<span class="summary__qty">' + it.qty + '</span></span>' +
          '<span><span class="summary__item-name">' + esc(it.name) + '</span>' + (it.variant ? '<span class="summary__item-variant">' + esc(it.variant) + '</span>' : '') + '</span>' +
          '<span class="summary__item-price">' + money(it.total) + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="summary__rows">' +
        '<div class="sum-row"><span>Produkty</span><span>' + money(o.totals.subtotal) + '</span></div>' +
        (o.totals.discount ? '<div class="sum-row sum-row--discount"><span>Rabat</span><span>−' + money(o.totals.discount) + '</span></div>' : '') +
        '<div class="sum-row"><span>Dostawa</span><span>' + (o.totals.shipping ? money(o.totals.shipping) : 'gratis') + '</span></div>' +
        (o.totals.paymentFee ? '<div class="sum-row"><span>Opłata za płatność</span><span>' + money(o.totals.paymentFee) + '</span></div>' : '') +
      '</div>' +
      '<div class="sum-row sum-row--total"><span>Razem</span><span>' + money(o.totals.total) + '</span></div>' +
      '<p class="small" style="margin-top:6px"><strong>' + esc(sh.label) + '</strong><br>' + where + '</p>' +
    '</div>';
  }

  function render(order) {
    const root = $('#thanks-root');
    if (!order) {
      root.innerHTML = '<div class="thanks"><div class="thanks__badge"><img class="halo" src="assets/img/aureola.svg" alt=""><div class="thanks__check">' + icon('search') + '</div></div>' +
        '<h1 class="page-hero__title">Nie widzimy tego zamówienia</h1>' +
        '<p class="lead">Szczegóły zamówienia zapisują się tylko w przeglądarce, w której je złożono. Jeśli masz pytania, <a href="kontakt.html">napisz do nas</a>.</p>' +
        '<a class="btn btn--primary" href="sklep.html">Wróć do sklepu</a></div>';
      return;
    }
    const offline = HP.payments.provider(HP.pricing.paymentMethod(order.payment.method)?.provider || '')?.online === false;
    const isCod = order.payment.provider === 'pobranie';
    const steps = [];
    if (offline && !isCod) steps.push('<strong>Opłać zamówienie</strong> – dane do płatności znajdziesz obok. W tytule wpisz numer zamówienia.');
    steps.push('<strong>Przygotujemy paczkę</strong> – zwykle w ' + esc((CFG.shop && CFG.shop.processingTime) || '1–3 dni robocze') + (offline && !isCod ? ' od zaksięgowania wpłaty' : '') + '.');
    steps.push('<strong>Wyślemy przesyłkę</strong> – ' + (order.shipping.type === 'paczkomat' ? 'InPost powiadomi Cię SMS-em i e-mailem, gdy paczka będzie czekać w Paczkomacie.' : order.shipping.type === 'adres' ? 'przewoźnik poinformuje Cię o terminie doręczenia.' : 'napiszemy, kiedy i gdzie możesz odebrać zamówienie.'));

    const payFailed = HP.util.params().get('blad') === 'platnosc';
    root.innerHTML =
      (payFailed ? '<div class="demo-banner" style="background:var(--red-100);border-color:var(--red);color:var(--red)">' + icon('alert') + '<span><strong>Zamówienie przyjęliśmy, ale płatność online nie wystartowała.</strong> Możesz zapłacić przelewem (dane poniżej) albo napisać do nas – podamy nowy link do płatności.</span></div>' : '') +
      (order.demo ? '<div class="demo-banner">' + icon('info-box') + '<span><strong>Tryb demonstracyjny.</strong> To zamówienie zapisało się tylko w tej przeglądarce i nigdzie nie zostało wysłane. Aby zamówienia trafiały na Twój e-mail, zmień <code>orders.mode</code> w pliku <code>assets/js/config.js</code> (instrukcja w README).</span></div>' : '') +
      '<div class="thanks">' +
        '<div class="thanks__badge"><img class="halo" src="assets/img/aureola.svg" alt="" aria-hidden="true"><div class="thanks__check">' + icon('check') + '</div></div>' +
        '<h1 class="page-hero__title">Dziękujemy, ' + esc(order.customer.firstName) + '!</h1>' +
        '<p class="lead">Twoje zamówienie zostało przyjęte. Potwierdzenie wyślemy na adres <strong>' + esc(order.customer.email) + '</strong>.</p>' +
        '<p class="order-no">' + icon('reciept') + 'Nr ' + esc(order.number) + '</p>' +
      '</div>' +
      '<div class="thanks-grid">' +
        '<div class="stack">' + payHTML(order) +
          '<div class="panel stack"><h2 class="h3">Co dalej?</h2><ol class="next-steps">' + steps.map((s) => '<li><span>' + s + '</span></li>').join('') + '</ol>' +
          '<p class="muted small">Masz pytanie? Napisz na <a href="mailto:' + esc((CFG.contact && CFG.contact.email) || '') + '">' + esc((CFG.contact && CFG.contact.email) || '') + '</a> i podaj numer zamówienia.</p></div>' +
        '</div>' +
        summaryHTML(order) +
      '</div>' +
      '<div class="cluster" style="justify-content:center;margin-top:32px"><a class="btn btn--ghost" href="sklep.html">' + icon('arrow-left') + 'Wróć do sklepu</a></div>';

    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-copy]');
      if (!b) return;
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        HP.ui.toast('Skopiowano: ' + esc(b.dataset.copy), { icon: 'copy' });
      } catch (err) {
        HP.ui.toast('Nie udało się skopiować – zaznacz tekst ręcznie.', { type: 'error' });
      }
    });
  }

  HP.onReady(() => {
    const nr = HP.util.params().get('nr');
    const order = nr ? HP.orders.getLocal(nr) : HP.orders.lastLocal();
    render(order);
    HP.ui.sparkles();
  });
})();
