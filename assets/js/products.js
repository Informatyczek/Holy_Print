/* =========================================================================
   HOLY PRINT – BAZA PRODUKTÓW
   -------------------------------------------------------------------------
   Jak dodać nowy produkt?
   1. Wrzuć zdjęcia do folderu assets/img/produkty/
      (najlepiej dwie wielkości: nazwa.webp oraz nazwa-480.webp – miniatura).
   2. Skopiuj jeden z produktów poniżej, zmień id (bez polskich znaków
      i spacji), nazwę, cenę, opis i listę zdjęć.
   3. Zapisz plik i odśwież stronę – produkt pojawi się w sklepie.

   Zdjęcia można podać krótko: 'obrazek-michal-klasyczny'
   (strona sama doda ścieżkę i .webp) albo pełną ścieżką:
   'assets/img/produkty/moje-zdjecie.jpg'.
   Zdjęcia z tłem (np. drewniany stół) mają w nazwie słowo "foto"
   i wypełniają całe pole; pozostałe to wycięte produkty na jasnym tle.
   ========================================================================= */
window.HP_DATA = {

  /* ---------- Kategorie ---------- */
  categories: [
    {
      id: 'obrazki',
      name: 'Obrazki',
      singular: 'Obrazek',
      description: 'Sztywne karty z pixelowymi wizerunkami świętych – do portfela, modlitewnika albo na biurko.',
      specs: {
        'Rodzaj': 'obrazek na sztywnej karcie',
        'Nadruk': 'pełnokolorowy, druk żywiczny',
        'Rogi': 'zaokrąglone'
      }
    },
    {
      id: 'breloki',
      name: 'Breloki',
      singular: 'Brelok',
      description: 'Breloki z ekoskóry z ozdobnym przeszyciem i metalowym kółkiem na klucze.',
      specs: {
        'Rodzaj': 'brelok do kluczy',
        'Materiał': 'ekoskóra z ozdobnym przeszyciem',
        'Zawieszka': 'metalowe kółko na klucze',
        'Nadruk': 'pełnokolorowy, druk żywiczny'
      }
    },
    {
      id: 'zestawy',
      name: 'Zestawy',
      singular: 'Zestaw',
      description: 'Kilka obrazków w jednym zamówieniu – taniej niż osobno.',
      specs: {
        'Rodzaj': 'zestaw obrazków',
        'Nadruk': 'pełnokolorowy, druk żywiczny'
      }
    }
  ],

  /* ---------- Formaty obrazków ----------
     Wymiary podane orientacyjnie – sprawdź i popraw po zmierzeniu. */
  formats: {
    klasyczny: { name: 'Klasyczny', size: 'ok. 8,6 × 5,4 cm', note: 'format karty płatniczej – zmieści się w portfelu' },
    kompaktowy: { name: 'Kompaktowy', size: 'ok. 7,4 × 5,4 cm', note: 'krótszy, poręczny format' }
  },

  /* ---------- Święci (patroni) ----------
     names – imiona, dla których wyszukiwarka „Znajdź patrona” pokaże tego świętego. */
  saints: [
    {
      id: 'michal',
      name: 'Św. Michał Archanioł',
      short: 'Michał Archanioł',
      feast: '29 września',
      names: ['Michał'],
      avatar: 'assets/img/swieci/michal.webp',
      about: 'Wódz niebieskich zastępów i obrońca w walce dobra ze złem. Jego imię po hebrajsku znaczy „Któż jak Bóg?” – po łacinie „Quis ut Deus?”. Właśnie ten napis widnieje na tarczy z naszego obrazka. Uważany jest za opiekuna policjantów, żołnierzy i wszystkich, którzy stają w obronie innych.',
      symbols: 'płonący miecz, tarcza „Quis ut Deus?”, pokonany smok',
      quote: null
    },
    {
      id: 'pio',
      name: 'Św. Ojciec Pio',
      short: 'Ojciec Pio',
      feast: '23 września',
      names: ['Pio'],
      avatar: 'assets/img/swieci/pio.webp',
      about: 'Św. Pio z Pietrelciny (1887–1968) – włoski kapucyn, mistyk i niestrudzony spowiednik, który przez pół wieku nosił stygmaty. Do San Giovanni Rotondo przyjeżdżały do niego tłumy pielgrzymów. Kanonizował go św. Jan Paweł II w 2002 roku.',
      symbols: 'kapucyński habit, różaniec, dłonie ze stygmatami',
      quote: 'Módl się, ufaj i nie martw się.'
    },
    {
      id: 'teresa',
      name: 'Św. Teresa z Lisieux',
      short: 'Teresa z Lisieux',
      feast: '1 października',
      names: ['Teresa', 'Tereska'],
      avatar: 'assets/img/swieci/teresa.webp',
      about: 'Św. Teresa od Dzieciątka Jezus (1873–1897) – francuska karmelitanka, nazywana Małą Tereską. Uczyła „małej drogi”, czyli świętości w zwykłych, codziennych sprawach. Jest doktorem Kościoła i patronką misji. Obiecała, że z nieba „spuści na ziemię deszcz róż” – dlatego przedstawia się ją z różami.',
      symbols: 'róże, karmelitański habit, krzyż',
      quote: null
    },
    {
      id: 'franciszek',
      name: 'Św. Franciszek z Asyżu',
      short: 'Franciszek z Asyżu',
      feast: '4 października',
      names: ['Franciszek', 'Franek'],
      avatar: 'assets/img/swieci/franciszek.webp',
      about: 'Założyciel zakonu franciszkanów (ok. 1182–1226), który wybrał życie w ubóstwie i radości. Kochał całe stworzenie – według tradycji głosił kazania ptakom i oswoił wilka z Gubbio. W 1979 roku św. Jan Paweł II ogłosił go patronem ekologów.',
      symbols: 'brązowy habit, krzyż, zwierzęta i ptaki',
      quote: null
    },
    {
      id: 'klara',
      name: 'Św. Klara z Asyżu',
      short: 'Klara z Asyżu',
      feast: '11 sierpnia',
      names: ['Klara'],
      avatar: 'assets/img/swieci/klara.webp',
      about: 'Duchowa siostra św. Franciszka i założycielka klarysek – zakonu ubogich sióstr (1194–1253). Według tradycji, gdy najeźdźcy zaatakowali jej klasztor, wyszła im naprzeciw z Najświętszym Sakramentem – stąd monstrancja na obrazku. Jest patronką telewizji.',
      symbols: 'monstrancja, białe lilie',
      quote: null
    }
  ],

  /* ---------- Produkty ----------
     Kolejność na liście = kolejność „Polecane” w sklepie.
     featured: true – produkt pokazuje się na stronie głównej.
     badges – dodatkowe etykiety: 'nowosc', 'bestseller', 'promocja', 'limitowana'.
     oldPrice + lowestPrice30 – tylko przy obniżce ceny (wymóg dyrektywy Omnibus:
     trzeba podać najniższą cenę z 30 dni przed obniżką).
     ⚠ Ceny są propozycją – ustaw własne. */
  products: [
    {
      id: 'obrazek-michal-archaniol',
      name: 'Obrazek – Św. Michał Archanioł',
      title: 'Św. Michał Archanioł',
      category: 'obrazki',
      saint: 'michal',
      featured: true,
      badges: [],
      price: 12.00,
      variants: [
        { id: 'klasyczny', format: 'klasyczny', price: 12.00,
          images: ['obrazek-michal-klasyczny', 'obrazek-michal-klasyczny-foto', 'obrazek-michal-klasyczny-foto2'] },
        { id: 'kompaktowy', format: 'kompaktowy', price: 10.00,
          images: ['obrazek-michal-kompaktowy', 'obrazek-michal-kompaktowy-foto'] }
      ],
      short: 'Archanioł z płonącym mieczem i tarczą „Quis ut Deus?”, a u jego stóp pokonany smok. Mocny, kolorowy obrazek dla każdego Michała – i dla każdego, komu przyda się odwaga.',
      description: [
        'Święty Michał w pixelowej odsłonie: skrzydła rozpostarte szeroko, uniesiony płonący miecz i tarcza z łacińskim zawołaniem „Quis ut Deus?” – „Któż jak Bóg?”. U jego stóp leży pokonany smok, a scenę dopełniają gołębie przysiadłe na zielonych krzewach.',
        'Sprawdzi się jako prezent na imieniny (29 września), bierzmowanie albo Pierwszą Komunię Świętą. W formacie klasycznym zmieści się w portfelu, w formacie kompaktowym – w modlitewniku lub etui na telefon.'
      ],
      specs: { 'Podpis na karcie': 'Święty Michał Archanioł' },
      tags: ['michał', 'archanioł', 'anioł', 'smok', 'komunia', 'bierzmowanie', 'imieniny']
    },
    {
      id: 'obrazek-teresa-z-lisieux',
      name: 'Obrazek – Św. Teresa z Lisieux',
      title: 'Św. Teresa z Lisieux',
      category: 'obrazki',
      saint: 'teresa',
      featured: true,
      badges: [],
      price: 10.00,
      variants: [
        { id: 'kompaktowy', format: 'kompaktowy', price: 10.00, caption: 'podpis „Święta Teresa z Lisieux”',
          images: ['obrazek-teresa-kompaktowy', 'obrazek-teresa-kompaktowy-foto', 'obrazek-teresa-kompaktowy-foto2'] },
        { id: 'klasyczny', format: 'klasyczny', price: 12.00, caption: 'podpis „TERESA DE LISIEUX”',
          images: ['obrazek-teresa-klasyczny', 'obrazek-teresa-klasyczny-foto'] }
      ],
      short: 'Mała Tereska z bukietem róż, wśród różanych krzewów i płatków spadających z nieba. Najsłodszy obrazek w kolekcji – dla Teresy i nie tylko.',
      description: [
        'Św. Teresa od Dzieciątka Jezus w karmelitańskim habicie, z bukietem róż w dłoniach. Róże to jej znak rozpoznawczy – obiecała, że z nieba „spuści na ziemię deszcz róż”.',
        'Wersja kompaktowa ma polski podpis „Święta Teresa z Lisieux”, a wersja klasyczna – podpis „TERESA DE LISIEUX”. Piękny upominek na imieniny (1 października), Pierwszą Komunię albo dla babci, mamy czy chrzestnej.'
      ],
      specs: {},
      tags: ['teresa', 'tereska', 'róże', 'karmelitanka', 'komunia', 'imieniny']
    },
    {
      id: 'obrazek-ojciec-pio',
      name: 'Obrazek – Św. Ojciec Pio',
      title: 'Św. Ojciec Pio',
      category: 'obrazki',
      saint: 'pio',
      featured: true,
      badges: [],
      price: 12.00,
      variants: [
        { id: 'klasyczny', format: 'klasyczny', price: 12.00,
          images: ['obrazek-pio-klasyczny', 'obrazek-pio-klasyczny-foto', 'obrazek-pio-klasyczny-foto2'] },
        { id: 'kompaktowy', format: 'kompaktowy', price: 10.00,
          images: ['obrazek-pio-kompaktowy', 'obrazek-pio-kompaktowy-foto', 'obrazek-pio-kompaktowy-foto2'] }
      ],
      short: 'Uśmiechnięty Ojciec Pio w kapucyńskim habicie, z różańcem i dłońmi znaczonymi stygmatami. Ciepły obrazek na co dzień – do portfela, modlitewnika lub na biurko.',
      description: [
        'Św. Pio z Pietrelciny przedstawiony z pogodą ducha, z której słynął: z różańcem przy pasie, wśród spadających płatków róż i w towarzystwie dwóch gołębi.',
        'Dobry pomysł na drobny prezent dla kogoś, kto potrzebuje otuchy – w duchu jego słynnych słów: „Módl się, ufaj i nie martw się”.'
      ],
      specs: { 'Podpis na karcie': 'Święty Ojciec Pio' },
      tags: ['pio', 'ojciec pio', 'kapucyn', 'różaniec', 'stygmaty']
    },
    {
      id: 'obrazek-franciszek-z-asyzu',
      name: 'Obrazek – Św. Franciszek z Asyżu',
      title: 'Św. Franciszek z Asyżu',
      category: 'obrazki',
      saint: 'franciszek',
      featured: true,
      badges: [],
      price: 12.00,
      variants: [
        { id: 'klasyczny', format: 'klasyczny', price: 12.00,
          images: ['obrazek-franciszek-klasyczny', 'obrazek-franciszek-klasyczny-foto', 'obrazek-franciszek-klasyczny-foto2'] },
        { id: 'kompaktowy', format: 'kompaktowy', price: 10.00,
          images: ['obrazek-franciszek-kompaktowy', 'obrazek-franciszek-kompaktowy-foto', 'obrazek-franciszek-kompaktowy-foto2'] }
      ],
      short: 'Franciszek otoczony zwierzętami: jeleniem, wiewiórką, zającami, wilkiem i ptakami. Najbardziej „leśny” obrazek w kolekcji – dla dzieci i miłośników przyrody.',
      description: [
        'Biedaczyna z Asyżu z krzyżem w dłoniach, a wokół niego cała gromadka stworzeń – od rudzików po wilka z Gubbio, którego według legendy oswoił. Nad głową świętego unosi się biała gołębica.',
        'Świetny prezent na imieniny Franciszka (4 października), na Pierwszą Komunię albo dla każdego, kto kocha zwierzęta.'
      ],
      specs: { 'Podpis na karcie': 'Św. Franciszek z Asyżu' },
      tags: ['franciszek', 'franek', 'zwierzęta', 'wilk', 'ptaki', 'ekologia', 'komunia']
    },
    {
      id: 'brelok-michal-archaniol',
      name: 'Brelok – Św. Michał Archanioł',
      title: 'Św. Michał Archanioł',
      category: 'breloki',
      saint: 'michal',
      featured: true,
      badges: [],
      price: 29.00,
      images: ['brelok-michal', 'brelok-michal-foto', 'brelok-michal-foto2'],
      short: 'Brelok z ekoskóry z wizerunkiem Świętego Michała Archanioła, z ozdobnym przeszyciem i metalowym kółkiem. Mały obrońca przy kluczach.',
      description: [
        'Ten sam wzór co na obrazku – Michał z płonącym mieczem i tarczą „Quis ut Deus?” – na jasnej ekoskórze wykończonej ozdobnym przeszyciem.',
        'Przypięty do kluczy, plecaka czy torebki przypomina o Bożej opiece na co dzień. Świetny upominek na imieniny, urodziny albo bierzmowanie.'
      ],
      specs: { 'Podpis': 'Święty Michał Archanioł' },
      tags: ['michał', 'archanioł', 'brelok', 'klucze', 'prezent']
    },
    {
      id: 'obrazek-klara-z-asyzu',
      name: 'Obrazek – Św. Klara z Asyżu',
      title: 'Św. Klara z Asyżu',
      category: 'obrazki',
      saint: 'klara',
      featured: true,
      badges: [],
      price: 10.00,
      variants: [
        { id: 'kompaktowy', format: 'kompaktowy', price: 10.00,
          images: ['obrazek-klara-kompaktowy', 'obrazek-klara-kompaktowy-foto', 'obrazek-klara-kompaktowy-foto2'] }
      ],
      short: 'Święta Klara z monstrancją, wśród białych lilii i spadających płatków. Subtelny, jasny obrazek – piękny prezent dla Klary i dla każdego, kto kocha adorację.',
      description: [
        'Św. Klara trzyma złotą monstrancję – znak, z którym według tradycji wyszła naprzeciw najeźdźcom atakującym jej klasztor. Białe lilie przypominają o czystości i prostocie, które wybrała, idąc za św. Franciszkiem.',
        'Idealny na imieniny (11 sierpnia), bierzmowanie lub jako upominek dla siostry zakonnej.'
      ],
      specs: { 'Podpis na karcie': 'Św. Klara z Asyżu' },
      tags: ['klara', 'monstrancja', 'lilie', 'adoracja', 'bierzmowanie']
    },
    {
      id: 'zestaw-swieci-patroni',
      name: 'Zestaw 5 obrazków – Święci patroni',
      title: 'Zestaw „Święci patroni”',
      category: 'zestawy',
      saint: null,
      featured: true,
      badges: [],
      price: 45.00,
      bundleValue: 50.00,     // wartość produktów kupowanych osobno
      images: ['zestaw-swieci-patroni', 'obrazek-michal-kompaktowy', 'obrazek-pio-kompaktowy', 'obrazek-teresa-kompaktowy', 'obrazek-franciszek-kompaktowy', 'obrazek-klara-kompaktowy'],
      includes: ['obrazek-michal-archaniol', 'obrazek-ojciec-pio', 'obrazek-teresa-z-lisieux', 'obrazek-franciszek-z-asyzu', 'obrazek-klara-z-asyzu'],
      short: 'Pięć obrazków w formacie kompaktowym: Michał Archanioł, Ojciec Pio, Teresa z Lisieux, Franciszek i Klara z Asyżu. Taniej niż osobno.',
      description: [
        'Komplet dla kolekcjonerów, katechetów i wszystkich, którzy nie potrafią wybrać jednego patrona. W zestawie znajdziesz pięć obrazków w formacie kompaktowym – po jednym z każdym świętym z naszej kolekcji.',
        'Świetnie sprawdzi się jako nagroda w szkole i na katechezie albo jako mały „poczet świętych” do modlitewnika.'
      ],
      specs: { 'Zawartość': '5 obrazków w formacie kompaktowym', 'Format': 'ok. 7,4 × 5,4 cm' },
      tags: ['zestaw', 'komplet', 'katecheza', 'nagroda', 'kolekcja']
    },
    {
      id: 'brelok-teresa-z-lisieux',
      name: 'Brelok – Św. Teresa z Lisieux',
      title: 'Św. Teresa z Lisieux',
      category: 'breloki',
      saint: 'teresa',
      featured: true,
      badges: [],
      price: 29.00,
      images: ['brelok-teresa', 'brelok-teresa-foto', 'brelok-teresa-foto2'],
      short: 'Brelok z ekoskóry z Małą Tereską i różanymi krzewami. Ozdobne przeszycie i metalowe kółko – codzienny drobiazg z charakterem.',
      description: [
        'Mała Tereska z bukietem róż i polskim podpisem „Święta Teresa z Lisieux”, nadrukowana na jasnej ekoskórze z ozdobnym przeszyciem.',
        'Przyda się przy kluczach, plecaku czy piórniku. Uroczy prezent dla Teresy – na imieniny, urodziny albo bez okazji.'
      ],
      specs: { 'Podpis': 'Święta Teresa z Lisieux' },
      tags: ['teresa', 'tereska', 'róże', 'brelok', 'klucze']
    },
    {
      id: 'brelok-ojciec-pio',
      name: 'Brelok – Św. Ojciec Pio',
      title: 'Św. Ojciec Pio',
      category: 'breloki',
      saint: 'pio',
      featured: false,
      badges: [],
      price: 29.00,
      images: ['brelok-pio', 'brelok-pio-foto', 'brelok-pio-foto2'],
      short: 'Brelok z ekoskóry z uśmiechniętym Ojcem Pio, gołębiami i krzewami. Ozdobne przeszycie, metalowe kółko na klucze.',
      description: [
        'Pogodny Ojciec Pio z różańcem, w otoczeniu gołębi i zielonych krzewów – ten sam wzór co na obrazku, nadrukowany na jasnej ekoskórze.',
        'Mały znak wiary, który zawsze jest pod ręką. Dobry prezent dla taty, dziadka albo przyjaciela.'
      ],
      specs: { 'Podpis': 'Święty Ojciec Pio' },
      tags: ['pio', 'ojciec pio', 'brelok', 'klucze', 'prezent']
    },
    {
      id: 'obrazek-teresa-modl-sie-za-nami',
      name: 'Obrazek – Św. Teresa z Lisieux „Módl się za nami”',
      title: 'Teresa z Lisieux – „Módl się za nami”',
      category: 'obrazki',
      saint: 'teresa',
      featured: false,
      badges: [],
      price: 12.00,
      variants: [
        { id: 'klasyczny', format: 'klasyczny', price: 12.00,
          images: ['obrazek-teresa-modlitwa', 'obrazek-teresa-modlitwa-foto', 'obrazek-teresa-modlitwa-foto2'] }
      ],
      short: 'Portret Świętej Teresy z różami i krucyfiksem, z modlitewnym wezwaniem „Módl się za nami”. Bardziej klasyczny, nastrojowy wzór.',
      description: [
        'Tym razem Teresa w ujęciu portretowym: z bukietem różowych róż w jednej dłoni i krucyfiksem w drugiej, w białym welonie i brązowym płaszczu karmelitanki. Pod spodem ozdobny ornament i wezwanie „Módl się za nami”.',
        'Piękny obrazek do modlitewnika i na pamiątkę bierzmowania.'
      ],
      specs: { 'Podpis na karcie': 'Św. Teresa z Lisieux – Módl się za nami' },
      tags: ['teresa', 'tereska', 'róże', 'krzyż', 'modlitwa', 'bierzmowanie']
    },
    {
      id: 'obrazek-teresa-edycja-rozana',
      name: 'Obrazek – Teresa de Lisieux, edycja różana',
      title: 'Teresa de Lisieux – edycja różana',
      category: 'obrazki',
      saint: 'teresa',
      featured: false,
      badges: [],
      price: 12.00,
      variants: [
        { id: 'klasyczny', format: 'klasyczny', price: 12.00,
          images: ['obrazek-teresa-rozany', 'obrazek-teresa-rozany-foto'] }
      ],
      short: 'Pełnokolorowy wzór z różowym tłem i różanym ogrodem, z eleganckim podpisem „Teresa de Lisieux”. Obrazek, który od razu przyciąga wzrok.',
      description: [
        'Ten wzór wypełnia kartę kolorem: różowe niebo, krzewy pełne róż i kwiatowa ścieżka pod stopami świętej. Podpis „Teresa de Lisieux” złożono klasyczną, szeryfową czcionką.',
        'Dostępny w formacie klasycznym – zmieści się w portfelu.'
      ],
      specs: { 'Podpis na karcie': 'Teresa de Lisieux' },
      tags: ['teresa', 'tereska', 'róże', 'różowy']
    }
  ]
};
