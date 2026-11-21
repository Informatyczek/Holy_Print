# Integracje: płatności online, Paczkomaty, własny serwer

Sklep jest statyczny (HTML + JS). Wszystko, co wymaga **tajnych kluczy** (bramki płatności,
nadawanie paczek), musi działać na serwerze. Frontend ma już przygotowane „gniazda”
na te funkcje – wystarczy dopisać serwer i przełączyć ustawienia w `assets/js/config.js`.

```
 Przeglądarka klienta                     Twój serwer (np. backend-przyklad/)          Usługi zewnętrzne
 ─────────────────────                     ───────────────────────────────────          ─────────────────
 zamowienie.html ── POST /api/orders ───►  przelicza ceny, zapisuje zamówienie
                 ── POST /api/payments/p24 ► tworzy transakcję ─────────────────────►  Przelewy24 / PayU / Stripe
                 ◄── { redirectUrl } ─────                                              │
 przekierowanie na stronę płatności ───────────────────────────────────────────────►  │
                                          ◄── powiadomienie (webhook) „opłacone” ──────┘
 dziekujemy.html ◄── powrót klienta                     └─► (opcjonalnie) ShipX API InPost – etykieta paczki
```

---

## 1. Kontrakt API (tryb `orders.mode = 'api'`)

Ustaw w `config.js`:
```js
orders: { mode: 'api', ... },
api:    { baseUrl: 'https://api.twoja-domena.pl/api' }
```

| Żądanie | Treść (JSON) | Odpowiedź |
|---|---|---|
| `POST {baseUrl}/orders` | pełny obiekt zamówienia (numer, klient, pozycje, dostawa, płatność, sumy, zgody) | `200 { "ok": true }` – inaczej `{ "ok": false, "message": "…" }` |
| `POST {baseUrl}/messages` | `{ name, email, temat, message, … }` z formularza kontaktowego | `200 { "ok": true }` |
| `POST {baseUrl}/payments/{provider}` | `{ orderNumber, amount (grosze), currency, email, description, returnUrl }` | `200 { "redirectUrl": "https://…" }` |

`{provider}` to wartość `provider` metody płatności z `config.js`: `przelewy24`, `payu`, `tpay` lub `stripe`.

> ⚠ **Kwoty przysłane z przeglądarki traktuj tylko informacyjnie.** Serwer musi sam przeliczyć
> ceny z `products.js` i `config.js` – tak robi przykładowy serwer (`recompute()`).

---

## 2. Przykładowy serwer (`backend-przyklad/server.js`)

Node.js 18+, bez instalowania paczek:
```
node backend-przyklad/server.js            # http://localhost:3000/api
PORT=8080 ALLOWED_ORIGIN=https://twoja-domena.pl node backend-przyklad/server.js
```
- zapisuje zamówienia w `backend-przyklad/dane/zamowienia/NUMER.json` i wiadomości w `dane/wiadomosci/`,
- przelicza ceny, rabat ilościowy i koszt dostawy po stronie serwera (i zaznacza `priceMismatch`, gdy przeglądarka przysłała inną kwotę),
- `POST /api/payments/:provider` zwraca na razie `501` – to miejsce na podłączenie bramki (kroki niżej).

Do produkcji dopisz jeszcze: wysyłkę e-maili (potwierdzenie dla klienta, powiadomienie dla Ciebie),
HTTPS i ewentualnie prosty panel zamówień. Serwer możesz uruchomić np. na VPS, w Render/Railway/Fly.io
albo przepisać na funkcje serverless (Netlify Functions, Cloudflare Workers).

---

## 3. Płatności online

Po stronie sklepu:
1. W `config.js` → `payments.methods` znajdź metodę `id: 'online'`, ustaw `enabled: true`
   i właściwy `provider` (np. `'przelewy24'`).
2. Ustaw `api.baseUrl`.
3. Sprawdź `shop.url` – z niego budowany jest adres powrotu klienta (`returnUrl`).

Po stronie serwera (w `POST /api/payments/:provider`) – wybierz jedną bramkę:

### Przelewy24 (BLIK, szybkie przelewy, karty)
1. Załóż konto i pobierz `merchantId`, `posId`, klucz CRC i klucz API (najpierw w środowisku sandbox).
2. Zarejestruj transakcję: `POST /api/v1/transaction/register` (kwota w groszach, `sessionId` = numer zamówienia,
   `urlReturn` = adres strony podziękowania, `urlStatus` = adres Twojego webhooka, podpis `sign`).
3. Zwróć sklepowi `redirectUrl = https://secure.przelewy24.pl/trnRequest/{token}`.
4. Na `urlStatus` odbierz powiadomienie i potwierdź je wywołaniem `PUT /api/v1/transaction/verify`; dopiero wtedy oznacz zamówienie jako opłacone.

Dokumentacja: <https://developers.przelewy24.pl/>

### PayU
1. Pobierz `pos_id`, `client_id`, `client_secret` i drugi klucz (MD5) z panelu PayU (jest sandbox).
2. Pobierz token OAuth (`grant_type=client_credentials`), utwórz zamówienie `POST /api/v2_1/orders`.
3. Zwróć sklepowi `redirectUri` z odpowiedzi PayU.
4. Odbieraj powiadomienia na `notifyUrl` i weryfikuj ich podpis (nagłówek `OpenPayu-Signature`).

Dokumentacja: <https://developers.payu.com/>

### Stripe (karty, BLIK, Przelewy24)
1. Utwórz sesję Stripe Checkout w walucie `pln` z metodami `card`, `blik`, `p24`.
2. Zwróć sklepowi `session.url` jako `redirectUrl`.
3. Odbieraj webhook `checkout.session.completed` i weryfikuj go sekretem webhooka.

Dokumentacja: <https://docs.stripe.com/payments/checkout>

### Tpay
Analogicznie: utwórz transakcję przez API Tpay, zwróć link do płatności, potwierdzaj powiadomienia.
Informacje dla sprzedawców: <https://tpay.com>

**Zasady bezpieczeństwa (dla każdej bramki):**
- klucze tylko w zmiennych środowiskowych serwera – nigdy w plikach sklepu ani w repozytorium,
- kwotę bierz z zapisanego zamówienia na serwerze, nie z żądania przeglądarki,
- status „opłacone” ustawiaj wyłącznie na podstawie zweryfikowanego powiadomienia z bramki (nie po samym powrocie klienta),
- dopisz operatora płatności do regulaminu (§ 4) i do odbiorców danych w polityce prywatności.

---

## 4. InPost

### Mapa Paczkomatów (Geowidget v5) – gotowe w sklepie
1. Manager Paczek InPost → Moje konto → API → **Geowidget** → wygeneruj **publiczny** token
   (dla testów na `localhost` zostaw pole domeny puste).
2. Wklej go do `config.js` → `shipping.inpost.geowidgetToken`.
3. Opcjonalnie: `shipping.inpost.config` – `parcelCollect` (paczki opłacone z góry) lub
   `parcelCollectPayment` (za pobraniem).

Kod obsługi jest w `assets/js/integrations/shipping.js` (skrypt i styl z `geowidget.inpost.pl`,
wybrany punkt trafia do formularza jako kod i adres Paczkomatu).
Dokumentacja: <https://geowidget.inpost.pl/docs/>

### Automatyczne nadawanie paczek (ShipX API) – do zrobienia na serwerze
Po opłaceniu zamówienia serwer może utworzyć przesyłkę przez ShipX API
(`POST /v1/organizations/{id}/shipments`, usługa `inpost_locker_standard`, gabaryt np. `small`,
punkt odbioru w `custom_attributes.target_point` = kod Paczkomatu z zamówienia) i pobrać etykietę do druku.
Do tego potrzebny jest **osobny token API ShipX** (nie ten z Geowidgetu) i numer organizacji.
Dokumentacja InPost: <https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/overview>

---

## 5. Gdzie co jest w kodzie

| Plik | Rola |
|---|---|
| `assets/js/integrations/orders.js` | wysyłka zamówień i wiadomości (demo / Web3Forms / Formspree / API) |
| `assets/js/integrations/payments.js` | rejestr metod płatności; `HP.payments.register()` pozwala dodać własną |
| `assets/js/integrations/shipping.js` | Paczkomaty: ręczny kod lub mapa Geowidget v5 |
| `assets/js/pages/checkout.js` | formularz kasy, walidacja, budowa obiektu zamówienia |
| `assets/js/core.js` | koszyk, ceny, rabaty, koszty dostawy (`HP.pricing.totals()`) |
