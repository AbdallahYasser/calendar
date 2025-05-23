import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    if (!user) throw new Error('No user found');

    const { type } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Try upsert approach
    const { data, error: upsertError } = await supabaseClient
      .from('day_logs')
      .upsert(
        {
          user_id: user.id,
          date: today,
          type,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,date'
        }
      )
      .select();

    if (upsertError) throw new Error(`Failed to update day log: ${upsertError.message}`);

    return new Response(
      JSON.stringify({ 
        message: 'Day type updated successfully',
        data
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: error.message.includes('Authentication') ? 401 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});