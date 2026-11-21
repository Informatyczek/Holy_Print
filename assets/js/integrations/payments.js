/* =========================================================================
   HOLY PRINT – PŁATNOŚCI
   -------------------------------------------------------------------------
   Każda metoda płatności z config.js ma „providera” – moduł poniżej.

   Działające od razu (bez integracji):
     przelew       – po zamówieniu klient widzi dane do przelewu
     blik_telefon  – klient robi przelew BLIK na Twój numer telefonu
     pobranie      – płatność przy odbiorze

   Gotowe miejsca na bramki płatności (wymagają backendu – patrz INTEGRACJE.md):
     przelewy24, payu, tpay, stripe
   Klucze prywatne bramek NIGDY nie mogą trafić do tego pliku – płatność
   musi utworzyć serwer, a strona tylko przekierowuje klienta.
   ========================================================================= */
(function () {
  'use strict';
  const HP = window.HP;
  const CFG = HP.cfg;
  const providers = {};

  function thanksUrl(order) {
    return 'dziekujemy.html?nr=' + encodeURIComponent(order.number);
  }

  /** Wspólna obsługa bramek online: backend tworzy transakcję i zwraca adres płatności. */
  function viaBackend(provider) {
    return {
      online: true,
      async start(order) {
        const base = (CFG.api && CFG.api.baseUrl || '').replace(/\/$/, '');
        if (!base) throw new Error('Płatności online nie są jeszcze skonfigurowane. Wybierz inną metodę płatności.');
        const shopUrl = (CFG.shop && CFG.shop.url) || window.location.origin;
        const res = await fetch(base + '/payments/' + provider, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            orderNumber: order.number,
            amount: Math.round(order.totals.total * 100),   // w groszach
            currency: 'PLN',
            email: order.customer.email,
            description: 'Zamówienie ' + order.number + ' – Holy Print',
            returnUrl: shopUrl.replace(/\/$/, '') + '/' + thanksUrl(order)
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.redirectUrl) throw new Error(data.message || 'Nie udało się rozpocząć płatności. Spróbuj ponownie.');
        return { redirect: data.redirectUrl };
      }
    };
  }

  providers.przelew = {
    online: false,
    async start(order) { return { redirect: thanksUrl(order) }; },
    instructions(order) {
      const s = CFG.seller || {};
      return {
        type: 'transfer',
        title: 'Dane do przelewu',
        rows: [
          ['Odbiorca', s.legalName],
          ['Numer konta', s.bankAccount, true],
          ['Bank', s.bankName],
          ['Tytuł przelewu', order.number, true],
          ['Kwota', HP.util.money(order.totals.total), true]
        ],
        note: 'Prosimy o wpłatę w ciągu ' + ((CFG.payments && CFG.payments.payWithinDays) || 3) + ' dni. Wysyłkę przygotujemy po zaksięgowaniu płatności.'
      };
    }
  };

  providers.blik_telefon = {
    online: false,
    async start(order) { return { redirect: thanksUrl(order) }; },
    instructions(order) {
      return {
        type: 'blik',
        title: 'Przelew BLIK na telefon',
        rows: [
          ['Numer telefonu', (CFG.payments && CFG.payments.blikPhone) || '', true],
          ['Tytuł', order.number, true],
          ['Kwota', HP.util.money(order.totals.total), true]
        ],
        note: 'W aplikacji banku wybierz „Przelew na telefon BLIK”, wpisz numer i kwotę, a w tytule podaj numer zamówienia.'
      };
    }
  };

  providers.pobranie = {
    online: false,
    async start(order) { return { redirect: thanksUrl(order) }; },
    instructions(order) {
      return {
        type: 'cod',
        title: 'Płatność przy odbiorze',
        rows: [['Do zapłaty kurierowi', HP.util.money(order.totals.total), true]],
        note: 'Przygotuj odliczoną kwotę lub kartę – zapłacisz przy odbiorze przesyłki.'
      };
    }
  };

  // Miejsca na bramki płatności online
  providers.przelewy24 = viaBackend('przelewy24');
  providers.payu = viaBackend('payu');
  providers.tpay = viaBackend('tpay');
  providers.stripe = viaBackend('stripe');

  function methodOf(order) {
    return HP.pricing.paymentMethod(order.payment.method) || {};
  }

  HP.payments = {
    /** Dodanie własnego providera: HP.payments.register('moja-bramka', { online, start(order), instructions(order) }) */
    register(id, impl) { providers[id] = impl; },
    provider(id) { return providers[id] || null; },
    /** Uruchamia płatność dla zamówienia. Zwraca { redirect } */
    async start(order) {
      const m = methodOf(order);
      const p = providers[m.provider];
      if (!p) throw new Error('Nieznana metoda płatności: ' + (m.provider || order.payment.method));
      return p.start(order);
    },
    instructions(order) {
      const m = methodOf(order);
      const p = providers[m.provider];
      return p && p.instructions ? p.instructions(order) : null;
    }
  };
})();
