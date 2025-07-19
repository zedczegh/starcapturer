import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Create Supabase client with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // If payment was successful, update wallet and create booking
    if (session.payment_status === "paid" && session.metadata?.timeslot_id) {
      const timeslotId = session.metadata.timeslot_id;
      const userId = session.metadata.user_id;

      // Create the reservation
      const { data: reservation, error: reservationError } = await supabaseService
        .rpc('insert_astro_spot_reservation', {
          p_timeslot_id: timeslotId,
          p_user_id: userId,
          p_status: 'confirmed'
        });

      if (reservationError) {
        console.error("Reservation creation error:", reservationError);
        throw new Error("Failed to create reservation");
      }

      // Record the payment in wallet transactions
      const amount = session.amount_total ? session.amount_total / 100 : 0;
      
      await supabaseService.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: -amount, // Negative because it's a payment
        p_transaction_type: 'booking_payment',
        p_currency: session.currency?.toUpperCase() || 'USD',
        p_description: `Payment for astro spot booking`,
        p_related_booking_id: reservation,
        p_stripe_payment_intent_id: session.payment_intent
      });

      console.log(`Payment verified and booking created for session ${sessionId}`);
    }

    return new Response(JSON.stringify({ 
      paymentStatus: session.payment_status,
      sessionId: sessionId
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