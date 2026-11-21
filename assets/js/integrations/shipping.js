/* =========================================================================
   HOLY PRINT – DOSTAWA: PACZKOMATY INPOST
   -------------------------------------------------------------------------
   Działa w dwóch trybach:
   1) Bez tokenu (domyślnie) – klient wpisuje kod Paczkomatu ręcznie
      i może go znaleźć na mapie inpost.pl. Działa od razu.
   2) Z tokenem Geowidget v5 – w kasie pojawia się interaktywna mapa.
      Wystarczy wkleić PUBLICZNY token do config.js:
        shipping.inpost.geowidgetToken
      (Manager Paczek InPost → Moje konto → API → Geowidget).
   Dokumentacja InPost: https://geowidget.inpost.pl/docs/
   ========================================================================= */
(function () {
  'use strict';
  const HP = window.HP;
  const { $, esc } = HP.util;
  const cfg = () => (HP.cfg.shipping && HP.cfg.shipping.inpost) || {};

  const GEOWIDGET_CSS = 'https://geowidget.inpost.pl/inpost-geowidget.css';
  const GEOWIDGET_JS = 'https://geowidget.inpost.pl/inpost-geowidget.js';
  const POINT_EVENT = 'hp-inpost-point';
  let loading = null;

  function loadGeowidget() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      if (!document.querySelector('link[href="' + GEOWIDGET_CSS + '"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = GEOWIDGET_CSS;
        document.head.appendChild(link);
      }
      const s = document.createElement('script');
      s.src = GEOWIDGET_JS;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { loading = null; reject(new Error('Nie udało się wczytać mapy Paczkomatów.')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  /** Zamienia obiekt punktu z Geowidgetu na prosty format sklepu */
  function mapPoint(pt) {
    if (!pt) return null;
    const a = pt.address || {};
    return {
      code: String(pt.name || '').toUpperCase(),
      line1: a.line1 || '',
      line2: a.line2 || '',
      description: pt.location_description || ''
    };
  }

  /** Otwiera okno z mapą. onSelect({code, line1, line2, description}) */
  function openMap(onSelect) {
    const token = cfg().geowidgetToken;
    if (!token) return false;
    let modal = $('#inpost-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal modal--map';
      modal.id = 'inpost-modal';
      modal.hidden = true;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Wybierz Paczkomat InPost');
      modal.innerHTML =
        '<div class="modal__backdrop" data-close></div>' +
        '<div class="modal__panel">' +
          '<header class="modal__head"><h2 class="modal__title">Wybierz Paczkomat</h2>' +
          '<button class="icon-btn" type="button" aria-label="Zamknij mapę" data-close>' + HP.icon('close') + '</button></header>' +
          '<div class="modal__body map-host"><p class="map-loading">Wczytywanie mapy…</p></div>' +
        '</div>';
      document.body.appendChild(modal);
    }
    const host = $('.map-host', modal);
    HP.ui.openLayer(modal);

    loadGeowidget().then(() => {
      if (!$('inpost-geowidget', host)) {
        host.innerHTML = '<inpost-geowidget onpoint="' + POINT_EVENT + '" token="' + esc(token) + '" language="' + esc(cfg().language || 'pl') + '" config="' + esc(cfg().config || 'parcelCollect') + '"></inpost-geowidget>';
        const gw = $('inpost-geowidget', host);
        // Esc wewnątrz mapy (iframe) – zamknięcie okna
        gw.addEventListener('inpost.geowidget.escape', () => HP.ui.closeLayer(modal));
      }
    }).catch((err) => {
      host.innerHTML = '<p class="map-error">' + esc(err.message) + ' Wpisz kod Paczkomatu ręcznie.</p>';
    });

    const handler = (ev) => {
      // Dokumentacja InPost podaje event.details; zostawiamy też event.detail
      const pt = mapPoint(ev.details || ev.detail);
      if (pt && pt.code) {
        document.removeEventListener(POINT_EVENT, handler);
        HP.ui.closeLayer(modal);
        onSelect(pt);
      }
    };
    document.addEventListener(POINT_EVENT, handler);
    return true;
  }

  /** Kody Paczkomatów mają postać np. KRA01M, WAW22A, POP-GDA123 */
  function normalizeCode(code) {
    return String(code || '').toUpperCase().replace(/\s+/g, '');
  }
  function isValidCode(code) {
    return /^[A-Z0-9][A-Z0-9-]{3,13}$/.test(normalizeCode(code));
  }

  HP.inpost = {
    hasMap: () => !!cfg().geowidgetToken,
    openMap,
    normalizeCode,
    isValidCode,
    findUrl: 'https://inpost.pl/znajdz-paczkomat'
  };
})();
