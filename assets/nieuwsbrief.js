/* Makers 3D Labs — aanmelden voor de wekelijkse mail met nieuwe producten (met bevestigingsmail). */
(() => {
  'use strict';
  const FN = 'https://dwirzzslswqjqnwthlyn.supabase.co/functions/v1/nieuwsbrief';
  const page = location.pathname.split('/').pop() || 'index.html';
  const SKIP = ['account.html', 'beheer.html', 'bestellingen.html', 'facturen.html', 'offertes.html', 'adressen.html', 'bedankt.html'];

  function css() {
    if (document.getElementById('m3d-nb-css')) return;
    const s = document.createElement('style'); s.id = 'm3d-nb-css';
    s.textContent = `
html body .m3d-nb{box-sizing:border-box;width:100%;max-width:none;margin:40px 0 0!important;padding:40px 18px!important;background:#182431!important;color:#f5f7fa!important;border:0!important;border-top:3px solid #00afb8!important;font-family:inherit;text-align:left;text-indent:0;overflow:hidden}
html body .m3d-nb *{box-sizing:border-box;text-indent:0;letter-spacing:normal;text-shadow:none}
html body .m3d-nb .m3d-nb-in{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:20px 36px;align-items:center;justify-content:space-between;background:#243446;border:1px solid #ffffff20;border-radius:18px;padding:26px 24px}
html body .m3d-nb .m3d-nb-txt{flex:1 1 320px;min-width:0}
html body .m3d-nb .m3d-nb-kicker{display:block;margin:0 0 8px;color:#79d8dc;font-size:13px;font-weight:800;letter-spacing:.08em}
html body .m3d-nb h2{margin:0 0 8px!important;padding:0!important;font-size:clamp(21px,3vw,26px)!important;line-height:1.25!important;color:#ffffff!important;border:0!important;background:none!important;text-transform:none}
html body .m3d-nb p{margin:0!important;color:#c4d1dc!important;font-size:15px!important;line-height:1.55!important;max-width:480px}
html body .m3d-nb form{display:flex;flex-wrap:wrap;gap:10px;flex:1 1 340px;max-width:470px;margin:0!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important}
html body .m3d-nb input[type=email]{flex:1 1 220px;min-width:0;width:auto;margin:0!important;padding:13px 14px!important;border-radius:12px!important;border:1px solid #3d5167!important;background:#1d2936!important;color:#f5f7fa!important;font-size:15px!important;box-shadow:none!important}
html body .m3d-nb input[type=email]::placeholder{color:#8fa3b3}
html body .m3d-nb input[type=email]:focus{outline:2px solid #79d8dc;outline-offset:1px;border-color:#79d8dc!important}
html body .m3d-nb button{flex:0 0 auto;width:auto;margin:0!important;padding:13px 22px!important;border:0!important;border-radius:12px!important;background:#00afb8!important;color:#102832!important;font-weight:800!important;font-size:15px!important;cursor:pointer;box-shadow:none!important}
html body .m3d-nb button:hover{background:#79d8dc!important}
html body .m3d-nb button:disabled{opacity:.6;cursor:default}
html body .m3d-nb small{flex-basis:100%;display:block;margin:0;color:#9fb3c2!important;font-size:12.5px!important;line-height:1.45!important}
html body .m3d-nb small a{color:#79d8dc!important;text-decoration:underline}
html body .m3d-nb .m3d-nb-msg{flex-basis:100%;font-size:14.5px;font-weight:700;color:#79d8dc;min-height:0}
html body .m3d-nb .m3d-nb-msg:empty{display:none}
html body .m3d-nb .m3d-nb-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
@media(max-width:560px){html body .m3d-nb button{flex:1 1 100%}}
.m3d-nb-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;background:#182431;color:#f5f7fa;border:1px solid #ffffff20;border-left:5px solid #00afb8;padding:14px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:15px;max-width:92vw}`;
    document.head.appendChild(s);
  }

  async function send(email, source) {
    const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || 'Aanmelden is niet gelukt. Probeer het later opnieuw.');
  }
  window.m3dNieuwsbrief = send;

  function block() {
    if (SKIP.includes(page) || document.querySelector('.m3d-nb')) return;
    const sec = document.createElement('div'); sec.setAttribute('role', 'region'); sec.className = 'm3d-nb'; sec.setAttribute('aria-label', 'Nieuwe producten per e-mail');
    sec.innerHTML = `<div class="m3d-nb-in"><div class="m3d-nb-txt"><span class="m3d-nb-kicker">NIEUW IN DE WEBSHOP</span><h2>Blijf op de hoogte van nieuwe producten</h2><p>Eén keer per week een mail met wat er nieuw is in onze webshop. Alleen als er iets nieuws is, en je meldt je met één klik weer af.</p></div>
<form novalidate><input type="email" name="email" required autocomplete="email" placeholder="Je e-mailadres" aria-label="Je e-mailadres">
<span class="m3d-nb-hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></span>
<button type="submit">Aanmelden</button><span class="m3d-nb-msg" role="status" aria-live="polite"></span>
<small>Je krijgt eerst een mail om je aanmelding te bevestigen. Lees hoe we met je gegevens omgaan in onze <a href="informatie.html">privacyverklaring</a>.</small></form></div>`;
    const form = sec.querySelector('form'), msg = sec.querySelector('.m3d-nb-msg'), btn = sec.querySelector('button');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.website.value) return;
      const email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { msg.textContent = 'Vul een geldig e-mailadres in.'; return; }
      btn.disabled = true; msg.textContent = '';
      try { await send(email, 'site:' + page.replace('.html', '').slice(0, 30)); form.email.value = ''; msg.textContent = 'Bijna klaar! Check je mailbox en bevestig je aanmelding.'; }
      catch (err) { msg.textContent = err.message; }
      finally { btn.disabled = false; }
    });
    const footer = document.querySelector('footer');
    if (footer) footer.before(sec);
    else { const main = document.querySelector('main'); if (main) main.after(sec); else document.body.appendChild(sec); }
  }

  function toast() {
    const q = new URLSearchParams(location.search).get('nieuwsbrief');
    const text = q === 'bevestigd' ? 'Gelukt! Je krijgt voortaan één keer per week een mail als er nieuwe producten zijn.'
      : q === 'afgemeld' ? 'Je bent afgemeld. Je ontvangt geen mails over nieuwe producten meer.' : '';
    if (!text) return;
    const t = document.createElement('div'); t.className = 'm3d-nb-toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.appendChild(t); setTimeout(() => t.remove(), 9000);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* negeren */ }
  }

  function init() { css(); block(); toast(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
