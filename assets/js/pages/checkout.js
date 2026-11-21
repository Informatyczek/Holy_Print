/* Kasa – formularz zamówienia, dostawa, płatność, podsumowanie */
(function () {
  'use strict';
  const HP = window.HP;
  const CFG = HP.cfg;
  const { $, $$, esc, money, session } = HP.util;
  const icon = (n, c) => HP.icon(n, c);
  const DRAFT_KEY = 'hp_kasa_szkic';

  const SHIP_ICONS = { paczkomat: 'archive', adres: 'truck', odbior: 'store' };
  const PAY_ICONS = { przelew: 'wallet', blik_telefon: 'device-phone', pobranie: 'coin', przelewy24: 'credit-card', payu: 'credit-card', tpay: 'credit-card', stripe: 'credit-card' };

  let pickedPoint = null;
  let submitting = false;

  /* ---------- Szablon ---------- */
  function field(name, label, opts) {
    opts = opts || {};
    return '<div class="field ' + (opts.cls || '') + '" data-field="' + name + '">' +
      '<label for="f-' + name + '">' + label + (opts.optional ? ' <span class="opt">(opcjonalnie)</span>' : '') + '</label>' +
      (opts.textarea
        ? '<textarea class="textarea" id="f-' + name + '" name="' + name + '" rows="3"' + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + ' maxlength="600"></textarea>'
        : '<input class="input" id="f-' + name + '" name="' + name + '" type="' + (opts.type || 'text') + '"' +
          (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') +
          (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') +
          (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') +
          (opts.maxlength ? ' maxlength="' + opts.maxlength + '"' : '') + '>') +
      (opts.hint ? '<p class="field-hint">' + opts.hint + '</p>' : '') +
      '<p class="field-error" id="e-' + name + '">' + icon('alert') + '<span></span></p>' +
    '</div>';
  }

  function shippingOptionsHTML() {
    const methods = HP.pricing.shippingMethods();
    return methods.map((m, i) =>
      '<label class="option"><input type="radio" name="dostawa" value="' + esc(m.id) + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span class="option__box"><span class="option__radio" aria-hidden="true"></span>' +
        '<span class="option__icon" aria-hidden="true">' + icon(SHIP_ICONS[m.type] || 'truck') + '</span>' +
        '<span><span class="option__name">' + esc(m.label) + '</span><span class="option__desc">' + esc(m.description || '') + (m.eta ? ' · ' + esc(m.eta) : '') + '</span></span>' +
        '<span class="option__price" data-ship-price="' + esc(m.id) + '">' + (m.price ? money(m.price) : 'bezpłatnie') + '</span></span></label>'
    ).join('');
  }

  function paymentOptionsHTML(shipId) {
    const list = HP.pricing.paymentMethods(shipId);
    const firstAvail = list.find((m) => m.available);
    return list.map((m) => {
      const dis = !m.available;
      return '<label class="option' + (dis ? ' is-disabled' : '') + '"><input type="radio" name="platnosc" value="' + esc(m.id) + '"' + (dis ? ' disabled' : '') + (firstAvail && m.id === firstAvail.id ? ' checked' : '') + '>' +
        '<span class="option__box"><span class="option__radio" aria-hidden="true"></span>' +
        '<span class="option__icon" aria-hidden="true">' + icon(PAY_ICONS[m.provider] || 'wallet') + '</span>' +
        '<span><span class="option__name">' + esc(m.label) + (m.comingSoon ? '<span class="option__soon">wkrótce</span>' : '') + '</span>' +
          '<span class="option__desc">' + esc(m.restricted ? 'Niedostępne dla wybranej dostawy' : m.description || '') + '</span></span>' +
        '<span class="option__price">' + (m.fee ? '+ ' + money(m.fee) : '') + '</span></span></label>';
    }).join('');
  }

  function formHTML() {
    return '<form class="checkout-form" id="checkout-form" novalidate>' +
      // 1. Kontakt
      '<div class="panel co-section">' +
        '<div class="co-section__head"><span class="co-section__num">1</span><h2 class="co-section__title">Dane kontaktowe</h2></div>' +
        '<div class="form-grid">' +
          field('firstName', 'Imię', { cls: 'span-3', autocomplete: 'given-name', maxlength: 60 }) +
          field('lastName', 'Nazwisko', { cls: 'span-3', autocomplete: 'family-name', maxlength: 80 }) +
          field('email', 'E-mail', { cls: 'span-3', type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'np. jan@poczta.pl', maxlength: 120 }) +
          field('phone', 'Telefon', { cls: 'span-3', type: 'tel', autocomplete: 'tel', inputmode: 'tel', placeholder: 'np. 600 700 800', maxlength: 20, hint: 'Do powiadomień o przesyłce.' }) +
        '</div>' +
      '</div>' +
      // 2. Dostawa
      '<div class="panel co-section">' +
        '<div class="co-section__head"><span class="co-section__num">2</span><h2 class="co-section__title">Dostawa</h2></div>' +
        '<fieldset class="options" id="ship-options"><legend class="sr-only">Sposób dostawy</legend>' + shippingOptionsHTML() + '</fieldset>' +
        '<div class="option__extra" id="extra-paczkomat" hidden>' +
          (HP.inpost.hasMap()
            ? '<button class="btn btn--ghost" type="button" id="open-map">' + icon('pin') + 'Wybierz Paczkomat na mapie</button><div id="picked-point"></div>' +
              '<input type="hidden" name="paczkomat" id="f-paczkomat"><p class="field-error" id="e-paczkomat">' + icon('alert') + '<span></span></p>'
            : '<div class="field" data-field="paczkomat"><label for="f-paczkomat">Kod Paczkomatu lub PaczkoPunktu</label>' +
                '<input class="input" id="f-paczkomat" name="paczkomat" type="text" placeholder="np. KRA01M" maxlength="14" autocomplete="off" style="text-transform:uppercase">' +
                '<p class="field-hint">Kod znajdziesz na mapie InPost: <a href="' + HP.inpost.findUrl + '" target="_blank" rel="noopener">inpost.pl/znajdz-paczkomat ' + icon('external-link') + '</a></p>' +
                '<p class="field-error" id="e-paczkomat">' + icon('alert') + '<span></span></p></div>') +
        '</div>' +
        '<div class="option__extra" id="extra-adres" hidden>' +
          '<div class="form-grid">' +
            field('street', 'Ulica i numer', { autocomplete: 'street-address', placeholder: 'np. Różana 7/3', maxlength: 120 }) +
            field('postcode', 'Kod pocztowy', { cls: 'span-2', autocomplete: 'postal-code', inputmode: 'numeric', placeholder: '00-000', maxlength: 6 }) +
            field('city', 'Miejscowość', { cls: 'span-4', autocomplete: 'address-level2', maxlength: 80 }) +
          '</div>' +
        '</div>' +
        '<div class="option__extra" id="extra-odbior" hidden><p class="muted">Po złożeniu zamówienia napiszemy do Ciebie, aby ustalić miejsce i godzinę odbioru.</p></div>' +
      '</div>' +
      // 3. Płatność
      '<div class="panel co-section">' +
        '<div class="co-section__head"><span class="co-section__num">3</span><h2 class="co-section__title">Płatność</h2></div>' +
        '<fieldset class="options" id="pay-options"><legend class="sr-only">Metoda płatności</legend></fieldset>' +
        '<p class="field-error" id="e-platnosc">' + icon('alert') + '<span></span></p>' +
      '</div>' +
      // 4. Faktura i uwagi
      '<div class="panel co-section">' +
        '<div class="co-section__head"><span class="co-section__num">4</span><h2 class="co-section__title">Faktura i uwagi</h2></div>' +
        '<label class="check"><input type="checkbox" name="faktura" id="f-faktura"><span class="check__box">' + icon('check') + '</span><span>Chcę otrzymać fakturę na firmę</span></label>' +
        '<div class="option__extra" id="extra-faktura" hidden><div class="form-grid">' +
          field('company', 'Nazwa firmy', { maxlength: 160, autocomplete: 'organization' }) +
          field('nip', 'NIP', { cls: 'span-3', inputmode: 'numeric', placeholder: '0000000000', maxlength: 13 }) +
          field('invoiceAddress', 'Adres firmy', { cls: 'span-3', optional: true, placeholder: 'jeśli inny niż dostawy', maxlength: 160 }) +
        '</div></div>' +
        field('notes', 'Uwagi do zamówienia', { textarea: true, optional: true, placeholder: 'Np. prośba o dedykację albo dodatkowe informacje' }) +
      '</div>' +
      // 5. Zgody i wysyłka
      '<div class="panel co-section">' +
        '<div class="field" data-field="terms"><label class="check"><input type="checkbox" name="terms" id="f-terms"><span class="check__box">' + icon('check') + '</span>' +
          '<span>Akceptuję <a href="regulamin.html" target="_blank">Regulamin sklepu</a> i zapoznałem/-am się z informacją o <a href="zwroty-i-reklamacje.html" target="_blank">prawie odstąpienia od umowy</a>. <span class="opt">(wymagane)</span></span></label>' +
          '<p class="field-error" id="e-terms">' + icon('alert') + '<span></span></p></div>' +
        '<p class="co-legal">Administratorem Twoich danych jest <span data-cfg="seller.legalName"></span>. Dane przetwarzamy w celu realizacji zamówienia – szczegóły w <a href="polityka-prywatnosci.html" target="_blank">Polityce prywatności</a>.</p>' +
        '<div class="notice notice--error co-error" id="co-error" role="alert"></div>' +
        '<div class="co-submit">' +
          '<button class="btn btn--primary btn--lg" type="submit" id="submit-btn">' + icon('lock') + 'Zamawiam z obowiązkiem zapłaty</button>' +
          '<p class="co-legal" style="text-align:center">Klikając przycisk, składasz zamówienie z obowiązkiem zapłaty <strong id="submit-total"></strong>.</p>' +
        '</div>' +
      '</div>' +
    '</form>';
  }

  function summaryHTML() {
    const t = totals();
    const ship = t.shippingMethod;
    return '<h2 class="summary__title">Twoje zamówienie</h2>' +
      '<ul class="summary__items" tabindex="0" aria-label="Produkty w zamówieniu">' + t.lines.map((l) =>
        '<li class="summary__item"><span class="summary__item-img summary__item-img--' + l.image.kind + '"><img src="' + esc(l.image.thumb) + '" alt=""><span class="summary__qty">' + l.qty + '</span></span>' +
        '<span><span class="summary__item-name">' + esc(l.product.name) + '</span>' + (l.variantName ? '<span class="summary__item-variant">' + esc(l.variantName) + '</span>' : '') + '</span>' +
        '<span class="summary__item-price">' + money(l.total) + '</span></li>').join('') + '</ul>' +
      '<a class="link-arrow small" href="koszyk.html">' + icon('edit') + 'Edytuj koszyk</a>' +
      HP.ui.freeShippingHTML(t) +
      '<div class="summary__rows">' +
        '<div class="sum-row"><span>Wartość produktów</span><span>' + money(t.subtotal) + '</span></div>' +
        (t.discount ? '<div class="sum-row sum-row--discount"><span>' + esc(t.bulk.label) + ' (−' + t.bulk.percent + '%)</span><span>−' + money(t.discount) + '</span></div>' : '') +
        '<div class="sum-row"><span>Dostawa' + (ship ? ' – ' + esc(ship.label) : '') + '</span><span>' + (t.shipping ? money(t.shipping) : (ship ? '<strong style="color:var(--green)">gratis</strong>' : '—')) + '</span></div>' +
        (t.paymentFee ? '<div class="sum-row"><span>Opłata za płatność</span><span>' + money(t.paymentFee) + '</span></div>' : '') +
      '</div>' +
      '<div class="sum-row sum-row--total"><span>Do zapłaty</span><span>' + money(t.total) + '</span></div>' +
      '<ul class="summary__trust"><li>' + icon('lock') + 'Dane przesyłane bezpiecznie</li><li>' + icon('reload') + ((CFG.legal && CFG.legal.returnDays) || 14) + ' dni na odstąpienie od umowy</li></ul>';
  }

  /* ---------- Stan formularza ---------- */
  const form = () => $('#checkout-form');
  const val = (name) => { const el = form().elements[name]; return el ? (el.type === 'checkbox' ? el.checked : String(el.value || '').trim()) : ''; };
  const shipId = () => { const r = form().querySelector('input[name="dostawa"]:checked'); return r ? r.value : null; };
  const payId = () => { const r = form().querySelector('input[name="platnosc"]:checked'); return r ? r.value : null; };
  const totals = () => HP.pricing.totals({ shippingId: form() ? shipId() : (HP.pricing.shippingMethods()[0] || {}).id, paymentId: form() ? payId() : null });

  function refreshPayments() {
    const current = payId();
    $('#pay-options').innerHTML = '<legend class="sr-only">Metoda płatności</legend>' + paymentOptionsHTML(shipId());
    if (current) {
      const r = form().querySelector('input[name="platnosc"][value="' + CSS.escape(current) + '"]:not(:disabled)');
      if (r) r.checked = true;
    }
  }

  function refreshExtras() {
    const m = HP.pricing.shippingMethod(shipId());
    const type = m ? m.type : '';
    $('#extra-paczkomat').hidden = type !== 'paczkomat';
    $('#extra-adres').hidden = type !== 'adres';
    $('#extra-odbior').hidden = type !== 'odbior';
    $('#extra-faktura').hidden = !val('faktura');
  }

  function refreshSummary() {
    $('#summary').innerHTML = summaryHTML();
    const t = totals();
    $('#submit-total').textContent = money(t.total);
    // ceny dostaw (darmowa od progu)
    HP.pricing.shippingMethods().forEach((m) => {
      const el = form().querySelector('[data-ship-price="' + CSS.escape(m.id) + '"]');
      if (!el) return;
      const p = HP.pricing.shippingPrice(m, t.goods);
      el.innerHTML = p ? money(p) : (m.price ? '<s class="muted">' + money(m.price) + '</s><small>gratis</small>' : 'bezpłatnie');
    });
  }

  /* ---------- Walidacja ---------- */
  function setError(name, msg) {
    const f = form().querySelector('[data-field="' + name + '"]');
    const e = $('#e-' + name);
    if (f) f.classList.toggle('is-invalid', !!msg);
    if (e) {
      e.querySelector('span').textContent = msg || '';
      e.style.display = msg ? 'flex' : '';
    }
    const input = form().elements[name];
    if (input && input.setAttribute) {
      if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'e-' + name); }
      else input.removeAttribute('aria-invalid');
    }
    return !msg;
  }

  function validNIP(nip) {
    const d = nip.replace(/[\s-]/g, '');
    if (!/^\d{10}$/.test(d)) return false;
    const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const sum = w.reduce((s, x, i) => s + x * +d[i], 0);
    return sum % 11 === +d[9];
  }

  function validate() {
    let ok = true;
    const req = (name, msg) => { const v = val(name); ok = setError(name, v ? '' : msg) && ok; return v; };
    req('firstName', 'Podaj imię.');
    req('lastName', 'Podaj nazwisko.');
    const email = val('email');
    ok = setError('email', !email ? 'Podaj adres e-mail.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Ten adres e-mail wygląda na niepoprawny.') && ok;
    const phone = val('phone').replace(/[\s()-]/g, '');
    ok = setError('phone', !phone ? 'Podaj numer telefonu.' : /^(\+?48)?\d{9}$/.test(phone) || /^\+\d{8,15}$/.test(phone) ? '' : 'Podaj 9-cyfrowy numer telefonu.') && ok;
    const m = HP.pricing.shippingMethod(shipId());
    if (!m) ok = false;
    if (m && m.type === 'paczkomat') {
      if (HP.inpost.hasMap()) ok = setError('paczkomat', pickedPoint ? '' : 'Wybierz Paczkomat na mapie.') && ok;
      else {
        const code = HP.inpost.normalizeCode(val('paczkomat'));
        ok = setError('paczkomat', !code ? 'Wpisz kod Paczkomatu.' : HP.inpost.isValidCode(code) ? '' : 'Kod Paczkomatu ma postać np. KRA01M.') && ok;
      }
    }
    if (m && m.type === 'adres') {
      req('street', 'Podaj ulicę i numer.');
      const pc = val('postcode');
      ok = setError('postcode', !pc ? 'Podaj kod pocztowy.' : /^\d{2}-\d{3}$/.test(pc) ? '' : 'Format: 00-000.') && ok;
      req('city', 'Podaj miejscowość.');
    }
    const pm = HP.pricing.paymentMethods(shipId()).find((x) => x.id === payId());
    ok = setError('platnosc', pm && pm.available ? '' : 'Wybierz metodę płatności.') && ok;
    if (val('faktura')) {
      req('company', 'Podaj nazwę firmy.');
      const nip = val('nip');
      ok = setError('nip', !nip ? 'Podaj NIP.' : validNIP(nip) ? '' : 'Ten NIP jest niepoprawny.') && ok;
    }
    ok = setError('terms', val('terms') ? '' : 'Aby złożyć zamówienie, zaakceptuj regulamin.') && ok;
    return ok;
  }

  /* ---------- Szkic formularza (sessionStorage) ---------- */
  const DRAFT_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'street', 'postcode', 'city', 'company', 'nip', 'invoiceAddress', 'notes', 'paczkomat'];
  function saveDraft() {
    const d = { dostawa: shipId(), platnosc: payId(), faktura: val('faktura'), point: pickedPoint };
    DRAFT_FIELDS.forEach((k) => { d[k] = val(k); });
    session.set(DRAFT_KEY, d);
  }
  function loadDraft() {
    const d = session.get(DRAFT_KEY, null);
    if (!d) return;
    DRAFT_FIELDS.forEach((k) => { const el = form().elements[k]; if (el && d[k]) el.value = d[k]; });
    if (d.dostawa) { const r = form().querySelector('input[name="dostawa"][value="' + CSS.escape(d.dostawa) + '"]'); if (r) r.checked = true; }
    if (d.faktura) form().elements.faktura.checked = true;
    if (d.point && HP.inpost.hasMap()) setPoint(d.point);
    refreshPayments();
    if (d.platnosc) { const r = form().querySelector('input[name="platnosc"][value="' + CSS.escape(d.platnosc) + '"]:not(:disabled)'); if (r) r.checked = true; }
  }

  function setPoint(pt) {
    pickedPoint = pt;
    const host = $('#picked-point');
    if (host) host.innerHTML = '<div class="locker-picked">' + icon('check') + '<div><strong>' + esc(pt.code) + '</strong><br><span class="small">' + esc([pt.line1, pt.line2].filter(Boolean).join(', ')) + '</span></div></div>';
    const hidden = $('#f-paczkomat');
    if (hidden) hidden.value = pt.code;
    setError('paczkomat', '');
  }

  /* ---------- Zamówienie ---------- */
  function buildOrder() {
    const t = totals();
    const m = t.shippingMethod;
    const pm = HP.pricing.paymentMethod(payId());
    const code = HP.inpost.normalizeCode(val('paczkomat'));
    return {
      number: HP.orders.newNumber(),
      createdAt: new Date().toISOString(),
      customer: { firstName: val('firstName'), lastName: val('lastName'), email: val('email'), phone: val('phone') },
      shipping: {
        method: m.id, label: m.label, type: m.type, price: t.shipping || 0,
        point: m.type === 'paczkomat' ? (pickedPoint || { code, line1: '', line2: '' }) : null,
        address: m.type === 'adres' ? { street: val('street'), postcode: val('postcode'), city: val('city'), country: 'PL' } : null
      },
      payment: { method: pm.id, label: pm.label, provider: pm.provider, fee: Number(pm.fee) || 0, status: 'oczekuje' },
      items: t.lines.map((l) => ({ id: l.id, name: l.product.name, variant: l.variantName, variantId: l.variantId, qty: l.qty, unit: l.unit, total: l.total })),
      totals: { subtotal: t.subtotal, discount: t.discount, discountPercent: t.bulk.percent, goods: t.goods, shipping: t.shipping || 0, paymentFee: t.paymentFee, total: t.total },
      invoice: val('faktura') ? { company: val('company'), nip: val('nip').replace(/[\s-]/g, ''), address: val('invoiceAddress') } : null,
      notes: val('notes'),
      consents: { terms: true, at: new Date().toISOString() },
      demo: HP.orders.isDemo()
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errBox = $('#co-error');
    errBox.innerHTML = '';
    if (!validate()) {
      const first = form().querySelector('.is-invalid input, .is-invalid textarea, .is-invalid select, [aria-invalid="true"]');
      if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      HP.ui.toast('Uzupełnij zaznaczone pola.', { type: 'error' });
      return;
    }
    const btn = $('#submit-btn');
    if (submitting) return;
    submitting = true;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    try {
      const order = buildOrder();
      await HP.orders.submit(order);
      session.remove(DRAFT_KEY);
      HP.cart.clear();
      // Zamówienie jest już przyjęte – jeśli bramka płatności zawiedzie,
      // klient trafia na stronę podziękowania z informacją, co dalej.
      let target = 'dziekujemy.html?nr=' + encodeURIComponent(order.number);
      try {
        const res = await HP.payments.start(order);
        if (res && res.redirect) target = res.redirect;
      } catch (payErr) {
        console.error(payErr);
        target += '&blad=platnosc';
      }
      window.location.href = target;
    } catch (err) {
      console.error(err);
      const mail = (CFG.contact && CFG.contact.email) || '';
      errBox.innerHTML = icon('alert') + '<span><strong>Nie udało się złożyć zamówienia.</strong> ' + esc(err.message || '') + ' Spróbuj ponownie za chwilę' + (mail ? ' lub napisz do nas: <a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>' : '') + '.</span>';
      errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      submitting = false;
    }
  }

  /* ---------- Start ---------- */
  HP.onReady(() => {
    const root = $('#checkout-root');
    if (HP.cart.isEmpty()) {
      root.innerHTML = '<div class="panel">' + HP.ui.emptyCartHTML() + '</div>';
      return;
    }
    root.innerHTML = '<div class="checkout-layout">' + formHTML() + '<aside class="summary panel" id="summary" aria-label="Podsumowanie zamówienia"></aside></div>';
    HP.ui.fillConfig(root);
    refreshPayments();
    loadDraft();
    refreshExtras();
    refreshSummary();

    const f = form();
    f.addEventListener('change', (e) => {
      if (e.target.name === 'dostawa') { refreshPayments(); refreshExtras(); }
      if (e.target.name === 'faktura') refreshExtras();
      if (e.target.closest('.field.is-invalid') || e.target.name === 'platnosc' || e.target.name === 'terms') {
        const fieldEl = e.target.closest('[data-field]');
        if (fieldEl) setError(fieldEl.dataset.field, '');
        if (e.target.name === 'platnosc') setError('platnosc', '');
      }
      refreshSummary();
      saveDraft();
    });
    f.addEventListener('input', (e) => {
      if (e.target.name === 'postcode') {
        const d = e.target.value.replace(/\D/g, '').slice(0, 5);
        e.target.value = d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
      }
      const fieldEl = e.target.closest('.field.is-invalid');
      if (fieldEl) setError(fieldEl.dataset.field, '');
      saveDraft();
    });
    f.addEventListener('submit', onSubmit);
    const mapBtn = $('#open-map');
    if (mapBtn) mapBtn.addEventListener('click', () => HP.inpost.openMap((pt) => { setPoint(pt); saveDraft(); }));
    HP.cart.subscribe(() => {
      if (submitting) return;
      if (HP.cart.isEmpty()) location.reload(); else refreshSummary();
    });
  });
})();
