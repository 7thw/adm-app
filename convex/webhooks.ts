import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

// Export using Convex's expected pattern with a single default export object
export default {
  // Clerk webhook handler
  clerkWebhook: httpAction(async (ctx, request) => {
    // Get the Clerk webhook signature header
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    
    // If any of the required headers are missing, reject the request
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing Svix headers");
      return new Response("Missing headers", { status: 400 });
    }

    const payload = await request.text();
    
    // TODO: Add signature verification using crypto
    // For production, uncomment this when using node-crypto package
    // const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    // if (!CLERK_WEBHOOK_SECRET) {
    //   console.error("Clerk webhook secret not configured");
    //   return new Response("Configuration error", { status: 500 });
    // }
    // const payloadBytes = new TextEncoder().encode(payload);
    // ... verify signature using crypto library

    try {
      const event = JSON.parse(payload);
      console.log(`Received Clerk webhook: ${event.type}`);

      // Process different event types
      switch (event.type) {
        case "user.created":
        case "user.updated":
          if (event.data?.email_addresses?.[0]?.email_address) {
            await ctx.runMutation(internal.internal.auth.syncUserFromClerk, {
              clerkUserId: event.data.id,
              email: event.data.email_addresses[0].email_address,
              firstName: event.data.first_name,
              lastName: event.data.last_name,
              imageUrl: event.data.image_url,
            });
            console.log(`Synced user: ${event.data.id}`);
          }
          break;

        case "user.deleted":
          await ctx.runMutation(internal.internal.webhooks.handleUserDeletion, {
            clerkUserId: event.data.id,
          });
          console.log(`Deleted user: ${event.data.id}`);
          break;

        default:
          console.log(`Unhandled Clerk webhook event: ${event.type}`);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Clerk webhook error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),

  // Stripe webhook handler
  stripeWebhook: httpAction(async (ctx, request) => {
    const payload = await request.text();

    try {
      const event = JSON.parse(payload);
      console.log(`Received Stripe webhook: ${event.type}`);

      // TODO: Implement Stripe webhook processing
      // For now, just acknowledge receipt

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  })
}
