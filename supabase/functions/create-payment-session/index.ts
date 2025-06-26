
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const { amount, currency, paymentType, bookingId, description } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create payment session based on payment type
    let sessionConfig: any = {
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { 
              name: description || "Booking Payment",
              description: bookingId ? `Booking ID: ${bookingId}` : undefined
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        userId: user.id,
        bookingId: bookingId || "",
        paymentType: paymentType || "card"
      }
    };

    // Configure payment methods based on type
    if (paymentType === "paypal") {
      sessionConfig.payment_method_types = ["paypal"];
    } else if (paymentType === "wechat") {
      sessionConfig.payment_method_types = ["wechat_pay"];
    } else if (paymentType === "alipay") {
      sessionConfig.payment_method_types = ["alipay"];
    } else {
      sessionConfig.payment_method_types = ["card"];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Create pending transaction record
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseService.from("wallet_transactions").insert({
      user_id: user.id,
      transaction_type: bookingId ? "booking_payment" : "deposit",
      amount: -Math.abs(amount), // Negative for outgoing payment
      currency: currency,
      status: "pending",
      stripe_session_id: session.id,
      related_booking_id: bookingId,
      description: description || "Payment via Stripe"
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment session creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
