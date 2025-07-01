import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";

const clerkWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SIGNING_SECRET is not set");
    return new Response("Internal Server Error", { status: 500 });
  }

  const webhook = new Webhook(secret);
  const payload = await request.text();
  const headers = request.headers;

  let event: WebhookEvent;
  try {
    event = webhook.verify(payload, {
      "svix-id": headers.get("svix-id")!,
      "svix-timestamp": headers.get("svix-timestamp")!,
      "svix-signature": headers.get("svix-signature")!,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  console.log(`Received Clerk webhook: ${event.type}`);

  switch (event.type) {
    case "user.created":
    case "user.updated":
      if (event.data?.email_addresses?.[0]?.email_address) {
        await ctx.runMutation(internal.clerkSync.syncUserFromClerk, {
          clerkUserId: event.data.id,
          email: event.data.email_addresses[0].email_address,
          firstName: event.data.first_name ?? undefined,
          lastName: event.data.last_name ?? undefined,
          imageUrl: event.data.image_url ?? undefined,
        });
        console.log(`Synced user: ${event.data.id}`);
      }
      break;

    case "user.deleted":
      // The `event.data` for `user.deleted` is a DeletedObjectJSON, which has an `id`
      if (event.data?.id) {
        await ctx.runMutation(internal.clerkSync.handleUserDeletion, {
          clerkUserId: event.data.id,
        });
        console.log(`Deleted user: ${event.data.id}`);
      } else {
        console.warn("Received user.deleted webhook without a user ID.");
      }
      break;

    default:
      console.log(`Unhandled Clerk webhook event: ${event.type}`);
  }

  return new Response("OK", { status: 200 });
});

const stripeWebhook = httpAction(async (ctx, request) => {
  const payload = await request.text();

  try {
    const event = JSON.parse(payload);
    console.log(`Received Stripe webhook: ${event.type}`);
    // TODO: Implement Stripe webhook processing
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

export default {
  clerkWebhook,
  stripeWebhook,
};
