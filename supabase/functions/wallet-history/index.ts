import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const transaction_type = url.searchParams.get('type');
    
    // Validate limit (max 100)
    if (limit > 100) {
      throw new Error("Limit cannot exceed 100");
    }
    
    // Validate offset
    if (offset < 0) {
      throw new Error("Offset cannot be negative");
    }

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Build query for transaction history
    let query = supabaseClient
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by transaction type if specified
    if (transaction_type) {
      const allowedTypes = ['topup', 'withdrawal', 'payment', 'booking_payment', 'refund'];
      if (!allowedTypes.includes(transaction_type)) {
        throw new Error("Invalid transaction type");
      }
      query = query.eq('transaction_type', transaction_type);
    }

    const { data: transactions, error: transactionError } = await query;

    if (transactionError) {
      console.error("Error fetching transactions:", transactionError);
      throw transactionError;
    }

    // Get current wallet balance
    const { data: walletData, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('balance, currency')
      .eq('user_id', user.id);

    if (walletError) {
      console.error("Error fetching wallet balance:", walletError);
      throw walletError;
    }

    return new Response(
      JSON.stringify({
        transactions: transactions || [],
        wallets: walletData || [],
        pagination: {
          limit,
          offset,
          count: transactions?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error fetching wallet history:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});