// Makers 3D Labs — anonieme bezoekersteller.
// Slaat per paginaweergave alleen pad, bron (facebook/instagram/google/direct/overig), campagne en apparaattype op.
// Geen cookies, geen IP-adres, geen persoonsgegevens.
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGINS = ["https://www.makers3dlabs.nl", "https://makers3dlabs.nl"];
const SOURCES = ["facebook", "instagram", "google", "bing", "direct", "overig", "email", "tiktok", "pinterest"];
const DEVICES = ["mobiel", "tablet", "desktop"];
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[^\p{L}\p{N}\-_.\/ %]/gu, "").trim().slice(0, n);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const h = { "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (req.method !== "POST" || !ORIGINS.includes(origin)) return new Response(null, { status: 204, headers: h });
  const ua = req.headers.get("user-agent") || "";
  if (/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i.test(ua)) return new Response(null, { status: 204, headers: h });
  let b: any = {};
  try { b = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204, headers: h }); }
  const path = clean(b.p, 200) || "/";
  const source = SOURCES.includes(b.s) ? b.s : "overig";
  const device = DEVICES.includes(b.d) ? b.d : null;
  await admin.from("site_visits").insert({ path, source, campaign: clean(b.c, 80) || null, device, new_session: b.n === true });
  return new Response(null, { status: 204, headers: h });
});
