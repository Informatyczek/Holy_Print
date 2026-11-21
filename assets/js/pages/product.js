/* Karta produktu – galeria, warianty, dodawanie do koszyka */
(function () {
  'use strict';
  const HP = window.HP;
  const CFG = HP.cfg;
  const { $, $$, esc, money, reducedMotion } = HP.util;
  const P = HP.products;
  const icon = (n, c) => HP.icon(n, c);

  let product, vid, images = [], idx = 0, lightbox;

  /* ---------- Galeria ---------- */
  function galleryHTML() {
    return '<div class="gallery">' +
      '<div class="stage" id="stage" tabindex="0" role="region" aria-label="Galeria zdjęć – strzałki zmieniają zdjęcie">' +
        '<span class="stage__rays" aria-hidden="true"></span>' +
        '<img class="stage__img" id="stage-img" alt="">' +
        '<span class="stage__sheen" aria-hidden="true"></span>' +
        '<button class="icon-btn stage__nav stage__nav--prev" type="button" data-step="-1" aria-label="Poprzednie zdjęcie">' + icon('chevron-left') + '</button>' +
        '<button class="icon-btn stage__nav stage__nav--next" type="button" data-step="1" aria-label="Następne zdjęcie">' + icon('chevron-right') + '</button>' +
        '<button class="icon-btn stage__zoom" type="button" data-zoom aria-label="Powiększ zdjęcie">' + icon('zoom-in') + '</button>' +
      '</div>' +
      '<div class="thumbs" id="thumbs"></div>' +
    '</div>';
  }

  function renderGallery() {
    images = P.images(product, vid);
    if (idx >= images.length) idx = 0;
    const thumbs = $('#thumbs');
    thumbs.innerHTML = images.length > 1 ? images.map((im, i) =>
      '<button class="thumb thumb--' + im.kind + '" type="button" data-thumb="' + i + '" aria-label="Zdjęcie ' + (i + 1) + ' z ' + images.length + '"' + (i === idx ? ' aria-current="true"' : '') + '>' +
        '<img src="' + esc(im.thumb) + '" alt="" loading="lazy"></button>').join('') : '';
    $$('.stage__nav').forEach((b) => { b.hidden = images.length < 2; });
    showImage(idx, true);
  }

  function showImage(i, instant) {
    if (!images.length) return;
    idx = (i + images.length) % images.length;
    const im = images[idx];
    const stage = $('#stage');
    const img = $('#stage-img');
    const apply = () => {
      stage.classList.toggle('stage--cutout', im.kind !== 'photo');
      stage.classList.toggle('stage--photo', im.kind === 'photo');
      img.src = im.full;
      img.alt = im.alt || product.name;
      img.style.opacity = 1;
    };
    if (instant || reducedMotion()) apply();
    else { img.style.opacity = 0; setTimeout(apply, 150); }
    $$('[data-thumb]').forEach((t) => t.setAttribute('aria-current', String(+t.dataset.thumb === idx)));
  }

  function bindGallery() {
    const stage = $('#stage');
    stage.addEventListener('click', (e) => {
      const step = e.target.closest('[data-step]');
      if (step) { e.stopPropagation(); showImage(idx + +step.dataset.step); return; }
      openLightbox();
    });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); showImage(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showImage(idx - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(); }
    });
    $('#thumbs').addEventListener('click', (e) => {
      const t = e.target.closest('[data-thumb]');
      if (t) showImage(+t.dataset.thumb);
    });
    // przesuwanie palcem
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { showImage(idx + (dx < 0 ? 1 : -1)); stage.dataset.swiped = '1'; setTimeout(() => delete stage.dataset.swiped, 50); }
    });
    stage.addEventListener('click', (e) => { if (stage.dataset.swiped) e.stopImmediatePropagation(); }, true);
    // pochylenie 3D obrazka za kursorem
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion()) {
      stage.addEventListener('pointermove', (e) => {
        if (!stage.classList.contains('stage--cutout')) return;
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--ry', (px * 14).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
        stage.style.setProperty('--sx', ((px + 0.5) * 100).toFixed(1) + '%');
        stage.style.setProperty('--sy', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      stage.addEventListener('pointerleave', () => { stage.style.setProperty('--rx', '0deg'); stage.style.setProperty('--ry', '0deg'); });
    }
  }

  function openLightbox() {
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'modal lightbox';
      lightbox.hidden = true;
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Powiększone zdjęcie');
      lightbox.innerHTML =
        '<img class="lightbox__img" alt="">' +
        '<button class="icon-btn lightbox__close" type="button" data-close aria-label="Zamknij">' + icon('close') + '</button>' +
        '<button class="icon-btn lightbox__prev" type="button" data-lb="-1" aria-label="Poprzednie zdjęcie">' + icon('chevron-left') + '</button>' +
        '<button class="icon-btn lightbox__next" type="button" data-lb="1" aria-label="Następne zdjęcie">' + icon('chevron-right') + '</button>' +
        '<p class="lightbox__count" aria-live="polite"></p>';
      document.body.appendChild(lightbox);
      lightbox.addEventListener('click', (e) => {
        const b = e.target.closest('[data-lb]');
        if (b) { showImage(idx + +b.dataset.lb, true); syncLightbox(); return; }
        if (e.target === lightbox) HP.ui.closeLayer(lightbox);
      });
      lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { showImage(idx + 1, true); syncLightbox(); }
        if (e.key === 'ArrowLeft') { showImage(idx - 1, true); syncLightbox(); }
      });
    }
    syncLightbox();
    HP.ui.openLayer(lightbox, { focus: '.lightbox__close' });
  }
  function syncLightbox() {
    if (!lightbox) return;
    const im = images[idx];
    const img = $('.lightbox__img', lightbox);
    img.src = im.full; img.alt = im.alt || product.name;
    $('.lightbox__count', lightbox).textContent = images.length > 1 ? (idx + 1) + ' / ' + images.length : '';
    $$('[data-lb]', lightbox).forEach((b) => { b.hidden = images.length < 2; });
  }

  /* ---------- Informacje i zakup ---------- */
  function variantsHTML() {
    const vs = P.variants(product);
    if (vs.length < 2) {
      const v = vs[0];
      return v ? '<p class="muted small" style="font-weight:700">' + icon('credit-card') + ' ' + esc(P.variantName(v)) + (P.variantDetail(v) ? ' · ' + esc(P.variantDetail(v)) : '') + '</p>' : '';
    }
    return '<fieldset class="variants"><legend>Wybierz format</legend>' + vs.map((v) => {
      const cover = P.cover(product, v.id);
      return '<label class="variant"><input type="radio" name="wariant" value="' + esc(v.id) + '"' + (v.id === vid ? ' checked' : '') + '>' +
        '<span class="variant__box"><span class="variant__img"><img src="' + esc(cover.thumb) + '" alt="" loading="lazy"></span>' +
        '<span><span class="variant__name">' + esc(P.variantName(v)) + '</span><br><span class="variant__detail">' + esc(P.variantDetail(v)) + '</span></span>' +
        '<span class="variant__price">' + money(v.price != null ? v.price : product.price) + '</span></span></label>';
    }).join('') + '</fieldset>';
  }

  function priceBlockHTML() {
    const price = P.price(product, vid);
    let h = '<div class="buy__price"><p class="price"><span class="price__now" id="price-now">' + money(price) + '</span>';
    if (product.oldPrice && product.oldPrice > price) h += '<s class="price__old">' + money(product.oldPrice) + '</s>';
    h += '</p><span class="buy__price-note">cena brutto</span></div>';
    if (product.oldPrice && product.lowestPrice30) h += '<p class="omnibus">Najniższa cena z 30 dni przed obniżką: ' + money(product.lowestPrice30) + '</p>';
    if (product.bundleValue && product.bundleValue > product.price) h += '<p class="bundle-note">' + icon('percent') + 'Kupując osobno zapłacisz ' + money(product.bundleValue) + ' – oszczędzasz ' + money(product.bundleValue - product.price) + '</p>';
    return h;
  }

  function infoHTML() {
    const ship = HP.pricing.cheapestShipping();
    const free = HP.pricing.freeFrom();
    const b = CFG.promotions && CFG.promotions.bulk;
    const bulkOn = b && b.enabled && (b.categories || []).includes(product.category);
    const days = (CFG.legal && CFG.legal.returnDays) || 14;
    return '<ul class="buy__info">' +
      '<li>' + icon('truck') + '<span><strong>Wysyłka w ' + esc((CFG.shop && CFG.shop.processingTime) || '1–3 dni robocze') + '</strong><br>' +
        (ship != null ? 'Paczkomat InPost od ' + money(ship) : 'Dostawa wg cennika') + (free ? ' · darmowa dostawa od ' + money(free) : '') + '</span></li>' +
      (bulkOn ? '<li>' + icon('percent') + '<span><strong>' + esc(b.label || 'Rabat ilościowy') + '</strong> na obrazki (wzory można łączyć):<span class="tiers">' + b.tiers.map((t) => '<span>od ' + t.min + ' szt. −' + t.percent + '%</span>').join('') + '</span></span></li>' : '') +
      '<li>' + icon('reload') + '<span><strong>' + days + ' dni na zwrot</strong> bez podawania przyczyny</span></li>' +
      '<li>' + icon('gift') + '<span><strong>Gotowe na prezent</strong> – starannie zapakowane</span></li>' +
    '</ul>';
  }

  function specsRows() {
    const cat = P.category(product.category);
    const v = P.variant(product, vid);
    const rows = Object.assign({}, (cat && cat.specs) || {});
    if (v) {
      const f = P.format(v.format);
      if (f) rows['Format'] = f.name + (f.size ? ' (' + f.size + ')' : '');
      if (f && f.note) rows['Zastosowanie'] = f.note;
      if (v.caption) rows['Podpis na karcie'] = v.caption.replace(/^podpis\s*/i, '');
    }
    Object.assign(rows, product.specs || {});
    return Object.keys(rows).map((k) => '<tr><th scope="row">' + esc(k) + '</th><td>' + esc(rows[k]) + '</td></tr>').join('');
  }

  function accHTML() {
    const s = P.saint(product.saint);
    const methods = HP.pricing.shippingMethods();
    const free = HP.pricing.freeFrom();
    let includes = '';
    if (Array.isArray(product.includes) && product.includes.length) {
      includes = '<div class="patron-card__items" style="margin-top:6px">' + product.includes.map((id) => {
        const x = P.get(id); if (!x) return '';
        const im = P.cover(x, 'kompaktowy');
        return '<a class="mini-product" href="' + P.url(x) + '"><span class="mini-product__img"><img src="' + esc(im.thumb) + '" alt="" loading="lazy"></span><span class="mini-product__name">' + esc(x.title) + '</span><span class="mini-product__price">' + icon('chevron-right') + '</span></a>';
      }).join('') + '</div>';
    }
    return '<div class="acc">' +
      '<details open><summary>Opis' + icon('chevron-down') + '</summary><div class="acc__body">' + (product.description || []).map((t) => '<p>' + esc(t) + '</p>').join('') + includes + '</div></details>' +
      (s ? '<details><summary>O patronie' + icon('chevron-down') + '</summary><div class="acc__body"><div class="saint-box"><img src="' + esc(s.avatar) + '" alt="" width="64" height="64" loading="lazy"><div><p><strong>' + esc(s.name) + '</strong> · wspomnienie ' + esc(s.feast) + '</p><p>' + esc(s.about) + '</p>' + (s.quote ? '<blockquote>„' + esc(s.quote) + '”</blockquote>' : '') + '</div></div></div></details>' : '') +
      '<details><summary>Specyfikacja' + icon('chevron-down') + '</summary><div class="acc__body"><table class="specs" id="specs">' + specsRows() + '</table></div></details>' +
      '<details><summary>Dostawa i zwroty' + icon('chevron-down') + '</summary><div class="acc__body"><table class="specs">' +
        methods.map((m) => '<tr><th scope="row">' + esc(m.label) + '</th><td>' + (m.price ? money(m.price) : 'bezpłatnie') + (m.eta ? ' · ' + esc(m.eta) : '') + '</td></tr>').join('') +
      '</table>' + (free ? '<p>Darmowa dostawa przy zamówieniu od <strong>' + money(free) + '</strong>.</p>' : '') +
      '<p>Masz ' + ((CFG.legal && CFG.legal.returnDays) || 14) + ' dni na odstąpienie od umowy. <a href="zwroty-i-reklamacje.html">Zasady zwrotów i reklamacji</a></p></div></details>' +
    '</div>';
  }

  function render() {
    const cat = P.category(product.category);
    const s = P.saint(product.saint);
    const root = $('#product-root');
    root.innerHTML = '<div class="product__layout">' + galleryHTML() +
      '<div class="buy">' +
        '<div class="buy__meta"><span class="badge badge--gold">' + esc(cat ? cat.singular : '') + '</span>' +
          (s ? '<span class="feast-chip">' + icon('calendar') + 'Imieniny: ' + esc(s.feast) + '</span>' : '') + '</div>' +
        '<h1 class="buy__title">' + esc(product.title || product.name) + '</h1>' +
        '<div id="price-block">' + priceBlockHTML() + '</div>' +
        '<p class="buy__short">' + esc(product.short || '') + '</p>' +
        '<div id="variants">' + variantsHTML() + '</div>' +
        '<div class="buy__actions">' +
          '<div class="qty" id="qty"><button type="button" data-q="-1" aria-label="Zmniejsz ilość">' + icon('minus') + '</button><input type="number" id="qty-input" inputmode="numeric" min="1" max="99" value="1" aria-label="Ilość"><button type="button" data-q="1" aria-label="Zwiększ ilość">' + icon('plus') + '</button></div>' +
          '<button class="btn btn--primary btn--lg" type="button" id="add-btn">' + icon('cart') + 'Dodaj do koszyka</button>' +
        '</div>' +
        infoHTML() +
        accHTML() +
      '</div>' +
    '</div>';

    $('#crumbs').insertAdjacentHTML('beforeend',
      (cat ? '<li><a href="sklep.html?kategoria=' + encodeURIComponent(cat.id) + '">' + esc(cat.name) + '</a></li>' : '') +
      '<li aria-current="page">' + esc(product.title || product.name) + '</li>');

    bindGallery();
    renderGallery();

    root.addEventListener('change', (e) => {
      if (e.target.name === 'wariant') setVariant(e.target.value);
    });
    $('#qty').addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      const inp = $('#qty-input');
      inp.value = Math.max(1, Math.min(99, (parseInt(inp.value, 10) || 1) + +b.dataset.q));
    });
    $('#qty-input').addEventListener('change', (e) => { e.target.value = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)); });
    $('#add-btn').addEventListener('click', addToCart);
  }

  function setVariant(id) {
    vid = id;
    idx = 0;
    $('#price-block').innerHTML = priceBlockHTML();
    $('#specs').innerHTML = specsRows();
    renderGallery();
    renderSticky();
    const prm = HP.util.params();
    prm.set('wariant', id);
    history.replaceState(null, '', 'produkt.html?' + prm.toString());
    updateJsonLd();
  }

  function addToCart() {
    const qty = Math.max(1, Math.min(99, parseInt($('#qty-input').value, 10) || 1));
    const stage = $('#stage');
    const img = stage.classList.contains('stage--cutout') ? $('#stage-img') : null;
    HP.ui.addToCart(product.id, vid, qty, { img, openDrawer: true });
  }

  /* ---------- Pasek zakupu na telefonie ---------- */
  function renderSticky() {
    const bar = $('#sticky-buy');
    const cover = P.cover(product, vid);
    bar.innerHTML = '<img class="sticky-buy__img" src="' + esc(cover.thumb) + '" alt="">' +
      '<div class="sticky-buy__text"><span class="sticky-buy__name">' + esc(product.title || product.name) + '</span><span class="sticky-buy__price">' + money(P.price(product, vid)) + '</span></div>' +
      '<button class="btn btn--primary btn--sm" type="button" data-sticky-add>' + icon('cart') + 'Dodaj</button>';
  }
  function bindSticky() {
    const bar = $('#sticky-buy');
    bar.addEventListener('click', (e) => { if (e.target.closest('[data-sticky-add]')) addToCart(); });
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([en]) => {
      const show = !en.isIntersecting && en.boundingClientRect.top < 0;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
    });
    io.observe($('#add-btn'));
  }

  /* ---------- Podobne produkty ---------- */
  function renderRelated() {
    const same = P.all().filter((p) => p.id !== product.id && product.saint && p.saint === product.saint);
    const cat = P.all().filter((p) => p.id !== product.id && p.category === product.category && !same.includes(p));
    const rest = P.all().filter((p) => p.id !== product.id && !same.includes(p) && !cat.includes(p));
    const list = same.concat(cat, rest).slice(0, 4);
    if (!list.length) return;
    $('#related').innerHTML = list.map((p) => HP.ui.productCard(p)).join('');
    $('#related-section').hidden = false;
    HP.ui.observeReveal($('#related'));
  }

  /* ---------- Dane dla Google (schema.org) ---------- */
  function updateJsonLd() {
    const base = ((CFG.shop && CFG.shop.url) || location.origin + location.pathname.replace(/[^/]*$/, '')).replace(/\/?$/, '/');
    const abs = (u) => (/^https?:/.test(u) ? u : base + u);
    const vs = P.variants(product);
    const offer = (price) => ({ '@type': 'Offer', priceCurrency: 'PLN', price: price.toFixed(2), availability: 'https://schema.org/InStock', url: abs(P.url(product, vid)) });
    const [lo, hi] = P.priceRange(product);
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.short,
      sku: product.id,
      brand: { '@type': 'Brand', name: 'Holy Print' },
      image: P.images(product, vid).map((i) => abs(i.full)),
      offers: vs.length > 1 && lo !== hi
        ? { '@type': 'AggregateOffer', priceCurrency: 'PLN', lowPrice: lo.toFixed(2), highPrice: hi.toFixed(2), offerCount: vs.length, availability: 'https://schema.org/InStock' }
        : offer(P.price(product, vid))
    };
    let tag = $('#jsonld-product');
    if (!tag) { tag = document.createElement('script'); tag.type = 'application/ld+json'; tag.id = 'jsonld-product'; document.head.appendChild(tag); }
    tag.textContent = JSON.stringify(data);
  }

  function notFound() {
    $('#product-root').innerHTML = '<div class="not-found-product"><img src="assets/img/aureola.svg" alt="" width="160"><h1 class="h2">Nie znaleźliśmy tego produktu</h1><p class="muted">Być może został usunięty albo link jest niepełny.</p><a class="btn btn--primary" href="sklep.html">Przejdź do sklepu</a></div>';
    document.title = 'Nie znaleziono produktu | Holy Print';
  }

  HP.onReady(() => {
    const prm = HP.util.params();
    product = P.get(prm.get('id'));
    if (!product) { notFound(); return; }
    const v = P.variant(product, prm.get('wariant'));
    vid = v ? v.id : null;
    document.title = product.name + ' | Holy Print';
    const md = $('meta[name="description"]');
    if (md && product.short) md.setAttribute('content', product.short);
    render();
    renderSticky();
    bindSticky();
    renderRelated();
    updateJsonLd();
  });
})();
