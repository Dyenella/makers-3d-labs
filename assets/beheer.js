(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  const config = window.MAKERS_CUSTOMER_CONFIG || {};
  const FN = config.url + '/functions/v1/beheer-uitnodiging';
  const state = { client: null, user: null, customers: [], current: null, tab: 'quote' };
  const money = (c) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(c || 0) / 100);
  const date = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('nl-NL'); };
  const msg = (t) => { el('bh-message').textContent = t || ''; };
  const node = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const ORDER_STATUS = { received: 'Ontvangen', confirmed: 'Bevestigd', in_production: 'In productie', shipped: 'Verzonden', completed: 'Afgerond', cancelled: 'Geannuleerd' };
  const QUOTE_STATUS = { sent: 'Verstuurd', accepted: 'Geaccepteerd', declined: 'Afgewezen', expired: 'Verlopen' };
  const INVOICE_STATUS = { issued: 'Uitgegeven', paid: 'Betaald', credited: 'Gecrediteerd' };
  const PREFIX = { quote: 'OFF', invoice: 'FAC', order: 'BST' };

  function suggestNumber() {
    const d = new Date(); const p = (n) => String(n).padStart(2, '0');
    el('bh-number').value = `${PREFIX[state.tab]}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }

  function cents(value) {
    const v = String(value).trim().replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.bh-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    document.querySelectorAll('#bh-form [data-only]').forEach((d) => { d.hidden = !d.dataset.only.split(' ').includes(tab); });
    el('bh-save').textContent = { quote: 'Offerte opslaan en klant mailen', invoice: 'Factuur opslaan en klant mailen', order: 'Bestelling opslaan en klant mailen' }[tab];
    suggestNumber();
  }

  function renderCustomers() {
    const q = el('bh-search').value.trim().toLowerCase();
    const list = el('bh-customers'); list.replaceChildren();
    const rows = state.customers.filter((c) => !q || [c.email, c.full_name, c.company].join(' ').toLowerCase().includes(q));
    if (!rows.length) { list.append(node('li', 'Geen klanten gevonden.', 'bh-empty')); return; }
    for (const c of rows) {
      const li = node('li'); const b = node('button', c.full_name || c.email, 'bh-pick'); b.type = 'button';
      if (state.current?.user_id === c.user_id) b.setAttribute('aria-current', 'true');
      b.append(node('small', [c.full_name ? c.email : '', c.company].filter(Boolean).join(' · ') || 'Klant sinds ' + date(c.created_at)));
      b.addEventListener('click', () => pick(c));
      li.append(b); list.append(li);
    }
  }

  async function loadCustomers() {
    const { data, error } = await state.client.rpc('makers_admin_customers');
    if (error) { msg('De klantenlijst kon niet worden geladen.'); return; }
    state.customers = data || []; renderCustomers();
  }

  async function pick(c) {
    state.current = c; renderCustomers();
    el('bh-customer-title').textContent = '2. ' + (c.full_name || c.email);
    el('bh-customer-info').textContent = [c.email, c.company, c.phone].filter(Boolean).join(' · ');
    el('bh-forms').hidden = false; setTab(state.tab); await loadRecords();
  }

  async function loadRecords() {
    const box = el('bh-records'); box.replaceChildren(node('p', 'Laden…', 'bh-empty'));
    const id = state.current.user_id;
    const [q, i, o] = await Promise.all([
      state.client.from('customer_quotes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      state.client.from('customer_invoices').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      state.client.from('customer_orders').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ]);
    if (q.error || i.error || o.error) { box.replaceChildren(node('p', 'Kon de gegevens niet laden.', 'bh-empty')); return; }
    const all = [
      ...(o.data || []).map((r) => ({ ...r, _kind: 'order' })),
      ...(q.data || []).map((r) => ({ ...r, _kind: 'quote' })),
      ...(i.data || []).map((r) => ({ ...r, _kind: 'invoice' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    box.replaceChildren();
    if (!all.length) { box.append(node('p', 'Nog niets voor deze klant.', 'bh-empty')); return; }
    for (const r of all) box.append(recordCard(r));
  }

  function recordCard(r) {
    const card = node('article', undefined, 'bh-record');
    const head = node('div', undefined, 'bh-record-head');
    const left = node('div'); left.append(node('span', { order: 'Bestelling', quote: 'Offerte', invoice: 'Factuur' }[r._kind], 'bh-kind'), node('br'), node('strong', r.number));
    head.append(left, node('strong', money(r.total_cents)));
    card.append(head, node('p', r.title), node('p', 'Datum: ' + date(r.created_at)));
    if (r.file_path) card.append(node('p', 'PDF toegevoegd'));
    const map = r._kind === 'order' ? ORDER_STATUS : r._kind === 'quote' ? QUOTE_STATUS : INVOICE_STATUS;
    const table = { order: 'customer_orders', quote: 'customer_quotes', invoice: 'customer_invoices' }[r._kind];
    const sel = node('select'); sel.setAttribute('aria-label', 'Status ' + r.number);
    for (const [v, t] of Object.entries(map)) { const op = node('option', t); op.value = v; if (v === r.status) op.selected = true; sel.append(op); }
    if (!map[r.status]) { const op = node('option', r.status); op.value = r.status; op.selected = true; sel.prepend(op); }
    sel.addEventListener('change', async () => {
      sel.disabled = true;
      const { error } = await state.client.from(table).update({ status: sel.value }).eq('id', r.id);
      sel.disabled = false;
      msg(error ? 'Status wijzigen is niet gelukt.' : (r._kind === 'order' ? 'Status bijgewerkt. De klant krijgt een e-mail.' : 'Status bijgewerkt.'));
    });
    const lab = node('label', 'Status'); lab.style.marginTop = '6px';
    card.append(lab, sel);
    if (r._kind === 'order') {
      const pay = node('select'); pay.setAttribute('aria-label', 'Betaling ' + r.number);
      for (const [v, t] of Object.entries({ open: 'Openstaand', paid: 'Betaald' })) { const op = node('option', 'Betaling: ' + t); op.value = v; if (v === r.payment_status) op.selected = true; pay.append(op); }
      pay.addEventListener('change', async () => {
        const { error } = await state.client.from('customer_orders').update({ payment_status: pay.value }).eq('id', r.id);
        msg(error ? 'Betaalstatus wijzigen is niet gelukt.' : 'Betaalstatus bijgewerkt.');
      });
      card.append(pay);
      const tt = node('div'); tt.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px';
      const car = node('select'); car.setAttribute('aria-label', 'Vervoerder ' + r.number);
      for (const v of ['', 'PostNL', 'DHL']) { const op = node('option', v || 'Vervoerder…'); op.value = v; if (v === (r.carrier || '')) op.selected = true; car.append(op); }
      const code = node('input'); code.placeholder = 'Track & trace-code'; code.value = r.tracking_code || ''; code.maxLength = 60; code.style.flex = '1';
      const pc = node('input'); pc.placeholder = 'Postcode'; pc.value = r.ship_postcode || ''; pc.maxLength = 12; pc.style.width = '90px';
      const save = node('button', 'Opslaan'); save.type = 'button';
      save.addEventListener('click', async () => {
        save.disabled = true;
        const { error } = await state.client.from('customer_orders').update({ carrier: car.value || null, tracking_code: code.value.trim() || null, ship_postcode: pc.value.replace(/\s/g, '').toUpperCase() || null }).eq('id', r.id);
        save.disabled = false;
        msg(error ? 'Opslaan is niet gelukt.' : 'Track & trace opgeslagen. Zet de status daarna op "Verzonden": de klant krijgt dan een mail met de volg-link.');
      });
      tt.append(car, code, pc, save);
      const tl = node('label', 'Verzending'); tl.style.marginTop = '6px';
      card.append(tl, tt);
    }
    return card;
  }

  async function save(e) {
    e.preventDefault();
    if (!state.current) return;
    const btn = el('bh-save'); btn.disabled = true; msg('');
    try {
      const total = cents(el('bh-total').value);
      if (total === null) throw new Error('Vul een geldig bedrag in, bijvoorbeeld 49,95.');
      const uid = state.current.user_id;
      const row = { user_id: uid, number: el('bh-number').value.trim(), title: el('bh-title').value.trim(), total_cents: total };
      if (!row.number || !row.title) throw new Error('Vul nummer en omschrijving in.');
      const file = el('bh-pdf').files[0];
      if (file && state.tab !== 'order') {
        if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) throw new Error('Kies een PDF van maximaal 10 MB.');
        const path = `${uid}/${crypto.randomUUID()}.pdf`;
        const up = await state.client.storage.from('customer-documents').upload(path, file, { contentType: 'application/pdf' });
        if (up.error) throw new Error('De PDF kon niet worden geüpload.');
        row.file_path = path;
      }
      let table = 'customer_quotes';
      if (state.tab === 'invoice') { table = 'customer_invoices'; const on = el('bh-order-number').value.trim(); if (on) row.order_number = on; }
      if (state.tab === 'order') {
        table = 'customer_orders';
        row.payment_status = el('bh-pay').value;
        row.items = el('bh-items').value.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 50).map((l) => {
          const m = l.match(/^(\d+)\s*[x×]\s*(.+)$/i);
          return m ? { quantity: Number(m[1]), name: m[2].slice(0, 200) } : { quantity: 1, name: l.slice(0, 200) };
        });
      }
      const { error } = await state.client.from(table).insert(row);
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'Dit nummer bestaat al. Kies een ander nummer.' : 'Opslaan is niet gelukt.');
      e.target.reset(); setTab(state.tab);
      msg('Opgeslagen. ' + (state.current.full_name || state.current.email) + ' krijgt een e-mail.');
      await loadRecords();
    } catch (err) { msg(err.message || 'Er ging iets mis.'); }
    finally { btn.disabled = false; }
  }

  async function invite(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true;
    try {
      const { data: s } = await state.client.auth.getSession();
      const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.session.access_token, apikey: config.publishableKey }, body: JSON.stringify({ email: el('bh-invite-email').value, name: el('bh-invite-name').value }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Uitnodigen is niet gelukt.');
      msg('Uitnodiging verstuurd naar ' + j.email + '.'); e.target.reset(); await loadCustomers();
    } catch (err) { msg(err.message); }
    finally { btn.disabled = false; }
  }

  async function showUser(user) {
    state.user = user;
    if (!user) { el('bh-app').hidden = true; el('bh-login').hidden = false; msg('Log in met je beheerdersaccount.'); return; }
    const { data: ok } = await state.client.rpc('is_makers_admin');
    if (!ok) { el('bh-app').hidden = true; el('bh-login').hidden = true; msg('Dit account heeft geen beheerrechten.'); return; }
    el('bh-login').hidden = true; el('bh-app').hidden = false; msg('');
    el('bh-who').textContent = 'Ingelogd als ' + user.email;
    await loadCustomers();
  }

  async function start() {
    if (!config.url || !config.publishableKey) { msg('De klantomgeving is niet ingesteld.'); return; }
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.81.1');
    state.client = createClient(config.url, config.publishableKey, { auth: { persistSession: true, storage: window.sessionStorage, autoRefreshToken: true, detectSessionInUrl: true } });
    state.client.auth.onAuthStateChange((_e, session) => { setTimeout(() => { if ((session?.user?.id || null) !== (state.user?.id || null)) showUser(session?.user || null); }, 0); });
    const { data } = await state.client.auth.getUser();
    await showUser(data.user || null);
  }

  el('bh-login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const b = el('bh-login-submit'); b.disabled = true;
    const { error } = await state.client.auth.signInWithOtp({ email: el('bh-login-email').value.trim(), options: { shouldCreateUser: true, emailRedirectTo: location.origin + '/beheer.html' } });
    el('bh-login-msg').textContent = error ? 'De inloglink kon niet worden verstuurd.' : 'Kijk in je mail en open de inloglink in deze browser.';
    b.disabled = false;
  });
  el('bh-signout').addEventListener('click', async () => { await state.client.auth.signOut(); state.user = null; showUser(null); });
  el('bh-search').addEventListener('input', renderCustomers);
  document.querySelectorAll('.bh-tabs button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
  el('bh-form').addEventListener('submit', save);
  el('bh-invite-form').addEventListener('submit', invite);
  start().catch(() => msg('Het beheer kon niet worden geladen.'));
})();
