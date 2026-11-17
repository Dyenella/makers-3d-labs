// Makers 3D Labs — verwerkt betalingen uit Stripe.
// Echtheid: het event wordt opnieuw bij Stripe opgehaald met de eigen sleutel.
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

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


// ---------- Factuur (PDF) ----------
type Line = { description: string; detail?: string; quantity: number; totalCents: number };
const VAT = 0.21;
const exVat = (c: number) => Math.round(c / (1 + VAT));
const fmtDate = (d: Date) => new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(d);

async function invoicePdf(o: {
  number: string; date: Date; settings: Record<string, string>; customer: { name: string; email: string; address: string };
  lines: Line[]; totalCents: number; method: string; reference: string; orderNumber: string;
}) {
  const S = o.settings;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${o.number}`); pdf.setAuthor(S.handelsnaam || "Makers 3D Labs");
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const safe = (t: unknown) => [...String(t ?? "")].map((ch) => { try { font.encodeText(ch); return ch; } catch { return ch === "\n" ? " " : ""; } }).join("");
  const ink = rgb(0.06, 0.13, 0.15), grey = rgb(0.39, 0.45, 0.48), teal = rgb(0, 0.706, 0.741), dark = rgb(0.118, 0.161, 0.224), line = rgb(0.86, 0.9, 0.89);
  const text = (t: unknown, x: number, y: number, size = 10, f = font, color = ink) => page.drawText(safe(t), { x, y, size, font: f, color });
  const right = (t: unknown, xr: number, y: number, size = 10, f = font, color = ink) => { const s = safe(t); page.drawText(s, { x: xr - f.widthOfTextAtSize(s, size), y, size, font: f, color }); };
  const wrap = (t: string, width: number, size: number, f = font) => {
    const out: string[] = []; let cur = "";
    for (const w of safe(t).split(/\s+/)) { const nxt = cur ? cur + " " + w : w; if (f.widthOfTextAtSize(nxt, size) > width && cur) { out.push(cur); cur = w; } else cur = nxt; }
    if (cur) out.push(cur); return out;
  };
  const W = 595.28, L = 48, R = W - 48;

  // Kop met logo
  page.drawRectangle({ x: 0, y: 841.89 - 110, width: W, height: 110, color: dark });
  page.drawRectangle({ x: 0, y: 841.89 - 114, width: W, height: 4, color: teal });
  try {
    const png = await fetch(SITE + "/email/logo.png").then((r) => r.ok ? r.arrayBuffer() : Promise.reject());
    const img = await pdf.embedPng(png); const h = 72, w = img.width * h / img.height;
    page.drawImage(img, { x: L - 10, y: 841.89 - 92, width: w, height: h });
  } catch { text(S.handelsnaam || "Makers 3D Labs", L, 841.89 - 64, 22, bold, rgb(1, 1, 1)); }
  right("FACTUUR", R, 841.89 - 52, 22, bold, rgb(1, 1, 1));
  right(o.number, R, 841.89 - 72, 11, font, rgb(0.85, 0.95, 0.96));

  // Afzender en klant
  let y = 841.89 - 150;
  text("Van", L, y, 9, bold, grey); text("Factuur aan", 320, y, 9, bold, grey);
  y -= 15;
  const seller = [S.handelsnaam ? `${S.handelsnaam} (${S.bedrijfsnaam})` : S.bedrijfsnaam, S.adres, S.postcode_plaats, S.land,
    `KvK ${S.kvk}`, `Btw-id ${S.btw_id || "NL005594435B45"}`, S.email, S.website, S.iban ? `IBAN ${S.iban}` : ""].filter(Boolean);
  const addrLines = o.customer.address.split("\n").filter((v) => v && v !== o.customer.name);
  const buyer = [o.customer.name, ...addrLines, o.customer.email].filter(Boolean);
  for (let i = 0; i < Math.max(seller.length, buyer.length); i++) {
    if (seller[i]) text(seller[i], L, y - i * 13, 9.5, i === 0 ? bold : font);
    if (buyer[i]) text(buyer[i], 320, y - i * 13, 9.5, i === 0 ? bold : font);
  }
  y -= Math.max(seller.length, buyer.length) * 13 + 14;

  // Factuurgegevens
  page.drawRectangle({ x: L, y: y - 46, width: R - L, height: 52, color: rgb(0.93, 0.97, 0.97) });
  const meta: [string, string][] = [["Factuurnummer", o.number], ["Factuurdatum", fmtDate(o.date)], ["Bestelling", o.orderNumber || "-"], ["Status", "Betaald"]];
  meta.forEach(([k, v], i) => { const x = L + 12 + i * ((R - L - 24) / 4); text(k, x, y - 12, 8.5, font, grey); text(v, x, y - 28, 10, bold, i === 3 ? rgb(0.1, 0.55, 0.3) : ink); });
  y -= 76;

  // Regels
  const cQty = 330, cPrice = 410, cVat = 455, cTot = R;
  text("Omschrijving", L, y, 9, bold, grey); right("Aantal", cQty + 20, y, 9, bold, grey); right("Prijs excl.", cPrice + 30, y, 9, bold, grey);
  right("Btw", cVat + 25, y, 9, bold, grey); right("Totaal excl.", cTot, y, 9, bold, grey);
  y -= 8; page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1, color: ink }); y -= 16;
  let subtotal = 0;
  for (const ln of o.lines) {
    const ex = exVat(ln.totalCents); subtotal += ex;
    const desc = wrap(ln.description, cQty - L - 40, 10, bold);
    const det = ln.detail ? wrap(ln.detail, cQty - L - 40, 8.5) : [];
    desc.forEach((d, i) => text(d, L, y - i * 13, 10, bold));
    det.forEach((d, i) => text(d, L, y - desc.length * 13 - i * 11, 8.5, font, grey));
    right(String(ln.quantity), cQty + 20, y); right(money(Math.round(ex / Math.max(1, ln.quantity))), cPrice + 30, y);
    right("21%", cVat + 25, y); right(money(ex), cTot, y);
    y -= desc.length * 13 + det.length * 11 + 8;
    page.drawLine({ start: { x: L, y: y + 2 }, end: { x: R, y: y + 2 }, thickness: 0.5, color: line }); y -= 12;
    if (y < 230) break; // veiligheidsgrens voor één pagina
  }

  // Totalen
  const vat = o.totalCents - subtotal;
  y -= 6;
  const tot: [string, string, boolean][] = [["Subtotaal excl. btw", money(subtotal), false], ["Btw 21%", money(vat), false], ["Totaal incl. btw", money(o.totalCents), true]];
  for (const [k, v, b] of tot) {
    if (b) { page.drawRectangle({ x: 330, y: y - 8, width: R - 330, height: 26, color: dark }); text(k, 342, y, 11, bold, rgb(1, 1, 1)); right(v, R - 12, y, 12, bold, rgb(1, 1, 1)); }
    else { text(k, 342, y, 10, font, grey); right(v, R - 12, y, 10); }
    y -= b ? 34 : (k.startsWith("Btw") ? 26 : 18);
  }
  page.drawRectangle({ x: L, y: y - 30, width: R - L, height: 40, color: rgb(0.91, 0.97, 0.93) });
  text(`Voldaan op ${fmtDate(o.date)} via ${o.method}.`, L + 12, y - 8, 10, bold, rgb(0.1, 0.45, 0.25));
  text(`Betalingskenmerk: ${o.reference}`, L + 12, y - 22, 8.5, font, grey);

  // Voet
  const foot = [`${S.handelsnaam || ""} is een handelsnaam van ${S.bedrijfsnaam} · ${S.adres}, ${S.postcode_plaats} · KvK ${S.kvk} · Btw-id ${S.btw_id || "NL005594435B45"}`,
    `Vragen over deze factuur? Mail ${S.email} en vermeld het factuurnummer. Op alle bestellingen zijn onze voorwaarden van toepassing (${S.website}/informatie.html).`];
  page.drawLine({ start: { x: L, y: 62 }, end: { x: R, y: 62 }, thickness: 0.5, color: line });
  foot.forEach((t, i) => wrap(t, R - L, 7.5).forEach((ln, j) => text(ln, L, 48 - i * 20 - j * 9, 7.5, font, grey)));
  return await pdf.save();
}

async function createInvoice(admin: any, session: any, o: { userId: string | null; reqId: string; name: string; email: string; address: string; lines: Line[]; orderNumber: string; title: string }) {
  const { data: rows } = await admin.from("makers_settings").select("key,value");
  const settings: Record<string, string> = Object.fromEntries((rows || []).map((r: any) => [r.key, r.value]));
  const { data: number, error } = await admin.rpc("makers_next_invoice_number");
  if (error || !number) throw new Error("Geen factuurnummer: " + (error?.message || ""));
  await admin.from("checkout_requests").update({ invoice_number: number }).eq("id", o.reqId);
  let method = "online betaling (Stripe)";
  if (session.payment_intent) {
    const pi = await stripeGet(`payment_intents/${session.payment_intent}?expand[]=latest_charge`);
    const t = pi.body?.latest_charge?.payment_method_details?.type || (pi.body?.payment_method_types?.length === 1 ? pi.body.payment_method_types[0] : "");
    method = ({ ideal: "iDEAL", bancontact: "Bancontact", card: "creditcard", paypal: "PayPal", klarna: "Klarna", sofort: "Sofort", eps: "EPS" } as Record<string, string>)[t] || method;
  }
  const bytes = await invoicePdf({ number, date: new Date(), settings,
    customer: { name: o.name || o.email, email: o.email, address: o.address }, lines: o.lines, totalCents: session.amount_total, method,
    reference: session.payment_intent || session.id, orderNumber: o.orderNumber });
  if (o.userId) {
    const path = `${o.userId}/${number}.pdf`;
    const up = await admin.storage.from("customer-documents").upload(path, new Blob([bytes], { type: "application/pdf" }), { contentType: "application/pdf", upsert: true });
    if (!up.error) await admin.from("customer_invoices").insert({ user_id: o.userId, number, title: o.title.slice(0, 200), status: "paid", total_cents: session.amount_total, file_path: path, order_number: o.orderNumber || null });
  }
  return { number, bytes };
}

async function sessionLines(session: any, fallbackName: string, detail: string, shipLabel = "Verzendkosten"): Promise<Line[]> {
  const out: Line[] = [];
  const li = await stripeGet(`checkout/sessions/${session.id}/line_items?limit=100`);
  if (li.status === 200) for (const it of li.body.data || []) out.push({ description: it.description || fallbackName, detail, quantity: it.quantity || 1, totalCents: it.amount_total });
  const shipping = session.shipping_cost?.amount_total || session.total_details?.amount_shipping || 0;
  if (!out.length) out.push({ description: fallbackName, detail, quantity: 1, totalCents: session.amount_total - shipping });
  if (shipping > 0) out.push({ description: shipLabel, quantity: 1, totalCents: shipping });
  return out;
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
    // Bij een betaalde offerte maken we de factuur; een betaalde factuur bestaat al.
    const docAtt: { filename: string; content: string }[] = [];
    if (cr.kind === "quote" && doc) {
      try {
        const inv = await createInvoice(admin, session, { userId: doc.user_id, reqId, name, email, address: addr, orderNumber: doc.number, title: doc.title,
          lines: await sessionLines(session, doc.title, "Volgens offerte " + doc.number) });
        docAtt.push({ filename: inv.number + ".pdf", content: b64(inv.bytes.buffer as ArrayBuffer) });
      } catch (err) { console.error("factuur", err); }
    }
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: email || TO, subject: `Betaald: ${cr.kind === "invoice" ? "factuur" : "offerte"} ${doc?.number || ""} (${money(session.amount_total)})`,
        html: staffHtml(`${cr.kind === "invoice" ? "Factuur" : "Offerte"} ${doc?.number || ""} is betaald`, [["Klant", `${name} <${email}>`], ["Omschrijving", doc?.title || ""], ["Bedrag", money(session.amount_total)]]), attachments: docAtt }),
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
  const rateId = typeof session.shipping_cost?.shipping_rate === "string" ? session.shipping_cost.shipping_rate : session.shipping_cost?.shipping_rate?.id;
  const carrier = (rateId && p.carriers?.[rateId]) || null;
  const shipClassName = ({ klein: "brievenbuspakje", normaal: "pakket", groot: "groot pakket" } as Record<string, string>)[p.ship] || "pakket";
  const shipLabel = carrier ? `Verzendkosten – ${carrier} ${shipClassName}` : "Verzendkosten";
  const postcode = String(ship?.address?.postal_code || "").replace(/\s/g, "").toUpperCase().slice(0, 12) || null;
  let orderId: string | null = null;
  if (userId) {
    const { data: order } = await admin.from("customer_orders").insert({
      user_id: userId, number, title: p.product?.name || "Bestelling", status: "received", payment_status: "paid",
      total_cents: session.amount_total, items: [{ quantity: p.qty || 1, name: p.product?.name, options }],
      carrier, ship_postcode: postcode,
    }).select("id").maybeSingle();
    orderId = order?.id || null;
    await admin.from("checkout_requests").update({ user_id: userId, order_id: orderId }).eq("id", reqId);
  }

  // Factuur maken (PDF in de klantomgeving + bijlage voor Makers).
  const attachments: { filename: string; content: string }[] = [];
  let invoiceNumber = "";
  try {
    const inv = await createInvoice(admin, session, { userId, reqId, name, email, address: addr, orderNumber: number, title: p.product?.name || "Bestelling",
      lines: await sessionLines(session, p.product?.name || "Bestelling", options, shipLabel) });
    invoiceNumber = inv.number;
    attachments.push({ filename: inv.number + ".pdf", content: b64(inv.bytes.buffer as ArrayBuffer) });
  } catch (err) { console.error("factuur", err); }

  // Mail aan Makers 3D Labs met alle details en foto's.
  for (const path of cr.uploads || []) {
    const { data: blob } = await admin.storage.from("order-uploads").download(path);
    if (blob) attachments.push({ filename: path.split("/").pop()!, content: b64(await blob.arrayBuffer()) });
  }
  const rows: [string, string][] = [
    ["Bestelnummer", number], ["Factuur", invoiceNumber || "niet aangemaakt — controleer"], ["Product", p.product?.name || ""], ["Uitvoering", options], ["Aantal", String(p.qty || 1)],
    ["Betaald (incl. verzending)", money(session.amount_total)], ["Verzending", carrier ? `${carrier} – ${shipClassName}` : "Verzenden"],
    ["Klant", `${name} <${email}>`], ["Telefoon", phone], ["Adres", addr], ["Productpagina", p.product?.url || ""],
    ...((p.details || []) as [string, string][]).map(([k, v]) => [k, v] as [string, string]),
  ];
  await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], reply_to: email || TO, subject: `Nieuwe betaalde bestelling ${number}: ${p.product?.name || ""} (${money(session.amount_total)})`, html: staffHtml(`Bestelling ${number}`, rows), attachments }),
  });
  return new Response("order created");
});
