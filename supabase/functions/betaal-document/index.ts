// Makers 3D Labs — laat een ingelogde klant een factuur of offerte online betalen.
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://www.makers3dlabs.nl";
const KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const ORIGINS = [SITE, "https://makers3dlabs.nl"];

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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const h = {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : SITE,
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin",
  };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(token);
  if (!who?.user) return json({ error: "Log opnieuw in." }, 401);

  const body = await req.json().catch(() => ({}));
  const kind = body?.kind === "quote" ? "quote" : "invoice";
  const id = String(body?.id || "");
  const table = kind === "invoice" ? "customer_invoices" : "customer_quotes";
  const { data: doc } = await admin.from(table).select("*").eq("id", id).eq("user_id", who.user.id).maybeSingle();
  if (!doc) return json({ error: "Document niet gevonden." }, 404);
  if ((kind === "invoice" && doc.status !== "issued") || (kind === "quote" && doc.status !== "sent")) {
    return json({ error: kind === "invoice" ? "Deze factuur is al betaald of niet meer open." : "Deze offerte kan niet meer online worden betaald." }, 409);
  }
  if (!(doc.total_cents > 0)) return json({ error: "Geen bedrag om te betalen." }, 400);

  const reqId = crypto.randomUUID();
  await admin.from("checkout_requests").insert({ id: reqId, kind, document_id: doc.id, user_id: who.user.id, amount_cents: doc.total_cents, payload: { number: doc.number, title: doc.title } });
  const label = (kind === "invoice" ? "Factuur " : "Offerte ") + doc.number;
  const back = kind === "invoice" ? "facturen.html" : "offertes.html";
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: form({
      mode: "payment", locale: "nl", customer_email: who.user.email,
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: doc.total_cents, tax_behavior: "inclusive", product_data: { name: `${label} – ${String(doc.title).slice(0, 180)}` } } }],
      success_url: `${SITE}/${back}?betaald=1`, cancel_url: `${SITE}/${back}`,
      metadata: { request_id: reqId, kind, document: doc.id },
      payment_intent_data: { metadata: { request_id: reqId }, statement_descriptor_suffix: "MAKERS3D" },
    }),
  });
  const s = await r.json();
  if (!r.ok) { console.error(s); return json({ error: "Betalen kon niet worden gestart." }, 502); }
  await admin.from("checkout_requests").update({ stripe_session: s.id }).eq("id", reqId);
  return json({ url: s.url });
});
