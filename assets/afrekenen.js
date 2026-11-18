/* Makers 3D Labs — "Direct afrekenen" op productpagina's met een vaste prijs.
   De prijs wordt op de server bepaald uit assets/catalogus.json; hier lezen we alleen de keuzes uit het formulier. */
(() => {
  'use strict';
  const FN = 'https://dwirzzslswqjqnwthlyn.supabase.co/functions/v1/afrekenen';
  const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  const $ = (sel, root = document) => root.querySelector(sel);
  const checked = (id) => !!document.getElementById(id)?.checked;
  const num = (sel, d = 1) => { const v = parseInt($(sel)?.value, 10); return Number.isInteger(v) ? v : d; };
  // Levertijd: kleine artikelen binnen 3 werkdagen, grote handgemaakte stukken binnen 14 dagen (zelfde regel als op de server).
  const isLarge = (p, v) => {
    const lab = String(v?.label || ''), c = p.category;
    if (c === 'Lasergravure') return false;
    if (c === 'Voetbalstadions' || c === 'Resin') return true;
    if (c === 'Maskers') return !/^(Klein|Middel)/.test(lab);
    return /^Groot/.test(lab) || /\b(2[5-9]|[3-9]\d)\s?(–\s?\d+\s?)?cm\b/.test(lab);
  };
  const leadText = (p, v) => {
    if (v) return isLarge(p, v) ? 'binnen 14 dagen na bestelling, afhankelijk van beschikbaarheid' : 'binnen 3 werkdagen na bestelling';
    const s = new Set(p.variants.map((x) => isLarge(p, x)));
    return s.size > 1 ? 'kleine formaten binnen 3 werkdagen, grote formaten binnen 14 dagen (afhankelijk van beschikbaarheid)' : leadText(p, p.variants[0]);
  };
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
    else if (page === 'kleine-cadeaus.html') { v = ['Naamsleutelhanger', 'Rechthoekige sleutelhanger', 'Stervormig cadeaulabel', 'Rechthoekig cadeaulabel'].indexOf($('input[name="model"]:checked', form)?.value); qty = num('#kg-qty'); }
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
    // Meta-pixel: productweergave (alleen verstuurd na cookietoestemming).
    if (window.m3dTrack) window.m3dTrack('ViewContent', { content_ids: [page], content_type: 'product', content_name: product.name || page, currency: 'EUR' });

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
      <p class="m3d-ship" style="font-weight:700;color:#d8ad43">🎄 Kerstactie: 5% korting, automatisch verrekend bij het afrekenen (t/m 31 december).</p>
      <p class="m3d-ship">Verzenden met <strong>PostNL</strong>, met track &amp; trace. Brievenbuspakje € 4,95, pakket € 9,95, gratis vanaf € 400. <a href="informatie.html#verzending">Bekijk de tarieven</a></p>
      <label class="m3d-remind" style="display:flex;gap:8px;align-items:flex-start;font-weight:400;font-size:13.5px;line-height:1.45;margin:0 0 12px"><input type="checkbox" id="m3d-herinnering" style="margin-top:3px"> <span>Stuur mij één herinnering per e-mail als ik mijn bestelling niet afreken (je e-mailadres vul je in bij het afrekenen).</span></label>
      <label class="m3d-remind" style="display:flex;gap:8px;align-items:flex-start;font-weight:400;font-size:13.5px;line-height:1.45;margin:0 0 12px"><input type="checkbox" id="m3d-nieuwsbrief" style="margin-top:3px"> <span>Houd mij op de hoogte van nieuwe producten (hooguit één mail per week; je krijgt eerst een bevestigingsmail).</span></label>
      <button type="button" class="m3d-pay-btn">Direct afrekenen →</button>
      <span class="m3d-pm">iDEAL · Bancontact · creditcard — veilig betalen via Stripe</span>
      <small class="m3d-legal-note"><strong>Levertijd:</strong> <span class="m3d-lead"></span>. <strong>Maatwerk:</strong> kies je personalisatie (naam, tekst, logo, eigen ontwerp of eigen maat), dan wordt het product speciaal voor jou gemaakt en geldt geen herroepingsrecht. Zonder personalisatie heb je 14 dagen bedenktijd. Met afrekenen ga je akkoord met de <a href="algemene-voorwaarden.html">algemene voorwaarden</a>.</small>
      <div class="m3d-msg" role="alert"></div>`;
    const submit = form.querySelector('button[type="submit"]');
    (submit?.parentElement === form ? submit : form.lastElementChild)?.insertAdjacentElement('beforebegin', box);
    // Oude teksten "online betalen is nog niet actief" verbergen.
    form.querySelectorAll('p, div, small').forEach((n) => { if (/online betalen is nog niet (actief|beschikbaar)/i.test(n.textContent) && !n.querySelector('form, input, button')) n.hidden = true; });

    // Levertijd onder de betaalknop, past zich aan aan het gekozen formaat.
    const leadEl = box.querySelector('.m3d-lead');
    const updLead = () => { const c = readChoice(form); leadEl.textContent = leadText(product, product.variants[c.v]); };
    updLead(); form.addEventListener('change', updLead); form.addEventListener('input', updLead);

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

    // Direct afrekenen is de enige weg. De aanvraagknop, contactvelden en aanvraagteksten
    // verschijnen alleen bij een keuze zonder vaste prijs (eigen maat, maatwerk-opties).
    const reqBtns = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')].filter((b) => !box.contains(b));
    const REQ_TEXT = /je betaalt hier nog niet|aanvraagformulier|offerteformulier|dit is een aanvraag|je verstuurt een aanvraag|geen directe betaling|online betalen is nog niet|via de knop kun je een aanvraag|liever eerst overleggen|gewenste (lever)?datum is (nog )?geen/i;
    const fieldWrap = (el) => {
      const l = el.closest('label');
      if (l && form.contains(l) && l.querySelectorAll('input, select, textarea').length === 1) return l;
      const p = el.parentElement;
      if (p && p !== form && p.querySelectorAll('input, select, textarea').length === 1) return p;
      return el;
    };
    const reqOnly = new Set();
    form.querySelectorAll('p, small, .notice, .hint').forEach((n) => { if (!box.contains(n) && !n.querySelector('input, select, textarea, button') && REQ_TEXT.test(n.textContent)) reqOnly.add(n); });
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
      const isContact = /^(name|email|tel)$/.test(ac) || (el.type === 'email' && !box.contains(el));
      const isConsent = el.type === 'checkbox' && el.required && /toestemming|akkoord|consent/i.test((el.closest('label')?.textContent || '') + el.id + el.name);
      const isDate = el.type === 'date';
      if (!box.contains(el) && (isContact || isConsent || isDate)) {
        reqOnly.add(fieldWrap(el));
        if (el.id) form.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach((l) => reqOnly.add(l));
      }
    });
    const setMode = () => {
      const c = readChoice(form), vr = product.variants[c.v];
      const soft = !!c.block || (vr && !vr.firm) || c.addons.some((i) => !product.addons[i]?.firm);
      reqBtns.forEach((b) => { b.hidden = !soft; });
      reqOnly.forEach((n) => { n.hidden = !soft; });
      btn.hidden = soft;
      box.querySelector('.m3d-pm').hidden = soft;
      msg.textContent = soft ? (c.block || 'Voor deze keuze maken we eerst een prijsvoorstel.') + ' Gebruik de aanvraagknop hieronder.' : '';
    };
    setMode(); form.addEventListener('change', setMode); form.addEventListener('input', setMode);
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
      const needFile = form.querySelector('input[type="file"][data-m3d-required]');
      if (needFile && !needFile.files.length) { msg.textContent = 'Upload eerst je logo om direct af te rekenen.'; needFile.focus(); return; }
      const fd = new FormData(form);
      ['_subject', '_captcha', 'Prijsstatus', 'quote-price', 'quote-unit'].forEach((k) => fd.delete(k));
      fd.set('_product', page);
      fd.set('_variant', String(c.v));
      fd.set('_addons', c.addons.join(','));
      fd.set('_qty', String(Math.min(100, Math.max(1, c.qty))));
      fd.set('_delivery', 'ship');
      if (document.getElementById('m3d-herinnering')?.checked) fd.set('_herinnering', '1');
      if (document.getElementById('m3d-nieuwsbrief')?.checked) fd.set('_nieuwsbrief', '1');
      try { const b = JSON.parse(sessionStorage.getItem('m3d_bron') || 'null'); if (b && b.s) fd.set('_bron', String(b.s).slice(0, 20)); } catch (e) { /* negeren */ }
      for (const id of ['personalization', 'notes', 'personal-text', 'kt-names', 'kt-notes', 'kt-color', 'naam', 'tekst', 'datum']) {
        const el = document.getElementById(id); if (el && el.value && !el.name) fd.set(id, el.value);
      }
      // Meta-pixel: start afrekenen; bedrag bewaren voor de Purchase-gebeurtenis op bedankt.html.
      const m3dQty = Math.min(100, Math.max(1, c.qty));
      const m3dData = { content_ids: [page], content_type: 'product', num_items: m3dQty, value: Math.round((variant.cents + c.addons.reduce((t, i) => t + (product.addons[i]?.cents || 0), 0)) * m3dQty * (Date.now() < Date.parse('2027-01-01T00:00:00+01:00') ? 0.95 : 1)) / 100, currency: 'EUR' };
      try { sessionStorage.setItem('m3d_checkout', JSON.stringify(m3dData)); } catch (e) { /* negeren */ }
      if (window.m3dTrack) window.m3dTrack('InitiateCheckout', m3dData);
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
