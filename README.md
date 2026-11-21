# Holy Print – sklep internetowy

Sklep z pixelowymi obrazkami i brelokami ze świętymi patronami.
Strona działa bez instalowania czegokolwiek: to zwykłe pliki HTML, CSS i JavaScript,
które można wrzucić na dowolny hosting.

---

## 1. Jak obejrzeć sklep na komputerze

**Najprościej:** kliknij dwukrotnie `index.html` – otworzy się w przeglądarce.

**Lepiej (tak jak będzie działać w internecie):** w folderze sklepu uruchom
```
python -m http.server 8000
```
i otwórz `http://localhost:8000`.

> Koszyk i zamówienia testowe zapisują się w przeglądarce. Żeby wyczyścić dane testowe,
> wyczyść dane strony w przeglądarce (lub otwórz okno incognito).

---

## 2. Lista rzeczy do zrobienia przed startem ✅

Wszystko poniżej zmienia się w dwóch plikach: `assets/js/config.js` (ustawienia)
i `assets/js/products.js` (produkty).

- [ ] **Dane sprzedawcy** (`config.js` → `seller`): imię i nazwisko lub nazwa firmy, adres,
      NIP/REGON (jeśli są), numer konta i nazwa banku. Bez tego regulamin pokazuje ramkę „Wzór do uzupełnienia”.
- [ ] **Kontakt** (`contact`): prawdziwy e-mail, telefon, godziny, linki do Instagrama/Facebooka/TikToka.
- [ ] **Numer do BLIK** (`payments.blikPhone`).
- [ ] **Ceny** w `products.js` – obecne (12 zł / 10 zł / 29 zł / 45 zł) to tylko propozycja.
- [ ] **Wymiary formatów** (`products.js` → `formats`) – zmierz karty i popraw „ok. 8,6 × 5,4 cm” oraz „ok. 7,4 × 5,4 cm”.
- [ ] **Opisy materiałów** – sprawdź, czy wszystko się zgadza: „sztywna karta”, „ekoskóra z ozdobnym
      przeszyciem”, „druk żywiczny” (`products.js` → `categories[].specs`).
- [ ] **Koszty i czas dostawy** (`shipping.methods`, `shipping.freeFrom`, `shop.processingTime`).
- [ ] **Rabat ilościowy** (`promotions.bulk`) – zostaw, zmień progi albo wyłącz (`enabled: false`).
- [ ] **Przyjmowanie zamówień** – przełącz `orders.mode` z `'demo'` na `'web3forms'` (rozdział 5).
- [ ] **Adres strony** (`shop.url`) oraz domenę w `sitemap.xml` i `robots.txt`.
- [ ] **Regulamin i polityka prywatności** – to solidne wzory, ale warto, żeby przejrzał je prawnik
      lub rzecznik konsumentów (np. czy prowadzisz firmę, czy działalność nierejestrowaną, czy jesteś płatnikiem VAT).
- [ ] **Potwierdzenia zamówień** – prawo wymaga, by klient dostał potwierdzenie zawarcia umowy na trwałym
      nośniku. W trybie e-mail (Web3Forms) wysyłaj klientowi krótkiego maila z potwierdzeniem zamówienia,
      numerem konta i regulaminem (PDF lub link).

---

## 3. Produkty

### Dodanie nowego produktu
1. Przygotuj zdjęcia (rozdział 4) i wrzuć do `assets/img/produkty/`.
2. W `products.js` skopiuj dowolny produkt (od `{` do `},`) i zmień:
   - `id` – unikalny, bez polskich znaków i spacji, np. `obrazek-jan-pawel-ii`,
   - `name`, `title`, `category` (`obrazki`, `breloki`, `zestawy`), `saint`, `price`,
   - `images` lub `variants[].images` – listę zdjęć,
   - `short` (krótki opis) i `description` (akapity opisu).
3. Zapisz i odśwież stronę.

Nowy święty? Dopisz go w `saints` (nazwa, data wspomnienia, imiona do wyszukiwarki patronów,
krótki opis i portret 360×360 px w `assets/img/swieci/`).

### Formaty (warianty)
Obrazki mają warianty `klasyczny` i `kompaktowy` – każdy z własną ceną i zdjęciami.
Produkt bez wariantów (np. brelok) ma po prostu `price` i `images`.

### Promocja (przekreślona cena)
Dodaj `oldPrice` (cena przed obniżką) **i** `lowestPrice30` (najniższa cena z 30 dni przed obniżką –
wymaga tego dyrektywa Omnibus). Etykietę dodasz przez `badges: ['promocja']`.

---

## 4. Zdjęcia

- Format **WebP** (najlżejszy) lub JPG. Każde zdjęcie najlepiej w dwóch rozmiarach:
  `nazwa.webp` (ok. 900–1000 px szerokości) i `nazwa-480.webp` (miniatura).
- W `products.js` wystarczy wpisać samą nazwę, np. `'obrazek-michal-klasyczny'`.
  Możesz też podać pełną ścieżkę, np. `'assets/img/produkty/nowe.jpg'` (wtedy jedna wersja dla wszystkiego).
- **Zdjęcia z tłem** (np. na drewnianym stole) muszą mieć w nazwie słowo `foto` – wypełniają wtedy
  całe pole. Pozostałe traktowane są jak wycięte produkty na jasnym tle (z cieniem i efektem 3D).
- Obecne „płaskie skany” kart zostały automatycznie wyprostowane i wycięte ze zdjęć z telefonu.
  Najlepsze efekty da zdjęcie robione prosto z góry, w równym świetle dziennym.

---

## 5. Jak zamówienia trafiają do Ciebie

W `config.js` → `orders.mode`:

| Tryb | Co się dzieje |
|---|---|
| `'demo'` | Nic nie jest wysyłane – tylko do testów (strona pokazuje baner „Tryb demonstracyjny”). |
| `'web3forms'` | Zamówienia i wiadomości z formularza przychodzą na Twój e-mail. **Polecane na start.** |
| `'formspree'` | To samo przez Formspree. |
| `'api'` | Własny serwer – patrz `INTEGRACJE.md`. |

**Web3Forms w 2 minuty:** wejdź na <https://web3forms.com>, wpisz swój e-mail, odbierz klucz
(Access Key) i wklej go do `orders.web3formsKey`, a `mode` ustaw na `'web3forms'`.
Złóż testowe zamówienie i sprawdź skrzynkę.

---

## 6. Paczkomaty InPost

- **Działa od razu:** klient wpisuje kod Paczkomatu (np. `KRA01M`), a link prowadzi do mapy InPost.
- **Interaktywna mapa w kasie:** w Managerze Paczek InPost (Moje konto → API → Geowidget) wygeneruj
  **publiczny token** i wklej go do `shipping.inpost.geowidgetToken`. Gotowe – w kasie pojawi się
  przycisk „Wybierz Paczkomat na mapie”. (InPost od 1 stycznia 2027 obsługuje już tylko nową mapę
  Geowidget v5 – i właśnie ta wersja jest tu podłączona.)
- Automatyczne nadawanie paczek (ShipX API) wymaga serwera – opis w `INTEGRACJE.md`.

---

## 7. Płatności

Od razu działają: **przelew tradycyjny** i **BLIK na telefon** (klient widzi dane po złożeniu zamówienia),
opcjonalnie **pobranie**. Metody włączasz/wyłączasz w `payments.methods` (`enabled: true/false`).

Płatności online (Przelewy24, PayU, Tpay, Stripe z BLIK-iem i kartą) są przygotowane w kodzie
(`assets/js/integrations/payments.js`), ale wymagają małego serwera, który bezpiecznie przechowuje
klucze bramki. Instrukcja i przykładowy serwer: `INTEGRACJE.md` i folder `backend-przyklad/`.
Dopóki płatności online nie są podłączone, w kasie widać je jako „wkrótce”
(`payments.showComingSoon: false` – całkiem je ukryje).

---

## 8. Publikacja w internecie

Sklep to statyczne pliki – wystarczy dowolny hosting:

- **Netlify Drop** (<https://app.netlify.com/drop>) – przeciągasz folder `holyprint-sklep` i gotowe.
- **Cloudflare Pages** / **GitHub Pages** – darmowe, z własną domeną.
- **Klasyczny hosting** (np. z domeną `.pl`) – wgraj zawartość folderu przez FTP do katalogu `public_html`.

Po publikacji uzupełnij `shop.url`, `sitemap.xml`, `robots.txt` i – dla ładnego podglądu linków na
Facebooku – zamień w plikach HTML `og:image` na pełny adres, np.
`https://twoja-domena.pl/assets/img/og-image.jpg`.

---

## 9. Co jest w środku

```
holyprint-sklep/
├─ index.html              strona główna
├─ sklep.html              lista produktów (filtry, wyszukiwarka)
├─ produkt.html            karta produktu (?id=…)
├─ koszyk.html             koszyk
├─ zamowienie.html         kasa
├─ dziekujemy.html         potwierdzenie + dane do płatności
├─ o-nas.html, kontakt.html, regulamin.html, polityka-prywatnosci.html,
├─ dostawa-i-platnosci.html, zwroty-i-reklamacje.html, 404.html
├─ favicon.svg / favicon.ico / apple-touch-icon.png / site.webmanifest
├─ assets/
│  ├─ css/style.css        cały wygląd
│  ├─ js/config.js         ⚙ USTAWIENIA SKLEPU
│  ├─ js/products.js       ⚙ PRODUKTY, KATEGORIE, ŚWIĘCI
│  ├─ js/core.js           koszyk, ceny, rabaty
│  ├─ js/ui.js             nagłówek, stopka, koszyk boczny, wyszukiwarka
│  ├─ js/icons.js          ikony pixel art
│  ├─ js/integrations/     shipping.js (InPost), payments.js, orders.js
│  ├─ js/pages/            skrypty poszczególnych podstron
│  ├─ fonts/               czcionki (lokalnie – bez Google Fonts, zgodnie z RODO)
│  └─ img/                 logo, ikony, produkty, portrety świętych
├─ backend-przyklad/       przykładowy serwer pod płatności online
├─ README.md               ta instrukcja
└─ INTEGRACJE.md           płatności online, InPost, własny serwer
```

Bez frameworków i bez „budowania” – edytujesz plik i odświeżasz stronę.

---

## 10. Licencje i źródła

- **Logo, favicon, zdjęcia produktów** – Holy Print (logo odtworzone jako pixel art z wizytówki,
  zdjęcia wyprostowane i wycięte z dostarczonych fotografii).
- **Czcionki:** Jersey 10, Nunito, Lora – SIL Open Font License 1.1 (Google Fonts).
- **Ikony:** [pixelarticons](https://github.com/halfmage/pixelarticons) – licencja MIT
  (© 2019 Gerrit Halfmann), plik `assets/js/LICENSE-pixelarticons.txt`; ikony social, aureola,
  krzyż, prezent i klucz narysowane dla Holy Print.
