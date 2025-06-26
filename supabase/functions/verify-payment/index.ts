
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (session.payment_status === "paid") {
      // Update transaction status
      const { data: transaction } = await supabaseService
        .from("wallet_transactions")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (transaction && transaction.status === "pending") {
        // Update transaction to completed
        await supabaseService
          .from("wallet_transactions")
          .update({ 
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string
          })
          .eq("id", transaction.id);

        // If it's a wallet deposit, update wallet balance
        if (transaction.transaction_type === "deposit") {
          await supabaseService.rpc("update_wallet_balance", {
            p_user_id: transaction.user_id,
            p_amount: transaction.amount,
            p_transaction_type: "deposit",
            p_currency: transaction.currency,
            p_description: transaction.description,
            p_stripe_payment_intent_id: session.payment_intent as string
          });
        }

        // If it's a booking payment, process the booking
        if (transaction.transaction_type === "booking_payment" && transaction.related_booking_id) {
          // Update booking status or create reservation
          console.log("Processing booking payment for:", transaction.related_booking_id);
        }
      }
    }

    return new Response(JSON.stringify({ 
      status: session.payment_status,
      session: session
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
