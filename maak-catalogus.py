import os
"""Leest alle producten met vaste prijzen uit de site en schrijft assets/catalogus.json.

Gebruik: python3 maak-catalogus.py
De catalogus is de enige bron voor prijzen bij online betalen (Stripe).
- "variants": de hoofdkeuze (formaat/uitvoering), precies één verplicht.
- "addons": extra opties die je kunt aanvinken.
- "firm": False bij "vanaf"-, "op aanvraag"- of "na goedkeuring"-prijzen; die zijn niet direct af te rekenen.
"""
import glob
import html
import json
import re
from urllib.parse import quote

SITE = "https://www.makers3dlabs.nl"
SOFT = re.compile(r"vanaf|op aanvraag|na technische goedkeuring|afhankelijk van|richtprijs|maatwerk", re.I)


def clean(t):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).strip()


def slug(t):
    t = t.lower()
    for a, b in (("é", "e"), ("ë", "e"), ("ï", "i"), ("ó", "o"), ("ö", "o"), ("ü", "u"), ("×", "x")):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:40]


def cents(txt):
    return round(float(txt.replace(".", "").replace(",", ".")) * 100)


def image_of(s, f):
    m = re.search(r'<meta property="og:image" content="([^"]+)"', s)
    if m:
        return m.group(1)
    m = re.search(r'<img[^>]+src="([^"]+\.(?:webp|png|jpe?g))"', s)
    if m and not m.group(1).startswith("http"):
        return SITE + "/" + quote(m.group(1))
    return m.group(1) if m else None


def title_of(s, f):
    if f in ("kersthangers.html", "kersthangers-bedrijfslogo.html", "persoonlijke-kersttafel.html", "handtas-bloemenvaas.html"):
        return clean(re.search(r"<title>([^<|]+)", s).group(1))
    m = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
    t = clean(m.group(1)) if m else f
    return re.sub(r"\s*\|\s*", " – ", t)


def base(f, s, cat):
    return {"id": "m3d_" + f[:-5].replace("-", "_")[:56], "file": f, "url": f"{SITE}/{f}",
            "name": title_of(s, f), "category": cat, "image": image_of(s, f), "variants": [], "addons": []}


def V(label, c, firm=True):
    return {"key": slug(label), "label": label, "cents": int(c), "firm": bool(firm)}


# Kostprijsmodel (goedgekeurd 16-11-2026): arbeid € 30/u, printeruur € 1,75, filament € 30/kg,
# 35% marge, 3% Stripe, 21% btw. Prijzen incl. btw, afgerond op ,95.
PRINT_PRICES = {  # formaat -> (wit, één kleur, volledig handgeschilderd)
    "Klein – ± 10–12 cm": (3495, 6495, 11995),
    "Middel – ± 15–20 cm": (6995, 12995, 23995),
    "Groot – ± 25–30 cm": (13495, 22495, 41495),
}
PRINT_FINISH = ("Wit / onbeschilderd", "Eén gewenste kleur", "Volledig handgeschilderd")
LASER_PRICES = {  # formaat -> (naturel met gravure, geschilderde afwerking)
    "Klein – ± 10 cm": (3995, 9995),
    "Middel – ± 20 cm": (6495, 11995),
    "Groot – ± 30 cm": (9495, 15495),
}
LASER_FINISH = ("Natuurlijk hout met gravure", "Geschilderde afwerking")

products, skipped = [], []
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    if re.search(r'name="robots"[^>]+noindex', s):
        continue
    if re.match(r"product-\d{3}-", f) and 'id="formaat"' in s and 'id="uitvoering"' in s:
        kicker = re.search(r'np-kicker">([^<·]+)', s)
        cat = kicker.group(1).strip() if kicker else "Op bestelling"
        p = base(f, s, cat)
        laser = cat.lower().startswith("laser")
        table, finishes = (LASER_PRICES, LASER_FINISH) if laser else (PRINT_PRICES, PRINT_FINISH)
        for size, prices in table.items():
            for fin, c in zip(finishes, prices):
                p["variants"].append(V(f"{size} · {fin}", c))
        p["pricing"] = "laser" if laser else "print"
        products.append(p)
        continue
    if "Prijs op aanvraag" in s:
        continue
    form = re.search(r"<form.*?</form>", s, re.S)
    fm = form.group(0) if form else ""
    p = None

    lc = re.search(r'<script id="laser-config" type="application/json">(.*?)</script>', s, re.S)
    rc = re.search(r'<script[^>]*type="application/json"[^>]*>(\{"name".*?)</script>', s, re.S)
    if lc:
        p = base(f, s, "Lasergravure")
        p["variants"] = [V(v["label"], v["cents"]) for v in json.loads(lc.group(1))["variants"]]
    elif rc and "resin" in f:
        p = base(f, s, "Resin")
        j = json.loads(rc.group(1))
        p["variants"] = [V(f'{v["name"]} – circa {v["height"]} cm', v["cents"]) for v in j["variants"]]
    elif re.search(r"stadiumBaseCents=(\d+)", s):
        p = base(f, s, "Voetbalstadions")
        b = int(re.search(r"stadiumBaseCents=(\d+)", s).group(1))
        p["variants"] = [V("Standaard – volledig handgeschilderd, gemonteerd", b)]
        p["addons"] = [V("LED-sfeerverlichting", 7995, False), V("Premium LED-verlichting", 13995, False),
                       V("Gepersonaliseerd naamplaatje", 1995), V("Afwijkende kleurwensen", 3495, False)]
    elif re.search(r"vp=\{'15':(\d+),'20':(\d+),'25':(\d+)\}", s):
        p = base(f, s, "Bloemenvazen")
        a, b, c = re.search(r"vp=\{'15':(\d+),'20':(\d+),'25':(\d+)\}", s).groups()
        p["variants"] = [V("Klein – 15 cm", a), V("Middel – 20 cm", b), V("Groot – 25 cm", c)]
    elif "const prices={'8':895" in s:
        p = base(f, s, "Kerst")
        p["variants"] = [V("8 cm", 895), V("10 cm", 1095), V("12 cm", 1395)]
    elif "prices={naamkaartje:395" in s:
        p = base(f, s, "Kerst")
        p["variants"] = [V("Naamkaartje (per gast)", 395), V("Servetring met naam (per gast)", 495),
                         V("Naamkaartje + servetring (per gast)", 795)]
    elif re.search(r'<input type="radio" name="size" value="[0-9.]+"', fm) and "nameplate" in fm:
        p = base(f, s, "Resin")
        for m in re.finditer(r'name="size" value="([0-9.]+)"[^>]*>\s*<span>\s*([^<–]+?)\s*–', fm):
            p["variants"].append(V(m.group(2).strip(), round(float(m.group(1)) * 100)))
        a = re.search(r"naamplaatje \+ € ?([0-9]+,[0-9]{2})", clean(fm), re.I)
        if a:
            p["addons"].append(V("Gepersonaliseerd naamplaatje", cents(a.group(1))))
    elif 'id="finish"' in fm:  # mask-form
        p = base(f, s, "Maskers")
        for m in re.finditer(r'<option value="(\d+)">([^<]+)</option>', fm):
            lab = clean(m.group(2))
            p["variants"].append(V(re.split(r"\s+—\s+", lab)[0], int(m.group(1))))
        a = re.search(r"€ ?14,95", fm)
        if a:
            p["addons"].append(V("Naam of korte tekst", 1495))
    elif 'data-price="' in fm:  # np-form (maskers, sterrenbeelden)
        p = base(f, s, "Maskers")
        for m in re.finditer(r'<option value="[^"]*" data-price="(\d+)">([^<]+)</option>', fm):
            p["variants"].append(V(re.split(r"\s+—\s+", clean(m.group(2)))[0], int(m.group(1))))
        if 'id="np-extra"' in fm:
            p["addons"].append(V("Naam of korte tekst", 1495))
    elif f == "business-collection-bedrijfsdisplays.html":
        p = base(f, s, "Zakelijk")
        p["variants"] = [V("QR Review Display", 4995), V("QR Catalogus Display", 4995), V("3D Logo Bureaudisplay", 9995),
                         V("Gepersonaliseerde Baliehouder", 6495), V("Complete Business Display Set", 24995)]
        p["addons"] = [V("NFC voor QR Review Display", 1495), V("NFC voor QR Catalogus Display", 1495),
                       V("Extra QR-code op één display", 995)]
    elif f == "clipper-duo-set.html":
        p = base(f, s, "Persoonlijk")
        p["variants"] = [V("Enkele Clipper-houder", 2295), V("Clipper Duo Set", 3995)]
        p["addons"] = [V("Derde houder (bij Duo Set)", 1795), V("Complex eigen logo", 995), V("Extra kleurcombinatie", 495)]
    elif f == "metalen-supporterskaart-premium.html":
        p = base(f, s, "Voetbal")
        p["variants"] = [V("Standaard supporterskaart", 2495), V("Premium supporterskaart", 2995)]
        p["addons"] = [V("Dubbelzijdige gravure", 795), V("Houder", 795), V("Luxe cadeauverpakking", 495),
                       V("Maatwerk", 1495, False)]
    elif f == "samurai-oni-deluxe.html":
        p = base(f, s, "Resin")
        p["variants"] = [V("Samurai Oni – Deluxe Edition", 14995)]
        p["addons"] = [V("Gepersonaliseerd naamplaatje", 1495), V("Eigen kleurwensen", 1995), V("Premium extra beschermlaag", 995)]

    if p and p["variants"]:
        products.append(p)
    elif re.search(r"€\s?[0-9]+,[0-9]{2}", fm):
        skipped.append(f)

out = {"currency": "eur", "tax_behavior": "inclusive", "count": len(products), "products": products}
json.dump(out, open("assets/catalogus.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(products)} producten, {sum(len(p['variants']) + len(p['addons']) for p in products)} prijzen")
print("overgeslagen (wel € in formulier, niet herkend):", skipped)
