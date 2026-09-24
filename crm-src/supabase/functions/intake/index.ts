/* ═══════════════════════════════════════════════════════════════════════════
   intake — the door future channels come in through
   ═══════════════════════════════════════════════════════════════════════════

   Not wired to anything yet. It exists so that a WhatsApp Business webhook, a
   mailbox parser or a voice receptionist can later create enquiries WITHOUT
   anybody rewriting the CRM: each one posts here, and this calls the same
   public.create_enquiry() the secretary's form uses — same duplicate
   matching, same enquiry record, same staff alert.

     POST /functions/v1/intake
     x-intake-secret: <INTAKE_SECRET>
     {
       "source": "whatsapp" | "email" | "phone" | "social_media" | "other",
       "external_ref": "wamid.HBgM…",     // the channel's own message/call id
       "full_name": "Tendai Moyo", "phone": "+263 77 …", "email": "…",
       "company": "…", "service": "…", "location": "…",
       "description": "short summary",
       "transcript": "optional full text — kept on the timeline"
     }

   external_ref makes a retried webhook return the SAME enquiry, not a second
   one. The response is { ref, opportunity_id, contact_reused }.

   Every enquiry created here raises the new-enquiry staff alert. Nothing here
   ever writes to the customer.
   ═══════════════════════════════════════════════════════════════════════════ */

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const SOURCES = new Set(['whatsapp', 'email', 'phone', 'social_media', 'other']);

function secretOk(req: Request) {
  const want = Deno.env.get('INTAKE_SECRET') ?? '';
  const got = req.headers.get('x-intake-secret') ?? '';
  if (want.length < 24 || want.length !== got.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

const clip = (v: unknown, n: number) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, n) : null;
};

Deno.serve(async (req) => {
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!secretOk(req)) return json({ error: 'Not authorised.' }, 403);

  const b = await req.json().catch(() => null);
  if (!b || !SOURCES.has(b.source)) return json({ error: `source must be one of ${[...SOURCES].join(', ')}` }, 400);
  if (!clip(b.external_ref, 200)) return json({ error: 'external_ref is required, so a retry cannot duplicate the enquiry.' }, 400);

  const res = await fetch(`${URL_}/rest/v1/rpc/create_enquiry`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      p_full_name: clip(b.full_name, 120) ?? 'Unknown caller', p_phone: clip(b.phone, 40),
      p_email: clip(b.email, 200), p_company: clip(b.company, 160),
      p_description: clip(b.description, 4000), p_service: clip(b.service, 120),
      p_location: clip(b.location, 160), p_source: b.source,
      p_external_ref: clip(b.external_ref, 200), p_notify: true
    })
  });
  const out = await res.json().catch(() => null);
  if (!res.ok) return json({ error: out?.message ?? 'Could not create the enquiry.' }, 422);
  const row = Array.isArray(out) ? out[0] : out;

  const transcript = clip(b.transcript, 20000);
  if (transcript && row?.opportunity_id) {
    await fetch(`${URL_}/rest/v1/activities`, {
      method: 'POST', headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ opportunity_id: row.opportunity_id, contact_id: row.contact_id,
                             kind: 'note', body: `Transcript (${b.source}):\n${transcript}` })
    }).catch(() => {});
  }
  return json({ ref: row?.ref, opportunity_id: row?.opportunity_id, contact_reused: row?.contact_reused });
});
