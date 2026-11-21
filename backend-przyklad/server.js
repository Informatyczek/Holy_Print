/* =========================================================================
   HOLY PRINT – PRZYKŁADOWY SERWER API (Node.js 18+, bez dodatkowych paczek)
   -------------------------------------------------------------------------
   Uruchomienie:   node backend-przyklad/server.js
   W config.js:    orders.mode = 'api'
                   api.baseUrl = 'http://localhost:3000/api'   (później: adres serwera)

   Co robi:
   • POST /api/orders     – przelicza ceny po stronie serwera (z products.js
                            i config.js), zapisuje zamówienie w dane/zamowienia/
   • POST /api/messages   – zapisuje wiadomość z formularza w dane/wiadomosci/
   • POST /api/payments/:provider – MIEJSCE NA BRAMKĘ PŁATNOŚCI (zwraca 501,
                            dopóki jej nie podłączysz – patrz INTEGRACJE.md)
   To szkielet do rozbudowy: dodaj wysyłkę e-maili, panel zamówień itp.
   ========================================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(__dirname, 'dane');
const PORT = Number(process.env.PORT) || 3000;
// W produkcji ustaw adres sklepu, np. ALLOWED_ORIGIN=https://holyprint.pl
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Wczytuje ustawienia i produkty z plików sklepu (te same, co widzi klient) */
function loadShop() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['assets/js/config.js', 'assets/js/products.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return { cfg: ctx.window.HP_CONFIG, data: ctx.window.HP_DATA };
}

/** Ceny liczymy na serwerze – nigdy nie ufamy kwotom przysłanym z przeglądarki */
function recompute(order, { cfg, data }) {
  const items = (order.items || []).map((it) => {
    const p = data.products.find((x) => x.id === it.id);
    if (!p) throw new Error('Nieznany produkt: ' + it.id);
    const vs = p.variants || [];
    const v = vs.find((x) => x.id === it.variantId) || vs[0] || null;
    const unit = v && v.price != null ? v.price : p.price;
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
    return { id: p.id, name: p.name, variant: v ? v.id : null, qty, unit, total: round(unit * qty), category: p.category };
  });
  if (!items.length) throw new Error('Puste zamówienie');
  const subtotal = round(items.reduce((s, i) => s + i.total, 0));
  let discount = 0;
  const b = cfg.promotions && cfg.promotions.bulk;
  if (b && b.enabled) {
    const el = items.filter((i) => (b.categories || []).includes(i.category));
    const qty = el.reduce((s, i) => s + i.qty, 0);
    let pct = 0;
    (b.tiers || []).forEach((t) => { if (qty >= t.min) pct = Math.max(pct, t.percent); });
    discount = round((el.reduce((s, i) => s + i.total, 0) * pct) / 100);
  }
  const goods = round(subtotal - discount);
  const ship = (cfg.shipping.methods || []).find((m) => m.id === (order.shipping || {}).method && m.enabled !== false);
  if (!ship) throw new Error('Nieznana metoda dostawy');
  const shipping = cfg.shipping.freeFrom && goods >= cfg.shipping.freeFrom ? 0 : ship.price;
  const pay = (cfg.payments.methods || []).find((m) => m.id === (order.payment || {}).method);
  if (!pay) throw new Error('Nieznana metoda płatności');
  const paymentFee = Number(pay.fee) || 0;
  return { items, totals: { subtotal, discount, goods, shipping, paymentFee, total: round(goods + shipping + paymentFee) } };
}

const safeName = (s) => String(s || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);

function save(dir, name, obj) {
  const d = path.join(DATA, dir);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, name + '.json'), JSON.stringify(obj, null, 2), 'utf8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 100 * 1024) { reject(new Error('Za duże zapytanie')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('Niepoprawny JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const order = await readBody(req);
      const number = safeName(order.number);
      if (!number) return send(res, 400, { ok: false, message: 'Brak numeru zamówienia' });
      const shop = loadShop();
      const server = recompute(order, shop);
      const mismatch = Math.abs(server.totals.total - Number((order.totals || {}).total)) > 0.01;
      const saved = Object.assign({}, order, { items: server.items, totals: server.totals, receivedAt: new Date().toISOString(), priceMismatch: mismatch });
      save('zamowienia', number, saved);
      console.log('[zamówienie]', number, server.totals.total + ' zł', mismatch ? '(UWAGA: kwota z przeglądarki była inna!)' : '');
      // TODO: wyślij e-mail z potwierdzeniem do klienta i powiadomienie do sprzedawcy
      return send(res, 200, { ok: true, number, total: server.totals.total });
    }

    if (req.method === 'POST' && url.pathname === '/api/messages') {
      const msg = await readBody(req);
      if (!msg.email || !msg.message) return send(res, 400, { ok: false, message: 'Brak e-maila lub treści' });
      save('wiadomosci', Date.now() + '-' + safeName(msg.email.split('@')[0]), Object.assign({ receivedAt: new Date().toISOString() }, msg));
      console.log('[wiadomość]', msg.email);
      return send(res, 200, { ok: true });
    }

    const pay = url.pathname.match(/^\/api\/payments\/([a-z0-9]+)$/);
    if (req.method === 'POST' && pay) {
      const provider = pay[1];
      const body = await readBody(req);
      const file = path.join(DATA, 'zamowienia', safeName(body.orderNumber) + '.json');
      if (!fs.existsSync(file)) return send(res, 404, { ok: false, message: 'Nie znaleziono zamówienia' });
      const order = JSON.parse(fs.readFileSync(file, 'utf8'));
      const amount = Math.round(order.totals.total * 100); // kwota z SERWERA, w groszach
      /* ------------------------------------------------------------------
         Tu podłącz bramkę płatności (szczegóły: INTEGRACJE.md), np. Przelewy24:
           1. POST /api/v1/transaction/register  (merchantId, posId, sessionId,
              amount, currency: 'PLN', description, email, urlReturn, urlStatus, sign)
           2. z odpowiedzi weź token i zwróć:
              send(res, 200, { redirectUrl: 'https://secure.przelewy24.pl/trnRequest/' + token })
           3. powiadomienie o wpłacie odbierz na urlStatus i potwierdź (transaction/verify)
         Klucze trzymaj w zmiennych środowiskowych, nigdy w plikach sklepu.
         ------------------------------------------------------------------ */
      return send(res, 501, { ok: false, message: 'Bramka „' + provider + '” nie jest jeszcze podłączona (kwota do zapłaty: ' + (amount / 100).toFixed(2) + ' zł).' });
    }

    return send(res, 404, { ok: false, message: 'Nie ma takiego adresu' });
  } catch (err) {
    console.error(err);
    return send(res, 400, { ok: false, message: err.message });
  }
});

server.listen(PORT, () => console.log('Holy Print API działa: http://localhost:' + PORT + '/api'));
