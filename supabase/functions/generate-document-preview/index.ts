import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { filePath, bucket = 'personal-uploads' } = await req.json()

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file
    const { data, error } = await supabaseClient
      .storage
      .from(bucket)
      .download(filePath)

    if (error) {
      throw error
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert blob to base64
    const arrayBuffer = await data.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Determine file type
    const fileName = filePath.split('/').pop() || ''
    const ext = fileName.split('.').pop()?.toLowerCase()

    let preview = {
      type: 'unknown',
      data: null,
      fileName: fileName
    }

    if (ext === 'pdf') {
      // For PDF, we'll return the base64 which can be embedded in iframe
      preview = {
        type: 'pdf',
        data: `data:application/pdf;base64,${base64}`,
        fileName: fileName
      }
    } else if (ext === 'doc' || ext === 'docx') {
      // For Word documents, provide download link only
      // Note: Converting Word docs to preview requires additional libraries
      preview = {
        type: 'document',
        data: null,
        fileName: fileName,
        message: 'Word document preview requires download'
      }
    }

    return new Response(
      JSON.stringify(preview),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating preview:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
