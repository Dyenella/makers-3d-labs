"""Maakt sitemap.xml opnieuw aan met alle openbare pagina's van makers3dlabs.nl.

Gebruik: python3 maak-sitemap.py
Pagina's met <meta name="robots" content="noindex"> en de winkelwagen worden overgeslagen.
"""
import glob
import re
import subprocess
from datetime import date

SITE = "https://www.makers3dlabs.nl"
SKIP_DIRS = ("backups/", "node_modules/", "supabase/", "database/")
SKIP_FILES = {"winkelwagen.html"}


def last_modified(path):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path],
                             capture_output=True, text=True, check=True).stdout.strip()
        return out or date.today().isoformat()
    except Exception:
        return date.today().isoformat()


pages = []
for f in sorted(glob.glob("**/*.html", recursive=True)):
    if f.startswith(SKIP_DIRS) or f in SKIP_FILES:
        continue
    html = open(f, encoding="utf-8", errors="ignore").read()
    if re.search(r'<meta[^>]+name="robots"[^>]+noindex', html, re.I):
        continue
    url = SITE + "/" if f == "index.html" else f"{SITE}/{f}"
    pages.append((url, last_modified(f)))

# Home first, then the rest alphabetically.
pages.sort(key=lambda p: (p[0] != SITE + "/", p[0]))
lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
lines += [f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>" for u, d in pages]
lines.append("</urlset>")
open("sitemap.xml", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print(f"sitemap.xml: {len(pages)} pagina's")
