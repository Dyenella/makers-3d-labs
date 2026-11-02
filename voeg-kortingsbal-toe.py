from pathlib import Path
import re

p = Path('index.html')
if not p.exists():
    raise SystemExit('Open eerst de map makers-3d-labs.')
text = p.read_text(encoding='utf-8')
markup = '''<aside id="kerst-kortingsbal" class="discount-bauble" aria-label="Kerstactie: 5% korting op alle artikelen" hidden>
<button class="discount-close" type="button" aria-label="Kerstactie sluiten">×</button>
<a class="discount-ball" href="winkel.html"><span class="discount-cap" aria-hidden="true"></span><span class="discount-copy"><strong>KERST</strong><span>Pak je</span><b>5%</b><span>korting</span><small>op alle artikelen</small></span></a>
</aside>'''
style = '''<style id="kerst-kortingsbal-css">
.discount-bauble{position:fixed;right:22px;top:120px;width:182px;height:202px;z-index:900;filter:drop-shadow(0 12px 16px #0005);animation:discount-fall 1.6s cubic-bezier(.18,.75,.3,1) both}
.discount-bauble[hidden]{display:none!important}
.discount-ball{position:absolute;bottom:0;left:0;width:182px;height:182px;border-radius:50%;display:grid;place-items:center;color:#fff5df!important;text-align:center;text-decoration:none!important;background:radial-gradient(ellipse at 28% 22%,#ffcad080 0,transparent 32%),radial-gradient(circle at 65% 75%,#550a19,transparent 65%),linear-gradient(140deg,#e12f49,#a00e2b 60%,#630d22);border:1px solid #f9b6a370;box-shadow:inset -10px -12px 22px #3b001950,inset 3px 3px 16px #ffccd540;isolation:isolate;animation:discount-sway 5s ease-in-out 1.6s infinite alternate;transform-origin:50% -30px}
.discount-ball::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle,#ffe6bc 0 1px,transparent 1.8px) 0 0/17px 21px,radial-gradient(circle,#ffffffb0 0 .7px,transparent 1.5px) 8px 9px/23px 19px;opacity:.45;z-index:-1;animation:discount-glitter 3.5s ease-in-out infinite alternate}
.discount-cap{position:absolute;top:-13px;left:calc(50% - 18px);width:36px;height:17px;border-radius:5px 5px 2px 2px;background:repeating-linear-gradient(90deg,#ad8133 0 3px,#e7c674 4px 7px)}
.discount-cap::before{content:"";position:absolute;width:14px;height:13px;left:9px;top:-10px;border:2px solid #e7c674;border-radius:50%}
.discount-copy{display:flex;align-items:center;flex-direction:column;line-height:1.15;text-shadow:0 2px 4px #49071c;font-family:inherit;padding:15px}
.discount-copy strong{font-size:15px;letter-spacing:.17em}.discount-copy>span{font-size:16px}.discount-copy b{font-size:46px;line-height:1.05;margin:3px 0}.discount-copy small{font-size:11px;margin-top:6px}
.discount-close{position:absolute;right:-5px;top:3px;z-index:3;width:30px;height:30px;border-radius:50%;background:#263243;color:#fff;border:1px solid #c4d4df;font:22px/1 sans-serif;cursor:pointer;box-shadow:0 3px 10px #0004}
.discount-bauble a:focus-visible,.discount-close:focus-visible{outline:3px solid #8ce1e4;outline-offset:4px}
@keyframes discount-fall{0%{transform:translateY(-430px) rotate(-10deg);opacity:0}65%{transform:translateY(12px) rotate(4deg);opacity:1}85%{transform:translateY(-7px) rotate(-2deg)}100%{transform:translateY(0) rotate(0)}}
@keyframes discount-sway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes discount-glitter{from{opacity:.25}to{opacity:.65}}
@media(max-width:700px){.discount-bauble{right:12px;top:95px;width:142px;height:162px}.discount-ball{width:142px;height:142px}.discount-copy strong{font-size:12px}.discount-copy>span{font-size:13px}.discount-copy b{font-size:36px}.discount-copy small{font-size:9px}}
@media(prefers-reduced-motion:reduce){.discount-bauble,.discount-ball,.discount-ball::before{animation:none}}
</style>'''
script = '''<script id="kerst-kortingsbal-js">(()=>{const ball=document.getElementById('kerst-kortingsbal');if(!ball)return;let dismissed=false;try{dismissed=sessionStorage.getItem('kerst-kortingsbal-dicht')==='1';}catch(e){}if(!dismissed)ball.hidden=false;ball.querySelector('.discount-close').addEventListener('click',()=>{ball.hidden=true;try{sessionStorage.setItem('kerst-kortingsbal-dicht','1');}catch(e){}});})();</script>'''
text = re.sub(r'<style id="kerst-kortingsbal-css">.*?</style>', '', text, flags=re.S)
text = re.sub(r'<script id="kerst-kortingsbal-js">.*?</script>', '', text, flags=re.S)
text = re.sub(r'<aside id="kerst-kortingsbal".*?</aside>', '', text, flags=re.S)
if '</head>' not in text or '</body>' not in text:
    raise SystemExit('Homepage niet herkend. Niets gewijzigd.')
Path('index.html.before-kortingsbal.bak').write_bytes(p.read_bytes())
text = text.replace('</head>', style + '</head>').replace('</body>', markup + script + '</body>')
p.write_text(text, encoding='utf-8')
print('Klaar: rode glitterkerstbal rechts, met 5% korting op alle artikelen en sluitknop. Nog niet gepubliceerd.')
