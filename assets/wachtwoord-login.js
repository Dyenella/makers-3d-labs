/* Makers 3D Labs — inloggen met e-mail en wachtwoord (klantomgeving en beheer).
   M3DAuth.mount(form, client, { redirect, register }) vervangt de inhoud van het inlogformulier. */
(() => {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `
    .m3d-auth{display:grid;gap:10px}
    .m3d-auth .m3d-tabs{display:flex;gap:6px;margin-bottom:4px}
    .m3d-auth .m3d-tabs button{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(117,218,207,.45);background:transparent;color:inherit;font-weight:700;cursor:pointer}
    .m3d-auth .m3d-tabs button[aria-selected=true]{background:#75dacf;color:#102027;border-color:#75dacf}
    .m3d-auth label{font-weight:700;font-size:14px}
    .m3d-auth input[type=email],.m3d-auth input[type=password],.m3d-auth input[type=text]{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:inherit;font:inherit}
    .m3d-auth .m3d-pw{position:relative}
    .m3d-auth .m3d-pw button{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:#75dacf;font-weight:700;cursor:pointer;font-size:13px}
    .m3d-auth .m3d-link{background:none;border:0;padding:0;color:#88d1d9;text-decoration:underline;cursor:pointer;font:inherit;font-size:14px;justify-self:start}
    .m3d-auth .m3d-check{display:flex;gap:8px;align-items:flex-start;font-size:14px}
    .m3d-auth .m3d-check input{margin-top:4px}
    .m3d-auth .m3d-msg{min-height:1.2em;font-size:14px;margin:0}
    .m3d-auth .m3d-msg.err{color:#ff9d9d}`;

  function pwField(id, label, auto) {
    return `<label for="${id}">${label}</label><div class="m3d-pw"><input type="password" id="${id}" minlength="8" maxlength="72" autocomplete="${auto}" required><button type="button" data-show="${id}">Toon</button></div>`;
  }

  function mount(form, client, opts = {}) {
    if (!document.getElementById('m3d-auth-css')) { const st = document.createElement('style'); st.id = 'm3d-auth-css'; st.textContent = CSS; document.head.append(st); }
    const redirect = opts.redirect || location.origin + location.pathname;
    form.classList.add('m3d-auth');
    form.noValidate = false;
    let mode = 'login';

    function render(m, note = '', isErr = false) {
      mode = m;
      const tabs = opts.register !== false && (m === 'login' || m === 'register')
        ? `<div class="m3d-tabs" role="tablist"><button type="button" role="tab" data-mode="login" aria-selected="${m === 'login'}">Inloggen</button><button type="button" role="tab" data-mode="register" aria-selected="${m === 'register'}">Account aanmaken</button></div>` : '';
      let body = '';
      if (m === 'login') body = `
        <label for="m3d-email">E-mailadres</label><input type="email" id="m3d-email" autocomplete="email" maxlength="180" required>
        ${pwField('m3d-pass', 'Wachtwoord', 'current-password')}
        <button type="submit" class="m3d-submit">Inloggen</button>
        <button type="button" class="m3d-link" data-mode="forgot">Wachtwoord vergeten of nog geen wachtwoord ingesteld?</button>`;
      else if (m === 'register') body = `
        <label for="m3d-name">Naam</label><input type="text" id="m3d-name" autocomplete="name" maxlength="120" required>
        <label for="m3d-email">E-mailadres</label><input type="email" id="m3d-email" autocomplete="email" maxlength="180" required>
        ${pwField('m3d-pass', 'Kies een wachtwoord (minimaal 8 tekens)', 'new-password')}
        <div class="m3d-check"><input type="checkbox" id="m3d-ok" required><label for="m3d-ok" style="font-weight:400">Ik ga akkoord met de verwerking van mijn gegevens zoals beschreven in <a href="informatie.html#privacy">Informatie &amp; voorwaarden</a>.</label></div>
        <button type="submit" class="m3d-submit">Account aanmaken</button>`;
      else if (m === 'forgot') body = `
        <p style="margin:0">Vul je e-mailadres in. Je ontvangt een link waarmee je een (nieuw) wachtwoord instelt. Heb je eerder besteld zonder wachtwoord? Dan stel je zo je wachtwoord in.</p>
        <label for="m3d-email">E-mailadres</label><input type="email" id="m3d-email" autocomplete="email" maxlength="180" required>
        <button type="submit" class="m3d-submit">Stuur mij een link</button>
        <button type="button" class="m3d-link" data-mode="login">← Terug naar inloggen</button>`;
      else if (m === 'newpass') body = `
        <p style="margin:0"><strong>Kies een nieuw wachtwoord</strong> voor je account.</p>
        ${pwField('m3d-pass', 'Nieuw wachtwoord (minimaal 8 tekens)', 'new-password')}
        ${pwField('m3d-pass2', 'Herhaal het wachtwoord', 'new-password')}
        <button type="submit" class="m3d-submit">Wachtwoord opslaan</button>`;
      form.innerHTML = tabs + body + `<p class="m3d-msg${isErr ? ' err' : ''}" role="status">${esc(note)}</p>`;
      if (opts.submitId) form.querySelector('.m3d-submit').id = opts.submitId;
    }
    const say = (t, err = false) => { const p = form.querySelector('.m3d-msg'); if (p) { p.textContent = t; p.classList.toggle('err', err); } };

    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]'); if (b) { e.preventDefault(); const email = form.querySelector('#m3d-email')?.value; render(b.dataset.mode); if (email && form.querySelector('#m3d-email')) form.querySelector('#m3d-email').value = email; return; }
      const s = e.target.closest('[data-show]'); if (s) { const i = form.querySelector('#' + s.dataset.show); i.type = i.type === 'password' ? 'text' : 'password'; s.textContent = i.type === 'password' ? 'Toon' : 'Verberg'; }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); e.stopImmediatePropagation();
      const btn = form.querySelector('.m3d-submit'); btn.disabled = true;
      const email = form.querySelector('#m3d-email')?.value.trim().toLowerCase();
      const pass = form.querySelector('#m3d-pass')?.value || '';
      try {
        if (mode === 'login') {
          const { error } = await client.auth.signInWithPassword({ email, password: pass });
          if (error) {
            if (/confirm/i.test(error.message)) say('Je e-mailadres is nog niet bevestigd. Klik op de link in de bevestigingsmail (kijk ook in je spam).', true);
            else say('E-mailadres of wachtwoord klopt niet. Heb je nog geen wachtwoord? Kies dan "Wachtwoord vergeten".', true);
          } else say('Je bent ingelogd.');
        } else if (mode === 'register') {
          const name = form.querySelector('#m3d-name').value.trim();
          const { data, error } = await client.auth.signUp({ email, password: pass, options: { emailRedirectTo: redirect, data: { full_name: name } } });
          if (error) say(/password/i.test(error.message) ? 'Kies een sterker wachtwoord van minimaal 8 tekens.' : 'Account aanmaken is niet gelukt. Probeer het later opnieuw.', true);
          else if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) { render('forgot', 'Er bestaat al een account met dit e-mailadres (bijvoorbeeld door een eerdere bestelling). Stel hieronder je wachtwoord in.'); form.querySelector('#m3d-email').value = email; }
          else if (!data.session) render('login', 'Bijna klaar! We hebben je een bevestigingsmail gestuurd. Klik op de link in die mail en log daarna in.');
          else say('Je account is aangemaakt en je bent ingelogd.');
        } else if (mode === 'forgot') {
          await client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
          render('login', 'Als er een account bestaat met dit e-mailadres, ontvang je binnen enkele minuten een link om je wachtwoord in te stellen. Kijk ook in je spam. Geen mail ontvangen? Dan is er waarschijnlijk nog geen account met dit adres: kies dan "Account aanmaken".');
        } else if (mode === 'newpass') {
          if (pass !== form.querySelector('#m3d-pass2').value) { say('De twee wachtwoorden zijn niet gelijk.', true); btn.disabled = false; return; }
          const { error } = await client.auth.updateUser({ password: pass });
          if (error) say(/same|different/i.test(error.message) ? 'Kies een ander wachtwoord dan je vorige.' : 'Opslaan is niet gelukt. Vraag een nieuwe link aan.', true);
          else { say('Je wachtwoord is opgeslagen. Je bent ingelogd.'); opts.onPasswordSet?.(); }
        }
      } catch { say('Er ging iets mis. Probeer het opnieuw.', true); }
      const b2 = form.querySelector('.m3d-submit'); if (b2) b2.disabled = false;
    }, true);

    client.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') { opts.onRecovery?.(); render('newpass'); } });
    render(/type=recovery/.test(location.hash) ? 'newpass' : 'login');
    return { render, isRecovery: () => mode === 'newpass' };
  }
  window.M3DAuth = { mount };
})();
