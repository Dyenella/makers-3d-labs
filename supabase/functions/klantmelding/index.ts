// Makers 3D Labs — mailt de klant zodra er een offerte, factuur of bestelling
// (of een nieuwe bestelstatus) in de klantomgeving wordt gezet.
// Aangeroepen door een database-trigger (pg_net) met het id van een rij in customer_notifications.
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://www.makers3dlabs.nl";
const LOGO = SITE + "/email/logo.png";
const FROM = "Makers 3D Labs <noreply@makers3dlabs.nl>";
const REPLY = "info@makers3dlabs.nl";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (c: unknown) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(c || 0) / 100);
const STATUS: Record<string, string> = { received: "Ontvangen", confirmed: "Bevestigd", in_production: "In productie", shipped: "Verzonden", completed: "Afgerond", cancelled: "Geannuleerd" };

function layout(title: string, paras: string[], rows: [string, string][], button: [string, string]) {
  const p = paras.map((x) => `<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#102027;">${x}</p>`).join("");
  const t = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0 18px 0;font-size:15px;">` +
    rows.map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #dce6e2;color:#64747a;width:40%;">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #dce6e2;color:#102027;font-weight:bold;">${esc(v)}</td></tr>`).join("") + `</table>`;
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#eef2f5;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dce6e2;">
<tr><td align="center" style="background:#1f2937;padding:22px 24px;line-height:0;"><a href="${SITE}/"><img src="${LOGO}" width="300" alt="Makers 3D Labs" style="display:block;width:300px;max-width:100%;height:auto;border:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;line-height:1.4;"></a></td></tr>
<tr><td style="height:4px;background:#00b4bd;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 36px 16px 36px;font-family:Arial,Helvetica,sans-serif;color:#102027;">
<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;">${esc(title)}</h1>${p}${t}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px 0;"><tr><td style="background:#00b4bd;border-radius:10px;"><a href="${button[1]}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(button[0])}</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#64747a;">Vragen? Beantwoord gewoon deze e-mail.</p>
<p style="margin:18px 0 0 0;font-size:16px;line-height:1.6;">Hartelijke groet,<br><strong>Team Makers 3D Labs</strong></p></td></tr>
<tr><td style="padding:18px 36px;background:#eef2f5;border-top:1px solid #dce6e2;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#64747a;">
Makers 3D Labs · 3D-printen · Resin · Lasergraveren · Ridderkerk<br><a href="${SITE}/" style="color:#64747a;">www.makers3dlabs.nl</a> · <a href="mailto:${REPLY}" style="color:#64747a;">${REPLY}</a></td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("bad request", { status: 400 });

  // De melding wordt uit de database gelezen; alleen echte, nog niet verstuurde meldingen worden gemaild.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: n } = await admin.from("customer_notifications").select("*").eq("id", id).is("sent_at", null).maybeSingle();
  if (!n) return new Response("skip");
  const { data: claimed } = await admin.from("customer_notifications").update({ sent_at: new Date().toISOString() }).eq("id", id).is("sent_at", null).select("id");
  if (!claimed?.length) return new Response("skip");
  const rec = n.payload || {};

  let title: string, subject: string, paras: string[], rows: [string, string][], button: [string, string];
  if (n.kind === "quote") {
    subject = `Je offerte ${rec.number} staat klaar | Makers 3D Labs`;
    title = "Je offerte staat klaar";
    paras = ["Goed nieuws: we hebben een offerte voor je klaargezet in je klantomgeving."];
    rows = [["Offerte", rec.number], ["Omschrijving", rec.title], ["Bedrag", money(rec.total_cents) + " incl. btw"]];
    button = ["Bekijk mijn offerte", SITE + "/offertes.html"];
  } else if (n.kind === "invoice") {
    subject = `Je factuur ${rec.number} staat klaar | Makers 3D Labs`;
    title = "Je factuur staat klaar";
    paras = ["Je factuur staat voor je klaar in je klantomgeving. Je kunt hem daar als PDF downloaden."];
    rows = [["Factuur", rec.number], ["Omschrijving", rec.title], ["Bedrag", money(rec.total_cents) + " incl. btw"]];
    if (rec.order_number) rows.push(["Bestelling", rec.order_number]);
    button = ["Bekijk mijn factuur", SITE + "/facturen.html"];
  } else if (n.kind === "order") {
    subject = `Bedankt voor je bestelling ${rec.number} | Makers 3D Labs`;
    title = "Je bestelling staat in je klantomgeving";
    paras = ["Bedankt voor je bestelling! Je kunt de status en de details altijd volgen in je klantomgeving."];
    rows = [["Bestelling", rec.number], ["Omschrijving", rec.title], ["Status", STATUS[rec.status] || "In behandeling"], ["Totaal", money(rec.total_cents) + " incl. btw"]];
    button = ["Bekijk mijn bestelling", SITE + "/bestellingen.html"];
  } else if (n.kind === "order_status") {
    const s = STATUS[rec.status] || "Bijgewerkt";
    subject = `Je bestelling ${rec.number}: ${s.toLowerCase()} | Makers 3D Labs`;
    title = "Je bestelling is bijgewerkt";
    paras = rec.status === "shipped" ? ["Je bestelling is onderweg naar je toe!"] : rec.status === "completed" ? ["Je bestelling is afgerond. Veel plezier ermee!"] : ["De status van je bestelling is gewijzigd."];
    rows = [["Bestelling", rec.number], ["Omschrijving", rec.title], ["Nieuwe status", s]];
    button = ["Bekijk mijn bestelling", SITE + "/bestellingen.html"];
  } else {
    return new Response("skip");
  }

  const { data: u } = await admin.auth.admin.getUserById(n.user_id);
  const email = u?.user?.email;
  if (!email) { await admin.from("customer_notifications").update({ error: "geen e-mailadres" }).eq("id", id); return new Response("no email"); }

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [email], reply_to: REPLY, subject, html: layout(title, paras, rows, button) }),
  });
  if (!r.ok) {
    const t = (await r.text()).slice(0, 500);
    await admin.from("customer_notifications").update({ sent_at: null, error: t }).eq("id", id);
    return new Response("mail failed", { status: 502 });
  }
  await admin.from("customer_notifications").update({ error: null }).eq("id", id);
  return new Response("sent");
});
