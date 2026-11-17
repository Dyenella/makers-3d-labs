/* Makers 3D Labs — Meta-pixel met voorafgaande toestemming (cookiemelding).
   De pixel laadt pas nadat de bezoeker op "Accepteren" klikt. Zonder toestemming
   wordt er niets naar Meta gestuurd. Keuze wijzigen: link "Cookie-instellingen" in de footer. */
(() => {
  'use strict';
  const PIXEL_ID = '846599798429078';
  const KEY = 'm3d_consent_marketing';      // 'granted' | 'denied'
  const MAX_AGE = 365 * 24 * 3600 * 1000;    // na 12 maanden opnieuw vragen
  const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  const queue = [];
  let loaded = false;

  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.c === 'granted' || v.c === 'denied') && Date.now() - v.t < MAX_AGE) return v.c;
    } catch (e) { /* geen opslag beschikbaar */ }
    return null;
  };
  const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify({ c, t: Date.now() })); } catch (e) { /* negeren */ } };

  function loadPixel() {
    if (loaded) return;
    loaded = true;
    /* Standaard Meta-pixelcode */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    while (queue.length) { const [ev, data] = queue.shift(); window.fbq('track', ev, data || {}); }
  }

  /* Gebeurtenis doorgeven; wacht op toestemming en vervalt bij weigeren. */
  window.m3dTrack = (ev, data) => {
    const c = read();
    if (c === 'granted' && loaded) window.fbq('track', ev, data || {});
    else if (c !== 'denied') queue.push([ev, data]);
  };

  function decide(c) {
    save(c);
    document.getElementById('m3d-cookie')?.remove();
    if (c === 'granted') loadPixel(); else queue.length = 0;
  }

  function banner() {
    if (document.getElementById('m3d-cookie')) return;
    const el = document.createElement('div');
    el.id = 'm3d-cookie';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie-instellingen');
    el.innerHTML = `
      <style>
        #m3d-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;
          background:#1d2936;color:#f4f7fb;border:1px solid #00b4bd;border-radius:16px;padding:18px 20px;
          box-shadow:0 18px 45px rgba(0,0,0,.45);font:14px/1.55 'DM Sans',Arial,sans-serif}
        #m3d-cookie strong{display:block;font-size:16px;margin-bottom:4px}
        #m3d-cookie p{margin:0 0 14px;color:#c5cdd8}
        #m3d-cookie a{color:#62d8de}
        #m3d-cookie .m3d-btns{display:flex;gap:10px;flex-wrap:wrap}
        #m3d-cookie button{flex:1 1 160px;min-height:44px;border-radius:10px;font:700 15px Arial,sans-serif;cursor:pointer}
        #m3d-cookie .m3d-yes{background:#00b4bd;border:1px solid #00b4bd;color:#092b35}
        #m3d-cookie .m3d-no{background:transparent;border:1px solid #8fa3b5;color:#f4f7fb}
        #m3d-cookie button:focus-visible{outline:3px solid #62d8de;outline-offset:3px}
      </style>
      <strong>Cookies voor advertenties</strong>
      <p>We willen graag de Meta-pixel (Facebook/Instagram) gebruiken om te meten welke advertenties werken en om relevantere advertenties te tonen. Daarbij worden gegevens over je bezoek met Meta gedeeld. Dit gebeurt alleen als je toestemming geeft. <a href="informatie.html#cookies">Meer informatie</a></p>
      <div class="m3d-btns">
        <button type="button" class="m3d-no">Weigeren</button>
        <button type="button" class="m3d-yes">Accepteren</button>
      </div>`;
    el.querySelector('.m3d-yes').addEventListener('click', () => decide('granted'));
    el.querySelector('.m3d-no').addEventListener('click', () => decide('denied'));
    document.body.appendChild(el);
  }

  /* Keuze opnieuw maken (link in de footer of #cookie-instellingen). */
  window.m3dCookieSettings = () => { try { localStorage.removeItem(KEY); } catch (e) { /* negeren */ } if (loaded) location.reload(); else banner(); };

  function footerLink() {
    const foot = document.querySelector('.ms-footer, footer');
    if (!foot || foot.querySelector('.m3d-cookie-link')) return;
    const a = document.createElement('a');
    a.href = '#cookie-instellingen';
    a.className = 'm3d-cookie-link';
    a.textContent = 'Cookie-instellingen';
    a.style.cssText = 'display:inline-block;margin:10px 0 0;font-size:13px;color:inherit;text-decoration:underline';
    a.addEventListener('click', (e) => { e.preventDefault(); window.m3dCookieSettings(); });
    (foot.querySelector('.ms-footer-links, nav, .footer-inner') || foot).appendChild(a);
  }

  /* Gebeurtenissen per pagina */
  function pageEvents() {
    if (page === 'bedankt.html') {
      const q = new URLSearchParams(location.search);
      if (q.get('betaald') === '1') {
        let data = { currency: 'EUR' };
        try { const s = JSON.parse(sessionStorage.getItem('m3d_checkout') || 'null'); if (s) data = s; sessionStorage.removeItem('m3d_checkout'); } catch (e) { /* negeren */ }
        if (typeof data.value !== 'number') data.value = 0;
        window.m3dTrack('Purchase', data);
      } else {
        window.m3dTrack('Lead', {});
      }
    }
  }

  function init() {
    const c = read();
    if (c === 'granted') loadPixel();
    else if (c === null && page !== 'beheer.html') banner();
    pageEvents();
    footerLink();
    setTimeout(footerLink, 800); // de footer wordt door shop.js na het laden opgebouwd
    if (location.hash === '#cookie-instellingen') window.m3dCookieSettings();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
