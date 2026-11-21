/* Formularz kontaktowy */
(function () {
  'use strict';
  const HP = window.HP;
  const { $, esc } = HP.util;

  HP.onReady(() => {
    const form = $('#contact-form');
    const topic = $('#c-topic');
    const prm = HP.util.params();

    const syncExtra = () => {
      $('#patron-field').hidden = topic.value !== 'indywidualne';
      $('#order-field').hidden = topic.value !== 'zamowienie';
    };

    // wypełnienie z linku, np. kontakt.html?temat=indywidualne&imie=Zofia
    const t = prm.get('temat');
    if (t && topic.querySelector('option[value="' + CSS.escape(t) + '"]')) topic.value = t;
    const imie = (prm.get('imie') || '').slice(0, 40);
    if (imie) {
      $('#c-patron').value = 'imię ' + imie;
      $('#c-message').value = 'Dzień dobry, szukam obrazka ze świętym patronem dla imienia ' + imie + '. Czy możecie go przygotować?';
    } else if (t === 'hurt') {
      $('#c-message').value = 'Dzień dobry, chciałbym/chciałabym zamówić większą liczbę obrazków (ok. … szt.) dla …';
    }
    syncExtra();
    topic.addEventListener('change', syncExtra);
    if (t === 'indywidualne' || t === 'hurt') {
      const box = $('#' + (t === 'hurt' ? 'hurt' : 'indywidualne'));
      if (box) box.style.boxShadow = '0 0 0 4px rgba(251,181,96,.35)';
    }

    const setErr = (name, bad) => {
      const f = form.querySelector('[data-field="' + name + '"]');
      if (f) f.classList.toggle('is-invalid', bad);
      return !bad;
    };

    form.addEventListener('input', (e) => {
      const f = e.target.closest('.field.is-invalid');
      if (f) f.classList.remove('is-invalid');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        temat: topic.options[topic.selectedIndex].text,
        patron: topic.value === 'indywidualne' ? form.elements.patron.value.trim() : '',
        nr: topic.value === 'zamowienie' ? form.elements.nr.value.trim() : '',
        message: form.elements.message.value.trim()
      };
      let ok = setErr('name', !data.name);
      ok = setErr('email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) && ok;
      ok = setErr('message', data.message.length < 3) && ok;
      if (!ok) { const first = form.querySelector('.is-invalid input, .is-invalid textarea'); if (first) first.focus(); return; }
      if (form.elements.website.value) return; // pułapka na boty

      const btn = $('#contact-submit');
      const err = $('#contact-error');
      err.hidden = true;
      btn.classList.add('is-loading');
      try {
        await HP.forms.send(data);
        form.hidden = true;
        $('#contact-done').hidden = false;
        if (HP.orders.isDemo()) $('#contact-done-text').innerHTML = 'Tryb demonstracyjny – wiadomość nie została nigdzie wysłana. Skonfiguruj <code>orders.mode</code> w <code>config.js</code>.';
        $('#contact-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (ex) {
        const mail = (HP.cfg.contact && HP.cfg.contact.email) || '';
        err.innerHTML = HP.icon('alert') + '<span>Nie udało się wysłać wiadomości. ' + esc(ex.message || '') + (mail ? ' Napisz bezpośrednio: <a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>' : '') + '</span>';
        err.hidden = false;
      } finally {
        btn.classList.remove('is-loading');
      }
    });
  });
})();
