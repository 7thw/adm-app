import { httpRouter } from "convex/server";
import { auth } from "./auth";
import webhooks from "./webhooks";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Webhook routes
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: webhooks.clerkWebhook,
});

http.route({
  path: "/webhooks/stripe",
  method: "POST", 
  handler: webhooks.stripeWebhook,
});

export default http;
