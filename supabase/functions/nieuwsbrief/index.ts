// Makers 3D Labs — nieuwsbrief "nieuwe producten".
// Aanmelden (dubbele bevestiging), bevestigen, afmelden en de wekelijkse mail.
// De dagelijkse taak (pg_cron) ziet nieuwe producten; op vrijdag gaat er één overzicht uit.
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://www.makers3dlabs.nl";
const FN = "https://dwirzzslswqjqnwthlyn.supabase.co/functions/v1/nieuwsbrief";
const FROM = "Makers 3D Labs <noreply@makers3dlabs.nl>";
const REPLY = "info@makers3dlabs.nl";
const SEND_PER_DAY = 70;      // ruimte laten voor bestelmails binnen de dagelijkse limiet van Resend
const CONFIRMS_PER_DAY = 25;  // bescherming tegen misbruik van het aanmeldformulier
const ISSUE_WEEKDAY = 5;      // vrijdag
const MAX_PRODUCTS = 12;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (c: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(c / 100);
const jpg = (u: string) => "https://bruwin-social-ai.vercel.app/api/autopost?jpg=" + encodeURIComponent(u);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const amsterdamDay = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })).getDay();

function shell(title: string, body: string, footer: string) {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#eef2f5;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dce6e2;">
<tr><td align="center" style="background:#1f2937;padding:22px 24px;line-height:0;"><a href="${SITE}/?utm_source=nieuwsbrief"><img src="${SITE}/email/logo.png" width="300" alt="Makers 3D Labs" style="display:block;width:300px;max-width:100%;height:auto;border:0;"></a></td></tr>
<tr><td style="height:4px;background:#00b4bd;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 36px 20px 36px;font-family:Arial,Helvetica,sans-serif;color:#102027;">${body}
<p style="margin:18px 0 0 0;font-size:16px;line-height:1.6;">Hartelijke groet,<br><strong>Team Makers 3D Labs</strong></p></td></tr>
<tr><td style="padding:18px 36px;background:#eef2f5;border-top:1px solid #dce6e2;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64747a;">${footer}<br>
Makers 3D Labs · Ridderkerk · <a href="${SITE}/" style="color:#64747a;">www.makers3dlabs.nl</a></td></tr>
</table></td></tr></table></body></html>`;
}
const button = (href: string, label: string) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 20px auto;"><tr><td style="background:#00b4bd;border-radius:10px;"><a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(label)}</a></td></tr></table>`;

async function resend(payload: unknown, batch = false) {
  const r = await fetch("https://api.resend.com/emails" + (batch ? "/batch" : ""), {
    method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!r.ok) console.error("resend", r.status, await r.text());
  return r.ok;
}

// ---------- Aanmelden ----------
async function subscribe(emailRaw: string, source: string) {
  const email = emailRaw.trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(email)) return json({ ok: false, error: "Vul een geldig e-mailadres in." }, 400);
  const { data: row } = await admin.from("newsletter_subscribers").select("*").eq("email", email).maybeSingle();
  if (row?.status === "confirmed") return json({ ok: true });
  if (row?.confirm_sent_at && Date.now() - Date.parse(row.confirm_sent_at) < 24 * 3600e3) return json({ ok: true });
  const since = new Date(Date.now() - 24 * 3600e3).toISOString();
  const { count } = await admin.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("confirm_sent_at", since);
  if ((count || 0) >= CONFIRMS_PER_DAY) return json({ ok: false, error: "Aanmelden lukt even niet. Probeer het morgen opnieuw." }, 429);
  let token: string;
  if (row) {
    const { data } = await admin.from("newsletter_subscribers").update({ status: "pending", confirm_sent_at: new Date().toISOString(), source: source || row.source })
      .eq("id", row.id).select("token").single();
    token = data!.token;
  } else {
    const { data, error } = await admin.from("newsletter_subscribers").insert({ email, source, confirm_sent_at: new Date().toISOString() }).select("token").single();
    if (error) return json({ ok: true }); // gelijktijdige aanmelding
    token = data.token;
  }
  const html = shell("Bevestig je aanmelding", `
<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;">Bevestig je aanmelding</h1>
<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Leuk dat je op de hoogte wilt blijven! Klik op de knop om je aanmelding te bevestigen. Daarna krijg je hooguit één keer per week een mail met onze nieuwe producten.</p>
${button(`${FN}?bevestig=${token}`, "Ja, houd mij op de hoogte")}
<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#64747a;">Heb jij je niet aangemeld? Dan hoef je niets te doen; zonder bevestiging sturen we je niets.</p>`,
    "Je ontvangt deze e-mail omdat dit adres is ingevuld bij de aanmelding voor de Makers 3D Labs nieuwsbrief.");
  const ok = await resend({ from: FROM, to: [email], reply_to: REPLY, subject: "Bevestig je aanmelding voor nieuwe producten van Makers 3D Labs", html });
  if (!ok) await admin.from("newsletter_subscribers").update({ confirm_sent_at: null }).eq("email", email);
  return json({ ok });
}

// ---------- Wekelijkse mail ----------
type Product = { id: string; url: string; name: string; image?: string; category?: string; variants?: { cents: number }[] };

function issueHtml(products: Product[], token: string) {
  const cards = products.map((p) => {
    const cents = Math.min(...(p.variants || []).map((v) => v.cents).filter((c) => c > 0));
    const link = `${p.url}?utm_source=nieuwsbrief&utm_campaign=nieuwe-producten`;
    return `<tr><td style="padding:0 0 18px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dce6e2;border-radius:12px;"><tr>
<td width="150" style="padding:12px;vertical-align:top;"><a href="${esc(link)}"><img src="${esc(jpg(p.image!))}" width="140" alt="${esc(p.name)}" style="display:block;width:140px;height:auto;border-radius:8px;border:0;"></a></td>
<td style="padding:12px 14px 12px 4px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;">
${p.category ? `<div style="font-size:12px;color:#00a3ab;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;">${esc(p.category)}</div>` : ""}
<div style="font-size:16px;font-weight:bold;color:#102027;margin:4px 0 6px 0;">${esc(p.name)}</div>
${isFinite(cents) ? `<div style="font-size:14px;color:#64747a;margin:0 0 10px 0;">vanaf ${money(cents)}</div>` : ""}
<a href="${esc(link)}" style="display:inline-block;background:#00b4bd;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:9px 18px;border-radius:8px;">Bekijk</a></td></tr></table></td></tr>`;
  }).join("");
  return shell("Nieuw bij Makers 3D Labs", `
<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;">Nieuw bij Makers 3D Labs ✨</h1>
<p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;">Deze week ${products.length === 1 ? "is er een nieuw product" : `zijn er ${products.length} nieuwe producten`} bijgekomen in onze webshop. Alles wordt met de hand gemaakt in Ridderkerk.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cards}</table>
${button(`${SITE}/winkel.html?utm_source=nieuwsbrief&utm_campaign=nieuwe-producten`, "Naar de webshop")}
${Date.now() < Date.parse("2027-01-01T00:00:00+01:00") ? `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">🎄 De kerstkorting van 5% geldt nog tot en met 31 december.</p>` : ""}`,
    `Je ontvangt deze mail omdat je je hebt aangemeld voor nieuwe producten van Makers 3D Labs. <a href="${FN}?afmelden=${token}" style="color:#64747a;">Afmelden</a> kan met één klik.`);
}

async function run() {
  const cat = await fetch(SITE + "/assets/catalogus.json?t=" + Date.now()).then((r) => r.json());
  const products: Product[] = (cat.products || []).filter((p: Product) => p.id && p.url && p.name);
  const byId = new Map(products.map((p) => [p.id, p]));
  const { count: seenCount } = await admin.from("newsletter_products_seen").select("product_id", { count: "exact", head: true });
  if (!seenCount) {
    // Eerste keer: alles wat er nu staat geldt niet als nieuw.
    const now = new Date().toISOString();
    for (let i = 0; i < products.length; i += 500) await admin.from("newsletter_products_seen").insert(products.slice(i, i + 500).map((p) => ({ product_id: p.id, first_seen_at: now, issue_id: null })));
    await admin.from("newsletter_issues").insert({ product_ids: [] }).select("id").single().then(async ({ data }) => {
      if (data) await admin.from("newsletter_products_seen").update({ issue_id: data.id }).is("issue_id", null);
    });
    return { seeded: products.length };
  }
  await admin.from("newsletter_products_seen").upsert(products.map((p) => ({ product_id: p.id })), { onConflict: "product_id", ignoreDuplicates: true });

  // Op vrijdag een nieuw overzicht maken als er nieuwe producten met foto zijn.
  let created: number | null = null;
  const { data: last } = await admin.from("newsletter_issues").select("id,created_at").neq("product_ids", "{}").order("id", { ascending: false }).limit(1).maybeSingle();
  if (amsterdamDay() === ISSUE_WEEKDAY && (!last || Date.now() - Date.parse(last.created_at) > 5 * 24 * 3600e3)) {
    const { data: fresh } = await admin.from("newsletter_products_seen").select("product_id,first_seen_at").is("issue_id", null).order("first_seen_at");
    const ids = (fresh || []).map((r) => r.product_id).filter((id) => byId.get(id)?.image);
    if (ids.length) {
      const { data: issue } = await admin.from("newsletter_issues").insert({ product_ids: ids }).select("id").single();
      if (issue) { created = issue.id; await admin.from("newsletter_products_seen").update({ issue_id: issue.id }).in("product_id", ids); }
    }
  }

  // Versturen: het nieuwste overzicht van de afgelopen week, in porties per dag.
  const { data: issue } = await admin.from("newsletter_issues").select("*").gt("created_at", new Date(Date.now() - 7 * 24 * 3600e3).toISOString())
    .neq("product_ids", "{}").order("id", { ascending: false }).limit(1).maybeSingle();
  if (!issue) return { created, sent: 0 };
  const items = (issue.product_ids as string[]).map((id) => byId.get(id)).filter((p): p is Product => !!p?.image).slice(0, MAX_PRODUCTS);
  if (!items.length) return { created, sent: 0 };
  const { data: subs } = await admin.from("newsletter_subscribers").select("id,email,token").eq("status", "confirmed")
    .or(`last_issue_id.is.null,last_issue_id.lt.${issue.id}`).order("confirmed_at").limit(SEND_PER_DAY);
  let sent = 0;
  const subject = items.length === 1 ? `Nieuw bij Makers 3D Labs: ${items[0].name}` : `${items.length} nieuwe producten bij Makers 3D Labs`;
  for (let i = 0; i < (subs || []).length; i += 50) {
    const chunk = subs!.slice(i, i + 50);
    const ok = await resend(chunk.map((s) => ({
      from: FROM, to: [s.email], reply_to: REPLY, subject, html: issueHtml(items, s.token),
      headers: { "List-Unsubscribe": `<${FN}?afmelden=${s.token}>, <mailto:${REPLY}?subject=afmelden>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    })), true);
    if (!ok) break;
    await admin.from("newsletter_subscribers").update({ last_issue_id: issue.id }).in("id", chunk.map((s) => s.id));
    sent += chunk.length;
  }
  return { created, issue: issue.id, sent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const confirm = url.searchParams.get("bevestig"), unsub = url.searchParams.get("afmelden");
  if (confirm && UUID.test(confirm)) {
    await admin.from("newsletter_subscribers").update({ status: "confirmed", confirmed_at: new Date().toISOString(), unsubscribed_at: null })
      .eq("token", confirm).eq("status", "pending");
    return Response.redirect(`${SITE}/?nieuwsbrief=bevestigd`, 303);
  }
  if (unsub && UUID.test(unsub)) {
    await admin.from("newsletter_subscribers").update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }).eq("token", unsub);
    return req.method === "POST" ? new Response("ok") : Response.redirect(`${SITE}/?nieuwsbrief=afgemeld`, 303);
  }
  if (req.method !== "POST") return new Response("ok");
  let body: Record<string, unknown> = {};
  const ct = req.headers.get("content-type") || "";
  try { body = ct.includes("json") ? await req.json() : Object.fromEntries(await req.formData()); } catch { body = {}; }
  if (body.run) {
    const { data: ok } = await admin.rpc("makers_nieuwsbrief_key_ok", { k: String(body.key || "") });
    if (!ok) return json({ ok: false }, 401);
    try { return json({ ok: true, ...(await run()) }); } catch (e) { console.error("run", e); return json({ ok: false, error: String(e) }, 500); }
  }
  if (String(body.website || "")) return json({ ok: true }); // honeypot
  return await subscribe(String(body.email || ""), String(body.source || "site").slice(0, 40));
});
