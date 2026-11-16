// Makers 3D Labs — ontvangt alle aanvraag- en contactformulieren van de site,
// mailt ze naar info@makers3dlabs.nl en stuurt de klant een bevestiging.
const SITE = "https://www.makers3dlabs.nl";
const LOGO = SITE + "/email/logo.png";
const TO = "info@makers3dlabs.nl";
const FROM = "Makers 3D Labs <noreply@makers3dlabs.nl>";
const OK_URL = SITE + "/bedankt.html";
const FAIL_URL = SITE + "/bedankt.html?status=fout";
const MAX_FILES = 5, MAX_BYTES = 9 * 1024 * 1024;
const IMG = ["image/jpeg", "image/png", "image/webp"];
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,}$/i;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const clean = (s: string, n = 5000) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
const go = (url: string) => new Response(null, { status: 303, headers: { Location: url } });

function layout(title: string, inner: string) {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#eef2f5;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dce6e2;">
<tr><td align="center" style="background:#1f2937;padding:22px 24px;line-height:0;"><a href="${SITE}/"><img src="${LOGO}" width="300" alt="Makers 3D Labs" style="display:block;width:300px;max-width:100%;height:auto;border:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;line-height:1.4;"></a></td></tr>
<tr><td style="height:4px;background:#00b4bd;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 36px 16px 36px;font-family:Arial,Helvetica,sans-serif;color:#102027;">${inner}</td></tr>
<tr><td style="padding:18px 36px;background:#eef2f5;border-top:1px solid #dce6e2;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#64747a;">
Makers 3D Labs · 3D-printen · Resin · Lasergraveren · Ridderkerk<br><a href="${SITE}/" style="color:#64747a;">www.makers3dlabs.nl</a> · Vragen? <a href="mailto:${TO}" style="color:#64747a;">${TO}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function table(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0 18px 0;font-size:14px;">` +
    rows.map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #dce6e2;color:#64747a;vertical-align:top;width:38%;">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #dce6e2;color:#102027;white-space:pre-wrap;">${esc(v)}</td></tr>`).join("") +
    `</table>`;
}

function b64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf); let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function send(body: Record<string, unknown>) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("resend " + r.status + " " + (await r.text()).slice(0, 300));
}

Deno.serve(async (req) => {
  if (req.method === "GET") return go(SITE + "/contact.html");
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Alleen formulieren van de eigen site accepteren.
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!/^https:\/\/(www\.)?makers3dlabs\.nl(\/|$)/.test(origin) && !/^https:\/\/[a-z0-9-]+\.vercel\.app(\/|$)/.test(origin)) {
    return new Response("Forbidden", { status: 403 });
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return go(FAIL_URL); }
  if (String(form.get("_honey") || "").trim()) return go(OK_URL); // spam-val

  const rows: [string, string][] = [];
  const files: File[] = [];
  let email = "", naam = "", subject = "";
  for (const [key, value] of form.entries()) {
    if (value instanceof File) { if (value.size > 0) files.push(value); continue; }
    const v = clean(String(value));
    if (key === "_subject") { subject = clean(v, 180); continue; }
    if (key.startsWith("_") || !v) continue;
    const k = clean(key, 80);
    if (k.toLowerCase() === "email") email = v.toLowerCase();
    if (k.toLowerCase() === "naam") naam = clean(v, 120);
    rows.push([k.charAt(0).toUpperCase() + k.slice(1), v]);
    if (rows.length > 60) break;
  }
  if (!EMAIL_RE.test(email)) return go(FAIL_URL);
  if (!subject) subject = "Nieuwe aanvraag via makers3dlabs.nl";
  const page = clean(req.headers.get("referer") || "", 300);

  const attachments: { filename: string; content: string }[] = [];
  let total = 0;
  for (const f of files.slice(0, MAX_FILES)) {
    if (!IMG.includes(f.type)) continue;
    total += f.size; if (total > MAX_BYTES) break;
    const name = clean(f.name || "afbeelding", 100).replace(/[^\w.\- ]/g, "_");
    attachments.push({ filename: name, content: b64(await f.arrayBuffer()) });
  }

  const staff = layout(subject,
    `<h1 style="margin:0 0 6px 0;font-size:22px;line-height:1.3;">${esc(subject)}</h1>
<p style="margin:0 0 14px 0;font-size:14px;color:#64747a;">Via ${page ? `<a href="${esc(page)}" style="color:#007e85;">${esc(page.replace(SITE, "") || "/")}</a>` : "makers3dlabs.nl"} · ${attachments.length} bijlage(n) · Klik op <strong>Beantwoorden</strong> om de klant direct te mailen.</p>
${table(rows)}`);

  const hi = naam ? `Hoi ${esc(naam.split(" ")[0])},` : "Hoi,";
  const customer = layout("We hebben je aanvraag ontvangen",
    `<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;">We hebben je aanvraag ontvangen!</h1>
<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;">${hi}</p>
<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;">Bedankt voor je aanvraag bij Makers 3D Labs. <strong>We reageren binnen 24 uur.</strong> We bekijken je wensen en laten je weten wat er mogelijk is, met een voorstel voor uitvoering, prijs en levertijd.</p>
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.6;font-weight:bold;">Dit heb je ingevuld:</p>
${table(rows)}
${attachments.length ? `<p style="margin:0 0 14px 0;font-size:14px;color:#64747a;">Je hebt ${attachments.length} afbeelding(en) meegestuurd.</p>` : ""}
<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;">Wil je nog iets aanvullen? Beantwoord dan gewoon deze e-mail.</p>
<p style="margin:18px 0 0 0;font-size:16px;line-height:1.6;">Hartelijke groet,<br><strong>Team Makers 3D Labs</strong></p>`);

  try {
    await send({ from: FROM, to: [TO], reply_to: email, subject, html: staff, attachments });
  } catch (e) {
    console.error(e); return go(FAIL_URL);
  }
  try {
    await send({ from: FROM, to: [email], reply_to: TO, subject: "We hebben je aanvraag ontvangen | Makers 3D Labs", html: customer });
  } catch (e) { console.error(e); }
  return go(OK_URL);
});
