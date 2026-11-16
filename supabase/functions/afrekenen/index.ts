// Makers 3D Labs — start een Stripe Checkout voor een product van de site.
// De browser stuurt alleen keuzes (product, uitvoering, extra's, aantal, wensen, foto's);
// prijzen komen uitsluitend uit de catalogus en Stripe.
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://www.makers3dlabs.nl";
const CATALOG = SITE + "/assets/catalogus.json";
const KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const FREE_FROM = 40000; // gratis verzenden vanaf € 400
// Verzendtarieven incl. btw (goedgekeurd 17-11-2026).
const RATES = {
  klein: [{ carrier: "PostNL", name: "PostNL – brievenbuspakje", cents: 550 }, { carrier: "DHL", name: "DHL – brievenbuspakket", cents: 525 }],
  normaal: [{ carrier: "PostNL", name: "PostNL – pakket", cents: 895 }, { carrier: "DHL", name: "DHL – pakket", cents: 795 }],
  groot: [{ carrier: "PostNL", name: "PostNL – groot pakket (extra stevig verpakt)", cents: 1295 }, { carrier: "DHL", name: "DHL – groot pakket (extra stevig verpakt)", cents: 1295 }],
} as const;
type ShipClass = keyof typeof RATES;
// Artikelen die door de brievenbus passen (met maximaal aantal per brievenbuspakje).
const SMALL: Record<string, number> = {
  "persoonlijke-kersttafel.html": 12, "lasergravure-sleutelhangers.html": 4, "lasergravure-dierenpenning.html": 4,
  "lasergravure-leren-portemonnee.html": 1, "product-053-bladwijzer-bergen.html": 3,
};
function shipClass(product: any, variant: any, qty: number): ShipClass {
  const label = String(variant.label || "");
  if (product.file in SMALL && qty <= SMALL[product.file] && !/^(Middel|Groot)/.test(label)) return "klein";
  if (product.category === "Voetbalstadions") return "groot";
  if (product.category === "Lasergravure") return "normaal"; // vlakke artikelen
  if (product.category === "Maskers") return /^(Klein|Middel)/.test(label) ? "normaal" : "groot";
  if (/^Groot/.test(label) || /\b(2[5-9]|[3-9]\d)\s?(–\s?\d+\s?)?cm\b/.test(label)) return "groot";
  return "normaal";
}
const ORIGINS = [SITE, "https://makers3dlabs.nl"];
const IMG = ["image/jpeg", "image/png", "image/webp"];

let catalogCache: { at: number; data: any } | null = null;
async function catalog() {
  if (catalogCache && Date.now() - catalogCache.at < 300_000) return catalogCache.data;
  const data = await fetch(CATALOG, { cache: "no-store" }).then((r) => r.json());
  catalogCache = { at: Date.now(), data };
  return data;
}

function form(obj: Record<string, unknown>, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? form(x as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(x))));
    else if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function stripe(method: string, path: string, body?: Record<string, unknown>) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: body ? form(body) : undefined,
  });
  return { status: r.status, body: await r.json() };
}
const clean = (s: unknown, n = 2000) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const h = {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : SITE,
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!ORIGINS.includes(origin) && !/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return json({ error: "Niet toegestaan." }, 403);

  let fd: FormData;
  try { fd = await req.formData(); } catch { return json({ error: "Ongeldige aanvraag." }, 400); }
  if (clean(fd.get("_honey"))) return json({ error: "Ongeldige aanvraag." }, 400);

  const file = clean(fd.get("_product"), 120);
  const cat = await catalog();
  const product = cat.products.find((p: any) => p.file === file);
  if (!product) return json({ error: "Dit product kan nog niet online worden afgerekend." }, 400);

  const vi = Number(fd.get("_variant"));
  const variant = product.variants[vi];
  if (!Number.isInteger(vi) || !variant) return json({ error: "Kies eerst een uitvoering." }, 400);
  if (!variant.firm) return json({ error: "Voor deze uitvoering maken we eerst een prijsvoorstel. Gebruik de aanvraagknop." }, 400);
  const addonIdx = String(fd.get("_addons") || "").split(",").filter(Boolean).map(Number);
  const addons = [...new Set(addonIdx)].map((i) => product.addons[i]).filter(Boolean);
  if (addons.length !== new Set(addonIdx).size) return json({ error: "Onbekende extra optie." }, 400);
  if (addons.some((a: any) => !a.firm)) return json({ error: "Een gekozen extra optie heeft eerst een prijsvoorstel nodig. Gebruik de aanvraagknop." }, 400);
  const qty = Math.trunc(Number(fd.get("_qty") || 1));
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return json({ error: "Kies een aantal tussen 1 en 100." }, 400);
  const delivery = "ship";
  const ship = shipClass(product, variant, qty);

  // Stripe-prijzen ophalen via lookup_key.
  const lookups = [`${product.id}__${variant.key}`, ...addons.map((a: any) => `${product.id}__addon__${a.key}`)].map((k) => k.slice(0, 200));
  const pr = await stripe("GET", `prices?active=true&limit=20&${lookups.map((k) => `lookup_keys[]=${encodeURIComponent(k)}`).join("&")}`);
  const byKey = new Map((pr.body?.data || []).map((p: any) => [p.lookup_key, p]));
  if (lookups.some((k) => !byKey.has(k))) return json({ error: "Prijs niet gevonden. Probeer het later opnieuw." }, 500);
  const subtotal = (variant.cents + addons.reduce((n: number, a: any) => n + a.cents, 0)) * qty;

  // Wensen en foto's bewaren.
  const details: [string, string][] = [];
  const files: File[] = [];
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) { if (v.size > 0) files.push(v); continue; }
    if (k.startsWith("_") || !clean(v)) continue;
    if (details.length < 40) details.push([clean(k, 80), clean(v)]);
  }
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const reqId = crypto.randomUUID();
  const uploads: string[] = [];
  let total = 0;
  for (const f of files.slice(0, 5)) {
    if (!IMG.includes(f.type)) continue;
    total += f.size; if (total > 9 * 1024 * 1024) break;
    const path = `${reqId}/${uploads.length + 1}-${clean(f.name, 80).replace(/[^\w.\-]/g, "_")}`;
    const up = await admin.storage.from("order-uploads").upload(path, f, { contentType: f.type });
    if (!up.error) uploads.push(path);
  }
  const payload = {
    product: { id: product.id, file: product.file, name: product.name, url: product.url },
    variant: { label: variant.label, cents: variant.cents },
    addons: addons.map((a: any) => ({ label: a.label, cents: a.cents })),
    qty, delivery, ship, subtotal, details,
  };
  const ins = await admin.from("checkout_requests").insert({ id: reqId, kind: "product", payload, uploads, amount_cents: subtotal });
  if (ins.error) return json({ error: "Er ging iets mis. Probeer het opnieuw." }, 500);

  const freeShip = subtotal >= FREE_FROM;
  const perItem = ship === "groot" ? qty : 1; // elk groot stuk gaat in een eigen doos
  const rates = RATES[ship];
  const shipping_options = rates.map((r) => ({
    shipping_rate_data: {
      display_name: freeShip ? `${r.name} · gratis vanaf € 400` : (perItem > 1 ? `${r.name} · ${perItem} dozen` : r.name),
      type: "fixed_amount", fixed_amount: { amount: freeShip ? 0 : r.cents * perItem, currency: "eur" }, tax_behavior: "inclusive",
      metadata: { carrier: r.carrier, class: ship },
      delivery_estimate: { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 3 } },
    },
  }));

  const session = await stripe("POST", "checkout/sessions", {
    mode: "payment",
    locale: "nl",
    line_items: lookups.map((k) => ({ price: (byKey.get(k) as any).id, quantity: qty })),
    shipping_options,
    shipping_address_collection: { allowed_countries: ["NL"] },
    phone_number_collection: { enabled: true },
    billing_address_collection: "auto",
    customer_creation: "always",
    success_url: `${SITE}/bedankt.html?betaald=1`,
    cancel_url: `${product.url}?betaling=geannuleerd`,
    metadata: { request_id: reqId, kind: "product", product: product.id },
    payment_intent_data: { metadata: { request_id: reqId }, statement_descriptor_suffix: "MAKERS3D" },
    custom_text: { submit: { message: "Je bestelling wordt op maat gemaakt. Na betaling ontvang je een bevestiging per e-mail." } },
  });
  if (session.status >= 400) {
    console.error(session.body);
    return json({ error: "Afrekenen kon niet worden gestart. Probeer het later opnieuw." }, 502);
  }
  // Koppeling verzendtarief → vervoerder bewaren (voor de bestelling en track & trace).
  const carriers: Record<string, string> = {};
  (session.body.shipping_options || []).forEach((o: any, i: number) => { if (o.shipping_rate) carriers[o.shipping_rate] = rates[i]?.carrier || ""; });
  await admin.from("checkout_requests").update({ stripe_session: session.body.id, payload: { ...payload, carriers } }).eq("id", reqId);
  return json({ url: session.body.url });
});
