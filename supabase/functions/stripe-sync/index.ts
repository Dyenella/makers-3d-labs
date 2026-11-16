// Makers 3D Labs — zet alle producten en prijzen uit assets/catalogus.json in Stripe.
// Idempotent: producten hebben een vaste id (m3d_…), prijzen een lookup_key.
// Alleen aan te roepen met de service-role sleutel (bijv. via "Test" in het Supabase-dashboard).
// Body (optioneel): { "offset": 0, "limit": 40 }
import { createClient } from "npm:@supabase/supabase-js@2";

const CATALOG = "https://www.makers3dlabs.nl/assets/catalogus.json";
const KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

type Opt = { key: string; label: string; cents: number; firm: boolean };
type Product = { id: string; url: string; name: string; category: string; image: string | null; variants: Opt[]; addons: Opt[] };

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
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
      body: body ? form(body) : undefined,
    });
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 800 * (attempt + 1))); continue; }
    const j = await r.json();
    return { status: r.status, body: j };
  }
  throw new Error("Stripe rate limit");
}

async function syncProduct(p: Product) {
  const productFields = {
    name: p.name.slice(0, 250),
    description: `${p.category} · Makers 3D Labs · handgemaakt in Ridderkerk`,
    url: p.url,
    images: p.image ? [p.image] : undefined,
    metadata: { category: p.category, page: p.url, source: "makers3dlabs.nl" },
    active: true,
  };
  let res = await stripe("POST", `products/${p.id}`, productFields);
  if (res.status === 404) res = await stripe("POST", "products", { id: p.id, ...productFields });
  if (res.status >= 400) return { id: p.id, error: res.body?.error?.message };

  const wanted = [
    ...p.variants.map((v) => ({ ...v, kind: "variant", lookup: `${p.id}__${v.key}` })),
    ...p.addons.map((a) => ({ ...a, kind: "addon", lookup: `${p.id}__addon__${a.key}` })),
  ];
  const existing = new Map<string, { id: string; unit_amount: number; active: boolean }>();
  for (let i = 0; i < wanted.length; i += 10) {
    const qs = wanted.slice(i, i + 10).map((w) => `lookup_keys[]=${encodeURIComponent(w.lookup.slice(0, 200))}`).join("&");
    const r = await stripe("GET", `prices?limit=100&${qs}`);
    for (const pr of r.body?.data || []) existing.set(pr.lookup_key, pr);
  }
  let created = 0, kept = 0, defaultPrice: string | null = null;
  for (const w of wanted) {
    const lookup = w.lookup.slice(0, 200);
    const old = existing.get(lookup);
    let priceId = old?.id;
    if (!old || old.unit_amount !== w.cents || !old.active) {
      const r = await stripe("POST", "prices", {
        product: p.id, currency: "eur", unit_amount: w.cents, tax_behavior: "inclusive",
        nickname: (w.kind === "addon" ? "Extra: " : "") + w.label.slice(0, 200),
        lookup_key: lookup, transfer_lookup_key: true,
        metadata: { kind: w.kind, option: w.key, firm: String(w.firm), label: w.label.slice(0, 450) },
      });
      if (r.status >= 400) return { id: p.id, error: r.body?.error?.message };
      priceId = r.body.id; created++;
      if (old && old.active) await stripe("POST", `prices/${old.id}`, { active: false });
    } else kept++;
    if (!defaultPrice && w.kind === "variant" && w.firm) defaultPrice = priceId!;
  }
  if (defaultPrice) await stripe("POST", `products/${p.id}`, { default_price: defaultPrice });
  return { id: p.id, created, kept };
}

Deno.serve(async (req) => {
  // Alleen met service-role sleutel.
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const probe = createClient(Deno.env.get("SUPABASE_URL")!, token, { auth: { persistSession: false } });
  const { error: authErr } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (authErr) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  if (!KEY) return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY ontbreekt" }), { status: 500 });

  const body = await req.json().catch(() => ({}));
  const offset = Number(body?.offset || 0), limit = Math.min(Number(body?.limit || 40), 60);
  const catalog = await fetch(CATALOG, { cache: "no-store" }).then((r) => r.json());
  const slice: Product[] = catalog.products.slice(offset, offset + limit);

  const results: unknown[] = [];
  const queue = [...slice];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const p = queue.shift()!;
      try { results.push(await syncProduct(p)); } catch (e) { results.push({ id: p.id, error: String(e) }); }
    }
  }));
  const errors = results.filter((r: any) => r.error);
  return new Response(JSON.stringify({
    total: catalog.products.length, offset, done: slice.length,
    next: offset + slice.length < catalog.products.length ? offset + slice.length : null,
    created: results.reduce((n: number, r: any) => n + (r.created || 0), 0),
    kept: results.reduce((n: number, r: any) => n + (r.kept || 0), 0),
    errors,
  }), { headers: { "Content-Type": "application/json" } });
});
