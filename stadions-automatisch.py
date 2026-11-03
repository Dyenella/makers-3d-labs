from pathlib import Path
import re
p = Path("index.html")
html = p.read_text(encoding="utf-8")
script = "<script id=\"stadions-home-slideshow-js\">\n(()=>{const root=document.getElementById('webshop-uitgelicht');if(!root)return;\nconst slides=[...root.querySelectorAll('#m3-slide-track > .m3-slide')];if(!slides.length)return;\nroot.querySelectorAll('#m3-prev,#m3-next,[data-stadium-pause]').forEach(el=>el.remove());\nconst count=root.querySelector('#m3-slide-count'),motion=matchMedia('(prefers-reduced-motion: reduce)');let index=0,timer;\nfunction show(i){index=(i+slides.length)%slides.length;slides.forEach((slide,n)=>slide.hidden=n!==index);if(count){count.textContent=(index+1)+' / '+slides.length+' stadions';count.setAttribute('aria-live','off');}}\nfunction schedule(){clearInterval(timer);if(slides.length>1&&!document.hidden&&!motion.matches)timer=setInterval(()=>show(index+1),3000);}\ndocument.addEventListener('visibilitychange',schedule);motion.addEventListener('change',schedule);show(0);schedule();})();\n</script>"
pattern = r'<script\b[^>]*id="stadions-home-slideshow-js"[^>]*>[\s\S]*?</script>'
html, count = re.subn(pattern, lambda m: script, html)
if count != 1:
    raise SystemExit("Stadionslideshow niet gevonden; niets gewijzigd.")
style = '<style id="stadions-zonder-knoppen">#webshop-uitgelicht #m3-prev,#webshop-uitgelicht #m3-next,#webshop-uitgelicht [data-stadium-pause]{display:none!important}</style>'
html = re.sub(r'<style\b[^>]*id="stadions-zonder-knoppen"[^>]*>[\s\S]*?</style>', '', html)
html = html.replace('</head>', style+'</head>', 1)
p.write_text(html, encoding="utf-8")
print("Klaar: stadionknoppen weg en automatisch wisselen elke 3 seconden. Nog niet gepubliceerd.")
