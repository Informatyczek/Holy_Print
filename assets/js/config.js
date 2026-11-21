/* =========================================================================
   HOLY PRINT – USTAWIENIA SKLEPU
   -------------------------------------------------------------------------
   To jest główny plik do edycji. Zmieniasz tu dane sprzedawcy, kontakt,
   ceny dostawy, metody płatności i sposób, w jaki zamówienia do Ciebie
   trafiają. Po zapisaniu pliku wystarczy odświeżyć stronę.

   ⚠ Pola w nawiasach kwadratowych [ ... ] trzeba uzupełnić przed startem.
   Szczegółowa instrukcja: plik README.md w głównym folderze sklepu.
   ========================================================================= */
window.HP_CONFIG = {

  /* ---------- Podstawowe informacje ---------- */
  shop: {
    name: 'Holy Print',
    tagline: 'Wiara w każdym pikselu',
    // Adres strony po publikacji (bez ukośnika na końcu), np. 'https://holyprint.pl'.
    // Używany w linkach do płatności i w danych dla Google.
    url: '',
    currency: 'PLN',
    // Ile zajmuje przygotowanie paczki (pokazywane przy produktach i w koszyku)
    processingTime: '1–3 dni robocze',
    pricesNote: 'Wszystkie ceny są cenami brutto.'
  },

  /* ---------- Kontakt (stopka, strona Kontakt, potwierdzenia) ---------- */
  contact: {
    email: 'kontakt@twoja-domena.pl',      // [wpisz prawdziwy adres e-mail]
    phone: '+48 000 000 000',              // [wpisz numer telefonu] – zostaw puste, żeby ukryć
    hours: 'pon.–pt. 9:00–17:00',
    social: {
      // Wklej pełne adresy profili – puste pola nie pojawią się na stronie
      instagram: '',
      facebook: '',
      tiktok: ''
    }
  },

  /* ---------- Dane sprzedawcy (wymagane prawem – regulamin, stopka) ----------
     Działalność nierejestrowana? Wpisz imię i nazwisko oraz adres,
     a pola NIP i REGON zostaw puste. */
  seller: {
    legalName: '[Imię i nazwisko lub nazwa firmy]',
    address: '[ulica i numer], [kod pocztowy] [miejscowość]',
    nip: '',
    regon: '',
    // Dane do przelewu tradycyjnego
    bankAccount: '[00 0000 0000 0000 0000 0000 0000]',
    bankName: '[nazwa banku]'
  },

  /* ---------- Pasek ogłoszeń na górze strony ---------- */
  announcements: [
    'Darmowa dostawa od 150 zł',
    'Wysyłka w 1–3 dni robocze',
    'Pixelowe obrazki świętych – pomysł na prezent',
    'Paczkomaty InPost 24/7'
  ],

  /* ---------- Promocje ----------
     Rabat ilościowy na obrazki – przydatny dla katechetów i klas komunijnych.
     Liczy się łączna liczba sztuk z podanych kategorii (dowolne wzory). */
  promotions: {
    bulk: {
      enabled: true,
      categories: ['obrazki'],
      label: 'Rabat ilościowy',
      tiers: [
        { min: 10, percent: 10 },
        { min: 25, percent: 15 }
      ]
    }
  },

  /* ---------- Dostawa ---------- */
  shipping: {
    // Darmowa dostawa od tej kwoty (po rabatach). 0 = wyłączone.
    freeFrom: 150,
    methods: [
      {
        id: 'inpost_paczkomat',
        enabled: true,
        type: 'paczkomat',              // 'paczkomat' | 'adres' | 'odbior'
        label: 'Paczkomat InPost 24/7',
        description: 'Odbiór w wybranym Paczkomacie lub PaczkoPunkcie',
        price: 13.99,
        eta: '1–2 dni robocze'
      },
      {
        id: 'inpost_kurier',
        enabled: true,
        type: 'adres',
        label: 'Kurier InPost',
        description: 'Dostawa pod wskazany adres',
        price: 16.99,
        eta: '1–2 dni robocze'
      },
      {
        id: 'list_polecony',
        enabled: false,                 // zmień na true, żeby włączyć
        type: 'adres',
        label: 'List polecony (Poczta Polska)',
        description: 'Ekonomiczna opcja dla samych obrazków',
        price: 9.9,
        eta: '2–4 dni robocze'
      },
      {
        id: 'odbior_osobisty',
        enabled: false,                 // zmień na true, żeby włączyć
        type: 'odbior',
        label: 'Odbiór osobisty',
        description: 'Miejsce i godzinę odbioru ustalimy mailowo',
        price: 0,
        eta: 'po potwierdzeniu'
      }
    ],

    /* Mapa Paczkomatów (InPost Geowidget v5).
       Bez tokenu klient wpisuje kod Paczkomatu ręcznie (działa od razu).
       Z tokenem pojawi się interaktywna mapa wyboru punktu.
       Token: Manager Paczek InPost > Moje konto > API > Geowidget (token PUBLICZNY). */
    inpost: {
      geowidgetToken: '',
      config: 'parcelCollect',          // parcelCollect = paczki opłacone z góry
      language: 'pl'
    }
  },

  /* ---------- Płatności ----------
     provider 'przelew', 'blik_telefon', 'pobranie' działają od razu (bez integracji).
     provider 'przelewy24', 'payu', 'tpay', 'stripe' wymagają backendu (patrz INTEGRACJE.md). */
  payments: {
    // Pokazuj wyłączone płatności online jako "wkrótce" (false = całkiem je ukryj)
    showComingSoon: true,
    // Ile dni klient ma na opłacenie zamówienia przelewem
    payWithinDays: 3,
    // Numer telefonu do przelewów BLIK
    blikPhone: '+48 000 000 000',
    methods: [
      {
        id: 'przelew',
        enabled: true,
        provider: 'przelew',
        label: 'Przelew tradycyjny',
        description: 'Dane do przelewu pokażemy zaraz po złożeniu zamówienia',
        fee: 0
      },
      {
        id: 'blik_telefon',
        enabled: true,
        provider: 'blik_telefon',
        label: 'BLIK na telefon',
        description: 'Szybki przelew BLIK na nasz numer telefonu',
        fee: 0
      },
      {
        id: 'pobranie',
        enabled: false,
        provider: 'pobranie',
        label: 'Za pobraniem',
        description: 'Płatność przy odbiorze przesyłki',
        fee: 5,
        onlyFor: ['inpost_kurier']      // dostępne tylko dla tych metod dostawy
      },
      {
        id: 'online',
        enabled: false,                 // włącz po podłączeniu bramki płatności
        provider: 'przelewy24',         // lub 'payu', 'tpay', 'stripe'
        label: 'Płatność online',
        description: 'BLIK, szybki przelew lub karta',
        fee: 0
      }
    ]
  },

  /* ---------- Przyjmowanie zamówień ----------
     mode:
       'demo'      – TYLKO DO TESTÓW: zamówienie zapisuje się w przeglądarce, nic nie jest wysyłane
       'web3forms' – zamówienia i wiadomości przychodzą e-mailem (darmowy klucz: https://web3forms.com)
       'formspree' – jak wyżej, przez https://formspree.io (wpisz identyfikator formularza)
       'api'       – własny serwer (POST na adres api.baseUrl + /orders), patrz INTEGRACJE.md */
  orders: {
    mode: 'demo',
    web3formsKey: '',
    formspreeId: '',
    numberPrefix: 'HP'
  },

  /* ---------- Własny backend (opcjonalnie) ----------
     Potrzebny do płatności online i automatycznego nadawania przesyłek. */
  api: {
    baseUrl: ''
  },

  /* ---------- Prawo konsumenckie ---------- */
  legal: {
    returnDays: 14,          // ustawowe 14 dni na odstąpienie od umowy (można wydłużyć)
    complaintDays: 14,       // termin odpowiedzi na reklamację
    termsUpdated: '21.11.2026'
  }
};
