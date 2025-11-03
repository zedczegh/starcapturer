import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const withdrawalRequestSchema = z.object({
  amount: z.number().min(5).max(5000),
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  bank_account: z.string().min(4).max(100),
});

// Sanitize string to prevent XSS
function sanitizeString(input: string): string {
  return input.replace(/[<>\"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and parse input with zod
    const validatedData = withdrawalRequestSchema.parse(body);
    const { amount, currency, bank_account } = validatedData;
    
    // Sanitize bank account string
    const sanitizedBankAccount = sanitizeString(bank_account);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Processing wallet withdrawal for user:", user.id, "Amount:", amount);

    // Rate limiting: Check recent withdrawals (max 3 withdrawals per day)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentWithdrawals, error: recentError } = await supabaseClient
      .from('wallet_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'withdrawal')
      .gte('created_at', oneDayAgo);

    if (recentError) {
      console.error("Error checking rate limit:", recentError);
    } else if (recentWithdrawals && recentWithdrawals.length >= 3) {
      throw new Error("Rate limit exceeded. Maximum 3 withdrawals per day allowed.");
    }

    // Check wallet balance
    const { data: walletData, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', currency.toUpperCase())
      .single();

    if (walletError) {
      console.error("Error fetching wallet:", walletError);
      throw new Error("Wallet not found");
    }

    if (!walletData || parseFloat(walletData.balance) < amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length === 0) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    } else {
      customerId = customers.data[0].id;
    }

    // Create Stripe transfer/payout (simplified - in production you'd need proper bank verification)
    // For now, we'll just create a pending withdrawal record
    const { error: withdrawalError } = await supabaseClient.rpc('update_wallet_balance', {
      p_user_id: user.id,
      p_amount: -amount, // Negative for withdrawal
      p_transaction_type: 'withdrawal',
      p_currency: currency.toUpperCase(),
      p_description: `Withdrawal to bank account ending in ${sanitizedBankAccount.slice(-4)}`,
      p_stripe_payment_intent_id: null
    });

    if (withdrawalError) {
      console.error("Error processing withdrawal:", withdrawalError);
      throw withdrawalError;
    }

    console.log("Withdrawal processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Withdrawal request processed. Funds will be transferred within 2-3 business days.",
        amount: amount,
        currency: currency.toUpperCase()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing withdrawal:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Validation error", 
          details: error.errors 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});