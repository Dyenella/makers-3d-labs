(()=>{'use strict';
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
})();