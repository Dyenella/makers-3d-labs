/* Makers 3D Labs — "Direct afrekenen" op productpagina's met een vaste prijs.
   De prijs wordt op de server bepaald uit assets/catalogus.json; hier lezen we alleen de keuzes uit het formulier. */
(() => {
  'use strict';
  const FN = 'https://dwirzzslswqjqnwthlyn.supabase.co/functions/v1/afrekenen';
  const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  const $ = (sel, root = document) => root.querySelector(sel);
  const checked = (id) => !!document.getElementById(id)?.checked;
  const num = (sel, d = 1) => { const v = parseInt($(sel)?.value, 10); return Number.isInteger(v) ? v : d; };
  const euro = (c) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(c / 100);

  // Per paginasoort: welke uitvoering (index), welke extra's (indexen) en welk aantal.
  function readChoice(form) {
    const html = document.documentElement.innerHTML;
    let v = 0, addons = [], qty = 1, block = '';
    if ($('#laser-config')) { v = $('#variant', form).selectedIndex; qty = num('#amount'); }
    else if (form.id === 'resin-form') { v = Number($('input[name="Formaat"]:checked', form)?.dataset.index || 0); qty = num('#resin-qty'); }
    else if (/stadiumBaseCents=/.test(html)) {
      const l = Number($('input[name="lighting"]:checked', form)?.value || 0);
      if (l > 0) addons.push(l > 100 ? 1 : 0);
      if (checked('nameplate')) addons.push(2);
      if (checked('clubcolors')) addons.push(3);
    }
    else if (form.id === 'vase-form') { v = ['15', '20', '25'].indexOf($('input[name="size"]:checked', form)?.value); qty = num('#vase-qty'); }
    else if (form.id === 'kh-form' && $('input[name="size"]', form)) { v = ['8', '10', '12'].indexOf($('input[name="size"]:checked', form)?.value); qty = num('#kh-qty'); }
    else if (form.id === 'kh-form') {
      v = ['naamkaartje', 'servetring', 'combinatie'].indexOf($('input[name="model"]:checked', form)?.value);
      qty = Math.max(1, ($('#kt-names')?.value || '').split(/\r?\n/).filter((x) => x.trim()).length);
    }
    else if ($('#finish', form)) { v = $('#finish', form).selectedIndex; if (checked('personal')) addons.push(0); qty = num('#quantity'); }
    else if ($('#np-variant', form)) {
      const val = $('#np-variant', form).value; v = /^\d+$/.test(val) ? Number(val) : -1;
      if (/aanvraag/i.test($('#formaat', form)?.value || '')) block = 'Voor een eigen maat maken we eerst een prijsvoorstel.';
      if (checked('np-extra')) addons.push(0); qty = num('#aantal');
    }
    else if ($('#formaat', form) && $('#uitvoering', form)) { // productpagina's 001–100: formaat × uitvoering
      const fi = $('#formaat', form).selectedIndex - 1, nf = $('#uitvoering', form).options.length;
      if (/eigen maat/i.test($('#formaat', form).value)) block = 'Voor een eigen maat maken we eerst een prijsvoorstel.';
      v = fi < 0 ? -1 : fi * nf + $('#uitvoering', form).selectedIndex; qty = num('#aantal');
    }
    else if (page === 'business-collection-bedrijfsdisplays.html') {
      v = [...form.querySelectorAll('input[name="product"]')].findIndex((r) => r.checked);
      ['opt-nfc-review', 'opt-nfc-catalogus', 'opt-extra-qr'].forEach((id, i) => { if (checked(id) && !document.getElementById(id).disabled) addons.push(i); });
    }
    else if (page === 'clipper-duo-set.html') {
      v = $('input[name="set"]:checked', form)?.value === 'duo' ? 1 : 0;
      ['third', 'logo', 'colors'].forEach((id, i) => { if (checked(id)) addons.push(i); });
    }
    else if (page === 'metalen-supporterskaart-premium.html') {
      v = $('input[name="uitvoering"]:checked', form)?.value === 'premium' ? 1 : 0;
      ['dubbel', 'houder', 'cadeau', 'maatwerk'].forEach((id, i) => { if (checked(id)) addons.push(i); });
    }
    else if (page === 'samurai-oni-deluxe.html') { ['plate', 'colors', 'protect'].forEach((id, i) => { if (checked(id)) addons.push(i); }); }
    else if ($('input[name="size"]', form)) { // bustes
      v = [...form.querySelectorAll('input[name="size"]')].findIndex((r) => r.checked);
      if (checked('nameplate')) addons.push(0);
    }
    return { v, addons, qty, block };
  }

  async function start() {
    let cat;
    try { cat = await fetch('assets/catalogus.json', { cache: 'no-cache' }).then((r) => r.json()); } catch { return; }
    const product = cat.products.find((p) => p.file === page);
    if (!product) return;
    const form = document.querySelector('#laser-form, #resin-form, #vase-form, #kh-form, #mask-order, .np-form, #product-form');
    if (!form) return;

    const box = document.createElement('div');
    box.className = 'm3d-pay';
    box.innerHTML = `
      <style>
        .m3d-pay{margin:18px 0 6px;padding:16px;border:1px solid rgba(0,180,189,.45);border-radius:12px;background:rgba(0,180,189,.08)}
        .m3d-pay h3{margin:0 0 8px;font-size:17px}
        .m3d-pay .m3d-row{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0 12px;font-size:14px}
        .m3d-pay .m3d-ship{margin:4px 0 12px;font-size:14px;line-height:1.5}
        .m3d-pay label{display:inline-flex;gap:6px;align-items:center;cursor:pointer;font-weight:600}
        .m3d-pay button{width:100%;border:0;border-radius:10px;padding:14px 18px;font:700 16px/1.3 Arial,sans-serif;background:#00b4bd;color:#fff;cursor:pointer}
        .m3d-pay button:disabled{opacity:.6;cursor:wait}
        .m3d-pay small{display:block;margin-top:8px;opacity:.8;font-size:12.5px;line-height:1.5}
        .m3d-pay .m3d-msg{margin-top:8px;font-size:14px;font-weight:600;color:#d9534f}
        .m3d-pay .m3d-pm{display:block;margin-top:6px;font-size:12px;opacity:.75}
      </style>
      <h3>Direct bestellen en betalen</h3>
      <p class="m3d-ship">Verzenden met <strong>PostNL</strong> of <strong>DHL</strong> — je kiest bij het afrekenen. Vanaf € 5,25, gratis vanaf € 400. <a href="informatie.html#verzending">Bekijk de tarieven</a></p>
      <button type="button" class="m3d-pay-btn">Direct afrekenen →</button>
      <span class="m3d-pm">iDEAL · Bancontact · creditcard — veilig betalen via Stripe</span>
      <div class="m3d-msg" role="alert"></div>
      <small>Liever eerst overleggen? Gebruik dan de aanvraagknop: je ontvangt een prijsvoorstel en betaalt nog niets.</small>`;
    const submit = form.querySelector('button[type="submit"]');
    (submit?.parentElement === form ? submit : form.lastElementChild)?.insertAdjacentElement('beforebegin', box);
    // Oude teksten "online betalen is nog niet actief" verbergen.
    form.querySelectorAll('p, div, small').forEach((n) => { if (/online betalen is nog niet (actief|beschikbaar)/i.test(n.textContent) && !n.querySelector('form, input, button')) n.hidden = true; });

    // Live prijs op de productpagina's met formaat × uitvoering.
    const priceEl = document.querySelector('.np-price');
    if (product.pricing && priceEl) {
      const upd = () => {
        const c = readChoice(form), vr = product.variants[c.v];
        if (c.block) priceEl.textContent = 'Prijs op aanvraag (eigen maat)';
        else if (vr) priceEl.textContent = euro(vr.cents * Math.max(1, c.qty)) + (c.qty > 1 ? ` (${c.qty} × ${euro(vr.cents)})` : '');
      };
      form.addEventListener('change', upd); form.addEventListener('input', upd);
    }
    const msg = box.querySelector('.m3d-msg');
    const btn = box.querySelector('.m3d-pay-btn');
    btn.addEventListener('click', async () => {
      msg.textContent = '';
      const c = readChoice(form);
      const variant = product.variants[c.v];
      if (!variant) { msg.textContent = 'Kies eerst een uitvoering.'; return; }
      const soft = !variant.firm || c.addons.some((i) => !product.addons[i]?.firm);
      if (c.block || soft) { msg.textContent = (c.block || 'Voor deze keuze maken we eerst een prijsvoorstel.') + ' Gebruik de aanvraagknop.'; return; }
      // Alleen de personalisatievelden controleren (contactgegevens vult de klant bij Stripe in).
      for (const el of form.querySelectorAll('input[required], select[required], textarea[required]')) {
        if (/email|naam|customer|telefoon|phone|akkoord|toestemming/i.test((el.name || '') + ' ' + (el.id || '')) || el.type === 'checkbox') continue;
        if (!el.checkValidity()) { el.reportValidity(); return; }
      }
      const fd = new FormData(form);
      ['_subject', '_captcha', 'Prijsstatus', 'quote-price', 'quote-unit'].forEach((k) => fd.delete(k));
      fd.set('_product', page);
      fd.set('_variant', String(c.v));
      fd.set('_addons', c.addons.join(','));
      fd.set('_qty', String(Math.min(100, Math.max(1, c.qty))));
      fd.set('_delivery', 'ship');
      for (const id of ['personalization', 'notes', 'personal-text', 'kt-names', 'kt-notes', 'kt-color', 'naam', 'tekst', 'datum']) {
        const el = document.getElementById(id); if (el && el.value && !el.name) fd.set(id, el.value);
      }
      btn.disabled = true; btn.textContent = 'Even geduld…';
      try {
        const r = await fetch(FN, { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.url) throw new Error(j.error || 'Afrekenen is niet gelukt. Probeer het opnieuw.');
        location.href = j.url;
      } catch (e) { msg.textContent = e.message; btn.disabled = false; btn.textContent = 'Direct afrekenen →'; }
    });
    if (new URLSearchParams(location.search).get('betaling') === 'geannuleerd') msg.textContent = 'De betaling is geannuleerd. Je kunt het opnieuw proberen.';
  }
  start();
})();
