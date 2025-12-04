import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header to verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the caller is the authorized user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !caller) {
      console.error('Invalid authorization:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only allow specific user to create accounts
    if (caller.email !== 'yanzeyucq@163.com') {
      console.error('Unauthorized user:', caller.email)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only the owner can create accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, username } = await req.json()
    console.log('Creating user with email:', email, 'password length:', password?.length)

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists and delete them
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingUser) {
      console.log('User already exists, deleting:', email)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete existing user: ' + deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('Existing user deleted successfully')
    }

    // Use the database function to create user with proper auth setup
    console.log('Creating user via database function...')
    const { data: userId, error: createError } = await supabaseAdmin.rpc('admin_create_user', {
      p_email: email,
      p_password: password,
      p_username: username || null
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User created successfully with ID:', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: userId, 
          email: email
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
