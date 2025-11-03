import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const topupRequestSchema = z.object({
  amount: z.number().min(1).max(10000),
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  payment_method_id: z.string().regex(/^pm_[a-zA-Z0-9]+$/, "Invalid Stripe payment method ID"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and parse input with zod
    const validatedData = topupRequestSchema.parse(body);
    const { amount, currency, payment_method_id } = validatedData;
    
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

    console.log("Processing wallet top-up for user:", user.id, "Amount:", amount);

    // Rate limiting: Check recent transactions (max 5 transactions per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentTransactions, error: recentError } = await supabaseClient
      .from('wallet_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'topup')
      .gte('created_at', oneHourAgo);

    if (recentError) {
      console.error("Error checking rate limit:", recentError);
    } else if (recentTransactions && recentTransactions.length >= 5) {
      throw new Error("Rate limit exceeded. Maximum 5 top-ups per hour allowed.");
    }

    // Get customer ID from Stripe
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      throw new Error("Customer not found");
    }

    const customerId = customers.data[0].id;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${req.headers.get("origin")}/profile`,
      metadata: {
        type: 'wallet_topup',
        user_id: user.id
      }
    });

    console.log("Payment intent created:", paymentIntent.id);

    if (paymentIntent.status === 'succeeded') {
      // Update wallet balance
      const { error: walletError } = await supabaseClient.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_transaction_type: 'topup',
        p_currency: currency.toUpperCase(),
        p_description: 'Wallet top-up via Stripe',
        p_stripe_payment_intent_id: paymentIntent.id
      });

      if (walletError) {
        console.error("Error updating wallet:", walletError);
        throw walletError;
      }

      console.log("Wallet updated successfully");
    }

    return new Response(
      JSON.stringify({
        payment_intent: paymentIntent,
        requires_action: paymentIntent.status === 'requires_action',
        client_secret: paymentIntent.client_secret
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing wallet top-up:", error);
    
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