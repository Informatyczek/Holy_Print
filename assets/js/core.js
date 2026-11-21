/* =========================================================================
   HOLY PRINT – RDZEŃ SKLEPU
   Narzędzia, produkty, koszyk (localStorage) i wyliczanie cen.
   Ustawienia sklepu są w config.js, produkty w products.js.
   ========================================================================= */
(function () {
  'use strict';

  var HP = (window.HP = window.HP || {});
  var CFG = (HP.cfg = window.HP_CONFIG || {});
  var DATA = (HP.data = window.HP_DATA || { products: [], categories: [], saints: [], formats: {} });

  /* ---------------------------------------------------------------------
     Narzędzia
     --------------------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

  let moneyFmt;
  try {
    moneyFmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: (CFG.shop && CFG.shop.currency) || 'PLN' });
  } catch (e) {
    moneyFmt = { format: (n) => n.toFixed(2).replace('.', ',') + ' zł' };
  }
  const money = (n) => moneyFmt.format(round2(n));

  /** Polska odmiana: plural(5, 'produkt', 'produkty', 'produktów') */
  function plural(n, one, few, many) {
    n = Math.abs(n);
    if (n === 1) return one;
    const d = n % 10, h = n % 100;
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
    return many;
  }

  /** Tekst bez polskich znaków i wielkich liter – do wyszukiwania */
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').trim();

  function makeStore(kind) {
    return {
      get(key, fallback) {
        try {
          const raw = window[kind].getItem(key);
          return raw == null ? fallback : JSON.parse(raw);
        } catch (e) { return fallback; }
      },
      set(key, value) {
        try { window[kind].setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
      },
      remove(key) {
        try { window[kind].removeItem(key); } catch (e) { /* brak dostępu – trudno */ }
      }
    };
  }
  const store = makeStore('localStorage');
  const session = makeStore('sessionStorage');

  const params = () => new URLSearchParams(window.location.search);
  function debounce(fn, ms) {
    let t;
    return function () { const a = arguments, self = this; clearTimeout(t); t = setTimeout(() => fn.apply(self, a), ms); };
  }
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  HP.util = { $, $$, esc, money, round2, plural, norm, store, session, params, debounce, reducedMotion };
  HP.onReady = onReady;

  /* ---------------------------------------------------------------------
     Produkty
     --------------------------------------------------------------------- */
  const PRODUCTS = Array.isArray(DATA.products) ? DATA.products : [];
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  const IMG_DIR = 'assets/img/produkty/';

  function imgInfo(entry, alt) {
    const o = typeof entry === 'string' ? { src: entry } : Object.assign({}, entry);
    const raw = String(o.src || '');
    const isPath = /[\/.]/.test(raw);
    o.full = isPath ? raw : IMG_DIR + raw + '.webp';
    o.thumb = o.thumb || (isPath ? raw : IMG_DIR + raw + '-480.webp');
    o.kind = o.kind || (/foto|\.jpe?g$/i.test(raw) ? 'photo' : 'cutout');
    o.alt = o.alt || alt || '';
    return o;
  }

  const P = {
    all() { return PRODUCTS.filter((p) => p.active !== false); },
    get(id) { return byId.get(id) || null; },
    categories() { return DATA.categories || []; },
    category(id) { return (DATA.categories || []).find((c) => c.id === id) || null; },
    saints() { return DATA.saints || []; },
    saint(id) { return (DATA.saints || []).find((s) => s.id === id) || null; },
    format(id) { return (DATA.formats || {})[id] || null; },
    variants(p) { return p && Array.isArray(p.variants) ? p.variants : []; },
    variant(p, vid) {
      const vs = P.variants(p);
      if (!vs.length) return null;
      return vs.find((v) => v.id === vid) || vs[0];
    },
    variantName(v) {
      if (!v) return '';
      if (v.label) return v.label;
      const f = P.format(v.format);
      return f ? 'Format ' + f.name.toLowerCase() : v.id;
    },
    variantDetail(v) {
      if (!v) return '';
      const f = P.format(v.format);
      return [f && f.size, v.caption].filter(Boolean).join(' · ');
    },
    price(p, vid) {
      const v = P.variant(p, vid);
      return v && v.price != null ? v.price : p.price;
    },
    priceRange(p) {
      const vs = P.variants(p);
      if (!vs.length) return [p.price, p.price];
      const prices = vs.map((v) => (v.price != null ? v.price : p.price));
      return [Math.min.apply(null, prices), Math.max.apply(null, prices)];
    },
    images(p, vid) {
      const v = P.variant(p, vid);
      const list = v && v.images && v.images.length ? v.images : p.images || [];
      return list.map((e, i) => imgInfo(e, p.name + (i ? ' – zdjęcie ' + (i + 1) : '')));
    },
    cover(p, vid) { return P.images(p, vid)[0] || imgInfo('assets/img/logo@2x.png', p.name); },
    url(p, vid) {
      return 'produkt.html?id=' + encodeURIComponent(p.id) + (vid ? '&wariant=' + encodeURIComponent(vid) : '');
    },
    haystack(p) {
      const s = P.saint(p.saint);
      const c = P.category(p.category);
      return norm([p.name, p.title, c && c.name, c && c.singular, s && s.name, s && (s.names || []).join(' '), (p.tags || []).join(' ')].join(' '));
    },
    search(query, limit) {
      const tokens = norm(query).split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];
      const res = [];
      P.all().forEach((p) => {
        const hay = P.haystack(p);
        if (!tokens.every((t) => hay.includes(t))) return;
        const title = norm(p.title + ' ' + p.name);
        let score = 0;
        tokens.forEach((t) => { if (title.includes(t)) score += 2; if (title.startsWith(t)) score += 1; });
        res.push({ p, score });
      });
      res.sort((a, b) => b.score - a.score);
      return res.slice(0, limit || 50).map((r) => r.p);
    },
    /** Szukanie patrona po imieniu (np. „Michał”, „michal”, „Tereska”) */
    findSaintByName(name) {
      const n = norm(name);
      if (!n) return null;
      return P.saints().find((s) => (s.names || []).some((x) => norm(x) === n)) || null;
    },
    bySaint(saintId) { return P.all().filter((p) => p.saint === saintId); }
  };
  HP.products = P;

  /* ---------------------------------------------------------------------
     Koszyk (zapisywany w przeglądarce klienta)
     --------------------------------------------------------------------- */
  const CART_KEY = 'hp_koszyk_v1';
  const MAX_QTY = 99;
  const listeners = new Set();

  function loadCart() {
    const c = store.get(CART_KEY, null) || { items: [] };
    c.items = (Array.isArray(c.items) ? c.items : []).filter((it) => it && byId.has(it.id) && it.qty > 0);
    return c;
  }
  let cart = loadCart();

  function emit(change) {
    listeners.forEach((fn) => { try { fn(cart, change); } catch (e) { console.error(e); } });
    document.dispatchEvent(new CustomEvent('hp:cart', { detail: { cart, change } }));
  }
  function saveCart(change) {
    store.set(CART_KEY, cart);
    emit(change);
  }
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) { cart = loadCart(); emit({ type: 'sync' }); }
  });

  const keyOf = (id, vid) => id + '|' + (vid || '');

  HP.cart = {
    items: () => cart.items.slice(),
    count: () => cart.items.reduce((s, i) => s + i.qty, 0),
    isEmpty: () => cart.items.length === 0,
    add(id, vid, qty) {
      const p = byId.get(id);
      if (!p) return null;
      const v = P.variant(p, vid);
      const key = keyOf(id, v && v.id);
      const n = Math.max(1, Math.min(MAX_QTY, parseInt(qty, 10) || 1));
      const ex = cart.items.find((i) => i.key === key);
      if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + n);
      else cart.items.push({ key, id, variant: v ? v.id : null, qty: n });
      saveCart({ type: 'add', key, qty: n });
      return key;
    },
    setQty(key, qty) {
      const it = cart.items.find((i) => i.key === key);
      if (!it) return;
      const n = parseInt(qty, 10);
      if (!n || n < 1) return HP.cart.remove(key);
      it.qty = Math.min(MAX_QTY, n);
      saveCart({ type: 'qty', key });
    },
    remove(key) {
      cart.items = cart.items.filter((i) => i.key !== key);
      saveCart({ type: 'remove', key });
    },
    clear() {
      cart.items = [];
      saveCart({ type: 'clear' });
    },
    lines() {
      return cart.items
        .map((it) => {
          const p = byId.get(it.id);
          if (!p) return null;
          const v = P.variant(p, it.variant);
          const vid = v ? v.id : null;
          const unit = P.price(p, vid);
          return {
            key: it.key, id: p.id, product: p, variant: v, variantId: vid,
            variantName: v ? P.variantName(v) : '', variantDetail: v ? P.variantDetail(v) : '',
            qty: it.qty, unit, total: round2(unit * it.qty),
            image: P.cover(p, vid), url: P.url(p, vid)
          };
        })
        .filter(Boolean);
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };

  /* ---------------------------------------------------------------------
     Ceny, rabaty, dostawa, płatności
     --------------------------------------------------------------------- */
  const ONLINE = ['przelewy24', 'payu', 'tpay', 'stripe'];

  const Pricing = {
    bulk(lines) {
      const b = CFG.promotions && CFG.promotions.bulk;
      const empty = { percent: 0, qty: 0, eligible: 0, amount: 0, next: null, tiers: [], label: '' };
      if (!b || !b.enabled) return empty;
      const cats = b.categories || [];
      const el = lines.filter((l) => cats.includes(l.product.category));
      const qty = el.reduce((s, l) => s + l.qty, 0);
      const eligible = round2(el.reduce((s, l) => s + l.total, 0));
      const tiers = (b.tiers || []).slice().sort((a, c) => a.min - c.min);
      let percent = 0, next = null;
      tiers.forEach((t) => { if (qty >= t.min) percent = t.percent; else if (!next) next = t; });
      return { percent, qty, eligible, amount: round2((eligible * percent) / 100), next, tiers, label: b.label || 'Rabat ilościowy', categories: cats };
    },
    shippingMethods() {
      return ((CFG.shipping && CFG.shipping.methods) || []).filter((m) => m.enabled !== false);
    },
    shippingMethod(id) {
      return Pricing.shippingMethods().find((m) => m.id === id) || null;
    },
    freeFrom() { return (CFG.shipping && Number(CFG.shipping.freeFrom)) || 0; },
    shippingPrice(m, value) {
      if (!m) return 0;
      const free = Pricing.freeFrom();
      return free && value >= free ? 0 : Number(m.price) || 0;
    },
    cheapestShipping() {
      const ms = Pricing.shippingMethods().filter((m) => m.type !== 'odbior');
      if (!ms.length) return null;
      return Math.min.apply(null, ms.map((m) => Number(m.price) || 0));
    },
    isOnline(m) { return ONLINE.includes(m.provider); },
    paymentMethods(shippingId) {
      const pm = CFG.payments || {};
      return (pm.methods || [])
        .filter((m) => m.enabled !== false || (pm.showComingSoon && ONLINE.includes(m.provider)))
        .map((m) => {
          const restricted = Array.isArray(m.onlyFor) && shippingId && !m.onlyFor.includes(shippingId);
          return Object.assign({}, m, {
            comingSoon: m.enabled === false,
            available: m.enabled !== false && !restricted,
            restricted
          });
        });
    },
    paymentMethod(id) {
      return ((CFG.payments && CFG.payments.methods) || []).find((m) => m.id === id) || null;
    },
    totals(opts) {
      opts = opts || {};
      const lines = HP.cart.lines();
      const count = lines.reduce((s, l) => s + l.qty, 0);
      const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
      const bulk = Pricing.bulk(lines);
      const discount = bulk.amount;
      const goods = round2(subtotal - discount);
      const ship = opts.shippingId ? Pricing.shippingMethod(opts.shippingId) : null;
      const shipping = ship ? Pricing.shippingPrice(ship, goods) : null;
      const pay = opts.paymentId ? Pricing.paymentMethod(opts.paymentId) : null;
      const paymentFee = pay ? Number(pay.fee) || 0 : 0;
      const free = Pricing.freeFrom();
      return {
        lines, count, subtotal, bulk, discount, goods,
        shipping, shippingMethod: ship, paymentFee, paymentMethod: pay,
        total: round2(goods + (shipping || 0) + paymentFee),
        freeFrom: free,
        freeLeft: free ? Math.max(0, round2(free - goods)) : null,
        freeProgress: free ? Math.min(1, goods / free) : 1
      };
    }
  };
  HP.pricing = Pricing;
})();
