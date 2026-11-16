// Makers 3D Labs — laat een beheerder een klant uitnodigen voor de klantomgeving.
// De klant krijgt de (Nederlandse, huisstijl) uitnodigingsmail van Supabase Auth.
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGINS = ["https://www.makers3dlabs.nl", "https://makers3dlabs.nl"];
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,}$/i;

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: who } = await admin.auth.getUser(token);
  if (!who?.user) return json({ error: "Log opnieuw in." }, 401);
  const { data: isAdmin } = await admin.from("makers_admins").select("user_id").eq("user_id", who.user.id).maybeSingle();
  if (!isAdmin) return json({ error: "Geen toegang." }, 403);

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim().slice(0, 120);
  if (!EMAIL_RE.test(email)) return json({ error: "Vul een geldig e-mailadres in." }, 400);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: "https://www.makers3dlabs.nl/account.html",
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return json({ error: "Deze klant heeft al een account. Je kunt hem meteen kiezen in de klantenlijst." }, 409);
    }
    console.error(error);
    return json({ error: "Uitnodigen is niet gelukt. Probeer het later opnieuw." }, 500);
  }
  if (name && data.user) {
    await admin.from("customer_profiles").upsert({ user_id: data.user.id, full_name: name }, { onConflict: "user_id" });
  }
  return json({ ok: true, user_id: data.user?.id, email });
});
