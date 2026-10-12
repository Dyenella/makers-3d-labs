"""Voeg de webshop-navigatie en footer toe aan bestaande HTML-pagina's.
Gebruik: python3 install.py in de hoofdmap van het project.
Maakt eerst backups en is veilig opnieuw uit te voeren.
"""
from pathlib import Path
import re
ROOT=Path(__file__).parent
PAGES=['index.html','producten.html','diensten.html','portfolio.html','over-ons.html','contact.html']
for name in PAGES:
    path=ROOT/name
    if not path.exists():
        print('Ontbreekt, overgeslagen:',name)
        continue
    content=path.read_text(encoding='utf-8')
    if 'assets/shop.js' in content:
        print('Al geïnstalleerd:',name)
        continue
    (ROOT/(name+'.voor-webshop.bak')).write_text(content,encoding='utf-8')
    content=re.sub(r'</head>', '<link rel="stylesheet" href="assets/shop.css">\n</head>',content,count=1,flags=re.I)
    content=re.sub(r'</body>', '<script src="assets/shop-data.js"></script>\n<script src="assets/shop.js"></script>\n</body>',content,count=1,flags=re.I)
    path.write_text(content,encoding='utf-8')
    print('Bijgewerkt:',name)
print('Klaar. Open winkel.html en controleer de nieuwe navigatie op de bestaande pagina’s.')
