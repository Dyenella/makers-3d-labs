// Makers 3D Labs — verwerkt betalingen uit Stripe.
// Echtheid: het event wordt opnieuw bij Stripe opgehaald met de eigen sleutel.
import { createClient } from "npm:@supabase/supabase-js@2";

const KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE = "https://www.makers3dlabs.nl";
const TO = "info@makers3dlabs.nl";
const FROM = "Makers 3D Labs <noreply@makers3dlabs.nl>";

async function stripeGet(path: string) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${KEY}`, "Stripe-Version": "2024-06-20" } });
  return { status: r.status, body: await r.json() };
}
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (c: unknown) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(c || 0) / 100);
function b64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf); let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function staffHtml(title: string, rows: [string, string][]) {
  const t = rows.map(([k, v]) => `<tr><td style="padding:7px 10px;border-bottom:1px solid #dce6e2;color:#64747a;vertical-align:top;width:36%;">${esc(k)}</td><td style="padding:7px 10px;border-bottom:1px solid #dce6e2;color:#102027;white-space:pre-wrap;">${esc(v)}</td></tr>`).join("");
  return `<!DOCTYPE html><html lang="nl"><body style="margin:0;background:#eef2f5;"><table role="presentation" width="100%" style="background:#eef2f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border-radius:14px;border:1px solid #dce6e2;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background:#1f2937;padding:20px 24px;color:#fff;font-size:20px;font-weight:bold;">Makers 3D Labs · Betaalde bestelling</td></tr>
<tr><td style="height:4px;background:#00b4bd;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:24px 28px;"><h1 style="margin:0 0 12px;font-size:21px;color:#102027;">${esc(title)}</h1>
<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${t}</table>
<p style="font-size:13px;color:#64747a;margin-top:16px;">Bekijk en beheer de bestelling op <a href="${SITE}/beheer.html">${SITE}/beheer.html</a>. Klik op Beantwoorden om de klant te mailen.</p></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const evt = await req.json().catch(() => null);
  if (!evt?.id || !String(evt.id).startsWith("evt_")) return new Response("bad request", { status: 400 });
  const real = await stripeGet(`events/${encodeURIComponent(evt.id)}`);
  if (real.status !== 200) return new Response("unknown event", { status: 400 });
  const e = real.body;
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(e.type)) return new Response("ignored");
  const session = e.data.object;
  if (session.payment_status !== "paid") return new Response("not paid yet");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const reqId = session.metadata?.request_id;
  if (!reqId) return new Response("no request");
  // Eén keer verwerken.
  const { data: claimed } = await admin.from("checkout_requests")
    .update({ status: "paid", paid_at: new Date().toISOString(), stripe_session: session.id })
    .eq("id", reqId).eq("status", "pending").select("*");
  const cr = claimed?.[0];
  if (!cr) return new Response("already handled");

  const email = String(session.customer_details?.email || "").toLowerCase();
  const name = session.customer_details?.name || "";
  const phone = session.customer_details?.phone || "";
  const ship = session.shipping_details || session.collected_information?.shipping_details;
  const addr = ship?.address ? [ship.name, ship.address.line1, ship.address.line2, `${ship.address.postal_code || ""} ${ship.address.city || ""}`, ship.address.country].filter(Boolean).join("\n") : "Ophalen in Ridderkerk";

  // Document betalen (offerte of factuur) vanuit de klantomgeving.
  if (cr.kind === "invoice" || cr.kind === "quote") {
    const table = cr.kind === "invoice" ? "customer_invoices" : "customer_quotes";
    const status = cr.kind === "invoice" ? "paid" : "accepted";
    const { data: doc } = await admin.from(table).update({ status }).eq("id", cr.document_id).select("*").maybeSingle();
    if (cr.kind === "quote" && doc) {
      const number = "BST-" + (doc.number || "").replace(/^OFF-?/i, "") ;
      const { data: order } = await admin.from("customer_orders").insert({
        user_id: doc.user_id, number: number.slice(0, 40) + "-" + reqId.slice(0, 4), title: doc.title, status: "confirmed",
        payment_status: "paid", total_cents: session.amount_total, items: [{ quantity: 1, name: doc.title, options: "Offerte " + doc.number }],
      }).select("id").maybeSingle();
      if (order) await admin.from("checkout_requests").update({ order_id: order.id }).eq("id", reqId);
    }
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: email || TO, subject: `Betaald: ${cr.kind === "invoice" ? "factuur" : "offerte"} ${doc?.number || ""} (${money(session.amount_total)})`,
        html: staffHtml(`${cr.kind === "invoice" ? "Factuur" : "Offerte"} ${doc?.number || ""} is betaald`, [["Klant", `${name} <${email}>`], ["Omschrijving", doc?.title || ""], ["Bedrag", money(session.amount_total)]]) }),
    });
    return new Response("document paid");
  }

  // Productbestelling: klant opzoeken of aanmaken, bestelling vastleggen.
  const p = cr.payload || {};
  let userId: string | null = null;
  if (email) {
    const { data: found } = await admin.rpc("makers_user_id_by_email", { p_email: email });
    userId = found || null;
    if (!userId) {
      const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: name } });
      userId = created?.user?.id || null;
      if (userId && name) await admin.from("customer_profiles").upsert({ user_id: userId, full_name: name.slice(0, 120), phone: String(phone).slice(0, 40) }, { onConflict: "user_id" });
    }
  }
  const d = new Date();
  const number = `BST-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${reqId.slice(0, 4).toUpperCase()}`;
  const options = [p.variant?.label, ...(p.addons || []).map((a: any) => "+ " + a.label)].filter(Boolean).join(" · ");
  let orderId: string | null = null;
  if (userId) {
    const { data: order } = await admin.from("customer_orders").insert({
      user_id: userId, number, title: p.product?.name || "Bestelling", status: "received", payment_status: "paid",
      total_cents: session.amount_total, items: [{ quantity: p.qty || 1, name: p.product?.name, options }],
    }).select("id").maybeSingle();
    orderId = order?.id || null;
    await admin.from("checkout_requests").update({ user_id: userId, order_id: orderId }).eq("id", reqId);
  }

  // Mail aan Makers 3D Labs met alle details en foto's.
  const attachments: { filename: string; content: string }[] = [];
  for (const path of cr.uploads || []) {
    const { data: blob } = await admin.storage.from("order-uploads").download(path);
    if (blob) attachments.push({ filename: path.split("/").pop()!, content: b64(await blob.arrayBuffer()) });
  }
  const rows: [string, string][] = [
    ["Bestelnummer", number], ["Product", p.product?.name || ""], ["Uitvoering", options], ["Aantal", String(p.qty || 1)],
    ["Betaald (incl. verzending)", money(session.amount_total)], ["Levering", p.delivery === "pickup" ? "Ophalen in Ridderkerk" : "Verzenden"],
    ["Klant", `${name} <${email}>`], ["Telefoon", phone], ["Adres", addr], ["Productpagina", p.product?.url || ""],
    ...((p.details || []) as [string, string][]).map(([k, v]) => [k, v] as [string, string]),
  ];
  await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], reply_to: email || TO, subject: `Nieuwe betaalde bestelling ${number}: ${p.product?.name || ""} (${money(session.amount_total)})`, html: staffHtml(`Bestelling ${number}`, rows), attachments }),
  });
  return new Response("order created");
});
