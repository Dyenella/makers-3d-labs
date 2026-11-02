from pathlib import Path
import re, shutil

root=Path.cwd()
names=['categorie-maskers.html','masker-oni-klassiek.html','masker-oni-ornament.html']
if not all((root/n).exists() for n in names):
    raise SystemExit('Open eerst de map makers-3d-labs.')
source=root/'masker-oni-model.webp'
if not source.exists() or source.read_bytes()[:4]!=b'RIFF':
    raise SystemExit('masker-oni-model.webp ontbreekt of is ongeldig. Er is niets gewijzigd.')
contents={n:(root/n).read_text(encoding='utf-8') for n in names}
page=contents['masker-oni-ornament.html']
# Bedragen én berekening bijwerken; personalisatietoeslag blijft gelijk.
for old,new in [('16995','14995'),('9995','7995'),('7495','5495'),('€169,95','€149,95'),('€99,95','€79,95'),('€74,95','€54,95')]:
    page=page.replace(old,new)
contents['masker-oni-ornament.html']=page
cat=contents['categorie-maskers.html']
def update_card(match):
    card=match.group()
    if 'data-name="Oni Ornament"' in card:
        card=card.replace('data-price="7495"','data-price="5495"').replace('€74,95','€54,95')
    return card
contents['categorie-maskers.html']=re.sub(r'<article\b[^>]*>.*?</article>',update_card,cat,flags=re.S)
for name,text in contents.items():
    (root/(name+'.before-mask-fix.bak')).write_bytes((root/name).read_bytes())
    (root/name).write_text(text.replace('masker-oni-model.webp','masker-oni-klassiek-foto.webp'),encoding='utf-8')
shutil.copyfile(source,root/'masker-oni-klassiek-foto.webp')
print('Klaar: foto opnieuw gekoppeld. Oni Ornament: 54,95 / 79,95 / vanaf 149,95. Nog niet gepubliceerd.')
