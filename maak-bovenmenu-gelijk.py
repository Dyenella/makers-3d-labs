from pathlib import Path
import re

css = '''
#mk-unified-header{position:relative!important;top:auto!important;z-index:100!important;height:auto!important;margin:0!important;padding:20px 24px!important;background:#242b38!important;border:0!important;border-bottom:1px solid #3d4758!important;color:#f5f6fa!important;font:700 14px/1.5 Arial,sans-serif!important;box-sizing:border-box!important}
#mk-unified-header *{box-sizing:border-box!important}
#mk-unified-header .mk-menu-inner{max-width:1240px!important;margin:0 auto!important;display:flex!important;align-items:center!important;gap:24px!important}
#mk-unified-header a{text-decoration:none!important;letter-spacing:normal!important}
#mk-unified-header .mk-brand{display:block!important;margin-right:auto!important;flex-shrink:0!important}
#mk-unified-header .mk-brand img{display:block!important;width:240px!important;max-width:42vw!important;height:auto!important}
#mk-unified-header .mk-main-nav{display:flex!important;position:static!important;align-items:center!important;gap:24px!important;background:transparent!important;padding:0!important;box-shadow:none!important;max-height:none!important;overflow:visible!important;width:auto!important}
#mk-unified-header .mk-menu-link,#mk-unified-header summary{display:block!important;color:#f5f6fa!important;font:700 14px/1.5 Arial,sans-serif!important;padding:10px 0!important;cursor:pointer!important;white-space:nowrap!important}
#mk-unified-header .mk-menu-link:hover,#mk-unified-header summary:hover{color:#87ced6!important}
#mk-unified-header .mk-shop{background:#65b3be!important;color:#142932!important;padding:13px 24px!important;border-radius:30px!important}
#mk-unified-header details{position:relative!important}
#mk-unified-header summary{list-style:none!important}
#mk-unified-header summary::-webkit-details-marker{display:none!important}
#mk-unified-header .mk-service-list{position:absolute!important;top:100%!important;right:0!important;width:225px!important;padding:10px!important;background:#2b3546!important;border:1px solid #455165!important;border-radius:12px!important;box-shadow:0 12px 30px #0004!important}
#mk-unified-header .mk-service-list a{display:block!important;color:#f5f6fa!important;padding:10px!important;font:700 14px/1.5 Arial,sans-serif!important;border-radius:6px!important}
#mk-unified-header .mk-service-list a:hover{background:#39495b!important;color:#87ced6!important}
#mk-unified-header .ms-utilities{display:flex!important;position:static!important;width:auto!important;gap:8px!important;padding:0!important;background:none!important;box-shadow:none!important;max-height:none!important;overflow:visible!important}
#mk-unified-header .ms-utility{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;background:#e9f5f1!important;color:#123338!important;min-width:43px!important;min-height:43px!important;padding:10px!important;border-radius:999px!important}
#mk-unified-header .ms-utility svg{width:20px!important;height:20px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important}
#mk-unified-header .ms-badge{background:#3f7974!important;color:white!important;border-radius:50%!important;min-width:18px!important;text-align:center!important;font-size:11px!important}
#mk-unified-header .mk-mobile-toggle{display:none!important;background:none!important;color:#f5f6fa!important;border:1px solid #536174!important;border-radius:8px!important;padding:7px 11px!important;font:24px/1 Arial,sans-serif!important;cursor:pointer!important}
#mk-unified-header :focus-visible{outline:3px solid #87ced6!important;outline-offset:4px!important}
@media(max-width:850px){#mk-unified-header{padding:16px 20px!important}#mk-unified-header .mk-menu-inner{gap:12px!important;flex-wrap:wrap!important}#mk-unified-header .mk-brand img{width:200px!important}#mk-unified-header .mk-mobile-toggle{display:block!important}#mk-unified-header .mk-main-nav{display:none!important;order:5!important;width:100%!important;flex-direction:column!important;align-items:stretch!important;gap:4px!important;padding-top:12px!important}#mk-unified-header.mk-open .mk-main-nav{display:flex!important}#mk-unified-header .mk-service-list{position:static!important;width:100%!important;margin:6px 0!important;box-shadow:none!important}#mk-unified-header .mk-shop{text-align:center!important}#mk-unified-header .ms-utility{min-width:36px!important;min-height:36px!important;padding:8px!important}}
@media(prefers-reduced-motion:reduce){#mk-unified-header *{scroll-behavior:auto!important}}
'''

js = '''(()=>{'use strict';
function init(){
 if(document.getElementById('mk-unified-header'))return;
 const old=document.querySelector('body > header')||document.querySelector('header');
 const utilities=document.querySelector('.ms-utilities');
 const head=document.createElement('header');head.id='mk-unified-header';
 head.innerHTML=`<div class="mk-menu-inner"><a class="mk-brand" href="index.html" aria-label="Terug naar de homepage"><img src="makers3dlabs-logo.webp" alt="Makers 3D Labs" width="480" height="160"></a><nav class="mk-main-nav" id="mk-main-navigation" aria-label="Hoofdnavigatie"><a class="mk-menu-link" href="index.html">Home</a><details><summary>Maatwerk &amp; diensten ⌄</summary><div class="mk-service-list"><a href="diensten.html">Alle diensten</a><a href="diensten.html">3D-printen</a><a href="diensten.html">Resin</a><a href="diensten.html">Lasergraveren</a><a href="contact.html">Maatwerk aanvragen</a></div></details><a class="mk-menu-link mk-shop" href="winkel.html">Webshop</a></nav><button class="mk-mobile-toggle" type="button" aria-label="Open menu" aria-controls="mk-main-navigation" aria-expanded="false">☰</button></div>`;
 if(utilities)head.querySelector('.mk-mobile-toggle').before(utilities);
 else {const n=document.createElement('nav');n.className='ms-utilities';n.setAttribute('aria-label','Account en winkelwagen');n.innerHTML='<a class="ms-utility" href="account.html" aria-label="Mijn account">Account</a><a class="ms-utility" href="winkelwagen.html" aria-label="Winkelwagen">Winkelwagen</a>';head.querySelector('.mk-mobile-toggle').before(n);}
 if(old)old.replaceWith(head);else document.body.prepend(head);
 document.querySelectorAll('.ms-top-strip').forEach(e=>{if(!e.children.length)e.remove();});
 const button=head.querySelector('.mk-mobile-toggle');
 function close(){head.classList.remove('mk-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open menu');button.textContent='☰';head.querySelector('details').open=false;}
 button.addEventListener('click',()=>{const open=head.classList.toggle('mk-open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Sluit menu':'Open menu');button.textContent=open?'×':'☰';});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();}});
 document.addEventListener('click',e=>{if(!head.contains(e.target))close();});
 const current=location.pathname.split('/').pop()||'index.html';head.querySelectorAll('.mk-main-nav > a').forEach(a=>{if(a.getAttribute('href')===current)a.setAttribute('aria-current','page');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();'''

assets=Path('assets')
assets.mkdir(exist_ok=True)
(assets/'bovenmenu.css').write_text(css,encoding='utf-8')
(assets/'bovenmenu.js').write_text(js,encoding='utf-8')
count=0
for p in Path('.').glob('*.html'):
    text=p.read_text(encoding='utf-8')
    if '</head>' not in text or '</body>' not in text:
        continue
    text=re.sub(r'<link\b[^>]*href="assets/bovenmenu\.css(?:\?[^"]*)?"[^>]*>','',text)
    text=re.sub(r'<script\b[^>]*src="assets/bovenmenu\.js(?:\?[^"]*)?"[^>]*>\s*</script>','',text)
    text=text.replace('</head>','<link rel="stylesheet" href="assets/bovenmenu.css?v=1"></head>',1)
    text=text.replace('</body>','<script src="assets/bovenmenu.js?v=1"></script></body>',1)
    p.write_text(text,encoding='utf-8')
    count+=1
print(f'Klaar: hetzelfde bovenmenu gekoppeld aan {count} pagina’s. Publiceer nu de wijzigingen.')
