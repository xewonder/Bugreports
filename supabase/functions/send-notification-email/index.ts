// supabase/functions/send-notification-email/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

// Basic CORS headers
const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// SMTP config from env (fallbacks for local dev)
const SMTP_CONFIG = {
  host: Deno.env.get('SMTP_HOST') ?? '',
  port: Number(Deno.env.get('SMTP_PORT') ?? '587'),
  username: Deno.env.get('SMTP_USERNAME') ?? '',
  password: Deno.env.get('SMTP_PASSWORD') ?? '',
  fromEmail: Deno.env.get('FROM_EMAIL') ?? 'no-reply@example.com',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { to, subject, html, text } = await req.json()

    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, (html or text)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // If SMTP not configured, short‑circuit with success in dev to avoid blocking
    if (!SMTP_CONFIG.host || !SMTP_CONFIG.username || !SMTP_CONFIG.password) {
      console.warn('SMTP not fully configured — returning 202 accepted (dev mode)')
      return new Response(JSON.stringify({ ok: true, dev: true }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send email
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.username,
      password: SMTP_CONFIG.password
    })

    await client.send({
      from: SMTP_CONFIG.fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      content: text ?? '',
      html
    })

    await client.close()

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('send-notification-email error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
