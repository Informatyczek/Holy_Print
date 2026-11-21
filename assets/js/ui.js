/* =========================================================================
   HOLY PRINT – INTERFEJS
   Nagłówek, stopka, koszyk wysuwany z boku, wyszukiwarka, powiadomienia,
   karty produktów i drobne animacje. Wspólne dla wszystkich podstron.
   ========================================================================= */
(function () {
  'use strict';

  const HP = window.HP;
  const CFG = HP.cfg;
  const { $, $$, esc, money, plural, reducedMotion } = HP.util;
  const P = HP.products;
  const ICONS = window.HP_ICONS || {};

  /* ---------------------------------------------------------------------
     Ikony
     --------------------------------------------------------------------- */
  function icon(name, cls) {
    const d = ICONS[name];
    if (!d) return '';
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }
  HP.icon = icon;

  /* ---------------------------------------------------------------------
     Warstwy (koszyk, menu, wyszukiwarka, galeria) – fokus, Esc, blokada przewijania
     --------------------------------------------------------------------- */
  const layers = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openLayer(el, opts) {
    if (!el || layers.some((l) => l.el === el)) return;
    opts = opts || {};
    const entry = { el, opts, returnFocus: document.activeElement };
    layers.push(entry);
    el.hidden = false;
    document.documentElement.classList.add('is-locked');
    requestAnimationFrame(() => {
      el.classList.add('is-open');
      const target = (opts.focus && $(opts.focus, el)) || $(FOCUSABLE, el);
      if (target) target.focus({ preventScroll: true });
    });
    if (opts.onOpen) opts.onOpen();
  }

  function closeLayer(el) {
    const idx = layers.findIndex((l) => l.el === el);
    if (idx === -1) return;
    const entry = layers.splice(idx, 1)[0];
    el.classList.remove('is-open');
    const done = () => { if (!el.classList.contains('is-open')) el.hidden = true; };
    if (reducedMotion()) done(); else setTimeout(done, 320);
    if (!layers.length) document.documentElement.classList.remove('is-locked');
    if (entry.opts.onClose) entry.opts.onClose();
    if (entry.returnFocus && entry.returnFocus.focus) entry.returnFocus.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', (e) => {
    const top = layers[layers.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLayer(top.el); return; }
    if (e.key === 'Tab') {
      const items = $$(FOCUSABLE, top.el).filter((x) => x.offsetParent !== null || x === document.activeElement);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------------------------------------------------------------
     Nagłówek
     --------------------------------------------------------------------- */
  const NAV = [
    { href: 'sklep.html', label: 'Sklep', key: 'shop' },
    { href: 'sklep.html?kategoria=obrazki', label: 'Obrazki', key: 'obrazki' },
    { href: 'sklep.html?kategoria=breloki', label: 'Breloki', key: 'breloki' },
    { href: 'index.html#patroni', label: 'Patroni', key: 'patroni' },
    { href: 'o-nas.html', label: 'O nas', key: 'about' },
    { href: 'kontakt.html', label: 'Kontakt', key: 'contact' }
  ];

  function activeKey() {
    const page = document.body.dataset.page || '';
    if (page === 'shop') {
      const k = HP.util.params().get('kategoria');
      return k === 'obrazki' || k === 'breloki' ? k : 'shop';
    }
    return page;
  }

  function navLinks(cls) {
    const act = activeKey();
    return NAV.map((n) => '<li><a class="' + cls + '" href="' + n.href + '"' + (n.key === act ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>').join('');
  }

  function renderHeader() {
    const host = $('#site-header');
    if (!host) return;
    const ann = Array.isArray(CFG.announcements) ? CFG.announcements.filter(Boolean) : [];
    const annItems = (list, hidden) => list.map((t) => '<span class="announce__item"' + (hidden ? ' aria-hidden="true"' : '') + '>' + icon('sparkle', 'announce__star') + esc(t) + '</span>').join('');
    const announce = ann.length
      ? '<div class="announce"><div class="announce__track">' + annItems(ann) + annItems(ann, true) + annItems(ann, true) + '</div></div>'
      : '';
    if (!ann.length) document.documentElement.style.setProperty('--announce-h', '0px');

    host.innerHTML =
      announce +
      '<div class="header-bar"><div class="container header-bar__inner">' +
        '<button class="icon-btn menu-toggle" type="button" aria-label="Otwórz menu" aria-expanded="false" aria-controls="mobile-nav" data-menu-open>' + icon('menu') + '</button>' +
        '<a class="brand" href="index.html" aria-label="Holy Print – strona główna">' +
          '<img class="brand__logo" src="assets/img/logo-naglowek.png" srcset="assets/img/logo-naglowek.png 1x, assets/img/logo-naglowek@2x.png 2x" alt="Holy Print" width="114" height="72">' +
        '</a>' +
        '<nav class="main-nav" aria-label="Nawigacja główna"><ul>' + navLinks('main-nav__link') + '</ul></nav>' +
        '<div class="header-actions">' +
          '<button class="icon-btn" type="button" aria-label="Szukaj" data-search-open>' + icon('search') + '</button>' +
          '<a class="icon-btn cart-btn" href="koszyk.html" aria-label="Koszyk" data-cart-open>' + icon('cart') +
            '<span class="cart-count" hidden>0</span></a>' +
        '</div>' +
      '</div></div>';

    // menu mobilne
    const mobile = document.createElement('div');
    mobile.className = 'mobile-nav';
    mobile.id = 'mobile-nav';
    mobile.hidden = true;
    mobile.setAttribute('role', 'dialog');
    mobile.setAttribute('aria-modal', 'true');
    mobile.setAttribute('aria-label', 'Menu');
    const c = CFG.contact || {};
    mobile.innerHTML =
      '<div class="mobile-nav__backdrop" data-close></div>' +
      '<div class="mobile-nav__panel">' +
        '<div class="mobile-nav__head">' +
          '<img src="assets/img/logo-naglowek@2x.png" alt="Holy Print" width="114" height="72">' +
          '<button class="icon-btn" type="button" aria-label="Zamknij menu" data-close>' + icon('close') + '</button>' +
        '</div>' +
        '<nav aria-label="Menu mobilne"><ul class="mobile-nav__list">' + navLinks('mobile-nav__link') + '</ul></nav>' +
        '<div class="mobile-nav__foot">' +
          (c.email ? '<a href="mailto:' + esc(c.email) + '">' + icon('mail') + esc(c.email) + '</a>' : '') +
          (c.phone ? '<a href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">' + icon('device-phone') + esc(c.phone) + '</a>' : '') +
        '</div>' +
      '</div>';
    document.body.appendChild(mobile);
    $$('.mobile-nav__link', mobile).forEach((a) => a.addEventListener('click', () => closeLayer(mobile)));

    // cień nagłówka po przewinięciu
    const bar = $('.header-bar', host);
    const onScroll = () => host.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (bar) host.style.setProperty('--header-h', bar.offsetHeight + 'px');
  }

  /* ---------------------------------------------------------------------
     Stopka
     --------------------------------------------------------------------- */
  function renderFooter() {
    const host = $('#site-footer');
    if (!host) return;
    const c = CFG.contact || {};
    const s = c.social || {};
    const socials = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']]
      .filter(([k]) => s[k])
      .map(([k, label]) => '<a class="social" href="' + esc(s[k]) + '" target="_blank" rel="noopener" aria-label="' + label + '">' + icon(k) + '</a>')
      .join('');
    const ship = HP.pricing.shippingMethods().map((m) => m.label.split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i);
    const pays = ((CFG.payments && CFG.payments.methods) || []).filter((m) => m.enabled !== false).map((m) => m.label.replace('Przelew tradycyjny', 'Przelew').replace(' na telefon', ''));
    const year = new Date().getFullYear();
    host.innerHTML =
      '<div class="footer-sky" aria-hidden="true"></div>' +
      '<div class="container footer-grid">' +
        '<div class="footer-brand">' +
          '<a href="index.html" class="footer-brand__logo" aria-label="Holy Print – strona główna"><img src="assets/img/logo.svg" alt="Holy Print" width="188" height="118" loading="lazy"></a>' +
          '<p>Pixelowe obrazki i breloki ze świętymi patronami. Mały znak wiary na co dzień – i prezent, który zostaje na dłużej.</p>' +
          (socials ? '<div class="socials">' + socials + '</div>' : '') +
        '</div>' +
        '<div class="footer-col"><h2 class="footer-col__title">Sklep</h2><ul>' +
          '<li><a href="sklep.html">Wszystkie produkty</a></li>' +
          '<li><a href="sklep.html?kategoria=obrazki">Obrazki</a></li>' +
          '<li><a href="sklep.html?kategoria=breloki">Breloki</a></li>' +
          '<li><a href="sklep.html?kategoria=zestawy">Zestawy</a></li>' +
          '<li><a href="index.html#patroni">Znajdź patrona</a></li>' +
        '</ul></div>' +
        '<div class="footer-col"><h2 class="footer-col__title">Informacje</h2><ul>' +
          '<li><a href="dostawa-i-platnosci.html">Dostawa i płatności</a></li>' +
          '<li><a href="zwroty-i-reklamacje.html">Zwroty i reklamacje</a></li>' +
          '<li><a href="regulamin.html">Regulamin</a></li>' +
          '<li><a href="polityka-prywatnosci.html">Polityka prywatności</a></li>' +
          '<li><a href="o-nas.html">O nas</a></li>' +
        '</ul></div>' +
        '<div class="footer-col"><h2 class="footer-col__title">Kontakt</h2><ul class="footer-contact">' +
          (c.email ? '<li><a href="mailto:' + esc(c.email) + '">' + icon('mail') + '<span>' + esc(c.email) + '</span></a></li>' : '') +
          (c.phone ? '<li><a href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">' + icon('device-phone') + '<span>' + esc(c.phone) + '</span></a></li>' : '') +
          (c.hours ? '<li>' + icon('clock') + '<span>' + esc(c.hours) + '</span></li>' : '') +
          '<li><a href="kontakt.html">' + icon('message') + '<span>Formularz kontaktowy</span></a></li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="container footer-bottom">' +
        '<p>© ' + year + ' Holy Print. ' + esc((CFG.shop && CFG.shop.pricesNote) || '') + '</p>' +
        '<ul class="footer-badges" aria-label="Dostawa i płatności">' +
          ship.concat(pays).map((t) => '<li>' + esc(t) + '</li>').join('') +
        '</ul>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     Wypełnianie pól z config.js:  <span data-cfg="contact.email"></span>
     --------------------------------------------------------------------- */
  function cfgValue(path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), CFG);
  }
  function fillConfig(root) {
    $$('[data-cfg]', root || document).forEach((el) => {
      const v = cfgValue(el.dataset.cfg);
      if (v != null && v !== '') el.textContent = v;
      else if (el.dataset.cfgEmpty != null) el.textContent = el.dataset.cfgEmpty;
    });
    $$('[data-cfg-if]', root || document).forEach((el) => {
      const v = cfgValue(el.dataset.cfgIf);
      el.hidden = v == null || v === '' || v === false;
    });
    $$('[data-cfg-href]', root || document).forEach((el) => {
      const [prefix, path] = el.dataset.cfgHref.split('|');
      const v = cfgValue(path);
      if (v) el.setAttribute('href', prefix + String(v).replace(/\s/g, ''));
    });
  }

  /** <span data-icon="truck"></span> → ikona SVG */
  function hydrateIcons(root) {
    $$('[data-icon]', root || document).forEach((el) => {
      const svg = icon(el.dataset.icon, el.className);
      if (svg) el.outerHTML = svg;
    });
  }

  /** Wartości wyliczane z config.js: <span data-fill="free-from"></span> */
  function bulkTiersText() {
    const b = CFG.promotions && CFG.promotions.bulk;
    if (!b || !b.enabled || !b.tiers || !b.tiers.length) return '';
    return b.tiers.slice().sort((a, c) => a.min - c.min).map((t) => 'od ' + t.min + ' szt. −' + t.percent + '%').join(', ');
  }
  function fillDynamic(root) {
    const map = {
      'cheapest-shipping': () => { const v = HP.pricing.cheapestShipping(); return v == null ? '' : money(v); },
      'free-from': () => (HP.pricing.freeFrom() ? money(HP.pricing.freeFrom()) : ''),
      'bulk-tiers': bulkTiersText,
      'year': () => String(new Date().getFullYear())
    };
    $$('[data-fill]', root || document).forEach((el) => {
      const fn = map[el.dataset.fill];
      if (!fn) return;
      const v = fn();
      if (v) el.textContent = v;
      else if (el.dataset.fillHide != null) { const h = el.closest(el.dataset.fillHide); if (h) h.hidden = true; }
    });
  }

  /* ---------------------------------------------------------------------
     Pozycje koszyka (szuflada i strona koszyka)
     --------------------------------------------------------------------- */
  function lineHTML(l, opts) {
    opts = opts || {};
    const img = l.image;
    return '<li class="line" data-key="' + esc(l.key) + '">' +
      '<a class="line__img line__img--' + img.kind + '" href="' + l.url + '" tabindex="-1" aria-hidden="true"><img src="' + esc(img.thumb) + '" alt="" loading="lazy"></a>' +
      '<div class="line__info">' +
        '<a class="line__name" href="' + l.url + '">' + esc(l.product.name) + '</a>' +
        (l.variantName ? '<p class="line__variant">' + esc(l.variantName) + (l.variantDetail ? ' · ' + esc(l.variantDetail) : '') + '</p>' : '') +
        '<div class="line__row">' +
          '<div class="qty qty--sm">' +
            '<button type="button" data-qty-dec aria-label="Zmniejsz ilość">' + icon('minus') + '</button>' +
            '<input type="number" inputmode="numeric" min="1" max="99" value="' + l.qty + '" aria-label="Ilość: ' + esc(l.product.name) + '">' +
            '<button type="button" data-qty-inc aria-label="Zwiększ ilość">' + icon('plus') + '</button>' +
          '</div>' +
          '<p class="line__price"><span class="line__unit">' + (l.qty > 1 ? money(l.unit) + ' / szt.' : '') + '</span>' + money(l.total) + '</p>' +
        '</div>' +
      '</div>' +
      '<button class="icon-btn icon-btn--sm line__remove" type="button" data-remove aria-label="Usuń z koszyka: ' + esc(l.product.name) + '">' + icon('trash') + '</button>' +
    '</li>';
  }

  function freeShippingHTML(t) {
    if (!t.freeFrom) return '';
    const pct = Math.round(t.freeProgress * 100);
    const msg = t.freeLeft > 0
      ? 'Brakuje Ci <strong>' + money(t.freeLeft) + '</strong> do darmowej dostawy'
      : icon('check') + ' <strong>Masz darmową dostawę!</strong>';
    return '<div class="ship-progress' + (t.freeLeft > 0 ? '' : ' is-done') + '">' +
      '<p>' + msg + '</p>' +
      '<div class="pbar" role="progressbar" aria-label="Postęp do darmowej dostawy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div>' +
    '</div>';
  }

  function bulkHintHTML(t) {
    const b = t.bulk;
    if (!b || !b.tiers || !b.tiers.length) return '';
    if (b.next && b.qty > 0) {
      const left = b.next.min - b.qty;
      return '<p class="bulk-hint">' + icon('percent') + '<span>Dodaj jeszcze <strong>' + left + ' ' + plural(left, 'obrazek', 'obrazki', 'obrazków') + '</strong>, a otrzymasz <strong>−' + b.next.percent + '%</strong> na obrazki.</span></p>';
    }
    if (b.percent) return '<p class="bulk-hint is-on">' + icon('percent') + '<span>' + esc(b.label) + ' <strong>−' + b.percent + '%</strong> naliczony!</span></p>';
    return '';
  }

  /* ---------------------------------------------------------------------
     Szuflada koszyka
     --------------------------------------------------------------------- */
  let drawer;
  function buildDrawer() {
    drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'cart-drawer';
    drawer.hidden = true;
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'cart-drawer-title');
    drawer.innerHTML =
      '<div class="drawer__backdrop" data-close></div>' +
      '<aside class="drawer__panel">' +
        '<header class="drawer__head">' +
          '<h2 id="cart-drawer-title" class="drawer__title">' + icon('cart') + 'Twój koszyk <span class="drawer__count"></span></h2>' +
          '<button class="icon-btn" type="button" aria-label="Zamknij koszyk" data-close>' + icon('close') + '</button>' +
        '</header>' +
        '<div class="drawer__body"></div>' +
        '<footer class="drawer__foot"></footer>' +
      '</aside>';
    document.body.appendChild(drawer);
    renderDrawer();
  }

  function emptyCartHTML() {
    return '<div class="empty-cart">' +
      '<div class="empty-cart__art" aria-hidden="true">' + icon('halo', 'empty-cart__halo') + icon('cart', 'empty-cart__cart') + '</div>' +
      '<p class="empty-cart__title">Koszyk jest pusty</p>' +
      '<p class="empty-cart__text">Zajrzyj do sklepu – czeka tam pięciu świętych patronów w pixelowej odsłonie.</p>' +
      '<a class="btn btn--primary" href="sklep.html">Przejdź do sklepu</a>' +
    '</div>';
  }

  function renderDrawer() {
    if (!drawer) return;
    const t = HP.pricing.totals();
    $('.drawer__count', drawer).textContent = t.count ? '(' + t.count + ')' : '';
    const body = $('.drawer__body', drawer);
    const foot = $('.drawer__foot', drawer);
    if (!t.lines.length) {
      body.innerHTML = emptyCartHTML();
      foot.innerHTML = '';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = freeShippingHTML(t) + '<ul class="lines">' + t.lines.map((l) => lineHTML(l)).join('') + '</ul>' + bulkHintHTML(t);
    foot.innerHTML =
      (t.discount ? '<div class="sum-row sum-row--discount"><span>' + esc(t.bulk.label) + ' (−' + t.bulk.percent + '%)</span><span>−' + money(t.discount) + '</span></div>' : '') +
      '<div class="sum-row sum-row--total"><span>Razem</span><span>' + money(t.goods) + '</span></div>' +
      '<p class="drawer__note">Koszt dostawy wybierzesz w kolejnym kroku' + (HP.pricing.cheapestShipping() != null ? ' (od ' + money(HP.pricing.cheapestShipping()) + ')' : '') + '.</p>' +
      '<a class="btn btn--primary btn--block" href="zamowienie.html">' + icon('lock') + 'Przejdź do kasy</a>' +
      '<a class="btn btn--ghost btn--block" href="koszyk.html">Zobacz koszyk</a>';
  }

  function openCart() {
    if (!drawer) buildDrawer();
    renderDrawer();
    openLayer(drawer, { focus: '[data-close].icon-btn' });
  }

  /* ---------------------------------------------------------------------
     Licznik koszyka w nagłówku
     --------------------------------------------------------------------- */
  function updateCartCount(bump) {
    const n = HP.cart.count();
    $$('.cart-count').forEach((el) => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = n === 0;
    });
    $$('.cart-btn').forEach((btn) => {
      btn.setAttribute('aria-label', 'Koszyk: ' + n + ' ' + plural(n, 'produkt', 'produkty', 'produktów'));
      if (bump && !reducedMotion()) {
        btn.classList.remove('is-bump');
        void btn.offsetWidth;
        btn.classList.add('is-bump');
      }
    });
  }

  /* ---------------------------------------------------------------------
     Powiadomienia (toasty)
     --------------------------------------------------------------------- */
  let toastHost;
  function toast(message, opts) {
    opts = opts || {};
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'toasts';
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    const el = document.createElement('div');
    el.className = 'toast toast--' + (opts.type || 'success');
    el.innerHTML = '<span class="toast__icon">' + icon(opts.icon || (opts.type === 'error' ? 'alert' : 'check')) + '</span>' +
      '<span class="toast__msg">' + message + '</span>' +
      (opts.action ? '<a class="toast__action" href="' + esc(opts.action.href || '#') + '"' + (opts.action.cart ? ' data-cart-open' : '') + '>' + esc(opts.action.label) + '</a>' : '');
    toastHost.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    const remove = () => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 300); };
    setTimeout(remove, opts.duration || 4200);
    el.addEventListener('click', (e) => { if (!e.target.closest('a')) remove(); });
    return el;
  }

  /* ---------------------------------------------------------------------
     Animacja „lotu” do koszyka
     --------------------------------------------------------------------- */
  function flyToCart(fromImg) {
    const target = $$('.cart-btn').find((b) => b.offsetParent !== null);
    if (!fromImg || !target || reducedMotion() || !fromImg.animate) return Promise.resolve();
    const a = fromImg.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width) return Promise.resolve();
    const ghost = document.createElement('img');
    ghost.src = fromImg.currentSrc || fromImg.src;
    ghost.className = 'fly-ghost';
    ghost.alt = '';
    Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = ghost.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.55 - 80) + 'px) scale(.55) rotate(-10deg)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08) rotate(-18deg)', opacity: 0.3 }
    ], { duration: 780, easing: 'cubic-bezier(.45,0,.25,1)' });
    return new Promise((res) => { anim.onfinish = () => { ghost.remove(); res(); }; });
  }

  /** Dodanie do koszyka z animacją i powiadomieniem */
  function addToCart(id, variant, qty, opts) {
    opts = opts || {};
    const p = P.get(id);
    if (!p) return;
    HP.cart.add(id, variant, qty);
    const v = P.variant(p, variant);
    const label = esc(p.name) + (v && P.variants(p).length > 1 ? ' <span class="toast__sub">(' + esc(P.variantName(v).toLowerCase()) + ')</span>' : '');
    flyToCart(opts.img).then(() => {
      updateCartCount(true);
      if (opts.openDrawer) openCart();
      else toast('Dodano do koszyka: ' + label, { action: { label: 'Zobacz koszyk', href: 'koszyk.html', cart: true } });
    });
  }

  /* ---------------------------------------------------------------------
     Karta produktu
     --------------------------------------------------------------------- */
  const BADGES = {
    nowosc: ['Nowość', 'badge--lav'],
    bestseller: ['Bestseller', 'badge--gold'],
    promocja: ['Promocja', 'badge--rose'],
    limitowana: ['Edycja limitowana', 'badge--dark']
  };

  function priceHTML(p) {
    const [min, max] = P.priceRange(p);
    let h = '<p class="price">' + (min !== max ? '<span class="price__from">od</span>' : '') + '<span class="price__now">' + money(min) + '</span>';
    if (p.oldPrice && p.oldPrice > min) h += '<s class="price__old">' + money(p.oldPrice) + '</s>';
    return h + '</p>';
  }

  function productCard(p, opts) {
    opts = opts || {};
    const v = P.variant(p);
    const cover = P.cover(p, v && v.id);
    const cat = P.category(p.category);
    const saint = P.saint(p.saint);
    const vs = P.variants(p);
    const badges = (p.badges || []).filter((b) => BADGES[b]).map((b) => '<span class="badge ' + BADGES[b][1] + '">' + BADGES[b][0] + '</span>');
    if (vs.length > 1) badges.push('<span class="badge badge--soft">' + vs.length + ' formaty</span>');
    if (p.bundleValue && p.bundleValue > p.price) badges.push('<span class="badge badge--gold">Taniej o ' + money(p.bundleValue - p.price) + '</span>');
    const url = P.url(p);
    const meta = [cat && cat.singular, saint && saint.feast ? 'imieniny ' + saint.feast : null].filter(Boolean);
    return '<article class="pcard' + (opts.reveal === false ? '' : ' reveal') + '" data-id="' + esc(p.id) + '">' +
      '<a class="pcard__media pcard__media--' + cover.kind + '" href="' + url + '" tabindex="-1" aria-hidden="true">' +
        (badges.length ? '<span class="pcard__badges">' + badges.join('') + '</span>' : '') +
        '<span class="pcard__glow"></span>' +
        '<img class="pcard__img" src="' + esc(cover.thumb) + '" alt="" loading="lazy" decoding="async">' +
      '</a>' +
      '<div class="pcard__body">' +
        '<p class="pcard__meta">' + meta.map(esc).join(' · ') + '</p>' +
        '<h3 class="pcard__title"><a href="' + url + '">' + esc(p.title || p.name) + '</a></h3>' +
        '<div class="pcard__foot">' + priceHTML(p) +
          '<button class="btn btn--primary btn--sm btn--add" type="button" data-add="' + esc(p.id) + '" aria-label="Dodaj do koszyka: ' + esc(p.name) + (vs.length > 1 ? ', ' + esc(P.variantName(v).toLowerCase()) : '') + '">' + icon('cart') + '<span>Dodaj</span></button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------------------------------------------------------------------
     Wyszukiwarka
     --------------------------------------------------------------------- */
  let searchEl;
  function buildSearch() {
    searchEl = document.createElement('div');
    searchEl.className = 'search-overlay';
    searchEl.id = 'search-overlay';
    searchEl.hidden = true;
    searchEl.setAttribute('role', 'dialog');
    searchEl.setAttribute('aria-modal', 'true');
    searchEl.setAttribute('aria-label', 'Wyszukiwarka');
    const hints = ['Michał', 'Teresa', 'Franciszek', 'brelok', 'zestaw'];
    searchEl.innerHTML =
      '<div class="search-overlay__backdrop" data-close></div>' +
      '<div class="search-overlay__panel">' +
        '<form class="search-form" action="sklep.html" role="search">' +
          icon('search', 'search-form__icon') +
          '<input class="search-form__input" type="search" name="q" placeholder="Szukaj obrazka, breloka lub patrona…" autocomplete="off" aria-label="Szukaj w sklepie">' +
          '<button class="icon-btn" type="button" aria-label="Zamknij wyszukiwarkę" data-close>' + icon('close') + '</button>' +
        '</form>' +
        '<div class="search-results" aria-live="polite"></div>' +
        '<div class="search-hints"><span>Popularne:</span>' + hints.map((h) => '<button type="button" class="chip chip--sm" data-hint="' + esc(h) + '">' + esc(h) + '</button>').join('') + '</div>' +
      '</div>';
    document.body.appendChild(searchEl);
    const input = $('.search-form__input', searchEl);
    const results = $('.search-results', searchEl);
    const run = () => {
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      const found = P.search(q, 6);
      results.innerHTML = found.length
        ? '<ul class="search-list">' + found.map((p) => {
            const img = P.cover(p);
            return '<li><a class="search-item" href="' + P.url(p) + '"><span class="search-item__img search-item__img--' + img.kind + '"><img src="' + esc(img.thumb) + '" alt=""></span>' +
              '<span class="search-item__text"><span class="search-item__name">' + esc(p.name) + '</span><span class="search-item__price">' + (P.priceRange(p)[0] !== P.priceRange(p)[1] ? 'od ' : '') + money(P.priceRange(p)[0]) + '</span></span>' + icon('chevron-right') + '</a></li>';
          }).join('') + '</ul><a class="search-all" href="sklep.html?q=' + encodeURIComponent(q) + '">Pokaż wszystkie wyniki ' + icon('arrow-right') + '</a>'
        : '<p class="search-empty">Nic nie znaleźliśmy dla „' + esc(q) + '”. Spróbuj innego słowa albo <a href="kontakt.html?temat=indywidualne">zapytaj o własny wzór</a>.</p>';
    };
    input.addEventListener('input', HP.util.debounce(run, 120));
    $$('[data-hint]', searchEl).forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.hint; run(); input.focus(); }));
  }
  function openSearch() {
    if (!searchEl) buildSearch();
    openLayer(searchEl, { focus: '.search-form__input' });
  }

  /* ---------------------------------------------------------------------
     Znajdź patrona (strona główna, 404)
     --------------------------------------------------------------------- */
  function patronResultHTML(name) {
    const clean = name.trim();
    if (!clean) return '';
    const s = P.findSaintByName(clean);
    if (!s) {
      return '<div class="patron-miss">' +
        '<p class="patron-miss__title">' + icon('lightbulb') + 'Nie mamy jeszcze patrona dla imienia „' + esc(clean) + '”</p>' +
        '<p>Napisz do nas – sprawdzimy, czy możemy przygotować obrazek z Twoim świętym patronem.</p>' +
        '<a class="btn btn--ghost btn--sm" href="kontakt.html?temat=indywidualne&imie=' + encodeURIComponent(clean) + '">Zapytaj o własny wzór</a>' +
      '</div>';
    }
    const items = P.bySaint(s.id);
    return '<div class="patron-card">' +
      '<div class="patron-card__avatar"><img src="' + esc(s.avatar) + '" alt="" width="180" height="180"></div>' +
      '<div class="patron-card__body">' +
        '<p class="eyebrow">' + icon('halo') + 'Patron imienia ' + esc(clean.charAt(0).toUpperCase() + clean.slice(1)) + '</p>' +
        '<h3 class="patron-card__name">' + esc(s.name) + '</h3>' +
        '<p class="patron-card__feast">' + icon('calendar') + 'Imieniny: <strong>' + esc(s.feast) + '</strong></p>' +
        '<p class="patron-card__about">' + esc(s.about) + '</p>' +
        (items.length ? '<div class="patron-card__items">' + items.map((p) => {
          const img = P.cover(p);
          return '<a class="mini-product" href="' + P.url(p) + '"><span class="mini-product__img mini-product__img--' + img.kind + '"><img src="' + esc(img.thumb) + '" alt="" loading="lazy"></span><span class="mini-product__name">' + esc(P.category(p.category).singular) + (p.title !== s.name ? ': ' + esc(p.title) : '') + '</span><span class="mini-product__price">' + (P.priceRange(p)[0] !== P.priceRange(p)[1] ? 'od ' : '') + money(P.priceRange(p)[0]) + '</span></a>';
        }).join('') + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  function initPatronFinder(form) {
    if (!form) return;
    const input = $('input', form);
    const out = $('.finder__result', form);
    const show = () => {
      out.innerHTML = patronResultHTML(input.value);
      const card = out.firstElementChild;
      if (card && !reducedMotion()) { card.classList.add('pop-in'); }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); show(); });
    $$('[data-name]', form).forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.name; show(); }));
  }

  /* ---------------------------------------------------------------------
     Pojawianie się elementów przy przewijaniu + iskierki
     --------------------------------------------------------------------- */
  let revealObserver;
  function observeReveal(root) {
    const els = $$('.reveal:not(.is-in)', root || document);
    if (!('IntersectionObserver' in window) || reducedMotion()) { els.forEach((el) => el.classList.add('is-in')); return; }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i % 4) * 70 + 'ms');
      revealObserver.observe(el);
    });
  }

  function sparkles(root) {
    $$('[data-sparkles]', root || document).forEach((host) => {
      if (host.dataset.sparkled) return;
      host.dataset.sparkled = '1';
      const n = parseInt(host.dataset.sparkles, 10) || 8;
      // opcjonalny zakres poziomy w %, np. data-sparkles-x="55-98"
      const [x0, x1] = (host.dataset.sparklesX || '4-96').split('-').map(Number);
      let seed = n * 9301 + 49297;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'sparkle' + (rnd() > 0.6 ? ' sparkle--lg' : '');
        s.setAttribute('aria-hidden', 'true');
        s.style.left = (x0 + rnd() * (x1 - x0)).toFixed(1) + '%';
        s.style.top = (6 + rnd() * 86).toFixed(1) + '%';
        s.style.animationDelay = (rnd() * 4).toFixed(2) + 's';
        s.style.animationDuration = (2.6 + rnd() * 2.6).toFixed(2) + 's';
        host.appendChild(s);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Zdarzenia globalne
     --------------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const addBtn = t.closest('[data-add]');
    if (addBtn) {
      e.preventDefault();
      const card = addBtn.closest('.pcard');
      addToCart(addBtn.dataset.add, addBtn.dataset.variant || null, 1, { img: card ? $('.pcard__img', card) : null });
      return;
    }
    const cartOpen = t.closest('[data-cart-open]');
    if (cartOpen && document.body.dataset.page !== 'cart') {
      e.preventDefault();
      const tst = cartOpen.closest('.toast');
      if (tst) tst.remove();
      openCart();
      return;
    }
    if (t.closest('[data-search-open]')) { e.preventDefault(); openSearch(); return; }
    if (t.closest('[data-menu-open]')) {
      const m = $('#mobile-nav');
      if (m) { openLayer(m); $('[data-menu-open]').setAttribute('aria-expanded', 'true'); }
      return;
    }
    const close = t.closest('[data-close]');
    if (close) {
      const layer = close.closest('.drawer, .mobile-nav, .search-overlay, .modal');
      if (layer) {
        closeLayer(layer);
        if (layer.id === 'mobile-nav') { const b = $('[data-menu-open]'); if (b) b.setAttribute('aria-expanded', 'false'); }
      }
      return;
    }
    // zmiana ilości w koszyku
    const line = t.closest('.line[data-key]');
    if (line) {
      const key = line.dataset.key;
      const input = $('input', line);
      if (t.closest('[data-qty-dec]')) HP.cart.setQty(key, (parseInt(input.value, 10) || 1) - 1);
      else if (t.closest('[data-qty-inc]')) HP.cart.setQty(key, (parseInt(input.value, 10) || 1) + 1);
      else if (t.closest('[data-remove]')) {
        line.classList.add('is-removing');
        setTimeout(() => HP.cart.remove(key), reducedMotion() ? 0 : 220);
      }
    }
  });

  document.addEventListener('change', (e) => {
    const input = e.target.closest('.line[data-key] input[type="number"]');
    if (input) HP.cart.setQty(input.closest('.line').dataset.key, input.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]') && !layers.length) {
      e.preventDefault();
      openSearch();
    }
  });

  HP.cart.subscribe((cart, change) => {
    updateCartCount(false);
    if (drawer && !drawer.hidden) {
      // zachowaj fokus na polu ilości po przerysowaniu
      const active = document.activeElement;
      const key = active && active.closest('.line') ? active.closest('.line').dataset.key : null;
      renderDrawer();
      if (key) {
        const el = $('.line[data-key="' + CSS.escape(key) + '"] ' + (active.matches('input') ? 'input' : active.matches('[data-qty-inc]') ? '[data-qty-inc]' : '[data-qty-dec]'), drawer);
        if (el) el.focus();
      }
    }
  });

  /* ---------------------------------------------------------------------
     Start
     --------------------------------------------------------------------- */
  HP.ui = {
    icon, toast, openCart, openSearch, openLayer, closeLayer, productCard, priceHTML, lineHTML,
    freeShippingHTML, bulkHintHTML, emptyCartHTML, addToCart, flyToCart, observeReveal, sparkles,
    fillConfig, fillDynamic, hydrateIcons, bulkTiersText, initPatronFinder, patronResultHTML, updateCartCount
  };

  HP.onReady(() => {
    document.documentElement.classList.add('js');
    renderHeader();
    renderFooter();
    hydrateIcons();
    fillConfig();
    fillDynamic();
    updateCartCount(false);
    sparkles();
    observeReveal();
    $$('[data-finder]').forEach(initPatronFinder);
    if (location.hash === '#koszyk') openCart();
  });
})();
