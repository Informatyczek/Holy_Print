/* =========================================================================
   HOLY PRINT – PRZYJMOWANIE ZAMÓWIEŃ I WIADOMOŚCI
   -------------------------------------------------------------------------
   Tryb ustawiasz w config.js → orders.mode:
     'demo'      – zamówienie zapisuje się tylko w tej przeglądarce (do testów)
     'web3forms' – zamówienie przychodzi na e-mail (https://web3forms.com)
     'formspree' – zamówienie przychodzi na e-mail (https://formspree.io)
     'api'       – zamówienie trafia na własny serwer: POST {api.baseUrl}/orders
   Ten sam mechanizm wysyła wiadomości z formularza kontaktowego.
   ========================================================================= */
(function () {
  'use strict';
  const HP = window.HP;
  const CFG = HP.cfg;
  const { money, store } = HP.util;
  const ORDERS_KEY = 'hp_zamowienia_v1';

  const mode = () => (CFG.orders && CFG.orders.mode) || 'demo';
  const pad = (n) => String(n).padStart(2, '0');

  function newNumber() {
    const d = new Date();
    const prefix = (CFG.orders && CFG.orders.numberPrefix) || 'HP';
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rnd = '';
    const bytes = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(4)) : [0, 0, 0, 0].map(() => Math.random() * 256);
    for (let i = 0; i < 4; i++) rnd += alphabet[bytes[i] % alphabet.length];
    return prefix + '-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rnd;
  }

  /** Czytelne podsumowanie zamówienia (e-mail do sprzedawcy) */
  function toText(o) {
    const L = [];
    L.push('NOWE ZAMÓWIENIE ' + o.number);
    L.push('Data: ' + new Date(o.createdAt).toLocaleString('pl-PL'));
    L.push('');
    L.push('PRODUKTY');
    o.items.forEach((it) => L.push('• ' + it.qty + ' × ' + it.name + (it.variant ? ' (' + it.variant + ')' : '') + ' – ' + money(it.total)));
    L.push('');
    L.push('Wartość produktów: ' + money(o.totals.subtotal));
    if (o.totals.discount) L.push('Rabat: −' + money(o.totals.discount));
    L.push('Dostawa (' + o.shipping.label + '): ' + money(o.totals.shipping));
    if (o.totals.paymentFee) L.push('Opłata za płatność: ' + money(o.totals.paymentFee));
    L.push('DO ZAPŁATY: ' + money(o.totals.total));
    L.push('Płatność: ' + o.payment.label);
    L.push('');
    L.push('KLIENT');
    L.push(o.customer.firstName + ' ' + o.customer.lastName);
    L.push('E-mail: ' + o.customer.email);
    L.push('Telefon: ' + o.customer.phone);
    L.push('');
    L.push('DOSTAWA: ' + o.shipping.label);
    if (o.shipping.point) L.push('Paczkomat: ' + o.shipping.point.code + (o.shipping.point.line1 ? ' – ' + o.shipping.point.line1 + ', ' + o.shipping.point.line2 : ''));
    if (o.shipping.address) {
      const a = o.shipping.address;
      L.push('Adres: ' + a.street + ', ' + a.postcode + ' ' + a.city);
    }
    if (o.invoice) {
      L.push('');
      L.push('FAKTURA: ' + o.invoice.company + ', NIP ' + o.invoice.nip + (o.invoice.address ? ', ' + o.invoice.address : ''));
    }
    if (o.notes) { L.push(''); L.push('UWAGI: ' + o.notes); }
    L.push('');
    L.push('Zgody: regulamin zaakceptowany ' + (o.consents && o.consents.terms ? 'TAK' : 'NIE'));
    return L.join('\n');
  }

  async function postJSON(url, body, headers) {
    const res = await fetch(url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, headers || {}),
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false || data.ok === false) {
      throw new Error(data.message || data.error || 'Serwer odpowiedział błędem (' + res.status + ').');
    }
    return data;
  }

  /** Wysyłka dowolnej wiadomości (zamówienie / kontakt) wybranym kanałem */
  async function deliver(kind, subject, text, payload, replyTo) {
    const m = mode();
    if (m === 'web3forms') {
      if (!CFG.orders.web3formsKey) throw new Error('Brak klucza Web3Forms w config.js.');
      return postJSON('https://api.web3forms.com/submit', {
        access_key: CFG.orders.web3formsKey,
        subject,
        from_name: 'Sklep Holy Print',
        replyto: replyTo || undefined,
        message: text
      });
    }
    if (m === 'formspree') {
      if (!CFG.orders.formspreeId) throw new Error('Brak identyfikatora Formspree w config.js.');
      return postJSON('https://formspree.io/f/' + encodeURIComponent(CFG.orders.formspreeId), {
        _subject: subject,
        email: replyTo || undefined,
        message: text
      });
    }
    if (m === 'api') {
      const base = ((CFG.api && CFG.api.baseUrl) || '').replace(/\/$/, '');
      if (!base) throw new Error('Brak adresu api.baseUrl w config.js.');
      return postJSON(base + (kind === 'order' ? '/orders' : '/messages'), payload);
    }
    // demo – nic nie wysyłamy, tylko symulujemy krótkie opóźnienie
    console.info('[Holy Print – tryb demo] ' + subject + '\n\n' + text);
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true, demo: true };
  }

  function saveLocal(order) {
    const list = store.get(ORDERS_KEY, []).filter((o) => o.number !== order.number);
    list.unshift(order);
    store.set(ORDERS_KEY, list.slice(0, 10));
  }

  HP.orders = {
    mode,
    isDemo: () => mode() === 'demo',
    newNumber,
    toText,
    async submit(order) {
      const res = await deliver('order', 'Nowe zamówienie ' + order.number + ' – ' + money(order.totals.total), toText(order), order, order.customer.email);
      saveLocal(order);
      return res;
    },
    getLocal(number) {
      return store.get(ORDERS_KEY, []).find((o) => o.number === number) || null;
    },
    lastLocal() {
      return store.get(ORDERS_KEY, [])[0] || null;
    }
  };

  HP.forms = {
    /** data: { name, email, topic, message, ... } */
    async send(data) {
      const lines = Object.keys(data).filter((k) => data[k] !== '' && data[k] != null).map((k) => k + ': ' + data[k]);
      return deliver('message', 'Wiadomość ze strony: ' + (data.temat || 'kontakt'), lines.join('\n'), data, data.email);
    }
  };
})();
