from pathlib import Path
from html import escape, unescape
from urllib.parse import unquote
import re

p=Path('index.html')
text=p.read_text(encoding='utf-8')
category=Path('categorie-voetbal.html').read_text(encoding='utf-8')
slides=[];seen=set()
for card in re.findall(r'<article\b[\s\S]*?</article>',category):
    href=re.search(r'class="category-product-photo"\s+href="([^"]+)"',card)
    image=re.search(r'<img\b[^>]*src="([^"]+)"',card)
    title=re.search(r'<h2>([\s\S]*?)</h2>',card)
    price=re.search(r'data-price="(\d+)"',card)
    if not all((href,image,title,price)):continue
    link=unescape(href[1])
    if not (link.startswith('stadion-') or link=='voetbalstadion-deluxe.html') or link in seen:continue
    src=unescape(image[1])
    if not Path(unquote(src)).is_file() or not Path(link).is_file():
        raise SystemExit('Bestand ontbreekt: '+src+' of '+link+'. Er is niets gewijzigd.')
    seen.add(link)
    name=unescape(re.sub('<[^>]+>','',title[1]))
    if link=='voetbalstadion-deluxe.html':name='De Kuip — Feyenoord Rotterdam'
    cents=int(price[1]);amount=f'{cents//100:,}'.replace(',','.')+f',{cents%100:02}'
    hidden=' hidden' if slides else ''
    slides.append(f'<article class="m3-slide"{hidden} aria-label="{escape(name)}"><div class="m3-slide-image"><img src="{escape(src)}" alt="Voorbeeldmodel van {escape(name)}" loading="lazy" width="1254" height="1254"></div><div class="m3-slide-info"><span class="m3-tag">Collectie voetbalstadions · handgeschilderd</span><h3>{escape(name)}</h3><p>Een handgeschilderd stadionmodel met optionele personalisatie. Bekijk de productpagina voor de uitvoering en afmetingen.</p><div class="m3-price">Vanaf € {amount} <small style="font-size:12px;color:#c4dbd7">incl. btw</small></div><a href="{escape(link)}">Bekijk dit stadion ↗</a></div></article>')
if len(slides)<2:raise SystemExit('Onvoldoende stadions gevonden. Niets gewijzigd.')
text,count=re.subn(r'(<div class="m3-track" id="m3-slide-track">)[\s\S]*?(</div>\s*</div>\s*<div class="m3-carousel-actions">)',lambda m:m[1]+''.join(slides)+m[2],text,count=1)
if count!=1:raise SystemExit('Stadionslideshow niet gevonden. Niets gewijzigd.')
text=re.sub(r'<style id="stadions-home-slideshow">[\s\S]*?</style>','',text)
text=re.sub(r'<script id="stadions-home-slideshow-js">[\s\S]*?</script>','',text)
css='''<style id="stadions-home-slideshow">
#webshop-uitgelicht .m3-slide[hidden]{display:none!important}
#webshop-uitgelicht .m3-track{transform:none!important}
#webshop-uitgelicht .m3-slide{width:100%;flex:0 0 100%;animation:stadium-reveal .65s ease both}
#webshop-uitgelicht .m3-slide-image img{object-fit:contain}
#webshop-uitgelicht .m3-carousel-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#webshop-uitgelicht .m3-carousel-actions button{cursor:pointer}
@keyframes stadium-reveal{from{opacity:.25}to{opacity:1}}
@media(prefers-reduced-motion:reduce){#webshop-uitgelicht .m3-slide{animation:none}}
</style>'''
js='''<script id="stadions-home-slideshow-js">
(()=>{const root=document.getElementById('webshop-uitgelicht');if(!root)return;
const slides=[...root.querySelectorAll('#m3-slide-track > .m3-slide')];if(slides.length<2)return;
const count=root.querySelector('#m3-slide-count');
let prev=root.querySelector('#m3-prev'),next=root.querySelector('#m3-next');
if(!prev||!next||!count)return;
// Replace the navigation nodes so only this carousel controls them.
for(const old of [prev,next]){const fresh=old.cloneNode(true);fresh.disabled=false;fresh.type='button';old.replaceWith(fresh);}
prev=root.querySelector('#m3-prev');next=root.querySelector('#m3-next');
let pause=root.querySelector('[data-stadium-pause]');
if(!pause){pause=document.createElement('button');pause.type='button';pause.dataset.stadiumPause='';next.after(pause);}
const motion=matchMedia('(prefers-reduced-motion: reduce)');let index=0,paused=motion.matches,timer;
function show(i,manual=false){index=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.hidden=n!==index);count.textContent=(index+1)+' / '+slides.length+' stadions';count.setAttribute('aria-live',manual?'polite':'off');}
function schedule(){clearInterval(timer);pause.textContent=paused?'Afspelen':'Pauzeren';pause.setAttribute('aria-label',paused?'Stadionslideshow afspelen':'Stadionslideshow pauzeren');if(!paused&&!document.hidden&&!root.matches(':hover')&&!root.contains(document.activeElement))timer=setInterval(()=>show(index+1),5000);}
prev.addEventListener('click',()=>{show(index-1,true);schedule();});next.addEventListener('click',()=>{show(index+1,true);schedule();});pause.addEventListener('click',()=>{paused=!paused;schedule();});
root.addEventListener('mouseenter',()=>clearInterval(timer));root.addEventListener('mouseleave',schedule);root.addEventListener('focusin',()=>clearInterval(timer));root.addEventListener('focusout',()=>setTimeout(schedule,0));document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',e=>{paused=e.matches;schedule();});show(0);schedule();})();
</script>'''
text=text.replace('</head>',css+'</head>',1).replace('</body>',js+'</body>',1)
p.write_text(text,encoding='utf-8')
print(f'Klaar: {len(slides)} unieke stadions in de grote slideshow. Iedere 5 seconden een ander stadion. Nog niet gepubliceerd.')
