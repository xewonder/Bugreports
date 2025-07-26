// supabase/functions/send-notification-email/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

// Configure your SMTP settings here
const SMTP_CONFIG = {
  host: Deno.env.get('SMTP_HOST') || 'smtp.example.com',
  port: Number(Deno.env.get('SMTP_PORT')) || 587,
  username: Deno.env.get('SMTP_USERNAME') || 'your-email@example.com',
  password: Deno.env.get('SMTP_PASSWORD') || 'your-password',
  fromEmail: Deno.env.get('FROM_EMAIL') || 'notifications@mgg.com'
};

serve(async (req) => {
  try {
    // Handle preflight CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: 204,
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // Parse request body
    const { to, subject, html } = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.username,
      password: SMTP_CONFIG.password,
    });

    // Send email
    await client.send({
      from: SMTP_CONFIG.fromEmail,
      to: to,
      subject: subject,
      content: html,
      html: html,
    });

    // Close connection
    await client.close();

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    );
  } catch (error) {
    // Log and return error
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
    );
  }
});