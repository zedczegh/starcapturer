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
    const url = new URL(req.url)
    const filePath = url.searchParams.get('path')
    const bucket = url.searchParams.get('bucket') || 'personal-uploads'
    const download = url.searchParams.get('download') === 'true'

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

    // Download the file from storage
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

    // Get file name from path
    const fileName = filePath.split('/').pop() || 'download'
    
    // Determine content type based on file extension
    const ext = fileName.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
    }
    
    if (ext && mimeTypes[ext]) {
      contentType = mimeTypes[ext]
    }

    // Set appropriate headers
    const headers = new Headers({
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Disposition': download 
        ? `attachment; filename="${fileName}"`
        : `inline; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=3600',
    })

    return new Response(data, { headers })

  } catch (error) {
    console.error('Error serving file:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
