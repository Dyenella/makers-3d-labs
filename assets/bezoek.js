/* Makers 3D Labs — anonieme bezoekersteller (geen cookies, geen IP-adres, geen persoonsgegevens).
   Telt paginaweergaven en de bron van het bezoek (Facebook, Instagram, Google, direct).
   De bron van dit bezoek wordt alleen voor dit tabblad bewaard (sessionStorage) en meegegeven bij afrekenen. */
(() => {
  'use strict';
  if (navigator.webdriver) return;
  const URL_FN = 'https://dwirzzslswqjqnwthlyn.supabase.co/functions/v1/bezoek';
  const KEY = 'm3d_bron';
  const q = new URLSearchParams(location.search);
  function detect() {
    const utm = (q.get('utm_source') || '').toLowerCase();
    if (/^(fb|facebook)/.test(utm)) return 'facebook';
    if (/^(ig|instagram)/.test(utm)) return 'instagram';
    if (utm === 'google') return 'google';
    if (/mail|nieuwsbrief/.test(utm)) return 'email';
    if (q.has('fbclid')) return 'facebook';
    if (q.has('gclid')) return 'google';
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { ref = ''; }
    if (!ref || /(^|\.)makers3dlabs\.nl$/.test(ref) || /checkout\.stripe\.com$/.test(ref)) return null;
    if (/facebook\.com$|fb\.me$|fb\.com$/.test(ref)) return 'facebook';
    if (/instagram\.com$/.test(ref)) return 'instagram';
    if (/(^|\.)google\./.test(ref)) return 'google';
    if (/bing\.com$/.test(ref)) return 'bing';
    if (/tiktok\.com$/.test(ref)) return 'tiktok';
    if (/pinterest\./.test(ref)) return 'pinterest';
    return 'overig';
  }
  let stored = null;
  try { stored = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { stored = null; }
  const fresh = detect();
  const isNew = !stored;
  const bron = stored ? stored.s : (fresh || 'direct');
  const campaign = stored ? stored.c : (q.get('utm_campaign') || '');
  if (isNew) { try { sessionStorage.setItem(KEY, JSON.stringify({ s: bron, c: campaign })); } catch (e) { /* negeren */ } }
  const w = Math.min(screen.width || innerWidth, innerWidth || 9999);
  const device = /iPad|Tablet/i.test(navigator.userAgent) || (w >= 600 && w < 1024 && 'ontouchstart' in window) ? 'tablet' : (w < 600 ? 'mobiel' : 'desktop');
  const body = JSON.stringify({ p: location.pathname, s: bron, c: campaign, d: device, n: isNew });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(URL_FN, new Blob([body], { type: 'text/plain' }));
    else fetch(URL_FN, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } });
  } catch (e) { /* teller mag de site nooit hinderen */ }
})();
