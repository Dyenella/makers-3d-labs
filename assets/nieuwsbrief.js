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
.m3d-nb{background:#1f2937;color:#fff;border-top:4px solid #00b4bd;padding:34px 18px;margin-top:40px;font-family:inherit}
.m3d-nb-in{max-width:980px;margin:0 auto;display:flex;flex-wrap:wrap;gap:18px 32px;align-items:center;justify-content:space-between}
.m3d-nb h2{margin:0 0 6px;font-size:22px;color:#fff}.m3d-nb p{margin:0;color:#cfe3e6;font-size:15px;line-height:1.5;max-width:460px}
.m3d-nb form{display:flex;flex-wrap:wrap;gap:10px;flex:1 1 340px;max-width:460px}
.m3d-nb input[type=email]{flex:1 1 220px;min-width:0;padding:13px 14px;border-radius:10px;border:1px solid #3b4a5a;background:#fff;color:#102027;font-size:15px}
.m3d-nb button{padding:13px 20px;border:0;border-radius:10px;background:#00b4bd;color:#fff;font-weight:700;font-size:15px;cursor:pointer}
.m3d-nb button:disabled{opacity:.6;cursor:default}
.m3d-nb small{flex-basis:100%;color:#9fb3b8;font-size:12.5px;line-height:1.45}.m3d-nb small a{color:#cfe3e6}
.m3d-nb .m3d-nb-msg{flex-basis:100%;font-size:14.5px;font-weight:700;color:#7ee7ec;min-height:1em}
.m3d-nb .m3d-nb-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.m3d-nb-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;background:#1f2937;color:#fff;border-left:5px solid #00b4bd;padding:14px 18px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:15px;max-width:92vw}`;
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
    const sec = document.createElement('section'); sec.className = 'm3d-nb'; sec.setAttribute('aria-label', 'Nieuwe producten per e-mail');
    sec.innerHTML = `<div class="m3d-nb-in"><div><h2>Blijf op de hoogte van nieuwe producten</h2><p>Eén keer per week een mail met wat er nieuw is in onze webshop. Alleen als er iets nieuws is, en je meldt je met één klik weer af.</p></div>
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
