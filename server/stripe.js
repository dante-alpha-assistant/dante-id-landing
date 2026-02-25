const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PLANS = {
  free: {
    name: "Free",
    price: 0,
    projectLimit: 1,
    priceId: null,
  },
  pro: {
    name: "Pro",
    price: 2900, // cents
    projectLimit: Infinity,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  team: {
    name: "Team",
    price: 7900,
    projectLimit: Infinity,
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
  },
};

async function getOrCreateCustomer(supabase, userId, email) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (sub?.stripe_customer_id) return sub.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  // Upsert subscription record with customer ID
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      plan: "free",
      status: "active",
    },
    { onConflict: "user_id" }
  );

  return customer.id;
}

async function createCheckoutSession(supabase, userId, email, plan) {
  if (!PLANS[plan] || plan === "free") {
    throw new Error("Invalid plan");
  }

  const customerId = await getOrCreateCustomer(supabase, userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL || "https://dante.id"}/dashboard?checkout=success`,
    cancel_url: `${process.env.APP_URL || "https://dante.id"}/dashboard?checkout=canceled`,
    metadata: { userId, plan },
  });

  return session;
}

async function createPortalSession(supabase, userId) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!sub?.stripe_customer_id) throw new Error("No subscription found");

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.APP_URL || "https://dante.id"}/dashboard`,
  });

  return session;
}

async function handleWebhookEvent(supabase, event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = session.subscription;
      const customerId = session.customer;
      const plan = session.metadata?.plan || "pro";

      const sub = await stripe.subscriptions.retrieve(subscriptionId);

      await supabase
        .from("subscriptions")
        .update({
          stripe_subscription_id: subscriptionId,
          plan,
          status: "active",
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      await supabase
        .from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", plan: "free" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", invoice.customer);
      break;
    }
  }
}

module.exports = { stripe, PLANS, createCheckoutSession, createPortalSession, handleWebhookEvent, getOrCreateCustomer };
