import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Function accessible to subscribers to get their own user data
export const getSubscriberUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("subscriberUsers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
  },
});

// Function to create or update a subscriber user
export const storeSubscriberUser = mutation({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeSubscriberUser without authentication present");
    }

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("subscriberUsers")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id;
    }

    // If it's a new identity, create a new subscriber user
    return await ctx.db.insert("subscriberUsers", {
      clerkId: identity.subject ?? identity.tokenIdentifier.split("|")[1],
      name: identity.name ?? "Subscriber",
      tokenIdentifier: identity.tokenIdentifier,
      role: "subscriber",
      subscriptionStatus: "inactive", // Default subscription status
      email: args.email ?? identity.email ?? "", // Ensure email is never undefined
      lastLogin: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
