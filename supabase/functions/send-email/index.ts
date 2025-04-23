
import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@2.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.11'
import { VerificationEmail } from './_templates/verification-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, type, token_hash, redirect_to } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const verification_url = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${redirect_to}`

    const html = await renderAsync(
      React.createElement(VerificationEmail, {
        email,
        verification_url,
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'AstroSIQS <signup@astrosiqs.com>',
      to: [email],
      subject: 'Welcome to AstroSIQS! Please verify your email',
      html,
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
